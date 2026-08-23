import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    const model = typeof body?.model === 'string' ? body.model : 'gemini-3.7-flash'

    if (!prompt) {
      return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 503 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    })

    return NextResponse.json({ text: response.text || '' })
  } catch (error) {
    console.error('[v0] Gemini route failed:', error)
    return NextResponse.json({ error: 'Gemini request failed.' }, { status: 500 })
  }
}
