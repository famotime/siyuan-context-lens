import type { AiContextCapacity } from '@/analytics/ai-inbox'
import type { AiProviderConfigMap, AiProviderPresetKey } from '@/types/ai-provider'
import { DEFAULT_CONFIG, ensureConfigDefaults, type PluginConfig } from '@/types/config'

export const AI_SETTINGS_TRANSFER_KIND = 'network-lens-ai-settings'
export const AI_SETTINGS_TRANSFER_SCHEMA_VERSION = 1
export const AI_SETTINGS_TRANSFER_FILE_NAME = 'network-lens-ai-settings.json'

export interface AiSettingsTransferSnapshot {
  aiEnabled: boolean
  aiProviderPreset: AiProviderPresetKey
  aiProviderConfigs: AiProviderConfigMap
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  aiEmbeddingModel: string
  aiRequestTimeoutSeconds: number
  aiMaxTokens: number
  aiTemperature: number
  aiMaxContextMessages: number
  aiContextCapacity: AiContextCapacity
}

interface AiSettingsTransferPayload {
  kind: typeof AI_SETTINGS_TRANSFER_KIND
  schemaVersion: typeof AI_SETTINGS_TRANSFER_SCHEMA_VERSION
  exportedAt: string
  config: AiSettingsTransferSnapshot
}

export function stringifyAiSettingsTransferPayload(config: PluginConfig, now = new Date()) {
  const payload: AiSettingsTransferPayload = {
    kind: AI_SETTINGS_TRANSFER_KIND,
    schemaVersion: AI_SETTINGS_TRANSFER_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    config: extractAiSettingsTransferSnapshot(config),
  }

  return JSON.stringify(payload, null, 2)
}

export function parseAiSettingsTransferPayload(raw: string): AiSettingsTransferSnapshot {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('AI 服务设置文件不是有效的 JSON')
  }

  if (!isRecord(parsed)) {
    throw new Error('AI 服务设置文件格式无效')
  }

  const candidate = resolveImportCandidate(parsed)
  if (!candidate) {
    throw new Error('AI 服务设置文件格式无效')
  }

  const draft = buildAiSettingsDraft(candidate)
  ensureConfigDefaults(draft)
  return extractAiSettingsTransferSnapshot(draft)
}

export function applyImportedAiSettings(config: PluginConfig, imported: AiSettingsTransferSnapshot) {
  config.aiEnabled = imported.aiEnabled
  config.aiProviderPreset = imported.aiProviderPreset
  config.aiProviderConfigs = cloneAiProviderConfigMap(imported.aiProviderConfigs)
  config.aiBaseUrl = imported.aiBaseUrl
  config.aiApiKey = imported.aiApiKey
  config.aiModel = imported.aiModel
  config.aiEmbeddingModel = imported.aiEmbeddingModel
  config.aiRequestTimeoutSeconds = imported.aiRequestTimeoutSeconds
  config.aiMaxTokens = imported.aiMaxTokens
  config.aiTemperature = imported.aiTemperature
  config.aiMaxContextMessages = imported.aiMaxContextMessages
  config.aiContextCapacity = imported.aiContextCapacity
  ensureConfigDefaults(config)
}

function extractAiSettingsTransferSnapshot(config: PluginConfig): AiSettingsTransferSnapshot {
  const normalized = buildAiSettingsDraft(config)
  ensureConfigDefaults(normalized)

  return {
    aiEnabled: normalized.aiEnabled ?? false,
    aiProviderPreset: normalized.aiProviderPreset ?? 'custom',
    aiProviderConfigs: cloneAiProviderConfigMap(normalized.aiProviderConfigs),
    aiBaseUrl: normalized.aiBaseUrl ?? '',
    aiApiKey: normalized.aiApiKey ?? '',
    aiModel: normalized.aiModel ?? '',
    aiEmbeddingModel: normalized.aiEmbeddingModel ?? '',
    aiRequestTimeoutSeconds: normalized.aiRequestTimeoutSeconds ?? DEFAULT_CONFIG.aiRequestTimeoutSeconds ?? 30,
    aiMaxTokens: normalized.aiMaxTokens ?? DEFAULT_CONFIG.aiMaxTokens ?? 10240,
    aiTemperature: normalized.aiTemperature ?? DEFAULT_CONFIG.aiTemperature ?? 0.7,
    aiMaxContextMessages: normalized.aiMaxContextMessages ?? DEFAULT_CONFIG.aiMaxContextMessages ?? 7,
    aiContextCapacity: normalized.aiContextCapacity ?? DEFAULT_CONFIG.aiContextCapacity ?? 'balanced',
  }
}

function buildAiSettingsDraft(source: Partial<PluginConfig>): PluginConfig {
  return {
    ...DEFAULT_CONFIG,
    showSummaryCards: DEFAULT_CONFIG.showSummaryCards,
    themeNotebookId: '',
    themeDocumentPath: '',
    themeNamePrefix: '',
    themeNameSuffix: '',
    readTagNames: [],
    readTitlePrefixes: '',
    readTitleSuffixes: '',
    readPaths: '',
    aiEnabled: typeof source.aiEnabled === 'boolean' ? source.aiEnabled : DEFAULT_CONFIG.aiEnabled,
    aiProviderPreset: source.aiProviderPreset,
    aiProviderConfigs: cloneAiProviderConfigMap(source.aiProviderConfigs),
    aiBaseUrl: typeof source.aiBaseUrl === 'string' ? source.aiBaseUrl : '',
    aiApiKey: typeof source.aiApiKey === 'string' ? source.aiApiKey : '',
    aiModel: typeof source.aiModel === 'string' ? source.aiModel : '',
    aiEmbeddingModel: typeof source.aiEmbeddingModel === 'string' ? source.aiEmbeddingModel : '',
    aiRequestTimeoutSeconds: source.aiRequestTimeoutSeconds,
    aiMaxTokens: source.aiMaxTokens,
    aiTemperature: source.aiTemperature,
    aiMaxContextMessages: source.aiMaxContextMessages,
    aiContextCapacity: source.aiContextCapacity,
    summaryCardOrder: undefined,
  }
}

function resolveImportCandidate(parsed: Record<string, unknown>) {
  if (parsed.kind === AI_SETTINGS_TRANSFER_KIND) {
    return isRecord(parsed.config) ? parsed.config : null
  }

  const hasAiField = 'aiEnabled' in parsed
    || 'aiProviderPreset' in parsed
    || 'aiBaseUrl' in parsed
    || 'aiApiKey' in parsed
    || 'aiModel' in parsed
    || 'aiEmbeddingModel' in parsed

  return hasAiField ? parsed : null
}

function cloneAiProviderConfigMap(value: unknown): AiProviderConfigMap {
  if (!isRecord(value)) {
    return {}
  }

  const result: AiProviderConfigMap = {}
  for (const provider of ['siliconflow', 'openai', 'gemini', 'custom'] as const) {
    const snapshot = value[provider]
    if (!isRecord(snapshot)) {
      continue
    }

    result[provider] = {
      aiBaseUrl: typeof snapshot.aiBaseUrl === 'string' ? snapshot.aiBaseUrl : '',
      aiApiKey: typeof snapshot.aiApiKey === 'string' ? snapshot.aiApiKey : '',
      aiModel: typeof snapshot.aiModel === 'string' ? snapshot.aiModel : '',
      aiEmbeddingModel: typeof snapshot.aiEmbeddingModel === 'string' ? snapshot.aiEmbeddingModel : '',
    }
  }
  return result
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}
