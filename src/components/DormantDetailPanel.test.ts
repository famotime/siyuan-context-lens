import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

import DormantDetailPanel from './DormantDetailPanel.vue'

describe('DormantDetailPanel', () => {
  it('renders dormant threshold control and items', async () => {
    const app = createSSRApp({
      render: () => h(DormantDetailPanel, {
        items: [
          { documentId: 'doc-a', title: 'Alpha', meta: 'meta' },
        ],
        dormantDays: 30,
        onUpdateDormantDays: vi.fn(),
        openDocument: vi.fn(),
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('沉没阈值')
    expect(html).toContain('30 天')
    expect(html).toContain('Alpha')
  })
})
