import type { ReferenceGraphReport, TrendReport } from './analysis'
import {
  type LargeDocumentCardMode,
  type LargeDocumentSummary,
} from './large-documents'
import type { ReadCardMode } from './read-status'
import type { SummaryCardItem } from './summary-detail-types'

export function buildSummaryCards(params: {
  report: ReferenceGraphReport
  dormantDays: number
  documentCount?: number
  readDocumentCount?: number
  aiInboxCount?: number
  readCardMode?: ReadCardMode
  trends?: TrendReport | null
  largeDocumentSummary?: LargeDocumentSummary
  largeDocumentCardMode?: LargeDocumentCardMode
}): SummaryCardItem[] {
  const trendCount = params.trends
    ? params.trends.risingDocuments.length + params.trends.fallingDocuments.length
    : 0
  const readCardMode = params.readCardMode ?? 'unread'
  const largeDocumentCardMode = params.largeDocumentCardMode ?? 'words'
  const largeDocumentSummary = params.largeDocumentSummary ?? {
    wordDocumentCount: 0,
    storageDocumentCount: 0,
  }
  const readDocumentCount = params.readDocumentCount ?? 0
  const unreadDocumentCount = Math.max((params.documentCount ?? params.report.summary.totalDocuments) - readDocumentCount, 0)

  return [
    {
      key: 'documents',
      label: '文档样本',
      value: (params.documentCount ?? params.report.summary.totalDocuments).toString(),
      hint: '命中当前筛选条件的文档数',
    },
    {
      key: 'read',
      label: readCardMode === 'read' ? '已读文档' : '未读文档',
      value: (readCardMode === 'read' ? readDocumentCount : unreadDocumentCount).toString(),
      hint: readCardMode === 'read'
        ? '命中已读标记规则的文档数'
        : '未命中已读标记规则的文档数',
    },
    {
      key: 'todaySuggestions',
      label: '今日建议',
      value: (params.aiInboxCount ?? 0).toString(),
      hint: 'AI 汇总出的今日整理建议数',
    },
    {
      key: 'largeDocuments',
      label: largeDocumentCardMode === 'storage' ? '大文档·资源' : '大文档·文字',
      value: (largeDocumentCardMode === 'storage'
        ? largeDocumentSummary.storageDocumentCount
        : largeDocumentSummary.wordDocumentCount).toString(),
      hint: largeDocumentCardMode === 'storage'
        ? '按总大小超过 3 MB 的文档数量统计'
        : '按字数超过 10000 的文档数量统计',
    },
    {
      key: 'references',
      label: '活跃关系',
      value: params.report.summary.totalReferences.toString(),
      hint: '当前窗口内的文档级引用次数',
    },
    {
      key: 'ranking',
      label: '核心文档',
      value: params.report.ranking.length.toString(),
      hint: '当前窗口内被引用的核心文档数',
    },
    {
      key: 'trends',
      label: '趋势观察',
      value: trendCount.toString(),
      hint: '当前窗口内出现变化的文档数',
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
      hint: '当前窗口内没有有效文档级连接',
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
