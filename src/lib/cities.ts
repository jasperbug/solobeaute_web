// City landing pages (/spaces/city/[city]). No imports on purpose so both
// lib/spaces.ts and the city page helpers can use it without a cycle.

export type SpaceCity = {
  /** URL slug: /spaces/city/{slug} */
  slug: string
  /** Name as stored by the backend (`space.city`), e.g. 台北市 */
  name: string
  /** Short name used in copy, e.g. 台北 (「台」, not 「臺」, per seo_copy_v1 §5.1) */
  short: string
  /** Other city pages to suggest when this city has few spaces (geographic neighbours first). */
  nearby: string[]
}

// Order = SERVICE_AREAS order (north → south as listed on the site).
export const SPACE_CITIES: SpaceCity[] = [
  { slug: 'taipei', name: '台北市', short: '台北', nearby: ['new-taipei', 'taoyuan'] },
  { slug: 'new-taipei', name: '新北市', short: '新北', nearby: ['taipei', 'taoyuan'] },
  { slug: 'taoyuan', name: '桃園市', short: '桃園', nearby: ['new-taipei', 'taipei'] },
  { slug: 'taichung', name: '台中市', short: '台中', nearby: ['changhua', 'nantou'] },
  { slug: 'kaohsiung', name: '高雄市', short: '高雄', nearby: [] },
  { slug: 'changhua', name: '彰化縣', short: '彰化', nearby: ['taichung', 'nantou'] },
  { slug: 'nantou', name: '南投縣', short: '南投', nearby: ['taichung', 'changhua'] },
]

/** 臺北市 and 台北市 are the same city. */
export function normalizeCityName(city: string | null | undefined): string {
  return (city ?? '').trim().replace(/^臺/, '台')
}

export function getCityBySlug(slug: string): SpaceCity | null {
  return SPACE_CITIES.find((city) => city.slug === slug) ?? null
}

export function getCityByName(name: string | null | undefined): SpaceCity | null {
  const normalized = normalizeCityName(name)
  return SPACE_CITIES.find((city) => city.name === normalized) ?? null
}

export function cityPagePath(city: SpaceCity): string {
  return `/spaces/city/${city.slug}`
}
