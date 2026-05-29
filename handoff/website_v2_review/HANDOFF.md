# SoloBeauté · Website v2 · 工程審查版

**狀態**：設計稿／審查用原型  
**語言**：繁體中文（zh-TW）  
**目標平台**：響應式網頁，1200px 設計寬度  
**標語**：Beauty Everyway · 讓每一次的服務，都有最好的空間和最對的人

---

## 1. 這份檔案是什麼

這是 SoloBeauté 官方網站 v2 的**設計原型**，不是正式程式碼。它使用：

- **React 18（CDN UMD build）**＋ `@babel/standalone` 在瀏覽器內即時轉譯 JSX
- 單一 `index.html` 內含全部樣式、元件、資料
- App 截圖以 **Base64 Data URI** 內嵌 —— 整份檔案可獨立開啟、離線運作

**不要拿這份程式碼直接上 production**。請參考此版的**視覺、IA、文案、互動行為**，在正式專案（Next.js）中以正常模組化方式重寫。

---

## 2. 快速預覽

```bash
# 直接用瀏覽器開啟即可
open index.html
```

任何本機 HTTP server 都能運作（無後端依賴）：

```bash
python3 -m http.server 8000
# 或
npx serve .
```

---

## 3. 頁面與路由

SPA，用 `localStorage('sb-v2-route')` 記住當前頁面：

| route | 說明 |
|---|---|
| `landing` | 首頁（預設）。一頁式，內含 Hero / Ecosystem / Features / HowItWorks / About / FAQ / CTA |
| `find-pros` | 找職人目錄頁（消費者導流入口，明確標示「請直接聯繫職人預約」）|
| `find-spaces` | 找空間頁（App 主要功能的網頁鏡像，含地圖 / 列表切換）|

Nav 列的「功能特色 / 如何運作 / 關於我們 / 常見問題」使用 **in-page anchor smooth scroll**（不切換路由）；「找職人」才會切路由。

---

## 4. Design tokens（在 `index.html` 的 `<style>` 區塊內）

### 色票
```
--color-brand:        #9B6B7A   /* 莓果紫 - 主 CTA */
--color-brand-deep:   #7E4E5C   /* 深莓果 - App 內 CTA（行動裝置對比）*/
--color-brand-light:  #C8A0AD   /* 淺莓果 - hover / 裝飾 */
--color-brand-bg:     #F6ECEE   /* 莓果紫 tint 底 */
--color-verified:     #C4A265   /* 金色 - 僅用於「已認證」徽章 */
--fg-1:               #2C2C2C   /* 主文字 */
--fg-2:               #5A5A5A   /* 次要文字 */
--fg-3:               #8A8580   /* 三級文字 / metadata */
--fg-heading:         #4A3328   /* 深棕 heading */
--color-bg:           #FAFAF7   /* 主背景 */
--color-bg-warm:      #F5F3EE   /* 群組底色 */
```

### 訂單狀態色（App 內使用）
```
--status-pending    #C4A265   待確認
--status-confirmed  #4A8B6F   已確認
--status-done       #5A5A5A   已完成
--status-canceled   #B04848   已取消
```

### 字體
- **Body（主要）**：Noto Sans TC（300/400/500/600/700）
- **Display（情感時刻）**：Cormorant Garamond（italic 500）—— 僅用於 hero 主標題、品牌 sign-off、裝飾性 italic
- 混排 CJK × Latin：`word-break: auto-phrase`

### 間距 / 圓角 / 陰影
標準 4/8/12/16/24/32/48/64/96 間距刻度；卡片簽名圓角 `--r-card: 20px`；`--r-pill: 999px`。

---

## 5. 元件清單

