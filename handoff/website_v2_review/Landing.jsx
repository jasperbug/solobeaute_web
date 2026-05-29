// Landing sections — aligned to production solobeaute.com IA
const { useState: usL } = React;

// ========== HERO ==========
function Hero() {
  const Icon = window.SBIcon;
  const Button = window.SBButton;
  const Phone = window.SBPhoneFrame;
  return (
    <section style={{ padding: '140px 32px 96px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
      <span style={{ display: 'inline-block', fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 20, fontWeight: 500 }}>TAIWAN · iOS</span>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)', fontWeight: 400, lineHeight: 1.12, color: 'var(--fg-1)', margin: '0 0 24px', letterSpacing: '-.01em' }}>
        台灣美業職人的<br/><em style={{ fontStyle: 'italic', color: 'var(--color-brand)' }}>獨立舞台</em>
      </h1>
      <p style={{ fontSize: '1.08rem', lineHeight: 1.7, color: 'var(--fg-2)', maxWidth: 560, margin: '0 auto 40px' }}>
        不用再一間一間打電話問。打開 App，看空間、看價錢、看實景，直接訊息屋主。想接客的時候租、不想的時候休息。
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 72, flexWrap: 'wrap' }}>
        <Button size="lg" variant="primary" icon={Icon.Apple}>下載 iOS App</Button>
        <Button size="lg" variant="ghost">我是屋主 →</Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <Phone src="img/list.PNG" alt="找空間列表" caption="列表 · LIST" tilt={-2}/>
        <div style={{ transform: 'translateY(-20px)' }}><Phone src="img/map.PNG" alt="地圖搜尋" caption="地圖 · MAP"/></div>
        <Phone src="img/3d-tour.PNG" alt="3D 實景" caption="3D 實景 · TOUR" tilt={2}/>
      </div>
    </section>
  );
}

