# SoloBeauté 官網改善清單

> 給同事的執行指南。所有程式碼修改已完成，以下是改了什麼、在哪裡、為什麼。

---

## 已完成的修改（4 個檔案）

### 1. `index.html` — SEO 修復

**改了什麼：** 加入社群分享和搜尋引擎必要的 meta 標籤。

**之前的問題：**
- 在 LINE / Facebook / Slack 分享網址時，不會顯示預覽圖和描述
- Google 搜尋結果缺少結構化資料
- 沒有 canonical URL（可能被搜尋引擎視為重複內容）

**新增的內容：**
- Open Graph 標籤（og:title, og:description, og:image, og:url, og:locale）
- Twitter Card 標籤
- Canonical URL
- JSON-LD 結構化資料（Organization 類型）

**⚠️ 需要手動處理：**
- 製作一張 **1200×630** 的 OG 分享圖，放到 `/public/images/og-cover.png`
  - 建議內容：Logo + 「職人的獨立舞台」+ 三方角色圖示
  - 這張圖會出現在所有社群分享預覽中

---

### 2. `src/i18n/index.js` — 文案修正 + FAQ 新增

**改了什麼：** 修正 6 處品牌語氣不一致 + 新增 FAQ 區塊翻譯（全 7 語言）。

#### 品牌語氣修正（繁中 + 簡中）

| 位置 | 修改前 | 修改後 | 原因 |
|------|--------|--------|------|
| Hero 副標 | 「美業三方**平台**」 | 「美業三方 **Marketplace**」 | 品牌指南避用「平台」 |
| 三方區塊標籤 | 「**三方生態圈**」 | 「**三個角色，一個舞台**」 | 「生態圈」是企業腔 |
| 三方區塊標題 | 「一個平台，三方共贏」 | 「一個 SoloBeauté，三方共贏」 | 強化品牌名 |
| 關於我們標題 | 英文 "Let's build the future..." | 「**一起打造美業的未來。**」 | 目標受眾是台灣職人，中文更親切 |
| 關於我們描述 | 「三方共贏的**生態系**，用**科技連結**美業」 | 「都能在這裡找到自己的位置，用**行動串起**美業」 | 去企業腔 |
| 創辦人頭銜 | 「**技術**創辦人」 | 「創辦人」 | 職人不在乎技術頭銜 |
| 創辦人描述 | 「全端開發者，一人打造 iOS App + Backend + Infrastructure」 | 「從一個想法到一個產品，從零開始打造 SoloBeauté」 | 職人不在乎 tech stack |

#### 新增 FAQ 翻譯

4 個問答，已翻譯成全部 7 種語言（繁中/英/日/韓/簡中/越/泰）：
1. 職人需要付費才能加入嗎？
2. 空間出租安全嗎？
3. 金流怎麼處理？
4. 消費者什麼時候可以使用？

#### 新增 Footer 翻譯

所有 7 種語言新增了 `instagram` 和 `line` 的翻譯 key。

---

### 3. `src/App.jsx` — FAQ 區塊 + Footer 社群連結

**改了什麼：**

- **新增 FAQ 區塊**（在「關於我們」和「CTA」之間）
  - 手風琴展開/收合效果（用 Framer Motion 動畫）
  - `FaqItem` 獨立元件

- **Footer 新增 2 個社群連結**
  - Instagram：`https://instagram.com/solobeaute.tw`
  - LINE 官方帳號：`https://lin.ee/solobeaute`

**⚠️ 需要手動處理：**
- 確認 Instagram 和 LINE 的實際 URL 是否正確（目前用的是 placeholder）
- 把實際的 URL 替換進去

---

### 4. `src/App.css` — FAQ 樣式

**改了什麼：** 新增 `.faq` 相關的 CSS 樣式。

- 最大寬度 680px 置中
- 分隔線風格，和整體 wabi-sabi 設計語言一致
- 箭頭旋轉動畫（展開時 180 度）

---

## 還需要手動處理的事項

### 必做

| # | 事項 | 說明 |
|---|------|------|
| 1 | 製作 OG 分享圖 | 1200×630 PNG，放到 `/public/images/og-cover.png` |
| 2 | 確認社群連結 URL | Instagram 和 LINE 官方帳號的真實 URL |
| 3 | App Store 連結 | 目前「下載 App」按鈕指向 `#download`（頁內錨點），App 上架後改為 App Store 真實連結 |

### 強烈建議

| # | 事項 | 說明 |
|---|------|------|
| 4 | 替換 App 截圖 | 聊天畫面有卡通貼圖和雜亂桌面照片，預約列表顯示「Tse1」「Temps」等測試帳號名。需在 App 中建立真實感的模擬數據後重新截圖 |
| 5 | 圖片格式優化 | 截圖目前是 PNG（每張 200-400KB），建議轉為 WebP 加速載入 |

### 未來考慮

| # | 事項 | 說明 |
|---|------|------|
| 6 | SSG / Prerender | 目前是純 SPA，搜尋引擎可能爬不到內容。考慮 `vite-plugin-prerender` 生成靜態 HTML |
| 7 | 社會證明區塊 | 在三方區塊和功能特色之間加入數據（合作空間數、職人數、評分） |

---

## 驗證方式

部署後用以下工具驗證：

- **OG 預覽**：https://www.opengraph.xyz/ — 貼入 solobeaute.com 檢查分享預覽
- **結構化資料**：https://search.google.com/test/rich-results — 測試 JSON-LD
- **FAQ 顯示**：手機和桌面都打開網站，滾到 FAQ 區塊確認展開/收合正常
- **Footer 連結**：確認 Instagram 和 LINE 連結可點擊且開啟正確頁面
