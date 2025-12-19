<script setup lang="ts">
interface TableProps {
  class?: string
}

const props = withDefaults(defineProps<TableProps>(), {
  class: ''
})
</script>

<template>
  <table :class="`w-full min-w-full divide-y divide-gray-300 bg-white ${props.class}`">
    <slot />
  </table>
</template>