import React, { useEffect, useState, useCallback } from 'react';
import { GoldButton } from '../components/ui/GoldButton';

const BASE = import.meta.env.VITE_API_URL ?? '';

// ── Типы ────────────────────────────────────────────────────────────────────

interface Stats {
  users: { total: number; today: number; activeWeek: number };
  revenue: { total: number; today: number; topups: number };
  readings: { total: number; today: number };
}

interface AdminUser {
  id: number; tgId: string; firstName: string; username: string | null;
  balance: number; deck: string; funnelStep: number;
  createdAt: string;
  _count: { readings: number; payments: number };
}

interface Broadcast {
  id: number; text: string; buttonLabel: string | null;
  sentCount: number; failCount: number; createdAt: string; adminId: string;
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('taro_token') ?? '';
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── Компоненты ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = 'var(--gold)' }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div style={{ padding:'16px 18px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ fontSize:10.5, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:32, color:accent, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'10px 8px', borderRadius:10, border:'none', cursor:'pointer',
      background: active ? 'linear-gradient(135deg, var(--gold), var(--gold-deep))' : 'var(--panel)',
      color: active ? 'var(--on-gold)' : 'var(--muted)', fontSize:13, fontWeight: active ? 600 : 400,
      transition:'.2s' }}>
      {children}
    </button>
  );
}

// ── Вкладка: Дашборд ─────────────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:20, color:'var(--muted)', textAlign:'center' }}>Загрузка…</div>;
  if (!stats)  return <div style={{ padding:20, color:'#e06a9a', textAlign:'center' }}>Ошибка загрузки</div>;

  return (
    <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', margin:'16px 0 4px' }}>
        Дашборд</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <StatCard label="Пользователей" value={stats.users.total} sub={`+${stats.users.today} сегодня`} />
        <StatCard label="Активных (7 дн)" value={stats.users.activeWeek} />
        <StatCard label="Оборот всего" value={`${stats.revenue.total} ₽`} accent="#7fe0b4"
          sub={`${stats.revenue.today} ₽ сегодня`} />
        <StatCard label="Пополнений" value={stats.revenue.topups} accent="#7fe0b4" />
        <StatCard label="Раскладов всего" value={stats.readings.total} />
        <StatCard label="Раскладов сегодня" value={stats.readings.today} />
      </div>

      <div style={{ padding:'14px 16px', borderRadius:14, background:'var(--panel)', border:'1px solid var(--gold-line)',
        marginTop:4 }}>
        <div style={{ fontSize:11, letterSpacing:1, color:'var(--muted)', marginBottom:6 }}>Средний чек</div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:24, color:'var(--gold)' }}>
          {stats.revenue.topups > 0
            ? Math.round(stats.revenue.total / stats.revenue.topups) + ' ₽'
            : '—'}
        </div>
      </div>
    </div>
  );
}

// ── Вкладка: Пользователи ────────────────────────────────────────────────────

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback((p: number, s: string) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(p), ...(s ? { search: s } : {}) });
    apiFetch(`/api/admin/users?${qs}`)
      .then(d => { setUsers(d.users); setTotal(d.total); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(0, ''); }, []);

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', margin:'16px 0 12px' }}>
        Пользователи <span style={{ fontSize:14, color:'var(--muted)' }}>({total})</span>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени / @username / ID"
          style={{ flex:1, background:'var(--panel)', border:'1px solid var(--gold-line)',
            borderRadius:10, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none' }} />
        <button onClick={() => load(0, search)} style={{ padding:'10px 18px', borderRadius:10, border:'none',
          background:'var(--gold)', color:'var(--on-gold)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          Найти
        </button>
      </div>

      {loading && <div style={{ color:'var(--muted)', textAlign:'center', padding:12 }}>Загрузка…</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {users.map(u => (
          <div key={u.id} style={{ padding:'12px 14px', borderRadius:14, background:'var(--panel)',
            border:'1px solid var(--gold-line)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <span style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)' }}>
                  {u.firstName}</span>
                {u.username && <span style={{ fontSize:12, color:'var(--gold)', marginLeft:8 }}>@{u.username}</span>}
              </div>
              <span style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'#7fe0b4' }}>{u.balance} ₽</span>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:5 }}>
              <span style={{ fontSize:11, color:'var(--muted)' }}>ID: {u.tgId}</span>
              <span style={{ fontSize:11, color:'var(--muted)' }}>🃏 {u._count.readings} раскл.</span>
              <span style={{ fontSize:11, color:'var(--muted)' }}>
                Воронка: шаг {u.funnelStep}</span>
            </div>
          </div>
        ))}
      </div>

      {total > 30 && (
        <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'center' }}>
          <button disabled={page === 0} onClick={() => load(page-1, search)}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--gold-line)',
              background:'transparent', color:'var(--gold)', cursor: page===0 ? 'default':'pointer', opacity: page===0 ? .4:1 }}>
            ← Назад
          </button>
          <span style={{ alignSelf:'center', fontSize:13, color:'var(--muted)' }}>
            {page+1} / {Math.ceil(total/30)}</span>
          <button disabled={page >= Math.ceil(total/30)-1} onClick={() => load(page+1, search)}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--gold-line)',
              background:'transparent', color:'var(--gold)', cursor:'pointer' }}>
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Рассылка ────────────────────────────────────────────────────────

