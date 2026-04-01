import { describe, expect, it } from 'vitest'

import { createAiInboxService } from './ai-inbox'

const documents = Array.from({ length: 12 }, (_, index) => ({
  id: `doc-${index + 1}`,
  box: 'box-1',
  path: `/doc-${index + 1}.sy`,
  hpath: `/Doc ${index + 1}`,
  title: `Doc ${index + 1}`,
  created: '20260301090000',
  updated: '20260311120000',
}))

const report = {
  summary: {
    totalDocuments: 12,
    analyzedDocuments: 12,
    totalReferences: 20,
    orphanCount: 10,
    communityCount: 4,
    dormantCount: 8,
    sparseEvidenceCount: 3,
    propagationCount: 7,
  },
  ranking: Array.from({ length: 12 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    inboundReferences: 20 - index,
    distinctSourceDocuments: 10 - Math.min(index, 5),
    outboundReferences: 5,
    lastActiveAt: '20260311120000',
  })),
  communities: Array.from({ length: 8 }, (_, index) => ({
    id: `community-${index + 1}`,
    documentIds: [`doc-${index + 1}`, `doc-${index + 2}`],
    size: 2,
    hubDocumentIds: [`doc-${index + 1}`],
    topTags: [`tag-${index + 1}`],
    notebookIds: ['box-1'],
    missingTopicPage: index % 2 === 0,
  })),
  bridgeDocuments: Array.from({ length: 8 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    degree: 8 - index,
  })),
  orphans: Array.from({ length: 10 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    degree: 0,
    createdAt: '20260301090000',
    updatedAt: '20260311120000',
    historicalReferenceCount: index + 1,
    lastHistoricalAt: '20260310120000',
    hasSparseEvidence: index < 3,
  })),
  dormantDocuments: Array.from({ length: 8 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    degree: 0,
    createdAt: '20260301090000',
    updatedAt: '20260311120000',
    historicalReferenceCount: index + 1,
    lastHistoricalAt: '20260310120000',
    hasSparseEvidence: false,
    inactivityDays: 30 + index,
    lastConnectedAt: '20260310120000',
  })),
  propagationNodes: Array.from({ length: 9 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    degree: 5,
    score: 12 - index,
    pathPairCount: 6,
    focusDocumentCount: 4,
    communitySpan: 2,
    bridgeRole: index < 2,
  })),
  suggestions: [],
  evidenceByDocument: {},
} as any

const trends = {
  current: { referenceCount: 10 },
  previous: { referenceCount: 6 },
  risingDocuments: Array.from({ length: 9 }, (_, index) => ({
    documentId: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    currentReferences: 8,
    previousReferences: 4,
    delta: 4 - index,
  })),
  fallingDocuments: Array.from({ length: 9 }, (_, index) => ({
    documentId: `doc-${index + 4}`,
    title: `Doc ${index + 4}`,
    currentReferences: 2,
    previousReferences: 5,
    delta: -1 - index,
  })),
  connectionChanges: {
    newCount: 7,
    brokenCount: 7,
    newEdges: Array.from({ length: 7 }, (_, index) => ({
      documentIds: [`doc-${index + 1}`, `doc-${index + 2}`],
      referenceCount: index + 1,
    })),
    brokenEdges: Array.from({ length: 7 }, (_, index) => ({
      documentIds: [`doc-${index + 5}`, `doc-${index + 6}`],
      referenceCount: index + 1,
    })),
  },
  communityTrends: Array.from({ length: 8 }, (_, index) => ({
    communityId: `community-${index + 1}`,
    documentIds: [`doc-${index + 1}`, `doc-${index + 2}`],
    hubDocumentIds: [`doc-${index + 1}`],
    topTags: [`tag-${index + 1}`],
    currentReferences: 4,
    previousReferences: 2,
    delta: 2,
  })),
  risingCommunities: [],
  dormantCommunities: [],
} as any

describe('ai inbox payload', () => {
  it('uses compact capacity to reduce the number of included signals', () => {
    const service = createAiInboxService({
      forwardProxy: async () => {
        throw new Error('not used')
      },
    })

    const payload = service.buildPayload({
      documents,
      report,
      trends,
      summaryCards: [
        { key: 'read', label: '未读文档', value: '5', hint: '未命中已读标记规则的文档数' },
        { key: 'orphans', label: '孤立文档', value: '10', hint: '当前窗口内没有有效文档级连接' },
        { key: 'ranking', label: '核心文档', value: '12', hint: '当前窗口内被引用的核心文档数' },
        { key: 'documents', label: '文档样本', value: '12', hint: '命中当前筛选条件的文档数' },
        { key: 'trends', label: '趋势观察', value: '10', hint: '当前窗口内出现变化的文档数' },
      ] as any,
      filters: {},
      timeRange: '7d',
      dormantDays: 30,
      contextCapacity: 'compact',
    })

    expect(payload.context.capacity).toBe('compact')
    expect(payload.context.summaryCards).toHaveLength(4)
    expect(payload.signals.ranking).toHaveLength(3)
    expect(payload.signals.orphans).toHaveLength(3)
    expect(payload.signals.bridges).toHaveLength(3)
    expect(payload.signals.newConnections).toHaveLength(2)
    expect(payload.signals.brokenConnections).toHaveLength(2)
  })

  it('uses full capacity to include a wider signal window', () => {
    const service = createAiInboxService({
      forwardProxy: async () => {
        throw new Error('not used')
      },
    })

    const payload = service.buildPayload({
      documents,
      report,
      trends,
      summaryCards: [
        { key: 'read', label: '未读文档', value: '5', hint: '未命中已读标记规则的文档数' },
        { key: 'orphans', label: '孤立文档', value: '10', hint: '当前窗口内没有有效文档级连接' },
        { key: 'ranking', label: '核心文档', value: '12', hint: '当前窗口内被引用的核心文档数' },
        { key: 'documents', label: '文档样本', value: '12', hint: '命中当前筛选条件的文档数' },
        { key: 'trends', label: '趋势观察', value: '10', hint: '当前窗口内出现变化的文档数' },
      ] as any,
      filters: {},
      timeRange: '7d',
      dormantDays: 30,
      contextCapacity: 'full',
    })

    expect(payload.context.capacity).toBe('full')
    expect(payload.context.summaryCards).toHaveLength(5)
    expect(payload.signals.ranking).toHaveLength(10)
    expect(payload.signals.orphans).toHaveLength(10)
    expect(payload.signals.propagation).toHaveLength(9)
    expect(payload.signals.newConnections).toHaveLength(7)
    expect(payload.signals.brokenConnections).toHaveLength(7)
  })
})
