import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Check which API keys are available and prioritize Groq
    const groqApiKey = process.env.GROQ_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!groqApiKey && !openaiApiKey) {
      return new NextResponse('Missing API keys. Please configure either GROQ_API_KEY or OPENAI_API_KEY', { status: 500 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new NextResponse('Expected multipart/form-data', { status: 400 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return new NextResponse('No file', { status: 400 })

    // Use Groq if available, otherwise fallback to OpenAI
    if (groqApiKey) {
      return await transcribeWithGroq(file, groqApiKey)
    } else {
      return await transcribeWithOpenAI(file, openaiApiKey!)
    }
  } catch (e: any) {
    return new NextResponse(e?.message || 'Server error', { status: 500 })
  }
}

async function transcribeWithGroq(file: File, apiKey: string): Promise<NextResponse> {
  try {
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('model', 'whisper-large-v3')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form as unknown as BodyInit,
    })

    if (!res.ok) {
      const txt = await res.text()
      return new NextResponse(`Groq transcription error: ${txt}`, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ 
      text: data.text || '',
      provider: 'groq',
      model: 'whisper-large-v3'
    })
  } catch (e: any) {
    return new NextResponse(`Groq error: ${e?.message}`, { status: 500 })
  }
}

async function transcribeWithOpenAI(file: File, apiKey: string): Promise<NextResponse> {
  try {
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('model', 'whisper-1')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form as unknown as BodyInit,
    })

    if (!res.ok) {
      const txt = await res.text()
      return new NextResponse(`OpenAI transcription error: ${txt}`, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ 
      text: data.text || '',
      provider: 'openai',
      model: 'whisper-1'
    })
  } catch (e: any) {
    return new NextResponse(`OpenAI error: ${e?.message}`, { status: 500 })
  }
}


