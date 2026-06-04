// screens-core.jsx — Главная, вопрос, выбор колоды, ожидание, результат

const I = {
  daily:  <Glyph k="sun" size={26} />,
  one:    <Glyph k="star" size={26} />,
  three:  <Glyph k="moon" size={26} />,
  celtic: <Glyph k="wheel" size={26} />,
  natal:  <Glyph k="world" size={26} />,
};
const Lock = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>
  </svg>
);
const Crown = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 12H5z"/></svg>
);
const Back = ({ onClick }) => (
  <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
    color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
  </button>
);

// Цена/бесплатно для тайла
function priceInfo(t, freeAvailable) {
  if (t.price === 0) return { free:true, text:'Бесплатно' };
  if (t.free1card && freeAvailable) return { free:true, text:'Бесплатно сегодня', was:`${t.price} ₽` };
  return { free:false, text:`${t.price} ₽` };
}
function PriceTag({ info, accent, compact }) {
  if (info.free) {
    return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:8,
      background:'rgba(95,208,160,.16)', border:'1px solid rgba(95,208,160,.5)', color:'#7fe0b4',
      fontSize:11, fontWeight:600, letterSpacing:.2, whiteSpace:'nowrap', flexShrink:0 }}>
      {info.was && !compact && <span style={{ textDecoration:'line-through', opacity:.5, color:'var(--muted)', fontWeight:400 }}>{info.was}</span>}
      {compact && info.was ? 'Бесплатно' : info.text}</span>;
  }
  return <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontFamily:'Marcellus, serif',
    fontSize:16, color: accent || 'var(--gold)', flexShrink:0 }}>{info.text}</span>;
}

// ── Верхняя панель ──
function TopBar({ balance, onBalance }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'4px 20px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div className="float" style={{ color:'var(--gold)', filter:'drop-shadow(0 0 6px var(--glow-soft))' }}>
          <Glyph k="moon" size={26} />
        </div>
        <div>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:19, color:'var(--text)', letterSpacing:1, lineHeight:1 }}>Таро Премиум</div>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:3, textTransform:'uppercase' }}>оракул судьбы</div>
        </div>
      </div>
      <button onClick={onBalance} style={{ display:'flex', alignItems:'center', gap:8,
        padding:'8px 8px 8px 14px', borderRadius:22, cursor:'pointer',
        background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
        <span style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--gold)', lineHeight:1 }}>{balance} ₽</span>
        <span style={{ display:'grid', placeItems:'center', width:26, height:26, borderRadius:14,
          background:'linear-gradient(135deg,var(--gold),var(--gold-deep))', color:'var(--on-gold)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
      </button>
    </div>
  );
}

// ── Главная ──
const TILE_GLYPH = { question:'magician', yesno:'justice', daily:'sun', love:'lovers',
  situation:'hermit', match:'temperance', celtic:'wheel', year:'world', natal:'moon' };

// Обложка расклада — реальная тематическая карта выбранной колоды (CardFace сам выбирает картинку/рисунок)
function SpreadCover({ id, w }) {
  return <CardFace card={window.coverCard(id)} w={w} />;
}

// Компактный тайл (простые расклады, 2 в ряд)
function FreeBanner({ t, onStart, i = 0, freeAvailable }) {
  const info = priceInfo(t, freeAvailable);
  return (
    <button onClick={() => onStart(t.id)} style={{ textAlign:'left', position:'relative',
      display:'flex', flexDirection:'column', padding:14, borderRadius:18, cursor:'pointer',
      background:'var(--panel)', border:'1px solid var(--gold-line)', overflow:'hidden', minHeight:210 }}>
      <div className="sheen-band" style={{ animationDelay:`${i*0.9}s`, opacity:.55 }} />
      <div style={{ position:'relative', display:'flex', justifyContent:'center', marginBottom:12 }}>
        <SpreadCover id={t.id} w={66} accent={t.accent} sweepDelay={i*0.9} />
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
          <span style={{ width:5, height:5, borderRadius:5, background:t.accent, boxShadow:`0 0 6px ${t.accent}`, flexShrink:0 }} />
          <span style={{ fontSize:8.5, letterSpacing:1.2, textTransform:'uppercase', color:'var(--muted)', lineHeight:1.2 }}>{t.cat}</span>
        </div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)', lineHeight:1.05 }}>{t.title}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13.5, color:'var(--muted)', marginTop:4, lineHeight:1.28 }}>{t.sub}</div>
      </div>
      <div style={{ flex:1 }} />
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginTop:12 }}>
        <span style={{ fontSize:9.5, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {t.count} {t.count===1?'карта':t.count<5?'карты':'карт'}</span>
        <PriceTag info={info} accent={t.accent} compact />
      </div>
    </button>
  );
}

