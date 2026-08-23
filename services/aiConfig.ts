export const AI_MODEL_DEFAULTS = {
  reasoning: 'gemini-3.7-flash',
  image: 'gemini-3.1-flash-image',
  infographic: 'gemini-3.7-flash',
} as const

export type AiInferencePath = keyof typeof AI_MODEL_DEFAULTS

export const AI_MODEL_ENV_KEYS: Record<AiInferencePath, string> = {
  reasoning: 'A2A_REASONING_MODEL',
  image: 'A2A_IMAGE_MODEL',
  infographic: 'A2A_INFOGRAPHIC_MODEL',
}

export function getModelForPath(path: AiInferencePath): string {
  return AI_MODEL_DEFAULTS[path]
}

export function getInferenceLabel(path: AiInferencePath): string {
  return {
    reasoning: 'Reasoning & code analysis',
    image: 'Image generation',
    infographic: 'SVG infographic synthesis',
  }[path]
}

export const FREE_MODEL_GUIDANCE = {
  title: 'Free-model ready',
  description: 'Use the free quota available from your configured provider. Limits, latency, and image support vary by account and region.',
  paths: ['reasoning', 'image', 'infographic'] as AiInferencePath[],
}
