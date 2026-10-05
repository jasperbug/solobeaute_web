import { localizePath } from '@/i18n/config'

import { BRAND_FAQ_EN } from './brandFacts'
import { SPACE_CITIES, cityPagePath, normalizeCityName } from './cities'
import { cityShortEn, equipmentEn, joinEn, rateRangeEn } from './en'
import type { FaqEntry, FaqGroup, FaqItem } from './faqPage'
import { buildPriceReport } from './priceReport'
import { formatNtd } from './spaces'
import type { PublicSpace } from './types'

// ---------------------------------------------------------------------------
// English /en/faq: same groups, same order and same facts as lib/faqPage.ts.
// No fee / "free" / deposit claims. Consumer booking is not open.
// ---------------------------------------------------------------------------

const en = (path: string) => localizePath(path, 'en')

const HOME = {
  price: 0,
  contract: 1,
  payment: 2,
  join: 3,
  cities: 4,
  services: 5,
  findSpace: 6,
  hostList: 7,
  partialHours: 8,
  profile: 9,
  consumerBooking: 10,
  difference: 11,
} as const

const EQUIPMENT_FOR_FAQ = ['冷氣', '化妝室', 'Wi-Fi', '美容床', '美容燈', '美甲桌椅']

/** "a beauty bed", "air conditioning", "Wi-Fi" for sentences. */
function equipmentLower(label: string): string {
  const name = equipmentEn(label)
  if (name === 'Wi-Fi') return 'Wi-Fi'
  if (['Air conditioning'].includes(name)) return name.toLowerCase()
  return `a ${name.toLowerCase()}`
}

function equipmentAnswer(spaces: PublicSpace[] | null): string {
  const base = 'Each host lists the equipment in their space, and it is shown on the space page and in the app: for example a beauty bed, beauty lamp, nail table and chair, shampoo station, restroom, air conditioning or Wi-Fi.'
  const tail = 'For anything not on the list (such as consumables or personal tools), message the host before you book.'
  if (!spaces || spaces.length === 0) return `${base} ${tail}`
  const counts = EQUIPMENT_FOR_FAQ
    .map((label) => ({ label, count: spaces.filter((s) => s.equipment.includes(label)).length }))
    .filter((item) => item.count > 0)
  if (counts.length === 0) return `${base} ${tail}`
  return `${base} Of the ${spaces.length} spaces listed now, ${joinEn(counts.map((c) => `${c.count} have ${equipmentLower(c.label)}`))}. ${tail}`
}

function browEntry(spaces: PublicSpace[] | null): FaqEntry {
  const q = 'Are there studios suited to brow and lip embroidery that I can rent by the hour?'
  const linkText = 'brow artists section'
  const tail = `What each space is suited to is whatever the host has marked on its space page; for more figures, see the ${linkText} of the price report.`
  const links = [{ text: linkText, href: `${en('/spaces/price-report')}#brow` }]
  const brow = spaces && spaces.length ? buildPriceReport(spaces).professions.find((p) => p.key === 'brow') : undefined
  if (!brow) {
    return { q, a: `Yes. Some hosts mark their spaces as suitable for brow and lip embroidery, and the app and space pages list what each space is suited to and its equipment. ${tail}`, links }
  }
  if (brow.count === 0) {
    return { q, a: `No host has marked a space as suitable for brow and lip embroidery yet; new spaces are being added. ${tail}`, links }
  }
  const h = brow.hourly
  const rate = h.min !== null && h.max !== null
    ? (h.min === h.max ? `${formatNtd(h.min)} per hour` : `${rateRangeEn(h.min, h.max)} per hour${h.count >= 2 && h.median !== null ? ` (median ${formatNtd(h.median)})` : ''}`)
    : ''
  const bed = brow.equipment.find((e) => e.label === '美容床')
  const parts = [
    `Yes. Of the ${spaces?.length ?? 0} spaces listed now, ${brow.count} are marked by their hosts as suitable for brow and lip embroidery`,
    rate || null,
    bed && bed.count > 0 ? `${bed.count} have a beauty bed` : null,
    brow.cities.length ? `in ${joinEn(brow.cities.map((c) => `${cityShortEn(c.label)} (${c.count})`))}` : null,
  ].filter(Boolean)
  return { q, a: `${parts.join('; ')}. ${tail}`, links }
}

function citiesEntry(spaces: PublicSpace[] | null): FaqEntry {
  const cities = SPACE_CITIES.map((city) => ({
    city,
    count: spaces ? spaces.filter((s) => normalizeCityName(s.city) === city.name).length : null,
  })).filter((item) => item.count === null || item.count > 0)
  const names = cities.map((item) => `${cityShortEn(item.city)} beauty workspaces`)
  const counts = spaces
    ? ` There are currently ${joinEn(cities.map((item) => `${item.count} in ${cityShortEn(item.city)}`))}.`
    : ''
  const reportText = 'hourly rental price report'
  return {
    q: 'What spaces are there in each city, and roughly what do they cost?',
    a: `Each city has its own page (${names.join(', ')}) listing its spaces, hourly price range and common questions.${counts} For prices across Taiwan, see the ${reportText}.`,
    links: [
      ...cities.map((item) => ({ text: `${cityShortEn(item.city)} beauty workspaces`, href: en(cityPagePath(item.city)) })),
      { text: reportText, href: en('/spaces/price-report') },
    ],
  }
}

