import React from 'react';
import { Glyph } from '../components/cards/Glyph';
import { GoldButton } from '../components/ui/GoldButton';
import { DECKS, SPREADS } from '@taro/shared';
import type { UserProfile } from '@taro/shared';
import type { HistoryEntry } from './HistoryScreen';

interface TxItem {
  id: string | number;
  type: 'topup' | 'spend' | 'free';
  title: string;
  amount: number;
  date: string;
}

interface ProfileScreenProps {
  user: UserProfile;
  balance: number;
  txns: TxItem[];
  history: HistoryEntry[];
  freeAvailable: boolean;
  deck: string;
  onDeck: (id: string) => void;
  onTopup: () => void;
}

function TgAvatar({ size = 64, user }: { size?: number; user: UserProfile }) {
  const initials = user.firstName.slice(0, 2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', position:'relative', flexShrink:0,
      background:'linear-gradient(135deg, var(--gold), var(--gold-deep))', display:'grid', placeItems:'center',
      boxShadow:'0 8px 22px var(--glow-soft)' }}>
      {user.photoUrl
        ? <img src={user.photoUrl} alt="" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }} />
        : <span style={{ fontFamily:'Marcellus, serif', fontSize:size*0.42, color:'var(--on-gold)' }}>{initials}</span>}
      <span style={{ position:'absolute', right:-1, bottom:-1, width:size*0.32, height:size*0.32, borderRadius:'50%',
        background:'#229ED9', border:'2px solid var(--bg1)', display:'grid', placeItems:'center' }}>
        <svg width={size*0.18} height={size*0.18} viewBox="0 0 24 24" fill="#fff">
          <path d="M21 4L3 11l5 2 2 6 3-4 5 3z"/>
        </svg>
      </span>
    </div>
  );
}

function DeckThumb({ deck }: { deck: typeof DECKS[number] }) {
  const cdnBase = import.meta.env.VITE_CDN_BASE_URL ?? '';
  if (deck.kind === 'image' && deck.path) {
    return (
      <img src={`${cdnBase}/${deck.path}/18.jpg`} alt={deck.title}
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
    );
  }
  return (
    <div style={{ width:'100%', height:'100%', position:'relative', background:'var(--card-bg)',
      display:'grid', placeItems:'center', color:'var(--gold)' }}>
      <div style={{ position:'absolute', inset:5, borderRadius:5, border:'1px solid var(--gold-line)' }} />
      <Glyph k="moon" size={34} />
    </div>
  );
}

