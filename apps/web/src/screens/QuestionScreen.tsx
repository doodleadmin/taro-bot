import React, { useState } from 'react';
import { Glyph } from '../components/cards/Glyph';
import { GoldButton } from '../components/ui/GoldButton';
import type { Spread } from '@taro/shared';

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
      color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

interface QuestionScreenProps {
  spread: Spread;
  paidWith: 'free' | 'paid' | null;
  onBack: () => void;
  onSubmit: (q: string) => void;
}

export function QuestionScreen({ spread, paidWith, onBack, onSubmit }: QuestionScreenProps) {
  const [q, setQ] = useState('');
  const examples = ['Что меня ждёт в любви?', 'Стоит ли менять работу?', 'Чего мне ждать на этой неделе?'];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 20px 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
      </div>
      <div className="float" style={{ alignSelf:'center', color:'var(--gold)', margin:'6px 0 18px',
        filter:'drop-shadow(0 0 14px var(--glow-soft))' }}>
        <Glyph k="priestess" size={56} />
      </div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)', textAlign:'center',
        lineHeight:1.25, marginBottom:8 }}>Сформулируйте<br/>свой вопрос</div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--muted)',
        textAlign:'center', marginBottom:22, lineHeight:1.4 }}>
        Сосредоточьтесь на одном. Чем яснее вопрос — тем точнее ответ карт.</div>
      <textarea value={q} onChange={e => setQ(e.target.value)} rows={3}
        placeholder="Введите вопрос к картам..."
        style={{ width:'100%', resize:'none', background:'var(--panel)', border:'1px solid var(--gold-line)',
          borderRadius:16, padding:'16px 18px', color:'var(--text)', fontSize:16, outline:'none', lineHeight:1.4 }} />
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:14 }}>
        {examples.map(ex => (
          <button key={ex} onClick={() => setQ(ex)} style={{ fontSize:12.5, color:'var(--muted)',
            background:'transparent', border:'1px solid var(--gold-line)', borderRadius:20,
            padding:'7px 12px', cursor:'pointer' }}>{ex}</button>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <div style={{ textAlign:'center', marginBottom:11, fontSize:12.5, color:'var(--muted)' }}>
        {paidWith === 'free'
          ? <span style={{ color:'#7fe0b4' }}>✦ Бесплатный расклад дня активирован</span>
          : spread.price > 0
            ? <span>Списано <span style={{ color:'var(--gold)' }}>{spread.price} ₽</span> с баланса</span>
            : null}
      </div>
      <GoldButton full onClick={() => onSubmit(q.trim() || 'Что мне важно знать сейчас?')}>
        Перейти к колоде
      </GoldButton>
    </div>
  );
}
