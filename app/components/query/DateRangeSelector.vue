<script setup lang="ts">
import { ref, computed } from 'vue'
import { RangeCalendar } from '~/components/ui/range-calendar'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { CalendarIcon } from 'lucide-vue-next'
import { getLocalTimeZone, today, parseDate, DateFormatter, type DateValue } from '@internationalized/date'
import type { DateRange } from '~/services/api/DashboardService'

const df = new DateFormatter('en-US', { dateStyle: 'long' })

interface props {
  store: any
}
const props = defineProps<props>()

const getDefaultDate = () => {
  if (props.store.dateRange?.start && props.store.dateRange?.end) {
    return {
      start: props.store.dateRange.start,
      end: props.store.dateRange.end,
      label: props.store.dateRange.label
    }
  }

  // Default to "Today" instead of "This week"
  const t = today(getLocalTimeZone())

  return {
    start: t.toString(),
    end: t.toString(),
    label: 'Today'
  }
}

const tz = getLocalTimeZone()
const format = (iso: string) => df.format(parseDate(iso).toDate(tz))

const formattedDateRange = computed(() => {
  const r = props.store.dateRange
  if (!r?.start || !r?.end) return ''
  return r.start === r.end
      ? format(r.start)
      : `${format(r.start)} — ${format(r.end)}`
})


const tempDate = ref(getDefaultDate())

const presets = [
  {
    label: "Today",
    get: () => {
      const t = today(getLocalTimeZone())
      return { start: t, end: t, label: 'Today' }
    }
  },
  {
    label: "Yesterday",
    get: () => {
      const t = today(getLocalTimeZone()).subtract({ days: 1 })
      return { start: t, end: t, label: 'Yesterday' }
    }
  },
  {
    label: "This week",
    get: () => {
      const end = today(getLocalTimeZone())
      const weekday = end.toDate(getLocalTimeZone()).getDay() || 7
      const start = end.subtract({ days: weekday - 1 })
      return { start, end, label: 'This week' }
    }
  },
  {
    label: "Last week",
    get: () => {
      const end = today(getLocalTimeZone())
      const weekday = end.toDate(getLocalTimeZone()).getDay() || 7
      const lastMonday = end.subtract({ days: weekday + 6 })
      const lastSunday = lastMonday.add({ days: 6 })
      return { start: lastMonday, end: lastSunday, label: 'Last week' }
    }
  },
  {
    label: "This month",
    get: () => {
      const end = today(getLocalTimeZone())
      const start = end.set({ day: 1 })
      return { start, end, label: 'This month' }
    }
  },
  {
    label: "Last month",
    get: () => {
      const end = today(getLocalTimeZone())
      const firstOfThisMonth = end.set({ day: 1 })
      const firstOfLastMonth = firstOfThisMonth.subtract({ months: 1 })
      const lastOfLastMonth = firstOfThisMonth.subtract({ days: 1 })
      return { start: firstOfLastMonth, end: lastOfLastMonth, label: 'Last month' }
    }
  },
  {
    label: "This year",
    get: () => {
      const end = today(getLocalTimeZone())
      const start = end.set({ month: 1, day: 1 })
      return { start, end, label: 'This year' }
    }
  },
  {
    label: "Last year",
    get: () => {
      const end = today(getLocalTimeZone())
      const lastYear = end.year - 1
      const start = end.set({ year: lastYear, month: 1, day: 1 })
      const lastDay = end.set({ year: lastYear, month: 12, day: 31 })
      return { start, end: lastDay, label: 'Last year' }
    }
  },
]

function selectPreset(preset: { start: DateValue, end: DateValue, label: string }) {
  tempDate.value = {
    start: preset.start.toString(),
    end: preset.end.toString(),
    label: preset.label
  }
}

function onCalendarChange(range: { start: DateValue | undefined, end: DateValue | undefined }) {
  tempDate.value = {
    start: range.start ? range.start.toString() : null,
    end: range.end ? range.end.toString() : null,
    label: null
  }
}

function findPreviousDateCustomRange(date: DateRange) {
  if (!date.start || !date.end) return null
  const start = new Date(date.start)
  const end = new Date(date.end)
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))

  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
    label: null
  }
}

function saveDate() {
  props.store.dateRange = { ...tempDate.value }

  if (props.store.dateRange?.label === 'Today') {
    const preset = presets.find(p => p.label === 'Yesterday')
    if (preset) {
      const range = preset.get()
      props.store.previousDateRange = {
        start: range.start.toString(),
        end: range.end.toString(),
        label: 'Yesterday'

      }}
  } else if (props.store.dateRange?.label === 'This week') {
    const preset = presets.find(p => p.label === 'Last week')
    if (preset) {
      const range = preset.get()
      props.store.previousDateRange = {
        start: range.start.toString(),
        end: range.end.toString(),
        label: 'Last week'
      }
    }
  } else if (props.store.dateRange?.label === 'This month') {
    const preset = presets.find(p => p.label === 'Last month')
    if (preset) {
      const range = preset.get()
      props.store.previousDateRange = {
        start: range.start.toString(),
        end: range.end.toString(),
        label: 'Last month'
      }
    }
  } else if (props.store.dateRange?.label === 'This year') {
    const preset = presets.find(p => p.label === 'Last year')
    if (preset) {
      const range = preset.get()
      props.store.previousDateRange = {
        start: range.start.toString(),
        end: range.end.toString(),
        label: 'Last year'
      }
    }
  }

  else {
    props.store.previousDateRange = findPreviousDateCustomRange(props.store.dateRange)
  }
  props.store.load()
}

</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
          variant="outline"
          class="justify-center text-center w-full font-normal"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span v-if="props.store.dateRange?.start && props.store.dateRange?.end" class="overflow-hidden text-ellipsis">
          {{ formattedDateRange }}
        </span>
        <span v-else>
          Pick a date range
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="flex w-[400px] flex-col gap-y-2 p-2">
      <div class="flex gap-1">
        <div class="flex flex-col gap-2">
          <Button
              v-for="(preset, i) in presets"
              :key="preset.label"
              variant="ghost"
              class="justify-start"
              :class="tempDate.label === preset.label ? 'bg-accent text-accent-foreground' : ''"
              @click="selectPreset(preset.get())"
          >
            {{ preset.label }}
          </Button>
        </div>
        <RangeCalendar
            :model-value="{ start: tempDate.start ? parseDate(tempDate.start) : undefined, end: tempDate.end ? parseDate(tempDate.end) : undefined }"
            @update:model-value="onCalendarChange"
        />
      </div>
      <Button
          class="mt-2 w-full bg-blue-600 hover:bg-blue-700"
          variant="default"
          :disabled="!tempDate.start || !tempDate.end"
          @click="saveDate"
      >
        Apply
      </Button>
    </PopoverContent>
  </Popover>
</template>