// Горизонтальный баннер большого расклада ~5:3 (1 в строку)
function PremiumBanner({ t, onStart, i = 0, freeAvailable }) {
  const info = priceInfo(t, freeAvailable);
  return (
    <button onClick={() => onStart(t.id)} style={{ width:'100%', textAlign:'left', position:'relative',
      display:'flex', gap:16, alignItems:'center', borderRadius:22, padding:16, cursor:'pointer', overflow:'hidden',
      background:`linear-gradient(120deg, ${t.accent}33 0%, ${t.accent}12 50%, rgba(12,10,24,.4) 100%)`,
      border:`1px solid ${t.accent}55` }}>
      <div className="sheen-band" style={{ animationDelay:`${i*1.1}s`, opacity:.7 }} />
      <SpreadCover id={t.id} w={104} accent={t.accent} sweepDelay={i*1.1 + 0.4} />
      <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <span style={{ width:6, height:6, borderRadius:5, background:t.accent, boxShadow:`0 0 8px ${t.accent}` }} />
          <span style={{ fontSize:9.5, letterSpacing:2.2, textTransform:'uppercase', color:t.accent, fontWeight:500 }}>{t.cat}</span>
        </div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', lineHeight:1.05 }}>{t.title}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:14.5, color:'var(--muted)', marginTop:5, lineHeight:1.35 }}>{t.sub}.</div>
        <div style={{ height:1, background:`linear-gradient(90deg, ${t.accent}44, transparent)`, margin:'12px 0 11px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, letterSpacing:1.2, textTransform:'uppercase', color:'var(--muted)' }}>
            {t.count} {t.count<5?'карты':'карт'}</span>
          <span style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', borderRadius:12,
            background:`linear-gradient(135deg, ${t.accent}, ${t.accent}99)`, color:'#fff', fontSize:13, fontWeight:500,
            boxShadow:`0 6px 16px ${t.accent}44`, whiteSpace:'nowrap' }}>{info.text}
            <svg width="13" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 5h11M8 1l4 4-4 4"/></svg></span>
        </div>
      </div>
    </button>
  );
}

// Блок «Как это работает»
function HowItWorks() {
  const StepIcon = ({ k }) => {
    const P = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' };
    const ic = {
      choose:  <g {...P}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></g>,
      shuffle: <g {...P}><path d="M16 4h4v4M20 4l-7 7M8 20H4v-4M4 20l7-7M20 16v4h-4M14 14l6 6M4 8V4h4M10 10L4 4"/></g>,
      spark:   <g {...P}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></g>,
    };
    return <svg width="24" height="24" viewBox="0 0 24 24">{ic[k]}</svg>;
  };
  const steps = [
    { n:'01', icon:'choose',  title:'Выберите расклад', d:'Определитесь с вопросом и выберите подходящий тип расклада из нашей коллекции древних арканов' },
    { n:'02', icon:'shuffle', title:'Тяните карты',     d:'Сосредоточьтесь на вопросе и интуитивно выберите карты из колоды 78 арканов Таро' },
    { n:'03', icon:'spark',   title:'Получите ответ',   d:'Откройте для себя глубокую персональную интерпретацию расклада и смысл каждой карты' },
  ];
  return (
    <div style={{ padding:'0 20px', marginTop:30 }}>
      <div style={{ textAlign:'center', fontFamily:'Marcellus, serif', fontSize:24, color:'var(--text)', marginBottom:18 }}>Как это работает</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {steps.map(s => (
          <div key={s.n} style={{ position:'relative', padding:'20px 18px', borderRadius:18,
            background:'var(--panel)', border:'1px solid var(--gold-line)', textAlign:'center', overflow:'hidden' }}>
            <span style={{ position:'absolute', top:8, left:16, fontFamily:'Marcellus, serif', fontSize:42,
              color:'var(--gold)', opacity:.16, lineHeight:1 }}>{s.n}</span>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:11 }}>
              <span style={{ display:'grid', placeItems:'center', width:48, height:48, borderRadius:13,
                background:'linear-gradient(135deg, var(--gold), var(--gold-deep))', color:'var(--on-gold)',
                boxShadow:'0 6px 16px var(--glow-soft)' }}><StepIcon k={s.icon} /></span>
            </div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:19, color:'var(--text)' }}>{s.title}</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15, color:'var(--muted)',
              lineHeight:1.4, marginTop:6, maxWidth:300, marginInline:'auto' }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Соцсети
