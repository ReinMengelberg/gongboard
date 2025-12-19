<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableAction,
  TableEmpty,
  TableSkeleton
} from '~/components/base/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '~/components/ui/button';
import Badge from '~/components/utils/Badge.vue';
import EmptyState from '~/components/utils/EmptyState.vue';
import ConfirmationDialog from "@/components/utils/dialog/ConfirmationDialog.vue";
import DeleteDialog from "@/components/utils/dialog/DeleteDialog.vue";
import { cn } from '@/lib/utils';
import { useResourceStore } from '@/stores/ResourceStore';
import type { Resource } from '~/src/types/models/resource';
import InfiniteScrollArea from "@/components/scroll/InfiniteScrollArea.vue";
import TableItemCell from "@/components/base/table/TableItemCell.vue";

export interface DialogConfig {
  type: 'confirmation' | 'delete' | 'delete-password';
  condition?: boolean;
  triggerLabel?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  action: (values: any) => Promise<any>;
  afterSuccess?: () => Promise<any>;
}

interface Props {
  view?: 'arrow' | 'actions';
  resources: ReturnType<typeof useResourceStore>;
  selected?: Resource | undefined;
  itemIcon?: string;
  dialogs?: DialogConfig[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  view: 'arrow',
  itemIcon: 'ri-database-2-line',
  dialogs: () => [],
});

const emit = defineEmits<{ (e: 'select', resource: Resource): void }>()

const handleSelect = (resource: Resource) => {
  emit('select', resource)
}

const sourceColor = (source: Resource['source']) => {
  switch (source) {
    case 'joof':
      return 'blue'
    case 'angryjobs':
      return 'orange'
    default:
      return 'gray'
  }
}

const sourceLabel = (source: Resource['source']) => {
  switch (source) {
    case 'joof':
      return 'Joof'
    case 'angryjobs':
      return 'Angryjobs'
    default:
      return 'Unknown'
  }
}
</script>

<template>
  <InfiniteScrollArea
      :store="props.resources"
      load-more-action="loadMore"
      start="top"
      :class="props.class"
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-7/12">Resource</TableHead>
          <TableHead class="w-3/12">Source</TableHead>
          <TableHead class="w-2/12"></TableHead>
        </TableRow>
      </TableHeader>

      <TableSkeleton
          v-if="props.resources.listLoading"
          :rows="props.resources.per_page"
          :cols="3"
      />

      <TableEmpty
          v-else-if="!props.resources.listLoading && (!props.resources.list?.data || props.resources.list?.data?.length === 0)"
          :colspan="3"
      >
        <EmptyState
            empty-message="No resources found"
            empty-prompt="Try adjusting your search or filters..."
            icon="ri-database-2-line"
        />
      </TableEmpty>

      <TableBody v-else>
        <TableRow
            v-for="resource in props.resources.list?.data"
            :key="resource.id"
            :class="cn('cursor-pointer transition-all duration-200 ease-in-out hover:bg-sky-100 dark:hover:bg-sky-800 text-gray-700 dark:text-gray-300 !border-t-0 !border-l-4 !border-white', props.selected?.id === resource.id && 'bg-blue-100 text-blue-600 dark:bg-blue-800/30 dark:text-blue-300 !border-b-0 !border-l-4 !border-blue-500')"
            @click="props.view === 'arrow' ? handleSelect(resource) : undefined"
        >
          <!-- Resource Column -->
          <TableCell>
            <TableItemCell
                :name="resource.name"
                :description="resource.description"
                :icon-bg-color="`bg-${sourceColor(resource.source)}-600`"
                :icon="props.itemIcon"
            />
          </TableCell>

          <!-- Source Column -->
          <TableCell>
            <Badge :color="sourceColor(resource.source)">
              <span>{{ sourceLabel(resource.source) }}</span>
            </Badge>
          </TableCell>

          <!-- Actions Column -->
          <TableCell class="text-right" @click.prevent>
            <TableAction v-if="props.view === 'arrow'" :action="() => handleSelect(resource)"/>
            <div v-else>
              <div class="flex shrink-0 items-center justify-end gap-x-5">
                <span class="relative z-10">
                  <Button
                      variant="outline"
                      @click="handleSelect(resource)"
                  >
                    View Resource
                  </Button>
                </span>

                <template v-for="(dialog, index) in props.dialogs" :key="index">
                  <div v-if="dialog.condition" class="flex shrink-0 items-center justify-end gap-x-10">
                    <span class="relative z-10">
                      <!-- Delete Dialog -->
                      <DeleteDialog
                          v-if="dialog.type === 'delete'"
                          :triggerLabel="dialog.triggerLabel"
                          :title="dialog.title"
                          :description="dialog.description"
                          :actionLabel="dialog.actionLabel"
                          :cancelLabel="dialog.cancelLabel"
                          :action="(...args) => dialog.action(resource, ...args)"
                          :afterSuccess="dialog.afterSuccess"
                      />

                      <!-- Confirmation Dialog -->
                      <ConfirmationDialog
                          v-else-if="dialog.type === 'confirmation'"
                          :triggerLabel="dialog.triggerLabel"
                          :title="dialog.title"
                          :description="dialog.description"
                          :actionLabel="dialog.actionLabel"
                          :cancelLabel="dialog.cancelLabel"
                          :action="(...args) => dialog.action(resource, ...args)"
                          :afterSuccess="dialog.afterSuccess"
                      />
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </InfiniteScrollArea>
</template>

<style scoped>

</style>