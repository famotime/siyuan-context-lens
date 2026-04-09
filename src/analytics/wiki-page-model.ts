export const WIKI_PAGE_TYPES = ['theme', 'index', 'log'] as const
export type WikiPageType = typeof WIKI_PAGE_TYPES[number]

export const WIKI_SECTION_KEYS = [
  'meta',
  'overview',
  'keyDocuments',
  'structureObservations',
  'evidence',
  'actions',
  'manualNotes',
] as const
export type WikiSectionKey = typeof WIKI_SECTION_KEYS[number]

export const WIKI_PREVIEW_STATUSES = ['create', 'update', 'unchanged', 'conflict'] as const
export type WikiPreviewStatus = typeof WIKI_PREVIEW_STATUSES[number]

export const WIKI_APPLY_RESULTS = ['created', 'updated', 'skipped', 'conflict'] as const
export type WikiApplyResult = typeof WIKI_APPLY_RESULTS[number]

export const WIKI_PAGE_HEADINGS: Record<WikiSectionKey | 'managedRoot', string> = {
  managedRoot: 'AI 管理区',
  manualNotes: '人工备注',
  meta: '页面头信息',
  overview: '主题概览',
  keyDocuments: '关键文档',
  structureObservations: '结构观察',
  evidence: '关系证据',
  actions: '整理动作',
}

export const WIKI_BLOCK_ATTR_KEYS = {
  pageType: 'custom-network-lens-wiki-page-type',
  region: 'custom-network-lens-wiki-region',
  section: 'custom-network-lens-wiki-section',
  themeDocumentId: 'custom-network-lens-wiki-theme-document-id',
} as const

export interface WikiPreviewRecord {
  generatedAt: string
  status: WikiPreviewStatus
  sourceDocumentIds: string[]
  pageFingerprint?: string
  managedFingerprint?: string
}

export interface WikiApplyRecord {
  appliedAt: string
  result: WikiApplyResult
  sourceDocumentIds: string[]
  pageFingerprint?: string
  managedFingerprint?: string
}

export function buildThemeWikiPageTitle(themeTitle: string, suffix: string): string {
  const normalizedTitle = themeTitle.trim()
  const normalizedSuffix = normalizeWikiSuffix(suffix)

  if (!normalizedTitle || !normalizedSuffix) {
    return normalizedTitle
  }
  if (normalizedTitle.endsWith(normalizedSuffix)) {
    return normalizedTitle
  }
  return `${normalizedTitle}${normalizedSuffix}`
}

export function isWikiDocumentTitle(title: string, suffix: string): boolean {
  const normalizedTitle = title.trim()
  const normalizedSuffix = normalizeWikiSuffix(suffix)

  return Boolean(normalizedTitle && normalizedSuffix && normalizedTitle.endsWith(normalizedSuffix))
}

function normalizeWikiSuffix(value: string): string {
  return value.trim()
}
