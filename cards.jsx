// cards.jsx — Карты Таро: глифы, рубашка, лицо, переворот (flip)
// Глифы — простой эзотерический line-art. Цвет берётся из currentColor (var(--gold)).

const Glyph = ({ k, size = 64 }) => {
  const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
    strokeLinecap: 'round', strokeLinejoin: 'round' };
  const g = {
    fool:     <g {...P}><circle cx="32" cy="20" r="6"/><path d="M32 26v18l-9 12M32 44l9 12"/><path d="M20 40l-6-6M44 40l6-6"/><path d="M14 34l5 2M50 34l-5 2"/></g>,
    magician: <g {...P}><path d="M32 8v48"/><path d="M20 18h24M20 46h24"/><circle cx="32" cy="32" r="3"/><path d="M24 12l-4-4M40 12l4-4"/></g>,
    priestess:<g {...P}><path d="M20 14v36M44 14v36"/><path d="M20 14h24M20 50h24"/><circle cx="32" cy="32" r="7"/><path d="M32 25v14"/></g>,
    empress:  <g {...P}><circle cx="32" cy="24" r="8"/><path d="M32 32v18M22 42h20"/><path d="M24 18l-6-4M40 18l6-4"/><path d="M32 12V4"/></g>,
    emperor:  <g {...P}><path d="M16 50V22l16-12 16 12v28z"/><path d="M24 50V34h16v16"/><path d="M32 22v8"/></g>,
    hierophant:<g {...P}><path d="M32 8v48"/><path d="M22 20h20M22 30h20M22 40h20"/><path d="M24 56h16"/></g>,
    lovers:   <g {...P}><circle cx="22" cy="26" r="7"/><circle cx="42" cy="26" r="7"/><path d="M22 33v12M42 33v12M16 50h32"/></g>,
    chariot:  <g {...P}><rect x="18" y="22" width="28" height="18" rx="2"/><circle cx="24" cy="48" r="5"/><circle cx="40" cy="48" r="5"/><path d="M32 22v-8M24 14h16"/></g>,
    strength: <g {...P}><path d="M32 12c10 0 14 8 14 16s-6 18-14 18-14-10-14-18 4-16 14-16z"/><path d="M26 30c2 3 10 3 12 0"/><path d="M32 6v6"/></g>,
    hermit:   <g {...P}><path d="M24 14c-4 8-4 28 0 40h16c4-12 4-32 0-40z"/><circle cx="32" cy="22" r="3"/><path d="M32 36l-4 4 4 4 4-4z"/></g>,
    wheel:    <g {...P}><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="5"/><path d="M32 14v8M32 42v8M14 32h8M42 32h8M19 19l6 6M39 39l6 6M45 19l-6 6M25 39l-6 6"/></g>,
    justice:  <g {...P}><path d="M32 12v36M18 22h28"/><path d="M18 22l-5 12h10zM46 22l-5 12h10z"/><path d="M24 50h16"/></g>,
    hanged:   <g {...P}><path d="M16 12h24M28 12v10"/><circle cx="28" cy="28" r="6"/><path d="M28 34v10l-8 8M28 44l8 6"/></g>,
    death:    <g {...P}><path d="M20 50L44 14"/><path d="M44 14c-6-2-14 2-16 10"/><circle cx="22" cy="46" r="5"/></g>,
    temperance:<g {...P}><path d="M22 14l8 16-8 16M42 14l-8 16 8 16"/><path d="M24 30h16"/></g>,
    devil:    <g {...P}><path d="M22 16l4 8M42 16l-4 8"/><circle cx="32" cy="34" r="12"/><path d="M28 32l2 2M34 34l2-2M27 40c3 3 7 3 10 0"/></g>,
    tower:    <g {...P}><path d="M22 50V24l10-10 10 10v26z"/><path d="M28 24h8M28 34h8M28 44h8"/><path d="M32 14V6M36 10l6-4"/></g>,
    star:     <g {...P}><path d="M32 10l4 12 12 1-9 8 3 12-10-7-10 7 3-12-9-8 12-1z"/><circle cx="18" cy="48" r="1.5"/><circle cx="46" cy="46" r="1.5"/></g>,
    moon:     <g {...P}><path d="M38 12a20 20 0 100 40 16 16 0 010-40z"/><path d="M48 20l2 2M50 30h3M48 40l2-2"/></g>,
    sun:      <g {...P}><circle cx="32" cy="32" r="11"/><path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M46 18l-4 4M22 42l-4 4"/></g>,
    judgement:<g {...P}><path d="M16 40l16-26 16 26z"/><path d="M22 40v8h20v-8"/><path d="M32 14V6"/></g>,
    world:    <g {...P}><ellipse cx="32" cy="32" rx="13" ry="20"/><circle cx="32" cy="32" r="20"/><path d="M12 32h40"/></g>,
    wands:    <g {...P}><path d="M32 8v48"/><path d="M26 16c4 2 8 2 12 0M26 24c4 2 8 2 12 0"/><circle cx="32" cy="50" r="3"/></g>,
    cups:     <g {...P}><path d="M20 16h24l-3 16a9 9 0 01-18 0z"/><path d="M32 41v9M24 50h16"/></g>,
    swords:   <g {...P}><path d="M32 6v40M22 50l10-6 10 6"/><path d="M24 30h16"/></g>,
    pentacles:<g {...P}><circle cx="32" cy="32" r="18"/><path d="M32 16l5 15h16l-13 9 5 15-13-9-13 9 5-15-13-9h16z" transform="scale(.62) translate(20 20)"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      {g[k] || g.star}
    </svg>
  );
};