function Broadcast() {
  const [text, setText] = useState('');
  const [btnLabel, setBtnLabel] = useState('');
  const [btnUrl, setBtnUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    apiFetch('/api/admin/broadcasts').then(setBroadcasts).catch(() => {});
  }, [result]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true); setResult(null);
    try {
      const r = await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ text: text.trim(), buttonLabel: btnLabel||undefined, buttonUrl: btnUrl||undefined }),
      });
      setResult(`✅ ${r.message}`);
    } catch {
      setResult('❌ Ошибка при запуске рассылки');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding:'0 16px 40px' }}>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', margin:'16px 0 12px' }}>
        Рассылка</div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', marginBottom:5 }}>Текст сообщения *</div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={5}
            placeholder={'Используйте *жирный* и _курсив_ (Markdown)\nСсылки: https://...'}
            style={{ width:'100%', boxSizing:'border-box', resize:'none', background:'var(--panel)',
              border:'1px solid var(--gold-line)', borderRadius:12,
              padding:'13px 15px', color:'var(--text)', fontSize:14, outline:'none', lineHeight:1.5 }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5 }}>Кнопка: подпись (необязательно)</div>
          <input value={btnLabel} onChange={e => setBtnLabel(e.target.value)}
            placeholder="Открыть приложение →"
            style={{ width:'100%', boxSizing:'border-box', background:'var(--panel)', border:'1px solid var(--gold-line)',
              borderRadius:10, padding:'11px 13px', color:'var(--text)', fontSize:14, outline:'none' }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5 }}>Кнопка: URL (необязательно)</div>
          <input value={btnUrl} onChange={e => setBtnUrl(e.target.value)}
            placeholder="https://tarotpremium.ru"
            style={{ width:'100%', boxSizing:'border-box', background:'var(--panel)', border:'1px solid var(--gold-line)',
              borderRadius:10, padding:'11px 13px', color:'var(--text)', fontSize:14, outline:'none' }} />
        </div>
      </div>

      {/* Предпросмотр */}
      {text && (
        <div style={{ padding:'14px 16px', borderRadius:12, marginBottom:12,
          background:'rgba(220,184,106,.08)', border:'1px solid var(--gold-line)' }}>
          <div style={{ fontSize:10.5, color:'var(--muted)', marginBottom:6 }}>Предпросмотр</div>
          <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.5, whiteSpace:'pre-wrap' }}>
            {text}
          </div>
          {btnLabel && (
            <div style={{ marginTop:10, padding:'8px 14px', borderRadius:8, display:'inline-block',
              background:'var(--gold)', color:'var(--on-gold)', fontSize:13, fontWeight:600 }}>
              {btnLabel}
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:12, fontSize:13, color:'var(--text)',
          background: result.startsWith('✅') ? 'rgba(95,208,160,.12)' : 'rgba(224,106,154,.12)',
          border:`1px solid ${result.startsWith('✅') ? 'rgba(95,208,160,.4)' : 'rgba(224,106,154,.4)'}` }}>
          {result}
        </div>
      )}

      <GoldButton full disabled={!text.trim() || sending} onClick={send}>
        {sending ? 'Рассылка запущена…' : '📢 Отправить всем'}
      </GoldButton>

      {/* История рассылок */}
      {broadcasts.length > 0 && (
        <>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)', margin:'20px 0 10px' }}>
            История рассылок</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ padding:'12px 14px', borderRadius:12, background:'var(--panel)',
                border:'1px solid var(--gold-line)' }}>
                <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.4,
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {b.text}
                </div>
                <div style={{ display:'flex', gap:12, marginTop:6 }}>
                  <span style={{ fontSize:11, color:'#7fe0b4' }}>✓ {b.sentCount}</span>
                  <span style={{ fontSize:11, color:'#e06a9a' }}>✗ {b.failCount}</span>
                  <span style={{ fontSize:11, color:'var(--muted)' }}>
                    {new Date(b.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Главный компонент ────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'users' | 'broadcast';

interface AdminScreenProps { onExit: () => void }

export function AdminScreen({ onExit }: AdminScreenProps) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/check')
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100%', color:'var(--gold)', fontFamily:'Marcellus, serif', fontSize:16 }}>
        Проверка доступа…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height:'100%', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⛔</div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', marginBottom:10 }}>
          Доступ запрещён</div>
        <div style={{ fontSize:14, color:'var(--muted)', marginBottom:24 }}>
          Ваш аккаунт не добавлен в список администраторов</div>
        <GoldButton variant="ghost" onClick={onExit}>← Вернуться</GoldButton>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Заголовок */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px', borderBottom:'1px solid var(--gold-line)', flexShrink:0 }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--gold)' }}>
          🛠 Админ-панель</div>
        <button onClick={onExit} style={{ background:'none', border:'none', cursor:'pointer',
          color:'var(--muted)', fontSize:13, padding:'4px 8px' }}>Выход</button>
      </div>

      {/* Табы */}
      <div style={{ display:'flex', gap:6, padding:'10px 16px', flexShrink:0 }}>
        <TabButton active={tab==='dashboard'} onClick={() => setTab('dashboard')}>📊 Дашборд</TabButton>
        <TabButton active={tab==='users'}     onClick={() => setTab('users')}>👤 Юзеры</TabButton>
        <TabButton active={tab==='broadcast'} onClick={() => setTab('broadcast')}>📢 Рассылка</TabButton>
      </div>

      {/* Контент */}
      <div className="noscroll" style={{ flex:1, overflowY:'auto' }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'users'     && <Users />}
        {tab === 'broadcast' && <Broadcast />}
      </div>
    </div>
  );
}
