/**
 * AdminPanel.tsx — Панель администратора Таро Премиум
 * Открывается по /admin команде в боте (URL: ?tg_admin=1)
 */
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

// ── Типы ─────────────────────────────────────────────────────────────────────

interface Stats {
  users: { total: number; today: number; activeWeek: number };
  revenue: { total: number; today: number; topups: number };
  readings: { total: number; today: number };
}

interface User {
  id: number; tgId: string; firstName: string; username: string | null;
  balance: number; deck: string; funnelStep: number;
  createdAt: string; updatedAt: string;
  _count: { readings: number; payments: number };
}

interface Broadcast {
  id: number; text: string; buttonLabel: string | null; buttonUrl: string | null;
  sentCount: number; failCount: number; createdAt: string; adminId: string;
}

// ── API-функции ───────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem('taro_token') ?? '';
  const r = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('taro_token') ?? '';
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ── Стили ─────────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: '100dvh',
    background: '#0f0f1a',
    color: '#e8e0d0',
    fontFamily: "'Jost', system-ui, sans-serif",
    fontSize: 14,
  } as React.CSSProperties,
  header: {
    background: '#1a1830',
    borderBottom: '1px solid rgba(220,184,106,.25)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(220,184,106,.15)',
    background: '#161526',
    overflow: 'auto' as const,
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 18px',
    border: 'none',
    borderBottom: active ? '2px solid #dcb86a' : '2px solid transparent',
    background: 'none',
    color: active ? '#dcb86a' : 'rgba(232,224,208,.6)',
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    letterSpacing: .3,
  }),
  card: {
    background: '#1e1c2e',
    border: '1px solid rgba(220,184,106,.2)',
    borderRadius: 14,
    padding: '16px 18px',
  } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
  big: { fontFamily: 'Marcellus, serif', fontSize: 32, color: '#dcb86a', lineHeight: 1 } as React.CSSProperties,
  label: { fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(232,224,208,.5)', marginBottom: 5 },
  btn: (color = '#dcb86a'): React.CSSProperties => ({
    background: `linear-gradient(135deg, ${color}, ${color}bb)`,
    border: 'none', borderRadius: 10, padding: '11px 20px',
    color: '#0f0f1a', fontFamily: "'Jost', sans-serif", fontSize: 14,
    fontWeight: 600, cursor: 'pointer', letterSpacing: .3,
  }),
  btnGhost: {
    background: 'rgba(220,184,106,.08)',
    border: '1px solid rgba(220,184,106,.35)',
    borderRadius: 10, padding: '10px 18px',
    color: '#dcb86a', fontFamily: "'Jost', sans-serif", fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  input: {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#13121e', border: '1px solid rgba(220,184,106,.25)',
    borderRadius: 10, padding: '11px 14px',
    color: '#e8e0d0', fontFamily: "'Jost', sans-serif", fontSize: 14,
    outline: 'none',
  } as React.CSSProperties,
  textarea: {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#13121e', border: '1px solid rgba(220,184,106,.25)',
    borderRadius: 10, padding: '11px 14px',
    color: '#e8e0d0', fontFamily: "'Jost', sans-serif", fontSize: 14,
    outline: 'none', resize: 'vertical' as const, minHeight: 90,
  } as React.CSSProperties,
};

// ── Компонент StatCard ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#dcb86a' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={S.card}>
      <div style={S.label}>{label}</div>
      <div style={{ ...S.big, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(232,224,208,.5)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Таб: Дашборд ──────────────────────────────────────────────────────────────

function TabStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Stats>('/api/admin/stats')
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: 'rgba(232,224,208,.5)' }}>Загружаем…</div>;
  if (error) return <div style={{ padding: 24, color: '#e07a7a' }}>Ошибка: {error}</div>;
  if (!stats) return null;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 16, color: '#dcb86a', fontFamily: 'Marcellus, serif', marginBottom: 4 }}>
        Сводка
      </div>
      <div style={S.grid3}>
        <StatCard label="Пользователей" value={stats.users.total} sub={`+${stats.users.today} сегодня`} />
        <StatCard label="Активных (неделя)" value={stats.users.activeWeek} color="#7fe0b4" />
        <StatCard label="Пополнений" value={stats.revenue.topups} />
      </div>
      <div style={S.grid2}>
        <StatCard label="Оборот всего" value={`${stats.revenue.total} ₽`} color="#dcb86a" />
        <StatCard label="Сегодня" value={`${stats.revenue.today} ₽`} color="#7fe0b4" sub="пополнения" />
      </div>
      <div style={S.grid2}>
        <StatCard label="Раскладов всего" value={stats.readings.total} />
        <StatCard label="Сегодня" value={stats.readings.today} />
      </div>
    </div>
  );
}