// Орнаментальные уголки рамки
const CornerFlourish = ({ pos }) => {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  const place = {
    tl: { top: 6, left: 6 }, tr: { top: 6, right: 6 },
    br: { bottom: 6, right: 6 }, bl: { bottom: 6, left: 6 },
  }[pos];
  return (
    <svg width="22" height="22" viewBox="0 0 22 22"
      style={{ position: 'absolute', ...place, transform: `rotate(${rot}deg)`, color: 'var(--gold)', opacity: .85 }}>
      <path d="M2 10 Q2 2 10 2" fill="none" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M5 13 Q5 5 13 5" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".6"/>
      <circle cx="2.5" cy="2.5" r="1.3" fill="currentColor"/>
    </svg>
  );
};

// Контекст выбранной колоды (id из window.DECKS)
const DeckContext = React.createContext('mansion');

// Лицо карты. Для image-колод — полноценная иллюстрация (со своей рамкой и названием).
function CardFace({ card, reversed = false, w = 132 }) {
  const h = Math.round(w * 1.62);
  const deckId = React.useContext(DeckContext);
  const deck = (window.DECKS || []).find(d => d.id === deckId);

  if (deck && deck.kind === 'image') {
    return (
      <div style={{
        width: w, height: h, borderRadius: w * 0.07, position: 'relative', flexShrink: 0,
        overflow: 'hidden', background: '#0c0c18',
        boxShadow: 'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
        transform: reversed ? 'rotate(180deg)' : 'none',
      }}>
        <img src={`${deck.path}/${card.n}.jpg`} alt={card.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div className="card-sheen" style={{ position: 'absolute', inset: 0 }} />
      </div>
    );
  }

  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.07, position: 'relative',
      background: 'var(--card-bg)',
      boxShadow: 'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
      transform: reversed ? 'rotate(180deg)' : 'none',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* фактура */}
      <div style={{ position: 'absolute', inset: 0, background:
        'radial-gradient(120% 80% at 50% 0%, var(--card-glow) 0%, transparent 55%)', opacity: .7 }} />
      {/* двойная рамка */}
      <div style={{ position: 'absolute', inset: w * 0.05, borderRadius: w * 0.04,
        border: '1px solid var(--gold-line)' }} />
      <div style={{ position: 'absolute', inset: w * 0.075, borderRadius: w * 0.03,
        border: '1px solid var(--gold-line)', opacity: .4 }} />
      <CornerFlourish pos="tl" /><CornerFlourish pos="tr" />
      <CornerFlourish pos="br" /><CornerFlourish pos="bl" />
      {/* содержимое */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between', padding: `${w*0.13}px ${w*0.08}px` }}>
        <div style={{ fontFamily: 'Marcellus, serif', fontSize: w*0.13, letterSpacing: 2,
          color: 'var(--gold)' }}>{card.rom}</div>
        <div style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 8px var(--glow-soft))' }}>
          <Glyph k={card.glyph} size={w * 0.52} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: w*0.3, height: 1, background: 'var(--gold-line)', margin: '0 auto 6px' }} />
          <div style={{ fontFamily: 'Marcellus, serif', fontSize: w*0.115, letterSpacing: 1,
            color: 'var(--text)', lineHeight: 1.1 }}>{card.name}</div>
        </div>
      </div>
    </div>
  );
}

