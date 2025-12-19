<script setup lang="ts">
import { onMounted } from 'vue'
import SearchBar from '~/components/query/SearchBar.vue'
import PaginationController from '~/components/query/PaginationController.vue'
import UserTable from '~/components/models/user/UserTable.vue'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import { useUserStore } from '~/stores/UserStore'
import { useAuthStore } from '~/stores/AuthStore'
import {Button} from "@/components/ui/button";

const users = useUserStore()
const auth = useAuthStore()

definePageMeta({
  name: 'Users',
  layout: 'home',
  middleware: ['authenticated'],
})

onMounted(async () => {
  // Initial load
  await users.load(users.search || '', users.filters || {}, users.sort, users.order, 1, users.per_page || 10)
})
</script>

<template>
  <Card class="relative w-[800px] mx-auto p-4">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="-ml-2" @click="navigateTo('/app/admin')" aria-label="Go back">
            <i class="ri-arrow-left-line" aria-hidden="true"/>
          </Button>
          <CardTitle>Users</CardTitle>
        </div>


        <div class="pt-2">
          <Button size="sm" class="ml-4" @click="navigateTo('/app/admin/users/create')" aria-label="Create user">
            <i class="ri-user-add-line" aria-hidden="true" />
            <span class="ml-2">Create</span>
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <SearchBar
          :store="users"
          :showSort="false"
          :showFilters="false"
          :debounce="300"
          searchPlaceholder="Search users..."
      />
      <UserTable
          :users="users"
          :auth="auth"
          view="arrow"
          @select="(user: User) => navigateTo(`/app/admin/users/${user.id}`)"
      />
      <PaginationController :store="users" />
    </CardContent>
  </Card>
</template>

<style scoped>
</style>