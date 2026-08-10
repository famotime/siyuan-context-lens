import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { t } from '@/i18n/ui'
import DocumentAiPanel from './DocumentAiPanel.vue'

describe('DocumentAiPanel', () => {
  it('renders AI suggestion button and loading state', async () => {
    const app = createSSRApp({
      render: () => h(DocumentAiPanel, {
        documentId: 'doc-1',
        aiEnabled: true,
        aiConfigReady: true,
        aiSuggestionState: {
          loading: true,
          statusMessage: '正在分析文档语义…',
          error: '',
          result: null,
        },
        onGenerateAiSuggestion: vi.fn(),
        onToggleAiLinkSuggestion: vi.fn(),
        isAiLinkSuggestionActive: vi.fn().mockReturnValue(false),
        onToggleAiTagSuggestion: vi.fn(),
        isAiTagSuggestionActive: vi.fn().mockReturnValue(false),
      }),
    })

    const html = await renderToString(app)
    expect(html).toContain(t('orphanDetail.aiSuggestions'))
    expect(html).toContain('正在分析文档语义…')
  })

  it('renders AI link suggestions and tag suggestions when result is ready', async () => {
    const app = createSSRApp({
      render: () => h(DocumentAiPanel, {
        documentId: 'doc-1',
        aiEnabled: true,
        aiConfigReady: true,
        aiSuggestionState: {
          loading: false,
          statusMessage: '',
          error: '',
          result: {
            summary: '建议与 AI 知识库建立关联',
            suggestions: [
              {
                targetDocumentId: 'target-1',
                targetTitle: 'AI 基础概念',
                confidence: 'high',
                reason: '概念高度重合',
                targetType: 'normal-document',
                tagSuggestions: [{ tag: 'AI', source: 'new', reason: '建议新增 AI 标签' }],
              },
            ],
          },
        },
        onGenerateAiSuggestion: vi.fn(),
        onToggleAiLinkSuggestion: vi.fn(),
        isAiLinkSuggestionActive: vi.fn().mockImplementation((_docId, targetId) => targetId === 'target-1'),
        onToggleAiTagSuggestion: vi.fn(),
        isAiTagSuggestionActive: vi.fn().mockImplementation((_docId, tag) => tag === 'AI'),
      }),
    })

    const html = await renderToString(app)
    expect(html).toContain(t('orphanDetail.regenerateAiSuggestions'))
    expect(html).toContain('建议与 AI 知识库建立关联')
    expect(html).toContain('AI 基础概念')
    expect(html).toContain('概念高度重合')
    expect(html).toContain('AI')
  })
})
