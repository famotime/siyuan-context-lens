import type { EventBus, IProtyle } from 'siyuan'

const ACTIVE_DOCUMENT_EVENTS = [
  'switch-protyle',
  'loaded-protyle-static',
  'loaded-protyle-dynamic',
] as const

type ActiveDocumentEvent = typeof ACTIVE_DOCUMENT_EVENTS[number]

export function resolveProtyleDocumentId(protyle?: IProtyle | null): string {
  if (!protyle) {
    return ''
  }
  return protyle.block?.rootID || protyle.block?.id || protyle.id || ''
}

export function createActiveDocumentSync(params: {
  eventBus: Pick<EventBus, 'on' | 'off'>
  onDocumentId: (documentId: string) => void
}) {
  const handler = (event: { detail?: { protyle?: IProtyle } }) => {
    const documentId = resolveProtyleDocumentId(event.detail?.protyle)
    if (documentId) {
      params.onDocumentId(documentId)
    }
  }

  for (const event of ACTIVE_DOCUMENT_EVENTS) {
    params.eventBus.on(event as ActiveDocumentEvent, handler)
  }

  return () => {
    for (const event of ACTIVE_DOCUMENT_EVENTS) {
      params.eventBus.off(event as ActiveDocumentEvent, handler)
    }
  }
}
