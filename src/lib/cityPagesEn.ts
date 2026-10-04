import type { SpaceCity } from './cities'
import { SERVICE_GROUPS, type CityFaq, type CityStats, type DistrictSection } from './cityPages'
import {
  SERVICE_GROUP_EN,
  cameraDisclosureEn,
  cityNameEn,
  cityShortEn,
  districtEn,
  districtShortEn,
  equipmentEn,
  joinEn,
  plural,
  serviceTagEn,
  spaceTypeEn,
  spaceTypeLabelEn,
} from './en'
import { taipeiYear } from './editorial'
import { formatNtd, spaceTypeLabel } from './spaces'
import type { PublicSpace } from './types'

// ---------------------------------------------------------------------------
// English copy for the city landing pages (/en/spaces/city/[city]). Mirrors
// lib/cityPages.ts sentence by sentence; every number comes from the same
// CityStats. No fee / deposit / "free" claims.
// ---------------------------------------------------------------------------

const PRIMARY_GROUP_KEYS = ['lash', 'facial', 'brow']

function rateText(stats: Pick<CityStats, 'minRate' | 'maxRate'>): string {
  if (stats.minRate === null || stats.maxRate === null) return ''
  return stats.minRate === stats.maxRate ? formatNtd(stats.minRate) : `${formatNtd(stats.minRate)}–${stats.maxRate}`
}

function hoursText(stats: CityStats): string | null {
  if (stats.minHours === null || stats.maxHours === null) return null
  return stats.minHours === stats.maxHours ? plural(stats.minHours, 'hour') : `${stats.minHours}–${stats.maxHours} hours`
}

function keywordsEn(stats: CityStats): string[] {
  return stats.services.filter((s) => s.count > 0).slice(0, 3).map((s) => SERVICE_GROUP_EN[s.key]?.keyword ?? s.keyword)
}

function proseEn(key: string, fallback: string): string {
  return SERVICE_GROUP_EN[key]?.prose ?? fallback
}

function nearbyCities(stats: CityStats, allStats: CityStats[]): CityStats[] {
  return stats.city.nearby
    .map((slug) => allStats.find((item) => item.city.slug === slug))
    .filter((item): item is CityStats => Boolean(item && item.count > 0))
}

function districtList(stats: CityStats, withCounts = true): string {
  return joinEn(stats.districts.map((d) => (withCounts ? `${districtEn(d.label, stats.city.name)} (${d.count})` : districtEn(d.label, stats.city.name))))
}

function typeList(stats: CityStats): string {
  return joinEn(stats.types.map((t) => `${t.count} ${spaceTypeLabelEn(t.label).toLowerCase()}${t.count === 1 ? '' : 's'}`))
}

function prosText(stats: CityStats): string {
  const keywords = keywordsEn(stats)
  return `${joinEn((keywords.length ? keywords : ['Lash', 'Facial']).map((k) => k.toLowerCase()))} professionals`
}

// --- metadata ---------------------------------------------------------------

export function buildCityH1En(city: SpaceCity): string {
  return `Beauty workspaces for hourly rent in ${cityShortEn(city)}`
}

/** <title> without the layout's " | SoloBeauté" suffix. */
export function buildCityTitleEn(stats: CityStats): string {
  const keywords = keywordsEn(stats)
  return `${taipeiYear()} ${cityShortEn(stats.city)} Beauty Workspaces by the Hour | ${keywords.length ? joinEn(keywords, 'and') : 'Beauty'} Studios for Rent`
}

export function buildCityOgTitleEn(city: SpaceCity): string {
  return `Beauty workspaces by the hour in ${cityShortEn(city)} | SoloBeauté`
}

export function buildCityDescriptionEn(stats: CityStats): string {
  const { city, count } = stats
  const short = cityShortEn(city)
  if (count === 0) {
    return `There are no beauty workspaces listed in ${short} on SoloBeauté yet; new spaces are being added. Browse beauty workspaces for hourly rent in other cities in Taiwan.`
  }
  if (count >= 3) {
    const districts = stats.districts.length >= 3
      ? `in ${stats.districts.slice(0, 3).map((d) => districtShortEn(d.label, city.name)).join(', ')} and more`
      : `in ${districtList(stats, false)}`
    return `Beauty studios for hourly rent in ${short}: ${count} workspaces ${districts}, ${rateText(stats)} per hour. For ${prosText(stats)}; message the host in the SoloBeauté app and pay on site.`
  }
  const where = districtList(stats, false)
  const from = stats.minRate !== null ? `, from ${formatNtd(stats.minRate)} per hour` : ''
  return `${plural(count, 'beauty workspace')} for hourly rent in ${where}, ${short}${from}. For ${prosText(stats)}; message the host in the SoloBeauté app and pay on site. More spaces are being added.`
}

