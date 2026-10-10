import type { AvailabilityDay, AvailabilitySlot } from './data'

// ---------------------------------------------------------------------------
// What get_space_availability shows to AI agents.
//
// 'free_slots' (default, recommended): only the bookable gaps, computed here as
//   opening hours − booked slots − host-blocked slots, keeping gaps of at least
//   minBookingHours and dropping times that have already passed (Taipei).
//   Booked / blocked slots themselves are never sent.
// 'occupied_slots': also include bookedSlots / blockedSlots (times only).
//
// Decided by Jasper (2026-10-10): free_slots only. Leave MCP_AVAILABILITY_EXPOSURE
// unset in production. Setting it to occupied_slots would also expose booked /
// blocked times, so only do that with Jasper's sign-off.
// ---------------------------------------------------------------------------

export type AvailabilityExposure = 'free_slots' | 'occupied_slots'

export const AVAILABILITY_EXPOSURE_DEFAULT: AvailabilityExposure = 'free_slots'

export function availabilityExposure(): AvailabilityExposure {
  return process.env.MCP_AVAILABILITY_EXPOSURE === 'occupied_slots' ? 'occupied_slots' : AVAILABILITY_EXPOSURE_DEFAULT
}

/** Backend #192 limits: yesterday ≤ from ≤ to ≤ today + 30 (Taipei, = maxDate), at most 30 days incl. both ends. */
export const BACKEND_MAX_AVAILABILITY_DAYS = 30
export const BACKEND_MAX_ADVANCE_DAYS = 30
/** MCP keeps a tighter window (smaller answers, fewer calls against the backend's 60/min per IP). */
export const MCP_MAX_AVAILABILITY_DAYS = 14
export const MCP_DEFAULT_AVAILABILITY_DAYS = 7
/** Fallback when the backend sends no minBookingHours (PLATFORM_CONFIG.MIN_BOOKING_HOURS). */
const DEFAULT_MIN_BOOKING_HOURS = 2
/** Today's gaps start at the next half hour from now. */
const START_ROUNDING_MINUTES = 30

// --- dates (Asia/Taipei) ------------------------------------------------------

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000

export function taipeiNow(now: Date = new Date()): { date: string; minutes: number } {
  const shifted = new Date(now.getTime() + TAIPEI_OFFSET_MS)
  return { date: shifted.toISOString().slice(0, 10), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() }
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

function daysInclusive(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
}

/**
 * Same rules as the backend's resolvePublicAvailabilityRange, with the MCP's
 * own 14-day cap: defaults from = today, to = from + 6 (clamped to today + 30);
 * yesterday ≤ from ≤ to ≤ today + 30.
 */
export function resolveAvailabilityRange(
  input: { from?: string; to?: string },
  now: Date = new Date()
): { from: string; to: string } | null {
  const today = taipeiNow(now).date
  const from = input.from?.trim() || today
  const maxDate = addDays(today, BACKEND_MAX_ADVANCE_DAYS)
  const defaultTo = isValidDate(from) ? addDays(from, MCP_DEFAULT_AVAILABILITY_DAYS - 1) : from
  const to = input.to?.trim() || (defaultTo > maxDate ? maxDate : defaultTo)
  if (!isValidDate(from) || !isValidDate(to)) return null
  if (from < addDays(today, -1) || to < from || to > maxDate) return null
  if (daysInclusive(from, to) > Math.min(MCP_MAX_AVAILABILITY_DAYS, BACKEND_MAX_AVAILABILITY_DAYS)) return null
  return { from, to }
}

// --- free slots ---------------------------------------------------------------

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

type Range = [number, number]

function subtract(base: Range, cuts: Range[]): Range[] {
  let pieces: Range[] = [base]
  for (const [cs, ce] of cuts) {
    if (ce <= cs) continue
    pieces = pieces.flatMap(([s, e]) => {
      if (ce <= s || cs >= e) return [[s, e] as Range]
      const out: Range[] = []
      if (cs > s) out.push([s, cs])
      if (ce < e) out.push([ce, e])
      return out
    })
  }
  return pieces
}

/** Bookable gaps of one day: opening hours − booked − blocked, each ≥ minBookingHours. */
export function freeSlotsForDay(
  day: AvailabilityDay,
  minBookingHours: number | null,
  now: { date: string; minutes: number }
): AvailabilitySlot[] {
  if (!day.isOpen || !day.openTime || !day.closeTime || day.date < now.date) return []
  let open = toMinutes(day.openTime)
  const close = toMinutes(day.closeTime)
  if (day.date === now.date) {
    const next = Math.ceil(now.minutes / START_ROUNDING_MINUTES) * START_ROUNDING_MINUTES
    open = Math.max(open, next)
  }
  if (close <= open) return []
  const minMinutes = (minBookingHours ?? DEFAULT_MIN_BOOKING_HOURS) * 60
  const cuts = [...day.bookedSlots, ...day.blockedSlots].map((slot) => [toMinutes(slot.startTime), toMinutes(slot.endTime)] as Range)
  return subtract([open, close], cuts)
    .filter(([s, e]) => e - s >= minMinutes)
    .map(([s, e]) => ({ startTime: toTime(s), endTime: toTime(e) }))
}

/** One day as shown to the agent, according to the exposure setting. */
export function presentDay(
  day: AvailabilityDay,
  minBookingHours: number | null,
  now: { date: string; minutes: number },
  exposure: AvailabilityExposure = availabilityExposure()
) {
  const freeSlots = freeSlotsForDay(day, minBookingHours, now)
  return {
    date: day.date,
    dayOfWeek: day.dayOfWeek,
    isOpen: day.isOpen,
    openTime: day.openTime,
    closeTime: day.closeTime,
    freeSlots,
    ...(day.date < now.date ? { isPast: true } : {}),
    ...(exposure === 'occupied_slots' ? { bookedSlots: day.bookedSlots, blockedSlots: day.blockedSlots } : {}),
  }
}
