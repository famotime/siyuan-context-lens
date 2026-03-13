<template>
  <div class="orphan-detail">
    <div class="orphan-detail__controls">
      <span>孤立排序</span>
      <select
        class="orphan-detail__select"
        :value="orphanSort"
        @change="onSortChange"
      >
        <option value="updated-desc">按更新时间</option>
        <option value="created-desc">按创建时间</option>
        <option value="title-asc">按标题</option>
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
import type { OrphanSort } from '@/analytics/analysis'
import type { SummaryDetailItem } from '@/analytics/summary-details'

const props = defineProps<{
  items: SummaryDetailItem[]
  orphanSort: OrphanSort
  onUpdateOrphanSort: (value: OrphanSort) => void
  openDocument: (documentId: string) => void
}>()

function onSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as OrphanSort
  props.onUpdateOrphanSort(value)
}
</script>

<style scoped>
.orphan-detail {
  display: grid;
  gap: 12px;
}

.orphan-detail__controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--panel-muted);
}

.orphan-detail__select {
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--surface-card);
  color: inherit;
  font-size: 13px;
}
</style>
