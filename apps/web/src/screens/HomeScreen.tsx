import React from 'react';
import { Glyph } from '../components/cards/Glyph';
import { CardFace } from '../components/cards/CardFace';
import { FlipCard } from '../components/cards/FlipCard';
import { Ornament } from '../components/ui/Ornament';
import { SPREADS, ARCANA, SPREAD_COVER } from '@taro/shared';
import type { Card, Spread, SpreadId } from '@taro/shared';

// ── Вспомогательные компоненты ──

const Crown = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 8l4 4 5-7 5 7 4-4-2 12H5z"/>
  </svg>
);

function coverCard(id: string): Card {
  const n = SPREAD_COVER[id] ?? 0;
  return ARCANA.find(c => c.n === n) ?? ARCANA[0];
}

function SpreadCover({ id, w }: { id: string; w: number }) {
  return <CardFace card={coverCard(id)} w={w} />;
}

function priceInfo(t: Spread, freeAvailable: boolean) {
  if (t.price === 0) return { free: true, text: 'Бесплатно', was: undefined };
  if (t.free1card && freeAvailable) return { free: true, text: 'Бесплатно сегодня', was: `${t.price} ₽` };
  return { free: false, text: `${t.price} ₽`, was: undefined };
}

function PriceTag({ info, accent, compact }: { info: ReturnType<typeof priceInfo>; accent?: string; compact?: boolean }) {
  if (info.free) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:8,
        background:'rgba(95,208,160,.16)', border:'1px solid rgba(95,208,160,.5)', color:'#7fe0b4',
        fontSize:11, fontWeight:600, letterSpacing:.2, whiteSpace:'nowrap', flexShrink:0 }}>
        {info.was && !compact && <span style={{ textDecoration:'line-through', opacity:.5, color:'var(--muted)', fontWeight:400 }}>{info.was}</span>}
        {compact && info.was ? 'Бесплатно' : info.text}
      </span>
    );
  }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontFamily:'Marcellus, serif',
      fontSize:16, color: accent || 'var(--gold)', flexShrink:0 }}>{info.text}</span>
  );
}

function TopBar({ balance, onBalance }: { balance: number; onBalance: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 20px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div className="float" style={{ color:'var(--gold)', filter:'drop-shadow(0 0 6px var(--glow-soft))' }}>
          <Glyph k="moon" size={26} />
        </div>
        <div>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:19, color:'var(--text)', letterSpacing:1, lineHeight:1 }}>Таро Премиум</div>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:3, textTransform:'uppercase' }}>оракул судьбы</div>
        </div>
      </div>
      <button onClick={onBalance} style={{ display:'flex', alignItems:'center', gap:8,
        padding:'8px 8px 8px 14px', borderRadius:22, cursor:'pointer',
        background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
        <span style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--gold)', lineHeight:1 }}>{balance} ₽</span>
        <span style={{ display:'grid', placeItems:'center', width:26, height:26, borderRadius:14,
          background:'linear-gradient(135deg,var(--gold),var(--gold-deep))', color:'var(--on-gold)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </span>
      </button>
    </div>
  );
}

function FreeBanner({ t, onStart, i = 0, freeAvailable }: { t: Spread; onStart: (id: SpreadId) => void; i: number; freeAvailable: boolean }) {
  const info = priceInfo(t, freeAvailable);
  const cnt = t.count;
  const cntLabel = cnt === 1 ? 'карта' : cnt < 5 ? 'карты' : 'карт';
  return (
    <button onClick={() => onStart(t.id as SpreadId)} style={{ textAlign:'left', position:'relative',
      display:'flex', flexDirection:'column', padding:14, borderRadius:18, cursor:'pointer',
      background:'var(--panel)', border:'1px solid var(--gold-line)', overflow:'hidden', minHeight:210 }}>
      <div className="sheen-band" style={{ animationDelay:`${i*0.9}s`, opacity:.55 }} />
      <div style={{ position:'relative', display:'flex', justifyContent:'center', marginBottom:12 }}>
        <SpreadCover id={t.id} w={66} />
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
          <span style={{ width:5, height:5, borderRadius:5, background:t.accent, boxShadow:`0 0 6px ${t.accent}`, flexShrink:0 }} />
          <span style={{ fontSize:8.5, letterSpacing:1.2, textTransform:'uppercase', color:'var(--muted)', lineHeight:1.2 }}>{t.cat}</span>
        </div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)', lineHeight:1.05 }}>{t.title}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13.5, color:'var(--muted)', marginTop:4, lineHeight:1.28 }}>{t.sub}</div>
      </div>
      <div style={{ flex:1 }} />
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginTop:12 }}>
        <span style={{ fontSize:9.5, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {cnt} {cntLabel}</span>
        <PriceTag info={info} accent={t.accent} compact />
      </div>
    </button>
  );
}

