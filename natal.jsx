// natal.jsx — Анимированное колесо натальной карты (зодиак, планеты, аспекты)

const ZODIAC = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const ZNAME  = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];

// планеты: символ, угол на круге (deg), радиус-фактор, имя
const PLANETS = [
  { s:'☉', deg:128, name:'Солнце'  },
  { s:'☽', deg:342, name:'Луна'    },
  { s:'☿', deg:150, name:'Меркурий'},
  { s:'♀', deg:205, name:'Венера'  },
  { s:'♂', deg:58,  name:'Марс'    },
  { s:'♃', deg:285, name:'Юпитер'  },
  { s:'♄', deg:18,  name:'Сатурн'  },
];
// аспекты (линии между планетами), idx пары + тип цвета
const ASPECTS = [
  [0,4,'t'],[0,2,'h'],[1,3,'s'],[5,6,'t'],[2,5,'h'],[0,3,'s'],[4,6,'h'],
];

function NatalWheel({ size = 300, build, chart }) {
  // build: 0..1 — прогресс построения. chart — результат computeNatal (планеты/аспекты/асц)
  const PL = (chart && chart.planets) || PLANETS;
  const ASP = (chart && chart.aspects) || ASPECTS;
  const ascDeg = chart && chart.ascDeg;
  const c = size/2, rOuter = size*0.46, rZodiac = size*0.39, rInner = size*0.30, rPlanet = size*0.205;
  const pol = (deg, r) => { const a=(deg-90)*Math.PI/180; return [c+Math.cos(a)*r, c+Math.sin(a)*r]; };
  const ringLen = 2*Math.PI*rOuter;
  const planetsShown = Math.floor(build * (PL.length + 0.001));
  const aspectsShown = build >= 0.99 ? ASP.length : 0;
  const aColor = { t:'#e0707a', h:'#6fbfa0', s:'#7a9be0' };

  return (
    <div style={{ position:'relative', width:size, height:size, margin:'0 auto' }}>
      {/* свечение-подложка */}
      <div style={{ position:'absolute', inset:'10%', borderRadius:'50%',
        background:'radial-gradient(circle, var(--glow) 0%, transparent 65%)', opacity:.5 }} />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:'relative', overflow:'visible' }}>
        {/* внешнее кольцо — рисуется по кругу */}
        <circle cx={c} cy={c} r={rOuter} fill="none" stroke="var(--gold)" strokeWidth="1.5"
          strokeDasharray={ringLen} strokeDashoffset={ringLen*(1-Math.min(1,build*1.4))}
          transform={`rotate(-90 ${c} ${c})`} style={{ transition:'stroke-dashoffset .1s linear', opacity:.9 }} />
        <circle cx={c} cy={c} r={rZodiac} fill="none" stroke="var(--gold-line)" strokeWidth="1" opacity={build>0.1?1:0} style={{ transition:'opacity .5s' }} />
        <circle cx={c} cy={c} r={rInner} fill="none" stroke="var(--gold-line)" strokeWidth="1" strokeDasharray="2 5" opacity={build>0.2?.8:0} style={{ transition:'opacity .5s' }} />

        {/* спицы домов (12) */}
        <g className="spin-rev" style={{ transformOrigin:'center' }}>
          {Array.from({length:12}).map((_,i)=>{
            const [x1,y1]=pol(i*30, rInner), [x2,y2]=pol(i*30, rOuter);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold-line)" strokeWidth="0.8"
              opacity={build>0.15? (i*30<build*360?0.7:0.25):0} style={{ transition:'opacity .4s' }} />;
          })}
        </g>

        {/* знаки зодиака */}
        <g className="spin-slow" style={{ transformOrigin:'center' }}>
          {ZODIAC.map((z,i)=>{
            const [x,y]=pol(i*30+15, (rOuter+rZodiac)/2);
            return <text key={i} x={x} y={y} fill="var(--gold)" fontSize={size*0.052}
              textAnchor="middle" dominantBaseline="central"
              opacity={build>0.25?0.92:0} style={{ transition:`opacity .5s ${i*0.04}s` }}>{z}</text>;
          })}
        </g>

        {/* аспекты — линии через центр */}
        <g>
          {ASP.slice(0,aspectsShown).map(([a,b,t],i)=>{
            const [x1,y1]=pol(PL[a].deg, rPlanet), [x2,y2]=pol(PL[b].deg, rPlanet);
            const len=Math.hypot(x2-x1,y2-y1);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={aColor[t]} strokeWidth="1"
              strokeDasharray={len} strokeDashoffset={len} opacity=".55"
              style={{ animation:`drawLine .6s ease ${i*0.12}s forwards` }} />;
          })}
        </g>

        {/* отметка Асцендента */}
        {ascDeg!=null && build>0.5 && (() => {
          const [x1,y1]=pol(ascDeg, rInner), [x2,y2]=pol(ascDeg, rOuter*1.04);
          const [xt,yt]=pol(ascDeg, rOuter*1.13);
          return <g style={{ transition:'opacity .5s' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold)" strokeWidth="1.6" />
            <text x={xt} y={yt} fill="var(--gold)" fontSize={size*0.04} textAnchor="middle" dominantBaseline="central" fontWeight="600">ASC</text>
          </g>;
        })()}

        {/* планеты */}
        <g>
          {PL.slice(0,planetsShown).map((p,i)=>{
            const [x,y]=pol(p.deg, rPlanet);
            return (
              <g key={i} className="screen-in" style={{ transformOrigin:`${x}px ${y}px` }}>
                <circle cx={x} cy={y} r={size*0.038} fill="var(--card-bg)" stroke="var(--gold)" strokeWidth="1"
                  style={{ filter:'drop-shadow(0 0 5px var(--glow-soft))' }} />
                <text x={x} y={y} fill="var(--gold)" fontSize={size*0.046} textAnchor="middle" dominantBaseline="central">{p.s||p.sym}</text>
              </g>
            );
          })}
        </g>

        {/* центр */}
        <circle cx={c} cy={c} r={size*0.035} fill="none" stroke="var(--gold)" strokeWidth="1" opacity={build>0.3?.7:0} style={{ transition:'opacity .5s' }} />
      </svg>

      {/* пульсирующее ядро */}
      <div className="float" style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        color:'var(--gold)', opacity: build>0.3?1:0, transition:'opacity .6s',
        filter:'drop-shadow(0 0 10px var(--glow-soft))' }}>
        <Glyph k="sun" size={size*0.12} />
      </div>
    </div>
  );
}

Object.assign(window, { NatalWheel, ZODIAC, ZNAME, PLANETS });
