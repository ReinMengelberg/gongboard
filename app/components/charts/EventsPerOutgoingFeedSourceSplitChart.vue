<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart } from '@/components/ui/chart-bar'
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

// Props accept nested counts per outgoing feed split by source
const props = defineProps<{
  counts?: Record<string, Record<string, number>> | null
  loading?: boolean
  height?: number
  title?: string
  description?: string
}>()

// Collect all unique sources across feeds to build consistent stacked categories
const categories = computed<string[]>(() => {
  const c = props.counts ?? {}
  const set = new Set<string>()
  for (const feed of Object.keys(c)) {
    const perSource = c[feed] || {}
    for (const src of Object.keys(perSource)) set.add(src)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

// Transform into BarChart data: [{ feed, src1: n, src2: n, ... }, ...]
const data = computed(() => {
  const c = props.counts ?? {}
  const cats = categories.value
  return Object.entries(c)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([feed, perSource]) => {
      const row: Record<string, number | string> = { feed }
      for (const cat of cats) {
        row[cat] = perSource?.[cat] ?? 0
      }
      return row
    })
})

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
        <CardTitle>{{ title || 'Events per Outgoing Feed (by Source)' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 420}px` }">
        <SpinningLoader v-if="loading" />
        <BarChart
          v-else-if="data.length && categories.length"
          :data="data"
          :index="'feed'"
          :categories="categories"
          :y-formatter="yTickFormatter"
          :show-y-axis="true"
          :show-legend="true"
          :show-grid-line="true"
          :type="'stacked'"
          :rounded-corners="1"
          :custom-tooltip="CustomTooltip"
        />
        <div v-else class="text-sm text-muted-foreground">No per-feed-by-source event data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>