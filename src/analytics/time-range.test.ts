import { describe, expect, it } from 'vitest'

import { buildTimeRangeOptions } from './time-range'

describe('buildTimeRangeOptions', () => {
  it('builds labels from the shared time range options', () => {
    expect(buildTimeRangeOptions()).toEqual([
      { value: 'all', label: '全部时间' },
      { value: '3d', label: '近 3 天' },
      { value: '7d', label: '近 7 天' },
      { value: '30d', label: '近 30 天' },
      { value: '60d', label: '近 60 天' },
      { value: '90d', label: '近 90 天' },
    ])
  })
})
