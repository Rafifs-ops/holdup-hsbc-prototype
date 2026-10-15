/**
 * Date helpers. Everything is derived from the system clock so the dashboard
 * never shows hard-coded day counts.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function asDate(value) {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Days left in the current month, including today. Always >= 1 so callers can
 * never divide by zero.
 */
export function daysRemainingInMonth(date = new Date(), { includeToday = true } = {}) {
  const now = asDate(date)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const raw = lastDay - now.getDate() + (includeToday ? 1 : 0)
  return Math.max(1, raw)
}

export function monthNameLong(date = new Date()) {
  return MONTHS_LONG[asDate(date).getMonth()]
}

/** "12 Okt" or "Hari ini" / "Kemarin" for recent items. */
export function formatDateShort(value, reference = new Date()) {
  const date = asDate(value)
  const ref = asDate(reference)
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(ref) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

/** "18:24" */
export function formatTime(value) {
  const date = asDate(value)
  return `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`
}

/** "12 Okt • 18.24" */
export function formatDateTimeShort(value, reference = new Date()) {
  return `${formatDateShort(value, reference)} • ${formatTime(value)}`
}

/** Time-based greeting used by the app header. */
export function greetingFor(date = new Date()) {
  const hour = asDate(date).getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

/** Shifts a date by whole days and returns a new Date. */
export function shiftDays(days, from = new Date()) {
  const date = asDate(from)
  return new Date(date.getTime() + days * 86_400_000)
}
