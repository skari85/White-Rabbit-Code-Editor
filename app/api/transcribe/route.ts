import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new NextResponse('Missing OPENAI_API_KEY', { status: 500 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new NextResponse('Expected multipart/form-data', { status: 400 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return new NextResponse('No file', { status: 400 })

    // Forward to OpenAI Whisper
    const openaiForm = new FormData()
    openaiForm.append('file', file, file.name)
    openaiForm.append('model', 'whisper-1')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm as unknown as BodyInit,
    })
    if (!res.ok) {
      const txt = await res.text()
      return new NextResponse(txt || 'Transcription error', { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({ text: data.text || '' })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Server error', { status: 500 })
  }
}


