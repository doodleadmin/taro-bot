// screens-extra.jsx — Результат расклада, История, Подписка, Натальная карта

// Раскладка карт результата на основе нормализованных LAYOUTS
function ReadingBoard({ spread, draw, revealed, active, setActive, listRef }) {
  const lay = LAYOUTS[spread.count] || LAYOUTS[1];
  const big = spread.count >= 10;
  const square = spread.count >= 10;
  const cw = spread.count === 1 ? 150 : spread.count === 3 ? 92 : spread.count === 5 ? 84 : spread.count === 12 ? 50 : 46;
  const boxH = square ? (spread.count >= 12 ? 320 : 300) : (spread.count === 5 ? 300 : 230);
  const boxW = square ? 320 : null;
  return (
    <div style={{ position:'relative', margin:'14px auto 0', height:boxH,
      width: boxW || '100%', maxWidth: boxW || 360 }}>
      {draw.map((d,i)=>{
        const p = lay[i] || {x:50,y:50}; const show = i < revealed;
        return (
          <div key={i} onClick={()=>{ setActive(i);
              const el=listRef.current?.children[i]; const sc=listRef.current?.closest('.noscroll');
              if(el&&sc){ sc.scrollTo({ top: el.offsetTop - 80, behavior:'smooth' }); } }}
            style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
              transform:`translate(-50%,-50%) rotate(${p.rot||0}deg)`,
              zIndex: i===active ? 50 : (p.rot ? 6 : 5 - Math.round(Math.abs(p.y-50)/20)),
              transition:'transform .4s', borderRadius:7,
              outline: i===active ? '2px solid var(--gold)' : 'none', outlineOffset:3,
              boxShadow: i===active ? '0 0 18px var(--glow-soft)' : 'none' }}>
            <FlipCard card={d.card} w={cw} flipped={show} reversed={d.reversed} delay={i*40} />
          </div>
        );
      })}
    </div>
  );
}

