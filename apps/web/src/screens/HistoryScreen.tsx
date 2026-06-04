import React from 'react';
import { Glyph } from '../components/cards/Glyph';
import { CardBack } from '../components/cards/CardBack';
import { SPREADS } from '@taro/shared';

export interface HistoryEntry {
  id: string | number;
  spread: string;      // spread id
  q: string;           // question
  date: string;        // pre-formatted date
  cards: number[];     // array of card n-indices
}

interface HistoryScreenProps {
  history: HistoryEntry[];
  onOpen: (h: HistoryEntry) => void;
  onStart: (id: string) => void;
}

export function HistoryScreen({ history, onOpen, onStart: _onStart }: HistoryScreenProps) {
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'4px 0 96px' }}>
      <div style={{ padding:'8px 20px 6px' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)' }}>История</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Ваши прошлые гадания</div>
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 30px' }}>
          <div style={{ color:'var(--gold)', opacity:.5, marginBottom:14 }}><Glyph k="hermit" size={48} /></div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18 }}>
            Пока тишина. Задайте первый вопрос картам.</div>
        </div>
      ) : (
        <div style={{ padding:'8px 20px', display:'flex', flexDirection:'column', gap:11 }}>
          {history.map(h => {
            const sp = SPREADS[h.spread];
            return (
              <button key={h.id} onClick={() => onOpen(h)}
                style={{ display:'flex', gap:14, alignItems:'center', padding:'13px 14px',
                  borderRadius:16, cursor:'pointer', textAlign:'left',
                  background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
                <div style={{ display:'flex' }}>
                  {h.cards.slice(0, 3).map((_, k) => (
                    <div key={k} style={{ marginLeft: k ? -18 : 0, zIndex: 3 - k }}>
                      <CardBack w={34} />
                    </div>
                  ))}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.q}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
                    {sp?.title} · {h.date}</div>
                </div>
                <span style={{ color:'var(--gold)', opacity:.6 }}>
                  <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1.5 1l6 6.5-6 6.5"/>
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
