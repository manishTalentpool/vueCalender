<template>
  <div class="time-wheel">
    <div class="time-wheel__highlight" aria-hidden="true" />
    <div class="time-wheel__columns">
      <div
        ref="hourCol"
        class="time-wheel__column"
        @scroll.passive="onHourScroll"
      >
        <div class="time-wheel__pad" />
        <button
          v-for="h in hours"
          :key="'h' + h"
          type="button"
          class="time-wheel__item"
          :class="{ 'time-wheel__item--active': h === hour12 }"
          @click="selectHour(h)"
        >
          {{ h }}
        </button>
        <div class="time-wheel__pad" />
      </div>

      <div
        ref="minuteCol"
        class="time-wheel__column"
        @scroll.passive="onMinuteScroll"
      >
        <div class="time-wheel__pad" />
        <button
          v-for="m in minutes"
          :key="'m' + m"
          type="button"
          class="time-wheel__item"
          :class="{ 'time-wheel__item--active': m === minute }"
          @click="selectMinute(m)"
        >
          {{ pad(m) }}
        </button>
        <div class="time-wheel__pad" />
      </div>

      <div
        ref="periodCol"
        class="time-wheel__column time-wheel__column--period"
        @scroll.passive="onPeriodScroll"
      >
        <div class="time-wheel__pad" />
        <button
          v-for="p in periods"
          :key="p"
          type="button"
          class="time-wheel__item"
          :class="{ 'time-wheel__item--active': p === period }"
          @click="selectPeriod(p)"
        >
          {{ p }}
        </button>
        <div class="time-wheel__pad" />
      </div>
    </div>
  </div>
</template>

<script>
const ITEM_H = 44
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const PERIODS = ['AM', 'PM']

function pad(n) {
  return String(n).padStart(2, '0')
}

function parseTime24(value) {
  const [h = 10, m = 0] = (value || '10:00').split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return { hour12, minute: m, period }
}

function toTime24(hour12, minute, period) {
  let h = hour12 % 12
  if (period === 'PM') h += 12
  if (hour12 === 12 && period === 'AM') h = 0
  return `${pad(h)}:${pad(minute)}`
}

export default {
  name: 'TimeWheelPicker',
  props: {
    value: { type: String, default: '10:00' }
  },
  data() {
    const parsed = parseTime24(this.value)
    return {
      hour12: parsed.hour12,
      minute: parsed.minute,
      period: parsed.period,
      scrolling: false,
      scrollTimer: null
    }
  },
  computed: {
    hours: () => HOURS,
    minutes() {
      const list = []
      for (let m = 0; m < 60; m++) {
        list.push(m)
      }
      return list
    },
    periods: () => PERIODS
  },
  watch: {
    value(next) {
      const parsed = parseTime24(next)
      this.hour12 = parsed.hour12
      this.minute = parsed.minute
      this.period = parsed.period
      this.$nextTick(this.syncScrollPositions)
    }
  },
  mounted() {
    this.$nextTick(this.syncScrollPositions)
  },
  methods: {
    pad,
    emitValue() {
      this.$emit('input', toTime24(this.hour12, this.minute, this.period))
    },
    syncScrollPositions() {
      this.scrollToValue('hourCol', HOURS.indexOf(this.hour12))
      this.scrollToValue('minuteCol', this.minute)
      this.scrollToValue('periodCol', PERIODS.indexOf(this.period))
    },
    scrollToValue(refName, index) {
      const el = this.$refs[refName]
      if (!el || index < 0) return
      el.scrollTop = index * ITEM_H
    },
    snapScroll(refName, items, onSelect) {
      const el = this.$refs[refName]
      if (!el) return
      const index = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(index, items.length - 1))
      el.scrollTop = clamped * ITEM_H
      onSelect(items[clamped])
    },
    debouncedSnap(refName, items, setter) {
      if (this.scrollTimer) clearTimeout(this.scrollTimer)
      this.scrollTimer = setTimeout(() => {
        this.snapScroll(refName, items, setter)
      }, 100)
    },
    onHourScroll() {
      this.debouncedSnap('hourCol', HOURS, (h) => {
        this.hour12 = h
        this.emitValue()
      })
    },
    onMinuteScroll() {
      this.debouncedSnap('minuteCol', this.minutes, (m) => {
        this.minute = m
        this.emitValue()
      })
    },
    onPeriodScroll() {
      this.debouncedSnap('periodCol', PERIODS, (p) => {
        this.period = p
        this.emitValue()
      })
    },
    selectHour(h) {
      this.hour12 = h
      this.scrollToValue('hourCol', HOURS.indexOf(h))
      this.emitValue()
    },
    selectMinute(m) {
      this.minute = m
      this.scrollToValue('minuteCol', m)
      this.emitValue()
    },
    selectPeriod(p) {
      this.period = p
      this.scrollToValue('periodCol', PERIODS.indexOf(p))
      this.emitValue()
    }
  }
}
</script>

<style scoped>
.time-wheel {
  position: relative;
  width: 200px;
  height: 220px;
  flex-shrink: 0;
}

.time-wheel__highlight {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  height: 44px;
  background: #f1f5f9;
  border-radius: 10px;
  pointer-events: none;
  z-index: 0;
}

.time-wheel__columns {
  display: flex;
  height: 100%;
  position: relative;
  z-index: 1;
}

.time-wheel__column {
  flex: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.15) 12%,
    #000 28%,
    #000 72%,
    rgba(0, 0, 0, 0.15) 88%,
    transparent 100%
  );
}

.time-wheel__column::-webkit-scrollbar {
  display: none;
}

.time-wheel__column--period {
  flex: 0.85;
}

.time-wheel__pad {
  height: 88px;
  flex-shrink: 0;
}

.time-wheel__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  scroll-snap-align: center;
  transition: color 0.15s, font-size 0.15s;
  padding: 0;
}

.time-wheel__item--active {
  color: #1e293b;
  font-weight: 600;
  font-size: 1.15rem;
}

.time-wheel__item:hover {
  color: #6366f1;
}
</style>