// ── Результат расклада ──
function ReadingScreen({ spread, question, draw, extra, onBack, onNew }) {
  const [revealed, setRevealed] = React.useState(0);
  const [active, setActive] = React.useState(0);
  const [zoom, setZoom] = React.useState(null);   // индекс увеличенной карты
  const deckId = React.useContext(DeckContext);
  const listRef = React.useRef(null);
  React.useEffect(() => {
    if (revealed >= draw.length) return;
    const t = setTimeout(()=>setRevealed(v=>v+1), revealed===0?500:420);
    return ()=>clearTimeout(t);
  }, [revealed, draw.length]);
  const done = revealed >= draw.length;
  const verdict = spread.verdict ? (draw[0] && !draw[0].reversed ? 'ДА' : 'НЕТ') : null;

  // ── ИИ-трактовка: маг анализирует расклад целиком ──
  const [ai, setAi] = React.useState({ state:'idle', cards:[], summary:'' });
  const askedRef = React.useRef(false);
  React.useEffect(() => {
    if (!done || askedRef.current) return;
    askedRef.current = true;
    let alive = true;
    (async () => {
      setAi(a => ({ ...a, state:'loading' }));
      try {
        if (!(window.claude && window.claude.complete)) throw new Error('no-ai');
        const deckTitle = (window.DECKS.find(d=>d.id===deckId)||{}).title || '';
        const big = draw.length >= 10, mid = draw.length >= 5;
        const perCard = big ? '3–4 предложения' : mid ? '2–3 предложения' : '2–3 предложения';
        const sumLen = big ? '5–7 предложений' : mid ? '4–5 предложений' : '3–4 предложения';
        const lines = draw.map((d,i) => {
          const pos = spread.positions[i] || `Карта ${i+1}`;
          const desc = (window.CARD_DESC?.[deckId]?.[d.card.n] || '').slice(0,260);
          return `${i+1}. Позиция «${pos}»: ${cardTitle(d.card)}${d.reversed?' (перевёрнутая)':''}. Ключ: ${d.card.key}. Смысл: ${desc}`;
        }).join('\n');
        let pairBlock = '';
        if (extra && extra.a && extra.a.name) {
          const fmt = p => `${p.name||'—'}${p.date?`, род. ${p.date}`:''}${p.city?`, ${p.city}`:''}`;
          pairBlock = `\nЛюди в раскладе: ${extra.labelA||'Первый'} — ${fmt(extra.a)}; ${extra.labelB||'Второй'} — ${fmt(extra.b)}. Обращайся к ним по именам и учитывай их в трактовке.`;
        }
        const prompt =
`Ты — мудрый, тёплый и красноречивый таролог. Сделай глубокую трактовку расклада на русском, обращаясь на «вы».
Расклад: «${spread.title}» (${draw.length} карт). Колода: «${deckTitle}».
Вопрос человека: "${question}"${pairBlock}
Выпавшие карты:
${lines}

Это ${big?'большой и важный':'значимый'} расклад — дай развёрнутую, насыщенную и интересную для чтения трактовку. По КАЖДОЙ позиции напиши ${perCard}: что означает карта именно в этой позиции и в контексте вопроса, как она влияет на ситуацию, и что с этим делать. Свяжи карты между собой в единую живую историю, учитывай позиции, соседство карт и перевёрнутость. Пиши образно и тепло, без «воды» и канцелярита.
Верни СТРОГО валидный JSON без markdown и пояснений, по схеме:
{"cards": [${draw.map((_,i)=>`"подробная трактовка позиции ${i+1} (${perCard})"`).join(', ')}], "summary": "цельный вывод по всему раскладу и конкретный практический совет (${sumLen})"}`;
        const raw = await window.claude.complete(prompt);
        let txt = String(raw).trim().replace(/^```(json)?/i,'').replace(/```$/,'').trim();
        const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
        if (s>=0 && e>s) txt = txt.slice(s, e+1);
        const parsed = JSON.parse(txt);
        if (!alive) return;
        const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
        setAi({ state:'done', cards, summary: parsed.summary || summarise(draw, spread) });
      } catch (err) {
        if (!alive) return;
        setAi({ state:'error', cards:[], summary: summarise(draw, spread) });
      }
    })();
    return () => { alive = false; };
  }, [done]);
  const cardText = (d, i) => (ai.cards[i]) || (d.reversed ? d.card.rev : d.card.up);

  return (
    <React.Fragment>
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 0 110px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 20px' }}>
        <Back onClick={onBack} />
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
          <div style={{ fontSize:12.5, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>«{question}»</div>
        </div>
      </div>

      <ReadingBoard spread={spread} draw={draw} revealed={revealed} active={active} setActive={setActive} listRef={listRef} />

      {!done && (
        <div style={{ textAlign:'center', color:'var(--gold)', fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic', fontSize:16, marginTop:10 }}>Карты раскрываются…</div>
      )}

      {done && verdict && (
        <div className="screen-in" style={{ textAlign:'center', marginTop:6 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:46, letterSpacing:4,
            color:'var(--gold)', filter:'drop-shadow(0 0 16px var(--glow-soft))' }}>{verdict}</div>
        </div>
      )}

      {done && (
        <div className="screen-in" style={{ padding:'4px 20px 0' }}>
          <Ornament style={{ margin:'18px 0' }} />
          <div ref={listRef} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {draw.map((d,i)=>(
              <div key={i} onClick={()=>setActive(i)} style={{ display:'flex', gap:13, padding:'14px 15px', borderRadius:16,
                background:'var(--panel)', cursor:'pointer', alignItems:'stretch',
                border:`1px solid ${i===active?'var(--gold)':'var(--gold-line)'}`, transition:'border .2s' }}>
                {/* миниатюра карты — тап увеличивает */}
                <div onClick={(e)=>{ e.stopPropagation(); setActive(i); setZoom(i); }}
                  style={{ position:'relative', flexShrink:0, cursor:'zoom-in' }}>
                  <CardFace card={d.card} reversed={d.reversed} w={62} />
                  <span style={{ position:'absolute', bottom:5, right:5, width:18, height:18, borderRadius:9,
                    display:'grid', placeItems:'center', background:'rgba(12,10,24,.75)', border:'1px solid var(--gold-line)',
                    color:'var(--gold)', backdropFilter:'blur(4px)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 12h10M12 7v10"/></svg>
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)' }}>
                      {spread.positions[i] || `Карта ${i+1}`}</span>
                    {d.reversed && <span style={{ fontSize:10, color:'var(--muted)', border:'1px solid var(--gold-line)',
                      borderRadius:6, padding:'1px 6px' }}>перевёрнута</span>}
                  </div>
                  <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>
                    {cardTitle(d.card)}</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:15.5, color:'var(--muted)',
                    lineHeight:1.4, marginTop:4 }}>
                    {ai.state==='loading' && !ai.cards[i]
                      ? <span className="ai-shimmer">Маг вглядывается в карту…</span>
                      : ai.cards[i]
                        ? ai.cards[i]
                        : <React.Fragment><span style={{ color:'var(--gold)' }}>{POSITION_HINTS[spread.positions[i]] || ''} </span>{d.reversed ? d.card.rev : d.card.up}</React.Fragment>}</div>
                </div>
              </div>
            ))}
          </div>

          {/* общий итог — трактовка от ИИ */}
          <div style={{ marginTop:16, padding:'18px 18px', borderRadius:18, position:'relative', overflow:'hidden',
            background:'linear-gradient(160deg, var(--back-1), transparent)', border:'1px solid var(--gold-line)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
              <span style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--gold)' }}>Слово мага</span>
              {ai.state==='loading' && <span style={{ width:5, height:5, borderRadius:3, background:'var(--gold)',
                boxShadow:'0 0 6px var(--gold)', animation:'pulse 1s infinite' }} />}
            </div>
            {ai.state==='loading' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span className="ai-line" style={{ width:'92%' }} />
                <span className="ai-line" style={{ width:'100%' }} />
                <span className="ai-line" style={{ width:'78%' }} />
              </div>
            ) : (
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:17, color:'var(--text)', lineHeight:1.55, fontStyle:'italic' }}>
                {ai.summary}</div>
            )}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <GoldButton variant="ghost" style={{ flex:1 }} onClick={onBack}>В историю</GoldButton>
            <GoldButton style={{ flex:1 }} onClick={onNew}>Новое гадание</GoldButton>
          </div>
        </div>
      )}
    </div>
    {zoom!=null && <CardZoom draw={draw} index={zoom} spread={spread} deckId={deckId}
      onClose={()=>setZoom(null)} onNav={(n)=>setZoom(n)} />}
    </React.Fragment>
  );
}

// Полноэкранный просмотр карты
function CardZoom({ draw, index, spread, deckId, onClose, onNav }) {
  const d = draw[index];
  const total = draw.length;
  const go = (dir) => { const n = (index + dir + total) % total; onNav(n); };
  const desc = (window.CARD_DESC && window.CARD_DESC[deckId] && window.CARD_DESC[deckId][d.card.n]) || '';
  return (
    <div onClick={onClose} style={{ position:'absolute', inset:0, zIndex:200,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px',
      background:'rgba(6,5,14,.82)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
      animation:'screenIn .3s ease both' }}>
      {/* закрыть */}
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:42, height:42, borderRadius:21,
        display:'grid', placeItems:'center', cursor:'pointer', color:'var(--gold)',
        background:'rgba(12,10,24,.6)', border:'1px solid var(--gold-line)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <div style={{ fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--gold)', marginBottom:14 }}>
        {spread.positions[index] || `Карта ${index+1}`}</div>

      <div onClick={(e)=>e.stopPropagation()} style={{ position:'relative', display:'flex', alignItems:'center', gap:14 }}>
        {total>1 && <button onClick={()=>go(-1)} style={zoomArrow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>}
        <div className="float" style={{ filter:'drop-shadow(0 18px 40px rgba(0,0,0,.6))' }}>
          <CardFace card={d.card} reversed={d.reversed} w={232} />
        </div>
        {total>1 && <button onClick={()=>go(1)} style={zoomArrow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform:'scaleX(-1)' }}><path d="M15 5l-7 7 7 7"/></svg></button>}
      </div>

      <div className="noscroll" style={{ textAlign:'center', marginTop:16, maxWidth:330, maxHeight:200, overflowY:'auto', padding:'0 4px' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:23, color:'var(--text)' }}>
          {cardTitle(d.card)}{d.reversed && <span style={{ fontSize:14, color:'var(--muted)' }}> · перевёрнута</span>}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:17, color:'var(--gold)', marginTop:6, fontStyle:'italic' }}>
          {d.card.key}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--text)', marginTop:10, lineHeight:1.45 }}>
          {d.reversed ? d.card.rev : d.card.up}</div>
        {desc && <React.Fragment>
          <div style={{ height:1, background:'var(--gold-line)', margin:'12px auto', width:60 }} />
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:14.5, color:'var(--muted)', lineHeight:1.5, textAlign:'left' }}>
            {desc}</div>
        </React.Fragment>}
      </div>
      {total>1 && <div style={{ marginTop:16, fontSize:12, letterSpacing:1, color:'var(--muted)' }}>{index+1} / {total}</div>}
    </div>
  );
}
const zoomArrow = { width:40, height:40, borderRadius:20, display:'grid', placeItems:'center', flexShrink:0,
  cursor:'pointer', color:'var(--gold)', background:'rgba(12,10,24,.6)', border:'1px solid var(--gold-line)' };

