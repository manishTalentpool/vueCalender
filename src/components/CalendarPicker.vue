<template>
  <div class="calendar-picker">
    <div class="calendar-picker__header">
      <span class="calendar-picker__title">{{ monthYearLabel }}</span>
      <div class="calendar-picker__nav">
        <button
          type="button"
          class="calendar-picker__arrow"
          aria-label="Previous month"
          :disabled="!canGoPrevMonth"
          @click="prevMonth"
        >
          ‹
        </button>
        <button
          type="button"
          class="calendar-picker__arrow"
          aria-label="Next month"
          :disabled="!canGoNextMonth"
          @click="nextMonth"
        >
          ›
        </button>
      </div>
    </div>

    <p class="calendar-picker__hint">Next {{ workingDaysLimit }} working days only</p>

    <div class="calendar-picker__weekdays">
      <span v-for="d in weekdays" :key="d">{{ d }}</span>
    </div>

    <div class="calendar-picker__grid">
      <button
        v-for="cell in calendarCells"
        :key="cell.key"
        type="button"
        class="calendar-picker__day"
        :class="{
          'calendar-picker__day--outside': !cell.inMonth,
          'calendar-picker__day--today': cell.isToday,
          'calendar-picker__day--selected': cell.isSelected,
          'calendar-picker__day--disabled': cell.isDisabled
        }"
        :disabled="cell.isDisabled"
        @click="selectDate(cell)"
      >
        {{ cell.day }}
      </button>
    </div>
  </div>
</template>

<script>
import {
  getWorkingDayWindow,
  isWorkingDay,
  WORKING_DAYS_LIMIT
} from '@/utils/workingDays'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDateValue(value) {
  const [y, m, d] = (value || '').split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default {
  name: 'CalendarPicker',
  props: {
    value: { type: String, required: true }
  },
  data() {
    const window = getWorkingDayWindow()
    const selected = parseDateValue(
      window.allowedSet.has(this.value) ? this.value : window.minStr
    )
    return {
      viewYear: selected.getFullYear(),
      viewMonth: selected.getMonth(),
      workingDaysLimit: WORKING_DAYS_LIMIT
    }
  },
  computed: {
    weekdays: () => WEEKDAYS,
    bookingWindow() {
      return getWorkingDayWindow()
    },
    monthYearLabel() {
      return new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    },
    canGoPrevMonth() {
      const firstOfView = new Date(this.viewYear, this.viewMonth, 1)
      return firstOfView > this.bookingWindow.min
    },
    canGoNextMonth() {
      const lastOfView = new Date(this.viewYear, this.viewMonth + 1, 0)
      return lastOfView < this.bookingWindow.max
    },
    calendarCells() {
      const cells = []
      const first = new Date(this.viewYear, this.viewMonth, 1)
      const startOffset = first.getDay()
      const gridStart = new Date(this.viewYear, this.viewMonth, 1 - startOffset)
      const today = startOfDay(new Date())
      const { allowedSet } = this.bookingWindow

      for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart)
        d.setDate(gridStart.getDate() + i)
        const inMonth = d.getMonth() === this.viewMonth
        const value = toDateValue(d)
        const dayStart = startOfDay(d)
        const inWindow = allowedSet.has(value)
        cells.push({
          key: value,
          day: d.getDate(),
          value,
          inMonth,
          isToday: dayStart.getTime() === today.getTime(),
          isSelected: value === this.value,
          isDisabled: !inWindow || !isWorkingDay(d)
        })
      }
      return cells
    }
  },
  watch: {
    value(val) {
      const window = getWorkingDayWindow()
      const safe = window.allowedSet.has(val) ? val : window.minStr
      if (safe !== val) {
        this.$emit('input', safe)
        return
      }
      const d = parseDateValue(safe)
      this.viewYear = d.getFullYear()
      this.viewMonth = d.getMonth()
    }
  },
  methods: {
    prevMonth() {
      if (!this.canGoPrevMonth) return
      if (this.viewMonth === 0) {
        this.viewMonth = 11
        this.viewYear -= 1
      } else {
        this.viewMonth -= 1
      }
    },
    nextMonth() {
      if (!this.canGoNextMonth) return
      if (this.viewMonth === 11) {
        this.viewMonth = 0
        this.viewYear += 1
      } else {
        this.viewMonth += 1
      }
    },
    selectDate(cell) {
      if (cell.isDisabled) return
      this.$emit('input', cell.value)
    }
  }
}
</script>

<style scoped>
.calendar-picker {
  width: 280px;
  flex-shrink: 0;
  user-select: none;
}

.calendar-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  padding: 0 0.15rem;
}

.calendar-picker__hint {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  color: #64748b;
}

.calendar-picker__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.calendar-picker__nav {
  display: flex;
  gap: 0.15rem;
}

.calendar-picker__arrow {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6366f1;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.calendar-picker__arrow:hover:not(:disabled) {
  background: #eef2ff;
}

.calendar-picker__arrow:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.calendar-picker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.35rem;
}

.calendar-picker__weekdays span {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #94a3b8;
  padding: 0.25rem 0;
}

.calendar-picker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-picker__day {
  aspect-ratio: 1;
  max-height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  padding: 0;
}

.calendar-picker__day:hover:not(:disabled):not(.calendar-picker__day--selected) {
  background: #f1f5f9;
}

.calendar-picker__day--outside {
  color: #cbd5e1;
}

.calendar-picker__day--today:not(.calendar-picker__day--selected) {
  background: #f1f5f9;
  color: #1e293b;
}

.calendar-picker__day--selected {
  background: #6366f1;
  color: #fff;
  font-weight: 600;
}

.calendar-picker__day--disabled {
  color: #e2e8f0;
  cursor: not-allowed;
}
</style>
