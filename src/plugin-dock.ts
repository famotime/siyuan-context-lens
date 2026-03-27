export interface DockController {
  showDock?: (reset?: boolean) => void
  toggleModel: (
    type: string,
    show?: boolean,
    close?: boolean,
    hide?: boolean,
    isSaveLayout?: boolean,
  ) => void
}

type DockInstanceLike = DockController | {
  model?: DockController | null
}

export function resolveDockController(dockInstance?: DockInstanceLike | null): DockController | undefined {
  if (dockInstance && typeof (dockInstance as DockController).toggleModel === 'function') {
    return dockInstance as DockController
  }

  const nestedDockController = dockInstance && 'model' in dockInstance
    ? dockInstance.model
    : undefined

  if (nestedDockController && typeof nestedDockController.toggleModel === 'function') {
    return nestedDockController
  }

  return undefined
}

export function openPluginDock(dockType: string, dockInstance?: DockInstanceLike | null) {
  const dockController = resolveDockController(dockInstance)
  if (!dockController) {
    return false
  }

  dockController.showDock?.(true)
  dockController.toggleModel(dockType, true)
  return true
}