export function ProfileScreen({ user, balance, txns, history, freeAvailable, deck, onDeck, onTopup }: ProfileScreenProps) {
  const balanceLabel = Number.isFinite(balance) ? `${balance} ₽` : '∞ ₽';
  const fav = (() => {
    const cnt: Record<string, number> = {};
    history.forEach(h => cnt[h.spread] = (cnt[h.spread] || 0) + 1);
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    return top ? (SPREADS[top[0]]?.title || '—') : '—';
  })();
  const txIcon = { topup:'+', spend:'−', free:'✦' };
  const txColor = { topup:'#7fe0b4', spend:'var(--gold)', free:'var(--muted)' };

  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 100px' }}>
      {/* Шапка */}
      <div style={{ display:'flex', alignItems:'center', gap:15, marginTop:4 }}>
        <TgAvatar size={64} user={user} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)' }}>{user.firstName}</div>
          {user.username && <div style={{ fontSize:13, color:'var(--gold)' }}>@{user.username}</div>}
          <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>
            С нами с {new Date(user.createdAt).toLocaleDateString('ru-RU', { month:'long', year:'numeric' })}
          </div>
        </div>
      </div>

      {/* Баланс */}
      <div style={{ position:'relative', marginTop:18, padding:'20px 20px', borderRadius:20, overflow:'hidden',
        background:'linear-gradient(135deg, var(--gold-deep)33, var(--panel))', border:'1px solid var(--gold-line)' }}>
        <div className="sheen-band" style={{ opacity:.5 }} />
        <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)' }}>Баланс</div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:40, color:'var(--gold)', lineHeight:1.05, marginTop:4 }}>
              {balanceLabel}</div>
          </div>
          <GoldButton onClick={onTopup} style={{ padding:'12px 20px' }}>Пополнить</GoldButton>
        </div>
      </div>

      {/* Статус бесплатного */}
      <div style={{ marginTop:12, padding:'14px 16px', borderRadius:16, display:'flex', alignItems:'center', gap:12,
        background:'var(--panel)', border:`1px solid ${freeAvailable ? 'rgba(95,208,160,.5)' : 'var(--gold-line)'}` }}>
        <span style={{ display:'grid', placeItems:'center', width:40, height:40, borderRadius:12, flexShrink:0,
          color: freeAvailable ? '#7fe0b4' : 'var(--muted)',
          background: freeAvailable ? 'rgba(95,208,160,.14)' : 'var(--back-1)', border:'1px solid var(--gold-line)' }}>
          <Glyph k="sun" size={22} />
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)' }}>Бесплатный расклад</div>
          <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:1 }}>
            {freeAvailable ? 'Доступен сейчас — простой расклад бесплатно' : 'Использован · следующий завтра'}</div>
        </div>
        <span style={{ fontSize:12, fontWeight:600, color: freeAvailable ? '#7fe0b4' : 'var(--muted)' }}>
          {freeAvailable ? 'Готов' : 'Завтра'}</span>
      </div>

      {/* Выбор колоды */}
      <div style={{ marginTop:22, marginBottom:11, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>Колода карт</div>
        <span style={{ fontSize:12, color:'var(--muted)' }}>стиль иллюстраций</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {DECKS.map(d => {
          const on = deck === d.id;
          return (
            <button key={d.id} onClick={() => onDeck(d.id)}
              style={{ position:'relative', textAlign:'center', padding:'10px 8px 11px', borderRadius:16,
                cursor:'pointer', overflow:'hidden',
                background:'var(--panel)', border:`1.5px solid ${on ? d.accent : 'var(--gold-line)'}`, transition:'.2s' }}>
              <div style={{ width:'100%', aspectRatio:'2/3', borderRadius:9, overflow:'hidden', marginBottom:8,
                boxShadow:'0 6px 14px rgba(0,0,0,.4)', background:'#0c0c18',
                outline: on ? `2px solid ${d.accent}` : 'none', outlineOffset:1 }}>
                <DeckThumb deck={d} />
              </div>
              <div style={{ fontFamily:'Marcellus, serif', fontSize:12.5, color:'var(--text)', lineHeight:1.1 }}>{d.title}</div>
              <div style={{ fontSize:9.5, color:'var(--muted)', marginTop:2, lineHeight:1.15 }}>{d.sub}</div>
              {on && (
                <span style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:10,
                  display:'grid', placeItems:'center', background:d.accent, color:'#1a1408' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 6"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Статистика */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:18 }}>
        <div style={{ padding:'16px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:30, color:'var(--gold)' }}>{history.length}</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>гаданий всего</div>
        </div>
        <div style={{ padding:'16px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)', lineHeight:1.1, marginTop:6 }}>{fav}</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>любимый расклад</div>
        </div>
      </div>

      {/* История трат */}
      <div style={{ marginTop:22, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>История трат</div>
        <span style={{ fontSize:12, color:'var(--muted)' }}>{txns.length} операций</span>
      </div>
      <div style={{ marginTop:11, display:'flex', flexDirection:'column', gap:9 }}>
        {txns.slice(0, 12).map(x => (
          <div key={x.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
            borderRadius:14, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
            <span style={{ display:'grid', placeItems:'center', width:34, height:34, borderRadius:10, flexShrink:0,
              fontSize:18, color:txColor[x.type], background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>
              {txIcon[x.type]}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.title}</div>
              <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{x.date}</div>
            </div>
            <span style={{ fontFamily:'Marcellus, serif', fontSize:16, whiteSpace:'nowrap',
              color: x.amount > 0 ? '#7fe0b4' : x.amount < 0 ? 'var(--gold)' : 'var(--muted)' }}>
              {x.amount > 0 ? `+${x.amount}` : x.amount < 0 ? `${x.amount}` : '0'} ₽
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