function summarise(draw, spread) {
  const names = draw.map(d=>d.card.name);
  const lead = draw[draw.length-1];
  const tone = lead.reversed ? 'Прислушайтесь к внутреннему сопротивлению — оно подсказывает, где притормозить.'
    : 'Карты складываются благоприятно — доверьтесь движению и сделайте шаг.';
  return `Через ваш вопрос проходит линия ${names.slice(0,2).join(' и ')}. ${tone} Ключевой акцент — «${lead.card.key.toLowerCase()}».`;
}

// ── История ──
function HistoryScreen({ history, onOpen, onStart }) {
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'4px 0 96px' }}>
      <div style={{ padding:'8px 20px 6px' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)' }}>История</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Ваши прошлые гадания</div>
      </div>
      {history.length===0 ? (
        <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 30px' }}>
          <div style={{ color:'var(--gold)', opacity:.5, marginBottom:14 }}><Glyph k="hermit" size={48} /></div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18 }}>Пока тишина. Задайте первый вопрос картам.</div>
        </div>
      ) : (
        <div style={{ padding:'8px 20px', display:'flex', flexDirection:'column', gap:11 }}>
          {history.map(h=>{
            const sp = SPREADS[h.spread];
            return (
              <button key={h.id} onClick={()=>onOpen(h)} style={{ display:'flex', gap:14, alignItems:'center',
                padding:'13px 14px', borderRadius:16, cursor:'pointer', textAlign:'left',
                background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
                <div style={{ display:'flex' }}>
                  {h.cards.slice(0,3).map((ci,k)=>(
                    <div key={k} style={{ marginLeft:k?-18:0, zIndex:3-k }}><CardBack w={34} /></div>
                  ))}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.q}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{sp?.title} · {h.date}</div>
                </div>
                <span style={{ color:'var(--gold)', opacity:.6 }}>
                  <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.5 1l6 6.5-6 6.5"/></svg></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Подписка / оплата ──
// аватар из Telegram (плейсхолдер с инициалом)
function TgAvatar({ size = 64 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', position:'relative', flexShrink:0,
      background:'linear-gradient(135deg, var(--gold), var(--gold-deep))', display:'grid', placeItems:'center',
      boxShadow:'0 8px 22px var(--glow-soft)' }}>
      <span style={{ fontFamily:'Marcellus, serif', fontSize:size*0.42, color:'var(--on-gold)' }}>{TG_PROFILE.initials}</span>
      <span style={{ position:'absolute', right:-1, bottom:-1, width:size*0.32, height:size*0.32, borderRadius:'50%',
        background:'#229ED9', border:'2px solid var(--bg1)', display:'grid', placeItems:'center' }}>
        <svg width={size*0.18} height={size*0.18} viewBox="0 0 24 24" fill="#fff"><path d="M21 4L3 11l5 2 2 6 3-4 5 3z"/></svg>
      </span>
    </div>
  );
}

// ── Профиль ──
function ProfileScreen({ balance, txns, history, freeAvailable, deck, onDeck, onTopup }) {
  const fav = (() => {
    const cnt = {}; history.forEach(h => cnt[h.spread] = (cnt[h.spread]||0)+1);
    const top = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
    return top ? (SPREADS[top[0]]?.title || '—') : '—';
  })();
  const txIcon = { topup:'+', spend:'−', free:'✦' };
  const txColor = { topup:'#7fe0b4', spend:'var(--gold)', free:'var(--muted)' };
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 100px' }}>
      {/* шапка профиля */}
      <div style={{ display:'flex', alignItems:'center', gap:15, marginTop:4 }}>
        <TgAvatar size={64} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:22, color:'var(--text)' }}>{TG_PROFILE.name}</div>
          <div style={{ fontSize:13, color:'var(--gold)' }}>{TG_PROFILE.username}</div>
          <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>{TG_PROFILE.joined}</div>
        </div>
      </div>

      {/* баланс */}
      <div style={{ position:'relative', marginTop:18, padding:'20px 20px', borderRadius:20, overflow:'hidden',
        background:'linear-gradient(135deg, var(--gold-deep)33, var(--panel))', border:'1px solid var(--gold-line)' }}>
        <div className="sheen-band" style={{ opacity:.5 }} />
        <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)' }}>Баланс</div>
            <div style={{ fontFamily:'Marcellus, serif', fontSize:40, color:'var(--gold)', lineHeight:1.05, marginTop:4 }}>{balance} ₽</div>
          </div>
          <GoldButton onClick={onTopup} style={{ padding:'12px 20px' }}>Пополнить</GoldButton>
        </div>
      </div>

      {/* статус бесплатного расклада */}
      <div style={{ marginTop:12, padding:'14px 16px', borderRadius:16, display:'flex', alignItems:'center', gap:12,
        background:'var(--panel)', border:`1px solid ${freeAvailable?'rgba(95,208,160,.5)':'var(--gold-line)'}` }}>
        <span style={{ display:'grid', placeItems:'center', width:40, height:40, borderRadius:12, flexShrink:0,
          color: freeAvailable?'#7fe0b4':'var(--muted)',
          background: freeAvailable?'rgba(95,208,160,.14)':'var(--back-1)', border:'1px solid var(--gold-line)' }}>
          <Glyph k="sun" size={22} /></span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)' }}>Бесплатный расклад</div>
          <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:1 }}>
            {freeAvailable ? 'Доступен сейчас — простой расклад бесплатно' : 'Использован · следующий завтра'}</div>
        </div>
        <span style={{ fontSize:12, fontWeight:600, color: freeAvailable?'#7fe0b4':'var(--muted)' }}>
          {freeAvailable ? 'Готов' : 'Завтра'}</span>
      </div>

      {/* выбор колоды */}
      <div style={{ marginTop:22, marginBottom:11, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>Колода карт</div>
        <span style={{ fontSize:12, color:'var(--muted)' }}>стиль иллюстраций</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {DECKS.map(d => {
          const on = deck === d.id;
          return (
            <button key={d.id} onClick={()=>onDeck(d.id)} style={{ position:'relative', textAlign:'center',
              padding:'10px 8px 11px', borderRadius:16, cursor:'pointer', overflow:'hidden',
              background:'var(--panel)', border:`1.5px solid ${on?d.accent:'var(--gold-line)'}`, transition:'.2s' }}>
              <div style={{ width:'100%', aspectRatio:'2/3', borderRadius:9, overflow:'hidden', marginBottom:8,
                boxShadow:'0 6px 14px rgba(0,0,0,.4)', background:'#0c0c18',
                outline: on?`2px solid ${d.accent}`:'none', outlineOffset:1 }}>
                <DeckThumb deck={d} />
              </div>
              <div style={{ fontFamily:'Marcellus, serif', fontSize:12.5, color:'var(--text)', lineHeight:1.1 }}>{d.title}</div>
              <div style={{ fontSize:9.5, color:'var(--muted)', marginTop:2, lineHeight:1.15 }}>{d.sub}</div>
              {on && <span style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:10,
                display:'grid', placeItems:'center', background:d.accent, color:'#1a1408' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 6"/></svg></span>}
            </button>
          );
        })}
      </div>

      {/* статистика */}
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

      {/* история транзакций */}
      <div style={{ marginTop:22, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--text)' }}>История трат</div>
        <span style={{ fontSize:12, color:'var(--muted)' }}>{txns.length} операций</span>
      </div>
      <div style={{ marginTop:11, display:'flex', flexDirection:'column', gap:9 }}>
        {txns.slice(0,12).map(x => (
          <div key={x.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14,
            background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
            <span style={{ display:'grid', placeItems:'center', width:34, height:34, borderRadius:10, flexShrink:0,
              fontSize:18, color:txColor[x.type], background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>{txIcon[x.type]}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.title}</div>
              <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{x.date}</div>
            </div>
            <span style={{ fontFamily:'Marcellus, serif', fontSize:16, whiteSpace:'nowrap',
              color: x.amount>0?'#7fe0b4':x.amount<0?'var(--gold)':'var(--muted)' }}>
              {x.amount>0?`+${x.amount}`:x.amount<0?`${x.amount}`:'0'} ₽</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Превью колоды (карта Луна — n:18)
function DeckThumb({ deck }) {
  if (deck.kind === 'image') {
    return <img src={`${deck.path}/18.jpg`} alt={deck.title}
      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />;
  }
  return (
    <div style={{ width:'100%', height:'100%', position:'relative', background:'var(--card-bg)',
      display:'grid', placeItems:'center', color:'var(--gold)' }}>
      <div style={{ position:'absolute', inset:5, borderRadius:5, border:'1px solid var(--gold-line)' }} />
      <Glyph k="moon" size={34} />
    </div>
  );
}

// ── Пополнение баланса ──
function TopUpScreen({ balance, need, onBack, onBuy }) {
  const [sel, setSel] = React.useState('t300');
  const pkg = TOPUP.find(p=>p.id===sel);
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
            Для «{need.title}» нужно ещё <b style={{ color:'var(--gold)' }}>{Math.max(0, need.price - balance)} ₽</b></span>
        </div>
      )}

      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--muted)', textAlign:'center', margin:'8px 0 16px' }}>
        Платите только за то, чем пользуетесь — без подписок</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {TOPUP.map(p=>{
          const on = sel===p.id;
          return (
            <button key={p.id} onClick={()=>setSel(p.id)} style={{ position:'relative', textAlign:'left',
              padding:'16px 16px', borderRadius:18, cursor:'pointer', overflow:'hidden',
              background: on?'linear-gradient(135deg, var(--back-1), transparent)':'var(--panel)',
              border:`1.5px solid ${on?'var(--gold)':'var(--gold-line)'}`, transition:'.2s' }}>
              {p.best && <span style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700,
                letterSpacing:1, textTransform:'uppercase', color:'var(--on-gold)', background:'var(--gold)',
                borderRadius:6, padding:'2px 7px' }}>Хит</span>}
              <div style={{ fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)' }}>{p.label}</div>
              <div style={{ fontFamily:'Marcellus, serif', fontSize:26, color:'var(--text)', marginTop:6 }}>{p.amount} ₽</div>
              {p.bonus>0
                ? <div style={{ fontSize:12.5, color:'#7fe0b4', marginTop:3 }}>+{p.bonus} ₽ бонус</div>
                : <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:3 }}>без бонуса</div>}
            </button>
          );
        })}
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'16px 20px 22px',
        background:'linear-gradient(0deg, var(--bg1) 55%, transparent)' }}>
        <GoldButton full onClick={()=>onBuy(pkg)}>
          Пополнить на {pkg.amount + pkg.bonus} ₽</GoldButton>
        <div style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginTop:9 }}>
          Оплата картой или через Telegram · Безопасно</div>
      </div>
    </div>
  );
}

