import { describe, expect, it } from 'vitest'

import { PLUGIN_ICON, PLUGIN_ICON_SYMBOL } from './plugin-icon'

describe('plugin sidebar icon', () => {
  it('registers the provided neural icon svg as the dock symbol', () => {
    expect(PLUGIN_ICON).toBe('iconNetworkLens')
    expect(PLUGIN_ICON_SYMBOL).toContain('<symbol id="iconNetworkLens"')
    expect(PLUGIN_ICON_SYMBOL).toContain('viewBox="0 0 32 32"')
    expect(PLUGIN_ICON_SYMBOL).toContain('M26 20c-.694 0-1.338.194-1.907.506')
    expect(PLUGIN_ICON_SYMBOL).toContain('fill="currentColor"')
  })
})
