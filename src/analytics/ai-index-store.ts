import type { DocumentRecord, OrphanItem, TimeRange } from './analysis'
import type { AiLinkSuggestionResult } from './ai-link-suggestions'
import { normalizeTags, resolveDocumentTitle } from './document-utils'
import type { ThemeDocument } from './theme-documents'
import type { PluginConfig } from '@/types/config'

const AI_INDEX_STORAGE_NAME = 'ai-document-index.json'
const AI_INDEX_SCHEMA_VERSION = 1
const AI_PROFILE_VERSION = 1

type AiConfig = Pick<
  PluginConfig,
  | 'aiModel'
  | 'aiEmbeddingModel'
>

type AnalyticsFiltersLike = {
  notebook?: string
  tags?: string[]
  themeNames?: string[]
  keyword?: string
}

type PluginStorageLike = {
  loadData?: (storageName: string) => Promise<any>
  saveData?: (storageName: string, value: any) => Promise<void> | void
}

export interface DocumentSemanticProfileRecord {
  documentId: string
  sourceUpdatedAt: string
  sourceHash: string
  profileVersion: number
  modelVersion: string
  title: string
  path: string
  hpath: string
  tagsJson: string
  summaryShort: string
  summaryMedium: string
  keywordsJson: string
  topicCandidatesJson: string
  entitiesJson: string
  roleHintsJson: string
  embeddingJson: string
  evidenceSnippetsJson: string
  updatedAt: string
}

export interface DocumentLinkSuggestionCacheRecord {
  sourceDocumentId: string
  cacheKey: string
  modelVersion: string
  suggestionsJson: string
  createdAt: string
}

export interface AiDocumentIndexSnapshot {
  schemaVersion: number
  semanticProfiles: Record<string, DocumentSemanticProfileRecord>
  suggestionCache: Record<string, DocumentLinkSuggestionCacheRecord>
}

export interface AiDocumentIndexStore {
  saveSuggestionIndex: (params: {
    config: AiConfig
    sourceDocument: DocumentRecord
    orphan: OrphanItem
    themeDocuments: ThemeDocument[]
    filters: AnalyticsFiltersLike
    timeRange: TimeRange
    result: AiLinkSuggestionResult
  }) => Promise<void>
  invalidateSuggestionCache: (documentId: string) => Promise<void>
}

export function createAiDocumentIndexStore(storage: PluginStorageLike): AiDocumentIndexStore {
  return {
    async saveSuggestionIndex(params) {
      const snapshot = await loadSnapshot(storage)
      const modelVersion = buildModelVersion(params.config)
      const updatedAt = params.result.generatedAt || new Date().toISOString()
      const cacheKey = buildSuggestionCacheKey({
        config: params.config,
        sourceDocument: params.sourceDocument,
        themeDocuments: params.themeDocuments,
        filters: params.filters,
        timeRange: params.timeRange,
      })

      snapshot.semanticProfiles[params.sourceDocument.id] = buildSemanticProfileRecord({
        config: params.config,
        sourceDocument: params.sourceDocument,
        orphan: params.orphan,
        result: params.result,
        updatedAt,
      })
      snapshot.suggestionCache[buildSuggestionCacheStorageKey(params.sourceDocument.id, cacheKey)] = {
        sourceDocumentId: params.sourceDocument.id,
        cacheKey,
        modelVersion,
        suggestionsJson: JSON.stringify({
          generatedAt: params.result.generatedAt,
          summary: params.result.summary,
          suggestions: params.result.suggestions,
        }),
        createdAt: updatedAt,
      }

      await saveSnapshot(storage, snapshot)
    },
    async invalidateSuggestionCache(documentId) {
      const snapshot = await loadSnapshot(storage)
      const keys = Object.keys(snapshot.suggestionCache)
        .filter(key => snapshot.suggestionCache[key]?.sourceDocumentId === documentId)

      if (!keys.length) {
        return
      }

      for (const key of keys) {
        delete snapshot.suggestionCache[key]
      }

      await saveSnapshot(storage, snapshot)
    },
  }
}

export function createAiDocumentIndexStoreFromPlugin(plugin: PluginStorageLike | null | undefined): AiDocumentIndexStore | null {
  if (!plugin?.loadData || !plugin?.saveData) {
    return null
  }

  return createAiDocumentIndexStore(plugin)
}

