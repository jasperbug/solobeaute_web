// v2 primitives — icon set, badge variants, buttons, phone frame, cards, chat bubble
const { useState, useEffect } = React;

const Icon = {
  Apple: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
  Arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Map: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Pin: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.7a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>,
  Cube: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="m21 16-9 5-9-5V8l9-5 9 5v8z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>,
  Chat: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Cal: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Globe: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Star: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2.5 2.94 6.11 6.74.98-4.84 4.72 1.14 6.69L12 17.77 6.02 21l1.14-6.69L2.32 9.59l6.74-.98L12 2.5Z"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm4.3 8.71-4.81 4.8a1 1 0 0 1-1.41 0l-2.38-2.38a1 1 0 1 1 1.41-1.41l1.67 1.67 4.1-4.09a1 1 0 1 1 1.42 1.41Z"/></svg>,
  ChevDown: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="6 9 12 15 18 9"/></svg>,
  ChevRight: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  Search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Home: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  User: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Inbox: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
};

// ---------- BUTTONS ----------
function Button({ variant = 'primary', size = 'md', children, icon: IconComp, ...rest }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, letterSpacing: '.01em', transition: 'all .2s var(--ease-emph)' };
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '.78rem', borderRadius: 999 },
    md: { padding: '12px 24px', fontSize: '.88rem', borderRadius: 999 },
    lg: { padding: '14px 28px', fontSize: '.92rem', borderRadius: 999 },
  };
  const variants = {
    primary: { background: 'var(--color-brand)', color: '#fff', boxShadow: 'var(--shadow-cta)' },
    ghost: { background: 'transparent', color: 'var(--fg-1)', border: '1px solid var(--color-border)' },
    dark: { background: 'var(--fg-1)', color: '#fff' },
    link: { background: 'transparent', color: 'var(--color-brand)', padding: 0, fontWeight: 500 },
  };
  return <button style={{ ...base, ...sizes[size], ...variants[variant] }} {...rest}>{IconComp && <IconComp style={{ width: 16, height: 16 }}/>}{children}</button>;
}

// ---------- BADGES ----------
function Badge({ tone = 'neutral', icon: IconComp, children }) {
  const tones = {
    neutral: { bg: 'rgba(0,0,0,.05)', fg: 'rgba(0,0,0,.65)' },
    brand: { bg: 'var(--color-brand-bg)', fg: 'var(--color-brand)' },
    verified: { bg: 'var(--color-verified-bg)', fg: 'var(--color-verified)' },
    tour3d: { bg: '#2C2C2C', fg: '#fff' },
  };
  const t = tones[tone];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: t.bg, color: t.fg, borderRadius: 6, fontSize: '.72rem', fontWeight: 500, letterSpacing: '.01em' }}>
    {IconComp && <IconComp style={{ width: 11, height: 11 }}/>}{children}
  </span>;
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: '待確認', bg: 'var(--status-pending-bg)', fg: 'var(--status-pending)' },
    confirmed: { label: '已確認', bg: 'var(--status-confirmed-bg)', fg: 'var(--status-confirmed)' },
    done: { label: '已完成', bg: 'var(--status-done-bg)', fg: 'var(--status-done)' },
    canceled: { label: '已取消', bg: 'var(--status-canceled-bg)', fg: 'var(--status-canceled)' },
  };
  const s = map[status];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 500, background: s.bg, color: s.fg }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg }}/>{s.label}
  </span>;
}

