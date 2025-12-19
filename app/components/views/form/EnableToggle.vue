<script setup lang="ts">
import {Switch} from "~/components/ui/switch";

interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Enable Feature',
  description: 'Enable or disable a feature'
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const updateValue = (value: boolean) => {
  emit('update:modelValue', value);
};
</script>
<template>
  <div class="flex items-center justify-between flex-row space-y-0 rounded-md border p-4 py-2 w-full">
    <div>
      <h4 class="font-medium text-base">{{ props.title }}</h4>
      <p class="text-sm text-gray-600">{{ props.description }}</p>
    </div>
    <Switch
        :model-value="props.modelValue"
        @update:model-value="updateValue"
        class="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
    />
  </div>
</template>

<style scoped>

</style>