// ========== ECOSYSTEM (pro-first) ==========
function Ecosystem() {
  const roles = [
    {
      tag: '職人 · PRO', priority: '← 我們服務的核心',
      title: '想接客的時候租，不想的時候休息',
      body: '你是獨立工作的美甲師、美髮師、美容師、美睫師、彩妝師 —— SoloBeauté 讓你用小時或時段租用已經備好的工作空間。帶著工具來，做完就走。',
      cta: '下載 iOS App',
    },
    {
      tag: '屋主 · HOST', priority: '',
      title: '把閒置的空間變成收入',
      body: '你有一間美業工作室，但不是每個時段都在用。上架到 SoloBeauté，讓同行職人按時段租用，你決定價錢、時段、誰可以來。',
      cta: '成為屋主 →',
    },
    {
      tag: '消費者 · CLIENT', priority: '即將開放 · web only',
      title: '找到那位對的職人',
      body: '透過職人目錄，看作品、看評價、看價錢，直接連絡他們。目前為導流入口，預約仍透過職人的個人管道完成。',
      cta: '找職人 →',
    },
  ];
  return (
    <section style={{ padding: '96px 32px', background: 'var(--color-bg-warm)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>生態系 · ECOSYSTEM</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, lineHeight: 1.2, color: 'var(--fg-1)', margin: '12px 0 56px', maxWidth: 680 }}>
          三個角色，<em style={{ color: 'var(--color-brand)' }}>一個飛輪</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {roles.map((r, i) => (
            <div key={r.tag} style={{
              background: i === 0 ? 'var(--fg-1)' : '#fff',
              color: i === 0 ? '#fff' : 'inherit',
              borderRadius: 20, padding: 32,
              border: i === 0 ? 'none' : '1px solid var(--color-border)',
              boxShadow: i === 0 ? '0 12px 40px rgba(0,0,0,.18)' : '0 4px 24px rgba(0,0,0,.04)',
              position: 'relative',
            }}>
              {r.priority && <span style={{ position: 'absolute', top: 20, right: 20, fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: i === 0 ? 'var(--color-brand-light)' : 'var(--fg-3)' }}>{r.priority}</span>}
              <span style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: i === 0 ? 'var(--color-brand-light)' : 'var(--color-brand)', fontWeight: 500 }}>{r.tag}</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 500, color: i === 0 ? '#fff' : 'var(--fg-heading)', margin: '16px 0 12px', lineHeight: 1.25 }}>{r.title}</h3>
              <div style={{ height: 1, background: i === 0 ? 'rgba(255,255,255,.15)' : 'rgba(196,162,101,.3)', width: 36, marginBottom: 16 }}/>
              <p style={{ fontSize: '.92rem', lineHeight: 1.75, color: i === 0 ? 'rgba(255,255,255,.78)' : 'var(--fg-2)', margin: '0 0 20px' }}>{r.body}</p>
              <a style={{ fontSize: '.82rem', fontWeight: 500, color: i === 0 ? '#fff' : 'var(--color-brand)', cursor: 'pointer' }}>{r.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== FEATURES ==========
function Features() {
  const feats = [
    { tag: '01', t: '3D 實景看空間', d: '不用親自跑一趟。打開 App 看 360° 實景，桌椅、燈光、動線一目了然。', img: 'img/3d-tour.PNG' },
    { tag: '02', t: '地圖找附近空間', d: '按價錢、按距離、按設備。看到順眼的直接傳訊息給屋主。', img: 'img/map.PNG' },
    { tag: '03', t: '內建訊息與預約', d: '問問題、喬時間、確認預約。所有紀錄留在 App 裡，不用再用 LINE。', img: 'img/chat.PNG' },
    { tag: '04', t: '收款與結算自動處理', d: '消費者付款、平台扣成、屋主收款。每筆都有電子發票，月結對帳很乾淨。', img: 'img/payout.PNG' },
  ];
  return (
    <section style={{ padding: '96px 32px', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>功能特色 · FEATURES</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, lineHeight: 1.2, color: 'var(--fg-1)', margin: '12px 0 0' }}>
            做一件事做到好 —— <em style={{ color: 'var(--color-brand)' }}>空間配對</em>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
          {feats.map((f, i) => (
            <div key={f.tag} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--color-brand-light)', fontWeight: 400, letterSpacing: '.04em' }}>{f.tag}</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, color: 'var(--fg-heading)', margin: '8px 0 16px', lineHeight: 1.2 }}>{f.t}</h3>
                <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--fg-2)', margin: 0 }}>{f.d}</p>
              </div>
              <div style={{ order: i % 2 === 0 ? 2 : 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 260, height: 540, background: '#fff', borderRadius: 36, boxShadow: '0 30px 80px rgba(0,0,0,.15), 0 0 0 8px #1A1A1A', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 100, height: 26, background: '#1A1A1A', borderRadius: 999, zIndex: 2 }}/>
                  <img src={f.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== HOW IT WORKS (persona tabs) ==========
function HowItWorks() {
  const [tab, setTab] = usL('host');
  const flows = {
    host: [
      { n: '01', t: '上架空間', d: '拍 3D 實景、填設備資訊、設定小時價。上架當天就可開始被搜尋。' },
      { n: '02', t: '審核開放時段', d: '開放你不在的時段。週三晚上空？開起來就好。' },
      { n: '03', t: '接收預約訊息', d: '職人看到你的空間，傳訊息問問題或下訂。你按一下確認。' },
      { n: '04', t: '每月對帳收款', d: '平台月結，入帳台灣銀行戶頭。所有訂單有發票紀錄。' },
    ],
    pro: [
      { n: '01', t: '下載 App 開戶', d: '填基本資料、專業類別、服務經驗。審核通過就能用。' },
      { n: '02', t: '找附近的空間', d: '開地圖看附近有什麼，或用列表按價錢篩選。看到順眼的點進去看 3D 實景。' },
      { n: '03', t: '訊息屋主、確認預約', d: '問清楚設備、水電、停車。確認後直接在 App 內下訂。' },
      { n: '04', t: '做你的生意', d: '你的客人、你的手藝、你的收入。SoloBeauté 只幫你搞定場地。' },
    ],
  };
  const cur = flows[tab];
  return (
    <section style={{ padding: '96px 32px', background: 'var(--color-bg-warm)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>如何運作 · HOW IT WORKS</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, color: 'var(--fg-1)', margin: '12px 0 32px' }}>四個步驟，開始做生意</h2>
          <div style={{ display: 'inline-flex', padding: 4, background: 'rgba(0,0,0,.04)', borderRadius: 999 }}>
            {[['host', '屋主視角'], ['pro', '職人視角']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '10px 24px', borderRadius: 999, border: 'none',
                background: tab === k ? '#fff' : 'transparent',
                color: tab === k ? 'var(--fg-1)' : 'var(--fg-2)',
                fontSize: '.85rem', fontWeight: 500, cursor: 'pointer',
                boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
                transition: 'all .2s', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {cur.map((s, i) => (
            <div key={s.n} style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid var(--color-border)', position: 'relative' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--color-brand-light)', fontWeight: 400, letterSpacing: '.04em' }}>{s.n}</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--fg-1)', margin: '6px 0 10px', lineHeight: 1.3 }}>{s.t}</h3>
              <p style={{ fontSize: '.85rem', color: 'var(--fg-2)', lineHeight: 1.7, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== ABOUT ==========
function About() {
  return (
    <section style={{ padding: '96px 32px', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>關於我們 · ABOUT</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, color: 'var(--fg-1)', margin: '12px 0 20px' }}>兩個人，一個 App</h2>
          <p style={{ fontSize: '1rem', color: 'var(--fg-2)', lineHeight: 1.8, maxWidth: 620, margin: '0 auto' }}>
            SoloBeauté 不是一家矽谷新創，也沒有融到天價資金。是我們兩個人，用自己的存款和時間，一行一行寫出來的。
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {[
            { name: 'Jasper', role: '寫程式的', init: 'J', grad: 220, body: '一個想讓台灣美業職人過更好的工程師。白天寫 code、晚上也寫 code。產品所有東西都出自他手 —— iOS app、Next.js 網站、Fastify backend、甚至這個 CI 都是。' },
            { name: 'Lavinia', role: '做美的', init: 'L', grad: 340, body: '十年以上台灣美甲圈的資深職人，開過工作室、教過課、接過明星的單。知道這個行業的痛、知道職人要什麼 —— SoloBeauté 的每個功能都先過她這關。' },
          ].map(p => (
            <div key={p.name} style={{ textAlign: 'center' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: `linear-gradient(${p.grad}deg, #C8A0AD, #9B6B7A)`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '3.6rem', fontWeight: 500, boxShadow: '0 12px 40px rgba(155,107,122,.25)' }}>{p.init}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, color: 'var(--fg-heading)', margin: '0 0 4px' }}>{p.name}</h3>
              <p style={{ fontSize: '.82rem', color: 'var(--color-brand)', letterSpacing: '.04em', margin: '0 0 16px' }}>{p.role}</p>
              <p style={{ fontSize: '.92rem', color: 'var(--fg-2)', lineHeight: 1.8, margin: 0, textAlign: 'left' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== FAQ ==========
function Faq() {
  const [open, setOpen] = usL(0);
  const items = [
    { q: '加入平台要錢嗎？', a: '下載 App、建立帳號、上架空間都完全免費。我們只在成功完成交易時，抽取少量服務費。早鳥屋主有 3 個月免佣優惠。' },
    { q: '要怎麼確保職人不亂搞空間？', a: '每位職人都要實名審核與作品集驗證。平台有押金機制、保險方案，出事有保障。屋主可以隨時拒絕職人的預約請求。' },
    { q: '3D 實景怎麼拍？', a: '我們會提供拍攝教學，手機用 App 內建功能就能拍。台北、台中、高雄前 50 位上架屋主，可以申請免費到府拍攝。' },
    { q: '支援哪些城市？', a: '首波上線：台北、新北、台中、高雄。其他縣市陸續開放中。' },
    { q: '消費者要怎麼預約？', a: '目前網站的「找職人」頁面是導流入口 —— 看完職人資料後，可以直接用他們的聯絡方式約時間。App 內的消費者端預約功能正在開發中。' },
  ];
  return (
    <section style={{ padding: '96px 32px', background: 'var(--color-bg-warm)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>常見問題 · FAQ</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 400, color: 'var(--fg-1)', margin: '12px 0 40px' }}>有疑問？我們有答案。</h2>
        {items.map((it, i) => (
          <div key={i}>
            <div onClick={() => setOpen(open === i ? -1 : i)} style={{ padding: '22px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--fg-1)' }}>{it.q}</span>
              <span style={{ color: 'var(--fg-3)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .3s', fontSize: 18 }}>▾</span>
            </div>
            {open === i && <p style={{ padding: '14px 0 22px', fontSize: '.92rem', color: 'var(--fg-2)', lineHeight: 1.8, margin: 0, borderBottom: '1px solid var(--color-border)' }}>{it.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ========== CTA ==========
function Cta() {
  const Icon = window.SBIcon;
  return (
    <section style={{ padding: '104px 32px', background: 'var(--fg-1)', color: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-verified)', fontWeight: 500 }}>準備好了嗎</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3.4rem', fontWeight: 400, lineHeight: 1.15, margin: '20px 0 24px' }}>
          你的下一個工作空間，<br/><em style={{ color: 'var(--color-brand-light)' }}>下一個客人</em>
        </h2>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.75, color: 'rgba(255,255,255,.72)', marginBottom: 40 }}>下載 SoloBeauté iOS App，台北、台中、高雄都已上線。</p>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: '#fff', color: 'var(--fg-1)', border: 'none', borderRadius: 999, fontSize: '.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Icon.Apple style={{ width: 20, height: 20 }}/>下載 iOS App
        </button>
      </div>
    </section>
  );
}

Object.assign(window, { SBHero: Hero, SBEcosystem: Ecosystem, SBFeatures: Features, SBHowItWorks: HowItWorks, SBAbout: About, SBFaq: Faq, SBCta: Cta });
