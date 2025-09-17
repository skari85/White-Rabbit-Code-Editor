/**
 * Fast AI Streaming API
 * Optimized for real-time code generation with minimal latency
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SECURITY_CONFIG, globalRateLimiter } from '@/lib/security-config';

export const runtime = 'edge';

interface StreamRequest {
  prompt: string;
  language: string;
  context?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

const bodySchema = z.object({
  prompt: z.string().min(1).max(8000),
  language: z.string().min(1).max(50),
  context: z.string().max(8000).optional(),
  stream: z.boolean().optional(),
  maxTokens: z.number().int().min(1).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

function buildCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = origin && origin === request.nextUrl.origin ? origin : '';
  const headers: Record<string, string> = {
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  const headers = buildCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  try {
    // Same-origin check for CORS
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { prompt, language, context, maxTokens = 1000, temperature = 0.7 } = parsed.data;

    // Basic rate limiting by client IP
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
    const allowed = globalRateLimiter.check(`ai-stream:${ip}`, SECURITY_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_MINUTE, 60_000);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } });
    }

    // Determine which AI provider to use (prioritize speed)
    const groqApiKey = process.env.GROQ_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let provider = 'groq';
    let apiKey = groqApiKey;
    let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    let model = 'llama-3.1-8b-instant'; // Fast model for live coding

    // Fallback to OpenAI if Groq not available
    if (!groqApiKey && openaiApiKey) {
      provider = 'openai';
      apiKey = openaiApiKey;
      endpoint = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-3.5-turbo'; // Fast model
    }

    if (!apiKey) {
      return new NextResponse('No AI API key configured', { status: 500 });
    }

    // Enhanced prompt for code generation
    const systemPrompt = `You are a fast, expert ${language} developer. Generate clean, production-ready code based on the user's request.

Requirements:
- Generate ONLY the code, no explanations or markdown
- Follow ${language} best practices
- Include proper error handling
- Add helpful comments
- Make it efficient and fast
- Respond quickly and concisely

Current context: ${context || 'No context provided'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    // Make streaming request
    const abortController = new AbortController();
    // If client disconnects, abort upstream
    request.signal.addEventListener('abort', () => abortController.abort());

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        // Optimize for speed
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // Send content as Server-Sent Events
                    const sseData = JSON.stringify({
                      content,
                      provider,
                      model,
                      timestamp: Date.now()
                    });
                    
                    controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    const cors = buildCorsHeaders(request);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        ...cors,
      },
    });

  } catch (error) {
    console.error('Stream API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