// ---------- PHONE FRAME ----------
function PhoneFrame({ src, alt, scale = 1, tilt = 0, caption }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 260, height: 540,
        background: '#fff', borderRadius: 36,
        boxShadow: '0 30px 80px rgba(0,0,0,.15), 0 0 0 8px #1A1A1A',
        padding: 0, overflow: 'hidden', position: 'relative',
        transform: `scale(${scale}) rotate(${tilt}deg)`,
        transition: 'transform .6s var(--ease-emph)',
      }}>
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width: 100, height: 26, background:'#1A1A1A', borderRadius: 999, zIndex: 2 }}/>
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
      </div>
      {caption && <div style={{ textAlign: 'center', fontSize: '.72rem', letterSpacing: '.12em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>{caption}</div>}
    </div>
  );
}

// ---------- CARDS ----------
function SpaceCard({ name, district, hourly, tour3d, rating, reviews, tags = [], verified }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)', cursor: 'pointer', transition: 'transform .3s var(--ease-emph), box-shadow .3s' }}
         onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-hover)'; }}
         onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}>
      <div style={{ height: 180, background: `linear-gradient(135deg, #C8A0AD, #9B6B7A)`, position: 'relative' }}>
        {tour3d && <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone="tour3d" icon={Icon.Cube}>3D 實景</Badge></div>}
        {verified && <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge tone="verified" icon={Icon.Check}>已認證</Badge></div>}
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 4px' }}>{name}</h3>
        <p style={{ fontSize: '.78rem', color: 'var(--fg-3)', margin: '0 0 10px' }}>{district}</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {tags.map(t => <span key={t} style={{ fontSize: '.7rem', padding: '2px 8px', background: 'rgba(0,0,0,.04)', color: 'var(--fg-2)', borderRadius: 6 }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.78rem', color: 'var(--fg-1)' }}>
            <Icon.Star style={{ width: 12, height: 12, color: 'var(--color-verified)' }}/>{rating} <span style={{ color: 'var(--fg-3)' }}>({reviews})</span>
          </span>
          <span style={{ fontSize: '.88rem', color: 'var(--color-brand)', fontWeight: 600 }}>NT${hourly}<span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--fg-3)' }}>/小時</span></span>
        </div>
      </div>
    </div>
  );
}

function ProCard({ name, initial, loc, tags = [], rating, reviews, price, verified, gradientDeg = 135 }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)', cursor: 'pointer', transition: 'all .3s var(--ease-emph)' }}
         onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-hover)'; }}
         onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(${gradientDeg}deg, #C8A0AD, #9B6B7A)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500 }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--fg-1)', margin: 0 }}>{name}</h3>
          {verified && <Icon.Check style={{ width: 14, height: 14, color: 'var(--color-brand)' }}/>}
        </div>
        <p style={{ fontSize: '.78rem', color: 'var(--fg-3)', margin: '0 0 8px' }}>{loc}</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {tags.map(t => <span key={t} style={{ fontSize: '.7rem', padding: '2px 8px', background: 'rgba(0,0,0,.04)', color: 'var(--fg-2)', borderRadius: 6 }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.78rem', color: 'var(--fg-1)' }}>
            <Icon.Star style={{ width: 12, height: 12, color: 'var(--color-verified)' }}/>{rating} <span style={{ color: 'var(--fg-3)' }}>({reviews})</span>
          </span>
          <span style={{ fontSize: '.85rem', color: 'var(--color-brand)', fontWeight: 600 }}>NT${price.toLocaleString()} 起</span>
        </div>
      </div>
    </div>
  );
}

// ---------- CHAT ----------
function ChatBubble({ side = 'them', children, time }) {
  const mine = side === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: mine ? 'var(--color-brand)' : '#fff',
          color: mine ? '#fff' : 'var(--fg-1)',
          padding: '10px 14px', borderRadius: 18,
          borderBottomRightRadius: mine ? 4 : 18,
          borderBottomLeftRadius: mine ? 18 : 4,
          border: mine ? 'none' : '1px solid var(--color-border)',
          fontSize: '.88rem', lineHeight: 1.5,
        }}>{children}</div>
        {time && <div style={{ fontSize: '.65rem', color: 'var(--fg-3)', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{time}</div>}
      </div>
    </div>
  );
}

// ---------- MAP PIN ----------
function MapPin({ price, active }) {
  return <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '5px 10px',
    background: active ? 'var(--color-brand)' : '#fff',
    color: active ? '#fff' : 'var(--fg-1)',
    border: active ? 'none' : '1px solid var(--color-border)',
    borderRadius: 999,
    fontSize: '.74rem', fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    cursor: 'pointer', transition: 'all .2s',
  }}>NT${price}</div>;
}

Object.assign(window, { SBIcon: Icon, SBButton: Button, SBBadge: Badge, SBStatusBadge: StatusBadge, SBPhoneFrame: PhoneFrame, SBSpaceCard: SpaceCard, SBProCard: ProCard, SBChatBubble: ChatBubble, SBMapPin: MapPin });
