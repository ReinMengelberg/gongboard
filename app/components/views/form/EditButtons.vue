<script setup lang="ts">
import ConfirmationDialog from "~/components/utils/dialog/ConfirmationDialog.vue";
import { ref, onMounted, onUnmounted } from 'vue';


export interface DialogConfig {
  type: 'confirmation' | 'delete' | 'delete-password';
  condition?: boolean;
  triggerLabel?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  action: () => Promise<any>;
  afterSuccess?: () => Promise<any>;
  disabled?: boolean;
}

interface Props {
  dirty: boolean;
  discard: () => void;
  save: () => Promise<any>;
  dialogs?: DialogConfig[];
  saveLabel?: string;
  discardLabel?: string;
  size?: 'sm' | 'md' | 'default';
}

const props = withDefaults(defineProps<Props>(), {
  saveLabel: 'Save Changes',
  discardLabel: 'Discard',
  size: 'default'
});

const isSaving = ref(false);

// Wrapper for save function to handle loading state
const handleSave = async () => {
  if (!props.dirty || isSaving.value) return;

  try {
    isSaving.value = true;
    await props.save();
  } finally {
    isSaving.value = false;
  }
};

// Handle keyboard shortcuts for form actions
const handleKeyDown = (event: KeyboardEvent) => {
  const activeElement = document.activeElement;
  const isInSearchableSelect =
      activeElement?.closest('searchable-select') ||
      activeElement?.closest('.searchable-select') ||
      activeElement?.closest('[role="combobox"]') ||
      activeElement?.closest('[role="listbox"]') ||
      document.querySelector('.select-dropdown[data-state="open"]') ||
      document.querySelector('[role="listbox"][data-state="open"]');

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    if (isInSearchableSelect) return;
    event.preventDefault();
    if (props.dirty && !isSaving.value) {
      handleSave();
    }
  }

  if (event.key === 'Escape') {
    if (isInSearchableSelect) return;
    event.preventDefault();
    if (props.dirty) {
      props.discard();
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="border-t pt-2 flex-shrink-0">
    <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="transform translate-x-8 opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-8 opacity-0"
    >
      <div class="flex justify-between">
        <!-- Dialog buttons -->
        <div>
          <template v-for="(dialog, index) in dialogs" :key="index">
            <template v-if="dialog.condition === undefined || dialog.condition">
              <ConfirmationDialog
                  v-if="dialog.type === 'confirmation'"
                  :triggerLabel="dialog.triggerLabel"
                  :title="dialog.title"
                  :description="dialog.description"
                  :actionLabel="dialog.actionLabel"
                  :cancelLabel="dialog.cancelLabel"
                  :action="dialog.action"
                  :afterSuccess="dialog.afterSuccess"
                  :disabled="dialog.disabled"
              />
            </template>
          </template>
        </div>

        <!-- Save/Discard buttons -->
        <div :class="['flex gap-3 ml-auto', !dirty ? 'opacity-50' : '']">
          <Button
              variant="outline"
              @click="discard"
              :disabled="isSaving || !dirty"
          >
            {{ discardLabel }}
          </Button>
          <Button
              @click="handleSave"
              :disabled="!dirty || isSaving"
          >
            <span v-if="isSaving" class="mr-2">
              <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" role="status"></span>
            </span>
            {{ isSaving ? 'Saving...' : saveLabel }}
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>