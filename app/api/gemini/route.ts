import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ALLOWED_MODELS = new Set(['gemini-3.7-flash', 'gemini-3.1-flash-image'])
const MAX_BODY_BYTES = 1_000_000

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    }

    const body = await request.json()
    const model = typeof body?.model === 'string' ? body.model : 'gemini-3.7-flash'
    const contents = body?.contents ?? body?.prompt

    if (!ALLOWED_MODELS.has(model) || contents === undefined) {
      return NextResponse.json({ error: 'Invalid Gemini request.' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 503 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model,
      contents,
      config: body?.config,
    })

    return NextResponse.json({
      text: response.text || '',
      candidates: response.candidates || [],
    })
  } catch (error) {
    console.error('[v0] Gemini route failed:', error)
    return NextResponse.json({ error: 'Gemini request failed.' }, { status: 500 })
  }
}