// ── Таб: Пользователи ────────────────────────────────────────────────────────

function TabUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 0, q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set('search', q);
      const data = await apiGet<{ users: User[]; total: number; page: number }>(`/api/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, ''); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(0, search);
  };

  const funnelLabel = (step: number) => {
    const labels = ['Новый', 'Push 1', 'Push 2', 'Push 3', 'Push 4', 'Готов'];
    return labels[step] ?? `Шаг ${step}`;
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Имя, @username или Telegram ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" style={S.btn()}>Найти</button>
      </form>

      <div style={{ fontSize: 12, color: 'rgba(232,224,208,.5)' }}>
        Всего: {total}  {loading ? '(загрузка…)' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontFamily: 'Marcellus, serif', fontSize: 15, color: '#e8e0d0' }}>
                {u.firstName}
                {u.username && <span style={{ color: 'rgba(232,224,208,.5)', fontSize: 12, marginLeft: 6 }}>@{u.username}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,224,208,.4)', marginTop: 3 }}>
                ID: {u.tgId} · Зарег. {new Date(u.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              <span style={{ padding: '4px 10px', borderRadius: 7,
                background: 'rgba(220,184,106,.12)', border: '1px solid rgba(220,184,106,.3)',
                color: '#dcb86a', fontSize: 13, fontFamily: 'Marcellus, serif' }}>
                {u.balance} ₽
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 7,
                background: 'rgba(127,224,180,.1)', border: '1px solid rgba(127,224,180,.3)',
                color: '#7fe0b4', fontSize: 11 }}>
                {funnelLabel(u.funnelStep)}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(232,224,208,.45)', alignSelf: 'center' }}>
                📖 {u._count.readings} · 💳 {u._count.payments}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
        {page > 0 && (
          <button style={S.btnGhost} onClick={() => load(page - 1, search)}>← Назад</button>
        )}
        {(page + 1) * 30 < total && (
          <button style={S.btnGhost} onClick={() => load(page + 1, search)}>Вперёд →</button>
        )}
      </div>
    </div>
  );
}

// ── Таб: Рассылка ────────────────────────────────────────────────────────────

function TabBroadcast() {
  const [text, setText] = useState('');
  const [btnLabel, setBtnLabel] = useState('');
  const [btnUrl, setBtnUrl] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<Broadcast[]>([]);

  useEffect(() => {
    apiGet<Broadcast[]>('/api/admin/broadcasts').then(setHistory).catch(() => {});
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    setStatus('sending');
    try {
      const r = await apiPost<{ ok: boolean; message: string }>('/api/admin/broadcast', {
        text: text.trim(),
        buttonLabel: btnLabel.trim() || undefined,
        buttonUrl: btnUrl.trim() || undefined,
      });
      setStatus('done');
      setResult(r.message);
      setText(''); setBtnLabel(''); setBtnUrl('');
      // Обновляем историю через 2 сек
      setTimeout(() => {
        apiGet<Broadcast[]>('/api/admin/broadcasts').then(setHistory).catch(() => {});
      }, 2000);
    } catch (e: any) {
      setStatus('error');
      setResult('Ошибка: ' + e.message);
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Форма */}
      <div style={S.card}>
        <div style={{ fontSize: 15, color: '#dcb86a', fontFamily: 'Marcellus, serif', marginBottom: 14 }}>
          Новая рассылка
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ ...S.label, marginBottom: 6 }}>Текст сообщения *</div>
            <textarea
              style={S.textarea}
              placeholder="*Жирный* текст, _курсив_, обычный Markdown Telegram…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'rgba(232,224,208,.4)', marginTop: 4 }}>
              Поддерживается Markdown: *жирный*, _курсив_, \`код\`
            </div>
          </div>
          <div style={S.grid2}>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>Кнопка: текст</div>
              <input style={S.input} placeholder="🔮 Открыть приложение" value={btnLabel}
                onChange={e => setBtnLabel(e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>Кнопка: URL</div>
              <input style={S.input} placeholder="https://t.me/bot" value={btnUrl}
                onChange={e => setBtnUrl(e.target.value)} />
            </div>
          </div>
          {status === 'done' && (
            <div style={{ padding: '10px 14px', borderRadius: 10,
              background: 'rgba(127,224,180,.1)', border: '1px solid rgba(127,224,180,.35)',
              color: '#7fe0b4', fontSize: 13 }}>✓ {result}</div>
          )}
          {status === 'error' && (
            <div style={{ padding: '10px 14px', borderRadius: 10,
              background: 'rgba(224,122,122,.1)', border: '1px solid rgba(224,122,122,.35)',
              color: '#e07a7a', fontSize: 13 }}>{result}</div>
          )}
          <button
            style={{ ...S.btn(), opacity: (status === 'sending' || !text.trim()) ? .5 : 1 }}
            disabled={status === 'sending' || !text.trim()}
            onClick={send}
          >
            {status === 'sending' ? '⏳ Отправляем…' : '📢 Отправить всем'}
          </button>
        </div>
      </div>

      {/* История */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 15, color: '#dcb86a', fontFamily: 'Marcellus, serif', marginBottom: 10 }}>
            История рассылок
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(b => (
              <div key={b.id} style={{ ...S.card }}>
                <div style={{ fontSize: 13, color: '#e8e0d0', lineHeight: 1.4,
                  whiteSpace: 'pre-wrap', marginBottom: 8 }}>{b.text}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, fontSize: 11, color: 'rgba(232,224,208,.5)' }}>
                  <span style={{ color: '#7fe0b4' }}>✓ {b.sentCount} доставлено</span>
                  {b.failCount > 0 && <span style={{ color: '#e07a7a' }}>✗ {b.failCount} ошибок</span>}
                  <span>{new Date(b.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Главный компонент AdminPanel ─────────────────────────────────────────────

type Tab = 'stats' | 'users' | 'broadcast';

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [authStatus, setAuthStatus] = useState<'checking'|'ok'|'denied'>('checking');

  useEffect(() => {
    // Авторизуемся и проверяем admin-права
    const token = localStorage.getItem('taro_token');
    if (!token) { setAuthStatus('denied'); return; }

    apiGet('/api/admin/check')
      .then(() => setAuthStatus('ok'))
      .catch(() => setAuthStatus('denied'));
  }, []);

  if (authStatus === 'checking') {
    return (
      <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(220,184,106,.6)' }}>Проверка прав…</div>
      </div>
    );
  }

  if (authStatus === 'denied') {
    return (
      <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⛔</div>
          <div style={{ fontFamily: 'Marcellus, serif', fontSize: 20, color: '#dcb86a', marginBottom: 10 }}>
            Нет доступа
          </div>
          <div style={{ fontSize: 14, color: 'rgba(232,224,208,.6)' }}>
            Ваш аккаунт не имеет прав администратора.<br/>
            Обратитесь к владельцу бота.
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'stats',     label: '📊 Статистика' },
    { id: 'users',     label: '👥 Пользователи' },
    { id: 'broadcast', label: '📢 Рассылка' },
  ];

  return (
    <div style={S.root}>
      {/* Хедер */}
      <div style={S.header}>
        <span style={{ fontSize: 22 }}>🔮</span>
        <div>
          <div style={{ fontFamily: 'Marcellus, serif', fontSize: 17, color: '#dcb86a', lineHeight: 1 }}>
            Таро Премиум
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(220,184,106,.6)' }}>
            Панель управления
          </div>
        </div>
      </div>

      {/* Табы */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Содержимое */}
      <div style={{ paddingBottom: 32 }}>
        {tab === 'stats'     && <TabStats />}
        {tab === 'users'     && <TabUsers />}
        {tab === 'broadcast' && <TabBroadcast />}
      </div>
    </div>
  );
}
