import { type CallToolResult, McpServer, type ToolAnnotations } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

import { BRAND_FACT_EN, BRAND_FACT_ZH } from '../brandFacts'
import { SPACE_CITIES, cityPagePath, normalizeCityName } from '../cities'
import { APP_STORE_URL, INSTAGRAM_URL, PLAY_STORE_URL, SITE_URL, THREADS_URL } from '../constants'
import {
  BAND_EN,
  PROFESSION_EN,
  REPORT_SERVICE_EN,
  cityNameEn,
  districtEn,
  equipmentEn,
  hoursLabelEn,
  serviceTagEn,
  spaceTypeLabelEn,
} from '../en'
import { buildPriceReport, type RateSummary } from '../priceReport'
import { rateRange } from '../spaces'
import type { PublicSpace } from '../types'
import {
  MCP_DEFAULT_AVAILABILITY_DAYS,
  MCP_MAX_AVAILABILITY_DAYS,
  availabilityExposure,
  presentDay,
  resolveAvailabilityRange,
  taipeiNow,
} from './availability'
import { CACHE_TTL } from './cache'
import { MESSAGES, type McpLocale, NOTICE, SERVER_INSTRUCTIONS } from './copy'
import {
  UpstreamError,
  findPublicBeautician,
  loadAvailability,
  loadBeauticianDetail,
  loadPublicBeauticians,
  loadPublicSpace,
  loadPublicSpaces,
} from './data'
import { type Links, pageLinks, pageUrl, spaceLinks, utmSource } from './links'
import {
  beauticianDetail,
  beauticianSummary,
  categoryLabel,
  cityLabel,
  districtLabel,
  spaceDetail,
  spaceSummary,
} from './present'

// ---------------------------------------------------------------------------
// SoloBeauté read-only MCP server (served statelessly at /mcp, see
// src/app/mcp/route.ts). Eight tools, all readOnlyHint. A fresh McpServer is
// built per request; data caches live at module scope in ./cache.ts.
// ---------------------------------------------------------------------------

export const MCP_SERVER_VERSION = '1.0.0'

const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}

const MAX_LIMIT = 20
const DEFAULT_LIMIT = 10

const localeParam = z
  .enum(['zh-TW', 'en'])
  .default('zh-TW')
  .describe('Response language: "zh-TW" (Traditional Chinese, default) or "en".')

const limitParam = z.number().int().optional().describe(`Max results, 1–${MAX_LIMIT} (default ${DEFAULT_LIMIT}).`)

type Body = Record<string, unknown>

function result(locale: McpLocale, body: Body, isError = false): CallToolResult {
  const payload = {
    notice: NOTICE[locale],
    ...body,
    generatedAt: new Date().toISOString(),
    maxCacheAgeSeconds: CACHE_TTL.list,
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    ...(isError ? { isError: true } : {}),
  }
}

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)))
}

async function guarded(locale: McpLocale, source: string, run: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await run()
  } catch (error) {
    if (!(error instanceof UpstreamError)) console.error('[mcp] tool error', error)
    return result(
      locale,
      { error: 'UPSTREAM_UNAVAILABLE', message: MESSAGES[locale].upstreamError, links: pageLinks('/', locale, source) },
      true
    )
  }
}

// --- matching helpers (zh or en input) ---------------------------------------

function norm(text: string): string {
  return text.trim().toLowerCase().replace(/^臺/, '台')
}

export function cityMatches(city: string | null, query: string): boolean {
  if (!city) return false
  const q = norm(query)
  const name = normalizeCityName(city)
  const en = cityNameEn(name).toLowerCase()
  return [name, name.replace(/[市縣]$/, ''), en, en.replace(/ (city|county)$/, '')].some((c) => c.toLowerCase() === q)
}

export function districtMatches(district: string | null, city: string | null, query: string): boolean {
  if (!district) return false
  const q = norm(query)
  const en = districtEn(district, city).toLowerCase()
  return [district, district.replace(/[區鄉鎮市]$/, ''), en, en.replace(/ (district|township|city)$/, '')].some(
    (c) => c.toLowerCase() === q
  )
}

