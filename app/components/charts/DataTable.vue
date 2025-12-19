<!-- Vue -->
<script setup lang="ts">
import {computed, ref} from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Scrollable from "@/components/scroll/Scrollable.vue";
import { Input } from '@/components/ui/input'
import SpinningLoader from '@/components/utils/SpinningLoader.vue'

export interface DataTableColumn<RowT = any, ValueT = any> {
  key: string
  label: string
  valueFormatter?: (
      value: ValueT,
      row: RowT,
      context: {
        rowIndex: number
        colIndex: number
        column: DataTableColumn<RowT, ValueT>
        key: string
      }
  ) => string | number | null | undefined
  class?: string
  headerClass?: string
}

const props = defineProps<{
  columns: DataTableColumn[]
  rows: any[]
  rowKey?: string | ((row: any, index: number) => string | number)
  emptyMessage?: string
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  loading?: boolean
}>()

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined
  if (!path.includes('.')) return obj?.[path]
  return path.split('.').reduce((acc: any, part: string) => (acc == null ? undefined : acc[part]), obj)
}

const resolvedRows = computed(() => props.rows ?? [])

const resolveRowKey = (row: any, index: number): string | number => {
  const rk = props.rowKey
  if (typeof rk === 'function') return rk(row, index)
  if (typeof rk === 'string' && rk.length > 0) return row?.[rk] ?? index
  return row?.id ?? index
}

// Search state and filtering
const searchQuery = ref('')

const normalized = (v: unknown): string => {
  if (v == null) return ''
  return String(v).toLowerCase()
}

const filteredRows = computed(() => {
  const q = normalized(searchQuery.value)
  if (!props.searchable || !q) return resolvedRows.value

  // Filter by checking every column's displayed value
  return resolvedRows.value.filter((row, rIdx) => {
    return props.columns.some((col, cIdx) => {
      const raw = getByPath(row, col.key)
      const value = col.valueFormatter
        ? col.valueFormatter(raw, row, {
            rowIndex: rIdx,
            colIndex: cIdx,
            column: col,
            key: col.key,
          })
        : raw
      return normalized(value).includes(q)
    })
  })
})

</script>

<template>
  <Card class="w-full h-full">
    <CardHeader v-if="title || description || searchable" class="flex flex-row items-center justify-between gap-4">
      <div class="flex min-w-0 flex-col">
        <CardTitle v-if="title">{{ title }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>

      <div v-if="searchable" class="ml-auto w-full sm:w-64">
        <div class="relative">
          <i class="ri-search-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"></i>
          <Input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder || 'Search...'"
              aria-label="Search"
              class="pl-9"
          />
        </div>
      </div>
    </CardHeader>

    <!-- Make content fill height and allow inner scroller -->
    <CardContent class="px-4 h-full flex flex-col min-h-0">
      <div v-if="props.loading" class="flex-1 min-h-0 flex items-center justify-center">
        <SpinningLoader />
      </div>
      <Scrollable v-else class="flex-1 min-h-0 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                  v-for="(col, cIdx) in columns"
                  :key="cIdx"
                  :class="col.headerClass"
              >
                {{ col.label }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!filteredRows.length">
              <TableCell
                  :colspan="columns.length"
                  class="text-center text-muted-foreground h-24"
              >
                {{ emptyMessage || 'No data available' }}
              </TableCell>
            </TableRow>
            <TableRow
                v-for="(row, rIdx) in filteredRows"
                :key="resolveRowKey(row, rIdx)"
            >
              <TableCell
                  v-for="(col, cIdx) in columns"
                  :key="cIdx"
                  :class="col.class"
              >
                {{
                  (() => {
                    const raw = getByPath(row, col.key)
                    if (col.valueFormatter) {
                      const formatted = col.valueFormatter(raw, row, {
                        rowIndex: rIdx,
                        colIndex: cIdx,
                        column: col,
                        key: col.key
                      })
                      return formatted ?? ''
                    }
                    return raw ?? ''
                  })()
                }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Scrollable>
    </CardContent>
  </Card>
</template>
