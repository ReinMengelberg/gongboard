<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggleDarkMode(checked: boolean) {
  colorMode.preference = checked ? 'dark' : 'light'
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <ClientOnly>
      <i class="ri-sun-line" :class="{ 'text-foreground': !isDark }" />

      <Switch
          id="dark-mode"
          :model-value="isDark"
          @update:model-value="toggleDarkMode"
      />

      <i class="ri-moon-line" :class="{ 'text-foreground': isDark }" />

    </ClientOnly>
    <Label for="dark-mode">Dark Mode</Label>
  </div>
</template>