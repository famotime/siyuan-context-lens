import { describe, expect, it } from 'vitest'

import {
  AI_PROVIDER_PRESET_OPTIONS,
  applyAiProviderPreset,
  buildAiModelOptionItems,
  detectAiProviderPreset,
} from './ai-provider-presets'

describe('ai provider presets', () => {
  it('detects known provider presets from base urls', () => {
    expect(detectAiProviderPreset('https://api.siliconflow.cn')).toBe('siliconflow')
    expect(detectAiProviderPreset('https://api.openai.com/v1')).toBe('openai')
    expect(detectAiProviderPreset('https://generativelanguage.googleapis.com/v1beta/openai/')).toBe('gemini')
    expect(detectAiProviderPreset('https://api.example.com/v1')).toBe('custom')
  })

  it('applies provider preset base urls and default models', () => {
    const openAiConfig = {
      aiBaseUrl: '',
      aiModel: '',
      aiEmbeddingModel: '',
    } as any
    applyAiProviderPreset(openAiConfig, 'openai')
    expect(openAiConfig).toEqual(expect.objectContaining({
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-5',
      aiEmbeddingModel: 'text-embedding-3-small',
    }))

    const geminiConfig = {
      aiBaseUrl: '',
      aiModel: '',
      aiEmbeddingModel: '',
    } as any
    applyAiProviderPreset(geminiConfig, 'gemini')
    expect(geminiConfig).toEqual(expect.objectContaining({
      aiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      aiModel: 'gemini-2.5-flash',
      aiEmbeddingModel: 'gemini-embedding-001',
    }))

    const siliconFlowConfig = {
      aiBaseUrl: '',
      aiModel: 'old-model',
      aiEmbeddingModel: 'old-embedding',
    } as any
    applyAiProviderPreset(siliconFlowConfig, 'siliconflow')
    expect(siliconFlowConfig).toEqual(expect.objectContaining({
      aiBaseUrl: 'https://api.siliconflow.cn/v1',
      aiModel: '',
      aiEmbeddingModel: '',
    }))
  })

  it('builds unique sorted model option items and preserves the current value', () => {
    expect(buildAiModelOptionItems(['z-model', 'a-model', 'a-model'], 'custom-model')).toEqual([
      { value: 'a-model', label: 'a-model', key: 'a-model' },
      { value: 'custom-model', label: 'custom-model', key: 'custom-model' },
      { value: 'z-model', label: 'z-model', key: 'z-model' },
    ])
  })

  it('exposes preset options for siliconflow, openai, gemini and custom mode', () => {
    expect(AI_PROVIDER_PRESET_OPTIONS).toEqual([
      { value: 'siliconflow', label: '硅基流动' },
      { value: 'openai', label: 'OpenAI' },
      { value: 'gemini', label: 'Gemini' },
      { value: 'custom', label: '自定义' },
    ])
  })
})
