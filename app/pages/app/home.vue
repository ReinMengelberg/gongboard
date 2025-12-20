
<script setup lang="ts">
import { useAuthStore } from '~/stores/AuthStore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import gongboardLight from '~/public/gongboard_light.png'
import gongboardDark from '~/public/gongboard_dark.png'
import putfasdGif from '~/public/putfasd.gif'

definePageMeta({
  layout: 'home',
  middleware: 'authenticated',
})

const auth = useAuthStore()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

</script>

<template>
  <Card class="relative mx-auto w-[80vw] h-[80vh]">
    <CardHeader class="flex flex-col items-center gap-6">
      <img :src="isDark ? gongboardLight : gongboardDark" alt="Logo" class="h-20 w-120" />
      <CardTitle class="text-primary text-center text-3xl font-medium">
        Welcome back<span v-if="auth.user?.name">, {{ auth.user.name }}</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="h-full px-60 space-y-10">
      <div class="rounded-lg overflow-hidden shadow-lg border-2">
        <img :src="putfasdGif" alt="jordan" class="object-cover w-full h-full">
      </div>
      <NuxtLink to="/app/dashboard" class="group block">
        <Card class="h-full transition-all duration-200 group-hover:border-primary/50 group-hover:bg-accent/50 group-hover:shadow-md">
          <div class="flex items-center gap-4 py-2 px-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg border bg-background transition-colors group-hover:text-primary">
              <i class="ri-rocket-2-line text-2xl" aria-hidden="true" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold leading-none tracking-tight">Dashboard</h3>
              <p class="mt-1 text-sm text-muted-foreground">Overview current sales activity</p>
            </div>
            <i class="ri-arrow-right-s-line text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </div>
        </Card>
      </NuxtLink>
    </CardContent>

    <CardFooter class="gap-3 items-center border-t pt-4">
      <Button variant="outline" :disabled="auth.loading" @click=" auth.logout()" class="cursor-pointer">
        <i class="ri-logout-circle-r-line" aria-hidden="true" />
        {{ auth.loading ? 'Logging out…' : 'Logout' }}
      </Button>

      <div class="ml-auto flex gap-3">
        <Button @click="navigateTo('/app/settings')" class="cursor-pointer">
          <i class="ri-user-settings-line" aria-hidden="true" />
          Settings
        </Button>
        <Button v-if="auth.isAdmin" @click="navigateTo('/app/admin')" class="cursor-pointer">
          <i class="ri-settings-2-fill" aria-hidden="true" />
          Admin
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<style scoped>
</style>