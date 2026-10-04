import { SPACE_CITIES, normalizeCityName, type SpaceCity } from './cities'
import { formatNtd } from './spaces'
import type { CameraDisclosureStatus, PublicSpace, SpaceType } from './types'

// ---------------------------------------------------------------------------
// English labels for the data the backend stores in Chinese (cities,
// districts, equipment, services, space types) plus small English phrase
// helpers. Used only by the /en pages; the zh-TW copy never imports this.
// Anything without a mapping falls back to the original Chinese label.
// ---------------------------------------------------------------------------

export const CITY_EN: Record<string, { name: string; short: string }> = {
  台北市: { name: 'Taipei City', short: 'Taipei' },
  新北市: { name: 'New Taipei City', short: 'New Taipei' },
  桃園市: { name: 'Taoyuan City', short: 'Taoyuan' },
  台中市: { name: 'Taichung City', short: 'Taichung' },
  台南市: { name: 'Tainan City', short: 'Tainan' },
  高雄市: { name: 'Kaohsiung City', short: 'Kaohsiung' },
  彰化縣: { name: 'Changhua County', short: 'Changhua' },
  南投縣: { name: 'Nantou County', short: 'Nantou' },
}

export function cityNameEn(city: string | null | undefined): string {
  const key = normalizeCityName(city)
  return CITY_EN[key]?.name ?? key
}

export function cityShortEn(city: SpaceCity | string | null | undefined): string {
  const name = typeof city === 'string' || city == null ? normalizeCityName(city) : city.name
  return CITY_EN[name]?.short ?? name
}