| 名稱 | 說明 |
|---|---|
| `Icon.*` | SVG 圖標集（Apple, Arrow, Map, Pin, Cube, Chat, Cal, Star, Check…）|
| `Button` | variant: primary / ghost / dark / link · size: sm / md / lg |
| `Badge` | tone: neutral / brand / verified / tour3d |
| `StatusBadge` | 訂單狀態：pending / confirmed / done / canceled |
| `PhoneFrame` | iPhone 15 Pro 比例 (900:1947)，hover 微浮 + 點擊開 Lightbox |
| `Lightbox` | 全螢幕手機畫面查看器，ESC / 點背景關閉 |
| `SpaceCard` | 空間卡（含 3D 實景、已認證徽章、每小時價、評分、設備標籤）|
| `ProCard` | 職人卡（含姓名、地區、類別標籤、評分、起價）|
| `ChatBubble` | 聊天氣泡（me / them）|
| `MapPin` | 地圖上的價格 pin |

---

## 6. 資料（全部寫死）

所有資料目前都是**前端假資料**，寫在各 component 內部：

- Hero 三張手機截圖（Base64）
- Features 四功能卡 + 對應手機截圖
- Find-Pros 6 位假職人
- Find-Spaces 4 個假空間（含地圖座標 `{x, y}`）
- FAQ 7 題

上 production 時，這些資料應來自 API / CMS。

---

## 7. 互動清單（已實作）

- ✅ Header scroll 變透明 → 半透明 blur
- ✅ Hero 手機 hover 浮起 + 點擊開 Lightbox
- ✅ Features 手機同上
- ✅ Lightbox ESC / 點背景 / 點 ×按鈕關閉
- ✅ HowItWorks 「屋主視角 / 職人視角」tab 切換
- ✅ FAQ 手風琴展開
- ✅ Nav 列 in-page anchor smooth scroll
- ✅ Find-Pros 類別 / 城市篩選
- ✅ Find-Spaces 地圖 / 列表 view 切換
- ✅ 語系切換按鈕（TW / EN）—— **只是視覺佔位**，英文版尚未實作
- ✅ Route 持久化（localStorage）

---

## 8. 待辦 / 工程端需要補的

1. **英文版（i18n）** —— 切換 TW/EN 目前只改按鈕文字，所有內容都需要 i18n 字典
2. **真實資料串接** —— 所有卡片、地圖、FAQ 都從 API
3. **真實地圖** —— 現在的地圖是 SVG 示意圖，production 需接 Google Maps 或 Mapbox
4. **App Store / Google Play badge 連結** —— 所有「下載 iOS App」按鈕目前沒有 href
5. **SEO / Meta / OG tags** —— 原型內沒做
6. **分析追蹤** —— GA4 / Mixpanel / 等
7. **字體載入最佳化** —— 目前走 Google Fonts CDN，production 建議 self-host
8. **無障礙 (a11y)** —— 目前只做了基本結構，需補 aria-label、focus ring、鍵盤操作測試
9. **手機版 RWD** —— 原型固定 1200px 設計寬度，行動裝置會水平捲動，需做響應式

---

## 9. 設計決策備忘

**為什麼標語 "Beauty Everyway" 放在 Hero 最上？**  
作為 brand mark，在主標題之前建立品牌識別；副標語放在主標題之下、作為情感副述，維持「品牌 → 訴求 → 功能」三層層次。

**為什麼「找職人」不在主 CTA？**  
產品核心是**美業空間租賃**（職人＋屋主在 App 內）。網站主要驅動下載 App；「找職人」是為了給消費者一個觸及平台職人的入口，屬於導流功能，因此放在副 CTA 與 nav。

**為什麼金色（#C4A265）只用在「已認證」徽章？**  
避免 brand color 稀釋。莓果紫是主 CTA；金色保留給信任訊號，用量極少，看到就知道意義。

**為什麼內嵌 Base64 而不用外部圖片？**  
原型檔需要可獨立開啟、離線審查。正式 production 應走 CDN / Next Image 最佳化。

---

## 10. 問題反饋

若有疑問或建議，請在這份資料夾內開 issue 或直接回覆給 Meigo / Jasper。
