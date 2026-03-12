import type {
  AnalyticsFilters,
  DocumentRecord,
  ReferenceGraphReport,
  ReferenceRecord,
  TimeRange,
} from './analysis'

export type SummaryCardKey =
  | 'documents'
  | 'references'
  | 'communities'
  | 'orphans'
  | 'dormant'
  | 'bridges'
  | 'propagation'

export interface SummaryCardItem {
  key: SummaryCardKey
  label: string
  value: string
  hint: string
}

export interface SummaryDetailItem {
  documentId: string
  title: string
  meta: string
  badge?: string
}

export interface SummaryDetailSection {
  key: SummaryCardKey
  title: string
  description: string
  items: SummaryDetailItem[]
}

export function buildSummaryCards(params: {
  report: ReferenceGraphReport
  dormantDays: number
}): SummaryCardItem[] {
  return [
    {
      key: 'documents',
      label: '文档样本',
      value: params.report.summary.totalDocuments.toString(),
      hint: '命中当前筛选条件的文档数',
    },
    {
      key: 'references',
      label: '活跃关系',
      value: params.report.summary.totalReferences.toString(),
      hint: '当前窗口内的文档级引用次数',
    },
    {
      key: 'communities',
      label: '主题社区',
      value: params.report.summary.communityCount.toString(),
      hint: '按桥接节点拆分后的主题簇',
    },
    {
      key: 'orphans',
      label: '孤立文档',
      value: params.report.summary.orphanCount.toString(),
      hint: '历史上从未形成过文档级连接',
    },
    {
      key: 'dormant',
      label: '沉没文档',
      value: params.report.summary.dormantCount.toString(),
      hint: `超过 ${params.dormantDays} 天未产生有效连接`,
    },
    {
      key: 'bridges',
      label: '桥接节点',
      value: params.report.bridgeDocuments.length.toString(),
      hint: '断开后会削弱社区连接的文档',
    },
    {
      key: 'propagation',
      label: '传播节点',
      value: params.report.summary.propagationCount.toString(),
      hint: '出现在关键路径上的高传播价值节点',
    },
  ]
}

export function buildSummaryDetailSections(params: {
  documents: DocumentRecord[]
  references: ReferenceRecord[]
  report: ReferenceGraphReport
  now: Date
  timeRange: TimeRange
  filters?: AnalyticsFilters
  dormantDays: number
}): Record<SummaryCardKey, SummaryDetailSection> {
  const filteredDocuments = filterDocuments(params.documents, params.filters)
  const documentMap = new Map(filteredDocuments.map(document => [document.id, document]))
  const activeReferences = filterActiveReferences({
    references: params.references,
    documentMap,
    now: params.now,
    timeRange: params.timeRange,
  })
  const activeCounts = buildActiveDocumentCounts(activeReferences)

  return {
    documents: {
      key: 'documents',
      title: '文档样本详情',
      description: '当前筛选条件命中的文档。',
      items: filteredDocuments
        .sort((left, right) => compareTimestamp(right.updated ?? '', left.updated ?? '') || resolveTitle(left).localeCompare(resolveTitle(right), 'zh-CN'))
        .map(document => ({
          documentId: document.id,
          title: resolveTitle(document),
          meta: `${document.hpath || document.path} · 最近更新 ${formatCompactDate(document.updated)}`,
        })),
    },
    references: {
      key: 'references',
      title: '活跃关系详情',
      description: '当前时间窗口内参与文档级连接的文档。',
      items: [...activeCounts.entries()]
        .map(([documentId, counts]) => {
          const document = documentMap.get(documentId)
          if (!document) {
            return null
          }
          return {
            documentId,
            title: resolveTitle(document),
            meta: `入链 ${counts.inbound} / 出链 ${counts.outbound}`,
            badge: `${counts.inbound + counts.outbound} 次参与`,
          }
        })
        .filter((item): item is SummaryDetailItem => item !== null)
        .sort((left, right) => extractBadgeNumber(right.badge) - extractBadgeNumber(left.badge) || left.title.localeCompare(right.title, 'zh-CN')),
    },
    communities: {
      key: 'communities',
      title: '主题社区详情',
      description: '已归入主题社区的文档。',
      items: params.report.communities.flatMap(community => {
        return community.documentIds.map((documentId) => ({
          documentId,
          title: documentMap.get(documentId)?.title ?? documentId,
          meta: `社区标签：${community.topTags.join(' / ') || '未提取'} · 社区规模 ${community.size}`,
          badge: community.missingTopicPage ? '缺主题页' : undefined,
        }))
      }),
    },
    orphans: {
      key: 'orphans',
      title: '孤立文档详情',
      description: '历史上从未形成过文档级连接的文档。',
      items: params.report.orphans.map(item => ({
        documentId: item.documentId,
        title: item.title,
        meta: `最近更新 ${formatCompactDate(item.updatedAt)} · 创建于 ${formatCompactDate(item.createdAt)}`,
      })),
    },
    dormant: {
      key: 'dormant',
      title: '沉没文档详情',
      description: `超过 ${params.dormantDays} 天未产生有效连接，但可能保留历史入链/出链。`,
      items: params.report.dormantDocuments.map(item => ({
        documentId: item.documentId,
        title: item.title,
        meta: `${item.inactivityDays} 天未活跃 · 最近连接 ${formatCompactDate(item.lastConnectedAt || item.updatedAt)}`,
        badge: item.hasSparseEvidence ? `${item.historicalReferenceCount} 条历史连接` : undefined,
      })),
    },
    bridges: {
      key: 'bridges',
      title: '桥接节点详情',
      description: '断开后会削弱社区连通性的关键文档。',
      items: params.report.bridgeDocuments.map(item => ({
        documentId: item.documentId,
        title: item.title,
        meta: `连接度 ${item.degree}`,
      })),
    },
    propagation: {
      key: 'propagation',
      title: '传播节点详情',
      description: '高频出现在关键最短路径上的文档。',
      items: params.report.propagationNodes.map(item => ({
        documentId: item.documentId,
        title: item.title,
        meta: `覆盖 ${item.focusDocumentCount} 个焦点文档 · 社区跨度 ${item.communitySpan || 1}`,
        badge: `${item.score} 分`,
      })),
    },
  }
}

