import React, { useState, useEffect } from 'react';
import { Glyph } from '../components/cards/Glyph';
import { GoldButton } from '../components/ui/GoldButton';
import {
  computeNatal, SIGNS, SUN_TEXT, MOON_TEXT, ASC_TEXT,
  PLANET_DEFS, planetLine, EL_RU, EL_SYM,
} from '@taro/shared';
import type { NatalResult, NatalForm } from '@taro/shared';
import * as api from '../api/client';

const ZODIAC = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const staticPlanets = [
  { s:'☉', deg:128 }, { s:'☽', deg:342 }, { s:'☿', deg:150 },
  { s:'♀', deg:205 }, { s:'♂', deg:58  }, { s:'♃', deg:285 }, { s:'♄', deg:18  },
];
const staticAspects: [number, number, string][] = [
  [0,4,'t'],[0,2,'h'],[1,3,'s'],[5,6,'t'],[2,5,'h'],[0,3,'s'],[4,6,'h'],
];

// ── Анимированное колесо ──
function NatalWheel({ size = 300, build, chart }: { size: number; build: number; chart: NatalResult | null }) {
  const PL = chart?.planets ?? staticPlanets;
  const ASP = chart?.aspects ?? staticAspects;
  const ascDeg = chart?.ascDeg;
  const c = size/2, rOuter = size*0.46, rZodiac = size*0.39, rInner = size*0.30, rPlanet = size*0.205;
  const pol = (deg: number, r: number): [number, number] => {
    const a = (deg - 90) * Math.PI / 180;
    return [c + Math.cos(a)*r, c + Math.sin(a)*r];
  };
  const ringLen = 2 * Math.PI * rOuter;
  const planetsShown = Math.floor(build * (PL.length + 0.001));
  const aspectsShown = build >= 0.99 ? ASP.length : 0;
  const aColor: Record<string, string> = { t:'#e0707a', h:'#6fbfa0', s:'#7a9be0' };

  return (
    <div style={{ position:'relative', width:size, height:size, margin:'0 auto' }}>
      <div style={{ position:'absolute', inset:'10%', borderRadius:'50%',
        background:'radial-gradient(circle, var(--glow) 0%, transparent 65%)', opacity:.5 }} />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:'relative', overflow:'visible' }}>
        {/* внешнее кольцо */}
        <circle cx={c} cy={c} r={rOuter} fill="none" stroke="var(--gold)" strokeWidth="1.5"
          strokeDasharray={ringLen} strokeDashoffset={ringLen * (1 - Math.min(1, build * 1.4))}
          transform={`rotate(-90 ${c} ${c})`} style={{ transition:'stroke-dashoffset .1s linear', opacity:.9 }} />
        <circle cx={c} cy={c} r={rZodiac} fill="none" stroke="var(--gold-line)" strokeWidth="1"
          opacity={build > 0.1 ? 1 : 0} style={{ transition:'opacity .5s' }} />
        <circle cx={c} cy={c} r={rInner} fill="none" stroke="var(--gold-line)" strokeWidth="1"
          strokeDasharray="2 5" opacity={build > 0.2 ? .8 : 0} style={{ transition:'opacity .5s' }} />

        {/* спицы домов */}
        <g className="spin-rev" style={{ transformOrigin:'center' }}>
          {Array.from({length:12}).map((_, i) => {
            const [x1,y1] = pol(i*30, rInner), [x2,y2] = pol(i*30, rOuter);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold-line)" strokeWidth="0.8"
              opacity={build > 0.15 ? (i*30 < build*360 ? 0.7 : 0.25) : 0} style={{ transition:'opacity .4s' }} />;
          })}
        </g>

        {/* знаки зодиака */}
        <g className="spin-slow" style={{ transformOrigin:'center' }}>
          {ZODIAC.map((z, i) => {
            const [x,y] = pol(i*30+15, (rOuter+rZodiac)/2);
            return <text key={i} x={x} y={y} fill="var(--gold)" fontSize={size*0.052}
              textAnchor="middle" dominantBaseline="central"
              opacity={build > 0.25 ? 0.92 : 0} style={{ transition:`opacity .5s ${i*0.04}s` }}>{z}</text>;
          })}
        </g>

        {/* аспекты */}
        <g>
          {ASP.slice(0, aspectsShown).map(([a, b, t], i) => {
            const [x1,y1] = pol((PL[a] as {deg:number}).deg, rPlanet);
            const [x2,y2] = pol((PL[b] as {deg:number}).deg, rPlanet);
            const len = Math.hypot(x2-x1, y2-y1);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={aColor[t as string]} strokeWidth="1"
              strokeDasharray={len} strokeDashoffset={len} opacity=".55"
              style={{ animation:`drawLine .6s ease ${i*0.12}s forwards` }} />;
          })}
        </g>

        {/* Асцендент */}
        {ascDeg != null && build > 0.5 && (() => {
          const [x1,y1] = pol(ascDeg, rInner), [x2,y2] = pol(ascDeg, rOuter*1.04);
          const [xt,yt] = pol(ascDeg, rOuter*1.13);
          return (
            <g style={{ transition:'opacity .5s' }}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold)" strokeWidth="1.6" />
              <text x={xt} y={yt} fill="var(--gold)" fontSize={size*0.04} textAnchor="middle"
                dominantBaseline="central" fontWeight="600">ASC</text>
            </g>
          );
        })()}

        {/* планеты */}
        <g>
          {PL.slice(0, planetsShown).map((p, i) => {
            const [x,y] = pol((p as {deg:number}).deg, rPlanet);
            return (
              <g key={i} className="screen-in" style={{ transformOrigin:`${x}px ${y}px` }}>
                <circle cx={x} cy={y} r={size*0.038} fill="var(--card-bg)" stroke="var(--gold)" strokeWidth="1"
                  style={{ filter:'drop-shadow(0 0 5px var(--glow-soft))' }} />
                <text x={x} y={y} fill="var(--gold)" fontSize={size*0.046}
                  textAnchor="middle" dominantBaseline="central">
                  {(p as {s?:string; sym?:string}).s ?? (p as {sym?:string}).sym ?? ''}
                </text>
              </g>
            );
          })}
        </g>

        <circle cx={c} cy={c} r={size*0.035} fill="none" stroke="var(--gold)" strokeWidth="1"
          opacity={build > 0.3 ? .7 : 0} style={{ transition:'opacity .5s' }} />
      </svg>

      <div className="float" style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        color:'var(--gold)', opacity: build > 0.3 ? 1 : 0, transition:'opacity .6s',
        filter:'drop-shadow(0 0 10px var(--glow-soft))' }}>
        <Glyph k="sun" size={size*0.12} />
      </div>
    </div>
  );
}