function SocialLinks() {
  const Item = ({ icon, label, sub, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:'flex', alignItems:'center', gap:11,
      padding:'13px 15px', borderRadius:15, textDecoration:'none', cursor:'pointer',
      background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <span style={{ display:'grid', placeItems:'center', width:38, height:38, borderRadius:11, flexShrink:0,
        color:'var(--gold)', background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>{icon}</span>
      <span>
        <span style={{ display:'block', fontFamily:'Marcellus, serif', fontSize:15, color:'var(--text)', lineHeight:1.1 }}>{label}</span>
        <span style={{ display:'block', fontSize:11, color:'var(--muted)', marginTop:2 }}>{sub}</span>
      </span>
    </a>
  );
  const ig = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>;
  const tg = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M21 4L3 11l5 2 2 6 3-4 5 3z"/><path d="M8 13l9-6"/></svg>;
  return (
    <div style={{ padding:'0 20px', marginTop:28 }}>
      <Ornament style={{ marginBottom:16 }} />
      <div style={{ textAlign:'center', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:13 }}>Мы в соцсетях</div>
      <div style={{ display:'flex', gap:12 }}>
        <Item icon={ig} label="Instagram" sub="@taro.lux" href="https://instagram.com/taro.lux" />
        <Item icon={tg} label="Telegram" sub="@tarolux_bot" href="https://t.me/tarolux_bot" />
      </div>
    </div>
  );
}

function HomeScreen({ balance, freeAvailable, onStart, onBalance, dayCard, dayRevealed, onRevealDay }) {
  const simple = [SPREADS.yesno, SPREADS.question, SPREADS.love, SPREADS.situation, SPREADS.match, SPREADS.money];
  const big = [SPREADS.celtic, SPREADS.year, SPREADS.natal];
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'0 0 100px' }}>
      <TopBar balance={balance} onBalance={onBalance} />

      {/* Карта дня */}
      <div style={{ padding:'4px 20px 8px' }}>
        <div style={{ position:'relative', borderRadius:22, padding:'20px 20px',
          background:'var(--panel)', border:'1px solid var(--gold-line)', overflow:'hidden',
          display:'flex', gap:18, alignItems:'center' }}>
          <div className="sheen-band" style={{ opacity:.5 }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(80% 120% at 100% 0%, var(--glow) 0%, transparent 60%)', opacity:.5 }} />
          <div style={{ position:'relative' }} onClick={!dayRevealed?onRevealDay:undefined}>
            <FlipCard card={dayCard} w={84} flipped={dayRevealed} />
          </div>
          <div style={{ position:'relative', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:10.5, letterSpacing:3, textTransform:'uppercase', color:'var(--gold)' }}>Карта дня</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:.5, color:'#7fe0b4', padding:'2px 6px',
                borderRadius:6, background:'rgba(95,208,160,.15)', border:'1px solid rgba(95,208,160,.4)' }}>FREE</span>
            </div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', margin:'5px 0 6px' }}>
              {dayRevealed ? dayCard.name : 'Тайна сегодня'}</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15, color:'var(--muted)', lineHeight:1.35 }}>
              {dayRevealed ? dayCard.key : 'Коснитесь карты, чтобы узнать энергию дня'}</div>
          </div>
        </div>
      </div>

      <Ornament style={{ margin:'18px 0 14px' }} />
      <div style={{ padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)', letterSpacing:.5 }}>Расклады Таро</div>
          {freeAvailable && <span style={{ fontSize:11, color:'#7fe0b4' }}>1 бесплатный сегодня</span>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {simple.map((t,i) => <FreeBanner key={t.id} t={t} i={i} onStart={onStart} freeAvailable={freeAvailable} />)}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, margin:'24px 0 14px', color:'var(--gold)' }}>
        <Crown s={13} />
        <span style={{ fontSize:11, letterSpacing:3, textTransform:'uppercase' }}>Большие расклады</span>
        <Crown s={13} />
      </div>
      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {big.map((t,i) => <PremiumBanner key={t.id} t={t} i={i} onStart={onStart} freeAvailable={freeAvailable} />)}
      </div>

      <HowItWorks />
      <SocialLinks />
    </div>
  );
}

