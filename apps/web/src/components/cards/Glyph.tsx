import React from 'react';

interface GlyphProps { k: string; size?: number }

export function Glyph({ k, size = 64 }: GlyphProps) {
  const P: React.SVGProps<SVGGElement> = {
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  const g: Record<string, React.ReactNode> = {
    fool:     <g {...P}><circle cx="32" cy="20" r="6"/><path d="M32 26v18l-9 12M32 44l9 12"/><path d="M20 40l-6-6M44 40l6-6"/><path d="M14 34l5 2M50 34l-5 2"/></g>,
    magician: <g {...P}><path d="M32 8v48"/><path d="M20 18h24M20 46h24"/><circle cx="32" cy="32" r="3"/><path d="M24 12l-4-4M40 12l4-4"/></g>,
    priestess:<g {...P}><path d="M20 14v36M44 14v36"/><path d="M20 14h24M20 50h24"/><circle cx="32" cy="32" r="7"/><path d="M32 25v14"/></g>,
    empress:  <g {...P}><circle cx="32" cy="24" r="8"/><path d="M32 32v18M22 42h20"/><path d="M24 18l-6-4M40 18l6-4"/><path d="M32 12V4"/></g>,
    emperor:  <g {...P}><path d="M16 50V22l16-12 16 12v28z"/><path d="M24 50V34h16v16"/><path d="M32 22v8"/></g>,
    hierophant:<g {...P}><path d="M32 8v48"/><path d="M22 20h20M22 30h20M22 40h20"/><path d="M24 56h16"/></g>,
    lovers:   <g {...P}><circle cx="22" cy="26" r="7"/><circle cx="42" cy="26" r="7"/><path d="M22 33v12M42 33v12M16 50h32"/></g>,
    chariot:  <g {...P}><rect x="18" y="22" width="28" height="18" rx="2"/><circle cx="24" cy="48" r="5"/><circle cx="40" cy="48" r="5"/><path d="M32 22v-8M24 14h16"/></g>,
    strength: <g {...P}><path d="M32 12c10 0 14 8 14 16s-6 18-14 18-14-10-14-18 4-16 14-16z"/><path d="M26 30c2 3 10 3 12 0"/><path d="M32 6v6"/></g>,
    hermit:   <g {...P}><path d="M24 14c-4 8-4 28 0 40h16c4-12 4-32 0-40z"/><circle cx="32" cy="22" r="3"/><path d="M32 36l-4 4 4 4 4-4z"/></g>,
    wheel:    <g {...P}><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="5"/><path d="M32 14v8M32 42v8M14 32h8M42 32h8M19 19l6 6M39 39l6 6M45 19l-6 6M25 39l-6 6"/></g>,
    justice:  <g {...P}><path d="M32 12v36M18 22h28"/><path d="M18 22l-5 12h10zM46 22l-5 12h10z"/><path d="M24 50h16"/></g>,
    hanged:   <g {...P}><path d="M16 12h24M28 12v10"/><circle cx="28" cy="28" r="6"/><path d="M28 34v10l-8 8M28 44l8 6"/></g>,
    death:    <g {...P}><path d="M20 50L44 14"/><path d="M44 14c-6-2-14 2-16 10"/><circle cx="22" cy="46" r="5"/></g>,
    temperance:<g {...P}><path d="M22 14l8 16-8 16M42 14l-8 16 8 16"/><path d="M24 30h16"/></g>,
    devil:    <g {...P}><path d="M22 16l4 8M42 16l-4 8"/><circle cx="32" cy="34" r="12"/><path d="M28 32l2 2M34 34l2-2M27 40c3 3 7 3 10 0"/></g>,
    tower:    <g {...P}><path d="M22 50V24l10-10 10 10v26z"/><path d="M28 24h8M28 34h8M28 44h8"/><path d="M32 14V6M36 10l6-4"/></g>,
    star:     <g {...P}><path d="M32 10l4 12 12 1-9 8 3 12-10-7-10 7 3-12-9-8 12-1z"/><circle cx="18" cy="48" r="1.5"/><circle cx="46" cy="46" r="1.5"/></g>,
    moon:     <g {...P}><path d="M38 12a20 20 0 100 40 16 16 0 010-40z"/><path d="M48 20l2 2M50 30h3M48 40l2-2"/></g>,
    sun:      <g {...P}><circle cx="32" cy="32" r="11"/><path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M46 18l-4 4M22 42l-4 4"/></g>,
    judgement:<g {...P}><path d="M16 40l16-26 16 26z"/><path d="M22 40v8h20v-8"/><path d="M32 14V6"/></g>,
    world:    <g {...P}><ellipse cx="32" cy="32" rx="13" ry="20"/><circle cx="32" cy="32" r="20"/><path d="M12 32h40"/></g>,
    wands:    <g {...P}><path d="M32 8v48"/><path d="M26 16c4 2 8 2 12 0M26 24c4 2 8 2 12 0"/><circle cx="32" cy="50" r="3"/></g>,
    cups:     <g {...P}><path d="M20 16h24l-3 16a9 9 0 01-18 0z"/><path d="M32 41v9M24 50h16"/></g>,
    swords:   <g {...P}><path d="M32 6v40M22 50l10-6 10 6"/><path d="M24 30h16"/></g>,
    pentacles:<g {...P}><circle cx="32" cy="32" r="18"/><path d="M32 16l5 15h16l-13 9 5 15-13-9-13 9 5-15-13-9h16z" transform="scale(.62) translate(20 20)"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      {g[k] ?? g['star']}
    </svg>
  );
}
