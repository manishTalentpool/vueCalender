import { getCalendarWindow } from '@/utils/workingDays'

/**
 * Force vue-cal week view to show today + next 6 days (not Mon–Sun).
 * vue-cal's switchView('week') always aligns to calendar week start.
 */
export function applyRollingWeekView(vueCal, window) {
  if (!vueCal || !vueCal.view || vueCal.view.id !== 'week') return false

  const range = window || getCalendarWindow()
  const start = new Date(range.min)
  start.setHours(0, 0, 0, 0)
  const end = new Date(range.max)
  end.setHours(23, 59, 59, 0)

  vueCal.view.startDate = start
  vueCal.view.endDate = end
  vueCal.view.selectedDate = new Date(start)
  vueCal.addEventsToView()
  vueCal.$forceUpdate()
  return true
}

function resolveWindow(getWindow) {
  return typeof getWindow === 'function' ? getWindow() : getWindow
}

/**
 * Wrap vue-cal so every week switchView / updateSelectedDate ends on today..today+6.
 */
export function patchRollingWeekCalendar(vueCal, getWindow) {
  if (!vueCal || vueCal._rollingWeekPatched) return

  const originalSwitch = vueCal.switchView.bind(vueCal)
  vueCal.switchView = function patchedSwitchView(view, date, transition) {
    originalSwitch(view, date, transition)
    if (view === 'week') {
      applyRollingWeekView(vueCal, resolveWindow(getWindow))
    }
  }

  const originalUpdate = vueCal.updateSelectedDate.bind(vueCal)
  vueCal.updateSelectedDate = function patchedUpdateSelectedDate(date) {
    originalUpdate(date)
    if (this.view.id === 'week') {
      applyRollingWeekView(this, resolveWindow(getWindow))
    }
  }

  vueCal._rollingWeekPatched = true
}

function runApply(vm, getCal, window) {
  const cal = typeof getCal === 'function' ? getCal() : getCal
  if (!cal) return
  applyRollingWeekView(cal, window)
}

/** Run after vue-cal finishes switchView (multiple ticks + rAF). */
export function scheduleRollingWeekView(vm, getCal, window) {
  if (!vm) return

  const run = () => runApply(vm, getCal, window)

  run()
  vm.$nextTick(run)
  vm.$nextTick(() => {
    run()
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run)
    }
  })
  setTimeout(run, 0)
  setTimeout(run, 50)
}
