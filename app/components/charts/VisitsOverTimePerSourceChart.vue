<!-- Vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart } from '@/components/ui/chart-line'
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'
import type { VisitsOverTimePerSource } from '@/services/transformers/VisitTransformer'

const props = defineProps<{
  // Array of points like: { date: 'YYYY-MM-DD', [source: string]: number }
  series?: VisitsOverTimePerSource | null
  loading: boolean
  // Fixed height in pixels for the chart container
  height?: number
  title?: string
  description?: string
}>()

const data = computed(() => props.series ?? [])

// Build dynamic categories from the union of keys (excluding 'date') across the series
const categories = computed<string[]>(() => {
  const set = new Set<string>()
  for (const p of data.value) {
    for (const k of Object.keys(p)) {
      if (k !== 'date') set.add(k)
    }
  }
  return Array.from(set).sort()
})

// Choose a color palette; will slice to number of categories
const basePalette = [
  'blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink', 'yellow', 'indigo', 'cyan', 'slate'
]

const colors = computed(() => {
  const needed = categories.value.length
  // If more categories than palette, repeat pattern
  if (needed <= basePalette.length) return basePalette.slice(0, needed)
  const out: string[] = []
  while (out.length < needed) {
    out.push(...basePalette)
  }
  return out.slice(0, needed)
})

// Y-axis tick formatter similar to the one used in VisitsOverTimeChart
const yTickFormatter = (tick: number) => {
  if (tick === 0) return '0'
  if (Number.isInteger(tick)) {
    return tick >= 1000 ? `${(tick / 1000).toFixed(1)}K` : String(tick)
  }
  return ''
}
</script>

<template>
  <Card class="p-4 h-full">
    <CardHeader class="pt-2">
      <div class="flex min-w-0 flex-col">
        <CardTitle>{{ title || 'Visits Over Time by Source' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 420}px` }">
        <SpinningLoader v-if="loading" />
        <LineChart
          v-else-if="data.length && categories.length"
          :data="data"
          :index="'date'"
          :categories="categories"
          :y-formatter="yTickFormatter"
          :show-y-axis="true"
          :show-legend="true"
          :show-grid-line="true"
          :colors="colors"
          :stroke-width="2"
          :custom-tooltip="CustomTooltip"
        />
        <div v-else class="text-sm text-muted-foreground">No per-source visit data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>