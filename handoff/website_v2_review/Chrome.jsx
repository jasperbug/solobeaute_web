// Header + Footer — mirrors solobeaute.com chrome
const { useState: usH, useEffect: ueH } = React;

function Header({ onNav, active, locale, onLocale }) {
  const [scrolled, setScrolled] = usH(false);
  ueH(() => {
    const f = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', f); f();
    return () => window.removeEventListener('scroll', f);
  }, []);
  const links = [
    { id: 'features', label: '功能特色' },
    { id: 'how', label: '如何運作' },
    { id: 'about', label: '關於我們' },
    { id: 'faq', label: '常見問題' },
    { id: 'find-pros', label: '找職人' },
  ];
  const Icon = window.SBIcon;
  const Button = window.SBButton;
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 0',
      background: scrolled ? 'rgba(250,250,247,.92)' : 'transparent',
      backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      transition: 'all .4s var(--ease-emph)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a onClick={() => onNav('landing')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #C8A0AD, #9B6B7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500 }}>S</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--fg-1)', letterSpacing: '.01em' }}>SoloBeauté</span>
        </a>
        <div style={{ display: 'flex', gap: 32 }}>
          {links.map(l => (
            <a key={l.id} onClick={() => onNav(l.id)} style={{ fontSize: '.82rem', color: active === l.id ? 'var(--fg-1)' : 'var(--fg-2)', cursor: 'pointer', transition: 'color .2s', letterSpacing: '.02em' }}>{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => onLocale(locale === 'zh' ? 'en' : 'zh')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 999, border: '1px solid var(--color-border)', background: 'transparent',
            fontSize: '.75rem', color: 'var(--fg-2)', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <Icon.Globe style={{ width: 13, height: 13 }}/>{locale === 'zh' ? 'TW' : 'EN'}
          </button>
          <Button size="sm" variant="dark" icon={Icon.Apple}>下載 App</Button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '48px 0 32px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-warm)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #C8A0AD, #9B6B7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 500 }}>S</div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--fg-1)' }}>SoloBeauté</span>
            </div>
            <p style={{ fontSize: '.82rem', color: 'var(--fg-2)', lineHeight: 1.7, margin: 0, maxWidth: 280 }}>台灣美業職人的獨立舞台。找空間、開工作、做生意。</p>
          </div>
          {[
            { t: '產品', links: ['找空間', '找職人', '下載 iOS App'] },
            { t: '關於', links: ['關於我們', '聯絡我們', '合作提案'] },
            { t: '法律', links: ['使用條款', '隱私政策', '支援中心'] },
          ].map(col => (
            <div key={col.t}>
              <h4 style={{ fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, margin: '0 0 14px' }}>{col.t}</h4>
              {col.links.map(l => <a key={l} style={{ display: 'block', fontSize: '.85rem', color: 'var(--fg-2)', cursor: 'pointer', padding: '4px 0' }}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 24, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.75rem', color: 'var(--fg-3)' }}>
          <span>© 2026 SoloBeauté · Taiwan</span>
          <span>Made in Taipei · 台北 · 台中 · 高雄</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SBHeader: Header, SBFooter: Footer });
