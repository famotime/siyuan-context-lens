import { describe, expect, it } from 'vitest'

import { createActiveDocumentSync, resolveProtyleDocumentId } from './active-document'

type Listener = (event: { detail: any }) => void

class FakeEventBus {
  private listeners = new Map<string, Set<Listener>>()

  on(type: string, listener: Listener) {
    const group = this.listeners.get(type) ?? new Set<Listener>()
    group.add(listener)
    this.listeners.set(type, group)
  }

  off(type: string, listener: Listener) {
    const group = this.listeners.get(type)
    if (!group) {
      return
    }
    group.delete(listener)
    if (group.size === 0) {
      this.listeners.delete(type)
    }
  }

  emit(type: string, detail: any) {
    const group = this.listeners.get(type)
    if (!group) {
      return
    }
    for (const listener of group) {
      listener({ detail })
    }
  }
}

describe('resolveProtyleDocumentId', () => {
  it('prefers root block id over block id and protyle id', () => {
    const documentId = resolveProtyleDocumentId({
      id: 'doc-from-protyle',
      block: {
        id: 'doc-from-block',
        rootID: 'doc-from-root',
      },
    } as any)

    expect(documentId).toBe('doc-from-root')
  })

  it('falls back to block id and protyle id', () => {
    const blockFallback = resolveProtyleDocumentId({
      id: 'doc-from-protyle',
      block: {
        id: 'doc-from-block',
      },
    } as any)

    const protyleFallback = resolveProtyleDocumentId({
      id: 'doc-from-protyle',
      block: {},
    } as any)

    expect(blockFallback).toBe('doc-from-block')
    expect(protyleFallback).toBe('doc-from-protyle')
  })

  it('returns empty string for missing protyle', () => {
    expect(resolveProtyleDocumentId(undefined)).toBe('')
  })
})

describe('createActiveDocumentSync', () => {
  it('notifies when active document changes and can be disposed', () => {
    const eventBus = new FakeEventBus()
    const received: string[] = []

    const dispose = createActiveDocumentSync({
      eventBus: eventBus as any,
      onDocumentId: (documentId) => {
        received.push(documentId)
      },
    })

    eventBus.emit('switch-protyle', { protyle: { block: { rootID: 'doc-1' } } })
    eventBus.emit('loaded-protyle-static', { protyle: { block: { rootID: 'doc-2' } } })

    dispose()

    eventBus.emit('switch-protyle', { protyle: { block: { rootID: 'doc-3' } } })

    expect(received).toEqual(['doc-1', 'doc-2'])
  })
})
