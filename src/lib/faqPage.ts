import { BRAND_FAQ_ZH } from './brandFacts'
import { SPACE_CITIES, cityPagePath, normalizeCityName } from './cities'
import { buildPriceReport } from './priceReport'
import { formatNtd } from './spaces'
import type { PublicSpace } from './types'

// ---------------------------------------------------------------------------
// /faq — homepage FAQ (faq.items, reused verbatim) + extra questions below.
// zh-TW only. Only state what the product actually does today:
//  - booking = message host in the App → send request → host confirms → pay
//    cash on site (no self check-in, no online payment wording)
//  - cancellation: beautician or host can cancel in the App before the booking
//    is completed (beautyhub-backend PUT /bookings/space/:id); there is no
//    in-app reschedule, so changes = talk to the host, cancel, book again.
// ---------------------------------------------------------------------------

export type FaqItem = { q: string; a: string }
export type FaqLink = { text: string; href: string }
export type FaqEntry = FaqItem & {
  /** Substrings of `a` to render as links (text stays identical to JSON-LD). */
  links?: FaqLink[]
}
export type FaqGroup = { id: string; title: string; items: FaqEntry[] }

/** Index of each homepage question in `faq.items` (keeps the order stable). */
const HOME = {
  price: 0,
  contract: 1,
  payment: 2,
  joinFree: 3,
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

function equipmentAnswer(spaces: PublicSpace[] | null): string {
  const base = '每個空間的設備由屋主自己列出，會顯示在空間頁和 App 裡，例如美容床、美容燈、美甲桌椅、洗頭台、化妝室、冷氣、Wi-Fi。'
  const tail = '沒有列在設備清單裡的東西（例如耗材、個人工具），租之前先傳訊息跟屋主確認。'
  if (!spaces || spaces.length === 0) return `${base}${tail}`
  const counts = EQUIPMENT_FOR_FAQ
    .map((label) => ({ label, count: spaces.filter((s) => s.equipment.includes(label)).length }))
    .filter((item) => item.count > 0)
  if (counts.length === 0) return `${base}${tail}`
  return `${base}以目前上架的 ${spaces.length} 間空間來看，${counts.map((c) => `${c.count} 間有${c.label}`).join('、')}。${tail}`
}

function browEntry(spaces: PublicSpace[] | null): FaqEntry {
  const q = '有適合霧眉、霧唇的工作室可以按小時租嗎？'
  const linkText = '霧眉師租工作室'
  const tail = `每個空間適合的服務以空間頁上屋主的標示為準；更多數字見時租行情的「${linkText}」段落。`
  const links = [{ text: linkText, href: '/spaces/price-report#brow' }]
  const brow = spaces && spaces.length ? buildPriceReport(spaces).professions.find((p) => p.key === 'brow') : undefined
  if (!brow) {
    return { q, a: `有。部分空間的屋主標示適合霧眉、霧唇，App 和空間頁會列出每個空間適合的服務和設備。${tail}`, links }
  }
  if (brow.count === 0) {
    return { q, a: `目前還沒有屋主標示適合霧眉、霧唇的空間，新空間陸續上架中。${tail}`, links }
  }
  const h = brow.hourly
  const rate = h.min !== null && h.max !== null
    ? (h.min === h.max ? `時租 ${formatNtd(h.min)}` : `時租 ${formatNtd(h.min)}–${h.max.toLocaleString('en-US')}${h.count >= 2 && h.median !== null ? `，中位數 ${formatNtd(h.median)}` : ''}`)
    : ''
  const bed = brow.equipment.find((e) => e.label === '美容床')
  const parts = [
    `有。目前上架的 ${spaces?.length ?? 0} 間空間中，${brow.count} 間屋主標示適合霧眉、霧唇`,
    rate || null,
    bed && bed.count > 0 ? `${bed.count} 間有美容床` : null,
    brow.cities.length ? `分布在${brow.cities.map((c) => `${c.short} ${c.count} 間`).join('、')}` : null,
  ].filter(Boolean)
  return { q, a: `${parts.join('，')}。${tail}`, links }
}

function citiesEntry(spaces: PublicSpace[] | null): FaqEntry {
  const cities = SPACE_CITIES.map((city) => ({
    city,
    count: spaces ? spaces.filter((s) => normalizeCityName(s.city) === city.name).length : null,
  })).filter((item) => item.count === null || item.count > 0)
  const names = cities.map((item) => `${item.city.short}美業空間時租`)
  const counts = spaces
    ? `目前${cities.map((item) => `${item.city.short} ${item.count} 間`).join('、')}。`
    : ''
  const reportText = '美業空間時租行情'
  return {
    q: '各縣市有哪些空間？價格大概多少？',
    a: `每個縣市都有自己的頁面（${names.join('、')}），列出該縣市的空間、時租區間和常見問題。${counts}全台的價格統計，可以看「${reportText}」。`,
    links: [
      ...cities.map((item) => ({ text: `${item.city.short}美業空間時租`, href: cityPagePath(item.city) })),
      { text: reportText, href: '/spaces/price-report' },
    ],
  }
}

export function buildFaqGroups(home: FaqItem[], spaces: PublicSpace[] | null): FaqGroup[] {
  const h = (index: number): FaqEntry => home[index]

  return [
    {
      id: 'renting',
      title: '找空間與預約',
      items: [
        BRAND_FAQ_ZH,
        h(HOME.findSpace),
        {
          q: '預約空間的流程是什麼？',
          a: '先在 SoloBeauté App 找到合適的空間，看清楚照片、設備、價格和最低租用時數；有問題可以直接傳訊息問屋主。選好日期和時段後送出預約，屋主確認後預約才成立，App 會通知你。當天依約到場使用，租金在現場用現金付給屋主。屋主可以接受或拒絕預約，送出後請留意 App 通知。',
        },
        h(HOME.services),
        browEntry(spaces),
        { q: '租一個空間包含哪些東西？', a: equipmentAnswer(spaces) },
        h(HOME.cities),
        citiesEntry(spaces),
        {
          q: '為什麼網站上的空間只顯示到區？',
          a: '為了保護屋主的隱私和安全，官網上的空間頁只顯示縣市和區，不顯示門牌地址和屋主資料。完整位置請在 SoloBeauté App 查看。',
        },
        {
          q: '預約可以取消或改時間嗎？',
          a: '可以取消。預約完成之前，職人和屋主都可以在 App 裡取消；已經完成的預約就不能取消。App 目前沒有直接改時間的功能，想換時段的話，先傳訊息跟屋主討論，再取消原本的預約、重新預約新的時段。臨時有變動請盡早告訴屋主。',
        },
      ],
    },
    {
      id: 'pricing',
      title: '價格與付款',
      items: [h(HOME.price), h(HOME.contract), h(HOME.payment), h(HOME.joinFree)],
    },
    {
      id: 'hosts',
      title: '屋主出租空間',
      items: [
        h(HOME.hostList),
        {
          q: '上架空間要填哪些資料？',
          a: '在 App 裡主要會填：空間照片（建議包含入口、室內和設備）、地址、空間類型（開放空間、拉簾隔間或獨立房間）、設備清單、適合和不開放的服務、時租價格（也可以另外設半日、全日價）、最低租用時數，以及空間內有沒有攝影機。官網上的空間頁只會顯示到縣市和區。',
        },
        h(HOME.partialHours),
      ],
    },
    {
      id: 'pros',
      title: '美業職人品牌頁',
      items: [
        h(HOME.profile),
        {
          q: '品牌頁公開後，客人在哪裡看得到？',
          a: '公開的品牌頁會在 www.solobeaute.com/beautician/ 底下有自己的網址，也會出現在官網的「找職人」頁，客人可以用城市和服務類別篩選。品牌頁會顯示你的服務項目和價格、作品照，以及你留的 IG 等聯絡方式。',
          links: [{ text: '找職人', href: '/search' }],
        },
        h(HOME.consumerBooking),
      ],
    },
    {
      id: 'about',
      title: '關於 SoloBeauté',
      items: [
        h(HOME.difference),
        {
          q: 'SoloBeauté 和美容工作室出租網站、租屋社團有什麼不同？',
          a: '一般刊登型的出租網站或社團，常見的是月租或長期分租，條件和細節要一則一則問。SoloBeauté 專門做美業空間的按小時租：每個空間都列出時租、設備、適合和不開放的服務、最低租用時數，在 App 裡直接傳訊息給屋主、送出預約，由屋主確認。',
        },
        {
          q: 'SoloBeauté 和分租、租位有什麼不同？',
          a: '分租、租位常見的做法，是和店家談一個固定的座位、床位或時段，多半以月計，合約、押金和可用時段依各家而定。SoloBeauté 上的空間按小時租：每個空間列出時租、最低租用時數、設備和適合的服務，有預約才租，在 App 傳訊息給屋主、送出預約，由屋主確認。怎麼算哪一種划算，見「時租和月租怎麼比」；美睫師的比較見「美睫師租工作室」。',
          links: [
            { text: '時租和月租怎麼比', href: '/guides/hourly-vs-monthly-rent' },
            { text: '美睫師租工作室', href: '/guides/lash-artist-studio' },
          ],
        },
        {
          q: 'SoloBeauté 怎麼寫？跟國外的 Solo Beauty、Soo Beauté 有關係嗎？',
          a: '正式名稱是「SoloBeauté」（最後的 é 有重音），App Store 上的名稱寫作「Solobeaute」，兩種寫法都是同一個服務。SoloBeauté 是台灣的美業空間時租 App，和國外的 Solo Beauty、Soo Beauté 等 App 是不同的服務，彼此沒有關係。',
        },
      ],
    },
  ]
}

export function flattenFaq(groups: FaqGroup[]): FaqEntry[] {
  return groups.flatMap((group) => group.items)
}
