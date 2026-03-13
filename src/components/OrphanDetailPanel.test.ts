import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

import OrphanDetailPanel from './OrphanDetailPanel.vue'

describe('OrphanDetailPanel', () => {
  it('renders orphan sort control and items', async () => {
    const app = createSSRApp({
      render: () => h(OrphanDetailPanel, {
        items: [
          { documentId: 'doc-a', title: 'Alpha', meta: 'meta' },
        ],
        orphanSort: 'updated-desc',
        onUpdateOrphanSort: vi.fn(),
        openDocument: vi.fn(),
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('孤立排序')
    expect(html).toContain('按更新时间')
    expect(html).toContain('Alpha')
  })
})
