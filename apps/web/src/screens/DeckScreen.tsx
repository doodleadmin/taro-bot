import React, { useState, useRef, useEffect } from 'react';
import { CardBack } from '../components/cards/CardBack';
import { LAYOUTS } from '@taro/shared';
import type { Spread } from '@taro/shared';
import { Glyph } from '../components/cards/Glyph';

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
      color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

function SlotPreview({ spread, filled }: { spread: Spread; filled: number }) {
  const lay = LAYOUTS[spread.count] || LAYOUTS[1];
  const square = spread.count >= 10;
  const cw = spread.count <= 3 ? 40 : spread.count <= 5 ? 32 : 24;
  const ch = Math.round(cw * 1.5);
  const box: React.CSSProperties = square
    ? { width: spread.count >= 12 ? 186 : 170, height: spread.count >= 12 ? 186 : 170, margin:'10px auto 0', position:'relative' }
    : { height: spread.count === 5 ? 148 : 92, margin:'12px 18px 0', position:'relative' };
  return (
    <div style={box}>
      {lay.map((p, i) => (
        <div key={i} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          width:cw, height:ch, transform:`translate(-50%,-50%) rotate(${(p as {rot?: number}).rot||0}deg)`,
          borderRadius:6,
          border:`1px dashed ${i < filled ? 'var(--gold)' : 'var(--gold-line)'}`,
          background: i < filled ? 'var(--back-1)' : 'rgba(255,255,255,.02)',
          boxShadow: i < filled ? '0 0 12px var(--glow-soft)' : 'none',
          display:'grid', placeItems:'center', transition:'all .35s cubic-bezier(.3,.7,.2,1)' }}>
          {i < filled && (
            <div className="screen-in" style={{ color:'var(--gold)' }}>
              <Glyph k="star" size={cw * 0.5} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ArcArrow({ dir, onClick, disabled }: { dir: 'left'|'right'; onClick: () => void; disabled: boolean }) {
  const left = dir === 'left';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ position:'absolute', top:'56%',
        ...(left ? { left:8 } : { right:8 }),
        transform:'translateY(-50%)', width:46, height:46, borderRadius:25,
        display:'grid', placeItems:'center', cursor: disabled ? 'default' : 'pointer', zIndex:500,
        background:'rgba(12,10,24,.6)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        border:'1px solid var(--gold)', color:'var(--gold)', opacity: disabled ? .3 : 1,
        boxShadow:'0 6px 18px rgba(0,0,0,.4)', transition:'opacity .2s' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: left ? 'none' : 'scaleX(-1)' }}>
        <path d="M15 5l-7 7 7 7"/>
      </svg>
    </button>
  );
}

interface DeckScreenProps {
  spread: Spread | null;
  onBack: () => void;
  onComplete: () => void;
}

function shuffle<T>(a: T[]): T[] {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DeckScreen({ spread, onBack, onComplete }: DeckScreenProps) {
  const need = spread?.count ?? 1;
  const DECK_N = 30;
  const SP = 50;
  const W = 96, H = Math.round(W * 1.5);
  const center = (DECK_N - 1) / 2;

  const [order, setOrder] = useState(() => shuffle([...Array(DECK_N).keys()]));
  const [picked, setPicked] = useState(0);
  const [scroll, setScroll] = useState(center);
  const [flying, setFlying] = useState<number[]>([]);
  const [shuf, setShuf] = useState<null | 'gather' | 'burst' | 'fate'>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const drag = useRef({ active:false, x:0, y:0, s:0, moved:false, vert:false, cardId:null as number|null });
  const busy = shuf != null;
  const done = picked >= need;
  const maxScroll = Math.max(0, order.length - 1);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => onComplete(), 760);
      return () => clearTimeout(t);
    }
  }, [done]);

  const flyPick = (id: number) => {
    setSelected(null);
    setFlying(f => [...f, id]);
    setTimeout(() => {
      setOrder(o => o.filter(x => x !== id));
      setPicked(p => p + 1);
      setFlying(f => f.filter(x => x !== id));
    }, 560);
  };

  const pick = (id: number) => {
    if (busy || flying.length || picked >= need) return;
    flyPick(id);
  };

  const centerOn = (id: number) => {
    const i = order.indexOf(id);
    if (i >= 0) setScroll(i);
  };

  const page = (dir: number) => {
    if (busy) return;
    setSelected(null);
    setScroll(s => Math.max(0, Math.min(maxScroll, Math.round(s) + dir * 4)));
  };

  const onDown = (e: React.PointerEvent) => {
    if (busy) return;
    const cardEl = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('[data-cardid]');
    drag.current = {
      active: true, x: e.clientX, y: e.clientY, s: scroll,
      moved: false, vert: false,
      cardId: cardEl ? Number((cardEl as HTMLElement).dataset.cardid) : null,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && !d.vert) {
      if (dy < -14 && Math.abs(dy) > Math.abs(dx) && d.cardId === selected && selected != null) d.vert = true;
      else if (Math.abs(dx) > 5) d.moved = true;
    }
    if (d.vert) return;
    if (d.moved) setScroll(Math.max(0, Math.min(maxScroll, d.s - dx / SP)));
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.vert) {
      const dy = e.clientY - d.y;
      if (dy < -40 && d.cardId != null && !flying.length && picked < need) {
        d.moved = true;
        pick(d.cardId);
        return;
      }
    }
    if (d.moved) setSelected(null);
    setScroll(s => Math.max(0, Math.min(maxScroll, Math.round(s))));
  };

  const tapCard = (id: number) => {
    if (drag.current.moved || drag.current.vert) return;
    if (busy || flying.length || picked >= need) return;
    if (selected === id) { flyPick(id); }
    else { setSelected(id); centerOn(id); }
  };

  const trustFate = () => {
    if (busy || flying.length || done) return;
    setSelected(null);
    setShuf('fate');
    setTimeout(() => {
      setShuf(null);
      const remain = need - picked;
      let avail = order.slice();
      let k = 0;
      const step = () => {
        if (k >= remain) return;
        const id = avail[(Math.random() * avail.length) | 0];
        avail = avail.filter(x => x !== id);
        flyPick(id);
        k++;
        setTimeout(step, 600);
      };
      step();
    }, 720);
  };

  const doShuffle = () => {
    if (busy || flying.length || done) return;
    setSelected(null);
    setShuf('gather');
    setTimeout(() => setShuf('burst'), 300);
    setTimeout(() => { setOrder(o => shuffle(o)); setScroll(center); }, 820);
    setTimeout(() => setShuf(null), 870);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 0 0', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 20px' }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread?.title}</div>
      </div>

      <div style={{ textAlign:'center', marginTop:10 }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)' }}>
          {done ? 'Карты выбраны' : 'Ваш выбор'}</div>
        <div style={{ fontSize:12, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)', marginTop:5 }}>
          {picked} из {need} {need===1?'карты':'карт'}</div>
      </div>

      {spread && <SlotPreview spread={spread} filled={picked} />}

      {/* Карусель-дуга */}
      <div style={{ flex:1, position:'relative', minHeight:230 }}>
        {/* золотое свечение trustFate */}
        {shuf === 'fate' && (
          <div style={{ position:'absolute', left:'50%', top:'56%', width:340, height:340, marginLeft:-170, marginTop:-170,
            borderRadius:'50%', pointerEvents:'none', zIndex:500, animation:'fateGlow .72s ease-out both',
            background:'radial-gradient(circle, rgba(220,184,106,.42) 0%, rgba(220,184,106,.16) 38%, transparent 68%)' }} />
        )}
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position:'absolute', inset:0, touchAction:'none', cursor: drag.current.active ? 'grabbing' : 'grab' }}>
          <div style={{ position:'absolute', left:'50%', top:'56%', width:0, height:0 }}>
            {order.map((id, i) => {
              const pos = i - scroll;
              const flyingThis = flying.includes(id);
              if (Math.abs(pos) > 5.6 && !busy && !flyingThis) return null;
              let tf: string, op = 1, z: number, glow = false;

              if (flyingThis) {
                tf = 'translate(0px,-430px) rotate(720deg) scale(.42)'; op = 0; z = 600; glow = true;
              } else if (shuf === 'gather') {
                const r = ((id * 37) % 17) - 8;
                tf = `translate(0px,0px) rotate(${r}deg) scale(.9)`; z = 300 - i;
              } else if (shuf === 'fate') {
                const r = (i - center) * 0.9;
                tf = `translate(${(i - center) * 1.4}px, -6px) rotate(${r}deg) scale(1.02)`;
                z = 300 - Math.abs(i - center); glow = true;
              } else if (shuf === 'burst') {
                const ang = (i / order.length) * Math.PI * 2;
                const Rx = 132, Ry = 92;
                tf = `translate(${Math.cos(ang)*Rx}px, ${Math.sin(ang)*Ry}px) rotate(${ang*57+90}deg) scale(1)`;
                z = 300 - i;
              } else {
                const focus = Math.abs(pos) < 0.5;
                const isSel = id === selected;
                const x = pos * SP;
                let y = Math.pow(Math.abs(pos), 1.45) * 6 - (focus ? 16 : 0);
                const rot = isSel ? 0 : pos * 3.2;
                let sc = focus ? 1.07 : 1;
                if (isSel) { y -= 40; sc = 1.2; }
                tf = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`;
                z = isSel ? 500 : focus ? 400 : 300 - Math.round(Math.abs(pos) * 10);
                glow = focus || isSel;
                if (Math.abs(pos) > 5) op = 0;
              }

              const isSelected = id === selected && !flyingThis && !busy;
              return (
                <div key={id} data-cardid={String(id)} onClick={() => tapCard(id)}
                  style={{ position:'absolute', left:0, top:0, width:W, height:H,
                    marginLeft: -W/2, marginTop: -H/2, transformOrigin:'50% 60%',
                    transform:tf, opacity:op, zIndex:z,
                    cursor: busy ? 'default' : 'pointer',
                    transition:`transform ${flyingThis ? '.56s' : '.5s'} cubic-bezier(.34,.8,.3,1), opacity .4s`,
                    filter: glow ? `brightness(1.18)${isSelected ? ' drop-shadow(0 0 16px var(--gold))' : ''}` : 'none' }}>
                  <CardBack w={W} glow={glow} />
                  {isSelected && (
                    <div style={{ position:'absolute', top:-26, left:'50%', transform:'translateX(-50%)',
                      whiteSpace:'nowrap', fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'var(--on-gold)',
                      background:'var(--gold)', padding:'3px 8px', borderRadius:7, fontWeight:600,
                      boxShadow:'0 4px 12px rgba(0,0,0,.4)' }}>Вытянуть ↑</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!done && (
          <>
            <ArcArrow dir="left"  disabled={busy || scroll <= 0.5}           onClick={() => page(-1)} />
            <ArcArrow dir="right" disabled={busy || scroll >= maxScroll-0.5} onClick={() => page(1)} />
          </>
        )}
      </div>

      {/* Нижняя панель */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:13, padding:'0 20px 18px' }}>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:15,
          color: selected != null ? 'var(--gold)' : 'var(--muted)', minHeight:20 }}>
          {done ? 'Карты легли — узор готов' : busy ? 'Тасую колоду…'
            : selected != null ? 'Коснитесь ещё раз или потяните карту вверх'
            : 'Свайп или стрелки · коснитесь карты, чтобы выбрать'}
        </div>
        <div style={{ display:'flex', gap:11 }}>
          <button onClick={doShuffle} disabled={done || busy} title="Перетасовать"
            style={{ display:'grid', placeItems:'center', width:50, height:50, borderRadius:14,
              cursor: (done || busy) ? 'default' : 'pointer', opacity: (done || busy) ? .4 : 1, flexShrink:0,
              background:'var(--panel)', border:'1px solid var(--gold-line)', color:'var(--gold)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transition:'transform .8s cubic-bezier(.4,.1,.2,1)', transform: busy ? 'rotate(360deg)' : 'none' }}>
              <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M21 16v5h-5M14 14l7 7M3 8V3h5M10 10L3 3"/>
            </svg>
          </button>
          <button onClick={trustFate} disabled={done || busy || flying.length > 0}
            style={{ display:'flex', alignItems:'center', gap:9, padding:'0 24px', height:50, borderRadius:14,
              cursor: (done || busy) ? 'default' : 'pointer', opacity: (done || busy) ? .5 : 1,
              background:'var(--panel)', border:'1px solid var(--gold)', color:'var(--gold)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="3" width="18" height="18" rx="4"/>
              <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
              <circle cx="16" cy="16" r="1.3" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
            </svg>
            <span style={{ fontSize:14, fontWeight:500, letterSpacing:1, textTransform:'uppercase' }}>Довериться случаю</span>
          </button>
        </div>
      </div>
    </div>
  );
}
