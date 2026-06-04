import WebApp from '@twa-dev/sdk';
import type {
  AuthResponse, UserProfile, CatalogResponse, ReadingResponse,
  HistoryItem, DailyCardResponse, SpreadId, PairExtra,
} from '@taro/shared';

const BASE = import.meta.env.VITE_API_URL ?? '';

let _token: string | null = localStorage.getItem('taro_token');

function setToken(t: string) {
  _token = t;
  localStorage.setItem('taro_token', t);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error(err.error ?? 'Request failed') as Error & {
      status: number;
      shortage?: number;
    };
    e.status = res.status;
    e.shortage = err.shortage;
    throw e;
  }
  return res.json() as Promise<T>;
}

export async function auth(): Promise<AuthResponse> {
  // In Telegram Mini App, use real initData; in dev, use fallback
  const initData = WebApp.initData || (import.meta.env.DEV ? 'dev:000000001' : '');
  const resp = await request<AuthResponse>('POST', '/api/auth', { initData });
  setToken(resp.token);
  return resp;
}

export function getMe(): Promise<UserProfile> {
  return request<UserProfile>('GET', '/api/me');
}

export function getTransactions() {
  return request<{ id: number; type: string; title: string; amount: number; createdAt: string }[]>(
    'GET', '/api/me/transactions',
  );
}

export function getCatalog(): Promise<CatalogResponse> {
  return request<CatalogResponse>('GET', '/api/catalog');
}

export function createReading(
  spreadId: SpreadId,
  question?: string,
  extra?: PairExtra,
): Promise<ReadingResponse> {
  return request<ReadingResponse>('POST', '/api/reading', { spreadId, question, extra });
}

export function getHistory(): Promise<HistoryItem[]> {
  return request<HistoryItem[]>('GET', '/api/history');
}

export function getDailyCard(): Promise<DailyCardResponse> {
  return request<DailyCardResponse>('GET', '/api/daily');
}

export function revealDailyCard(): Promise<DailyCardResponse> {
  return request<DailyCardResponse>('POST', '/api/daily/reveal');
}

export function changeDeck(deck: string): Promise<{ deck: string }> {
  return request<{ deck: string }>('POST', '/api/deck', { deck });
}

export function createNatal(
  name: string, date: string, time?: string, place?: string,
) {
  return request<{ id: number; natalData: unknown; balance: number; createdAt: string }>(
    'POST', '/api/natal', { name, date, time, place },
  );
}

export function createTopup(packageId: string) {
  return request<unknown>('POST', '/api/topup/create', { packageId });
}