// ── Натальная карта ──
function NatalScreen({ onBack }) {
  const [stage, setStage] = React.useState('form');
  const [form, setForm] = React.useState({ name:'', date:'', time:'', city:'' });
  const [build, setBuild] = React.useState(0);
  const [chart, setChart] = React.useState(null);
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));

  const goResult = () => { setChart(window.computeNatal(form)); setStage('result'); };

  React.useEffect(() => {
    if (stage !== 'result') { setBuild(0); return; }
    setBuild(0);
    const dur = 2600, t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setBuild(p);
      if (p >= 1) clearInterval(iv);
    }, 40);
    // гарантированное завершение, даже если вкладка ушла в фон
    const done = setTimeout(() => setBuild(1), dur + 400);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [stage]);

  const field = (label, k, type='text', ph='') => (
    <div>
      <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:1, marginBottom:6 }}>{label}</div>
      <input type={type} value={form[k]} placeholder={ph} onChange={e=>set(k,e.target.value)}
        style={{ width:'100%', background:'var(--panel)', border:'1px solid var(--gold-line)', borderRadius:13,
          padding:'13px 15px', color:'var(--text)', fontSize:15.5, outline:'none' }} />
    </div>
  );
  if (stage==='form') {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 20px 26px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <Back onClick={onBack} /><div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>Натальная карта</div>
        </div>
        <div className="float" style={{ alignSelf:'center', color:'var(--gold)', margin:'8px 0 16px',
          filter:'drop-shadow(0 0 14px var(--glow-soft))' }}><Glyph k="world" size={54} /></div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16.5, color:'var(--muted)', textAlign:'center',
          lineHeight:1.4, marginBottom:22 }}>Введите данные рождения — звёзды раскроют ваш характер и предназначение.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {field('Имя','name','text','Как к вам обращаться')}
          {field('Дата рождения','date','date')}
          {field('Время рождения','time','time')}
          {field('Город рождения','city','text','Москва')}
        </div>
        <div style={{ flex:1 }} />
        <GoldButton full onClick={goResult}>Построить карту</GoldButton>
      </div>
    );
  }
  const building = build < 1;
  const ch = chart || {};
  const S = window.SIGNS;
  const sunS = S[ch.sun]||S[0], moonS = S[ch.moon]||S[0], ascS = S[ch.asc]||S[0];
  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 40px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
        <Back onClick={()=>setStage('form')} /><div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>
          {form.name ? `Карта · ${form.name}` : 'Ваша карта'}</div>
      </div>

      {/* анимированное колесо */}
      <div style={{ position:'relative', margin:'2px auto 4px' }}>
        <NatalWheel size={300} build={build} chart={chart} />
      </div>
      <div style={{ textAlign:'center', minHeight:24, marginBottom:6 }}>
        {building
          ? <span style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:16, color:'var(--gold)' }}>
              Звёзды занимают свои места…</span>
          : <span style={{ fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)' }}>
              ☉ {sunS.n} · ☽ {moonS.n} · ASC {ascS.n}</span>}
      </div>

      {!building && chart && (
        <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:12, marginTop:10 }}>
          {/* Большая тройка */}
          <SectionLabel>Большая тройка</SectionLabel>
          <NatalRow g="☉" s="Солнце · ваша суть"  t={`Солнце в знаке ${sunS.n}`}  d={window.SUN_TEXT[ch.sun]} />
          <NatalRow g="☽" s="Луна · эмоции"        t={`Луна в знаке ${moonS.n}`}   d={window.MOON_TEXT[ch.moon]} />
          <NatalRow g="ASC" s="Асцендент · образ"  t={`Асцендент в ${ascS.n}`}      d={window.ASC_TEXT[ch.asc]} />

          {/* Баланс стихий */}
          <SectionLabel>Баланс стихий</SectionLabel>
          <ElementBalance elements={ch.elements} />

          {/* Планеты */}
          <SectionLabel>Планеты в знаках</SectionLabel>
          {window.PLANET_DEFS.map(p => {
            const sign = ch[p.key]; const sg = S[sign];
            return <NatalRow key={p.key} g={p.sym} s={p.label} t={`${planetName(p.key)} в ${sg.n}`}
              d={window.planetLine(p.lead, sign)} />;
          })}

          {/* Сводка знака */}
          <SectionLabel>Ваш знак Солнца</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <MiniFact k="Стихия" v={`${window.EL_RU[sunS.el]}`} />
            <MiniFact k="Качество" v={sunS.q} />
            <MiniFact k="Управитель" v={sunS.ruler} />
            <MiniFact k="Символ" v={sunS.sym} />
          </div>

          <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:13.5,
            color:'var(--muted)', textAlign:'center', marginTop:8, lineHeight:1.4 }}>
            Карта построена по вашим данным рождения. Введите другие данные — звёзды сложатся иначе.</div>
        </div>
      )}
    </div>
  );
}

