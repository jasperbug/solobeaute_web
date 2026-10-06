// Fixed copy for the read-only MCP server (/mcp). Every tool result carries
// NOTICE[locale] so an AI agent always sees how SoloBeauté actually works:
// booking happens in the app, rent is paid in cash on site, and consumer
// booking is not open. Copy rules: always「SoloBeauté」; no fee / free /
// discount / deposit / contract claims; never say consumer booking is open.

export type McpLocale = 'zh-TW' | 'en'

export const NOTICE: Record<McpLocale, string> = {
  'zh-TW':
    '資料來自 SoloBeauté 官方網站。美業職人預約空間需在 SoloBeauté App 內完成，並由屋主確認；租金到現場以現金付給屋主。價格以 App 內顯示為準。SoloBeauté 目前尚未開放消費者線上預約美業服務。',
  en: 'Data from the official SoloBeauté website. Beauty professionals book spaces in the SoloBeauté app, and each booking is confirmed by the host; rent is paid to the host in cash on site. Prices shown in the app prevail. Consumer booking of beauty services is not open yet on SoloBeauté.',
}

export const SERVER_INSTRUCTIONS = [
  'SoloBeauté read-only tools: public beauty workspaces in Taiwan that hosts rent out by the hour, and public SoloBeauté beautician brand pages.',
  'These tools cannot book, pay, message or contact anyone. Beauty professionals book spaces in the SoloBeauté app (the host confirms each booking) and pay rent to the host in cash on site.',
  'Consumer booking of beauty services is not open yet on SoloBeauté; do not tell users they can book a beautician here.',
  'Never ask for or infer phone numbers, emails or street addresses; they are not available. Spaces are located by city and district only.',
  'Each result has a `notice` field; pass it on to the user when you talk about booking or prices, and link the user to `links.canonical` or `links.share`.',
  '',
  'SoloBeauté 唯讀工具：台灣可按小時租用的公開美業空間，以及公開的 SoloBeauté 美業職人品牌頁。這些工具不能預約、付款、傳訊息或聯絡任何人；美業職人在 SoloBeauté App 內預約空間，屋主確認，租金到現場以現金付給屋主。SoloBeauté 目前尚未開放消費者預約美業服務。不提供電話、Email 或詳細地址。',
].join('\n')

type Messages = {
  spaceNotFound: string
  beauticianNotFound: string
  availabilityNotOpen: string
  availabilityUnavailable: string
  invalidRange: string
  upstreamError: string
  servicesTruncated: string
  freeSlotsNote: (minHours: number) => string
}

export const MESSAGES: Record<McpLocale, Messages> = {
  'zh-TW': {
    spaceNotFound: '找不到這個公開空間。請用 search_spaces 取得空間 id。',
    beauticianNotFound: '找不到這位公開的美業職人。只能用 search_beauticians 結果裡的 ref（品牌頁網址代稱）查詢。',
    availabilityNotOpen: '時段查詢尚未開放。可以先看空間頁面，美業職人可在 SoloBeauté App 內查看時段並預約。',
    availabilityUnavailable: '時段資料暫時無法取得，請稍後再試，或到 SoloBeauté App 內查看。',
    invalidRange: '日期範圍不正確：from 和 to 要是 YYYY-MM-DD（台灣時間），from 不能早於昨天，to 不能早於 from，一次最多查 14 天。',
    upstreamError: 'SoloBeauté 資料暫時無法取得，請稍後再試。',
    servicesTruncated: '這裡只列出部分服務項目，完整項目請看品牌頁。',
    freeSlotsNote: (minHours) =>
      `freeSlots 是營業時間扣掉已被預約和屋主封鎖的時段後，至少 ${minHours} 小時的空檔（今天已過的時間不列出）。這只是查詢結果，不會保留時段；實際能否預約以 SoloBeauté App 內為準，並由屋主確認。`,
  },
  en: {
    spaceNotFound: 'No public space with this id. Use search_spaces to get a space id.',
    beauticianNotFound: 'No public beautician brand page found. Use a `ref` returned by search_beauticians.',
    availabilityNotOpen: 'Availability lookup is not open yet. See the space page; beauty professionals can check times and book in the SoloBeauté app.',
    availabilityUnavailable: 'Availability data is temporarily unavailable. Please try again later or check the SoloBeauté app.',
    invalidRange: 'Invalid date range: from and to must be YYYY-MM-DD (Taiwan time), from cannot be earlier than yesterday, to must not be before from, and one request covers at most 14 days.',
    upstreamError: 'SoloBeauté data is temporarily unavailable. Please try again later.',
    servicesTruncated: 'Only some services are listed here; see the brand page for the full list.',
    freeSlotsNote: (minHours) =>
      `freeSlots are the gaps of at least ${minHours} hours left after removing booked and host-blocked times from the opening hours (times already past today are left out). This is a lookup only and holds nothing; whether a slot can be booked is decided in the SoloBeauté app, where the host confirms each booking.`,
  },
}
