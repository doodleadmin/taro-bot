import React, { useState, useRef, useContext } from 'react';
import { FlipCard } from '../components/cards/FlipCard';
import { CardFace } from '../components/cards/CardFace';
import { GoldButton } from '../components/ui/GoldButton';
import { Ornament } from '../components/ui/Ornament';
import { DeckContext } from '../context/DeckContext';
import { LAYOUTS } from '@taro/shared';
import { cardTitle } from '@taro/shared';
import type { Spread, AiInterpretation, Card } from '@taro/shared';

const POSITION_HINTS: Record<string, string> = {
  'Прошлое':'Корни уходят в прошлое:', 'Настоящее':'Прямо сейчас:', 'Будущее':'Впереди вас ждёт:',
  'Сегодня':'Энергия дня:', 'Ответ':'Карты отвечают:',
  'Ситуация':'Суть момента:', 'Вызов':'Главное препятствие:', 'Основа':'В глубине лежит:',
  'Цель':'Вы стремитесь к:', 'Вы':'Ваша роль:', 'Партнёр':'Со стороны партнёра:',
  'Окружение':'Влияние окружения:', 'Надежды и страхи':'В сердце живёт:', 'Итог':'Вероятный исход:',
  'Что вас связывает':'Связь между вами:', 'Препятствие':'Что мешает:', 'Перспектива':'Куда идёт:',
  'Суть':'Суть ситуации:', 'Причина':'Истинная причина:', 'Скрытое':'Скрытый фактор:',
  'Совет':'Совет карт:', 'Исход':'Вероятный исход:', 'Влечение':'Что притягивает:',
  'Будущее союза':'Будущее союза:', 'Скрытый ресурс':'Скрытый ресурс:', 'Сейчас':'Прямо сейчас:',
};

interface DrawItem { card: Card; reversed: boolean }

// ── Полноэкранный просмотр карты ──
const zoomArrow: React.CSSProperties = {
  width:40, height:40, borderRadius:20, display:'grid', placeItems:'center', flexShrink:0,
  cursor:'pointer', color:'var(--gold)', background:'rgba(12,10,24,.6)', border:'1px solid var(--gold-line)',
};

