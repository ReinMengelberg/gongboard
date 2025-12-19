<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useUserStore } from '~/stores/UserStore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import EditButtons from '@/components/views/form/EditButtons.vue'
import EnableToggle from '@/components/views/form/EnableToggle.vue'
import ErrorService from '~/services/utils/ErrorService'
import { navigateTo } from '#imports'

definePageMeta({
  layout: 'home',
  middleware: 'admin',
})

const userStore = useUserStore()

const form = reactive({
  name: '',
  email: '',
  admin: false,
  password: '',
  confirm: '',
})

const dirty = computed(() => {
  return !!(form.name || form.email || form.password || form.confirm || form.admin)
})

function resetForm() {
  form.name = ''
  form.email = ''
  form.admin = false
  form.password = ''
  form.confirm = ''
}

async function save() {
  if (!form.name?.trim()) {
    return ErrorService.returnFalse('warning', 'Name cannot be empty')
  }
  if (!form.email?.trim()) {
    return ErrorService.returnFalse('warning', 'Email cannot be empty')
  }
  if (!form.password?.trim()) {
    return ErrorService.returnFalse('warning', 'Password cannot be empty')
  }
  if (form.password !== form.confirm) {
    return ErrorService.returnFalse('warning', 'Passwords do not match')
  }
  const ok = await userStore.create({
    name: form.name,
    email: form.email,
    password: form.password,
    admin: form.admin,
  })
  if (ok) {
    resetForm()
    navigateTo('/app/admin/users')
  }
}

function discard() {
  resetForm()
}
</script>

<template>
  <div class="p-4 w-[800px]">
    <Card class="w-3xl mx-auto">
      <CardHeader>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="-ml-2" @click="navigateTo('/app/admin/users')" aria-label="Go back">
            <i class="ri-arrow-left-line" aria-hidden="true" />
          </Button>
          <CardTitle>Create user</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid space-y-2">
          <FormField name="name" v-model="form.name" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Full name" class="w-full" v-bind="componentField" />
              </FormControl>
              <FormDescription />
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField name="email" v-model="form.email" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" class="w-full" v-bind="componentField" />
              </FormControl>
              <FormDescription />
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField name="admin" v-model="form.admin" v-slot="{ componentField }">
            <FormItem>
              <FormControl>
                <EnableToggle
                  v-model="form.admin"
                  title="Admin"
                  description="Toggle to grant admin privileges"
                />
              </FormControl>
              <FormDescription />
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField name="password" v-model="form.password" v-slot="{ componentField }">
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" v-bind="componentField" />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField name="confirm_password" v-model="form.confirm" v-slot="{ componentField }">
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" v-bind="componentField" />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex-col items-stretch gap-2">
        <EditButtons
          :dirty="dirty"
          :discard="discard"
          :save="save"
          :saveLabel="'Create user'"
          :discardLabel="'Clear'"
        />
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
</style>