// --- on-page copy -----------------------------------------------------------

export function buildCityIntroEn(stats: CityStats, allStats: CityStats[], dateLabel: string): string[] {
  const { city, count, spaces } = stats
  const short = cityShortEn(city)
  const keywords = keywordsEn(stats)
  const nearby = nearbyCities(stats, allStats)
  const nearbyText = nearby.length
    ? `nearby ${joinEn(nearby.map((n) => `${cityShortEn(n.city)} (${n.count})`))}`
    : 'other cities'

  if (count === 0) {
    return [
      `As of ${dateLabel}, SoloBeauté has no beauty workspaces listed in ${cityNameEn(city.name)}. New spaces are being added; in the meantime, take a look at spaces in ${nearbyText}, or download the SoloBeauté app to follow new listings.`,
      `If you have an idle treatment room, lash bed or nail station in ${short}, you can list it in the SoloBeauté app and rent it to beauty professionals nearby by the hour.`,
    ]
  }

  const sentences: string[] = []
  sentences.push(`Looking for a ${joinEn((keywords.length ? keywords : ['beauty']).map((k) => k.toLowerCase()), 'or')} workspace in ${short}?`)

  const rate = rateText(stats)
  const hours = hoursText(stats)
  const servicePhrases = stats.services.filter((s) => s.count > 0)

  if (count === 1) {
    const space = spaces[0]
    sentences.push(
      `As of ${dateLabel}, SoloBeauté has 1 host-prepared beauty workspace in ${cityNameEn(city.name)}: a ${spaceTypeEn(space.spaceType).toLowerCase()} in ${space.district ? districtEn(space.district, city.name) : cityNameEn(city.name)}.`
    )
    const priceParts = [
      rate ? `${rate} per hour` : null,
      hours ? `a ${stats.minHours}-hour minimum` : null,
      space.halfDayRate ? `${formatNtd(space.halfDayRate)} for a half day` : null,
      space.fullDayRate ? `${formatNtd(space.fullDayRate)} for a full day` : null,
    ].filter((part): part is string => Boolean(part))
    if (priceParts.length) sentences.push(`It costs ${joinEn(priceParts)}.`)
    if (space.recommendedServices.length) {
      sentences.push(`The host marks it as suitable for ${joinEn(space.recommendedServices.slice(0, 5).map((s) => serviceTagEn(s).toLowerCase()))}.`)
    }
    if (space.equipment.length) {
      sentences.push(`Equipment on site: ${joinEn(space.equipment.slice(0, 7).map((e) => equipmentEn(e).toLowerCase()))}.`)
    }
    const camera = cameraDisclosureEn(space.cameraDisclosureStatus)
    if (camera) sentences.push(camera)
  } else {
    sentences.push(
      `As of ${dateLabel}, SoloBeauté has ${count} host-prepared beauty workspaces in ${cityNameEn(city.name)}: ${districtList(stats)}.`
    )
    sentences.push(`By type, there are ${typeList(stats)}.`)
    const medianText = stats.minRate !== stats.maxRate && stats.medianRate !== null ? ` (median ${formatNtd(stats.medianRate)})` : ''
    const priceLine = [
      rate ? (stats.minRate === stats.maxRate ? `all charge ${rate} per hour` : `hourly rates run ${rate}${medianText}`) : null,
      hours ? `minimum bookings are ${hours}` : null,
      stats.withHalfOrFullDay > 0 ? `${stats.withHalfOrFullDay} also offer a half-day or full-day rate` : null,
    ].filter((part): part is string => Boolean(part))
    if (priceLine.length) {
      const text = priceLine.join('; ')
      sentences.push(`${text.charAt(0).toUpperCase()}${text.slice(1)}.`)
    }
    if (servicePhrases.length) {
      sentences.push(`Based on the services hosts recommend, ${joinEn(servicePhrases.map((s) => `${s.count} suit ${proseEn(s.key, s.label)}`))}.`)
    }
    if (stats.equipment.length) {
      sentences.push(`For equipment, ${joinEn(stats.equipment.map((e) => `${e.count} have ${equipmentArticle(e.label)}`))}.`)
    }
  }

  const missingPrimary = stats.services.filter((s) => PRIMARY_GROUP_KEYS.includes(s.key) && s.count === 0)
  if (missingPrimary.length > 0) {
    sentences.push(`No host has marked a space as suitable for ${joinEn(missingPrimary.map((s) => proseEn(s.key, s.label)), 'or')} yet.`)
  }
  if (stats.withRoomScan > 0) {
    sentences.push(count === 1 ? 'This space has a 3D tour you can view first.' : `${stats.withRoomScan} of them have a 3D tour you can view first.`)
  }
  if (count <= 2) {
    sentences.push(`There aren't many spaces in ${short} yet and more are being added; you can also look at spaces in ${nearbyText}.`)
  }

  return [
    sentences.join(' '),
    'Spaces are rented by the hour with no long-term lease. Message the host in the SoloBeauté app to confirm a time slot, and pay the rent to the host on site. To protect hosts, this website shows only the district; the full location is in the app.',
  ]
}

