<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import PasswordInput from "@/components/views/form/PasswordInput.vue"
import { useAuthStore } from "~/stores/AuthStore"

definePageMeta({
  layout: "auth",
  middleware: "unauthenticated"
})

const auth = useAuthStore()

const formSchema = toTypedSchema(z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
    password: '',
  },
})

const onSubmit = form.handleSubmit(async (values) => {
  await auth.login(values)
})
</script>

<template>
  <div class="mx-auto grid gap-6">
    <div class="grid gap-2 text-center">
      <img src="../../public/gongboard_dark.png" alt="Logo" class="block mx-auto h-28 w-full" />
      <h1 class="text-3xl font-bold">Login</h1>
      <p class="text-balance text-muted-foreground">
        Enter your email below to login to your account
      </p>
    </div>

    <form class="grid gap-4" @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
                type="email"
                placeholder="jordan@strattonoakmont.com"
                v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <div class="flex items-center justify-between">
            <FormLabel>Password</FormLabel>
            <a
                @click="navigateTo('/auth/reset')"
                class="cursor-pointer inline-block text-sm underline"
            >
              Forgot your password?
            </a>
          </div>
          <FormControl>
            <PasswordInput
                placeholder="••••••••"
                v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <p v-if="auth.error" class="text-sm text-destructive font-medium">{{ auth.error }}</p>

      <Button type="submit" class="w-full" :disabled="auth.loading">
        <span v-if="auth.loading">Logging in...</span>
        <span v-else>Login</span>
      </Button>
    </form>
  </div>
</template>