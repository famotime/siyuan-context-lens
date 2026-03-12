import type { ReferenceRecord } from './analysis'

interface InternalLinkSourceRow {
  id: string
  rootId: string
  markdown: string | null
  updated: string | null
}

interface InternalLinkTargetRow {
  id: string
  rootId: string
}

const SIYUAN_URL_PATTERN = /siyuan:\/\/[^\s<>"')\]]+/g
const SIYUAN_BLOCK_ID_PATTERN = /\d{14}-[a-z0-9]{7}/gi

export function collectInternalLinkTargetIds(sourceRows: InternalLinkSourceRow[]): string[] {
  const targetIds = new Set<string>()

  for (const row of sourceRows) {
    for (const url of extractSiyuanUrls(row.markdown ?? '')) {
      for (const blockId of extractBlockIdsFromUrl(url)) {
        targetIds.add(blockId)
      }
    }
  }

  return [...targetIds]
}

export function buildInternalLinkReferences(params: {
  sourceRows: InternalLinkSourceRow[]
  targetRows: InternalLinkTargetRow[]
}): ReferenceRecord[] {
  const targetRootMap = new Map(params.targetRows.map(row => [row.id, row.rootId]))
  const references: ReferenceRecord[] = []

  for (const row of params.sourceRows) {
    const urls = extractSiyuanUrls(row.markdown ?? '')

    urls.forEach((url, urlIndex) => {
      const blockIds = extractBlockIdsFromUrl(url)

      blockIds.forEach((targetBlockId, blockIndex) => {
        const targetDocumentId = targetRootMap.get(targetBlockId)
        if (!targetDocumentId || row.rootId === targetDocumentId) {
          return
        }

        references.push({
          id: `siyuan-link:${row.id}:${targetBlockId}:${urlIndex}:${blockIndex}`,
          sourceBlockId: row.id,
          sourceDocumentId: row.rootId,
          targetBlockId,
          targetDocumentId,
          content: url,
          sourceUpdated: row.updated ?? '',
        })
      })
    })
  }

  return references
}

function extractSiyuanUrls(markdown: string): string[] {
  return markdown.match(SIYUAN_URL_PATTERN) ?? []
}

function extractBlockIdsFromUrl(url: string): string[] {
  return url.match(SIYUAN_BLOCK_ID_PATTERN) ?? []
}