function filterDocuments(documents: DocumentRecord[], filters?: AnalyticsFilters): DocumentRecord[] {
  return documents.filter((document) => {
    if (!filters) {
      return true
    }
    if (filters.notebook && document.box !== filters.notebook) {
      return false
    }
    const tags = normalizeTags(document.tags)
    if (filters.tag && !tags.includes(filters.tag)) {
      return false
    }
    if (filters.keyword) {
      const haystack = `${resolveTitle(document)} ${document.hpath} ${tags.join(' ')}`.toLowerCase()
      if (!haystack.includes(filters.keyword.toLowerCase())) {
        return false
      }
    }
    return true
  })
}

function filterActiveReferences(params: {
  references: ReferenceRecord[]
  documentMap: Map<string, DocumentRecord>
  now: Date
  timeRange: TimeRange
}): ReferenceRecord[] {
  return params.references.filter((reference) => {
    if (reference.sourceDocumentId === reference.targetDocumentId) {
      return false
    }
    if (!params.documentMap.has(reference.sourceDocumentId) || !params.documentMap.has(reference.targetDocumentId)) {
      return false
    }
    if (params.timeRange === 'all') {
      return true
    }
    const value = parseTimestamp(reference.sourceUpdated ?? '')
    if (!value) {
      return false
    }
    const days = Number.parseInt(params.timeRange, 10)
    const end = params.now.getTime()
    const start = end - days * 24 * 60 * 60 * 1000
    return value > start && value <= end
  })
}

function buildActiveDocumentCounts(references: ReferenceRecord[]): Map<string, { inbound: number, outbound: number }> {
  const outboundTargets = new Map<string, Set<string>>()
  const inboundSources = new Map<string, Set<string>>()

  for (const reference of references) {
    const outbound = outboundTargets.get(reference.sourceDocumentId) ?? new Set<string>()
    outbound.add(reference.targetDocumentId)
    outboundTargets.set(reference.sourceDocumentId, outbound)

    const inbound = inboundSources.get(reference.targetDocumentId) ?? new Set<string>()
    inbound.add(reference.sourceDocumentId)
    inboundSources.set(reference.targetDocumentId, inbound)
  }

  const counts = new Map<string, { inbound: number, outbound: number }>()
  for (const [documentId, targets] of outboundTargets) {
    counts.set(documentId, { inbound: 0, outbound: targets.size })
  }
  for (const [documentId, sources] of inboundSources) {
    const existing = counts.get(documentId) ?? { inbound: 0, outbound: 0 }
    existing.inbound = sources.size
    counts.set(documentId, existing)
  }

  return counts
}

function resolveTitle(document: DocumentRecord): string {
  return document.title || document.name || document.content || document.hpath || document.id
}

function normalizeTags(tags?: readonly string[] | string): string[] {
  if (!tags) {
    return []
  }
  if (Array.isArray(tags)) {
    return tags.map(tag => tag.trim()).filter(Boolean)
  }
  return tags
    .split(/[,\s#]+/)
    .map(tag => tag.trim())
    .filter(Boolean)
}

function parseTimestamp(timestamp: string): number | null {
  if (!timestamp || timestamp.length < 8) {
    return null
  }
  const year = Number.parseInt(timestamp.slice(0, 4), 10)
  const month = Number.parseInt(timestamp.slice(4, 6), 10) - 1
  const day = Number.parseInt(timestamp.slice(6, 8), 10)
  const hour = Number.parseInt(timestamp.slice(8, 10) || '0', 10)
  const minute = Number.parseInt(timestamp.slice(10, 12) || '0', 10)
  const second = Number.parseInt(timestamp.slice(12, 14) || '0', 10)
  return Date.UTC(year, month, day, hour, minute, second)
}

function compareTimestamp(left: string, right: string): number {
  return (parseTimestamp(left) ?? 0) - (parseTimestamp(right) ?? 0)
}

function formatCompactDate(timestamp?: string): string {
  if (!timestamp || timestamp.length < 8) {
    return '未知时间'
  }
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`
}

function extractBadgeNumber(value?: string): number {
  if (!value) {
    return 0
  }
  const match = value.match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : 0
}
