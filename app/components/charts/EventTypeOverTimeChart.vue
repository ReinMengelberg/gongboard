<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart } from '@/components/ui/chart-line'
import {colors} from "~/src/data/colors"
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

const props = defineProps<{
  // points like { date: 'YYYY-MM-DD', [type: string]: number }
  series?: Array<Record<string, number | string>> | null
  loading?: boolean
  height?: number
  title?: string
  description?: string
}>()

const data = computed(() => props.series ?? [])

const categories = computed<string[]>(() => {
  const set = new Set<string>()
  for (const p of data.value) {
    for (const k of Object.keys(p)) {
      if (k !== 'date') set.add(k)
    }
  }
  return Array.from(set).sort()
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
        <CardTitle>{{ title || 'Event Types Over Time' }}</CardTitle>
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
        <div v-else class="text-sm text-muted-foreground">No per-type event data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>