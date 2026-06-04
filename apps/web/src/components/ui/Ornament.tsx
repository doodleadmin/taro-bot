import React from 'react';

interface OrnamentProps { style?: React.CSSProperties }

export function Ornament({ style }: OrnamentProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, ...style }}>
      <div style={{ width: 34, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold-line))' }} />
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: 'var(--gold)' }}>
        <path d="M7 0l1.6 5.4L14 7l-5.4 1.6L7 14l-1.6-5.4L0 7l5.4-1.6z" fill="currentColor"/>
      </svg>
      <div style={{ width: 34, height: 1, background: 'linear-gradient(90deg, var(--gold-line), transparent)' }} />
    </div>
  );
}
