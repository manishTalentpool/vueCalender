export const CALENDAR_DAYS_LIMIT = 7
export const WORKING_DAYS_LIMIT = CALENDAR_DAYS_LIMIT
export const SLOT_DURATION_MINUTES = 30

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today through the next (limit - 1) calendar days. */
export function getCalendarWindow(limit = CALENDAR_DAYS_LIMIT) {
  const min = startOfDay(new Date())
  const allowedDates = []
  const cursor = new Date(min)

  for (let i = 0; i < limit; i++) {
    allowedDates.push(toDateValue(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const max = startOfDay(
    new Date(String(allowedDates[allowedDates.length - 1]).replace(/-/g, '/'))
  )
  const maxEndExclusive = new Date(max)
  maxEndExclusive.setDate(maxEndExclusive.getDate() + 1)

  return {
    min,
    max,
    minStr: toDateValue(min),
    maxStr: toDateValue(max),
    maxEndExclusiveStr: toDateValue(maxEndExclusive),
    allowedDates,
    allowedSet: new Set(allowedDates)
  }
}

export function getWorkingDayWindow(limit) {
  return getCalendarWindow(limit)
}

export function isDateInBookingWindow(dateTime) {
  if (!dateTime) return false
  if (typeof dateTime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateTime)) {
    return getCalendarWindow().allowedSet.has(dateTime.slice(0, 10))
  }
  const d =
    dateTime instanceof Date
      ? dateTime
      : new Date(String(dateTime).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return false
  return getCalendarWindow().allowedSet.has(toDateValue(d))
}

export function getDefaultBookingDate() {
  return getCalendarWindow().minStr
}

export function assertSlotStartAllowed(startStr) {
  if (!isDateInBookingWindow(startStr)) {
    const { minStr, maxStr } = getCalendarWindow()
    return {
      ok: false,
      message: `Slots can only be scheduled from ${minStr} through ${maxStr} (today and the next ${CALENDAR_DAYS_LIMIT - 1} days).`
    }
  }
  return { ok: true }
}

/** Snap to the start of the 30-minute grid block (e.g. 10:12 → 10:00). */
export function floorTo30Minutes(value) {
  const d = value instanceof Date ? new Date(value) : new Date(String(value).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return d
  const total = d.getHours() * 60 + d.getMinutes()
  const floored = Math.floor(total / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES
  d.setHours(Math.floor(floored / 60), floored % 60, 0, 0)
  return d
}

export function snapTo30Minutes(value) {
  return floorTo30Minutes(value)
}

/** One grid block: 30 minutes from block start (10:00 → 10:30). */
export function slotRangeFromBlockStart(startValue) {
  const start = floorTo30Minutes(startValue)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES)
  return { start, end }
}

export function snapEventRange(start, end) {
  const snappedStart = floorTo30Minutes(start)
  const endDate =
    end instanceof Date ? new Date(end) : new Date(String(end).replace(/-/g, '/'))
  const startMins = snappedStart.getHours() * 60 + snappedStart.getMinutes()
  let endMins = endDate.getHours() * 60 + endDate.getMinutes()
  endMins = Math.max(
    startMins + SLOT_DURATION_MINUTES,
    Math.ceil(endMins / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES
  )
  const snappedEnd = new Date(snappedStart)
  snappedEnd.setHours(Math.floor(endMins / 60), endMins % 60, 0, 0)
  return { start: snappedStart, end: snappedEnd }
}