// ── Вспомогательные компоненты ──
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, marginBottom:1 }}>
      <span style={{ height:1, flex:1, background:'var(--gold-line)' }} />
      <span style={{ fontSize:10.5, letterSpacing:2.5, textTransform:'uppercase', color:'var(--gold)' }}>{children}</span>
      <span style={{ height:1, flex:1, background:'var(--gold-line)' }} />
    </div>
  );
}

function NatalRow({ g, s, t, d }: { g: string; s: string; t: string; d: string }) {
  return (
    <div style={{ display:'flex', gap:13, padding:'14px 15px', borderRadius:16,
      background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ flexShrink:0, width:40, height:40, borderRadius:11, display:'grid', placeItems:'center',
        color:'var(--gold)', fontSize: g.length > 2 ? 13 : 20, fontWeight: g.length > 2 ? 700 : 400,
        background:'var(--back-1)', border:'1px solid var(--gold-line)' }}>{g}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)' }}>{s}</div>
        <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--gold)', marginTop:1 }}>{t}</div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'var(--text)', lineHeight:1.4, marginTop:4 }}>{d}</div>
      </div>
    </div>
  );
}

function ElementBalance({ elements }: { elements: NatalResult['elements'] }) {
  const els: [string, string][] = [['fire','#e0707a'],['earth','#9bbf6f'],['air','#7a9be0'],['water','#6fb8c0']];
  const total = Object.values(elements || {}).reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ padding:'15px 16px', borderRadius:16, background:'var(--panel)', border:'1px solid var(--gold-line)',
      display:'flex', flexDirection:'column', gap:11 }}>
      {els.map(([k, col]) => {
        const v = (elements as Record<string, number>)[k] || 0;
        const pct = Math.round(v / total * 100);
        return (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:11 }}>
            <span style={{ width:58, fontSize:12.5, color:'var(--text)' }}>{EL_RU[k as keyof typeof EL_RU]}</span>
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

function MiniFact({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:14, background:'var(--panel)', border:'1px solid var(--gold-line)' }}>
      <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)' }}>{k}</div>
      <div style={{ fontFamily:'Marcellus, serif', fontSize:17, color:'var(--gold)', marginTop:3 }}>{v}</div>
    </div>
  );
}

function planetName(key: string): string {
  const names: Record<string, string> = {
    mercury:'Меркурий', venus:'Венера', mars:'Марс', jupiter:'Юпитер', saturn:'Сатурн',
  };
  return names[key] || key;
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:'var(--panel)', border:'1px solid var(--gold-line)',
      color:'var(--gold)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', cursor:'pointer' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
  );
}

interface NatalScreenProps {
  onBack: () => void;
  onBalanceUpdate?: (b: number) => void;
}