// ── Ввод вопроса ──
function QuestionScreen({ spread, paidWith, onBack, onSubmit }) {
  const [q, setQ] = React.useState('');
  const examples = ['Что меня ждёт в любви?', 'Стоит ли менять работу?', 'Чего мне ждать на этой неделе?'];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 20px 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
      </div>
      <div className="float" style={{ alignSelf:'center', color:'var(--gold)', margin:'6px 0 18px',
        filter:'drop-shadow(0 0 14px var(--glow-soft))' }}><Glyph k="priestess" size={56} /></div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)', textAlign:'center',
        lineHeight:1.25, marginBottom:8 }}>Сформулируйте<br/>свой вопрос</div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--muted)',
        textAlign:'center', marginBottom:22, lineHeight:1.4 }}>
        Сосредоточьтесь на одном. Чем яснее вопрос — тем точнее ответ карт.</div>
      <textarea value={q} onChange={e=>setQ(e.target.value)} rows={3}
        placeholder="Введите вопрос к картам..." style={{ width:'100%', resize:'none',
        background:'var(--panel)', border:'1px solid var(--gold-line)', borderRadius:16,
        padding:'16px 18px', color:'var(--text)', fontSize:16, outline:'none', lineHeight:1.4 }} />
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:14 }}>
        {examples.map(ex => (
          <button key={ex} onClick={()=>setQ(ex)} style={{ fontSize:12.5, color:'var(--muted)',
            background:'transparent', border:'1px solid var(--gold-line)', borderRadius:20,
            padding:'7px 12px', cursor:'pointer' }}>{ex}</button>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <div style={{ textAlign:'center', marginBottom:11, fontSize:12.5, color:'var(--muted)' }}>
        {paidWith==='free'
          ? <span style={{ color:'#7fe0b4' }}>✦ Бесплатный расклад дня активирован</span>
          : spread.price>0 ? <span>Списано <span style={{ color:'var(--gold)' }}>{spread.price} ₽</span> с баланса</span> : null}
      </div>
      <GoldButton full onClick={()=>onSubmit(q.trim() || 'Что мне важно знать сейчас?')}>
        Перейти к колоде</GoldButton>
    </div>
  );
}

// Превью слотов в форме будущего расклада (крест, круг, ряд…)
function SlotPreview({ spread, filled }) {
  const lay = LAYOUTS[spread.count] || LAYOUTS[1];
  const square = spread.count >= 10;
  const cw = spread.count <= 3 ? 40 : spread.count <= 5 ? 32 : 24;
  const ch = Math.round(cw * 1.5);
  const box = square
    ? { width: spread.count>=12?186:170, height: spread.count>=12?186:170, margin:'10px auto 0', position:'relative' }
    : { height: spread.count===5?148:92, margin:'12px 18px 0', position:'relative' };
  return (
    <div style={box}>
      {lay.map((p,i)=>(
        <div key={i} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          width:cw, height:ch, transform:`translate(-50%,-50%) rotate(${p.rot||0}deg)`, borderRadius:6,
          border:`1px dashed ${i<filled?'var(--gold)':'var(--gold-line)'}`,
          background: i<filled?'var(--back-1)':'rgba(255,255,255,.02)',
          boxShadow: i<filled?'0 0 12px var(--glow-soft)':'none',
          display:'grid', placeItems:'center', transition:'all .35s cubic-bezier(.3,.7,.2,1)' }}>
          {i<filled && <div className="screen-in" style={{ color:'var(--gold)' }}><Glyph k="star" size={cw*0.5}/></div>}
        </div>
      ))}
    </div>
  );
}

