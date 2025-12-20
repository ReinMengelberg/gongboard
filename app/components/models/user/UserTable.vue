<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '~/components/ui/table';
import {
  TableAction,
  TableSkeleton
} from '~/components/base/table';
import {Avatar, AvatarImage, AvatarFallback} from "~/components/ui/avatar";
import {useUserStore} from "@/stores/UserStore";
import {useAuthStore} from "~/stores/AuthStore";
import type {User} from "~~/server/models/User";
import ConfirmationDialog from "@/components/utils/dialog/ConfirmationDialog.vue";
import DeleteDialog from "@/components/utils/dialog/DeleteDialog.vue";
import EmptyState from "~/components/utils/EmptyState.vue";
import Badge from "~/components/utils/Badge.vue";
// Removed role option utilities; role is derived from user.admin
import {Button} from "~/components/ui/button";
import {cn} from "@/lib/utils";
import {ScrollArea} from "@/components/ui/scroll-area";

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
  users: ReturnType<typeof useUserStore>;
  selected?: User | undefined;
  dialogs?: DialogConfig[];

  // Authenticated badge and last seen status
  auth: ReturnType<typeof useAuthStore>;
  showYouBadge?: boolean;
  showLastSeen?: boolean;

  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  view: 'arrow',
  showYouBadge: true,
  showLastSeen: true,
  dialogs: () => [],
});

const emit = defineEmits<{ (e: 'select', user: User): void }>()

const handleSelect = (user: User) => {
  emit('select', user)
}

</script>

<template>
  <ScrollArea
      :class="props.class"
      class="rounded-md border bg-background"
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-7/12">User</TableHead>
          <TableHead class="w-3/12">Role</TableHead>
          <TableHead class="w-2/12"></TableHead>
        </TableRow>
      </TableHeader>

      <TableSkeleton
          v-if="props.users.listLoading"
          :rows="props.users.per_page"
          :cols="3"
      />

      <TableEmpty
          v-else-if="!props.users.listLoading && (!props.users.list?.data || props.users.list?.data?.length === 0)"
          :colspan="3"
      >
        <EmptyState
            empty-message="No users found"
            empty-prompt="Try adjusting your search or filters..."
            icon="ri-user-community-line"
        />
      </TableEmpty>

      <TableBody v-else>
        <TableRow
            v-for="user in props.users.list?.data"
            :key="user.email"
            :class="cn(
                'cursor-pointer transition-colors hover:bg-muted/50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
                props.selected?.id === user.id && 'bg-accent text-accent-foreground'
            )"
            :data-selected="props.selected?.id === user.id"
            @click="props.view === 'arrow' ? handleSelect(user) : undefined"
        >
          <!-- User Column -->
          <TableCell>
            <div class="flex items-center gap-x-3">
              <Avatar class="h-14 w-14 flex-shrink-0 rounded-full border border-border">
                <AvatarImage :src="user.avatar?.temp_url"/>
                <AvatarFallback class="bg-muted text-sm font-medium">
                  {{ user.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-foreground truncate">
                    {{ user.name }}
                  </p>
                  <!-- You Badge -->
                  <Badge v-if="props.showYouBadge && props.auth.user?.global_id === user.global_id" color="blue">
                    <span>You</span>
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground truncate">
                  <a :href="`mailto:${user.email}`" class="hover:text-primary transition-colors">
                    {{ user.email }}
                  </a>
                </p>
              </div>
            </div>
          </TableCell>

          <!-- Role Column -->
          <TableCell>
            <Badge v-if="user?.admin === true" color="blue">
              <span>Admin</span>
            </Badge>
            <Badge v-else color="gray">
              <span>User</span>
            </Badge>
          </TableCell>


          <!-- Actions Column -->
          <TableCell class="text-right" @click.prevent>
            <TableAction v-if="props.view === 'arrow'" :action="() => handleSelect(user)"/>
            <div v-else>
              <div class="flex shrink-0 items-center justify-end gap-x-5">
            <span class="relative z-10">
              <Button
                  variant="outline"
                  @click="handleSelect(user)"
              >
                  View User
              </Button>
            </span>

                <template v-for="(dialog, index) in props.dialogs" :key="index">
                  <div v-if="dialog.condition" class="flex shrink-0 items-center justify-end gap-x-10">
              <span class="relative z-10">
                <!-- Unassign Dialog -->
                <DeleteDialog
                    v-if="dialog.type === 'delete'"
                    :triggerLabel="dialog.triggerLabel"
                    :title="dialog.title"
                    :description="dialog.description"
                    :actionLabel="dialog.actionLabel"
                    :cancelLabel="dialog.cancelLabel"
                    :action="(...args) => dialog.action(user, ...args)"
                    :afterSuccess="dialog.afterSuccess"
                />

                <!-- Assign Dialog -->
                <ConfirmationDialog
                    v-else-if="dialog.type === 'confirmation'"
                    :triggerLabel="dialog.triggerLabel"
                    :title="dialog.title"
                    :description="dialog.description"
                    :actionLabel="dialog.actionLabel"
                    :cancelLabel="dialog.cancelLabel"
                    :action="(...args) => dialog.action(user, ...args)"
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
  </ScrollArea>
</template>

<style scoped>

</style>