function PremiumBanner({ t, onStart, i = 0, freeAvailable }: { t: Spread; onStart: (id: SpreadId) => void; i: number; freeAvailable: boolean }) {
  const info = priceInfo(t, freeAvailable);
  const cnt = t.count;
  const cntLabel = cnt === 0 ? '' : cnt < 5 ? 'карты' : 'карт';
  return (
    <button onClick={() => onStart(t.id as SpreadId)} style={{ width:'100%', textAlign:'left', position:'relative',
      display:'flex', gap:16, alignItems:'center', borderRadius:22, padding:16, cursor:'pointer', overflow:'hidden',
      background:`linear-gradient(120deg, ${t.accent}33 0%, ${t.accent}12 50%, rgba(12,10,24,.4) 100%)`,
      border:`1px solid ${t.accent}55` }}>
      <div className="sheen-band" style={{ animationDelay:`${i*1.1}s`, opacity:.7 }} />
      <SpreadCover id={t.id} w={104} />
      <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <span style={{ width:6, height:6, borderRadius:5, background:t.accent, boxShadow:`0 0 8px ${t.accent}` }} />
          <span style={{ fontSize:9.5, letterSpacing:2.2, textTransform:'uppercase', color:t.accent, fontWeight:500 }}>{t.cat}</span>
        </div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', lineHeight:1.05 }}>{t.title}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:14.5, color:'var(--muted)', marginTop:5, lineHeight:1.35 }}>{t.sub}.</div>
        <div style={{ height:1, background:`linear-gradient(90deg, ${t.accent}44, transparent)`, margin:'12px 0 11px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, letterSpacing:1.2, textTransform:'uppercase', color:'var(--muted)' }}>
            {cnt > 0 ? `${cnt} ${cntLabel}` : 'Персональный'}</span>
          <span style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', borderRadius:12,
            background:`linear-gradient(135deg, ${t.accent}, ${t.accent}99)`, color:'#fff', fontSize:13, fontWeight:500,
            boxShadow:`0 6px 16px ${t.accent}44`, whiteSpace:'nowrap' }}>
            {info.text}
            <svg width="13" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 5h11M8 1l4 4-4 4"/>
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}

function HowItWorks() {
  const P = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const };
  const icons: Record<string, React.ReactNode> = {
    choose:  <g {...P}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></g>,
    shuffle: <g {...P}><path d="M16 4h4v4M20 4l-7 7M8 20H4v-4M4 20l7-7M20 16v4h-4M14 14l6 6M4 8V4h4M10 10L4 4"/></g>,
    spark:   <g {...P}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></g>,
  };
  const steps = [
    { n:'01', icon:'choose',  title:'Выберите расклад', d:'Определитесь с вопросом и выберите подходящий тип расклада из нашей коллекции древних арканов' },
    { n:'02', icon:'shuffle', title:'Тяните карты',     d:'Сосредоточьтесь на вопросе и интуитивно выберите карты из колоды 78 арканов Таро' },
    { n:'03', icon:'spark',   title:'Получите ответ',   d:'Откройте для себя глубокую персональную интерпретацию расклада и смысл каждой карты' },
  ];
  return (
    <div style={{ padding:'0 20px', marginTop:30 }}>
      <div style={{ textAlign:'center', fontFamily:'Marcellus, serif', fontSize:24, color:'var(--text)', marginBottom:18 }}>Как это работает</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {steps.map(s => (
          <div key={s.n} style={{ position:'relative', padding:'20px 18px', borderRadius:18,
            background:'var(--panel)', border:'1px solid var(--gold-line)', textAlign:'center', overflow:'hidden' }}>
            <span style={{ position:'absolute', top:8, left:16, fontFamily:'Marcellus, serif', fontSize:42,
              color:'var(--gold)', opacity:.16, lineHeight:1 }}>{s.n}</span>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:11 }}>
              <span style={{ display:'grid', placeItems:'center', width:48, height:48, borderRadius:13,
                background:'linear-gradient(135deg, var(--gold), var(--gold-deep))', color:'var(--on-gold)',
                boxShadow:'0 6px 16px var(--glow-soft)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">{icons[s.icon]}</svg>
              </span>
            </div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:19, color:'var(--text)' }}>{s.title}</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15, color:'var(--muted)',
              lineHeight:1.4, marginTop:6, maxWidth:300, marginInline:'auto' }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialLinks() {
  const ig = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>;
  const tg = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M21 4L3 11l5 2 2 6 3-4 5 3z"/><path d="M8 13l9-6"/></svg>;
  const Item = ({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:'flex', alignItems:'center', gap:11,
      padding:'13px 15px', borderRadius:15, textDecoration:'none', cursor:'pointer',
      background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <span style={{ display:'grid', placeItems:'center', width:38, height:38, borderRadius:11, flexShrink:0,
        color:'var(--gold)', background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>{icon}</span>
      <span>
        <span style={{ display:'block', fontFamily:'Marcellus, serif', fontSize:15, color:'var(--text)', lineHeight:1.1 }}>{label}</span>
        <span style={{ display:'block', fontSize:11, color:'var(--muted)', marginTop:2 }}>{sub}</span>
      </span>
    </a>
  );
  return (
    <div style={{ padding:'0 20px', marginTop:28 }}>
      <Ornament style={{ marginBottom:16 }} />
      <div style={{ textAlign:'center', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:13 }}>Мы в соцсетях</div>
      <div style={{ display:'flex', gap:12 }}>
        <Item icon={ig} label="Instagram" sub="@taro.lux" href="https://instagram.com/taro.lux" />
        <Item icon={tg} label="Telegram" sub="@tarolux_bot" href="https://t.me/tarolux_bot" />
      </div>
    </div>
  );
}

interface HomeScreenProps {
  balance: number;
  freeAvailable: boolean;
  dayCard: Card;
  dayRevealed: boolean;
  onRevealDay: () => void;
  onStart: (id: SpreadId) => void;
  onBalance: () => void;
}

export function HomeScreen({ balance, freeAvailable, dayCard, dayRevealed, onRevealDay, onStart, onBalance }: HomeScreenProps) {
  const simple = [SPREADS.yesno, SPREADS.question, SPREADS.love, SPREADS.situation, SPREADS.match, SPREADS.money];
  const big = [SPREADS.celtic, SPREADS.year, SPREADS.natal];
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'0 0 100px' }}>
      <TopBar balance={balance} onBalance={onBalance} />

      {/* Карта дня */}
      <div style={{ padding:'4px 20px 8px' }}>
        <div style={{ position:'relative', borderRadius:22, padding:'20px 20px',
          background:'var(--panel)', border:'1px solid var(--gold-line)', overflow:'hidden',
          display:'flex', gap:18, alignItems:'center' }}>
          <div className="sheen-band" style={{ opacity:.5 }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(80% 120% at 100% 0%, var(--glow) 0%, transparent 60%)', opacity:.5 }} />
          <div style={{ position:'relative' }} onClick={!dayRevealed ? onRevealDay : undefined}>
            <FlipCard card={dayCard} w={84} flipped={dayRevealed} />
          </div>
          <div style={{ position:'relative', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:10.5, letterSpacing:3, textTransform:'uppercase', color:'var(--gold)' }}>Карта дня</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:.5, color:'#7fe0b4', padding:'2px 6px',
                borderRadius:6, background:'rgba(95,208,160,.15)', border:'1px solid rgba(95,208,160,.4)' }}>FREE</span>
            </div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', margin:'5px 0 6px' }}>
              {dayRevealed ? dayCard.name : 'Тайна сегодня'}</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15, color:'var(--muted)', lineHeight:1.35 }}>
              {dayRevealed ? dayCard.key : 'Коснитесь карты, чтобы узнать энергию дня'}</div>
          </div>
        </div>
      </div>

      <Ornament style={{ margin:'18px 0 14px' }} />

      <div style={{ padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)', letterSpacing:.5 }}>Расклады Таро</div>
          {freeAvailable && <span style={{ fontSize:11, color:'#7fe0b4' }}>1 бесплатный сегодня</span>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {simple.map((t, i) => <FreeBanner key={t.id} t={t} i={i} onStart={onStart} freeAvailable={freeAvailable} />)}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, margin:'24px 0 14px', color:'var(--gold)' }}>
        <Crown s={13} />
        <span style={{ fontSize:11, letterSpacing:3, textTransform:'uppercase' }}>Большие расклады</span>
        <Crown s={13} />
      </div>
      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {big.map((t, i) => <PremiumBanner key={t.id} t={t} i={i} onStart={onStart} freeAvailable={freeAvailable} />)}
      </div>

      <HowItWorks />
      <SocialLinks />
    </div>
  );
}
