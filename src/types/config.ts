import { SUMMARY_CARD_DEFINITIONS, buildSummaryCardVisibilityDefaults } from '@/analytics/summary-card-config'
import type { AiContextCapacity } from '@/analytics/ai-inbox'

export interface PluginConfig {
  showSummaryCards: boolean
  showDocuments?: boolean
  showLargeDocuments?: boolean
  showRead?: boolean
  showReferences?: boolean
  showRanking?: boolean
  showCommunities?: boolean
  showTrends?: boolean
  showOrphans?: boolean
  showDormant?: boolean
  showBridges?: boolean
  showPropagation?: boolean
  showOrphanBridge?: boolean
  themeNotebookId: string
  themeDocumentPath: string
  themeNamePrefix: string
  themeNameSuffix: string
  readTagNames?: string[]
  readTitlePrefixes?: string
  readTitleSuffixes?: string
  readPaths?: string
  aiEnabled?: boolean
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
  aiContextCapacity?: AiContextCapacity
  summaryCardOrder?: string[]
}

export const DEFAULT_CONFIG: PluginConfig = {
  showSummaryCards: true,
  ...buildSummaryCardVisibilityDefaults(),
  themeNotebookId: '',
  themeDocumentPath: '',
  themeNamePrefix: '',
  themeNameSuffix: '',
  readTagNames: [],
  readTitlePrefixes: '',
  readTitleSuffixes: '',
  readPaths: '',
  aiEnabled: false,
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: '',
  aiContextCapacity: 'balanced',
  summaryCardOrder: undefined,
}

export function ensureConfigDefaults(config: PluginConfig) {
  for (const definition of SUMMARY_CARD_DEFINITIONS) {
    const visibilityKey = definition.visibilityConfigKey
    if (typeof config[visibilityKey] === 'boolean') {
      continue
    }

    const legacyVisibilityKey = definition.legacyVisibilityConfigKey
    if (legacyVisibilityKey && typeof config[legacyVisibilityKey] === 'boolean') {
      config[visibilityKey] = config[legacyVisibilityKey]
      continue
    }

    config[visibilityKey] = definition.defaultVisible
  }
  if (!Array.isArray(config.readTagNames)) {
    config.readTagNames = []
  }
  if (typeof config.readTitlePrefixes !== 'string') {
    config.readTitlePrefixes = ''
  }
  if (typeof config.readTitleSuffixes !== 'string') {
    config.readTitleSuffixes = ''
  }
  if (typeof config.readPaths !== 'string') {
    config.readPaths = ''
  }
  if (typeof config.aiEnabled !== 'boolean') {
    config.aiEnabled = false
  }
  if (typeof config.aiBaseUrl !== 'string') {
    config.aiBaseUrl = ''
  }
  if (typeof config.aiApiKey !== 'string') {
    config.aiApiKey = ''
  }
  if (typeof config.aiModel !== 'string') {
    config.aiModel = ''
  }
  if (config.aiContextCapacity !== 'compact' && config.aiContextCapacity !== 'balanced' && config.aiContextCapacity !== 'full') {
    config.aiContextCapacity = 'balanced'
  }
}
