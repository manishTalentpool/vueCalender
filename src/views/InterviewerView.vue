<template>
  <section class="page page--interviewer">
    <header class="page-header">
      <div>
        <h1>Interviewer — availability</h1>
        <p class="page-subtitle">
          Click a time block to add a <strong>draft</strong> (amber). Drag or resize drafts in
          30‑minute steps, then click <strong>Submit availability</strong> to publish green slots for
          candidates.
        </p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn--ghost" @click="refreshSavedEvents">Refresh</button>
        <button type="button" class="btn btn--danger" @click="clearAll">Clear all slots</button>
      </div>
    </header>

    <div class="legend">
      <span class="legend-item"><i class="dot dot--draft"></i> Draft (not published)</span>
      <span class="legend-item"><i class="dot dot--available"></i> Available</span>
      <span class="legend-item"><i class="dot dot--booked"></i> Booked by candidate</span>
    </div>

    <div class="calendar-wrap">
      <vue-cal
        ref="vuecal"
        class="interview-calendar"
        :events="displayEvents"
        :selected-date="vueCalSelectedDate"
        @update:selected-date="onVueCalSelectedDate"
        :active-view.sync="activeView"
        :time-from="8 * 60"
        :time-to="20 * 60"
        :time-step="30"
        :snap-to-time="30"
        :min-event-width="0"
        :dblclick-to-navigate="false"
        :click-to-navigate="false"
        :editable-events="editableEventsConfig"
        :drag-to-create-event="false"
        :cell-click-hold="false"
        :on-event-create="blockVueCalAutoCreate"
        :on-event-click="onEventClick"
        events-on-month-view
        :disable-views="['years', 'year']"
        :min-date="calendarWindow.minStr"
        :max-date="calendarWindow.maxStr"
        @ready="onCalReady"
        @view-change="onViewChange"
        @event-delete="onEventDelete"
        @event-duration-change="onEventChange"
        @event-drop="onEventChange"
        @cell-click="onCellClick"
      />
    </div>

    <footer class="submit-bar" :class="{ 'submit-bar--inactive': !draftSlots.length }">
      <p class="submit-bar__text">
        <template v-if="draftSlots.length">
          <strong>{{ draftSlots.length }}</strong>
          draft slot{{ draftSlots.length === 1 ? '' : 's' }} — not visible to candidates until you
          submit.
        </template>
        <template v-else>
          Click the calendar to add draft slots, then submit to publish.
        </template>
      </p>
      <div class="submit-bar__actions">
        <button
          type="button"
          class="btn btn--ghost"
          :disabled="!draftSlots.length"
          @click="discardDrafts"
        >
          Discard drafts
        </button>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="!draftSlots.length"
          @click="submitDrafts"
        >
          Submit availability
        </button>
      </div>
    </footer>

    <div v-if="editModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal modal--wide" role="dialog" aria-labelledby="edit-slot-title">
        <h2 id="edit-slot-title">Slot details</h2>
        <p class="modal-slot">{{ editModal.timeLabel }}</p>
        <p v-if="editModal.booked" class="modal-note modal-note--booked">
          Booked by <strong>{{ editModal.candidateName || 'Candidate' }}</strong>. Drag on the
          calendar to change the time.
        </p>
        <p v-else class="modal-note">
          Drag the slot on the calendar to move it, or pull the bottom edge to change duration
          (30‑minute steps).
        </p>
        <label class="field field--inline">
          <span>Notes (optional)</span>
          <input v-model="editContent" type="text" placeholder="e.g. Video call link" />
        </label>
        <div class="modal-actions modal-actions--spread">
          <button type="button" class="btn btn--danger btn--ghost" @click="deleteEditingSlot">
            Delete slot
          </button>
          <div class="modal-actions">
            <button type="button" class="btn btn--ghost" @click="closeEditModal">Cancel</button>
            <button type="button" class="btn btn--primary" @click="saveEditSlot">Save notes</button>
          </div>
        </div>
      </div>
    </div>

    <aside v-if="savedEvents.length || draftSlots.length" class="stats-bar">
      {{ savedEvents.length }} published · {{ draftSlots.length }} draft · {{ bookedCount }} booked
    </aside>
  </section>
</template>

<script>
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import {
  getCalendarEvents,
  syncFromCalendarEvent,
  removeSlot,
  clearAllSlots,
  formatDateTime,
  resolveCellDate,
  getEventId,
  getSlotById,
  updateSlot,
  addSlot
} from '@/services/scheduleStore'
import {
  getCalendarWindow,
  assertSlotStartAllowed,
  snapEventRange,
  slotRangeFromBlockStart
} from '@/utils/workingDays'
import { scheduleRollingWeekView } from '@/utils/rollingWeekView'

const DRAFT_PREFIX = 'draft-'

function isDraftId(id) {
  return Boolean(id && String(id).startsWith(DRAFT_PREFIX))
}

