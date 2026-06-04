import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DeckContext } from './context/DeckContext';
import { StarField } from './components/fx/StarField';
import { Screen } from './components/ui/Screen';
import { Glyph } from './components/cards/Glyph';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import type { HistoryEntry } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TopUpScreen } from './screens/TopUpScreen';
import { NatalScreen } from './screens/NatalScreen';
import { PairFormScreen } from './screens/PairFormScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { DeckScreen } from './screens/DeckScreen';
import { ThinkingScreen } from './screens/ThinkingScreen';
import { ReadingScreen } from './screens/ReadingScreen';
import { AdminScreen } from './screens/AdminScreen';
import { ARCANA, SPREADS } from '@taro/shared';
import type { DrawnCard, SpreadId, UserProfile, PairExtra } from '@taro/shared';
import * as api from './api/client';

// Определяем admin-режим по URL-параметру (?tg_admin=1)
const IS_ADMIN_MODE = new URLSearchParams(window.location.search).get('tg_admin') === '1';

type Theme = 'midnight' | 'amethyst' | 'emerald';
type RouteName = 'home'|'history'|'profile'|'topup'|'natal'|'pairform'|'question'|'deck'|'thinking'|'reading';

interface Route { name: RouteName; need?: typeof SPREADS[keyof typeof SPREADS]; fromHistory?: boolean }
interface DrawItem { card: typeof ARCANA[0]; reversed: boolean }
interface Flow {
  spread: typeof SPREADS[keyof typeof SPREADS] | null;
  q: string;
  draw: DrawItem[];
  paidWith: 'free'|'paid'|null;
  extra?: PairExtra;
  interpretation?: import('@taro/shared').AiInterpretation;
  readingId?: number;
}

const NAV = [
  { id:'home',    label:'Главная', icon:'star'   },
  { id:'history', label:'История', icon:'hermit' },
  { id:'profile', label:'Профиль', icon:'moon'   },
];

