const STORAGE_KEY = 'interview-scheduler-slots'

function loadRaw() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveRaw(slots) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
}

export function makeId() {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function resolveCellDate(payload) {
  if (payload instanceof Date) return payload
  if (payload && payload.date instanceof Date) return payload.date
  return null
}

export function getEventId(event) {
  return event.id || event._eid || null
}

export function getSlots() {
  return loadRaw()
}

export function getSlotById(id) {
  return loadRaw().find((s) => s.id === id) || null
}

export function getDurationMinutes(startStr, endStr) {
  const s = new Date(String(startStr).replace(/-/g, '/'))
  const e = new Date(String(endStr).replace(/-/g, '/'))
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 60
  return Math.max(15, Math.round((e - s) / 60000))
}

export function computeEndDateTime(startStr, durationMinutes) {
  const d = new Date(String(startStr).replace(/-/g, '/'))
  d.setMinutes(d.getMinutes() + durationMinutes)
  return formatDateTime(d)
}

export function splitDateTime(dateTimeStr) {
  const str = formatDateTime(dateTimeStr)
  return {
    date: str.slice(0, 10),
    time: str.slice(11, 16)
  }
}

export function getCalendarEvents() {
  return getSlots().map(toCalendarEvent)
}

export function toCalendarEvent(slot) {
  const booked = Boolean(slot.booked)
  return {
    id: slot.id,
    start: slot.start,
    end: slot.end,
    title: booked ? `Booked — ${slot.candidateName || 'Candidate'}` : 'Available',
    content: slot.content || (booked ? 'Interview slot taken' : 'Click to book (candidate view)'),
    class: booked ? 'slot-booked' : 'slot-available',
    booked,
    candidateName: slot.candidateName || '',
    draggable: !booked,
    resizable: !booked,
    deletable: true
  }
}

export function addSlot({ start, end, title, content }) {
  const slots = loadRaw()
  const slot = {
    id: makeId(),
    start,
    end,
    title: title || 'Available',
    content: content || '',
    booked: false,
    candidateName: ''
  }
  slots.push(slot)
  saveRaw(slots)
  return slot
}

export function updateSlot(id, patch) {
  const slots = loadRaw()
  const index = slots.findIndex((s) => s.id === id)
  if (index === -1) return null
  slots[index] = { ...slots[index], ...patch }
  saveRaw(slots)
  return slots[index]
}

export function removeSlot(id) {
  const slots = loadRaw().filter((s) => s.id !== id)
  saveRaw(slots)
}

export function bookSlot(id, candidateName) {
  return updateSlot(id, {
    booked: true,
    candidateName: candidateName.trim()
  })
}

export function syncFromCalendarEvent(event) {
  const eventId = getEventId(event) || makeId()
  const slots = loadRaw()
  const index = slots.findIndex((s) => s.id === eventId)
  const slot = {
    id: eventId,
    start: formatDateTime(event.start),
    end: formatDateTime(event.end),
    title: event.title,
    content: event.content || '',
    booked: Boolean(event.booked),
    candidateName: event.candidateName || ''
  }
  if (index === -1) {
    slots.push(slot)
  } else {
    slots[index] = { ...slots[index], ...slot }
  }
  saveRaw(slots)
  return slot
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function clearAllSlots() {
  saveRaw([])
}
