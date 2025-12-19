<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

const props = defineProps<{
  title?: string
  data: {
    name: string
    color: string
    value: any
  }[]
}>()

/**
 * Can be used to check if the data is empty
 */

// const isEmpty = computed(() => {
//   if (!props.data || props.data.length === 0) {
//     return true
//   }

//   const allValuesZero = props.data.every(item => {
//     const value = typeof item.value === 'number' ? item.value : parseFloat(item.value)
//     return isNaN(value) || value === 0
//   })

//   return allValuesZero
// })
</script>

<template>
  <Card class="text-sm">
    <CardHeader v-if="title" class="p-3 border-b">
      <CardTitle>
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="p-3 min-w-[180px] flex flex-col gap-1">
      <div v-for="(item, key) in data" :key="key" class="flex justify-between">
        <div class="flex items-center">
          <span class="w-2.5 h-2.5 mr-2">
            <svg width="100%" height="100%" viewBox="0 0 30 30">
              <path
                  d=" M 15 15 m -14, 0 a 14,14 0 1,1 28,0 a 14,14 0 1,1 -28,0"
                  :stroke="item.color"
                  :fill="item.color"
                  stroke-width="1"
              />
            </svg>
          </span>
          <span>{{ item.name }}</span>
        </div>
        <span class="font-semibold ml-4">{{ item.value }}</span>
      </div>
    </CardContent>
  </Card>
</template>