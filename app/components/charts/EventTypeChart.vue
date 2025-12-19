<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DonutChart } from '@/components/ui/chart-donut'
import {colors} from "~/src/data/colors"
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
      .map(([type, total]) => ({ type, Events: total }))
})

const valueFormatter = (tick: number, _i?: number, _ticks?: number[]) => {
  if (!Number.isFinite(tick)) return '0'
  return tick >= 1000 ? `${(tick / 1000).toFixed(1)}K` : String(tick)
}
</script>

<template>
  <Card class="p-4 h-full">
    <CardHeader class="pt-2">
      <div class="flex min-w-0 flex-col">
        <CardTitle>{{ title || 'Event Types' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 320}px` }">
        <SpinningLoader v-if="loading" />
        <DonutChart
            v-else-if="data.length"
            :data="data"
            index="type"
            category="Events"
            :colors="colors"
            :show-legend="true"
            :value-formatter="valueFormatter"
            class="h-96"
        />
        <div v-else class="text-sm text-muted-foreground">No event type data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>
