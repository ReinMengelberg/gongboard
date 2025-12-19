<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart } from '@/components/ui/chart-bar'
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

const props = defineProps<{
  counts?: Record<string, number> | null
  loading?: boolean
  height?: number
  title?: string
  description?: string
}>()

const data = computed(() => {
  const c = props.counts ?? {}
  return Object.entries(c)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([feed, total]) => ({ feed, Events: total }))
})

const categories = ['Events']

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
        <CardTitle>{{ title || 'Events per Outgoing Feed' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 420}px` }">
        <SpinningLoader v-if="loading" />
        <BarChart
          v-else-if="data.length"
          :data="data"
          :index="'feed'"
          :categories="categories"
          :y-formatter="yTickFormatter"
          :show-y-axis="true"
          :show-legend="false"
          :show-grid-line="true"
          :colors="['purple']"
          :rounded-corners="1"
          :custom-tooltip="CustomTooltip"
        />
        <div v-else class="text-sm text-muted-foreground">No per-feed event data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>