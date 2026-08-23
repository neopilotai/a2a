import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEFAULT_MODELS = {
  reasoning: process.env.A2A_REASONING_MODEL || 'gemini-3.7-flash',
  image: process.env.A2A_IMAGE_MODEL || 'gemini-3.1-flash-image',
  infographic: process.env.A2A_INFOGRAPHIC_MODEL || 'gemini-3.7-flash',
} as const
const ALLOWED_MODELS = new Set([
  ...Object.values(DEFAULT_MODELS),
  'gemini-3.1-pro-preview',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
])
const INFERENCE_PATHS = new Set(Object.keys(DEFAULT_MODELS))
const MAX_BODY_BYTES = 1_000_000

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.API_KEY || process.env.GEMINI_API_KEY),
    models: DEFAULT_MODELS,
  })
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    }

    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    const path = typeof body.path === 'string' ? body.path : 'reasoning'
    const requestedModel = typeof body.model === 'string' ? body.model : undefined
    const model = requestedModel || (INFERENCE_PATHS.has(path) ? DEFAULT_MODELS[path as keyof typeof DEFAULT_MODELS] : '')
    const contents = body.contents ?? body.prompt
    const hasValidContents = typeof contents === 'string' || Array.isArray(contents)
    const config = body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config : undefined

    if (!INFERENCE_PATHS.has(path) || !ALLOWED_MODELS.has(model) || !hasValidContents) {
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
      config,
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
