import type { AppLocale } from '@/i18n/config'

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? 'https://api.solobeaute.com'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? `${API_ORIGIN}/api/v1`

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.solobeaute.com'

export const APP_STORE_URL = 'https://apps.apple.com/tw/app/solobeaute/id6760957242'

export const APP_DEEP_LINK_SCHEME = 'tw.solobeauty.app://'

export const CATEGORY_OPTIONS = [
  { value: 'NAIL', labelKey: 'nail', emoji: '💅' },
  { value: 'LASH', labelKey: 'lash', emoji: '👁' },
  { value: 'HAIR', labelKey: 'hair', emoji: '💇' },
  { value: 'FACIAL', labelKey: 'facial', emoji: '🧴' },
  { value: 'MASSAGE', labelKey: 'massage', emoji: '💆' },
  { value: 'MAKEUP', labelKey: 'makeup', emoji: '🖌' },
  { value: 'BROW', labelKey: 'brow', emoji: '✨' },
  { value: 'SPORTS_MASSAGE', labelKey: 'sportsMassage', emoji: '💪' },
  { value: 'OTHER', labelKey: 'other', emoji: '🌿' },
] as const

export const CITY_OPTIONS = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '台東縣',
] as const

export const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  website: 'Website',
}

export const DEFAULT_METADATA_IMAGE = '/og-image.png'

export const SUPPORTED_LANGUAGE_NAMES: Record<AppLocale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
}