function equipmentArticle(label: string): string {
  const name = equipmentEn(label).toLowerCase()
  if (name === 'parking') return 'parking'
  return `a ${name}`
}

export function buildCityFaqEn(stats: CityStats, allStats: CityStats[], dateLabel: string): CityFaq[] {
  const { city, count } = stats
  const short = cityShortEn(city)
  const nearby = nearbyCities(stats, allStats)
  const nearbyText = nearby.length ? joinEn(nearby.map((n) => cityShortEn(n.city))) : 'other cities'
  const rate = rateText(stats)
  const hours = hoursText(stats)
  const howTo = {
    question: `How do I rent a beauty workspace in ${short}?`,
    answer: 'Open the space page in the SoloBeauté app and message the host to confirm a time slot. Spaces are rented by the hour with no long-term lease, and the rent is paid to the host on site.',
  }

  if (count === 0) {
    return [
      {
        question: `Are there beauty workspaces for hourly rent in ${short}?`,
        answer: `As of ${dateLabel}, SoloBeauté has no spaces listed in ${cityNameEn(city.name)}; new spaces are being added. In the meantime, take a look at beauty workspaces in ${nearbyText}.`,
      },
      {
        question: `I have an idle treatment room in ${short}. Can I rent it out?`,
        answer: 'Yes. Download the SoloBeauté app to list your space and set your hourly rate and available time slots; beauty professionals will message you directly.',
      },
      howTo,
    ]
  }

  const priceAnswer = count === 1
    ? `As of ${dateLabel}, there is 1 beauty workspace in ${cityNameEn(city.name)}, at ${rate} per hour${hours ? ` with a ${stats.minHours}-hour minimum` : ''}. The price shown on the space page and in the app is the one that applies.`
    : `As of ${dateLabel}, the ${count} beauty workspaces on SoloBeauté in ${cityNameEn(city.name)} ${stats.minRate === stats.maxRate ? `all charge ${rate} per hour` : `charge ${rate} per hour, with a median of ${formatNtd(stats.medianRate ?? 0)}`}${hours ? `; minimum bookings are ${hours}` : ''}. The price shown on each space page and in the app is the one that applies.`

  const primary = stats.services.filter((s) => PRIMARY_GROUP_KEYS.includes(s.key))
  const present = primary.filter((s) => s.count > 0)
  const absent = primary.filter((s) => s.count === 0)
  const nail = stats.services.find((s) => s.key === 'nail')
  let serviceAnswer: string
  if (present.length === 0) {
    const listed = Array.from(new Set(stats.spaces.flatMap((s) => s.recommendedServices))).slice(0, 6)
    serviceAnswer = `Not yet. Hosts in ${cityNameEn(city.name)} have marked their spaces as suitable for ${listed.length ? joinEn(listed.map((s) => serviceTagEn(s).toLowerCase())) : 'other beauty services'}. Lash, facial and brow professionals can look at spaces in ${nearbyText}.`
  } else {
    serviceAnswer = `Yes. Of the ${count} spaces in ${cityNameEn(city.name)}, ${joinEn(present.map((s) => `${s.count} suit ${proseEn(s.key, s.label)}`))}`
    if (absent.length) serviceAnswer += `; no space is marked as suitable for ${joinEn(absent.map((s) => proseEn(s.key, s.label)), 'or')} yet`
    serviceAnswer += nail && nail.count > 0 ? `. ${nail.count} suit nails.` : '.'
    serviceAnswer += ' What each space suits is whatever the host has marked on its space page.'
  }

  return [
    { question: `How much does it cost to rent a beauty workspace by the hour in ${short}?`, answer: priceAnswer },
    {
      question: `Which districts in ${short} have beauty workspaces for rent?`,
      answer: `Currently ${districtList(stats)}. The website shows only the district; the full location is in the SoloBeauté app.`,
    },
    { question: `Are there spaces in ${short} suited to lash, facial and brow work?`, answer: serviceAnswer },
    howTo,
  ]
}

// --- extra city sections -----------------------------------------------------

