import { describe, expect, it } from 'vitest'

import { buildPanelCollapseState, togglePanelCollapse } from './panel-collapse'

describe('panel collapse state', () => {
  it('defaults new panels to expanded', () => {
    const keys = ['summary-detail', 'ranking', 'trends'] as const
    const state = buildPanelCollapseState(keys)
    expect(state).toEqual({
      'summary-detail': true,
      ranking: true,
      trends: true,
    })
  })

  it('preserves previous state and drops missing keys', () => {
    const keys = ['summary-detail', 'ranking'] as const
    const previous = {
      'summary-detail': false,
      communities: true,
    }
    const state = buildPanelCollapseState(keys, previous)
    expect(state).toEqual({
      'summary-detail': false,
      ranking: true,
    })
  })

  it('toggles existing keys only', () => {
    const state = {
      ranking: true,
      trends: false,
    }
    expect(togglePanelCollapse(state, 'ranking')).toEqual({
      ranking: false,
      trends: false,
    })
    expect(togglePanelCollapse(state, 'orphans')).toBe(state)
  })
})
