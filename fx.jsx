// fx.jsx — Фон со звёздами/частицами, переходы, UI-примитивы

// Парящие звёзды/частицы на фоне (canvas)
function StarField({ density = 1 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    let raf, W, H, stars = [], t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const r = cv.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      const n = Math.round((W * H) / 9000 * density);
      stars = Array.from({ length: n }, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.3 + 0.3, sp: Math.random()*0.25 + 0.04,
        ph: Math.random()*Math.PI*2, tw: Math.random()*0.02 + 0.005,
        drift: (Math.random()-0.5)*0.08,
      }));
    }
    resize();
    const gold = getComputedStyle(cv).getPropertyValue('--star') || '#d4af6a';
    function frame() {
      t += 1; ctx.clearRect(0,0,W,H);
      for (const s of stars) {
        s.y -= s.sp; s.x += s.drift;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random()*W; }
        if (s.x < -2) s.x = W+2; if (s.x > W+2) s.x = -2;
        const a = 0.35 + Math.sin(t*s.tw + s.ph) * 0.35;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = gold.trim(); ctx.globalAlpha = Math.max(0, a);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    frame();
    const ro = new ResizeObserver(resize); ro.observe(cv.parentElement);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [density]);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%',
    '--star':'var(--glow)', pointerEvents:'none' }} />;
}

// Кнопка-золото
function GoldButton({ children, onClick, variant = 'solid', full, style = {}, disabled }) {
  const base = {
    fontFamily:'Jost, sans-serif', fontSize:16, fontWeight:500, letterSpacing:0.5,
    padding:'15px 26px', borderRadius:14, cursor: disabled?'default':'pointer', border:'none',
    width: full?'100%':'auto', position:'relative', overflow:'hidden',
    transition:'transform .15s ease, box-shadow .25s ease', opacity: disabled?0.45:1,
    ...style,
  };
  const skin = variant === 'solid' ? {
    background:'linear-gradient(135deg, var(--gold), var(--gold-deep))',
    color:'var(--on-gold)',
    boxShadow:'0 8px 24px var(--glow-soft), inset 0 1px 0 rgba(255,255,255,.35)',
  } : variant === 'ghost' ? {
    background:'rgba(255,255,255,.04)', color:'var(--gold)',
    boxShadow:'inset 0 0 0 1px var(--gold-line)',
  } : { background:'transparent', color:'var(--muted)', boxShadow:'none' };
  return (
    <button onClick={disabled?undefined:onClick}
      onMouseDown={e=>!disabled&&(e.currentTarget.style.transform='scale(.97)')}
      onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
      style={{ ...base, ...skin }}>
      {variant==='solid' && <span className="btn-sheen" />}
      <span style={{ position:'relative', zIndex:1 }}>{children}</span>
    </button>
  );
}

// Обёртка-экран с плавным появлением
function Screen({ children, k }) {
  return <div key={k} className="screen-in" style={{
    position:'absolute', inset:0, display:'flex', flexDirection:'column',
    overflow:'hidden',
  }}>{children}</div>;
}

// Заголовок секции (эзотерический разделитель)
function Ornament({ style }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, ...style }}>
      <div style={{ width:34, height:1, background:'linear-gradient(90deg, transparent, var(--gold-line))' }} />
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ color:'var(--gold)' }}>
        <path d="M7 0l1.6 5.4L14 7l-5.4 1.6L7 14l-1.6-5.4L0 7l5.4-1.6z" fill="currentColor"/>
      </svg>
      <div style={{ width:34, height:1, background:'linear-gradient(90deg, var(--gold-line), transparent)' }} />
    </div>
  );
}

Object.assign(window, { StarField, GoldButton, Screen, Ornament });
