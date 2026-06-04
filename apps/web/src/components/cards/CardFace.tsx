import React, { useContext } from 'react';
import { Glyph } from './Glyph.tsx';
import { DeckContext } from '../../context/DeckContext.ts';
import { DECKS } from '@taro/shared';
import type { Card } from '@taro/shared';

const CornerFlourish = ({ pos }: { pos: 'tl'|'tr'|'br'|'bl' }) => {
  const rot = { tl:0, tr:90, br:180, bl:270 }[pos];
  const place: React.CSSProperties = {
    tl: { top:6, left:6 }, tr: { top:6, right:6 },
    br: { bottom:6, right:6 }, bl: { bottom:6, left:6 },
  }[pos];
  return (
    <svg width="22" height="22" viewBox="0 0 22 22"
      style={{ position:'absolute', ...place, transform:`rotate(${rot}deg)`, color:'var(--gold)', opacity:.85 }}>
      <path d="M2 10 Q2 2 10 2" fill="none" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M5 13 Q5 5 13 5" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".6"/>
      <circle cx="2.5" cy="2.5" r="1.3" fill="currentColor"/>
    </svg>
  );
};

interface CardFaceProps {
  card: Card;
  reversed?: boolean;
  w?: number;
}

export function CardFace({ card, reversed = false, w = 132 }: CardFaceProps) {
  const h = Math.round(w * 1.62);
  const deckId = useContext(DeckContext);
  const deck = DECKS.find(d => d.id === deckId);
  const cdnBase = import.meta.env.VITE_CDN_BASE_URL ?? '';

  if (deck?.kind === 'image' && deck.path) {
    return (
      <div style={{
        width:w, height:h, borderRadius:w*0.07, position:'relative', flexShrink:0,
        overflow:'hidden', background:'#0c0c18',
        boxShadow:'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
        transform: reversed ? 'rotate(180deg)' : 'none',
      }}>
        <img
          src={`${cdnBase}/${deck.path}/${card.n}.jpg`}
          alt={card.name}
          loading="lazy"
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
        <div className="card-sheen" style={{ position:'absolute', inset:0 }} />
      </div>
    );
  }

  return (
    <div style={{
      width:w, height:h, borderRadius:w*0.07, position:'relative',
      background:'var(--card-bg)',
      boxShadow:'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
      transform: reversed ? 'rotate(180deg)' : 'none',
      overflow:'hidden', flexShrink:0,
    }}>
      <div style={{ position:'absolute', inset:0, background:
        'radial-gradient(120% 80% at 50% 0%, var(--card-glow) 0%, transparent 55%)', opacity:.7 }} />
      <div style={{ position:'absolute', inset:w*0.05, borderRadius:w*0.04, border:'1px solid var(--gold-line)' }} />
      <div style={{ position:'absolute', inset:w*0.075, borderRadius:w*0.03, border:'1px solid var(--gold-line)', opacity:.4 }} />
      <CornerFlourish pos="tl"/><CornerFlourish pos="tr"/>
      <CornerFlourish pos="br"/><CornerFlourish pos="bl"/>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'space-between', padding:`${w*0.13}px ${w*0.08}px` }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:w*0.13, letterSpacing:2, color:'var(--gold)' }}>{card.rom}</div>
        <div style={{ color:'var(--gold)', filter:'drop-shadow(0 0 8px var(--glow-soft))' }}>
          <Glyph k={card.glyph} size={w*0.52} />
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:w*0.3, height:1, background:'var(--gold-line)', margin:'0 auto 6px' }} />
          <div style={{ fontFamily:'Marcellus, serif', fontSize:w*0.115, letterSpacing:1,
            color:'var(--text)', lineHeight:1.1 }}>{card.name}</div>
        </div>
      </div>
    </div>
  );
}
