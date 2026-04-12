import { ensureDocumentSummary } from '@/analytics/ai-document-summary'
import type {
  AnalyticsFilters,
  DocumentRecord,
  TimeRange,
} from '@/analytics/analysis'
import type { AiDocumentIndexStore } from '@/analytics/ai-index-store'
import type { WikiPagePreviewResult } from '@/analytics/wiki-diff'
import type { WikiApplyBatchResult } from '@/analytics/wiki-documents'
import type { RenderedWikiDraft } from '@/analytics/wiki-renderer'
import type { WikiScopeSummary } from '@/analytics/wiki-scope'
import type { WikiPageSnapshotRecord } from '@/analytics/wiki-store'
import type { PluginConfig } from '@/types/config'

type GetIDsByHPathFn = (notebook: string, path: string) => Promise<string[]>
type GetBlockKramdownFn = (id: string) => Promise<{ id: string, kramdown: string }>

export interface WikiPreviewThemePageItem {
  pageTitle: string
  themeName: string
  themeDocumentId: string
  themeDocumentTitle: string
  themeDocumentBox: string
  themeDocumentHPath: string
  sourceDocumentIds: string[]
  preview: WikiPagePreviewResult
  draft: RenderedWikiDraft
  hasManualNotes: boolean
}

export interface WikiPreviewState {
  generatedAt: string
  scope: {
    summary: WikiScopeSummary
    descriptionLines: string[]
  }
  themePages: WikiPreviewThemePageItem[]
  unclassifiedDocuments: Array<{ documentId: string, title: string }>
  excludedWikiDocuments: Array<{ documentId: string, title: string }>
  applyResult?: WikiApplyBatchResult
}

export interface WikiPreviewRequest {
  sourceDocumentIds?: string[]
  scopeDescriptionLine?: string
}

export function deduplicateStrings(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

export async function buildWikiSourceSummaryMap(params: {
  sourceDocuments: DocumentRecord[]
  config: PluginConfig
  aiIndexStore: AiDocumentIndexStore | null
  generatedAt: string
}) {
  const entries = await Promise.all(params.sourceDocuments.map(async (document) => {
    const summary = await ensureDocumentSummary({
      config: params.config,
      sourceDocument: document,
      indexStore: params.aiIndexStore,
      updatedAt: params.generatedAt,
    })

    return [document.id, summary] as const
  }))

  return new Map(entries)
}

export async function resolveExistingWikiPage(params: {
  notebook: string
  pageHPath: string
  storedRecord: WikiPageSnapshotRecord | null
  getIDsByHPath?: GetIDsByHPathFn
  getBlockKramdown: GetBlockKramdownFn
}): Promise<{
  pageId: string
  fullMarkdown: string
  managedMarkdown: string
  hasManualNotes: boolean
} | null> {
  const storedPageId = params.storedRecord?.pageId
  let pageId = storedPageId

  if (!pageId && params.getIDsByHPath) {
    const ids = await params.getIDsByHPath(params.notebook, params.pageHPath)
    pageId = ids[0] ?? ''
  }

  if (!pageId) {
    return null
  }

  try {
    const block = await params.getBlockKramdown(pageId)
    const fullMarkdown = block?.kramdown ?? ''
    return {
      pageId,
      fullMarkdown,
      managedMarkdown: extractManagedMarkdown(fullMarkdown),
      hasManualNotes: fullMarkdown.includes('\n## 人工备注'),
    }
  } catch {
    return null
  }
}

export function buildWikiScopeDescriptionLines(params: {
  timeRange: TimeRange
  filters: AnalyticsFilters
  resolveNotebookName: (notebookId: string) => string
  scopeDescriptionLine?: string
}) {
  return [
    params.scopeDescriptionLine ?? '- 范围来源：当前文档样本',
    `- 时间窗口：${params.timeRange}`,
    `- 笔记本：${params.filters.notebook ? params.resolveNotebookName(params.filters.notebook) : '全部笔记本'}`,
    `- 标签：${params.filters.tags?.length ? params.filters.tags.join('、') : '全部标签'}`,
    `- 主题：${params.filters.themeNames?.length ? params.filters.themeNames.join('、') : '全部主题'}`,
    `- 关键词：${params.filters.keyword?.trim() || '无'}`,
  ]
}

export function resolveWikiScopeDocuments(params: {
  sourceDocumentIds?: string[]
  fallbackDocuments: DocumentRecord[]
  associationDocumentMap: Map<string, DocumentRecord>
  documentMap: Map<string, DocumentRecord>
}): DocumentRecord[] {
  if (!params.sourceDocumentIds?.length) {
    return params.fallbackDocuments
  }

  const documents: DocumentRecord[] = []
  const visited = new Set<string>()

  for (const documentId of params.sourceDocumentIds) {
    const document = params.associationDocumentMap.get(documentId) ?? params.documentMap.get(documentId)
    if (!document || visited.has(document.id)) {
      continue
    }
    documents.push(document)
    visited.add(document.id)
  }

  return documents
}

function extractManagedMarkdown(fullMarkdown: string): string {
  const manualHeading = '\n## 人工备注'
  const manualHeadingIndex = fullMarkdown.indexOf(manualHeading)
  if (manualHeadingIndex < 0) {
    return fullMarkdown.trim()
  }
  return fullMarkdown.slice(0, manualHeadingIndex).trim()
}
