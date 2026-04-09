import { describe, expect, it } from 'vitest'

import type { ReferenceGraphReport, TrendReport } from './analysis'
import { WIKI_LLM_OUTPUT_KEYS, buildWikiGenerationPayloads } from './wiki-generation'
import { buildWikiScope } from './wiki-scope'
import type { PluginConfig } from '@/types/config'

const config: PluginConfig = {
  showSummaryCards: true,
  showRanking: true,
  showCommunities: true,
  showOrphanBridge: true,
  showTrends: true,
  showPropagation: true,
  themeNotebookId: 'box-1',
  themeDocumentPath: '/专题',
  themeNamePrefix: '主题-',
  themeNameSuffix: '-索引',
  wikiPageSuffix: '-llm-wiki',
}

describe('wiki generation', () => {
  it('builds theme wiki payloads from scope, summaries and structural signals', () => {
    const documents = [
      { id: 'theme-ai', box: 'box-1', path: '/topics/ai.sy', hpath: '/专题/主题-AI-索引', title: '主题-AI-索引', name: 'AI', alias: '人工智能', tags: [], updated: '20260311120000' },
      { id: 'doc-core', box: 'box-1', path: '/notes/core.sy', hpath: '/笔记/AI 核心', title: 'AI 核心', content: 'AI 核心内容', tags: ['AI'], updated: '20260311120000' },
      { id: 'doc-bridge', box: 'box-1', path: '/notes/bridge.sy', hpath: '/笔记/AI 桥接', title: 'AI 桥接', content: '人工智能 桥接 节点', tags: ['AI'], updated: '20260311120000' },
      { id: 'doc-free', box: 'box-1', path: '/notes/free.sy', hpath: '/笔记/杂项', title: '杂项', content: '无主题', tags: [], updated: '20260311120000' },
    ] as any

    const scope = buildWikiScope({
      documents,
      config,
    })

    const report: ReferenceGraphReport = {
      summary: {
        totalDocuments: 3,
        analyzedDocuments: 3,
        totalReferences: 2,
        orphanCount: 0,
        communityCount: 1,
        dormantCount: 0,
        sparseEvidenceCount: 0,
        propagationCount: 1,
      },
      ranking: [
        { documentId: 'doc-core', title: 'AI 核心', inboundReferences: 3, distinctSourceDocuments: 2, outboundReferences: 1, lastActiveAt: '20260311120000' },
      ],
      communities: [
        { id: 'community-1', documentIds: ['doc-core', 'doc-bridge'], size: 2, hubDocumentIds: ['doc-core'], topTags: ['AI'], notebookIds: ['box-1'], missingTopicPage: false },
      ],
      bridgeDocuments: [
        { documentId: 'doc-bridge', title: 'AI 桥接', degree: 2 },
      ],
      orphans: [],
      dormantDocuments: [],
      propagationNodes: [
        { documentId: 'doc-bridge', title: 'AI 桥接', degree: 2, score: 4, pathPairCount: 2, focusDocumentCount: 2, communitySpan: 1, bridgeRole: true },
      ],
      suggestions: [],
      evidenceByDocument: {
        'doc-core': [
          {
            id: 'ref-1',
            sourceDocumentId: 'doc-bridge',
            sourceBlockId: 'blk-1',
            targetDocumentId: 'doc-core',
            targetBlockId: 'blk-2',
            content: '[[AI 核心]]',
            sourceUpdated: '20260311120000',
          },
        ],
      },
    }

    const trends: TrendReport = {
      current: { referenceCount: 2 },
      previous: { referenceCount: 1 },
      risingDocuments: [
        { documentId: 'doc-core', title: 'AI 核心', currentReferences: 3, previousReferences: 1, delta: 2 },
      ],
      fallingDocuments: [],
      connectionChanges: {
        newCount: 1,
        brokenCount: 0,
        newEdges: [{ documentIds: ['doc-bridge', 'doc-core'], referenceCount: 1 }],
        brokenEdges: [],
      },
      communityTrends: [
        { communityId: 'community-1', documentIds: ['doc-core', 'doc-bridge'], hubDocumentIds: ['doc-core'], topTags: ['AI'], currentReferences: 2, previousReferences: 1, delta: 1 },
      ],
      risingCommunities: [],
      dormantCommunities: [],
    }

    const payloads = buildWikiGenerationPayloads({
      config,
      scope,
      report,
      trends,
      documentMap: new Map(documents.map(document => [document.id, document])),
      getDocumentSummary: (document) => ({
        summaryShort: `${document.title} 短摘要`,
        summaryMedium: `${document.title} 中摘要`,
        keywords: [document.title],
        evidenceSnippets: [`${document.title} 证据`],
        updatedAt: '2026-04-09T12:00:00.000Z',
      }),
    })

    expect(WIKI_LLM_OUTPUT_KEYS).toEqual([
      'overview',
      'keyDocuments',
      'structureObservations',
      'evidence',
      'actions',
    ])
    expect(payloads.unclassifiedDocuments.map(item => item.documentId)).toEqual(['doc-free'])
    expect(payloads.themes).toEqual([
      expect.objectContaining({
        themeName: 'AI',
        pageTitle: '主题-AI-索引-llm-wiki',
        sourceDocuments: [
          expect.objectContaining({ documentId: 'doc-core', summaryShort: 'AI 核心 短摘要' }),
          expect.objectContaining({ documentId: 'doc-bridge', summaryShort: 'AI 桥接 短摘要' }),
        ],
        signals: expect.objectContaining({
          coreDocuments: [expect.objectContaining({ documentId: 'doc-core' })],
          bridgeDocuments: [expect.objectContaining({ documentId: 'doc-bridge' })],
          propagationDocuments: [expect.objectContaining({ documentId: 'doc-bridge' })],
          risingDocuments: [expect.objectContaining({ documentId: 'doc-core' })],
        }),
        evidence: expect.arrayContaining([
          expect.stringContaining('AI 桥接 -> AI 核心'),
        ]),
      }),
    ])
  })
})
