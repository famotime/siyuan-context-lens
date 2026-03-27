import { describe, expect, it, vi } from 'vitest'

import { openPluginDock, resolveDockController } from './plugin-dock'

describe('resolveDockController', () => {
  it('returns a dock instance when toggleModel exists on the top level', () => {
    const toggleModel = vi.fn()
    const dockController = resolveDockController({ toggleModel })

    dockController?.toggleModel('reference-analytics-dock', true)

    expect(toggleModel).toHaveBeenCalledWith('reference-analytics-dock', true)
  })

  it('returns a nested model when toggleModel exists under model', () => {
    const toggleModel = vi.fn()
    const dockController = resolveDockController({ model: { toggleModel } })

    dockController?.toggleModel('reference-analytics-dock', true)

    expect(toggleModel).toHaveBeenCalledWith('reference-analytics-dock', true)
  })

  it('returns undefined when neither dock shape exposes toggleModel', () => {
    expect(resolveDockController({})).toBeUndefined()
    expect(resolveDockController(undefined)).toBeUndefined()
  })

  it('shows the dock before toggling the plugin model', () => {
    const showDock = vi.fn()
    const toggleModel = vi.fn()

    expect(openPluginDock('reference-analytics-dock', { model: { showDock, toggleModel } })).toBe(true)
    expect(showDock).toHaveBeenCalledWith(true)
    expect(toggleModel).toHaveBeenCalledWith('reference-analytics-dock', true)
    expect(showDock.mock.invocationCallOrder[0]).toBeLessThan(toggleModel.mock.invocationCallOrder[0])
  })
})
