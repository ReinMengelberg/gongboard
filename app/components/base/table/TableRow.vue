<script setup lang="ts">
import { cn } from '@/lib/utils'

interface TableRowProps {
  class?: string
  onClick?: () => void | Promise<void>
  selected?: boolean
}

const props = withDefaults(defineProps<TableRowProps>(), {
  class: '',
  selected: false
})
</script>

<template>
  <tr
      :class="cn(
      // base classes (empty for now)
      '',
      // selected styles (override hover)
      props.selected
        ? 'cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-800/30 dark:text-blue-300 !border-l-4 !border-l-blue-500'
        // non-selected hover only when clickable
        : (props.onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900' : ''),

      // allow callers to extend
      props.class
    )"
      @click="props.onClick?.()"
  >
    <slot />
  </tr>
</template>

