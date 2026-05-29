// 找職人 (Find a pro) — directory page, NO booking
const { useState: usFP } = React;

function FindPros() {
  const [cat, setCat] = usFP('all');
  const [city, setCity] = usFP('台北');
  const Icon = window.SBIcon;
  const ProCard = window.SBProCard;
  const cats = [
    { id: 'all', label: '全部' }, { id: 'nail', label: '美甲' }, { id: 'lash', label: '美睫' },
    { id: 'hair', label: '美髮' }, { id: 'facial', label: '美容保養' }, { id: 'makeup', label: '彩妝' },
  ];
  const pros = [
    { n: '林子晴 · Lily', i: '林', loc: '台北市 · 大安區', cat: 'nail', tags: ['日式手繪', '法式', '凝膠'], price: 1800, r: 4.9, c: 128, v: true, d: 135 },
    { n: '陳雅婷 · Yating', i: '陳', loc: '台北市 · 信義區', cat: 'lash', tags: ['單根嫁接', '開眼濃密'], price: 2400, r: 4.8, c: 96, v: true, d: 160 },
    { n: 'Sunny Hair', i: 'S', loc: '台中市 · 西區', cat: 'hair', tags: ['染髮', '護髮', '韓系燙'], price: 2800, r: 4.9, c: 214, v: true, d: 200 },
    { n: '靜慈 · 臉部保養', i: '靜', loc: '台北市 · 中山區', cat: 'facial', tags: ['深層清潔', '芳療'], price: 2200, r: 5.0, c: 54, v: false, d: 280 },
    { n: 'Mika · 彩妝', i: 'M', loc: '高雄市 · 前金區', cat: 'makeup', tags: ['新娘妝', '派對妝'], price: 3500, r: 4.9, c: 72, v: true, d: 45 },
    { n: '藝甲 · 指尖藝術', i: '藝', loc: '台北市 · 松山區', cat: 'nail', tags: ['極簡', '璀璨系'], price: 1500, r: 4.7, c: 41, v: false, d: 90 },
  ];
  const filtered = cat === 'all' ? pros : pros.filter(p => p.cat === cat);
  return (
    <section style={{ padding: '132px 32px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>找職人 · DIRECTORY</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, color: 'var(--fg-1)', margin: '10px 0 8px' }}>{city} 的<em style={{ color: 'var(--color-brand)' }}>美業職人</em></h1>
          <p style={{ color: 'var(--fg-2)', fontSize: '.98rem', margin: 0 }}>{filtered.length} 位在線 · 看作品、看評價、直接聯絡</p>
        </div>
        <div style={{ padding: '10px 16px', background: 'var(--color-bg-warm)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: '.82rem', color: 'var(--fg-2)', maxWidth: 320, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--fg-1)' }}>導流頁面</strong>：預約請直接透過職人個人管道聯繫。App 內預約功能開發中。
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 28, marginBottom: 20 }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: '9px 20px', border: 'none', borderRadius: 999, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'inherit',
            background: cat === c.id ? 'var(--color-brand)' : 'rgba(0,0,0,.04)',
            color: cat === c.id ? '#fff' : 'var(--fg-2)',
            fontWeight: 500, transition: 'all .2s',
          }}>{c.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 36, paddingBottom: 20, borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {['台北', '新北', '台中', '高雄'].map(c => (
          <button key={c} onClick={() => setCity(c)} style={{
            padding: '7px 16px', border: '1px solid var(--color-border)', borderRadius: 999, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
            background: city === c ? 'var(--fg-1)' : 'transparent',
            color: city === c ? '#fff' : 'var(--fg-2)', transition: 'all .2s',
          }}>{c}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1px solid var(--color-border)', borderRadius: 999, fontSize: '.78rem', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Icon.Filter style={{ width: 13, height: 13 }}/>價格範圍
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {filtered.map((p, i) => <ProCard key={i} name={p.n} initial={p.i} loc={p.loc} tags={p.tags} rating={p.r} reviews={p.c} price={p.price} verified={p.v} gradientDeg={p.d}/>)}
      </div>
    </section>
  );
}

// 找空間 (Find a space) — web mirror of the PRIMARY app view
function FindSpaces() {
  const [view, setView] = usFP('map');
  const Icon = window.SBIcon;
  const SpaceCard = window.SBSpaceCard;
  const MapPin = window.SBMapPin;
  const spaces = [
    { n: '靜巷 · 工作室', d: '台北 · 大安', h: 400, tour: true, v: true, r: 4.9, rv: 42, tags: ['美甲桌 ×2', 'Wi-Fi', '靜音'], pin: { x: 35, y: 42 } },
    { n: '陽光美學館', d: '台北 · 信義', h: 550, tour: true, v: true, r: 4.8, rv: 38, tags: ['美容床', '水電齊全'], pin: { x: 60, y: 55 }, active: true },
    { n: '小森 · 獨立房', d: '台北 · 中山', h: 380, tour: false, v: true, r: 5.0, rv: 21, tags: ['燙染設備', '停車位'], pin: { x: 48, y: 30 } },
    { n: '白室 · 複合空間', d: '台北 · 松山', h: 320, tour: true, v: false, r: 4.7, rv: 15, tags: ['美甲桌', '美容床'], pin: { x: 72, y: 38 } },
  ];
  return (
    <section style={{ padding: '116px 0 0', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 500 }}>找空間 · SPACES</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--fg-1)', margin: '6px 0 0' }}>台北市 · {spaces.length} 個可租空間</h1>
          </div>
          <div style={{ display: 'inline-flex', padding: 4, background: 'rgba(0,0,0,.04)', borderRadius: 999 }}>
            {[['map', '地圖', Icon.Map], ['list', '列表', Icon.Filter]].map(([k, l, I]) => (
              <button key={k} onClick={() => setView(k)} style={{
                padding: '8px 18px', borderRadius: 999, border: 'none',
                background: view === k ? '#fff' : 'transparent',
                color: view === k ? 'var(--fg-1)' : 'var(--fg-2)',
                fontSize: '.82rem', fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: view === k ? '0 2px 8px rgba(0,0,0,.08)' : 'none', fontFamily: 'inherit',
              }}><I style={{ width: 13, height: 13 }}/>{l}</button>
            ))}
          </div>
        </div>
      </div>
      {view === 'map' ? (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          <div style={{ height: 640, borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #E8EDE8 0%, #DCE3DC 40%, #E8EDE8 100%)', position: 'relative', border: '1px solid var(--color-border)' }}>
            {/* fake streets */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)"/>
              <path d="M 0 200 Q 300 180 600 220 T 1200 250" stroke="#fff" strokeWidth="6" fill="none" opacity=".7"/>
              <path d="M 400 0 L 420 640" stroke="#fff" strokeWidth="4" fill="none" opacity=".6"/>
            </svg>
            {spaces.map((s, i) => (
              <div key={i} style={{ position: 'absolute', left: `${s.pin.x}%`, top: `${s.pin.y}%`, transform: 'translate(-50%, -100%)' }}>
                <MapPin price={s.h} active={s.active}/>
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 16, right: 16, padding: '8px 14px', background: '#fff', borderRadius: 999, fontSize: '.72rem', color: 'var(--fg-2)', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>示意地圖 · illustrative</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 640, overflow: 'auto' }}>
            {spaces.map((s, i) => (
              <SpaceCard key={i} name={s.n} district={s.d} hourly={s.h} tour3d={s.tour} verified={s.v} rating={s.r} reviews={s.rv} tags={s.tags}/>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {spaces.map((s, i) => <SpaceCard key={i} name={s.n} district={s.d} hourly={s.h} tour3d={s.tour} verified={s.v} rating={s.r} reviews={s.rv} tags={s.tags}/>)}
        </div>
      )}
    </section>
  );
}

Object.assign(window, { SBFindPros: FindPros, SBFindSpaces: FindSpaces });