function tagMatches(tags: string[], query: string, translate: (label: string) => string): boolean {
  const q = norm(query)
  if (!q) return true
  return tags.some((tag) => tag.toLowerCase().includes(q) || translate(tag).toLowerCase().includes(q))
}

function knownCities(spaces: PublicSpace[], locale: McpLocale): string[] {
  const names = new Set(spaces.map((space) => normalizeCityName(space.city)).filter(Boolean))
  return Array.from(names).map((name) => cityLabel(name, locale) ?? name)
}

// --- price overview ----------------------------------------------------------

function rate(summary: RateSummary) {
  return { count: summary.count, min: summary.min, max: summary.max, median: summary.median }
}

function share(value: number): number {
  return Math.round(value * 1000) / 1000
}

function priceOverview(spaces: PublicSpace[], locale: McpLocale) {
  const report = buildPriceReport(spaces)
  const en = locale === 'en'
  return {
    currency: 'TWD',
    publicSpaces: report.total,
    cities: report.cityCount,
    hourly: rate(report.hourly),
    hourlyMiddleHalf: report.hourlyQuartiles,
    hourlyBands: report.hourlyBands.map((row) => ({
      label: en ? BAND_EN[row.label] ?? row.label : row.label,
      count: row.count,
      share: share(row.share),
    })),
    byCity: report.byCity.map((row) => ({
      city: en ? cityNameEn(row.label) : row.label,
      ...rate(row),
      url: row.href ? pageUrl(row.href, locale) : null,
    })),
    bySpaceType: report.byType.map((row) => ({ spaceType: en ? spaceTypeLabelEn(row.label) : row.label, ...rate(row) })),
    halfDay: rate(report.halfDay),
    fullDay: rate(report.fullDay),
    fullDayHoursEquivalent: report.fullDayHoursEquivalent,
    minimumHours: report.minimumHours.map((row) => ({
      label: en ? hoursLabelEn(row.label) : row.label,
      count: row.count,
      share: share(row.share),
    })),
    services: report.services.map((row) => ({
      label: en ? REPORT_SERVICE_EN[row.label] ?? row.label : row.label,
      count: row.count,
      share: share(row.share),
    })),
    equipment: report.equipment.map((row) => ({
      label: en ? equipmentEn(row.label) : row.label,
      count: row.count,
      share: share(row.share),
    })),
    professions: report.professions.map((row) => ({
      profession: en ? PROFESSION_EN[row.key]?.name ?? row.profession : row.profession,
      spaces: row.count,
      hourly: rate(row.hourly),
    })),
    lastSpaceUpdate: report.lastUpdated,
  }
}

// --- client identity for utm_source ------------------------------------------

function clientNameFrom(server: McpServer, ctx: unknown): string | null {
  const envelope = (ctx as { mcpReq?: { envelope?: Record<string, unknown> } } | undefined)?.mcpReq?.envelope
  const info = envelope?.['io.modelcontextprotocol/clientInfo'] as { name?: unknown } | undefined
  if (typeof info?.name === 'string') return info.name
  try {
    return server.server.getClientVersion()?.name ?? null
  } catch {
    return null
  }
}

// --- server ------------------------------------------------------------------

