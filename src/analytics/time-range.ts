import { TIME_RANGE_OPTIONS, type TimeRange } from './analysis'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all: '全部时间',
  '3d': '近 3 天',
  '7d': '近 7 天',
  '30d': '近 30 天',
  '60d': '近 60 天',
  '90d': '近 90 天',
}

export function buildTimeRangeOptions() {
  return TIME_RANGE_OPTIONS.map(value => ({
    value,
    label: TIME_RANGE_LABELS[value],
  }))
}
