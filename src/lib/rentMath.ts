// ---------------------------------------------------------------------------
// Illustrative 時租 vs 月租 arithmetic. Only the hourly median comes from data
// (/spaces/price-report). No market monthly-rent figure is used anywhere: the
// reader brings their own monthly quote, and the break-even is quote ÷ rate.
// ---------------------------------------------------------------------------

export type UsageScenario = { hours: number; clientsPerWeek: number; label: string }

/** Assumption: a month = 4 weeks; each booking = 2 hours (the most common minimum). */
export const USAGE_SCENARIOS: UsageScenario[] = [
  { hours: 8, clientsPerWeek: 1, label: '每週 1 位客人' },
  { hours: 16, clientsPerWeek: 2, label: '每週 2 位客人' },
  { hours: 24, clientsPerWeek: 3, label: '每週 3 位客人' },
  { hours: 40, clientsPerWeek: 5, label: '每週 5 位客人' },
]

export const SCENARIO_ASSUMPTION = '假設一個月以 4 週計、每位客人租 2 小時'

export function monthlyHourlyCost(hours: number, rate: number): number {
  return hours * rate
}