// ── Форма данных пары (Отношения / Совместимость) ──
function PairFormScreen({ spread, onBack, onSubmit }) {
  const [a, setA] = React.useState({ name:'', date:'', city:'' });
  const [b, setB] = React.useState({ name:'', date:'', city:'' });
  const [q, setQ] = React.useState('');
  const isLove = spread.id === 'love';
  const labelA = isLove ? 'Вы' : 'Первый человек';
  const labelB = isLove ? 'Партнёр' : 'Второй человек';
  const ready = a.name.trim() && b.name.trim();

  const submit = () => {
    const dq = q.trim() || (isLove
      ? `Что ждёт нас в отношениях: ${a.name} и ${b.name}?`
      : `Насколько совместимы ${a.name} и ${b.name}?`);
    onSubmit({ labelA, labelB, a, b }, dq);
  };

  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
        <Back onClick={onBack} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>{spread.title}</div>
      </div>
      <div className="float" style={{ alignSelf:'center', textAlign:'center', color:'var(--gold)', margin:'2px 0 12px',
        filter:'drop-shadow(0 0 14px var(--glow-soft))' }}><Glyph k={isLove?'lovers':'temperance'} size={46} /></div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16.5, color:'var(--muted)', textAlign:'center',
        lineHeight:1.4, marginBottom:20 }}>
        {isLove
          ? 'Назовите обоих — карты прочтут энергию вашей пары и подскажут, куда движутся отношения.'
          : 'Введите данные двоих — карты сравнят ваши натуры и покажут, в чём вы сходитесь и где растёте.'}</div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <PartnerBlock label={labelA} val={a} setVal={setA} accent="var(--gold)" />
        <div style={{ textAlign:'center', color:'#e06a9a', fontSize:20 }}>♥</div>
        <PartnerBlock label={labelB} val={b} setVal={setB} accent="#e06a9a" />

        <div>
          <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:1, marginBottom:6 }}>Ваш вопрос (по желанию)</div>
          <textarea value={q} onChange={e=>setQ(e.target.value)} rows={2}
            placeholder={isLove? 'Например: есть ли у нас будущее?' : 'Например: стоит ли нам быть вместе?'}
            style={{ width:'100%', boxSizing:'border-box', resize:'none', background:'var(--panel)', border:'1px solid var(--gold-line)', borderRadius:14,
              padding:'13px 15px', color:'var(--text)', fontSize:15, outline:'none', lineHeight:1.4 }} />
        </div>
      </div>

      <div style={{ marginTop:18 }}>
        <GoldButton full onClick={submit} disabled={!ready}>Перейти к колоде</GoldButton>
        {!ready && <div style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:8 }}>
          Укажите имена обоих, чтобы продолжить</div>}
      </div>
    </div>
  );
}
function PartnerBlock({ label, val, setVal, accent }) {
  return (
    <div style={{ padding:'15px 16px', borderRadius:18, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ width:26, height:26, borderRadius:13, display:'grid', placeItems:'center', flexShrink:0,
          background:accent, color:'#1a1408', fontSize:13, fontWeight:700 }}>{label[0]}</span>
        <span style={{ fontFamily:'Marcellus, serif', fontSize:16, color:'var(--text)' }}>{label}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <PairInput label="Имя" ph="Как зовут" value={val.name} onChange={v=>setVal({...val, name:v})} />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}><PairInput label="Дата рождения" type="date" value={val.date} onChange={v=>setVal({...val, date:v})} /></div>
          <div style={{ flex:1 }}><PairInput label="Город рождения" ph="Москва" value={val.city} onChange={v=>setVal({...val, city:v})} /></div>
        </div>
      </div>
    </div>
  );
}
function PairInput({ label, value, onChange, type='text', ph='' }) {
  return (
    <div>
      <div style={{ fontSize:10.5, color:'var(--muted)', letterSpacing:.5, marginBottom:5 }}>{label}</div>
      <input type={type} value={value} placeholder={ph} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', boxSizing:'border-box', background:'var(--back-1)', border:'1px solid var(--gold-line)',
          borderRadius:11, padding:'11px 13px', color:'var(--text)', fontSize:14.5, outline:'none' }} />
    </div>
  );
}