// District base names per city (official romanization). The suffix is added
// from the last character: 區 → District, 市 → City, 鎮/鄉 → Township.
const DISTRICT_BASE: Record<string, Record<string, string>> = {
  台北市: {
    中正區: 'Zhongzheng', 大同區: 'Datong', 中山區: 'Zhongshan', 松山區: 'Songshan', 大安區: "Da'an", 萬華區: 'Wanhua',
    信義區: 'Xinyi', 士林區: 'Shilin', 北投區: 'Beitou', 內湖區: 'Neihu', 南港區: 'Nangang', 文山區: 'Wenshan',
  },
  新北市: {
    板橋區: 'Banqiao', 三重區: 'Sanchong', 中和區: 'Zhonghe', 永和區: 'Yonghe', 新莊區: 'Xinzhuang', 新店區: 'Xindian',
    樹林區: 'Shulin', 鶯歌區: 'Yingge', 三峽區: 'Sanxia', 淡水區: 'Tamsui', 汐止區: 'Xizhi', 瑞芳區: 'Ruifang',
    土城區: 'Tucheng', 蘆洲區: 'Luzhou', 五股區: 'Wugu', 泰山區: 'Taishan', 林口區: 'Linkou', 深坑區: 'Shenkeng',
    石碇區: 'Shiding', 坪林區: 'Pinglin', 三芝區: 'Sanzhi', 石門區: 'Shimen', 八里區: 'Bali', 平溪區: 'Pingxi',
    雙溪區: 'Shuangxi', 貢寮區: 'Gongliao', 金山區: 'Jinshan', 萬里區: 'Wanli', 烏來區: 'Wulai',
  },
  桃園市: {
    桃園區: 'Taoyuan', 中壢區: 'Zhongli', 平鎮區: 'Pingzhen', 八德區: 'Bade', 楊梅區: 'Yangmei', 蘆竹區: 'Luzhu',
    大溪區: 'Daxi', 龍潭區: 'Longtan', 龜山區: 'Guishan', 大園區: 'Dayuan', 觀音區: 'Guanyin', 新屋區: 'Xinwu', 復興區: 'Fuxing',
  },
  台中市: {
    中區: 'Central', 東區: 'East', 南區: 'South', 西區: 'West', 北區: 'North', 北屯區: 'Beitun', 西屯區: 'Xitun',
    南屯區: 'Nantun', 太平區: 'Taiping', 大里區: 'Dali', 霧峰區: 'Wufeng', 烏日區: 'Wuri', 豐原區: 'Fengyuan',
    后里區: 'Houli', 石岡區: 'Shigang', 東勢區: 'Dongshi', 和平區: 'Heping', 新社區: 'Xinshe', 潭子區: 'Tanzi',
    大雅區: 'Daya', 神岡區: 'Shengang', 大肚區: 'Dadu', 沙鹿區: 'Shalu', 龍井區: 'Longjing', 梧棲區: 'Wuqi',
    清水區: 'Qingshui', 大甲區: 'Dajia', 外埔區: 'Waipu', 大安區: "Da'an",
  },
  高雄市: {
    新興區: 'Xinxing', 前金區: 'Qianjin', 苓雅區: 'Lingya', 鹽埕區: 'Yancheng', 鼓山區: 'Gushan', 旗津區: 'Qijin',
    前鎮區: 'Qianzhen', 三民區: 'Sanmin', 楠梓區: 'Nanzi', 小港區: 'Xiaogang', 左營區: 'Zuoying', 仁武區: 'Renwu',
    大社區: 'Dashe', 岡山區: 'Gangshan', 路竹區: 'Luzhu', 阿蓮區: 'Alian', 田寮區: 'Tianliao', 燕巢區: 'Yanchao',
    橋頭區: 'Qiaotou', 梓官區: 'Ziguan', 彌陀區: 'Mituo', 永安區: "Yong'an", 湖內區: 'Hunei', 鳳山區: 'Fengshan',
    大寮區: 'Daliao', 林園區: 'Linyuan', 鳥松區: 'Niaosong', 大樹區: 'Dashu', 旗山區: 'Qishan', 美濃區: 'Meinong',
    六龜區: 'Liugui', 內門區: 'Neimen', 杉林區: 'Shanlin', 甲仙區: 'Jiaxian', 桃源區: 'Taoyuan', 那瑪夏區: 'Namaxia',
    茂林區: 'Maolin', 茄萣區: 'Qieding',
  },
  彰化縣: {
    彰化市: 'Changhua', 員林市: 'Yuanlin', 鹿港鎮: 'Lukang', 和美鎮: 'Hemei', 溪湖鎮: 'Xihu', 田中鎮: 'Tianzhong',
    北斗鎮: 'Beidou', 二林鎮: 'Erlin', 線西鄉: 'Xianxi', 伸港鄉: 'Shengang', 福興鄉: 'Fuxing', 秀水鄉: 'Xiushui',
    花壇鄉: 'Huatan', 芬園鄉: 'Fenyuan', 大村鄉: 'Dacun', 埔鹽鄉: 'Puyan', 埔心鄉: 'Puxin', 永靖鄉: 'Yongjing',
    社頭鄉: 'Shetou', 二水鄉: 'Ershui', 田尾鄉: 'Tianwei', 埤頭鄉: 'Pitou', 芳苑鄉: 'Fangyuan', 大城鄉: 'Dacheng',
    竹塘鄉: 'Zhutang', 溪州鄉: 'Xizhou',
  },
  南投縣: {
    南投市: 'Nantou', 埔里鎮: 'Puli', 草屯鎮: 'Caotun', 竹山鎮: 'Zhushan', 集集鎮: 'Jiji', 名間鄉: 'Mingjian',
    鹿谷鄉: 'Lugu', 中寮鄉: 'Zhongliao', 魚池鄉: 'Yuchi', 國姓鄉: 'Guoxing', 水里鄉: 'Shuili', 信義鄉: 'Xinyi', 仁愛鄉: "Ren'ai",
  },
}

const DISTRICT_SUFFIX: Record<string, string> = { 區: 'District', 市: 'City', 鎮: 'Township', 鄉: 'Township' }

function districtBase(district: string, city?: string | null): string | null {
  const key = normalizeCityName(city)
  if (key && DISTRICT_BASE[key]?.[district]) return DISTRICT_BASE[key][district]
  for (const map of Object.values(DISTRICT_BASE)) {
    if (map[district]) return map[district]
  }
  return null
}

/** 中山區 → "Zhongshan District" (falls back to the Chinese name). */
export function districtEn(district: string | null | undefined, city?: string | null): string {
  if (!district) return ''
  const base = districtBase(district, city)
  if (!base) return district
  const suffix = DISTRICT_SUFFIX[district.slice(-1)]
  return suffix ? `${base} ${suffix}` : base
}

