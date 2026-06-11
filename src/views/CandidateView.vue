<template>

  <section class="page">

    <header class="page-header">

      <div>

        <h1>Candidate — book a slot</h1>

        <p class="page-subtitle">

          Click a <strong>green</strong> block on the calendar to book. Week view shows today

          through the next 6 days. Use Day, Week, or Month to change the view.

        </p>

      </div>

      <button type="button" class="btn btn--ghost" @click="refreshEvents">Refresh</button>

    </header>



    <div v-if="!events.length" class="empty-state">

      <p>No interview slots yet.</p>

      <p>Ask your interviewer to add availability first.</p>

      <router-link to="/interviewer" class="btn">Go to interviewer view</router-link>

    </div>



    <template v-else>

      <div class="legend">

        <span class="legend-item"><i class="dot dot--available"></i> Available — click to book</span>

        <span class="legend-item"><i class="dot dot--booked"></i> Already booked</span>

      </div>



      <div class="calendar-wrap calendar-wrap--candidate">

        <vue-cal

          ref="vuecal"

          class="interview-calendar interview-calendar--readonly"

          :events="calendarEvents"

          :selected-date="vueCalSelectedDate"

          @update:selected-date="onVueCalSelectedDate"

          :active-view.sync="activeView"

          :time-from="8 * 60"

          :time-to="20 * 60"

          :time-step="30"

          :min-event-width="0"

          :dblclick-to-navigate="false"

          :click-to-navigate="false"

          :editable-events="false"

          :on-event-click="handleEventClick"

          events-on-month-view

          :disable-views="['years', 'year']"

          :min-date="calendarWindow.minStr"

          :max-date="calendarWindow.maxStr"

          @ready="onCalReady"

          @view-change="onViewChange"

        />

      </div>

    </template>



    <div v-if="bookingModal" class="modal-backdrop" @click.self="closeModal">

      <div class="modal" role="dialog" aria-labelledby="book-title">

        <h2 id="book-title">Confirm booking</h2>

        <p class="modal-slot">{{ formatSlotRange(bookingModal) }}</p>

        <label class="field">

          <span>Your name</span>

          <input

            v-model="candidateName"

            type="text"

            placeholder="Jane Doe"

            autofocus

            @keyup.enter="confirmBooking"

          />

        </label>

        <div class="modal-actions">

          <button type="button" class="btn btn--ghost" @click="closeModal">Cancel</button>

          <button

            type="button"

            class="btn btn--primary"

            :disabled="!candidateName.trim()"

            @click="confirmBooking"

          >

            Book slot

          </button>

        </div>

      </div>

    </div>



    <p v-if="bookSuccess" class="toast">{{ bookSuccess }}</p>

  </section>

</template>



<script>

import VueCal from 'vue-cal'

import 'vue-cal/dist/vuecal.css'

import {

  getCalendarEvents,

  bookSlot,

  formatDateTime,

  getEventId,

  getSlotById

} from '@/services/scheduleStore'

import { getCalendarWindow, isDateInBookingWindow } from '@/utils/workingDays'
import {
  applyRollingWeekView,
  patchRollingWeekCalendar,
  scheduleRollingWeekView
} from '@/utils/rollingWeekView'

export default {

  name: 'CandidateView',

  components: { VueCal },

  data() {

    return {

      events: [],

      selectedDate: new Date(),

      activeView: 'week',

      bookingModal: null,

      candidateName: '',

      bookSuccess: ''

    }

  },

  computed: {

    calendarWindow() {

      return getCalendarWindow()

    },

    calendarEvents() {

      return this.events.filter((e) => isDateInBookingWindow(e.start))

    },

    vueCalSelectedDate() {
      if (this.activeView === 'week') {
        return new Date(this.calendarWindow.min)
      }
      return this.selectedDate
    }

  },

  watch: {
    activeView(view) {
      if (view === 'week') this.scheduleRollingWeek()
    }
  },

  mounted() {

    this.refreshEvents()

    window.addEventListener('storage', this.refreshEvents)

  },

  beforeDestroy() {

    window.removeEventListener('storage', this.refreshEvents)

  },

  methods: {

    onVueCalSelectedDate(date) {
      if (this.activeView !== 'week') {
        this.selectedDate = date
      }
    },
    scheduleRollingWeek() {
      scheduleRollingWeekView(this, () => this.$refs.vuecal, this.calendarWindow)
    },
    onCalReady() {
      const cal = this.$refs.vuecal
      patchRollingWeekCalendar(cal, () => this.calendarWindow)
      applyRollingWeekView(cal, this.calendarWindow)
      this.scheduleRollingWeek()
    },
    onViewChange() {
      if (this.activeView === 'week') {
        applyRollingWeekView(this.$refs.vuecal, this.calendarWindow)
        this.scheduleRollingWeek()
      }
    },
    refreshEvents() {
      this.events = getCalendarEvents()
      if (this.activeView !== 'week') {
        this.selectedDate = new Date(this.calendarWindow.min)
      } else {
        this.$nextTick(() => this.scheduleRollingWeek())
      }
    },

    handleEventClick(event, e) {

      if (e && e.stopPropagation) e.stopPropagation()

      this.openBooking(event)

      return false

    },

    openBooking(event) {

      if (event.booked) {

        window.alert('This slot is already booked. Please choose another time.')

        return

      }

      const id = getEventId(event)

      const stored = id ? getSlotById(id) : null

      const start = event.start || stored?.start

      if (!isDateInBookingWindow(start)) {

        window.alert('This slot is outside the current booking window.')

        return

      }

      this.bookingModal = {

        id,

        start: stored?.start || formatDateTime(start),

        end: stored?.end || formatDateTime(event.end),

        title: event.title

      }

      this.candidateName = ''

    },

    closeModal() {

      this.bookingModal = null

      this.candidateName = ''

    },

    confirmBooking() {

      const name = this.candidateName.trim()

      if (!name || !this.bookingModal || !this.bookingModal.id) return

      bookSlot(this.bookingModal.id, name)

      this.bookSuccess = `Booked! See you on ${this.formatSlotRange(this.bookingModal)}.`

      this.closeModal()

      this.refreshEvents()

      setTimeout(() => {

        this.bookSuccess = ''

      }, 5000)

    },

    formatSlotRange(event) {

      const start = formatDateTime(event.start)

      const end = formatDateTime(event.end)

      return `${start} – ${end}`

    }

  }

}

</script>

