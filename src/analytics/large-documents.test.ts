import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'

import { buildLargeDocumentRankings, buildLargeDocumentSummary, loadLargeDocumentMetrics } from './large-documents'

describe('loadLargeDocumentMetrics', () => {
  it('does not dynamically import the shared api module to avoid mixed import warnings in build output', async () => {
    const source = await readFile(new URL('./large-documents.ts', import.meta.url), 'utf8')

    expect(source).not.toContain("import('@/api')")
  })

  it('combines document file bytes with embedded asset bytes and deduplicates repeated asset stats', async () => {
    const getFile = vi.fn(async (path: string) => {
      if (path === '/data/box-1/alpha.sy') {
        return '12345678'
      }
      if (path === '/data/box-1/beta.sy') {
        return '1234'
      }
      return ''
    })
    const getDocAssets = vi.fn(async (documentId: string) => {
      if (documentId === 'doc-alpha') {
        return [
          'assets/shared.png',
          '/assets/alpha-only.png',
        ]
      }
      if (documentId === 'doc-beta') {
        return [
          { path: '/data/assets/shared.png' },
        ]
      }
      return []
    })
    const statAsset = vi.fn(async (assetPath: string) => {
      if (assetPath === 'assets/shared.png') {
        return { size: 20 }
      }
      if (assetPath === 'assets/alpha-only.png') {
        return { size: 6 }
      }
      return { size: 0 }
    })

    const metrics = await loadLargeDocumentMetrics({
      documents: [
        { id: 'doc-alpha', box: 'box-1', path: '/alpha.sy', hpath: '/Alpha', title: 'Alpha', content: '甲乙丙丁' },
        { id: 'doc-beta', box: 'box-1', path: '/beta.sy', hpath: '/Beta', title: 'Beta', content: '甲乙' },
      ],
      getFile,
      getDocAssets,
      statAsset,
    })

    expect(metrics.get('doc-alpha')).toEqual({
      documentId: 'doc-alpha',
      wordCount: 4,
      documentBytes: 8,
      assetBytes: 26,
      totalBytes: 34,
      assetCount: 2,
    })
    expect(metrics.get('doc-beta')).toEqual({
      documentId: 'doc-beta',
      wordCount: 2,
      documentBytes: 4,
      assetBytes: 20,
      totalBytes: 24,
      assetCount: 1,
    })
    expect(statAsset).toHaveBeenCalledTimes(2)
  })

  it('excludes inline data-image payloads and counts Chinese characters plus natural English words', async () => {
    const metrics = await loadLargeDocumentMetrics({
      documents: [
        {
          id: 'doc-mixed',
          box: 'box-1',
          path: '/mixed.sy',
          hpath: '/Mixed',
          title: 'Mixed',
          content: [
            '你好',
            'hello world',
            `![](data:image/bmp;base64,${'A'.repeat(20000)})`,
            'https://example.com/foo/bar',
            'assets/image.png',
            'foo/bar_baz',
          ].join(' '),
        },
      ],
      getFile: vi.fn(async () => ''),
      getDocAssets: vi.fn(async () => []),
      statAsset: vi.fn(async () => ({ size: 0 })),
    })

    expect(metrics.get('doc-mixed')).toEqual({
      documentId: 'doc-mixed',
      wordCount: 4,
      documentBytes: 0,
      assetBytes: 0,
      totalBytes: 0,
      assetCount: 0,
    })
  })
})

describe('buildLargeDocumentRankings', () => {
  const documents = [
    { id: 'doc-a', box: 'box-1', path: '/a.sy', hpath: '/A', title: 'Alpha', content: '甲'.repeat(10001), updated: '20260312120000' },
    { id: 'doc-b', box: 'box-1', path: '/b.sy', hpath: '/B', title: 'Beta', content: '乙'.repeat(9999), updated: '20260311120000' },
    { id: 'doc-c', box: 'box-1', path: '/c.sy', hpath: '/C', title: 'Gamma', content: '丙'.repeat(15000), updated: '20260310120000' },
    { id: 'doc-d', box: 'box-1', path: '/d.sy', hpath: '/D', title: 'Delta', content: '丁'.repeat(12000), updated: '20260309120000' },
  ] as const

  const metrics = new Map([
    ['doc-a', { documentId: 'doc-a', wordCount: 10001, documentBytes: 10, assetBytes: 4 * 1024 * 1024, totalBytes: 4 * 1024 * 1024 + 10, assetCount: 2 }],
    ['doc-b', { documentId: 'doc-b', wordCount: 9999, documentBytes: 50, assetBytes: 0, totalBytes: 50, assetCount: 0 }],
    ['doc-c', { documentId: 'doc-c', wordCount: 15000, documentBytes: 20, assetBytes: 5, totalBytes: 25, assetCount: 1 }],
    ['doc-d', { documentId: 'doc-d', wordCount: 12000, documentBytes: 2 * 1024 * 1024, assetBytes: 1024 * 1024 + 1, totalBytes: 3 * 1024 * 1024 + 1, assetCount: 3 }],
  ])

  it('filters and sorts large documents by text threshold in descending order', () => {
    expect(buildLargeDocumentRankings({
      documents: [...documents],
      metrics,
      mode: 'words',
    }).map(item => item.documentId)).toEqual(['doc-c', 'doc-d', 'doc-a'])
  })

  it('filters and sorts large documents by storage threshold in descending order', () => {
    expect(buildLargeDocumentRankings({
      documents: [...documents],
      metrics,
      mode: 'storage',
    }).map(item => item.documentId)).toEqual(['doc-a', 'doc-d'])
  })

  it('counts qualified documents separately for text and storage modes', () => {
    expect(buildLargeDocumentSummary({
      documents: [...documents],
      metrics,
    })).toEqual({
      wordDocumentCount: 3,
      storageDocumentCount: 2,
    })
  })

  it('uses natural-language counting when metrics are not precomputed', () => {
    expect(buildLargeDocumentRankings({
      documents: [
        {
          id: 'doc-natural-words',
          box: 'box-1',
          path: '/natural.sy',
          hpath: '/Natural',
          title: 'Natural',
          content: 'hello '.repeat(10001),
          updated: '20260308120000',
        },
        {
          id: 'doc-long-identifier',
          box: 'box-1',
          path: '/identifier.sy',
          hpath: '/Identifier',
          title: 'Identifier',
          content: 'a'.repeat(12000),
          updated: '20260307120000',
        },
      ],
      mode: 'words',
    }).map(item => item.documentId)).toEqual(['doc-natural-words'])
  })
})