export function NatalScreen({ onBack, onBalanceUpdate }: NatalScreenProps) {
  const [stage, setStage] = useState<'form'|'result'>('form');
  const [form, setForm] = useState({ name:'', date:'', time:'', city:'' });
  const [build, setBuild] = useState(0);
  const [chart, setChart] = useState<NatalResult | null>(null);
  const [apiError, setApiError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  const goResult = async () => {
    const localChart = computeNatal({ name: form.name, date: form.date, time: form.time, place: form.city });
    setChart(localChart);
    setStage('result');
    // Background: save to server and charge
    try {
      const resp = await api.createNatal(form.name, form.date, form.time, form.city) as { balance?: number };
      if (onBalanceUpdate && typeof resp.balance === 'number') {
        onBalanceUpdate(resp.balance);
      }
    } catch (err) {
      const e = err as { status?: number; shortage?: number };
      if (e?.status === 402) {
        setApiError(`Не хватает ${e.shortage ?? ''} ₽ для построения карты`);
        setStage('form');
        setChart(null);
      }
    }
  };

  useEffect(() => {
    if (stage !== 'result') { setBuild(0); return; }
    setBuild(0);
    const dur = 2600, t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setBuild(p);
      if (p >= 1) clearInterval(iv);
    }, 40);
    const done = setTimeout(() => setBuild(1), dur + 400);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [stage]);

  const field = (label: string, k: string, type = 'text', ph = '') => (
    <div>
      <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:1, marginBottom:6 }}>{label}</div>
      <input type={type} value={(form as Record<string, string>)[k]} placeholder={ph}
        onChange={e => set(k, e.target.value)}
        style={{ width:'100%', background:'var(--panel)', border:'1px solid var(--gold-line)', borderRadius:13,
          padding:'13px 15px', color:'var(--text)', fontSize:15.5, outline:'none' }} />
    </div>
  );

  if (stage === 'form') {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 20px 26px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <Back onClick={onBack} />
          <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>Натальная карта</div>
        </div>
        <div className="float" style={{ alignSelf:'center', color:'var(--gold)', margin:'8px 0 16px',
          filter:'drop-shadow(0 0 14px var(--glow-soft))' }}>
          <Glyph k="world" size={54} />
        </div>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16.5, color:'var(--muted)',
          textAlign:'center', lineHeight:1.4, marginBottom:22 }}>
          Введите данные рождения — звёзды раскроют ваш характер и предназначение.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {field('Имя', 'name', 'text', 'Как к вам обращаться')}
          {field('Дата рождения', 'date', 'date')}
          {field('Время рождения', 'time', 'time')}
          {field('Город рождения', 'city', 'text', 'Москва')}
        </div>
        {apiError && (
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10,
            background:'rgba(224,106,154,.12)', border:'1px solid rgba(224,106,154,.4)',
            color:'rgba(224,106,154,.9)', fontSize:13 }}>{apiError}</div>
        )}
        <div style={{ flex:1 }} />
        <GoldButton full onClick={goResult}>Построить карту</GoldButton>
      </div>
    );
  }

  const building = build < 1;
  const ch = chart!;
  const S = SIGNS;
  const sunS = S[ch.sun] || S[0];
  const moonS = S[ch.moon] || S[0];
  const ascS = S[ch.asc] || S[0];

  return (
    <div className="noscroll" style={{ flex:1, overflowY:'auto', padding:'8px 20px 40px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
        <Back onClick={() => setStage('form')} />
        <div style={{ fontFamily:'Marcellus, serif', fontSize:18, color:'var(--text)' }}>
          {form.name ? `Карта · ${form.name}` : 'Ваша карта'}</div>
      </div>

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
          <SectionLabel>Большая тройка</SectionLabel>
          <NatalRow g="☉" s="Солнце · ваша суть"  t={`Солнце в знаке ${sunS.n}`}  d={SUN_TEXT[ch.sun]} />
          <NatalRow g="☽" s="Луна · эмоции"        t={`Луна в знаке ${moonS.n}`}   d={MOON_TEXT[ch.moon]} />
          <NatalRow g="ASC" s="Асцендент · образ"  t={`Асцендент в ${ascS.n}`}      d={ASC_TEXT[ch.asc]} />

          <SectionLabel>Баланс стихий</SectionLabel>
          <ElementBalance elements={ch.elements} />

          <SectionLabel>Планеты в знаках</SectionLabel>
          {PLANET_DEFS.map(p => {
            const sign = ch[p.key as keyof NatalResult] as number;
            const sg = S[sign];
            return (
              <NatalRow key={p.key} g={p.sym} s={p.label}
                t={`${planetName(p.key)} в ${sg.n}`}
                d={planetLine(p.lead, sign)} />
            );
          })}

          <SectionLabel>Ваш знак Солнца</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <MiniFact k="Стихия"    v={EL_RU[sunS.el as keyof typeof EL_RU]} />
            <MiniFact k="Качество"  v={sunS.q} />
            <MiniFact k="Управитель" v={sunS.ruler} />
            <MiniFact k="Символ"    v={sunS.sym} />
          </div>

          <div style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:13.5,
            color:'var(--muted)', textAlign:'center', marginTop:8, lineHeight:1.4 }}>
            Карта построена по вашим данным рождения. Введите другие данные — звёзды сложатся иначе.</div>
        </div>
      )}
    </div>
  );
}
