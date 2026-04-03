import type { PluginConfig } from '@/types/config'

export type AiProviderPresetKey = 'siliconflow' | 'openai' | 'gemini' | 'custom'

interface AiProviderPresetDefinition {
  label: string
  baseUrl?: string
  defaultModel?: string
  defaultEmbeddingModel?: string
  modelPlaceholder: string
  embeddingPlaceholder: string
}

export const AI_PROVIDER_PRESETS: Record<AiProviderPresetKey, AiProviderPresetDefinition> = {
  siliconflow: {
    label: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: '',
    defaultEmbeddingModel: '',
    modelPlaceholder: '从模型列表选择，例如 deepseek-ai/DeepSeek-V3',
    embeddingPlaceholder: '从模型列表选择，例如 BAAI/bge-m3',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5',
    defaultEmbeddingModel: 'text-embedding-3-small',
    modelPlaceholder: 'gpt-5',
    embeddingPlaceholder: 'text-embedding-3-small',
  },
  gemini: {
    label: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    defaultEmbeddingModel: 'gemini-embedding-001',
    modelPlaceholder: 'gemini-2.5-flash',
    embeddingPlaceholder: 'gemini-embedding-001',
  },
  custom: {
    label: '自定义',
    modelPlaceholder: '手动填写模型名',
    embeddingPlaceholder: '手动填写 embedding 模型名',
  },
}

export const AI_PROVIDER_PRESET_OPTIONS = ([
  'siliconflow',
  'openai',
  'gemini',
  'custom',
] as const).map(value => ({
  value,
  label: AI_PROVIDER_PRESETS[value].label,
}))

export function detectAiProviderPreset(baseUrl?: string): AiProviderPresetKey {
  const normalized = normalizeUrl(baseUrl)
  if (!normalized) {
    return 'custom'
  }

  if (/^https:\/\/api\.siliconflow\.cn(?:\/v1)?$/i.test(normalized)) {
    return 'siliconflow'
  }
  if (normalized === 'https://api.openai.com/v1') {
    return 'openai'
  }
  if (normalized === 'https://generativelanguage.googleapis.com/v1beta/openai') {
    return 'gemini'
  }
  return 'custom'
}

export function applyAiProviderPreset(config: PluginConfig, provider: AiProviderPresetKey) {
  const preset = AI_PROVIDER_PRESETS[provider]
  if (!preset.baseUrl) {
    return
  }

  config.aiBaseUrl = preset.baseUrl
  config.aiModel = preset.defaultModel ?? ''
  config.aiEmbeddingModel = preset.defaultEmbeddingModel ?? ''
}

export function buildAiModelOptionItems(modelIds: string[], currentValue?: string) {
  const values = new Set(modelIds.map(item => item.trim()).filter(Boolean))
  const current = currentValue?.trim()
  if (current) {
    values.add(current)
  }

  return [...values]
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map(value => ({
      value,
      label: value,
      key: value,
    }))
}

function normalizeUrl(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '')
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}
