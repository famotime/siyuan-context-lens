export type AiProviderPresetKey = 'siliconflow' | 'openai' | 'gemini' | 'custom'

export interface AiProviderConfigSnapshot {
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  aiEmbeddingModel: string
}

export type AiProviderConfigMap = Partial<Record<AiProviderPresetKey, Partial<AiProviderConfigSnapshot>>>
