import React from 'react';

interface GoldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'ghost' | 'text';
  full?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function GoldButton({ children, onClick, variant = 'solid', full, style = {}, disabled }: GoldButtonProps) {
  const base: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif', fontSize: 16, fontWeight: 500, letterSpacing: 0.5,
    padding: '15px 26px', borderRadius: 14, cursor: disabled ? 'default' : 'pointer', border: 'none',
    width: full ? '100%' : 'auto', position: 'relative', overflow: 'hidden',
    transition: 'transform .15s ease, box-shadow .25s ease', opacity: disabled ? 0.45 : 1,
    ...style,
  };
  const skin: React.CSSProperties = variant === 'solid' ? {
    background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
    color: 'var(--on-gold)',
    boxShadow: '0 8px 24px var(--glow-soft), inset 0 1px 0 rgba(255,255,255,.35)',
  } : variant === 'ghost' ? {
    background: 'rgba(255,255,255,.04)', color: 'var(--gold)',
    boxShadow: 'inset 0 0 0 1px var(--gold-line)',
  } : { background: 'transparent', color: 'var(--muted)', boxShadow: 'none' };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={e => !disabled && ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(.97)')}
      onMouseUp={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
      style={{ ...base, ...skin }}
    >
      {variant === 'solid' && <span className="btn-sheen" />}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
