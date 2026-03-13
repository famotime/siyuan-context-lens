import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

import ThemeMultiSelect from './ThemeMultiSelect.vue'

describe('ThemeMultiSelect', () => {
  it('renders checkbox options and selected summary', async () => {
    const app = createSSRApp({
      render: () => h(ThemeMultiSelect, {
        modelValue: ['AI', '机器学习'],
        options: [
          { value: 'AI', label: 'AI', documentId: 'doc-ai' },
          { value: '机器学习', label: '机器学习', documentId: 'doc-ml' },
        ],
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('已选 2 个主题')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('AI')
    expect(html).toContain('机器学习')
  })

  it('renders empty state when no options are available', async () => {
    const app = createSSRApp({
      render: () => h(ThemeMultiSelect, {
        modelValue: [],
        options: [],
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('未配置主题文档')
  })

  it('renders a custom summary label for tag filters', async () => {
    const app = createSSRApp({
      render: () => h(ThemeMultiSelect, {
        modelValue: ['AI', 'note'],
        options: [
          { value: 'AI', label: 'AI' },
          { value: 'note', label: 'note' },
        ],
        allLabel: '全部标签',
        emptyLabel: '暂无标签',
        selectionUnit: '个标签',
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('已选 2 个标签')
  })
})