/** 中山區 → "Zhongshan" (for headings like "Banqiao beauty workspaces"). */
export function districtShortEn(district: string, city?: string | null): string {
  return districtBase(district, city) ?? district
}

/** "Zhongshan District, Taipei City" */
export function locationEn(space: Pick<PublicSpace, 'city' | 'district'>): string {
  return [space.district ? districtEn(space.district, space.city) : null, space.city ? cityNameEn(space.city) : null]
    .filter(Boolean)
    .join(', ')
}

const SPACE_TYPE_EN: Record<SpaceType, string> = {
  OPEN_SPACE: 'Open space',
  CURTAIN_PARTITION: 'Curtained partition',
  PRIVATE_ROOM: 'Private room',
}

const SPACE_TYPE_LABEL_EN: Record<string, string> = {
  開放空間: 'Open space',
  拉簾隔間: 'Curtained partition',
  獨立房間: 'Private room',
  美業空間: 'Beauty workspace',
}

export function spaceTypeEn(type: SpaceType | null): string {
  return type ? SPACE_TYPE_EN[type] : 'Beauty workspace'
}

/** Translate a zh space-type label (as produced by spaceTypeLabel()). */
export function spaceTypeLabelEn(label: string): string {
  return SPACE_TYPE_LABEL_EN[label] ?? label
}

export const EQUIPMENT_EN: Record<string, string> = {
  美容床: 'Beauty bed',
  冷氣: 'Air conditioning',
  'Wi-Fi': 'Wi-Fi',
  拋棄式床紙: 'Disposable bed sheets',
  化妝室: 'Restroom',
  美容燈: 'Beauty lamp',
  工作推車: 'Work trolley',
  吹風機: 'Hair dryer',
  洗頭台: 'Shampoo station',
  美髮椅: 'Styling chair',
  鏡台: 'Mirror station',
  沙發椅: 'Sofa',
  延長線: 'Extension cords',
  消毒櫃: 'Sterilizing cabinet',
  美甲桌椅: 'Nail table and chair',
  光療燈: 'Gel nail lamp',
  桌上型工作燈: 'Desk lamp',
  美甲吸塵器: 'Nail dust collector',
  毛巾: 'Towels',
  熱敷箱: 'Towel warmer',
  酒精: 'Disinfectant alcohol',
  淋浴間: 'Shower',
  停車位: 'Parking',
  拋棄式毛巾: 'Disposable towels',
  更衣間: 'Changing room',
  飲水機: 'Water dispenser',
  茶包: 'Tea bags',
  紙杯: 'Paper cups',
  鑰匙櫃: 'Key lockers',
  水杯: 'Cups',
  小分子飲用水: 'Filtered drinking water',
}

export function equipmentEn(label: string): string {
  return EQUIPMENT_EN[label] ?? label
}

/** Services as hosts tag them in the app. */
export const SERVICE_TAG_EN: Record<string, string> = {
  '護膚（臉）': 'Facials',
  睫毛管理: 'Lash lift and care',
  嫁接睫毛: 'Eyelash extensions',
  身體按摩: 'Body massage',
  運動按摩: 'Sports massage',
  美髮: 'Hair',
  彩妝: 'Makeup',
  新娘秘書: 'Bridal styling',
  '霧眉（唇）': 'Brow / lip embroidery',
  霧眉除色: 'Brow tattoo removal',
  手美甲: 'Manicures',
  腳美甲: 'Pedicures',
  油壓按摩: 'Oil massage',
  髮際線紋綉: 'Hairline micropigmentation',
  髮際線紋繡: 'Hairline micropigmentation',
  熱蠟除毛: 'Hot-wax hair removal',
  私密處熱蠟除毛: 'Intimate hot-wax hair removal',
  耳燭: 'Ear candling',
  采耳: 'Ear cleaning',
  黑眼圈遮瑕: 'Under-eye camouflage',
  溫罐: 'Warm cupping',
  美胸按摩: 'Bust massage',
}

export function serviceTagEn(label: string): string {
  return SERVICE_TAG_EN[label] ?? label
}