export function buildSuggestionCacheKey(params: {
  config: AiConfig
  sourceDocument: Pick<DocumentRecord, 'id' | 'updated'>
  themeDocuments: ThemeDocument[]
  filters: AnalyticsFiltersLike
  timeRange: TimeRange
}): string {
  const payload = {
    documentId: params.sourceDocument.id,
    sourceUpdatedAt: params.sourceDocument.updated ?? '',
    filters: {
      notebook: params.filters.notebook ?? '',
      tags: [...(params.filters.tags ?? [])].sort(),
      themeNames: [...(params.filters.themeNames ?? [])].sort(),
      keyword: (params.filters.keyword ?? '').trim(),
    },
    timeRange: params.timeRange,
    themeDocumentVersion: params.themeDocuments
      .map(item => `${item.documentId}:${item.title}:${item.themeName}`)
      .sort(),
    modelVersion: buildModelVersion(params.config),
    profileVersion: AI_PROFILE_VERSION,
  }

  return simpleHash(JSON.stringify(payload))
}

async function loadSnapshot(storage: PluginStorageLike): Promise<AiDocumentIndexSnapshot> {
  const data = await storage.loadData?.(AI_INDEX_STORAGE_NAME)
  if (!data || typeof data !== 'object') {
    return createEmptySnapshot()
  }

  return {
    schemaVersion: Number.isFinite(data.schemaVersion) ? data.schemaVersion : AI_INDEX_SCHEMA_VERSION,
    semanticProfiles: isRecord(data.semanticProfiles) ? data.semanticProfiles as Record<string, DocumentSemanticProfileRecord> : {},
    suggestionCache: isRecord(data.suggestionCache) ? data.suggestionCache as Record<string, DocumentLinkSuggestionCacheRecord> : {},
  }
}

async function saveSnapshot(storage: PluginStorageLike, snapshot: AiDocumentIndexSnapshot) {
  await storage.saveData?.(AI_INDEX_STORAGE_NAME, snapshot)
}

function createEmptySnapshot(): AiDocumentIndexSnapshot {
  return {
    schemaVersion: AI_INDEX_SCHEMA_VERSION,
    semanticProfiles: {},
    suggestionCache: {},
  }
}

function buildSemanticProfileRecord(params: {
  config: AiConfig
  sourceDocument: DocumentRecord
  orphan: OrphanItem
  result: AiLinkSuggestionResult
  updatedAt: string
}): DocumentSemanticProfileRecord {
  const title = resolveDocumentTitle(params.sourceDocument)
  const tags = normalizeTags(params.sourceDocument.tags)
  const summaryShort = params.result.summary.trim() || `已生成 ${title} 的 AI 补链建议`
  const summaryMedium = [
    summaryShort,
    ...params.result.suggestions.map(item => item.reason.trim()),
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  const topicCandidates = params.result.suggestions.map(item => ({
    documentId: item.targetDocumentId,
    title: item.targetTitle,
    targetType: item.targetType,
    confidence: item.confidence,
  }))
  const evidenceSnippets = params.result.suggestions.map(item => ({
    targetDocumentId: item.targetDocumentId,
    reason: item.reason,
    draftText: item.draftText ?? '',
  }))
  const keywords = deduplicateStrings([
    ...tags,
    ...params.result.suggestions.map(item => item.targetTitle),
    ...params.result.suggestions.flatMap(item => (item.tagSuggestions ?? []).map(tag => tag.tag)),
  ])
  const roleHints = deduplicateStrings([
    'orphan-document',
    params.orphan.hasSparseEvidence ? 'sparse-evidence' : '',
    params.result.suggestions.some(item => item.targetType === 'theme-document') ? 'theme-reconnect' : 'structure-reconnect',
  ])

  return {
    documentId: params.sourceDocument.id,
    sourceUpdatedAt: params.sourceDocument.updated ?? '',
    sourceHash: simpleHash([
      params.sourceDocument.id,
      params.sourceDocument.updated ?? '',
      title,
      params.sourceDocument.path ?? '',
      params.sourceDocument.hpath ?? '',
      tags.join(','),
      params.sourceDocument.content ?? '',
    ].join('\n')),
    profileVersion: AI_PROFILE_VERSION,
    modelVersion: buildModelVersion(params.config),
    title,
    path: params.sourceDocument.path ?? '',
    hpath: params.sourceDocument.hpath ?? '',
    tagsJson: JSON.stringify(tags),
    summaryShort,
    summaryMedium,
    keywordsJson: JSON.stringify(keywords),
    topicCandidatesJson: JSON.stringify(topicCandidates),
    entitiesJson: JSON.stringify([]),
    roleHintsJson: JSON.stringify(roleHints),
    embeddingJson: JSON.stringify([]),
    evidenceSnippetsJson: JSON.stringify(evidenceSnippets),
    updatedAt: params.updatedAt,
  }
}

function buildModelVersion(config: AiConfig): string {
  return [config.aiModel?.trim(), config.aiEmbeddingModel?.trim()].filter(Boolean).join(' | ') || 'unknown'
}

function buildSuggestionCacheStorageKey(documentId: string, cacheKey: string): string {
  return `${documentId}:${cacheKey}`
}

function deduplicateStrings(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

function simpleHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `h${(hash >>> 0).toString(16)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