function planetName(key){ return { mercury:'Меркурий', venus:'Венера', mars:'Марс', jupiter:'Юпитер', saturn:'Сатурн' }[key] || key; }

function SectionLabel({ children }) {
  return <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, marginBottom:1 }}>
    <span style={{ height:1, flex:1, background:'var(--gold-line)' }} />
    <span style={{ fontSize:10.5, letterSpacing:2.5, textTransform:'uppercase', color:'var(--gold)' }}>{children}</span>
    <span style={{ height:1, flex:1, background:'var(--gold-line)' }} />
  </div>;
}

function NatalRow({ g, s, t, d }) {
  return (
    <div style={{ display:'flex', gap:13, padding:'14px 15px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ flexShrink:0, width:40, height:40, borderRadius:11, display:'grid', placeItems:'center',
        color:'var(--gold)', fontSize:g.length>2?13:20, fontWeight:g.length>2?700:400,
        background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>{g}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)' }}>{s}</div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--gold)', marginTop:1 }}>{t}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--text)', lineHeight:1.4, marginTop:4 }}>{d}</div>
      </div>
    </div>
  );
}

function ElementBalance({ elements }) {
  const els = [['fire','#e0707a'],['earth','#9bbf6f'],['air','#7a9be0'],['water','#6fb8c0']];
  const total = Object.values(elements||{}).reduce((a,b)=>a+b,0) || 1;
  return (
    <div style={{ padding:'15px 16px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)',
      display:'flex', flexDirection:'column', gap:11 }}>
      {els.map(([k,col])=>{
        const v = (elements&&elements[k])||0; const pct = Math.round(v/total*100);
        return (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:11 }}>
            <span style={{ width:58, fontSize:12.5, color:'var(--text)' }}>{window.EL_RU[k]}</span>
            <div style={{ flex:1, height:8, borderRadius:5, background:'var(--back-1)', overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', borderRadius:5,
                background:`linear-gradient(90deg, ${col}, ${col}aa)`, transition:'width .6s ease' }} />
            </div>
            <span style={{ width:30, textAlign:'right', fontSize:12, color:'var(--muted)' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniFact({ k, v }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:14, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)' }}>{k}</div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--gold)', marginTop:3 }}>{v}</div>
    </div>
  );
}

Object.assign(window, { ReadingScreen, HistoryScreen, ProfileScreen, TopUpScreen, NatalScreen, PairFormScreen });
