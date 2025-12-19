<script setup lang="ts">
interface TableHeadProps {
  class?: string
  scope?: string
  spacing?: number
}

const props = withDefaults(defineProps<TableHeadProps>(), {
  class: '',
  scope: 'col'
})
</script>

<template>
  <th
      :scope="props.scope"
      :class="`sticky top-0 z-10 py-2 px-3 text-left text-xs font-semibold bg-secondary text-gray-600 whitespace-nowrap ${props.class}`"
      :style="`width: ${props.spacing}fr`"
  >
    <slot />
  </th>
</template>