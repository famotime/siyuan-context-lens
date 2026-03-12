import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
  lsNotebooksMock: vi.fn(),
  sqlMock: vi.fn(),
}))

vi.mock('@/api', () => ({
  lsNotebooks: apiMocks.lsNotebooksMock,
  sql: apiMocks.sqlMock,
}))

import { loadAnalyticsSnapshot } from './siyuan-data'

describe('loadAnalyticsSnapshot', () => {
  beforeEach(() => {
    apiMocks.sqlMock.mockReset()
    apiMocks.lsNotebooksMock.mockReset()
  })

  it('adds siyuan internal links to the aggregated document references', async () => {
    apiMocks.sqlMock.mockImplementation(async (query: string) => {
      if (query.includes('FROM refs r')) {
        return [
          {
            id: 'ref-1',
            sourceBlockId: '20260311120003-srcblk1',
            sourceDocumentId: '20260311120000-srcdoc1',
            targetBlockId: '20260311120001-tgtdoc1',
            targetDocumentId: '20260311120001-tgtdoc1',
            content: '[[Target B]]',
            sourceUpdated: '20260311123000',
          },
        ]
      }

      if (query.includes("WHERE type = 'd'")) {
        return [
          {
            id: '20260311120000-srcdoc1',
            box: 'box-1',
            path: '/a.sy',
            hpath: '/A',
            title: 'Source A',
            tag: '#index',
            created: '20260310120000',
            updated: '20260311120000',
          },
          {
            id: '20260311120001-tgtdoc1',
            box: 'box-1',
            path: '/b.sy',
            hpath: '/B',
            title: 'Target B',
            tag: '#topic',
            created: '20260310121000',
            updated: '20260311120000',
          },
          {
            id: '20260311120002-tgtdoc2',
            box: 'box-1',
            path: '/c.sy',
            hpath: '/C',
            title: 'Target C',
            tag: '#topic',
            created: '20260310122000',
            updated: '20260311120000',
          },
        ]
      }

      if (query.includes("LIKE '%siyuan://%'")) {
        return [
          {
            id: '20260311120004-srcblk2',
            rootId: '20260311120000-srcdoc1',
            markdown: [
              '[C](siyuan://blocks/20260311120005-tgtblk2)',
              '[B](siyuan://blocks/20260311120001-tgtdoc1?focus=1)',
              '[Plugin](siyuan://plugins/sample)',
            ].join(' '),
            updated: '20260311124000',
          },
        ]
      }

      if (query.includes('SELECT id, root_id AS rootId')) {
        return [
          {
            id: '20260311120005-tgtblk2',
            rootId: '20260311120002-tgtdoc2',
          },
          {
            id: '20260311120001-tgtdoc1',
            rootId: '20260311120001-tgtdoc1',
          },
        ]
      }

      return []
    })

    apiMocks.lsNotebooksMock.mockResolvedValue({
      notebooks: [
        {
          id: 'box-1',
          name: 'Notebook',
        },
      ],
    })

    const snapshot = await loadAnalyticsSnapshot()

    expect(snapshot.references.map(reference => ({
      sourceDocumentId: reference.sourceDocumentId,
      targetDocumentId: reference.targetDocumentId,
    }))).toEqual(
      expect.arrayContaining([
        {
          sourceDocumentId: '20260311120000-srcdoc1',
          targetDocumentId: '20260311120001-tgtdoc1',
        },
        {
          sourceDocumentId: '20260311120000-srcdoc1',
          targetDocumentId: '20260311120002-tgtdoc2',
        },
      ]),
    )
    expect(snapshot.references).toHaveLength(3)
  })
})