function CardZoom({ draw, index, spread, onClose, onNav }: {
  draw: DrawItem[]; index: number; spread: Spread;
  onClose: () => void; onNav: (n: number) => void;
}) {
  const d = draw[index];
  const total = draw.length;
  const deckId = useContext(DeckContext);
  const go = (dir: number) => onNav((index + dir + total) % total);

  return (
    <div onClick={onClose}
      style={{ position:'absolute', inset:0, zIndex:200, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px',
        background:'rgba(6,5,14,.82)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        animation:'screenIn .3s ease both' }}>
      <button onClick={onClose}
        style={{ position:'absolute', top:16, right:16, width:42, height:42, borderRadius:21,
          display:'grid', placeItems:'center', cursor:'pointer', color:'var(--gold)',
          background:'rgba(12,10,24,.6)', border:'1px solid var(--gold-line)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>

      <div style={{ fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--gold)', marginBottom:14 }}>
        {spread.positions[index] || `Карта ${index+1}`}</div>

      <div onClick={e => e.stopPropagation()} style={{ position:'relative', display:'flex', alignItems:'center', gap:14 }}>
        {total > 1 && (
          <button onClick={() => go(-1)} style={zoomArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
        <div className="float" style={{ filter:'drop-shadow(0 18px 40px rgba(0,0,0,.6))' }}>
          <CardFace card={d.card} reversed={d.reversed} w={232} />
        </div>
        {total > 1 && (
          <button onClick={() => go(1)} style={zoomArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform:'scaleX(-1)' }}>
              <path d="M15 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
      </div>

      <div className="noscroll" style={{ textAlign:'center', marginTop:16, maxWidth:330, maxHeight:200, overflowY:'auto', padding:'0 4px' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:23, color:'var(--text)' }}>
          {cardTitle(d.card)}
          {d.reversed && <span style={{ fontSize:14, color:'var(--muted)' }}> · перевёрнута</span>}
        </div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:17, color:'var(--gold)', marginTop:6, fontStyle:'italic' }}>
          {d.card.key}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--text)', marginTop:10, lineHeight:1.45 }}>
          {d.reversed ? d.card.rev : d.card.up}</div>
      </div>
      {total > 1 && (
        <div style={{ marginTop:16, fontSize:12, letterSpacing:1, color:'var(--muted)' }}>{index+1} / {total}</div>
      )}
    </div>
  );
}

// ── Доска раскладки ──
function ReadingBoard({ spread, draw, revealed, active, setActive, listRef }: {
  spread: Spread; draw: DrawItem[]; revealed: number; active: number;
  setActive: (i: number) => void; listRef: React.RefObject<HTMLDivElement>;
}) {
  const lay = LAYOUTS[spread.count] || LAYOUTS[1];
  const square = spread.count >= 10;
  const cw = spread.count === 1 ? 150 : spread.count === 3 ? 92 : spread.count === 5 ? 84 : spread.count === 12 ? 50 : 46;
  const boxH = square ? (spread.count >= 12 ? 320 : 300) : (spread.count === 5 ? 300 : 230);
  const boxW = square ? 320 : undefined;
  return (
    <div style={{ position:'relative', margin:'14px auto 0', height:boxH,
      width: boxW ?? '100%', maxWidth: boxW ?? 360 }}>
      {draw.map((d, i) => {
        const p = lay[i] || { x:50, y:50 };
        const show = i < revealed;
        return (
          <div key={i}
            onClick={() => {
              setActive(i);
              const el = listRef.current?.children[i] as HTMLElement | undefined;
              const sc = listRef.current?.closest('.noscroll') as HTMLElement | undefined;
              if (el && sc) sc.scrollTo({ top: el.offsetTop - 80, behavior:'smooth' });
            }}
            style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
              transform:`translate(-50%,-50%) rotate(${(p as {rot?:number}).rot||0}deg)`,
              zIndex: i === active ? 50 : ((p as {rot?:number}).rot ? 6 : 5 - Math.round(Math.abs(p.y-50)/20)),
              transition:'transform .4s', borderRadius:7,
              outline: i === active ? '2px solid var(--gold)' : 'none', outlineOffset:3,
              boxShadow: i === active ? '0 0 18px var(--glow-soft)' : 'none' }}>
            <FlipCard card={d.card} w={cw} flipped={show} reversed={d.reversed} delay={i*40} />
          </div>
        );
      })}
    </div>
  );
}

interface ReadingScreenProps {
  spread: Spread;
  question: string;
  draw: DrawItem[];
  extra?: unknown;
  interpretation?: AiInterpretation;
  onBack: () => void;
  onNew: () => void;
}

export function ReadingScreen({ spread, question, draw, interpretation, onBack, onNew }: ReadingScreenProps) {
  const [revealed, setRevealed] = useState(0);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (revealed >= draw.length) return;
    const t = setTimeout(() => setRevealed(v => v + 1), revealed === 0 ? 500 : 420);
    return () => clearTimeout(t);
  }, [revealed, draw.length]);

  const done = revealed >= draw.length;
  const verdict = spread.verdict ? (draw[0] && !draw[0].reversed ? 'ДА' : 'НЕТ') : null;

  const aiLoading = done && !interpretation;
  const aiCards = interpretation?.cards ?? [];
  const aiSummary = interpretation?.summary ?? '';

  const cardText = (d: DrawItem, i: number): React.ReactNode => {
    if (aiCards[i]) return aiCards[i];
    if (aiLoading) return <span className="ai-shimmer">Маг вглядывается в карту…</span>;
    const hint = POSITION_HINTS[spread.positions[i]] || '';
    return (
      <>
        {hint && <span style={{ color:'var(--gold)' }}>{hint} </span>}
        {d.reversed ? d.card.rev : d.card.up}
      </>
    );
  };

  return (
    <React.Fragment>
      <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 0 110px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 20px' }}>
          <button onClick={onBack} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
            color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
            <div style={{ fontSize:12.5, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              «{question}»</div>
          </div>
        </div>

        <ReadingBoard spread={spread} draw={draw} revealed={revealed}
          active={active} setActive={setActive} listRef={listRef} />

        {!done && (
          <div style={{ textAlign:'center', color:'var(--gold)', fontFamily:'Cormorant Garamond, serif',
            fontStyle:'italic', fontSize:16, marginTop:10 }}>Карты раскрываются…</div>
        )}

        {done && verdict && (
          <div className="screen-in" style={{ textAlign:'center', marginTop:6 }}>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:46, letterSpacing:4,
              color:'var(--gold)', filter:'drop-shadow(0 0 16px var(--glow-soft))' }}>{verdict}</div>
          </div>
        )}

        {done && (
          <div className="screen-in" style={{ padding:'4px 20px 0' }}>
            <Ornament style={{ margin:'18px 0' }} />

            {/* Интерпретации позиций */}
            <div ref={listRef} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {draw.map((d, i) => (
                <div key={i} onClick={() => setActive(i)}
                  style={{ display:'flex', gap:13, padding:'14px 15px', borderRadius:16,
                    background:'var(--panel)', cursor:'pointer', alignItems:'stretch',
                    border:`1px solid ${i === active ? 'var(--gold)' : 'var(--gold-line)'}`, transition:'border .2s' }}>
                  {/* миниатюра карты — тап увеличивает */}
                  <div onClick={e => { e.stopPropagation(); setActive(i); setZoom(i); }}
                    style={{ position:'relative', flexShrink:0, cursor:'zoom-in' }}>
                    <CardFace card={d.card} reversed={d.reversed} w={62} />
                    <span style={{ position:'absolute', bottom:5, right:5, width:18, height:18, borderRadius:9,
                      display:'grid', placeItems:'center', background:'rgba(12,10,24,.75)', border:'1px solid var(--gold-line)',
                      color:'var(--gold)', backdropFilter:'blur(4px)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M7 12h10M12 7v10"/>
                      </svg>
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)' }}>
                        {spread.positions[i] || `Карта ${i+1}`}</span>
                      {d.reversed && (
                        <span style={{ fontSize:10, color:'var(--muted)', border:'1px solid var(--gold-line)',
                          borderRadius:6, padding:'1px 6px' }}>перевёрнута</span>
                      )}
                    </div>
                    <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>
                      {cardTitle(d.card)}</div>
                    <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15.5, color:'var(--muted)',
                      lineHeight:1.4, marginTop:4 }}>
                      {cardText(d, i)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Слово мага */}
            <div style={{ marginTop:16, padding:'18px 18px', borderRadius:18, position:'relative', overflow:'hidden',
              background:'linear-gradient(160deg, var(--back-1), transparent)', border:'1px solid var(--gold-line)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <span style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)' }}>Слово мага</span>
                {aiLoading && (
                  <span style={{ width:5, height:5, borderRadius:3, background:'var(--gold)',
                    boxShadow:'0 0 6px var(--gold)', animation:'pulse 1s infinite' }} />
                )}
              </div>
              {aiLoading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <span className="ai-line" style={{ width:'92%' }} />
                  <span className="ai-line" style={{ width:'100%' }} />
                  <span className="ai-line" style={{ width:'78%' }} />
                </div>
              ) : (
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:17, color:'var(--text)',
                  lineHeight:1.55, fontStyle:'italic' }}>{aiSummary}</div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <GoldButton variant="ghost" style={{ flex:1 }} onClick={onBack}>В историю</GoldButton>
              <GoldButton style={{ flex:1 }} onClick={onNew}>Новое гадание</GoldButton>
            </div>
          </div>
        )}
      </div>

      {zoom != null && (
        <CardZoom draw={draw} index={zoom} spread={spread}
          onClose={() => setZoom(null)} onNav={n => setZoom(n)} />
      )}
    </React.Fragment>
  );
}
