<script setup lang="ts">
import { ref } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@/components/ui/input-group'

interface Props {
  modelValue?: string
  placeholder?: string
  showToggle?: boolean
  showStrength?: boolean
  strengthText?: string
  strengthColor?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter password',
  showToggle: true,
  showStrength: false,
  strengthText: 'Weak',
  strengthColor: 'text-muted-foreground'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPassword = ref(false)
</script>

<template>
  <InputGroup>
    <InputGroupInput
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder"
    />

    <InputGroupAddon v-if="showToggle || showStrength" align="inline-end">
      <InputGroupText v-if="showStrength" :class="['text-xs', strengthColor]">
        {{ strengthText }}
      </InputGroupText>

      <InputGroupButton
          v-if="showToggle"
          variant="ghost"
          size="icon-xs"
          class="rounded-full"
          type="button"
          @click.prevent="showPassword = !showPassword"
      >
        <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" />
        <span class="sr-only">
          {{ showPassword ? 'Hide' : 'Show' }} password
        </span>
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</template>