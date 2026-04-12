import { describe, expect, it } from 'vitest'

import {
  buildGraphAnalysisContext,
  buildTrendAnalysisContext,
} from './analysis-context'

const now = new Date('2026-03-11T00:00:00Z')

describe('buildGraphAnalysisContext', () => {
  it('keeps recently edited documents in the sample while filtering active references to the current window', () => {
    const context = buildGraphAnalysisContext({
      documents: [
        { id: 'doc-a', box: 'box-1', path: '/a.sy', hpath: '/Alpha', title: 'Alpha', tags: ['topic'], created: '20260101090000', updated: '20260310120000' },
        { id: 'doc-b', box: 'box-1', path: '/b.sy', hpath: '/Beta', title: 'Beta', tags: ['topic'], created: '20260102090000', updated: '20260310120000' },
        { id: 'doc-c', box: 'box-1', path: '/c.sy', hpath: '/Gamma', title: 'Gamma', tags: ['archive'], created: '20260103090000', updated: '20260310120000' },
      ],
      references: [
        { id: 'ref-current', sourceDocumentId: 'doc-a', sourceBlockId: 'blk-a1', targetDocumentId: 'doc-b', targetBlockId: 'blk-b1', content: '[[Beta]]', sourceUpdated: '20260310120000' },
        { id: 'ref-old', sourceDocumentId: 'doc-b', sourceBlockId: 'blk-b1', targetDocumentId: 'doc-c', targetBlockId: 'blk-c1', content: '[[Gamma]]', sourceUpdated: '20260105090000' },
      ],
      now,
      timeRange: '7d',
    })

    expect(context.documents.map(document => document.id)).toEqual(['doc-a', 'doc-b', 'doc-c'])
    expect(context.references.map(reference => reference.id)).toEqual(['ref-current'])
    expect(context.allReferences.map(reference => reference.id)).toEqual(['ref-current', 'ref-old'])
  })
})

describe('buildTrendAnalysisContext', () => {
  it('splits current and previous references for the filtered document sample', () => {
    const context = buildTrendAnalysisContext({
      documents: [
        { id: 'doc-a', box: 'box-1', path: '/a.sy', hpath: '/Alpha', title: 'Alpha', tags: ['topic'], created: '20260101090000', updated: '20260310120000' },
        { id: 'doc-b', box: 'box-1', path: '/b.sy', hpath: '/Beta', title: 'Beta', tags: ['topic'], created: '20260102090000', updated: '20260310120000' },
      ],
      references: [
        { id: 'ref-current', sourceDocumentId: 'doc-a', sourceBlockId: 'blk-a1', targetDocumentId: 'doc-b', targetBlockId: 'blk-b1', content: '[[Beta]]', sourceUpdated: '20260310120000' },
        { id: 'ref-previous', sourceDocumentId: 'doc-b', sourceBlockId: 'blk-b1', targetDocumentId: 'doc-a', targetBlockId: 'blk-a1', content: '[[Alpha]]', sourceUpdated: '20260302120000' },
      ],
      now,
      days: 7,
      timeRange: '30d',
    })

    expect(context.documents.map(document => document.id)).toEqual(['doc-a', 'doc-b'])
    expect(context.currentReferences.map(reference => reference.id)).toEqual(['ref-current'])
    expect(context.previousReferences.map(reference => reference.id)).toEqual(['ref-previous'])
  })
})
