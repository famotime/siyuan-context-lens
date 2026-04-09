import { describe, expect, it } from 'vitest'

import { buildWikiScope, DEFAULT_WIKI_SECONDARY_THEME_SCORE_RATIO } from './wiki-scope'
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

describe('wiki scope', () => {
  it('groups ordinary source documents by theme, allows close second theme matches, and reports unclassified and excluded wiki pages', () => {
    const scope = buildWikiScope({
      documents: [
        { id: 'theme-ai', box: 'box-1', path: '/topics/ai.sy', hpath: '/专题/主题-AI-索引', title: '主题-AI-索引', name: 'AI', alias: '人工智能', tags: [], updated: '20260311120000' },
        { id: 'theme-ml', box: 'box-1', path: '/topics/ml.sy', hpath: '/专题/主题-机器学习-索引', title: '主题-机器学习-索引', name: '机器学习', alias: 'ML', tags: [], updated: '20260311120000' },
        { id: 'wiki-ai', box: 'box-1', path: '/topics/ai-wiki.sy', hpath: '/专题/主题-AI-索引-llm-wiki', title: '主题-AI-索引-llm-wiki', tags: [], updated: '20260311120000' },
        { id: 'doc-ai', box: 'box-1', path: '/notes/ai.sy', hpath: '/笔记/AI 实践', title: 'AI 实践', content: '人工智能 AI 智能体', tags: ['AI'], updated: '20260311120000' },
        { id: 'doc-both', box: 'box-1', path: '/notes/both.sy', hpath: '/笔记/AI 与机器学习', title: 'AI 与机器学习', content: 'AI 人工智能 机器学习 ML', tags: ['AI', '机器学习'], updated: '20260311120000' },
        { id: 'doc-free', box: 'box-1', path: '/notes/free.sy', hpath: '/笔记/杂项', title: '杂项', content: '没有主题线索', tags: [], updated: '20260311120000' },
      ],
      config,
    })

    expect(DEFAULT_WIKI_SECONDARY_THEME_SCORE_RATIO).toBe(0.8)
    expect(scope.sourceDocuments.map(item => item.id)).toEqual(['doc-ai', 'doc-both', 'doc-free'])
    expect(scope.excludedWikiDocuments.map(item => item.id)).toEqual(['wiki-ai'])
    expect(scope.unclassifiedDocuments.map(item => item.id)).toEqual(['doc-free'])
    expect(scope.themeGroups).toEqual(expect.arrayContaining([
      expect.objectContaining({
        themeName: 'AI',
        sourceDocumentIds: ['doc-ai', 'doc-both'],
      }),
      expect.objectContaining({
        themeName: '机器学习',
        sourceDocumentIds: ['doc-both'],
      }),
    ]))
    expect(scope.summary).toEqual({
      themeDocumentCount: 2,
      sourceDocumentCount: 3,
      themeGroupCount: 2,
      excludedWikiDocumentCount: 1,
      unclassifiedDocumentCount: 1,
    })
  })
})
