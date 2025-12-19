<script setup lang="ts">

import ColorModeToggle from "~/components/utils/ColorModeToggle.vue";
</script>

<template>
  <div class="absolute inset-0 -z-10 h-full w-full
              bg-white dark:bg-slate-950
              bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]
              dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)]
              bg-[size:6rem_4rem]">

    <div class="absolute top-6 right-6 z-50">
      <ColorModeToggle />
    </div>

    <div class="absolute bottom-0 left-0 right-0 top-0
                bg-[radial-gradient(circle_500px_at_50%_200px,rgba(234,179,8,0.05),transparent)]
                dark:bg-[radial-gradient(circle_500px_at_50%_200px,rgba(234,179,8,0.15),transparent)]"></div>
    <div class="flex absolute inset-0 items-center justify-center">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>

</style>