/** Rows of the price report's service table (priceReport.ts SERVICE_LABELS + extras). */
export const REPORT_SERVICE_EN: Record<string, string> = {
  '美睫（嫁接睫毛、睫毛管理）': 'Lash (eyelash extensions, lash lift and care)',
  '美容（臉部護膚）': 'Facials (skin care)',
  '霧眉、霧唇': 'Brow / lip embroidery',
  美甲: 'Nails',
  美髮: 'Hair',
  '彩妝、新娘秘書': 'Makeup / bridal styling',
  '按摩（身體、油壓、運動、美胸）': 'Massage (body, oil, sports, bust)',
  '紋繡（髮際線、黑眼圈遮瑕）': 'Other micropigmentation (hairline, under-eye)',
  熱蠟除毛: 'Hot-wax hair removal',
  '耳燭、采耳': 'Ear candling / ear cleaning',
}

/** Short service name for sentences ("the most common services are …"). */
export const REPORT_SERVICE_SHORT_EN: Record<string, string> = {
  '美睫（嫁接睫毛、睫毛管理）': 'lash work',
  '美容（臉部護膚）': 'facials',
  '霧眉、霧唇': 'brow / lip embroidery',
  美甲: 'nails',
  美髮: 'hair',
  '彩妝、新娘秘書': 'makeup / bridal styling',
  '按摩（身體、油壓、運動、美胸）': 'massage',
  '紋繡（髮際線、黑眼圈遮瑕）': 'other micropigmentation',
  熱蠟除毛: 'hot-wax hair removal',
  '耳燭、采耳': 'ear candling / cleaning',
}

/** English for lib/cityPages.ts SERVICE_GROUPS (same keys). */
export const SERVICE_GROUP_EN: Record<string, { keyword: string; prose: string }> = {
  lash: { keyword: 'Lash', prose: 'eyelash extensions or lash care' },
  facial: { keyword: 'Facial', prose: 'facials' },
  brow: { keyword: 'Brow', prose: 'brow embroidery' },
  nail: { keyword: 'Nail', prose: 'nails' },
  hair: { keyword: 'Hair', prose: 'hair' },
  makeup: { keyword: 'Makeup', prose: 'makeup or bridal styling' },
}

export const PROFESSION_EN: Record<string, { name: string; singular: string; services: string }> = {
  lash: { name: 'Lash artists', singular: 'lash artist', services: 'eyelash extensions or lash care' },
  nail: { name: 'Nail artists', singular: 'nail artist', services: 'nails' },
  brow: { name: 'Brow embroidery artists', singular: 'brow artist', services: 'brow or lip embroidery' },
}

export const BAND_EN: Record<string, string> = {
  'NT$100 以下': 'NT$100 or less',
  'NT$301 以上': 'NT$301 or more',
}

export function cameraDisclosureEn(status: CameraDisclosureStatus | null): string | null {
  switch (status) {
    case 'HAS_CAMERA':
      return 'There is a camera in the space (disclosed by the host).'
    case 'NO_CAMERA':
      return 'The host states there is no camera in the space.'
    case 'UNDISCLOSED':
      return 'The host has not said whether there is a camera; you can ask in the app before booking.'
    default:
      return null
  }
}

// --- phrase helpers ---------------------------------------------------------

/** ["a","b","c"] → "a, b and c" (or "or"). */
export function joinEn(items: string[], word: 'and' | 'or' = 'and'): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} ${word} ${items[1]}`
  return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`
}

/** plural(3, 'space') → "3 spaces" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "NT$150–250" or "NT$200" */
export function rateRangeEn(min: number | null, max: number | null): string {
  if (min === null || max === null) return '—'
  return min === max ? formatNtd(min) : `${formatNtd(min)}–${max.toLocaleString('en-US')}`
}

/** "October 2026" in Taipei time. */
export function monthYearEn(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long' }).format(now)
}

/** Ordered list of English short city names for the cities present in `cityNames`. */
export function cityListEn(cityNames: string[]): string {
  return SPACE_CITIES.filter((city) => cityNames.includes(city.name)).map((city) => cityShortEn(city)).join(', ')
}

/** "3 hours" / "1 hour" from the price report's 「3 小時」 label. */
export function hoursLabelEn(label: string): string {
  const n = Number.parseInt(label, 10)
  return Number.isFinite(n) ? plural(n, 'hour') : label
}
