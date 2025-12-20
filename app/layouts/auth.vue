<script setup lang="ts">
import gongboardLight from '~/public/gongboard_light.png'
import gongboardDark from '~/public/gongboard_dark.png'
import cityImage from '~/public/city.jpg'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <div class="w-full lg:grid min-h-dvh lg:grid-cols-2">
    <div class="flex items-center justify-center py-12">
      <div class="w-full max-w-lg">
        <img :src="isDark ? gongboardLight : gongboardDark" alt="Logo" class="block mx-auto h-20 w-auto mb-4" />
        <slot />
      </div>
    </div>
    <div class="hidden bg-muted lg:block relative">
      <img
          :src="cityImage"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
