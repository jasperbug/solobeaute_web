import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  zh: {
    translation: {
      nav: {
        features: '功能特色',
        howItWorks: '如何運作',
        about: '關於我們',
        download: '下載 App',
      },
      hero: {
        tagline: '職人的獨立舞台',
        title1: '你的美業空間',
        title2: '一鍵找到',
        subtitle: '台灣首個整合空間、服務、預約的美業三方平台',
        cta: '立即下載',
        ctaSub: '開始你的美業之旅',
      },
      ecosystem: {
        sectionTag: '三方生態圈',
        title: '一個平台，三方共贏',
        subtitle: '我們解決美業中每個角色的痛點',
        host: {
          role: '屋主',
          pain: '閒置空間無法有效出租、缺乏線上化管理工具',
          solution: '上架空間，輕鬆收租',
          desc: '3D 實景展示、智慧定價、自動化管理，讓你的空間被看見',
        },
        beautician: {
          role: '美容職人',
          pain: '找不到獨立空間、長約沙龍成本太高',
          solution: '自由租用，獨立接客',
          desc: '彈性時段租用、建立個人品牌、累積評價，打造你的事業',
        },
        consumer: {
          role: '消費者',
          badge: '即將開放',
          pain: '找不到優質獨立職人、預約流程不透明',
          solution: '安心搜尋，透明預約',
          desc: '真實評價、透明價格、安全金流，享受專屬你的美容體驗',
        },
      },
      howItWorks: {
        sectionTag: '如何運作',
        title: '三步驟，開始你的美業旅程',
        hostTab: '我是屋主',
        beauticianTab: '我是職人',
        hostSteps: [
          { step: '01', title: '上架空間', desc: '拍照上傳、設定時段與價格，3D 實景讓空間更吸引人' },
          { step: '02', title: '接受預約', desc: '職人瀏覽並預約你的空間，系統自動通知與管理' },
          { step: '03', title: '輕鬆收租', desc: '安全金流自動結算，專注管理你的空間' },
        ],
        beauticianSteps: [
          { step: '01', title: '搜尋空間', desc: '地圖搜尋、篩選設備，找到最適合你的工作空間' },
          { step: '02', title: '預約租用', desc: '彈性時段預約，當天就能開始接客' },
          { step: '03', title: '獨立營業', desc: '建立個人品牌頁、累積評價，壯大你的事業' },
        ],
      },
      features: {
        sectionTag: '功能特色',
        title: '為美業量身打造',
        items: [
          {
            title: '地圖搜尋空間',
            desc: '即時查看附近可用空間，價格一目瞭然',
          },
          {
            title: '智慧篩選',
            desc: '依設備、服務類型、評分、3D 實景精準篩選',
          },
          {
            title: '即時通訊',
            desc: '屋主與職人直接溝通，快速確認細節',
          },
          {
            title: '日曆預約管理',
            desc: '視覺化排程，一眼掌握所有預約狀態',
          },
        ],
      },
      market: {
        sectionTag: '市場機會',
        title: '美業正在改變',
        stats: [
          { number: 'NT$2,800億', label: '台灣美業年產值', sub: '持續成長中' },
          { number: '15萬+', label: '美容從業人員', sub: '30%+ 為自由工作者' },
          { number: '零競爭', label: '三方整合平台', sub: '先行者優勢' },
        ],
        points: [
          '皮膚管理、熱蠟除毛、美睫美甲等新興項目快速成長',
          '自由職人不願受沙龍長約束縛，需要彈性空間',
          '小紅書 / IG 推動個人品牌崛起，流量在職人而非店面',
        ],
      },
      about: {
        sectionTag: '關於我們',
        title: "Let's build the future\nof beauty together.",
        desc: 'SoloBeauté 相信每位美容職人都值得擁有獨立的舞台。我們打造一個讓屋主、職人、消費者三方共贏的生態系，用科技連結美業的每一個環節。',
        founder: 'Jasper・技術創辦人',
        founderDesc: '全端開發者，一人打造 iOS App + Backend + Infrastructure。相信三邊市場的成敗不在技術，在於產業人脈與信任。',
      },
      cta: {
        title: '準備好了嗎？',
        subtitle: '下載 SoloBeauté，開啟你的美業新篇章',
        button: '下載 App',
        iosHint: '目前支援 iOS，Android 版即將推出',
      },
      footer: {
        slogan: '職人的獨立舞台',
        contact: '聯絡我們',
        email: 'hello@solobeaute.com',
        legal: '隱私政策',
        terms: '使用條款',
        rights: '© 2026 SoloBeauté. All rights reserved.',
      },
    },
  },
  en: {
    translation: {
      nav: {
        features: 'Features',
        howItWorks: 'How It Works',
        about: 'About',
        download: 'Download',
      },
      hero: {
        tagline: "The independent stage for beauty pros",
        title1: 'Your beauty space,',
        title2: 'one tap away.',
        subtitle: "Taiwan's first three-way marketplace integrating spaces, services, and bookings for the beauty industry",
        cta: 'Download Now',
        ctaSub: 'Start your beauty journey',
      },
      ecosystem: {
        sectionTag: 'Ecosystem',
        title: 'One platform, three winners',
        subtitle: 'We solve pain points for every role in the beauty industry',
        host: {
          role: 'Space Host',
          pain: 'Idle spaces with no efficient rental channel or management tools',
          solution: 'List your space, earn effortlessly',
          desc: '3D virtual tours, smart pricing, automated management — make your space visible',
        },
        beautician: {
          role: 'Beauty Pro',
          pain: "Can't find independent spaces; long-term salon leases are too costly",
          solution: 'Rent flexibly, work independently',
          desc: 'Flexible hourly rentals, build your personal brand, grow your reputation',
        },
        consumer: {
          role: 'Consumer',
          badge: 'Coming Soon',
          pain: "Hard to find quality independent pros; booking processes lack transparency",
          solution: 'Search safely, book transparently',
          desc: 'Verified reviews, transparent pricing, secure payments — beauty on your terms',
        },
      },
      howItWorks: {
        sectionTag: 'How It Works',
        title: 'Three steps to start your beauty journey',
        hostTab: "I'm a Host",
        beauticianTab: "I'm a Beauty Pro",
        hostSteps: [
          { step: '01', title: 'List Your Space', desc: 'Upload photos, set availability & pricing. 3D tours make your space stand out' },
          { step: '02', title: 'Accept Bookings', desc: 'Pros browse and book your space. Get notified automatically' },
          { step: '03', title: 'Earn Passively', desc: 'Secure payments settled automatically. Focus on what matters' },
        ],
        beauticianSteps: [
          { step: '01', title: 'Find a Space', desc: 'Search by map, filter by equipment — find the perfect workspace' },
          { step: '02', title: 'Book & Go', desc: 'Flexible hourly bookings. Start seeing clients the same day' },
          { step: '03', title: 'Build Your Brand', desc: 'Create your profile, collect reviews, and grow your business' },
        ],
      },
      features: {
        sectionTag: 'Features',
        title: 'Built for the beauty industry',
        items: [
          {
            title: 'Map-Based Search',
            desc: 'Browse nearby spaces in real-time with transparent pricing',
          },
          {
            title: 'Smart Filters',
            desc: 'Filter by equipment, service type, ratings, and 3D virtual tours',
          },
          {
            title: 'In-App Chat',
            desc: 'Direct messaging between hosts and pros for quick coordination',
          },
          {
            title: 'Calendar Management',
            desc: 'Visual scheduling to manage all your bookings at a glance',
          },
        ],
      },
      market: {
        sectionTag: 'Market Opportunity',
        title: 'Beauty is changing',
        stats: [
          { number: 'NT$280B', label: 'Annual market value', sub: 'And growing' },
          { number: '150K+', label: 'Beauty professionals', sub: '30%+ freelancers' },
          { number: 'Blue Ocean', label: 'No integrated platform', sub: 'First-mover advantage' },
        ],
        points: [
          'Skin care, waxing, lash & nail services are booming with no dedicated platform',
          'Freelance pros want flexibility, not long-term salon contracts',
          'Social media drives personal brands — traffic follows the pro, not the shop',
        ],
      },
      about: {
        sectionTag: 'About Us',
        title: "Let's build the future\nof beauty together.",
        desc: "SoloBeauté believes every beauty professional deserves their own stage. We're building an ecosystem where hosts, pros, and consumers all win — powered by technology that connects every part of the beauty industry.",
        founder: 'Jasper — Technical Founder',
        founderDesc: 'Full-stack developer who single-handedly built the iOS App, Backend, and Infrastructure. Believes the key to a three-sided marketplace is industry connections and trust, not just technology.',
      },
      cta: {
        title: 'Ready to begin?',
        subtitle: 'Download SoloBeauté and start your new chapter in beauty',
        button: 'Download App',
        iosHint: 'Currently available on iOS. Android coming soon.',
      },
      footer: {
        slogan: 'The independent stage for beauty pros',
        contact: 'Contact Us',
        email: 'hello@solobeaute.com',
        legal: 'Privacy Policy',
        terms: 'Terms of Service',
        rights: '© 2026 SoloBeauté. All rights reserved.',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export default i18n;