export function buildFaqGroupsEn(home: FaqItem[], spaces: PublicSpace[] | null): FaqGroup[] {
  const h = (index: number): FaqEntry => home[index]

  return [
    {
      id: 'renting',
      title: 'Finding and booking a space',
      items: [
        BRAND_FAQ_EN,
        h(HOME.findSpace),
        {
          q: 'How does booking a space work?',
          a: 'Find a suitable space in the SoloBeauté app and check the photos, equipment, price and minimum booking time; if you have questions, message the host directly. Pick a date and time slot and send a booking request. The booking is confirmed only once the host accepts it, and the app notifies you. On the day, arrive as agreed and pay the rent to the host in cash on site. Hosts can accept or decline requests, so keep an eye on your app notifications after sending one.',
        },
        h(HOME.services),
        browEntry(spaces),
        { q: 'What comes with a space?', a: equipmentAnswer(spaces) },
        h(HOME.cities),
        citiesEntry(spaces),
        {
          q: 'Why does the website only show the district of each space?',
          a: 'To protect hosts’ privacy and safety, space pages on the website show only the city and district, never the street address or the host’s details. The full location is in the SoloBeauté app.',
        },
        {
          q: 'Can I cancel or reschedule a booking?',
          a: 'You can cancel. Until a booking is completed, both the pro and the host can cancel it in the app; a completed booking can no longer be cancelled. The app has no reschedule button yet, so to change the time, talk to the host first, then cancel the original booking and book the new slot. If plans change at short notice, let the host know as early as you can.',
        },
      ],
    },
    {
      id: 'pricing',
      title: 'Prices and payment',
      items: [h(HOME.price), h(HOME.contract), h(HOME.payment), h(HOME.join)],
    },
    {
      id: 'hosts',
      title: 'Renting out your space',
      items: [
        h(HOME.hostList),
        {
          q: 'What information do I need to list a space?',
          a: 'In the app you mainly fill in: photos of the space (ideally the entrance, the interior and the equipment), the address, the space type (open space, curtained partition or private room), an equipment list, the services the space is suited to and those it doesn’t allow, the hourly rate (with optional half-day and full-day rates), the minimum booking time, and whether there is a camera in the space. Space pages on the website show only the city and district.',
        },
        h(HOME.partialHours),
      ],
    },
    {
      id: 'pros',
      title: 'Brand pages for beauty pros',
      items: [
        h(HOME.profile),
        {
          q: 'Once my brand page is public, where can clients see it?',
          a: 'A public brand page gets its own address under www.solobeaute.com/beautician/ and also appears in the website’s pro directory, where clients can filter by city and service category. It shows your services and prices, portfolio photos, and the contact details you add, such as Instagram.',
          links: [{ text: 'pro directory', href: '/search' }],
        },
        h(HOME.consumerBooking),
      ],
    },
    {
      id: 'about',
      title: 'About SoloBeauté',
      items: [
        h(HOME.difference),
        {
          q: 'How is SoloBeauté different from studio rental listing sites and rental groups?',
          a: 'Typical listing sites and social media groups mostly offer monthly rentals or long-term sublets, and you have to ask about terms and details one message at a time. SoloBeauté focuses on renting beauty workspaces by the hour: every space lists its hourly rate, equipment, the services it suits and doesn’t allow, and its minimum booking time, and you message the host and send a booking request in the app for the host to confirm.',
        },
        {
          q: 'How is SoloBeauté different from subletting or renting a chair?',
          a: 'Subletting or renting a chair usually means agreeing on a fixed seat, bed or time slot with a salon, mostly by the month, with contract, deposit and available hours depending on the salon. Spaces on SoloBeauté are rented by the hour: each one lists its hourly rate, minimum booking time, equipment and suitable services, you rent only when you have a booking, and you message the host and send a request in the app for the host to confirm. To work out which option costs less, see hourly vs monthly rent; for lash artists, see studios for lash artists.',
          links: [
            { text: 'hourly vs monthly rent', href: en('/guides/hourly-vs-monthly-rent') },
            { text: 'studios for lash artists', href: en('/guides/lash-artist-studio') },
          ],
        },
        {
          q: 'How do you spell SoloBeauté? Is it related to Solo Beauty or Soo Beauté?',
          a: 'The official name is “SoloBeauté” (with an accent on the final é); on the App Store it is written “Solobeaute”. Both refer to the same service. SoloBeauté is a Taiwan-based app for renting beauty workspaces by the hour and is not related to overseas apps such as Solo Beauty or Soo Beauté.',
        },
      ],
    },
  ]
}
