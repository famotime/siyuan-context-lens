import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

import FilterSelect from './FilterSelect.vue'

describe('FilterSelect', () => {
  it('renders the selected option label and dropdown choices', async () => {
    const app = createSSRApp({
      render: () => h(FilterSelect, {
        modelValue: '7d',
        options: [
          { value: 'all', label: '全部时间' },
          { value: '7d', label: '近 7 天' },
          { value: '30d', label: '近 30 天' },
        ],
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('近 7 天')
    expect(html).toContain('全部时间')
    expect(html).toContain('近 30 天')
  })
})
