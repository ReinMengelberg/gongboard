<script setup lang="ts">
import { useAuthStore } from '~/stores/AuthStore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

definePageMeta({
  layout: 'home',
  middleware: 'authenticated',
})

const auth = useAuthStore()

</script>

<template>
  <Card class="relative mx-auto w-[80vw] h-[80vh]">
    <CardHeader class="flex flex-col items-center gap-6">
      <img src="../../public/gongboard.png" alt="Logo" class="h-20 w-120" />
      <CardTitle class="text-center text-gray-600 text-3xl font-medium">
        Welcome back<span v-if="auth.user?.name">, {{ auth.user.name }}</span>
      </CardTitle>
    </CardHeader>



    <CardContent class="h-full">
      LETSGO!
    </CardContent>

    <CardFooter class="gap-3 items-center border-t pt-4">
      <Button variant="outline" :disabled="auth.loading" @click=" auth.logout()">
        <i class="ri-logout-circle-r-line" aria-hidden="true" />
        {{ auth.loading ? 'Logging out…' : 'Logout' }}
      </Button>

      <div class="ml-auto flex gap-3">
        <Button @click="navigateTo('/app/settings')">
          <i class="ri-user-settings-line" aria-hidden="true" />
          Settings
        </Button>
        <Button v-if="auth.isAdmin" @click="navigateTo('/app/admin')">
          <i class="ri-settings-2-fill" aria-hidden="true" />
          Admin
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<style scoped>
</style>