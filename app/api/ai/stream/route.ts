/**
 * Fast AI Streaming API
 * Optimized for real-time code generation with minimal latency
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface StreamRequest {
  prompt: string;
  language: string;
  context?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequest = await request.json();
    const { prompt, language, context, maxTokens = 1000, temperature = 0.7 } = body;

    if (!prompt) {
      return new NextResponse('Prompt is required', { status: 400 });
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

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Stream API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
