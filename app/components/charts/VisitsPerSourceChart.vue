<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart } from '@/components/ui/chart-bar'
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

// Accept a simple counts map per source, aggregated by VisitTransformer.transformPerSource
const props = defineProps<{
  counts?: Record<string, number> | null
  loading: boolean
  // Fixed height in pixels for the chart container
  height?: number
  title?: string
  description?: string
}>()

// Transform counts map into the format required by BarChart
const data = computed(() => {
  const c = props.counts ?? {}
  const entries = Object.entries(c)
  // Keep stable sort by source name for consistent rendering
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, total]) => ({ source, Visits: total }))
})

// Only one category: total visits
const categories = ['Visits']

// Y-axis tick formatter similar to other charts
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
        <CardTitle>{{ title || 'Visits per Source' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 420}px` }">
        <SpinningLoader v-if="loading" />
        <BarChart
          v-else-if="data.length"
          :data="data"
          :index="'source'"
          :categories="categories"
          :y-formatter="yTickFormatter"
          :show-y-axis="true"
          :show-legend="false"
          :show-grid-line="true"
          :colors="['blue']"
          :rounded-corners="1"
          :custom-tooltip="CustomTooltip"
        />
        <div v-else class="text-sm text-muted-foreground">No per-source visit data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>