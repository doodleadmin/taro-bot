// app.jsx — оркестрация: маршруты, баланс, нижняя навигация, темы, Tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "midnight",
  "starfield": true,
  "reversible": true
}/*EDITMODE-END*/;

const THEME_LABEL = { midnight:'Полночь', amethyst:'Аметист', emerald:'Изумруд' };

const NAV = [
  { id:'home',    label:'Главная', icon:'star' },
  { id:'history', label:'История', icon:'hermit' },
  { id:'profile', label:'Профиль', icon:'moon' },
];

function BottomNav({ active, onNav }) {
  return (
    <div style={{ position:'absolute', left:14, right:14, bottom:22, zIndex:40,
      display:'flex', justifyContent:'space-around', padding:'8px 6px', borderRadius:22,
      background:'rgba(12,10,24,.55)', backdropFilter:'blur(16px) saturate(160%)',
      WebkitBackdropFilter:'blur(16px) saturate(160%)', border:'1px solid var(--gold-line)',
      boxShadow:'0 12px 30px rgba(0,0,0,.45)' }}>
      {NAV.map(n=>{
        const on = active===n.id;
        return (
          <button key={n.id} onClick={()=>onNav(n.id)} style={{ flex:1, background:'none', border:'none',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: on?'var(--gold)':'var(--muted)', padding:'4px 0' }}>
            <span style={{ filter: on?'drop-shadow(0 0 8px var(--glow-soft))':'none' }}><Glyph k={n.icon} size={22} /></span>
            <span style={{ fontSize:11, fontWeight: on?600:400, letterSpacing:.3 }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// всплывающее уведомление
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="screen-in" style={{ position:'absolute', left:'50%', bottom:96, transform:'translateX(-50%)',
      zIndex:60, padding:'11px 20px', borderRadius:13, whiteSpace:'nowrap',
      background:'rgba(12,10,24,.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border:'1px solid var(--gold)', color:'var(--text)', fontSize:14,
      boxShadow:'0 10px 28px rgba(0,0,0,.5)' }}>{msg}</div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState({ name:'home' });
  const today = new Date().toISOString().slice(0,10);

  const [balance, setBalance] = React.useState(() => {
    const v = localStorage.getItem('tl_bal'); return v==null ? SEED_BALANCE : +v; });
  const [txns, setTxns] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('tl_tx')) || SEED_TX; } catch { return SEED_TX; } });
  const [freeUsed, setFreeUsed] = React.useState(() => localStorage.getItem('tl_free') || '');
  const [deck, setDeck] = React.useState(() => localStorage.getItem('tl_deck') || DEFAULT_DECK);
  const [history, setHistory] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('tl_hist')) || SEED_HISTORY; } catch { return SEED_HISTORY; } });
  const [toast, setToast] = React.useState('');
  const toastT = React.useRef(null);
  const flash = (m) => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(()=>setToast(''), 2200); };

  // карта дня
  const dayCard = ARCANA[(parseInt(today.replace(/-/g,''),10)) % ARCANA.length];
  const [dayRevealed, setDayRevealed] = React.useState(() => localStorage.getItem('tl_day')===today);
  const revealDay = () => { setDayRevealed(true); localStorage.setItem('tl_day', today); };

  const [flow, setFlow] = React.useState({ spread:null, q:'', draw:[], paidWith:null });

  React.useEffect(()=>{ localStorage.setItem('tl_bal', String(balance)); }, [balance]);
  React.useEffect(()=>{ localStorage.setItem('tl_tx', JSON.stringify(txns.slice(0,40))); }, [txns]);
  React.useEffect(()=>{ localStorage.setItem('tl_free', freeUsed); }, [freeUsed]);
  React.useEffect(()=>{ localStorage.setItem('tl_deck', deck); }, [deck]);
  React.useEffect(()=>{ localStorage.setItem('tl_hist', JSON.stringify(history.slice(0,30))); }, [history]);

  const freeAvailable = freeUsed !== today;          // один бесплатный расклад в день
  const isFreeNow = (sp) => sp.free1card && freeAvailable;

  const makeDraw = (sp) => {
    const pool = [...ARCANA]; const out = [];
    for (let i=0;i<sp.count;i++){ const idx=Math.floor(Math.random()*pool.length);
      out.push({ card: pool.splice(idx,1)[0], reversed: t.reversible && Math.random()<0.35 }); }
    return out;
  };

  // попытка оплатить расклад; возвращает 'free' | 'paid' | false(недостаточно)
  const charge = (sp) => {
    if (sp.price === 0) return 'paid';
    if (isFreeNow(sp)) {
      setFreeUsed(today);
      setTxns(x => [{ id:'x'+Date.now(), type:'free', title:`${sp.title} · бесплатно`, amount:0, date:'Только что' }, ...x]);
      return 'free';
    }
    if (balance < sp.price) return false;
    setBalance(b => b - sp.price);
    setTxns(x => [{ id:'x'+Date.now(), type:'spend', title:sp.title, amount:-sp.price, date:'Только что' }, ...x]);
    return 'paid';
  };

  const startSpread = (id) => {
    const sp = SPREADS[id];
    const paid = charge(sp);
    if (!paid) { setRoute({ name:'topup', need:sp }); flash(`Не хватает ${sp.price - balance} ₽ для расклада`); return; }
    setFlow({ spread:sp, q: id==='daily'?'Карта дня':'', draw:[], paidWith:paid });
    if (id==='natal') { setRoute({ name:'natal' }); return; }
    if (id==='daily') { setRoute({ name:'deck' }); return; }
    if (id==='love' || id==='match') { setRoute({ name:'pairform', sp }); return; }
    setRoute({ name:'question', sp });
  };

  const onQuestion = (q) => { setRoute({ name:'deck' }); setFlow(f=>({ ...f, q })); };
  const onPairDone = (extra, q) => { setFlow(f=>({ ...f, q, extra })); setRoute({ name:'deck' }); };

  const onDeckDone = () => {
    const draw = makeDraw(flow.spread);
    setFlow(f=>({ ...f, draw }));
    setRoute({ name:'thinking' });
    setTimeout(()=>{
      setRoute({ name:'reading' });
      setHistory(h=>[{ id:'h'+Date.now(), spread:flow.spread.id, q:flow.q,
        date:'Только что', cards:draw.map(d=>d.card.n) }, ...h]);
    }, 2600);
  };

  const openHistory = (h) => {
    const sp = SPREADS[h.spread];
    const draw = h.cards.map(n=>({ card: ARCANA.find(c=>c.n===n), reversed:false }));
    setFlow({ spread:sp, q:h.q, draw });
    setRoute({ name:'reading', fromHistory:true });
  };

  const doTopup = (pkg) => {
    const add = pkg.amount + pkg.bonus;
    setBalance(b => b + add);
    setTxns(x => [{ id:'x'+Date.now(), type:'topup', title:'Пополнение баланса', amount:+add, date:'Только что' }, ...x]);
    flash(`Баланс пополнен на ${add} ₽`);
    setRoute({ name:'profile' });
  };

  const tab = ['home','history','profile'].includes(route.name) ? route.name : null;

  let screen;
  if (route.name==='home') screen = <HomeScreen balance={balance} freeAvailable={freeAvailable}
    dayCard={dayCard} dayRevealed={dayRevealed} onRevealDay={revealDay} onStart={startSpread}
    onBalance={()=>setRoute({name:'profile'})} />;
  else if (route.name==='history') screen = <HistoryScreen history={history} onOpen={openHistory} onStart={startSpread} />;
  else if (route.name==='profile') screen = <ProfileScreen balance={balance} txns={txns} history={history}
    freeAvailable={freeAvailable} deck={deck} onDeck={setDeck} onTopup={()=>setRoute({name:'topup'})} />;
  else if (route.name==='topup') screen = <TopUpScreen balance={balance} need={route.need}
    onBack={()=>setRoute({name: route.need?'home':'profile'})} onBuy={doTopup} />;
  else if (route.name==='natal') screen = <NatalScreen onBack={()=>setRoute({name:'home'})} />;
  else if (route.name==='pairform') screen = <PairFormScreen spread={flow.spread}
    onBack={()=>setRoute({name:'home'})} onSubmit={onPairDone} />;
  else if (route.name==='question') screen = <QuestionScreen spread={flow.spread} paidWith={flow.paidWith}
    onBack={()=>setRoute({name:'home'})} onSubmit={onQuestion} />;
  else if (route.name==='deck') screen = <DeckScreen spread={flow.spread} onBack={()=>setRoute({name:'home'})} onComplete={onDeckDone} />;
  else if (route.name==='thinking') screen = <ThinkingScreen question={flow.q} />;
  else if (route.name==='reading') screen = <ReadingScreen spread={flow.spread} question={flow.q} draw={flow.draw} extra={flow.extra}
    onBack={()=>setRoute({name:'history'})} onNew={()=>setRoute({name:'home'})} />;

  return (
    <IOSDevice dark width={402} height={874}>
      <DeckContext.Provider value={deck}>
      <div data-theme={t.theme} style={{ position:'relative', height:'100%', overflow:'hidden',
        background:'var(--bg1)' }}>
        <div className="stage">{t.starfield && <StarField key={t.theme} />}<div className="bottom-glow" /></div>

        <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', paddingTop:54 }}>
          <div style={{ position:'relative', flex:1, overflow:'hidden' }}>
            <Screen k={route.name + (route.fromHistory?'-h':'')}>{screen}</Screen>
          </div>
        </div>

        <Toast msg={toast} />
        {tab && <BottomNav active={tab} onNav={(id)=>setRoute({ name:id })} />}

        <TweaksPanel title="Tweaks">
          <TweakSection label="Стиль" />
          <TweakRadio label="Тема" value={t.theme}
            options={[{value:'midnight',label:'Полночь'},{value:'amethyst',label:'Аметист'},{value:'emerald',label:'Изумруд'}]}
            onChange={(v)=>setTweak('theme', v)} />
          <TweakToggle label="Звёздный фон" value={t.starfield} onChange={(v)=>setTweak('starfield', v)} />
          <TweakSection label="Гадание" />
          <TweakToggle label="Перевёрнутые карты" value={t.reversible} onChange={(v)=>setTweak('reversible', v)} />
          <TweakButton label="Пополнить +100 ₽" onClick={()=>{ setBalance(b=>b+100);
            setTxns(x=>[{ id:'x'+Date.now(), type:'topup', title:'Пополнение баланса', amount:+100, date:'Только что' }, ...x]); }} />
          <TweakButton label="Сбросить бесплатный расклад" onClick={()=>setFreeUsed('')} />
        </TweaksPanel>
      </div>
      </DeckContext.Provider>
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
// build: taro v2 — balance economy
