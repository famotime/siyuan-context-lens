export type PanelCollapseState<K extends string = string> = Partial<Record<K, boolean>>

export function buildPanelCollapseState<K extends string>(
  keys: readonly K[],
  previous: PanelCollapseState<K> = {},
): PanelCollapseState<K> {
  const next: PanelCollapseState<K> = {}
  for (const key of keys) {
    next[key] = previous[key] ?? true
  }
  return next
}

export function togglePanelCollapse<K extends string>(
  state: PanelCollapseState<K>,
  key: K,
): PanelCollapseState<K> {
  if (!(key in state)) {
    return state
  }
  return {
    ...state,
    [key]: !state[key],
  }
}
