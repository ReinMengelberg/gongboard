<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  defaultChecked?: boolean
  checked?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  value?: string
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:checked', payload: boolean): void
}>()

const checked = useVModel(props, 'checked', emits, {
  passive: true,
  defaultValue: props.defaultChecked,
})
</script>

<template>
  <SwitchRoot
    v-model:checked="checked"
    :disabled="props.disabled"
    :required="props.required"
    :name="props.name"
    :id="props.id"
    :value="props.value"
    data-slot="switch"
    :class="cn(
      // container styles from shadcn/vue new-york theme
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-[background-color,box-shadow] outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      // states
      'data-[state=unchecked]:bg-input data-[state=checked]:bg-primary',
      props.class,
    )"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn(
        'pointer-events-none block size-5 rounded-full bg-background shadow-xs ring-0 transition-transform',
        'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5',
      )"
    />
  </SwitchRoot>
</template>
