<script setup lang="ts">
import {ref, reactive, watch, computed} from 'vue'
import {useRoute} from '#imports'
import {useUserStore} from '~/stores/UserStore'
import {Card, CardHeader, CardTitle, CardContent, CardFooter} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage} from '@/components/ui/form'
import {Switch} from '@/components/ui/switch'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import NotificationService from '~/services/utils/NotificationService'
import ErrorService from '~/services/utils/ErrorService'
import EditButtons from '@/components/views/form/EditButtons.vue'
import EnableToggle from "@/components/views/form/EnableToggle.vue";
import DeleteInterface from "@/components/utils/DeleteInterface.vue";

definePageMeta({
  layout: 'home',
  middleware: 'admin',
})

const route = useRoute()
const userStore = useUserStore()

// Inline form state
const form = reactive({name: '', email: '', admin: false})

function resetFormFromActive() {
  form.name = userStore.active?.name || ''
  form.email = userStore.active?.email || ''
  form.admin = !!userStore.active?.admin
}

// Load the selected user when route param changes
watch(
    () => route.params.user_id,
    async (param) => {
      const id = Number(param)
      if (id && !Number.isNaN(id)) {
        await userStore.view(id)
        resetFormFromActive()
      } else {
        userStore.active = null
        resetFormFromActive()
      }
    },
    {immediate: true}
)

watch(
    () => userStore.active,
    (val) => {
      if (val) resetFormFromActive()
    }
)

const dirty = computed(() => {
  const a = userStore.active
  if (!a) return false
  return (
      form.name !== (a.name || '') ||
      form.email !== (a.email || '') ||
      form.admin !== !!a.admin
  )
})

async function saveChanges() {
  const id = userStore.active?.id
  if (!id) {
    ErrorService.returnFalse('error', 'No active user')
    return
  }
  const a = userStore.active!
  const payload: any = {}
  if (form.name !== a.name) {
    if (!form.name?.trim()) {
      ErrorService.returnFalse('warning', 'Name cannot be empty')
      return
    }
    payload.name = form.name
  }
  if (form.email !== a.email) {
    if (!form.email?.trim()) {
      ErrorService.returnFalse('warning', 'Email cannot be empty')
      return
    }
    payload.email = form.email
  }
  if (form.admin !== a.admin) {
    payload.admin = form.admin
  }
  if (Object.keys(payload).length === 0) {
    return
  }
  const ok = await userStore.update(id, payload)
  if (ok) {
    resetFormFromActive()
  }
}

function discardChanges() {
  resetFormFromActive()
}

// Password form (admin reset: no old password required)
const showPasswordDialog = ref(false)
const passwordUpdating = ref(false)
const passwordForm = reactive({new: '', confirm: ''})

function togglePasswordDialog(force?: boolean) {
  const next = typeof force === 'boolean' ? force : !showPasswordDialog.value
  if (next && !showPasswordDialog.value) {
    passwordForm.new = ''
    passwordForm.confirm = ''
  }
  showPasswordDialog.value = next
}

async function submitPasswordChange() {
  passwordUpdating.value = true
  const id = userStore.active?.id
  if (!id) {
    passwordUpdating.value = false
    return ErrorService.returnFalse('error', 'No active user')
  }
  if (!passwordForm.new || !passwordForm.confirm) {
    passwordUpdating.value = false
    return ErrorService.returnFalse('warning', 'Please fill in all password fields')
  }
  const ok = await userStore.update(id, {
    new_password: passwordForm.new,
    confirm_password: passwordForm.confirm,
  })
  passwordUpdating.value = false
  if (ok) {
    NotificationService.showSuccess('Password updated')
    togglePasswordDialog(false)
  }
}

// Delete user adapter for DeleteInterface
const deleteUser = async (id: string, password?: string): Promise<boolean> => {
  const numId = Number(id)
  if (!numId || Number.isNaN(numId)) {
    return ErrorService.returnFalse('error', 'Invalid user id')
  }
  if (!password) {
    return ErrorService.returnFalse('warning', 'Password is required')
  }
  return await userStore.destroy(numId, password)
}

