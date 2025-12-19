<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

// Minimal local type to avoid coupling
export type DateRange = {
  start?: string
  end?: string
  label?: string
}

const props = defineProps<{
  title: string
  items?: any[] | null
  // Optional direct value override; used if items is not provided
  value?: number | null
  loading?: boolean
  dateRange?: DateRange | null
  // If provided, sum by this key on each item
  valueKey?: string
  // If provided, use this accessor to get a numeric value per item to sum
  accessor?: ((item: any) => number) | null
  // Optional custom formatter for the final number
  formatter?: ((n: number) => string) | null
}>()

const total = computed<number | null>(() => {
  if (Array.isArray(props.items)) {
    const arr = props.items as any[]
    if (props.accessor) {
      return arr.reduce((acc, it) => acc + (Number(props.accessor!(it)) || 0), 0)
    }
    if (props.valueKey) {
      return arr.reduce((acc, it: any) => acc + (Number(it?.[props.valueKey!]) || 0), 0)
    }
    // Default: count the number of items
    return arr.length
  }
  if (typeof props.value === 'number') return props.value
  return null
})

const showEllipsis = computed(() => !!props.loading || total.value === null || Number.isNaN(total.value as any))

const displayValue = computed(() => {
  if (showEllipsis.value) return '…'
  const n = total.value as number
  return props.formatter ? props.formatter(n) : n.toLocaleString()
})
</script>

<template>
  <Card class="p-4">
    <CardContent class="pt-0">
      <h2 class="font-semibold text-md">{{ props.title }}</h2>
      <div class="text-3xl font-bold">{{ displayValue }}</div>
      <p class="text-xs text-muted-foreground mt-1">
        <span v-if="props.dateRange?.label">{{ props.dateRange.label }}</span>
        <span v-else-if="props.dateRange?.start && props.dateRange?.end">{{ props.dateRange.start }} — {{ props.dateRange.end }}</span>
      </p>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>