export function createSoloBeauteMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'solobeaute', title: 'SoloBeauté', version: MCP_SERVER_VERSION, websiteUrl: SITE_URL },
    { instructions: SERVER_INSTRUCTIONS, maxToolInputElements: 100 }
  )
  const source = (ctx: unknown) => utmSource(clientNameFrom(server, ctx))

  server.registerTool(
    'search_spaces',
    {
      title: 'Search SoloBeauté beauty workspaces',
      description:
        'Search public beauty workspaces in Taiwan that hosts rent to beauty professionals by the hour. Filters by city / district (Chinese or English names), space type, recommended services, equipment and max hourly rate (TWD). Returns prices, equipment, rating and links. Read-only; booking is done by beauty professionals in the SoloBeauté app.',
      inputSchema: z.object({
        city: z.string().max(40).optional().describe('City, e.g. "台北市", "台北" or "Taipei".'),
        district: z.string().max(40).optional().describe('District, e.g. "大安區" or "Da\'an".'),
        spaceType: z.enum(['OPEN_SPACE', 'CURTAIN_PARTITION', 'PRIVATE_ROOM']).optional(),
        services: z.array(z.string().max(30)).max(5).optional().describe('Every listed service must be recommended by the host, e.g. ["美睫"] or ["lash"].'),
        equipment: z.array(z.string().max(30)).max(5).optional().describe('Every listed item must be on site, e.g. ["美容床"] or ["beauty bed"].'),
        maxHourlyRate: z.number().positive().optional().describe('Max hourly rate in TWD.'),
        limit: limitParam,
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const all = await loadPublicSpaces()
        const matches = all
          .filter((space) => !args.city || cityMatches(space.city, args.city))
          .filter((space) => !args.district || districtMatches(space.district, space.city, args.district))
          .filter((space) => !args.spaceType || space.spaceType === args.spaceType)
          .filter((space) => (args.services ?? []).every((term) => tagMatches(space.recommendedServices, term, serviceTagEn)))
          .filter((space) => (args.equipment ?? []).every((term) => tagMatches(space.equipment, term, equipmentEn)))
          .filter((space) => !args.maxHourlyRate || (space.hourlyRate !== null && space.hourlyRate <= args.maxHourlyRate))
          .sort((a, b) => b.ratingCount - a.ratingCount || (a.hourlyRate ?? Number.MAX_SAFE_INTEGER) - (b.hourlyRate ?? Number.MAX_SAFE_INTEGER))
        const limit = clampLimit(args.limit)
        return result(args.locale, {
          total: matches.length,
          returned: Math.min(limit, matches.length),
          spaces: matches.slice(0, limit).map((space) => spaceSummary(space, args.locale, source(ctx))),
          ...(matches.length === 0 ? { citiesWithSpaces: knownCities(all, args.locale) } : {}),
          links: pageLinks('/spaces', args.locale, source(ctx)),
        })
      })
  )

  server.registerTool(
    'get_space',
    {
      title: 'Get a SoloBeauté beauty workspace',
      description:
        'Details of one public beauty workspace by id (from search_spaces): description, prices (TWD), minimum hours, equipment, recommended and prohibited services, camera disclosure, photos and links. Location is city and district only.',
      inputSchema: z.object({
        spaceId: z.string().max(64).describe('Space id (UUID) from search_spaces.'),
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const space = await loadPublicSpace(args.spaceId.trim())
        if (!space) {
          return result(
            args.locale,
            { error: 'SPACE_NOT_FOUND', message: MESSAGES[args.locale].spaceNotFound, links: pageLinks('/spaces', args.locale, source(ctx)) },
            true
          )
        }
        return result(args.locale, { space: spaceDetail(space, args.locale, source(ctx)) })
      })
  )

  server.registerTool(
    'get_space_availability',
    {
      title: 'Get SoloBeauté workspace free time slots',
      description: `Bookable free time slots of one public workspace for up to ${MCP_MAX_AVAILABILITY_DAYS} days (Asia/Taipei dates): opening hours minus booked and host-blocked times, keeping only gaps of at least the minimum booking hours. Read-only: it cannot hold or book a slot — beauty professionals book in the SoloBeauté app and the host confirms. If availability lookup is not open yet, the result says so.`,
      inputSchema: z.object({
        spaceId: z.string().max(64).describe('Space id (UUID) from search_spaces.'),
        from: z.string().max(10).optional().describe('First date, YYYY-MM-DD (default: today in Taiwan; not earlier than yesterday).'),
        to: z
          .string()
          .max(10)
          .optional()
          .describe(`Last date, YYYY-MM-DD (default: from + ${MCP_DEFAULT_AVAILABILITY_DAYS - 1} days; at most ${MCP_MAX_AVAILABILITY_DAYS} days in total).`),
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const messages = MESSAGES[args.locale]
        const invalidRange = (links: Links) =>
          result(args.locale, { error: 'INVALID_RANGE', message: messages.invalidRange, links }, true)

        const range = resolveAvailabilityRange({ from: args.from, to: args.to })
        if (!range) return invalidRange(pageLinks('/spaces', args.locale, source(ctx)))

        const space = await loadPublicSpace(args.spaceId.trim())
        if (!space) {
          return result(
            args.locale,
            { error: 'SPACE_NOT_FOUND', message: messages.spaceNotFound, links: pageLinks('/spaces', args.locale, source(ctx)) },
            true
          )
        }

        const links = spaceLinks(space.id, args.locale, source(ctx))
        const availability = await loadAvailability(space.id, range.from, range.to)
        switch (availability.kind) {
          case 'ok': {
            const minBookingHours = availability.minBookingHours ?? space.minimumHours
            const now = taipeiNow()
            const exposure = availabilityExposure()
            return result(args.locale, {
              available: true,
              spaceId: space.id,
              title: space.title,
              from: range.from,
              to: range.to,
              timezone: availability.timezone,
              minBookingHours,
              slotsShown: exposure,
              slotsNote: messages.freeSlotsNote(minBookingHours ?? 2),
              days: availability.days.map((day) => presentDay(day, minBookingHours, now, exposure)),
              links,
            })
          }
          case 'not_found':
            return result(args.locale, { error: 'SPACE_NOT_FOUND', message: messages.spaceNotFound, links }, true)
          case 'invalid_range':
            return invalidRange(links)
          case 'not_open':
            return result(args.locale, {
              available: false,
              status: 'AVAILABILITY_NOT_OPEN',
              message: messages.availabilityNotOpen,
              spaceId: space.id,
              title: space.title,
              links,
            })
          default:
            return result(
              args.locale,
              {
                available: false,
                status: 'AVAILABILITY_UNAVAILABLE',
                message: messages.availabilityUnavailable,
                spaceId: space.id,
                links,
              },
              true
            )
        }
      })
  )

  server.registerTool(
    'search_beauticians',
    {
      title: 'Search SoloBeauté beautician brand pages',
      description:
        'Search public SoloBeauté beautician brand pages by service-area city / district, specialty (e.g. "美睫", "lash", "霧眉") and max service price (TWD). Returns a `ref` for get_beautician. Consumer booking of beauty services is not open yet on SoloBeauté.',
      inputSchema: z.object({
        city: z.string().max(40).optional().describe('Service-area city, e.g. "台北市" or "Taipei".'),
        district: z.string().max(40).optional(),
        specialty: z.string().max(30).optional().describe('Specialty or service keyword, Chinese or English.'),
        maxServicePrice: z.number().positive().optional().describe('Only beauticians with at least one service at or below this price (TWD).'),
        limit: limitParam,
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const all = await loadPublicBeauticians()
        const specialty = args.specialty?.trim()
        const matches = all
          .filter((b) => !args.city || cityMatches(b.serviceArea?.city ?? null, args.city))
          .filter((b) => !args.district || districtMatches(b.serviceArea?.district ?? null, b.serviceArea?.city ?? null, args.district))
          .filter((b) => {
            if (!specialty) return true
            const categories = b.services.flatMap((s) => [categoryLabel(s.category, 'zh-TW'), categoryLabel(s.category, 'en')])
            const words = [...b.specialties, ...b.services.map((s) => s.name), ...categories.filter((c): c is string => Boolean(c))]
            return tagMatches(words, specialty, serviceTagEn)
          })
          // The list holds each beautician's cheapest services, so services[0] is the lowest price.
          .filter((b) => !args.maxServicePrice || (b.services[0] !== undefined && b.services[0].price <= args.maxServicePrice))
          .sort((a, b) => b.ratingCount - a.ratingCount || b.serviceCount - a.serviceCount)
        const limit = clampLimit(args.limit)
        return result(args.locale, {
          total: matches.length,
          returned: Math.min(limit, matches.length),
          beauticians: matches.slice(0, limit).map((b) => beauticianSummary(b, args.locale, source(ctx))),
          links: pageLinks('/search', args.locale, source(ctx)),
        })
      })
  )

  server.registerTool(
    'get_beautician',
    {
      title: 'Get a SoloBeauté beautician brand page',
      description:
        'Public brand page of one beautician by `ref` from search_beauticians: bio, specialties, licenses, service area (city / district), services with prices (TWD) and duration, portfolio images and public social links. No phone, email or address. Consumer booking of beauty services is not open yet on SoloBeauté.',
      inputSchema: z.object({
        ref: z.string().max(100).describe('The `ref` value from search_beauticians (brand-page slug).'),
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const entry = await findPublicBeautician(args.ref)
        if (!entry) {
          return result(
            args.locale,
            {
              error: 'BEAUTICIAN_NOT_FOUND',
              message: MESSAGES[args.locale].beauticianNotFound,
              links: pageLinks('/search', args.locale, source(ctx)),
            },
            true
          )
        }
        const { beautician, complete } = await loadBeauticianDetail(entry)
        return result(args.locale, {
          beautician: beauticianDetail(beautician, complete, args.locale, source(ctx)),
          ...(complete ? {} : { servicesNote: MESSAGES[args.locale].servicesTruncated }),
        })
      })
  )

  server.registerTool(
    'list_regions',
    {
      title: 'List SoloBeauté regions',
      description: 'Cities and districts that currently have public SoloBeauté workspaces or beautician brand pages, with counts and city page links.',
      inputSchema: z.object({ locale: localeParam }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const [spaces, beauticians] = await Promise.all([loadPublicSpaces(), loadPublicBeauticians()])
        const cities = new Map<string, { spaces: number; beauticians: number; districts: Map<string, number> }>()
        const entry = (city: string) => {
          const existing = cities.get(city)
          if (existing) return existing
          const created = { spaces: 0, beauticians: 0, districts: new Map<string, number>() }
          cities.set(city, created)
          return created
        }
        spaces.forEach((space) => {
          if (!space.city) return
          const row = entry(normalizeCityName(space.city))
          row.spaces += 1
          if (space.district) row.districts.set(space.district, (row.districts.get(space.district) ?? 0) + 1)
        })
        beauticians.forEach((b) => {
          if (b.serviceArea?.city) entry(normalizeCityName(b.serviceArea.city)).beauticians += 1
        })
        const order = SPACE_CITIES.map((city) => city.name)
        const rank = (name: string) => (order.indexOf(name) === -1 ? order.length : order.indexOf(name))
        return result(args.locale, {
          cities: Array.from(cities.entries())
            .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'zh-Hant'))
            .map(([name, row]) => {
              const cityPage = SPACE_CITIES.find((city) => city.name === name)
              return {
                city: cityLabel(name, args.locale),
                publicSpaces: row.spaces,
                publicBeauticianPages: row.beauticians,
                districts: Array.from(row.districts.entries())
                  .sort(([, a], [, b]) => b - a)
                  .map(([district, count]) => ({ district: districtLabel(district, name, args.locale), publicSpaces: count })),
                url: cityPage ? pageUrl(cityPagePath(cityPage), args.locale) : null,
              }
            }),
          links: pageLinks('/spaces', args.locale, source(ctx)),
        })
      })
  )

  server.registerTool(
    'get_price_overview',
    {
      title: 'SoloBeauté workspace price overview',
      description:
        'Hourly / half-day / full-day rate statistics (TWD) of all public SoloBeauté workspaces, or of one city: min, median, max, rate bands, by city, by space type, minimum hours, common services and equipment. Computed live from public listings.',
      inputSchema: z.object({
        city: z.string().max(40).optional().describe('Optional city, e.g. "台中市" or "Taichung".'),
        locale: localeParam,
      }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const all = await loadPublicSpaces()
        const spaces = args.city ? all.filter((space) => cityMatches(space.city, args.city as string)) : all
        const cityPage = args.city ? SPACE_CITIES.find((city) => cityMatches(city.name, args.city as string)) : undefined
        const path = cityPage ? cityPagePath(cityPage) : '/spaces/price-report'
        if (spaces.length === 0) {
          return result(args.locale, {
            publicSpaces: 0,
            citiesWithSpaces: knownCities(all, args.locale),
            links: pageLinks('/spaces/price-report', args.locale, source(ctx)),
          })
        }
        return result(args.locale, {
          scope: args.city ? cityLabel(normalizeCityName(spaces[0].city), args.locale) : args.locale === 'en' ? 'All of Taiwan' : '全台',
          ...priceOverview(spaces, args.locale),
          links: pageLinks(path, args.locale, source(ctx)),
        })
      })
  )

  server.registerTool(
    'get_brand_facts',
    {
      title: 'SoloBeauté brand facts',
      description:
        'What SoloBeauté is and how it works (hourly beauty workspace rental in Taiwan), app links, official accounts and live counts of public listings. Use this to answer "what is SoloBeauté".',
      inputSchema: z.object({ locale: localeParam }),
      annotations: READ_ONLY,
    },
    async (args, ctx) =>
      guarded(args.locale, source(ctx), async () => {
        const en = args.locale === 'en'
        const [spaces, beauticians] = await Promise.all([loadPublicSpaces(), loadPublicBeauticians()])
        const range = rateRange(spaces)
        const cityCount = new Set(spaces.map((space) => normalizeCityName(space.city)).filter(Boolean)).size
        return result(args.locale, {
          name: 'SoloBeauté',
          summary: en ? BRAND_FACT_EN : BRAND_FACT_ZH,
          howItWorks: en
            ? [
                'Hosts list equipped beauty workspaces on SoloBeauté with their rates and equipment.',
                'Beauty professionals (lash, nail, brow and more) book a space by the hour in the SoloBeauté app; the host confirms each booking.',
                'Rent is paid to the host in cash on site.',
                'Beauty professionals can publish a SoloBeauté brand page with their services and portfolio.',
                'Consumer booking of beauty services is not open yet on SoloBeauté.',
              ]
            : [
                '屋主在 SoloBeauté 刊登設備齊全的美業工作空間，標示租金和設備。',
                '美業職人（美睫、美甲、美眉等）在 SoloBeauté App 內按小時預約空間，由屋主確認。',
                '租金到現場以現金付給屋主。',
                '美業職人可以在 SoloBeauté 建立品牌頁，展示服務項目和作品。',
                'SoloBeauté 目前尚未開放消費者預約美業服務。',
              ],
          consumerBookingOpen: false,
          liveCounts: {
            publicSpaces: spaces.length,
            citiesWithSpaces: cityCount,
            hourlyRateRange: range ? { currency: 'TWD', ...range } : null,
            publicBeauticianPages: beauticians.length,
          },
          apps: { ios: APP_STORE_URL, android: PLAY_STORE_URL },
          officialAccounts: { website: SITE_URL, instagram: INSTAGRAM_URL, threads: THREADS_URL },
          pages: {
            spaces: pageUrl('/spaces', args.locale),
            priceReport: pageUrl('/spaces/price-report', args.locale),
            faq: pageUrl('/faq', args.locale),
            about: pageUrl('/about', args.locale),
            hosts: pageUrl('/hosts', args.locale),
          },
          links: pageLinks('/about', args.locale, source(ctx)),
        })
      })
  )

  return server
}