function BottomNav({ active, onNav }: { active: string|null; onNav: (id: string) => void }) {
  if (!active) return null;
  return (
    // bottom отступ = 14px + safe-bottom (домашний индикатор iPhone / Android-жест-зона)
    <div style={{
      position:'absolute', left:14, right:14,
      bottom:'calc(14px + var(--safe-bottom, 0px) + var(--content-bottom, 0px))',
      zIndex:40,
      display:'flex', justifyContent:'space-around', padding:'8px 6px', borderRadius:22,
      background:'rgba(12,10,24,.55)', backdropFilter:'blur(16px) saturate(160%)',
      WebkitBackdropFilter:'blur(16px) saturate(160%)', border:'1px solid var(--gold-line)',
      boxShadow:'0 12px 30px rgba(0,0,0,.45)' }}>
      {NAV.map(n => {
        const on = active === n.id;
        return (
          <button key={n.id} onClick={() => onNav(n.id)}
            style={{ flex:1, background:'none', border:'none', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              color: on ? 'var(--gold)' : 'var(--muted)', padding:'4px 0' }}>
            <span style={{ filter: on ? 'drop-shadow(0 0 8px var(--glow-soft))' : 'none' }}>
              <Glyph k={n.icon} size={22} />
            </span>
            <span style={{ fontSize:11, fontWeight: on ? 600 : 400, letterSpacing:.3 }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="screen-in" style={{
      position:'absolute', left:'50%',
      bottom:'calc(96px + var(--safe-bottom, 0px))',
      transform:'translateX(-50%)', zIndex:60, padding:'11px 20px', borderRadius:13, whiteSpace:'nowrap',
      background:'rgba(12,10,24,.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border:'1px solid var(--gold)', color:'var(--text)', fontSize:14,
      boxShadow:'0 10px 28px rgba(0,0,0,.5)' }}>{msg}</div>
  );
}

// Форматирование даты как в оригинале
function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const time = d.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
    if (diffDays === 0) return `Сегодня, ${time}`;
    if (diffDays === 1) return `Вчера, ${time}`;
    return d.toLocaleDateString('ru-RU', { day:'numeric', month:'long' }) + `, ${time}`;
  } catch {
    return isoDate;
  }
}

export default function App() {
  const [theme] = useState<Theme>('midnight');
  const [starfield] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ name:'home' });
  const [flow, setFlow] = useState<Flow>({ spread:null, q:'', draw:[], paidWith:null });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [txns, setTxns] = useState<{ id:number; type:'topup'|'spend'|'free'; title:string; amount:number; date:string }[]>([]);
  const [toast, setToast] = useState('');
  const toastRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // Initial auth
  useEffect(() => {
    api.auth()
      .then(resp => { setUser(resp.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await api.getMe();
    setUser(u);
    return u;
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (route.name === 'history') {
      api.getHistory().then(items => {
        setHistory(items.map(h => ({
          id: h.id,
          spread: h.spreadId,
          q: h.question,
          date: formatDate(h.createdAt),
          cards: (h.cards as DrawnCard[]).map(c => c.n),
        })));
      }).catch(() => {});
    }
    if (route.name === 'profile') {
      api.getTransactions().then(items => {
        setTxns(items.map(t => ({
          id: t.id, type: t.type as 'topup'|'spend'|'free',
          title: t.title, amount: t.amount,
          date: formatDate(t.createdAt),
        })));
      }).catch(() => {});
    }
  }, [route.name]);

  // Day card
  const today = new Date().toISOString().slice(0, 10);
  const dayCardIndex = parseInt(today.replace(/-/g, ''), 10) % ARCANA.length;
  const dayCard = ARCANA[dayCardIndex];
  const [dayRevealed, setDayRevealed] = useState(false);

  useEffect(() => {
    if (user) setDayRevealed(user.dayRevealedToday);
  }, [user]);

  const revealDay = async () => {
    try { await api.revealDailyCard(); } catch { /* no-op */ }
    setDayRevealed(true);
  };

  const balance = user?.balance ?? 0;
  const freeAvailable = user ? user.freeAvailableToday : true;
  const deck = user?.deck ?? 'mansion';

  const startSpread = useCallback(async (spreadId: SpreadId) => {
    const spread = SPREADS[spreadId];
    if (!spread) return;

    // Check balance locally first
    if (spread.price > 0 && !spread.free1card && balance < spread.price) {
      setRoute({ name:'topup', need: spread });
      flash(`Не хватает ${spread.price - balance} ₽ для расклада`);
      return;
    }

    if (spreadId === 'natal') {
      if (balance < spread.price) {
        setRoute({ name:'topup', need: spread });
        flash(`Не хватает ${spread.price - balance} ₽`);
        return;
      }
      setFlow(f => ({ ...f, spread }));
      setRoute({ name:'natal' });
      return;
    }

    if (spreadId === 'daily') {
      setFlow(f => ({ ...f, spread, q:'Карта дня', paidWith:'paid' }));
      setRoute({ name:'deck' });
      return;
    }

    if (spreadId === 'love' || spreadId === 'match') {
      setFlow(f => ({ ...f, spread }));
      setRoute({ name:'pairform', need: spread });
      return;
    }

    setFlow(f => ({ ...f, spread }));
    setRoute({ name:'question', need: spread });
  }, [balance, flash]);

  const onQuestion = useCallback((q: string) => {
    setFlow(f => ({ ...f, q }));
    setRoute({ name:'deck' });
  }, []);

  const onPairDone = useCallback((extra: PairExtra, q: string) => {
    setFlow(f => ({ ...f, extra, q }));
    setRoute({ name:'deck' });
  }, []);

  const onDeckDone = useCallback(async () => {
    if (!flow.spread) return;
    setRoute({ name:'thinking' });

    try {
      const resp = await api.createReading(flow.spread.id as SpreadId, flow.q, flow.extra);
      const draw = (resp.cards as DrawnCard[]).map(dc => ({
        card: ARCANA.find(c => c.n === dc.n)!,
        reversed: dc.reversed,
      }));
      setFlow(f => ({ ...f, draw, interpretation: resp.interpretation, readingId: resp.id, paidWith:'paid' }));
      setUser(u => u ? { ...u, balance: resp.balance } : u);

      // Add to history
      const newEntry: HistoryEntry = {
        id: resp.id, spread: resp.spreadId, q: resp.question,
        date: 'Только что',
        cards: (resp.cards as DrawnCard[]).map(c => c.n),
      };
      setHistory(h => [newEntry, ...h.slice(0, 29)]);
      setRoute({ name:'reading' });
    } catch (err) {
      const e = err as { status?: number; shortage?: number };
      if (e?.status === 402) {
        setRoute({ name:'topup', need: flow.spread ?? undefined });
        flash(`Не хватает ${e.shortage ?? '?'} ₽ для расклада`);
      } else {
        flash('Ошибка при выполнении расклада');
        setRoute({ name:'home' });
      }
    }
  }, [flow, flash]);

  const openHistory = useCallback((h: HistoryEntry) => {
    const spread = SPREADS[h.spread as SpreadId];
    if (!spread) return;
    const draw = h.cards.map(n => ({
      card: ARCANA.find(c => c.n === n)!,
      reversed: false,
    }));
    setFlow({ spread, q: h.q, draw, paidWith:'paid', interpretation: undefined });
    setRoute({ name:'reading', fromHistory: true });
  }, []);

  const doTopup = useCallback(async (packageId: string) => {
    try {
      await api.createTopup(packageId);
      await refreshUser();
      flash('Пополнение создано');
      setRoute({ name:'profile' });
    } catch {
      flash('Ошибка при создании платежа');
    }
  }, [flash, refreshUser]);

  const changeDeck = useCallback(async (deckId: string) => {
    await api.changeDeck(deckId);
    setUser(u => u ? { ...u, deck: deckId as UserProfile['deck'] } : u);
  }, []);

  // Admin mode — показываем AdminScreen поверх всего (после auth)
  if (IS_ADMIN_MODE && !loading) {
    return (
      <div data-theme="midnight" style={{ position:'fixed', inset:0, overflow:'hidden', background:'var(--bg1)' }}>
        <div className="stage"><StarField /><div className="bottom-glow" /></div>
        <div style={{ position:'relative', height:'100%', paddingTop:'max(100px, calc(var(--safe-top, 0px) + 8px))' }}>
          <AdminScreen onExit={() => window.history.back()} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', background:'#0a0a16', color:'var(--gold)' }}>
        <div className="float"><Glyph k="moon" size={48} /></div>
      </div>
    );
  }

  const tab = ['home','history','profile'].includes(route.name) ? route.name : null;

  let screen: React.ReactNode;

  if (route.name === 'home') {
    screen = (
      <HomeScreen
        balance={balance} freeAvailable={freeAvailable}
        dayCard={dayCard} dayRevealed={dayRevealed}
        onRevealDay={revealDay} onStart={startSpread}
        onBalance={() => setRoute({ name:'profile' })}
      />
    );
  } else if (route.name === 'history') {
    screen = <HistoryScreen history={history} onOpen={openHistory} onStart={startSpread} />;
  } else if (route.name === 'profile') {
    screen = (
      <ProfileScreen
        user={user!} balance={balance} txns={txns} history={history}
        freeAvailable={freeAvailable} deck={deck}
        onDeck={changeDeck} onTopup={() => setRoute({ name:'topup' })}
      />
    );
  } else if (route.name === 'topup') {
    screen = (
      <TopUpScreen
        balance={balance} need={route.need}
        onBack={() => setRoute({ name: route.need ? 'home' : 'profile' })}
        onBuy={doTopup}
      />
    );
  } else if (route.name === 'natal') {
    screen = (
      <NatalScreen
        onBack={() => setRoute({ name:'home' })}
        onBalanceUpdate={b => setUser(u => u ? {...u, balance: b} : u)}
      />
    );
  } else if (route.name === 'pairform') {
    screen = (
      <PairFormScreen
        spread={flow.spread!}
        onBack={() => setRoute({ name:'home' })}
        onSubmit={onPairDone}
      />
    );
  } else if (route.name === 'question') {
    screen = (
      <QuestionScreen
        spread={flow.spread!} paidWith={flow.paidWith}
        onBack={() => setRoute({ name:'home' })}
        onSubmit={onQuestion}
      />
    );
  } else if (route.name === 'deck') {
    screen = (
      <DeckScreen
        spread={flow.spread}
        onBack={() => setRoute({ name:'home' })}
        onComplete={onDeckDone}
      />
    );
  } else if (route.name === 'thinking') {
    screen = <ThinkingScreen question={flow.q} />;
  } else if (route.name === 'reading') {
    screen = (
      <ReadingScreen
        spread={flow.spread!} question={flow.q} draw={flow.draw} extra={flow.extra}
        interpretation={flow.interpretation}
        onBack={() => setRoute({ name:'history', fromHistory: route.fromHistory })}
        onNew={() => setRoute({ name:'home' })}
      />
    );
  }

  return (
    <DeckContext.Provider value={deck}>
      <div data-theme={theme} style={{ position:'fixed', inset:0, overflow:'hidden', background:'var(--bg1)' }}>
        <div className="stage">
          {starfield && <StarField key={theme} />}
          <div className="bottom-glow" />
        </div>
        <div style={{
          position:'relative', height:'100%',
          display:'flex', flexDirection:'column',
          paddingTop:'max(100px, calc(var(--safe-top, 0px) + var(--content-top, 0px) + 8px))',
        }}>
          <div style={{ position:'relative', flex:1, overflow:'hidden' }}>
            <Screen k={route.name + (route.fromHistory ? '-h' : '')}>{screen}</Screen>
          </div>
        </div>
        <Toast msg={toast} />
        <BottomNav active={tab} onNav={id => setRoute({ name: id as 'home'|'history'|'profile' })} />
      </div>
    </DeckContext.Provider>
  );
}

