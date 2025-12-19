<script setup lang="ts">
import { ref, watch, nextTick, onMounted, useTemplateRef } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import SpinningLoader from '~/components/utils/SpinningLoader.vue'

interface Props {
  // A store-like object (e.g., Pinia store) with a list and a load action.
  store: any
  // Name of the load action on the store; kept for API compatibility.
  loadMoreAction?: string
  // Starting position of the scroll: 'bottom' for chats by default.
  start?: 'top' | 'bottom'
  // Optional increment amount for pagination.
  increment?: number
}

const props = withDefaults(defineProps<Props>(), {
  loadMoreAction: 'loadMore',
  start: 'bottom',
  increment: 10,
})

const container = useTemplateRef<HTMLElement>('container')
const isLoadingMore = ref(false)
const perPage = ref<number | undefined>(undefined)

// Helper: scroll to bottom
const scrollToBottom = async () => {
  await nextTick()
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}

// Helper: scroll to top
const scrollToTop = async () => {
  await nextTick()
  if (container.value) {
    container.value.scrollTop = 0
  }
}

// Determine if we can load more
const canLoadMore = () => {
  const list = props.store?.list
  const dataLen = list?.data?.length ?? 0
  const total = list?.total ?? 0
  return !isLoadingMore.value && total > 0 && dataLen < total
}

// Load more using the provided store
const onLoadMore = async () => {
  if (!canLoadMore()) return

  isLoadingMore.value = true
  const oldScrollHeight = container.value?.scrollHeight || 0
  const oldScrollTop = container.value?.scrollTop || 0

  try {
    const store = props.store
    const loadMoreAction = typeof props.loadMoreAction === 'string' ? store?.[props.loadMoreAction] : undefined
    if (typeof loadMoreAction !== 'function') {
      return // Nothing to call; bail safely
    }

    await loadMoreAction(props.increment)

    await nextTick()

    if (container.value && oldScrollHeight > 0) { // Maintain scroll position based on direction
      if (props.start === 'bottom') { // When loading at top (chat mode), maintain position from bottom
        const newScrollHeight = container.value.scrollHeight
        container.value.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop
      }
      // When loading at bottom (normal list), scroll position naturally maintains
    }
  } finally {
    isLoadingMore.value = false
  }
}

// Setup infinite scroll based on start position
useInfiniteScroll(
    container,
    onLoadMore,
    {
      distance: 10,
      direction: props.start === 'bottom' ? 'top' : 'bottom', // Load opposite of start position
      canLoadMore
    }
)

// Check if we need to load more to fill available height
const checkIfNeedsMoreContent = async () => {
  await nextTick()
  if (!container.value || isLoadingMore.value) return false
  const needsMore = container.value.scrollHeight <= container.value.clientHeight
  return needsMore && canLoadMore()
}

const autoLoadIfNeeded = async () => {
  if (await checkIfNeedsMoreContent()) {
    isLoadingMore.value = true
    const store = props.store
    if (perPage.value === undefined) perPage.value = store?.per_page ?? 10
    perPage.value += store?.per_page ?? 10

    try {
      const loadMoreAction = typeof props.loadMoreAction === 'string' ? store?.[props.loadMoreAction] : undefined
      if (typeof loadMoreAction === 'function') {
        await loadMoreAction(props.increment)
      }
      await nextTick()
      setTimeout(() => autoLoadIfNeeded(), 100)
    } finally {
      isLoadingMore.value = false
    }
  } else if (props.start === 'bottom') {
    await scrollToBottom()
  } else if (props.start === 'top') {
    await scrollToTop()
  }
}

// Watch the store list to scroll appropriately
watch(() => props.store?.list?.data, async (newData, oldData) => {
  if (isLoadingMore.value) return

  if (props.start === 'bottom') {
    // For chats: scroll to bottom on initial load or when new items appended
    if (!oldData || (newData && newData.length > (oldData?.length || 0))) {
      await scrollToBottom()
      await autoLoadIfNeeded()
    }
  } else {
    // For normal lists: maintain position or check if needs more content
    if (!oldData) {
      // Initial load - stay at top
      await scrollToTop()
      await autoLoadIfNeeded()
    } else if (newData && newData.length > (oldData?.length || 0)) {
      // More items loaded - check if we need even more
      await autoLoadIfNeeded()
    }
  }
}, { deep: true })

onMounted(async () => {
  if (props.start === 'bottom') {
    await scrollToBottom()
  } else {
    await scrollToTop()
  }
  await autoLoadIfNeeded()
})
</script>

<template>
  <div ref="container" class="h-full overflow-y-auto scrollbar">
    <!-- Show loader at top when start='bottom' (chat mode) -->
    <div v-if="isLoadingMore && start === 'bottom'" class="flex justify-center">
      <SpinningLoader />
    </div>

    <slot />

    <!-- Show loader at bottom when start='top' (normal list mode) -->
    <div v-if="isLoadingMore && start === 'top'" class="flex justify-center">
      <SpinningLoader />
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling */
.scrollbar {
  /* Reserve space for the scrollbar to avoid layout shift */
  scrollbar-gutter: stable;

  /* Firefox scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent; /* thumb color, transparent track */
}

.scrollbar::-webkit-scrollbar {
  height: 2px; /* Very thin for horizontal */
  width: 2px;  /* Very thin for vertical */
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent; /* No track background */
}

.scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* Subtle gray thumb */
  border-radius: 2px;
}

</style>