// Рубашка карты
function CardBack({ w = 132, glow = false }) {
  const h = Math.round(w * 1.62);
  return (
    <div className={glow ? 'card-pulse' : ''} style={{
      width: w, height: h, borderRadius: w * 0.07, position: 'relative',
      background: 'linear-gradient(150deg, var(--back-2), var(--back-1))',
      boxShadow: 'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', inset: w*0.05, borderRadius: w*0.04,
        border: '1px solid var(--gold-line)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--gold)', opacity: .9 }}>
        <svg width={w*0.5} height={w*0.5} viewBox="0 0 64 64" style={{ filter: 'drop-shadow(0 0 6px var(--glow-soft))' }}>
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15"/>
            <path d="M32 6l5 14 14 1-11 9 4 14-12-9-12 9 4-14-11-9 14-1z"/>
            <circle cx="32" cy="32" r="3" fill="currentColor"/>
          </g>
        </svg>
      </div>
      {/* мерцающий блик */}
      <div className="card-sheen" style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}

// Переворачивающаяся карта
function FlipCard({ card, w = 132, flipped, reversed = false, onClick, delay = 0 }) {
  const h = Math.round(w * 1.62);
  return (
    <div onClick={onClick} style={{ width: w, height: h, perspective: 1000, cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d', transition: `transform .8s cubic-bezier(.4,.1,.2,1) ${delay}ms`,
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <CardBack w={w} glow={!flipped} />
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardFace card={card} reversed={reversed} w={w} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Glyph, CardFace, CardBack, FlipCard, DeckContext });

// Рамка-плейсхолдер карты с переливающимся бликом (для баннеров раскладов)
function CardFrame({ w = 130, accent = 'var(--gold)', sweepDelay = 0 }) {
  const h = Math.round(w * 1.4);
  return (
    <div style={{ position:'relative', width:w, height:h, borderRadius:14, overflow:'hidden', flexShrink:0,
      border:`1px solid ${accent}66`, background:`linear-gradient(150deg, ${accent}1f, rgba(0,0,0,.18))` }}>
      <div style={{ position:'absolute', inset:0,
        background:`radial-gradient(62% 48% at 50% 42%, ${accent}3a, transparent 72%)` }} />
      {/* диагональная фактура */}
      <div style={{ position:'absolute', inset:0, opacity:.5,
        background:`repeating-linear-gradient(125deg, transparent 0 9px, ${accent}12 9px 10px)` }} />
      <div className="sheen-band" style={{ animationDelay:`${sweepDelay}s` }} />
      {/* карта, выглядывающая снизу */}
      <div style={{ position:'absolute', left:'50%', bottom:-2, transform:'translateX(-50%) rotate(-7deg)',
        filter:'drop-shadow(0 4px 10px rgba(0,0,0,.5))' }}>
        <CardBack w={Math.round(w*0.3)} />
      </div>
    </div>
  );
}

Object.assign(window, { CardFrame });
