import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client.ts';
import type { UserProfile, HistoryItem, DrawnCard, Spread, SpreadId, PairExtra } from '@taro/shared';
import { SPREADS } from '@taro/shared';

export type RouteName =
  | 'home' | 'history' | 'profile'
  | 'topup' | 'natal' | 'pairform' | 'question' | 'deck' | 'thinking' | 'reading';

export interface Route {
  name: RouteName;
  need?: Spread;
  fromHistory?: boolean;
}

export interface Flow {
  spread: Spread | null;
  q: string;
  draw: Array<{ card: import('@taro/shared').Card; reversed: boolean }>;
  paidWith: 'free' | 'paid' | null;
  extra?: PairExtra;
  interpretation?: import('@taro/shared').AiInterpretation;
  readingId?: number;
}

export function useAppState() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [flow, setFlow] = useState<Flow>({ spread: null, q: '', draw: [], paidWith: null });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState('');

  const toastRef = { current: 0 as ReturnType<typeof setTimeout> };
  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // Initial auth
  useEffect(() => {
    api.auth()
      .then(resp => {
        setUser(resp.user);
        setLoading(false);
      })
      .catch(err => {
        console.error('Auth failed:', err);
        setLoading(false);
      });
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await api.getMe();
    setUser(u);
    return u;
  }, []);

  const startSpread = useCallback(async (spreadId: SpreadId) => {
    const spread = SPREADS[spreadId];
    if (!spread) return;

    if (spreadId === 'natal') {
      setFlow(f => ({ ...f, spread }));
      setRoute({ name: 'natal' });
      return;
    }
    if (spreadId === 'love' || spreadId === 'match') {
      setFlow(f => ({ ...f, spread }));
      setRoute({ name: 'pairform', need: spread });
      return;
    }
    if (spreadId === 'daily') {
      setFlow(f => ({ ...f, spread, q: 'Карта дня', paidWith: 'paid' }));
      setRoute({ name: 'deck' });
      return;
    }

    setFlow(f => ({ ...f, spread }));
    setRoute({ name: 'question', need: spread });
  }, []);

  const onQuestion = useCallback((q: string) => {
    setFlow(f => ({ ...f, q }));
    setRoute({ name: 'deck' });
  }, []);

  const onPairDone = useCallback((extra: PairExtra, q: string) => {
    setFlow(f => ({ ...f, extra, q }));
    setRoute({ name: 'deck' });
  }, []);

  const onDeckDone = useCallback(async () => {
    if (!flow.spread) return;
    setRoute({ name: 'thinking' });

    try {
      const resp = await api.createReading(
        flow.spread.id as SpreadId,
        flow.q,
        flow.extra,
      );

      // Map DrawnCard[] to { card, reversed }[]
      const { ARCANA } = await import('@taro/shared');
      const draw = (resp.cards as DrawnCard[]).map(dc => ({
        card: ARCANA.find(c => c.n === dc.n)!,
        reversed: dc.reversed,
      }));

      setFlow(f => ({
        ...f,
        draw,
        interpretation: resp.interpretation,
        readingId: resp.id,
        paidWith: 'paid',
      }));
      setUser(u => u ? { ...u, balance: resp.balance } : u);

      // Add to history
      setHistory(h => [{
        id: resp.id,
        spreadId: resp.spreadId,
        question: resp.question,
        cards: resp.cards as DrawnCard[],
        interpretation: resp.interpretation,
        extra: flow.extra ?? null,
        createdAt: resp.createdAt,
      }, ...h.slice(0, 29)]);

      setRoute({ name: 'reading' });
    } catch (err: unknown) {
      const e = err as { status?: number; shortage?: number; message?: string };
      if (e?.status === 402) {
        setRoute({ name: 'topup', need: flow.spread ?? undefined });
        flash(`Не хватает ${e.shortage ?? '?'} ₽ для расклада`);
      } else {
        flash('Ошибка при выполнении расклада');
        setRoute({ name: 'home' });
      }
    }
  }, [flow, flash]);

  const openHistory = useCallback((h: HistoryItem) => {
    const spread = SPREADS[h.spreadId as SpreadId];
    if (!spread) return;
    import('@taro/shared').then(({ ARCANA }) => {
      const draw = (h.cards as DrawnCard[]).map(dc => ({
        card: ARCANA.find(c => c.n === dc.n)!,
        reversed: dc.reversed,
      }));
      setFlow({ spread, q: h.question, draw, paidWith: 'paid', interpretation: h.interpretation });
      setRoute({ name: 'reading', fromHistory: true });
    });
  }, []);

  const doTopup = useCallback(async (packageId: string) => {
    try {
      await api.createTopup(packageId);
      await refreshUser();
      flash('Пополнение создано — следуйте инструкциям провайдера');
      setRoute({ name: 'profile' });
    } catch {
      flash('Ошибка при создании платежа');
    }
  }, [flash, refreshUser]);

  const changeDeck = useCallback(async (deckId: string) => {
    await api.changeDeck(deckId);
    setUser(u => u ? { ...u, deck: deckId as UserProfile['deck'] } : u);
  }, []);

  return {
    user, loading, route, setRoute, flow, setFlow,
    history, setHistory, toast, flash,
    startSpread, onQuestion, onPairDone, onDeckDone,
    openHistory, doTopup, changeDeck, refreshUser,
  };
}