// ── Выбор карт: горизонтальная дуга «как на столе» + свайп + ‹ › + тасовка ──
function DeckScreen({ spread, onBack, onComplete }) {
  const need = spread.count;
  const DECK_N = 30;
  const SP = 50;                     // шаг между картами в дуге
  const W = 96, H = Math.round(W * 1.5);
  const shuffle = (a) => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const center = (DECK_N - 1) / 2;
  const [order, setOrder]   = React.useState(() => shuffle([...Array(DECK_N).keys()]));
  const [picked, setPicked] = React.useState(0);
  const [scroll, setScroll] = React.useState(center);   // дробная позиция центра дуги
  const [flying, setFlying] = React.useState([]);        // id карт, летящих в слот
  const [shuf, setShuf]     = React.useState(null);      // null | 'gather' | 'burst' | 'fate'
  const [selected, setSelected] = React.useState(null);  // id выбранной (поднятой) карты
  const drag = React.useRef({ active:false, x:0, y:0, s:0, moved:false, vert:false, cardId:null });
  const busy = shuf != null;
  const done = picked >= need;
  const maxScroll = Math.max(0, order.length - 1);

  React.useEffect(() => {
    if (done) { const t = setTimeout(() => onComplete(picked), 760); return () => clearTimeout(t); }
  }, [done, picked]);

  // вытащить карту в слот
  const flyPick = (id) => {
    setSelected(null);
    setFlying(f => [...f, id]);
    setTimeout(() => { setOrder(o => o.filter(x => x !== id)); setPicked(p => p+1);
      setFlying(f => f.filter(x => x !== id)); }, 560);
  };
  const pick = (id) => { if (busy || flying.length || picked >= need) return; flyPick(id); };
  const centerOn = (id) => { const i = order.indexOf(id); if (i >= 0) setScroll(i); };

  // листание пачкой
  const page = (dir) => { if (busy) return; setSelected(null);
    setScroll(s => Math.max(0, Math.min(maxScroll, Math.round(s) + dir*4))); };

  // свайп (гориз. — листать; верт. вверх по выбранной карте — бросить на поле)
  const onDown = (e) => { if (busy) return;
    const cardEl = e.target.closest && e.target.closest('[data-cardid]');
    drag.current = { active:true, x:e.clientX, y:e.clientY, s:scroll, moved:false, vert:false,
      cardId: cardEl ? Number(cardEl.dataset.cardid) : null }; };
  const onMove = (e) => { const d = drag.current; if (!d.active) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    // определяем ось жеста один раз
    if (!d.moved && !d.vert) {
      if (dy < -14 && Math.abs(dy) > Math.abs(dx) && d.cardId === selected && selected != null) d.vert = true;
      else if (Math.abs(dx) > 5) d.moved = true;
    }
    if (d.vert) return;                                  // вертикальный бросок — карусель не двигаем
    if (d.moved) setScroll(Math.max(0, Math.min(maxScroll, d.s - dx / SP)));
  };
  const onUp = (e) => { const d = drag.current; if (!d.active) return; d.active = false;
    if (d.vert) {                                        // потянули выбранную карту вверх — бросаем
      const dy = (e && e.clientY != null ? e.clientY : d.y) - d.y;
      if (dy < -40 && d.cardId != null && !flying.length && picked < need) { d.moved = true; pick(d.cardId); return; }
    }
    if (d.moved) setSelected(null);                      // свайпнули — снимаем выбор
    setScroll(s => Math.max(0, Math.min(maxScroll, Math.round(s)))); };
  // тап: 1-й — выбрать и поднять; 2-й по той же карте — бросить на поле
  const tapCard = (id) => {
    if (drag.current.moved || drag.current.vert) return;
    if (busy || flying.length || picked >= need) return;
    if (selected === id) { flyPick(id); }
    else { setSelected(id); centerOn(id); }
  };

  // довериться случаю — премиальный жест: золотой сбор колоды → вспышка → карты вылетают по очереди
  const trustFate = () => {
    if (busy || flying.length || done) return;
    setSelected(null);
    setShuf('fate');                                  // сбор в стопку + золотое свечение
    setTimeout(() => {
      setShuf(null);
      const remain = need - picked; let avail = order.slice(); let k = 0;
      const step = () => { if (k >= remain) return;
        const id = avail[(Math.random()*avail.length)|0]; avail = avail.filter(x => x !== id);
        flyPick(id); k++; setTimeout(step, 600); };
      step();
    }, 720);
  };

  // эффектная тасовка: сбор в стопку → веерный взрыв по кругу → возврат
  const doShuffle = () => {
    if (busy || flying.length || done) return;
    setSelected(null);
    setShuf('gather');
    setTimeout(() => setShuf('burst'), 300);
    setTimeout(() => { setOrder(o => shuffle(o)); setScroll(center); }, 820);
    setTimeout(() => setShuf(null), 870);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 0 0', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 20px' }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
      </div>

      <div style={{ textAlign:'center', marginTop:10 }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)' }}>
          {done ? 'Карты выбраны' : 'Ваш выбор'}</div>
        <div style={{ fontSize:12, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)', marginTop:5 }}>
          {picked} из {need} {need===1?'карты':'карт'}</div>
      </div>

      {/* превью раскладки */}
      <SlotPreview spread={spread} filled={picked} />

      {/* карусель-дуга */}
      <div style={{ flex:1, position:'relative', minHeight:230 }}>
        {/* золотое свечение «довериться случаю» */}
        {shuf === 'fate' && (
          <div style={{ position:'absolute', left:'50%', top:'56%', width:340, height:340, marginLeft:-170, marginTop:-170,
            borderRadius:'50%', pointerEvents:'none', zIndex:500, animation:'fateGlow .72s ease-out both',
            background:'radial-gradient(circle, rgba(220,184,106,.42) 0%, rgba(220,184,106,.16) 38%, transparent 68%)' }} />
        )}
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position:'absolute', inset:0, touchAction:'none', cursor: drag.current.active?'grabbing':'grab' }}>
          <div style={{ position:'absolute', left:'50%', top:'56%', width:0, height:0 }}>
            {order.map((id, i) => {
              const pos = i - scroll;
              const flyingThis = flying.includes(id);
              if (Math.abs(pos) > 5.6 && !busy && !flyingThis) return null;
              let tf, op = 1, z, glow = false;
              if (flyingThis) {
                tf = 'translate(0px,-430px) rotate(720deg) scale(.42)'; op = 0; z = 600; glow = true;
              } else if (shuf === 'gather') {
                const r = ((id * 37) % 17) - 8;
                tf = `translate(0px,0px) rotate(${r}deg) scale(.9)`; z = 300 - i;
              } else if (shuf === 'fate') {
                // сбор в аккуратную светящуюся стопку с лёгким веером
                const r = (i - center) * 0.9;
                tf = `translate(${(i-center)*1.4}px, -6px) rotate(${r}deg) scale(1.02)`;
                z = 300 - Math.abs(i - center); glow = true;
              } else if (shuf === 'burst') {
                const ang = (i / order.length) * Math.PI * 2;
                const Rx = 132, Ry = 92;
                tf = `translate(${Math.cos(ang)*Rx}px, ${Math.sin(ang)*Ry}px) rotate(${ang*57+90}deg) scale(1)`;
                z = 300 - i;
              } else {
                const focus = Math.abs(pos) < 0.5;
                const isSel = id === selected;
                const x = pos * SP;
                let y = Math.pow(Math.abs(pos), 1.45) * 6 - (focus ? 16 : 0);
                const rot = isSel ? 0 : pos * 3.2;
                let sc = focus ? 1.07 : 1;
                if (isSel) { y -= 40; sc = 1.2; }                 // выбранная карта приподнята
                tf = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`;
                z = isSel ? 500 : focus ? 400 : 300 - Math.round(Math.abs(pos) * 10);
                glow = focus || isSel;
                if (Math.abs(pos) > 5) op = 0;
              }
              const isSelected = id === selected && !flyingThis && !busy;
              return (
                <div key={id} data-cardid={id} onClick={() => tapCard(id)}
                  style={{ position:'absolute', left:0, top:0, width:W, height:H,
                    marginLeft:-W/2, marginTop:-H/2, transformOrigin:'50% 60%', transform:tf, opacity:op, zIndex:z,
                    cursor: busy?'default':'pointer',
                    transition:`transform ${flyingThis?'.56s':'.5s'} cubic-bezier(.34,.8,.3,1), opacity .4s`,
                    filter: glow ? `brightness(1.18)${isSelected?' drop-shadow(0 0 16px var(--gold))':''}` : 'none' }}>
                  <CardBack w={W} glow={glow} />
                  {isSelected && (
                    <div style={{ position:'absolute', top:-26, left:'50%', transform:'translateX(-50%)',
                      whiteSpace:'nowrap', fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'var(--on-gold)',
                      background:'var(--gold)', padding:'3px 8px', borderRadius:7, fontWeight:600,
                      boxShadow:'0 4px 12px rgba(0,0,0,.4)' }}>Вытянуть ↑</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* стрелки-листалки */}
        {!done && (<>
          <ArcArrow dir="left"  disabled={busy || scroll <= 0.5}            onClick={() => page(-1)} />
          <ArcArrow dir="right" disabled={busy || scroll >= maxScroll-0.5}  onClick={() => page(1)} />
        </>)}
      </div>

      {/* нижняя панель */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:13, padding:'0 20px 18px' }}>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:15, color: selected!=null ? 'var(--gold)' : 'var(--muted)', minHeight:20 }}>
          {done ? 'Карты легли — узор готов' : busy ? 'Тасую колоду…'
            : selected!=null ? 'Коснитесь ещё раз или потяните карту вверх'
            : 'Свайп или стрелки · коснитесь карты, чтобы выбрать'}</div>
        <div style={{ display:'flex', gap:11 }}>
          <button onClick={doShuffle} disabled={done||busy} title="Перетасовать"
            style={{ display:'grid', placeItems:'center', width:50, height:50, borderRadius:14,
              cursor: (done||busy)?'default':'pointer', opacity:(done||busy)?.4:1, flexShrink:0,
              background:'var(--panel)', border:'1px solid var(--gold-line)', color:'var(--gold)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transition:'transform .8s cubic-bezier(.4,.1,.2,1)', transform: busy?'rotate(360deg)':'none' }}>
              <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M21 16v5h-5M14 14l7 7M3 8V3h5M10 10L3 3"/>
            </svg>
          </button>
          <button onClick={trustFate} disabled={done||busy||flying.length>0}
            style={{ display:'flex', alignItems:'center', gap:9, padding:'0 24px', height:50, borderRadius:14,
              cursor:(done||busy)?'default':'pointer', opacity:(done||busy)?.5:1,
              background:'var(--panel)', border:'1px solid var(--gold)', color:'var(--gold)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/>
              <circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>
            <span style={{ fontSize:14, fontWeight:500, letterSpacing:1, textTransform:'uppercase' }}>Довериться случаю</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ArcArrow({ dir, onClick, disabled }) {
  const left = dir === 'left';
  return (
    <button onClick={onClick} disabled={disabled} style={{ position:'absolute', top:'56%',
      [left?'left':'right']:8, transform:'translateY(-50%)', width:46, height:46, borderRadius:25,
      display:'grid', placeItems:'center', cursor: disabled?'default':'pointer', zIndex:500,
      background:'rgba(12,10,24,.6)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      border:'1px solid var(--gold)', color:'var(--gold)', opacity: disabled?.3:1,
      boxShadow:'0 6px 18px rgba(0,0,0,.4)', transition:'opacity .2s' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" style={{ transform: left?'none':'scaleX(-1)' }}>
        <path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

// ── Ожидание ("маг формирует предсказание") ──
function ThinkingScreen({ question }) {
  const lines = ['Тасую энергии вопроса…','Слушаю шёпот арканов…','Складываю узор судьбы…'];
  const [li, setLi] = React.useState(0);
  React.useEffect(()=>{ const t=setInterval(()=>setLi(v=>(v+1)%lines.length),1100); return ()=>clearInterval(t); },[]);
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 32px' }}>
      <div style={{ position:'relative', width:170, height:170, display:'grid', placeItems:'center' }}>
        <svg className="spin-slow" width="170" height="170" viewBox="0 0 170 170" style={{ position:'absolute', color:'var(--gold-line)' }}>
          <circle cx="85" cy="85" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 9"/>
        </svg>
        <svg className="spin-rev" width="134" height="134" viewBox="0 0 134 134" style={{ position:'absolute', color:'var(--gold-line)' }}>
          <circle cx="67" cy="67" r="62" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 14"/>
        </svg>
        <div className="float" style={{ color:'var(--gold)', filter:'drop-shadow(0 0 18px var(--glow-soft))' }}>
          <Glyph k="moon" size={56} />
        </div>
      </div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)', marginTop:34 }}>Маг формирует предсказание</div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:17, color:'var(--gold)', marginTop:8, minHeight:24, transition:'.3s' }}>{lines[li]}</div>
      <div style={{ display:'flex', gap:7, marginTop:22 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:9, background:'var(--gold)',
          animation:`dotPulse 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, QuestionScreen, DeckScreen, ThinkingScreen, Back, Crown, Lock });