export function buildDistrictSectionsEn(stats: CityStats, sections: DistrictSection[]): Array<DistrictSection & { label: string }> {
  return sections.map((section) => {
    const { spaces } = section
    const count = spaces.length
    const rates = spaces.map((s) => s.hourlyRate).filter((r): r is number => r !== null)
    const rate = rates.length ? rateText({ minRate: Math.min(...rates), maxRate: Math.max(...rates) }) : ''
    const types = countTypes(spaces)
    const services = SERVICE_GROUPS
      .map((group) => ({ group, n: spaces.filter((s) => s.recommendedServices.some(group.match)).length }))
      .filter((item) => item.n > 0)
    const districtName = districtEn(section.district, stats.city.name)
    const details = [
      types.length ? (count === 1 ? `a ${types[0].label.toLowerCase()}` : typesSentence(types)) : null,
      rate ? `${rate} per hour` : null,
    ].filter(Boolean)
    let summary = `${districtName}, ${cityNameEn(stats.city.name)} currently has ${plural(count, 'beauty workspace')}${details.length ? ` (${details.join(', ')})` : ''}.`
    if (services.length) {
      summary += count === 1
        ? ` The host marks it as suitable for ${joinEn(services.map((s) => proseEn(s.group.key, s.group.prose)))}.`
        : ` Based on what hosts mark, ${joinEn(services.map((s) => `${s.n} suit ${proseEn(s.group.key, s.group.prose)}`))}.`
    }
    return {
      ...section,
      label: districtName,
      heading: `Beauty workspaces for hourly rent in ${districtShortEn(section.district, stats.city.name)}, ${cityShortEn(stats.city)}`,
      summary,
    }
  })
}

function countTypes(spaces: PublicSpace[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()
  spaces.forEach((s) => {
    const label = spaceTypeLabelEn(spaceTypeLabel(s.spaceType))
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

function typesSentence(types: Array<{ label: string; count: number }>): string {
  return joinEn(types.map((t) => `${t.count} ${t.label.toLowerCase()}${t.count === 1 ? '' : 's'}`))
}

export function buildCityListHeadingEn(stats: CityStats): string {
  return stats.city.slug === 'kaohsiung' ? `Shared beauty spaces in ${cityShortEn(stats.city)}` : `Beauty workspaces in ${cityShortEn(stats.city)}`
}

export function buildSharedSpaceNoteEn(stats: CityStats): string | null {
  if (stats.city.slug !== 'kaohsiung' || stats.count === 0) return null
  return `Spaces on SoloBeauté are listed by different hosts and shared by beauty professionals by the hour, booked only when needed. ${cityShortEn(stats.city)} currently has ${stats.count}, in ${districtList(stats, false)}.`
}

export function buildCityLeadNoteEn(stats: CityStats, allStats: CityStats[]): string | null {
  const { city, count, spaces } = stats
  if (count === 0) return null
  const short = cityShortEn(city)
  if (city.slug === 'taichung') {
    const withBed = spaces.filter((s) => s.equipment.includes('美容床'))
    if (withBed.length === 0) return null
    const rates = withBed.map((s) => s.hourlyRate).filter((r): r is number => r !== null)
    const rate = rates.length ? rateText({ minRate: Math.min(...rates), maxRate: Math.max(...rates) }) : ''
    const share = withBed.length === count
      ? (count === 1 ? 'this space has a beauty bed' : `all ${count} spaces have a beauty bed`)
      : `${withBed.length} of the ${count} spaces have a beauty bed`
    return `Beauty beds for hourly rent in ${short}: ${share}${rate ? `, at ${rate} per hour` : ''}.`
  }
  if (city.slug === 'nantou') {
    const rate = rateText(stats)
    const services = Array.from(new Set(spaces.flatMap((s) => s.recommendedServices))).slice(0, 5)
    const nearby = nearbyCities(stats, allStats)
    const hasPrimary = stats.services.some((s) => PRIMARY_GROUP_KEYS.includes(s.key) && s.count > 0)
    let text = `Beauty studios for hourly rent in Nantou: SoloBeauté currently has ${plural(count, 'beauty workspace')} in ${cityNameEn(city.name)}${rate ? `, at ${rate} per hour` : ''}`
    text += services.length ? `; the host marks it as suitable for ${joinEn(services.map((s) => serviceTagEn(s).toLowerCase()))}.` : '.'
    if (count > 1) text = text.replace('the host marks it as', 'hosts mark them as')
    if (!hasPrimary && nearby.length) {
      text += ` Pros looking for lash or facial spaces can also look at nearby ${joinEn(nearby.map((n) => `${cityShortEn(n.city)} (${n.count})`))}.`
    }
    return text
  }
  return null
}

/** Breadcrumb / other-city chip label: "Taipei beauty workspaces". */
export function cityChipEn(city: SpaceCity): string {
  return `${cityShortEn(city)} beauty workspaces`
}
