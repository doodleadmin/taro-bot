import React, { useState, useEffect } from 'react';
import { Glyph } from '../components/cards/Glyph';

interface ThinkingScreenProps { question: string }

export function ThinkingScreen({ question: _question }: ThinkingScreenProps) {
  const lines = ['Тасую энергии вопроса…', 'Слушаю шёпот арканов…', 'Складываю узор судьбы…'];
  const [li, setLi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLi(v => (v + 1) % lines.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 32px' }}>
      <div style={{ position:'relative', width:170, height:170, display:'grid', placeItems:'center' }}>
        <svg className="spin-slow" width="170" height="170" viewBox="0 0 170 170"
          style={{ position:'absolute', color:'var(--gold-line)' }}>
          <circle cx="85" cy="85" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 9"/>
        </svg>
        <svg className="spin-rev" width="134" height="134" viewBox="0 0 134 134"
          style={{ position:'absolute', color:'var(--gold-line)' }}>
          <circle cx="67" cy="67" r="62" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 14"/>
        </svg>
        <div className="float" style={{ color:'var(--gold)', filter:'drop-shadow(0 0 18px var(--glow-soft))' }}>
          <Glyph k="moon" size={56} />
        </div>
      </div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', marginTop:34 }}>
        Маг формирует предсказание</div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:17, color:'var(--gold)',
        marginTop:8, minHeight:24, transition:'.3s' }}>{lines[li]}</div>
      <div style={{ display:'flex', gap:7, marginTop:22 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:9, background:'var(--gold)',
            animation:`dotPulse 1.2s ${i*0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}