const afterDeleteSuccess = async () => {
  await navigateTo('/app/admin/users')
}
</script>

<template>
  <Card class="w-[60vw] p-4 mx-auto">
    <CardHeader>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="-ml-2" @click="navigateTo('/app/admin/users')"
                aria-label="Go back">
          <i class="ri-arrow-left-line" aria-hidden="true"/>
        </Button>
        <CardTitle>Edit user</CardTitle>
      </div>
    </CardHeader>

    <CardContent>
      <div class="grid space-y-2">
        <!-- Name (full width) -->
        <FormField name="name" v-model="form.name" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Full name" :disabled="!userStore.active" class="w-full"
                     v-bind="componentField"/>
            </FormControl>
            <FormDescription/>
            <FormMessage/>
          </FormItem>
        </FormField>

        <!-- Email (full width) -->
        <FormField name="email" v-slot="{ componentField }" v-model="form.email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="you@example.com" :disabled="!userStore.active" class="w-full"
                     v-bind="componentField"/>
            </FormControl>
            <FormDescription/>
            <FormMessage/>
          </FormItem>
        </FormField>

        <!-- Admin (inline toggle) -->
        <FormField name="admin" v-slot="{ componentField }" v-model="form.admin">
          <FormItem>
            <FormControl>
              <EnableToggle
                  v-model="form.admin"
                  :disabled="!userStore.active"
                  title="Admin"
                  description="Toggle to grant or revoke admin privileges"
              />
            </FormControl>
            <FormDescription/>
            <FormMessage/>
          </FormItem>
        </FormField>

        <!-- Password (dialog only, with button) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div class="grid gap-2 sm:col-span-2">
            <label class="text-sm font-medium text-foreground">Password</label>
            <Input
                :model-value="'************'"
                type="password"
                disabled
            />
          </div>
          <div class="flex sm:justify-end sm:col-span-1">
            <Button class="w-full" size="sm" @click="togglePasswordDialog(true)">
              <i class="ri-lock-password-line" aria-hidden="true"/>
              Set password
            </Button>
          </div>
        </div>

        <DeleteInterface
            :model="userStore.active"
            :delete="deleteUser"
            :after-success="afterDeleteSuccess"
            title="Delete user"
            description="Permanently delete this user and all associated data. This action cannot be undone."
            trigger-label="Delete user"
            dialog-title="Confirm user deletion"
            dialog-description="This action cannot be undone. Please enter your password to confirm."
            confirm-label="Delete user"
            cancel-label="Cancel"
            redirect-path="/app/admin/users"
            :disabled="!userStore.active?.id"
        />

      </div>
    </CardContent>

    <CardFooter class="flex-col items-stretch gap-2">
      <EditButtons :dirty="dirty" :discard="discardChanges" :save="saveChanges"/>
    </CardFooter>
  </Card>

  <!-- Password Dialog -->
  <Dialog :open="showPasswordDialog" @update:open="togglePasswordDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Set new password</DialogTitle>
        <DialogDescription>Admins can set a new password without the old one.</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <FormField name="new_password" v-model="passwordForm.new" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>New password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="New password" v-bind="componentField"/>
            </FormControl>
            <FormDescription/>
            <FormMessage/>
          </FormItem>
        </FormField>
        <FormField name="confirm_password" v-model="passwordForm.confirm" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Confirm new password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Confirm new password" v-bind="componentField"/>
            </FormControl>
            <FormDescription/>
            <FormMessage/>
          </FormItem>
        </FormField>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="togglePasswordDialog(false)">Cancel</Button>
        <Button :disabled="passwordUpdating || !passwordForm.new || !passwordForm.confirm"
                @click="submitPasswordChange">
          <i class="ri-lock-password-line" aria-hidden="true"/>
          {{ passwordUpdating ? 'Saving…' : 'Set password' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
</style>