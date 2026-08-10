<template>
  <div
    v-if="aiEnabled"
    class="document-ai-panel"
  >
    <div class="document-ai-panel__actions">
      <button
        class="document-ai-panel__button"
        type="button"
        :disabled="!aiConfigReady || aiSuggestionState?.loading"
        @click="onGenerateAiSuggestion(documentId)"
      >
        {{ aiSuggestionState?.result ? t('orphanDetail.regenerateAiSuggestions') : t('orphanDetail.aiSuggestions') }}
      </button>
      <span
        v-if="!aiConfigReady"
        class="document-ai-panel__hint"
      >
        {{ t('orphanDetail.aiConfigHint') }}
      </span>
    </div>

    <div
      v-if="aiSuggestionState?.loading || aiSuggestionState?.error || aiSuggestionState?.result"
      class="document-ai-panel__body"
    >
      <p
        v-if="aiSuggestionState?.loading"
        class="document-ai-panel__status"
      >
        {{ aiSuggestionState?.statusMessage }}
      </p>
      <p
        v-else-if="aiSuggestionState?.error"
        class="document-ai-panel__error"
      >
        {{ aiSuggestionState?.error }}
      </p>
      <div
        v-else-if="aiSuggestionState?.result"
        class="document-ai-panel__result"
      >
        <p class="document-ai-panel__summary">{{ aiSuggestionState.result.summary }}</p>
        <div class="document-ai-panel__groups">
          <section
            v-if="linkSuggestions.length"
            class="document-ai-panel__group"
          >
            <div class="document-ai-panel__group-header">
              <p class="document-ai-panel__group-title">{{ t('orphanDetail.linkSuggestions') }}</p>
              <span class="document-ai-panel__group-meta">{{ t('orphanDetail.itemCount', { count: linkSuggestions.length }) }}</span>
            </div>
            <div class="document-ai-panel__group-list">
              <div
                v-for="suggestion in linkSuggestions"
                :key="`${documentId}-${suggestion.targetDocumentId}`"
                class="document-ai-panel__item document-ai-panel__item--elevated"
              >
                <div class="document-ai-panel__item-top">
                  <button
                    :class="['document-ai-panel__pill', { 'document-ai-panel__pill--active': isAiLinkSuggestionActive(documentId, suggestion.targetDocumentId) }]"
                    type="button"
                    @click="onToggleAiLinkSuggestion(documentId, suggestion.targetDocumentId, suggestion.targetTitle)"
                  >
                    {{ suggestion.targetTitle }}
                  </button>
                  <span class="document-ai-panel__badge">{{ resolveAiConfidenceLabel(suggestion.confidence) }}</span>
                </div>
                <p>{{ suggestion.reason }}</p>
                <p v-if="suggestion.draftText" class="document-ai-panel__draft">{{ suggestion.draftText }}</p>
              </div>
            </div>
          </section>

          <section
            v-if="tagSuggestions.length"
            class="document-ai-panel__group"
          >
            <div class="document-ai-panel__group-header">
              <p class="document-ai-panel__group-title">{{ t('orphanDetail.tagSuggestions') }}</p>
              <span class="document-ai-panel__group-meta">{{ t('orphanDetail.itemCount', { count: tagSuggestions.length }) }}</span>
            </div>
            <div class="document-ai-panel__group-list">
              <div
                v-for="tagSuggestion in tagSuggestions"
                :key="`${documentId}-${tagSuggestion.tag}`"
                class="document-ai-panel__item document-ai-panel__item--elevated"
              >
                <div class="document-ai-panel__item-top">
                  <button
                    :class="['document-ai-panel__pill', { 'document-ai-panel__pill--active': isAiTagSuggestionActive(documentId, tagSuggestion.tag) }]"
                    type="button"
                    @click="onToggleAiTagSuggestion(documentId, tagSuggestion.tag)"
                  >
                    {{ tagSuggestion.tag }}
                  </button>
                  <span class="document-ai-panel__tag-badge">{{ resolveTagSuggestionSourceLabel(tagSuggestion.source) }}</span>
                </div>
                <p v-if="tagSuggestion.reason">{{ tagSuggestion.reason }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n/ui'
import type { AiLinkSuggestionItem, AiLinkTagSuggestion, OrphanAiSuggestionState } from '@/analytics/ai-link-suggestions'

const props = defineProps<{
  documentId: string
  aiEnabled: boolean
  aiConfigReady: boolean
  aiSuggestionState?: OrphanAiSuggestionState
  onGenerateAiSuggestion: (documentId: string) => void | Promise<void>
  onToggleAiLinkSuggestion: (documentId: string, targetDocumentId: string, targetTitle: string) => void | Promise<void>
  isAiLinkSuggestionActive: (documentId: string, targetDocumentId: string) => boolean
  onToggleAiTagSuggestion: (documentId: string, tag: string) => void | Promise<void>
  isAiTagSuggestionActive: (documentId: string, tag: string) => boolean
}>()

function resolveTagSuggestionSourceLabel(source: AiLinkTagSuggestion['source']) {
  return source === 'existing'
    ? t('orphanDetail.existingTag')
    : t('orphanDetail.newTag')
}

function resolveAiConfidenceLabel(confidence: AiLinkSuggestionItem['confidence']) {
  if (confidence === 'high') {
    return t('orphanDetail.confidenceHigh')
  }
  if (confidence === 'low') {
    return t('orphanDetail.confidenceLow')
  }
  return t('orphanDetail.confidenceMedium')
}

const linkSuggestions = computed<AiLinkSuggestionItem[]>(() => {
  return props.aiSuggestionState?.result?.suggestions ?? []
})

const tagSuggestions = computed<AiLinkTagSuggestion[]>(() => {
  const result = props.aiSuggestionState?.result
  const suggestions = result?.suggestions ?? []
  const topLevelTags = result?.tagSuggestions ?? []
  const deduplicated = new Map<string, AiLinkTagSuggestion>()

  const allTagSuggestions = [
    ...topLevelTags,
    ...suggestions.flatMap(suggestion => suggestion.tagSuggestions ?? []),
  ]

  for (const tagSuggestion of allTagSuggestions) {
    const key = tagSuggestion.tag.trim().toLocaleLowerCase()
    if (!key) {
      continue
    }

    const existing = deduplicated.get(key)
    if (!existing) {
      deduplicated.set(key, tagSuggestion)
      continue
    }

    if (existing.source !== 'existing' && tagSuggestion.source === 'existing') {
      deduplicated.set(key, tagSuggestion)
    }
  }

  return [...deduplicated.values()]
})
</script>

<style scoped>
.document-ai-panel {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--panel-border);
}

