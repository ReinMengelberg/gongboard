<!-- Vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart } from '@/components/ui/chart-line'
import CustomTooltip from '@/components/charts/CustomToolTip.vue'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

const props = defineProps<{
  series?: { date: string; Visits: number }[] | null
  loading: boolean
  // New: fixed height in pixels; chart container uses this height
  height?: number
  title?: string
  description?: string
}>()

const series = computed(() => props.series ?? [])

// Y-axis formatter - follows shadcn type signature
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
        <CardTitle>{{ title || 'Visits Over Time' }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div :style="{ height: `${height ?? 420}px` }">
        <SpinningLoader v-if="loading" />
        <LineChart
            v-else-if="series.length"
            :data="series"
            :index="'date'"
            :categories="['Visits']"
            :y-formatter="yTickFormatter"
            :show-y-axis="true"
            :show-legend="true"
            :show-grid-line="true"
            :colors="['blue']"
            :stroke-width="2"
            :custom-tooltip="CustomTooltip"
        />
        <div v-else class="text-sm text-muted-foreground">No visit data for selected range.</div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>



