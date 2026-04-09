import type { DocumentRecord, ReferenceGraphReport, TrendReport } from './analysis'
import { buildThemeWikiPageTitle } from './wiki-page-model'
import type { WikiScopeResult } from './wiki-scope'
import type { PluginConfig } from '@/types/config'

export const WIKI_LLM_OUTPUT_KEYS = [
  'overview',
  'keyDocuments',
  'structureObservations',
  'evidence',
  'actions',
] as const

export interface WikiDocumentSummaryItem {
  documentId: string
  title: string
  summaryShort: string
  summaryMedium: string
  keywords: string[]
  evidenceSnippets: string[]
  updatedAt: string
}

export interface WikiThemeGenerationPayload {
  themeName: string
  pageTitle: string
  themeDocumentId: string
  themeDocumentTitle: string
  sourceDocuments: WikiDocumentSummaryItem[]
  signals: {
    coreDocuments: WikiDocumentSummaryItem[]
    bridgeDocuments: WikiDocumentSummaryItem[]
    propagationDocuments: WikiDocumentSummaryItem[]
    orphanDocuments: WikiDocumentSummaryItem[]
    risingDocuments: WikiDocumentSummaryItem[]
    fallingDocuments: WikiDocumentSummaryItem[]
  }
  evidence: string[]
}

export interface WikiGenerationPayloadBundle {
  themes: WikiThemeGenerationPayload[]
  unclassifiedDocuments: WikiDocumentSummaryItem[]
}

export function buildWikiGenerationPayloads(params: {
  config: Pick<PluginConfig, 'wikiPageSuffix'>
  scope: WikiScopeResult
  report: ReferenceGraphReport
  trends: TrendReport
  documentMap: ReadonlyMap<string, DocumentRecord>
  getDocumentSummary: (document: DocumentRecord) => {
    summaryShort: string
    summaryMedium: string
    keywords: string[]
    evidenceSnippets: string[]
    updatedAt: string
  }
}): WikiGenerationPayloadBundle {
  const rankingIds = new Set(params.report.ranking.map(item => item.documentId))
  const bridgeIds = new Set(params.report.bridgeDocuments.map(item => item.documentId))
  const propagationIds = new Set(params.report.propagationNodes.map(item => item.documentId))
  const orphanIds = new Set(params.report.orphans.map(item => item.documentId))
  const risingIds = new Set(params.trends.risingDocuments.map(item => item.documentId))
  const fallingIds = new Set(params.trends.fallingDocuments.map(item => item.documentId))

  return {
    themes: params.scope.themeGroups.map((group) => {
      const sourceDocuments = group.sourceDocumentIds
        .map(documentId => buildSummaryItem(documentId, params.documentMap, params.getDocumentSummary))
        .filter((item): item is WikiDocumentSummaryItem => item !== null)

      return {
        themeName: group.themeName,
        pageTitle: buildThemeWikiPageTitle(group.themeDocumentTitle, params.config.wikiPageSuffix ?? ''),
        themeDocumentId: group.themeDocumentId,
        themeDocumentTitle: group.themeDocumentTitle,
        sourceDocuments,
        signals: {
          coreDocuments: sourceDocuments.filter(item => rankingIds.has(item.documentId)),
          bridgeDocuments: sourceDocuments.filter(item => bridgeIds.has(item.documentId)),
          propagationDocuments: sourceDocuments.filter(item => propagationIds.has(item.documentId)),
          orphanDocuments: sourceDocuments.filter(item => orphanIds.has(item.documentId)),
          risingDocuments: sourceDocuments.filter(item => risingIds.has(item.documentId)),
          fallingDocuments: sourceDocuments.filter(item => fallingIds.has(item.documentId)),
        },
        evidence: buildThemeEvidence(group.sourceDocumentIds, params.report, params.documentMap),
      }
    }),
    unclassifiedDocuments: params.scope.unclassifiedDocuments
      .map(document => buildSummaryItem(document.id, params.documentMap, params.getDocumentSummary))
      .filter((item): item is WikiDocumentSummaryItem => item !== null),
  }
}

function buildSummaryItem(
  documentId: string,
  documentMap: ReadonlyMap<string, DocumentRecord>,
  getDocumentSummary: (document: DocumentRecord) => {
    summaryShort: string
    summaryMedium: string
    keywords: string[]
    evidenceSnippets: string[]
    updatedAt: string
  },
): WikiDocumentSummaryItem | null {
  const document = documentMap.get(documentId)
  if (!document) {
    return null
  }
  const summary = getDocumentSummary(document)

  return {
    documentId,
    title: document.title || document.hpath || document.path || document.id,
    summaryShort: summary.summaryShort,
    summaryMedium: summary.summaryMedium,
    keywords: [...summary.keywords],
    evidenceSnippets: [...summary.evidenceSnippets],
    updatedAt: summary.updatedAt,
  }
}

function buildThemeEvidence(
  sourceDocumentIds: string[],
  report: ReferenceGraphReport,
  documentMap: ReadonlyMap<string, DocumentRecord>,
): string[] {
  const sourceDocumentIdSet = new Set(sourceDocumentIds)
  const evidence: string[] = []

  for (const targetDocumentId of sourceDocumentIds) {
    const refs = report.evidenceByDocument[targetDocumentId] ?? []
    for (const ref of refs) {
      if (!sourceDocumentIdSet.has(ref.sourceDocumentId)) {
        continue
      }
      const sourceTitle = resolveTitle(documentMap.get(ref.sourceDocumentId), ref.sourceDocumentId)
      const targetTitle = resolveTitle(documentMap.get(targetDocumentId), targetDocumentId)
      evidence.push(`${sourceTitle} -> ${targetTitle}：${ref.content}`)
    }
  }

  return evidence
}

function resolveTitle(document: DocumentRecord | undefined, fallbackId: string): string {
  return document?.title || document?.hpath || document?.path || fallbackId
}
