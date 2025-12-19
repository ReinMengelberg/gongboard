<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';

// Define prop types
interface Props {
  // The Pinia store instance
  store: any;
  loadPageAction?: string;
  listProperty?: string; // 'list', 'listBounded', 'listUnbounded', etc.
  maxVisiblePages?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loadPageAction: 'loadPage',
  listProperty: 'list',
  maxVisiblePages: 7
});

// Get the paginated data from the store dynamically
const paginationData = computed(() => {
  return props.store[props.listProperty] || null;
});

// Extract pagination details
const currentPage = computed(() => paginationData.value?.current_page || 1);
const lastPage = computed(() => paginationData.value?.last_page || 1);
const hasPreviousPage = computed(() => !!paginationData.value?.prev_page_url);
const hasNextPage = computed(() => !!paginationData.value?.next_page_url);
const from = computed(() => paginationData.value?.from || 0);
const to = computed(() => paginationData.value?.to || 0);
const total = computed(() => paginationData.value?.total || 0);

/**
 * Generate an array of page numbers to display
 * Includes ellipses (...) for large page ranges
 */
const visiblePageNumbers = computed(() => {
  const currentPageNum = currentPage.value;
  const lastPageNum = lastPage.value;
  const maxVisible = props.maxVisiblePages;
  if (lastPageNum <= maxVisible) {
    return Array.from({ length: lastPageNum }, (_, i) => i + 1);
  }
  const sidePages = Math.floor((maxVisible - 3) / 2);
  let startPage = Math.max(2, currentPageNum - sidePages);
  let endPage = Math.min(lastPageNum - 1, currentPageNum + sidePages);
  if (currentPageNum - sidePages < 2) {
    endPage = Math.min(lastPageNum - 1, maxVisible - 2);
  }
  if (currentPageNum + sidePages > lastPageNum - 1) {
    startPage = Math.max(2, lastPageNum - maxVisible + 2);
  }
  const pages: Array<number | '...'> = [1];
  if (startPage > 2) {
    pages.push('...');
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  if (endPage < lastPageNum - 1) {
    pages.push('...');
  }
  if (lastPageNum > 1) {
    pages.push(lastPageNum);
  }
  return pages;
});

/**
 * Change to the specified page and fetch new data
 */
const changePage = (page: number) => {
  if (
      page < 1 ||
      page > lastPage.value ||
      page === currentPage.value
  ) {
    return;
  }
  props.store[props.loadPageAction](page);
};
</script>

<template>
  <nav class="flex items-center justify-between px-2 pt-2" aria-label="Pagination">
    <!-- Results count (hidden on mobile) -->
    <div class="hidden sm:block">
      <p class="text-xs text-gray-700">
        Showing
        {{ ' ' }}
        <span class="font-medium">{{ from }}</span>
        {{ ' ' }}
        to
        {{ ' ' }}
        <span class="font-medium">{{ to }}</span>
        {{ ' ' }}
        of
        {{ ' ' }}
        <span class="font-medium">{{ total }}</span>
        {{ ' ' }}
        results
      </p>
    </div>

    <!-- Mobile: Simple Previous/Next -->
    <div class="flex flex-1 justify-between sm:hidden">
      <Button
          variant="outline"
          size="sm"
          @click.prevent="changePage(currentPage - 1)"
          :disabled="!hasPreviousPage"
      >
        Previous
      </Button>
      <Button
          variant="outline"
          size="sm"
          @click.prevent="changePage(currentPage + 1)"
          :disabled="!hasNextPage"
      >
        Next
      </Button>
    </div>

    <!-- Desktop: Previous/Next buttons + Page numbers with first/last navigation -->
    <div class="hidden sm:flex sm:items-center sm:gap-2">
      <!-- Page Numbers Navigation -->
      <div class="inline-flex gap-1 rounded-md shadow-sm">
        <!-- First Page Button -->
        <Button
            variant="outline"
            class="w-8 h-8"
            @click.prevent="changePage(1)"
            :disabled="currentPage === 1"
        >
          <span class="sr-only">First page</span>
          <i class="ri-arrow-left-double-line text-lg"></i>
        </Button>

        <!-- Page Numbers -->
        <template v-for="page in visiblePageNumbers" :key="page">
          <Button
              v-if="page !== '...'"
              @click.prevent="changePage(page)"
              class="w-8 h-8"
              :variant="currentPage === page ? 'default' : 'outline'"
              :disabled="page === currentPage"
              :aria-current="page === currentPage ? 'page' : undefined"
          >
            {{ page }}
          </Button>
          <Button
              v-else
              :disabled="true"
              class="w-8 h-8"
              variant="outline"
          >
            ...
          </Button>
        </template>

        <!-- Last Page Button -->
        <Button
            variant="outline"
            @click.prevent="changePage(lastPage)"
            :disabled="currentPage === lastPage"
            class="w-8 h-8"
        >
          <span class="sr-only">Last page</span>
          <i class="ri-arrow-right-double-line text-lg"></i>
        </Button>
      </div>

      <!-- Previous/Next Buttons -->
      <Button
          variant="outline"
          size="sm"
          @click.prevent="changePage(currentPage - 1)"
          :disabled="!hasPreviousPage"
      >
        Previous
      </Button>
      <Button
          variant="outline"
          size="sm"
          @click.prevent="changePage(currentPage + 1)"
          :disabled="!hasNextPage"
      >
        Next
      </Button>
    </div>
  </nav>
</template>

<style scoped>

</style>