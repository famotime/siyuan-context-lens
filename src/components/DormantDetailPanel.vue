<template>
  <div class="dormant-detail">
    <div class="dormant-detail__controls">
      <span>沉没阈值</span>
      <select
        class="dormant-detail__select"
        :value="dormantDays"
        @change="onDaysChange"
      >
        <option :value="30">30 天</option>
        <option :value="90">90 天</option>
        <option :value="180">180 天</option>
      </select>
    </div>

    <div
      v-if="items.length"
      class="summary-detail-list"
    >
      <article
        v-for="item in items"
        :key="item.documentId"
        class="summary-detail-item"
      >
        <div class="summary-detail-item__header">
          <button
            class="summary-detail-item__title"
            type="button"
            @click="openDocument(item.documentId)"
          >
            {{ item.title }}
          </button>
          <span
            v-if="item.badge"
            class="badge"
          >
            {{ item.badge }}
          </span>
        </div>
        <p class="summary-detail-item__meta">
          {{ item.meta }}
        </p>
        <SuggestionCallout :suggestions="item.suggestions ?? []" />
      </article>
    </div>
    <div
      v-else
      class="empty-state"
    >
      当前卡片下没有可展示的文档。
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SummaryDetailItem } from '@/analytics/summary-details'
import SuggestionCallout from './SuggestionCallout.vue'

const props = defineProps<{
  items: SummaryDetailItem[]
  dormantDays: number
  onUpdateDormantDays: (value: number) => void
  openDocument: (documentId: string) => void
}>()

function onDaysChange(event: Event) {
  const value = Number.parseInt((event.target as HTMLSelectElement).value, 10)
  if (!Number.isNaN(value)) {
    props.onUpdateDormantDays(value)
  }
}
</script>

<style scoped>
.dormant-detail {
  display: grid;
  gap: 12px;
}

.dormant-detail__controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--panel-muted);
}

.dormant-detail__select {
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--surface-card);
  color: inherit;
  font-size: 13px;
}
</style>
