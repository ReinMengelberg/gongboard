<script setup lang="ts">
import { cn } from '@/lib/utils'

interface TableActionProps {
  class?: string
  action?: () => void | Promise<void>
}

const props = withDefaults(defineProps<TableActionProps>(), {
  class: ''
})
</script>

<template>
  <button
    :class="cn(
      'text-primary text-sm font-medium cursor-pointer transition-colors',
      props.action ? 'hover:text-primary/80' : 'text-muted-foreground',
      props.class
    )"
    @click.stop="props.action?.()"
  >
    <i class="text-lg ri-arrow-right-s-line"></i>
  </button>
</template> 