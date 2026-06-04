import React, { useState } from 'react';
import { Glyph } from '../components/cards/Glyph';
import { GoldButton } from '../components/ui/GoldButton';
import type { Spread, PairExtra } from '@taro/shared';

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
      color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

interface PersonVal { name: string; date: string; city: string }

// Top-level component — важно для фокуса (не инлайн!)
function PairInput({ label, value, onChange, type = 'text', ph = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; ph?: string;
}) {
  return (
    <div>
      <div style={{ fontSize:10.5, color:'var(--muted)', letterSpacing:.5, marginBottom:5 }}>{label}</div>
      <input type={type} value={value} placeholder={ph} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', boxSizing:'border-box', background:'var(--back-1)', border:'1px solid var(--gold-line)',
          borderRadius:11, padding:'11px 13px', color:'var(--text)', fontSize:14.5, outline:'none' }} />
    </div>
  );
}

// Top-level component — важно для фокуса (не инлайн!)
function PartnerBlock({ label, val, setVal, accent }: {
  label: string; val: PersonVal; setVal: (v: PersonVal) => void; accent: string;
}) {
  return (
    <div style={{ padding:'15px 16px', borderRadius:18, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ width:26, height:26, borderRadius:13, display:'grid', placeItems:'center', flexShrink:0,
          background:accent, color:'#1a1408', fontSize:13, fontWeight:700 }}>{label[0]}</span>
        <span style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)' }}>{label}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <PairInput label="Имя" ph="Как зовут" value={val.name} onChange={v => setVal({...val, name:v})} />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <PairInput label="Дата рождения" type="date" value={val.date} onChange={v => setVal({...val, date:v})} />
          </div>
          <div style={{ flex:1 }}>
            <PairInput label="Город рождения" ph="Москва" value={val.city} onChange={v => setVal({...val, city:v})} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PairFormScreenProps {
  spread: Spread;
  onBack: () => void;
  onSubmit: (extra: PairExtra, q: string) => void;
}

export function PairFormScreen({ spread, onBack, onSubmit }: PairFormScreenProps) {
  const [a, setA] = useState<PersonVal>({ name:'', date:'', city:'' });
  const [b, setB] = useState<PersonVal>({ name:'', date:'', city:'' });
  const [q, setQ] = useState('');
  const isLove = spread.id === 'love';
  const labelA = isLove ? 'Вы' : 'Первый человек';
  const labelB = isLove ? 'Партнёр' : 'Второй человек';
  const ready = a.name.trim() && b.name.trim();

  const submit = () => {
    const dq = q.trim() || (isLove
      ? `Что ждёт нас в отношениях: ${a.name} и ${b.name}?`
      : `Насколько совместимы ${a.name} и ${b.name}?`);
    onSubmit({ type:'pair', labelA, labelB, a, b }, dq);
  };

  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
      </div>
      <div className="float" style={{ alignSelf:'center', textAlign:'center', color:'var(--gold)', margin:'2px 0 12px',
        filter:'drop-shadow(0 0 14px var(--glow-soft))' }}>
        <Glyph k={isLove ? 'lovers' : 'temperance'} size={46} />
      </div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16.5, color:'var(--muted)',
        textAlign:'center', lineHeight:1.4, marginBottom:20 }}>
        {isLove
          ? 'Назовите обоих — карты прочтут энергию вашей пары и подскажут, куда движутся отношения.'
          : 'Введите данные двоих — карты сравнят ваши натуры и покажут, в чём вы сходитесь и где растёте.'}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <PartnerBlock label={labelA} val={a} setVal={setA} accent="var(--gold)" />
        <div style={{ textAlign:'center', color:'#e06a9a', fontSize:20 }}>♥</div>
        <PartnerBlock label={labelB} val={b} setVal={setB} accent="#e06a9a" />

        <div>
          <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:1, marginBottom:6 }}>Ваш вопрос (по желанию)</div>
          <textarea value={q} onChange={e => setQ(e.target.value)} rows={2}
            placeholder={isLove ? 'Например: есть ли у нас будущее?' : 'Например: стоит ли нам быть вместе?'}
            style={{ width:'100%', boxSizing:'border-box', resize:'none', background:'var(--panel)',
              border:'1px solid var(--gold-line)', borderRadius:14,
              padding:'13px 15px', color:'var(--text)', fontSize:15, outline:'none', lineHeight:1.4 }} />
        </div>
      </div>

      <div style={{ marginTop:18 }}>
        <GoldButton full onClick={submit} disabled={!ready}>Перейти к колоде</GoldButton>
        {!ready && (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:8 }}>
            Укажите имена обоих, чтобы продолжить</div>
        )}
      </div>
    </div>
  );
}
