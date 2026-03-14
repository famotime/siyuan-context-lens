import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('App trend detail layout', () => {
  it('uses section cards and default document title styling in trend detail', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('trend-section-card')
    expect(source).toContain('trend-record')
    expect(source).toContain('trend-record__meta')
    expect(source).not.toContain('variant="compact"')
  })

  it('exposes drag sorting and a reset order button for summary cards', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('重置排序')
    expect(source).toContain('draggable="true"')
    expect(source).toContain('@dragstart=')
    expect(source).toContain('@drop.prevent=')
  })
})
