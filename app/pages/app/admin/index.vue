<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {Button} from "@/components/ui/button";

definePageMeta({
  layout: 'home',
  middleware: ['authenticated'],
})
</script>

<template>
  <Card class="relative w-[60vw] mx-auto p-4">
    <CardHeader>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="-ml-2" @click="navigateTo('/app/home')" aria-label="Go back">
          <i class="ri-arrow-left-line" aria-hidden="true"/>
        </Button>
        <CardTitle>Admin Interface</CardTitle>
      </div>
    </CardHeader>
    <CardContent>

      <NuxtLink to="/app/admin/users" class="group block">
        <Card class="h-full transition-all duration-200 group-hover:border-primary/50 group-hover:bg-accent/50 group-hover:shadow-md">
          <div class="flex items-center gap-4 py-2 px-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg border bg-background transition-colors group-hover:text-primary">
              <i class="ri-team-line text-2xl" aria-hidden="true" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold leading-none tracking-tight">Users</h3>
              <p class="mt-1 text-sm text-muted-foreground">Manage users and permissions</p>
            </div>
            <i class="ri-arrow-right-s-line text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </div>
        </Card>
      </NuxtLink>
    </CardContent>
  </Card>
</template>

<style scoped>
</style>