function makeDraftId() {
  return `${DRAFT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default {
  name: 'InterviewerView',
  components: { VueCal },
  data() {
    return {
      savedEvents: [],
      draftSlots: [],
      selectedDate: new Date(),
      activeView: 'week',
      editModal: null,
      editContent: ''
    }
  },
  computed: {
    displayEvents() {
      const drafts = this.draftSlots.map((d) => ({
        id: d.id,
        start: d.start,
        end: d.end,
        title: 'Draft',
        content: 'Submit to publish for candidates',
        class: 'slot-draft',
        isDraft: true,
        booked: false,
        draggable: true,
        resizable: true,
        deletable: true
      }))
      return [...this.savedEvents, ...drafts]
    },
    bookedCount() {
      return this.savedEvents.filter((e) => e.booked).length
    },
    editableEventsConfig() {
      return {
        title: false,
        drag: true,
        resize: true,
        delete: true,
        create: false
      }
    },
    calendarWindow() {
      return getCalendarWindow()
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
    this.refreshSavedEvents()
    window.addEventListener('storage', this.refreshSavedEvents)
  },
  beforeDestroy() {
    window.removeEventListener('storage', this.refreshSavedEvents)
  },
  methods: {
    blockVueCalAutoCreate() {
      return false
    },
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
      this.refreshSavedEvents()
    },
    onViewChange() {
      if (this.activeView === 'week') {
        applyRollingWeekView(this.$refs.vuecal, this.calendarWindow)
        this.scheduleRollingWeek()
      }
    },
    refreshSavedEvents() {
      this.savedEvents = getCalendarEvents()
      if (this.activeView !== 'week') {
        this.selectedDate = new Date(this.calendarWindow.min)
      } else {
        this.$nextTick(() => this.scheduleRollingWeek())
      }
    },
    onEventClick(event, e) {
      if (e && e.stopPropagation) e.stopPropagation()
      const id = getEventId(event)
      if (!id) return false

      if (isDraftId(id)) {
          this.draftSlots = this.draftSlots.filter((d) => d.id !== id)
        return false
      }

      const stored = getSlotById(id)
      this.editModal = {
        id,
        booked: Boolean(event.booked || stored?.booked),
        candidateName: event.candidateName || stored?.candidateName || '',
        timeLabel: `${formatDateTime(event.start)} – ${formatDateTime(event.end)}`
      }
      this.editContent = stored?.content || event.content || ''
      return false
    },
    closeEditModal() {
      this.editModal = null
    },
    guardSlotStart(start) {
      const check = assertSlotStartAllowed(start)
      if (!check.ok) {
        window.alert(check.message)
        return false
      }
      return true
    },
    saveEditSlot() {
      if (!this.editModal) return
      updateSlot(this.editModal.id, {
        content: this.editContent.trim()
      })
      this.closeEditModal()
      this.refreshSavedEvents()
    },
    deleteEditingSlot() {
      if (!this.editModal) return
      if (!window.confirm('Delete this slot?')) return
      removeSlot(this.editModal.id)
      this.closeEditModal()
      this.refreshSavedEvents()
    },
    onCellClick(payload) {
      const raw = resolveCellDate(payload)
      if (!raw) return

      const { start, end } = slotRangeFromBlockStart(raw)
      const startStr = formatDateTime(start)
      const endStr = formatDateTime(end)
      if (!this.guardSlotStart(startStr)) return

      this.draftSlots.push({
        id: makeDraftId(),
        start: startStr,
        end: endStr,
        content: ''
      })
    },
    onEventChange(payload) {
      const event = payload.event || payload
      const id = getEventId(event)

      if (event.booked) {
        window.alert('Booked slots cannot be moved or resized.')
        this.refreshSavedEvents()
        return
      }

      const snapped = snapEventRange(event.start, event.end)
      const start = formatDateTime(snapped.start)
      const end = formatDateTime(snapped.end)

      if (!this.guardSlotStart(start)) {
        this.refreshSavedEvents()
        return
      }

      if (isDraftId(id)) {
        const idx = this.draftSlots.findIndex((d) => d.id === id)
        if (idx !== -1) {
          this.$set(this.draftSlots, idx, { ...this.draftSlots[idx], start, end })
        }
        return
      }

      event.start = snapped.start
      event.end = snapped.end
      syncFromCalendarEvent(event)
      this.$nextTick(() => this.refreshSavedEvents())
    },
    onEventDelete(event) {
      const id = getEventId(event)
      if (!id) return

      if (isDraftId(id)) {
        this.draftSlots = this.draftSlots.filter((d) => d.id !== id)
        return
      }

      removeSlot(id)
      this.refreshSavedEvents()
    },
    submitDrafts() {
      if (!this.draftSlots.length) return

      for (const draft of this.draftSlots) {
        addSlot({
          start: draft.start,
          end: draft.end,
          content: draft.content || ''
        })
      }

      const count = this.draftSlots.length
      this.draftSlots = []
      this.refreshSavedEvents()
      window.alert(`Published ${count} slot${count === 1 ? '' : 's'} for candidates.`)
    },
    discardDrafts() {
      if (!this.draftSlots.length) return
      if (!window.confirm('Discard all draft slots?')) return
      this.draftSlots = []
    },
    clearAll() {
      const hasSaved = this.savedEvents.length > 0
      const hasDrafts = this.draftSlots.length > 0
      if (!hasSaved && !hasDrafts) return

      if (!window.confirm('Remove all published slots and drafts? Bookings will be lost.')) return
      clearAllSlots()
      this.draftSlots = []
      this.refreshSavedEvents()
    }
  }
}
</script>
