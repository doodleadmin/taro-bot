import React from 'react';

interface CardBackProps { w?: number; glow?: boolean }

export function CardBack({ w = 132, glow = false }: CardBackProps) {
  const h = Math.round(w * 1.62);
  return (
    <div className={glow ? 'card-pulse' : ''} style={{
      width:w, height:h, borderRadius:w*0.07, position:'relative',
      background:'linear-gradient(150deg, var(--back-2), var(--back-1))',
      boxShadow:'inset 0 0 0 1px var(--gold-line), 0 14px 30px rgba(0,0,0,.5)',
      overflow:'hidden', flexShrink:0,
    }}>
      <div style={{ position:'absolute', inset:w*0.05, borderRadius:w*0.04, border:'1px solid var(--gold-line)' }} />
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', color:'var(--gold)', opacity:.9 }}>
        <svg width={w*0.5} height={w*0.5} viewBox="0 0 64 64"
          style={{ filter:'drop-shadow(0 0 6px var(--glow-soft))' }}>
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="32" cy="32" r="22"/>
            <circle cx="32" cy="32" r="15"/>
            <path d="M32 6l5 14 14 1-11 9 4 14-12-9-12 9 4-14-11-9 14-1z"/>
            <circle cx="32" cy="32" r="3" fill="currentColor"/>
          </g>
        </svg>
      </div>
      <div className="card-sheen" style={{ position:'absolute', inset:0 }} />
    </div>
  );
}