.document-ai-panel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.document-ai-panel__button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;
  background: color-mix(in srgb, var(--b3-theme-primary) 12%, transparent);
  color: var(--b3-theme-primary);
  font-weight: 600;
}

.document-ai-panel__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.document-ai-panel__hint {
  font-size: 12px;
  color: var(--panel-muted);
}

.document-ai-panel__body {
  display: grid;
  gap: 8px;
  border-radius: 12px;
  padding: 12px;
  background: color-mix(in srgb, var(--b3-theme-primary) 6%, var(--surface-card));
}

.document-ai-panel__status,
.document-ai-panel__error,
.document-ai-panel__summary,
.document-ai-panel__item p {
  margin: 0;
  line-height: 1.65;
}

.document-ai-panel__error {
  color: var(--b3-theme-error);
}

.document-ai-panel__result {
  display: grid;
  gap: 8px;
}

.document-ai-panel__groups {
  display: grid;
  gap: 12px;
}

.document-ai-panel__group {
  display: grid;
  gap: 8px;
}

.document-ai-panel__group-header,
.document-ai-panel__item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.document-ai-panel__group-header {
  align-items: baseline;
}

.document-ai-panel__badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--b3-theme-primary) 12%, transparent);
  color: var(--b3-theme-primary);
  font-size: 12px;
  text-transform: uppercase;
}

.document-ai-panel__group-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--b3-theme-primary) 78%, var(--b3-theme-on-background));
}

.document-ai-panel__group-meta {
  font-size: 12px;
  color: var(--panel-muted);
}

.document-ai-panel__group-list {
  display: grid;
  gap: 8px;
}

.document-ai-panel__item {
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
}

.document-ai-panel__item--elevated {
  background: color-mix(in srgb, var(--surface-card) 88%, white);
  border: 1px solid color-mix(in srgb, var(--b3-theme-primary) 12%, var(--panel-border));
  box-shadow: 0 1px 2px color-mix(in srgb, var(--b3-theme-on-background) 6%, transparent);
}

.document-ai-panel__pill {
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  background: color-mix(in srgb, var(--b3-theme-primary) 10%, transparent);
  transition: background-color 0.2s, color 0.2s, transform 0.2s;
}

.document-ai-panel__pill:hover {
  background: color-mix(in srgb, var(--b3-theme-primary) 18%, transparent);
}

.document-ai-panel__pill--active {
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #fff);
}

.document-ai-panel__tag-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 12px;
  background: color-mix(in srgb, var(--b3-theme-on-background) 8%, transparent);
  color: var(--panel-muted);
}

.document-ai-panel__draft {
  color: var(--panel-muted);
  font-family: var(--b3-font-family-code, monospace);
  font-size: 12px;
}
</style>
