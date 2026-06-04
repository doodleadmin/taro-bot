import React, { useState } from 'react';
import { GoldButton } from '../components/ui/GoldButton';
import { TOPUP } from '@taro/shared';
import type { Spread } from '@taro/shared';

const Lock = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>
  </svg>
);

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
      color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

interface TopUpScreenProps {
  balance: number;
  need?: Spread;
  onBack: () => void;
  onBuy: (packageId: string) => void;
}

export function TopUpScreen({ balance, need, onBack, onBuy }: TopUpScreenProps) {
  const [sel, setSel] = useState('t300');
  const pkg = TOPUP.find(p => p.id === sel)!;

  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 120px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>Пополнение баланса</div>
      </div>

      <div style={{ textAlign:'center', margin:'16px 0 6px' }}>
        <div style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)' }}>Текущий баланс</div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:38, color:'var(--gold)', marginTop:3 }}>{balance} ₽</div>
      </div>

      {need && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 15px', borderRadius:14, marginBottom:8,
          background:'rgba(224,106,154,.12)', border:'1px solid rgba(224,106,154,.45)' }}>
          <span style={{ color:'#e06a9a', flexShrink:0 }}><Lock /></span>
          <span style={{ fontSize:13.5, color:'var(--text)' }}>
            Для «{need.title}» нужно ещё <b style={{ color:'var(--gold)' }}>{Math.max(0, need.price - balance)} ₽</b>
          </span>
        </div>
      )}

      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--muted)', textAlign:'center', margin:'8px 0 16px' }}>
        Платите только за то, чем пользуетесь — без подписок</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {TOPUP.map(p => {
          const on = sel === p.id;
          return (
            <button key={p.id} onClick={() => setSel(p.id)}
              style={{ position:'relative', textAlign:'left', padding:'16px 16px', borderRadius:18,
                cursor:'pointer', overflow:'hidden',
                background: on ? 'linear-gradient(135deg, var(--back-1), transparent)' : 'var(--panel)',
                border:`1.5px solid ${on ? 'var(--gold)' : 'var(--gold-line)'}`, transition:'.2s' }}>
              {p.best && (
                <span style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700,
                  letterSpacing:1, textTransform:'uppercase', color:'var(--on-gold)', background:'var(--gold)',
                  borderRadius:6, padding:'2px 7px' }}>Хит</span>
              )}
              <div style={{ fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)' }}>{p.label}</div>
              <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)', marginTop:6 }}>{p.amount} ₽</div>
              {p.bonus > 0
                ? <div style={{ fontSize:12.5, color:'#7fe0b4', marginTop:3 }}>+{p.bonus} ₽ бонус</div>
                : <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:3 }}>без бонуса</div>}
            </button>
          );
        })}
      </div>

      {/* Фиксированная кнопка снизу */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'16px 20px 22px',
        background:'linear-gradient(0deg, var(--bg1) 55%, transparent)' }}>
        <GoldButton full onClick={() => onBuy(pkg.id)}>
          Пополнить на {pkg.amount + pkg.bonus} ₽
        </GoldButton>
        <div style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginTop:9 }}>
          Оплата картой или через Telegram · Безопасно</div>
      </div>
    </div>
  );
}
