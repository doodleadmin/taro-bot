import React from 'react';
import { CardFace } from './CardFace.tsx';
import { CardBack } from './CardBack.tsx';
import type { Card } from '@taro/shared';

interface FlipCardProps {
  card: Card;
  w?: number;
  flipped: boolean;
  reversed?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function FlipCard({ card, w = 132, flipped, reversed = false, onClick, delay = 0 }: FlipCardProps) {
  const h = Math.round(w * 1.62);
  return (
    <div
      onClick={onClick}
      style={{ width:w, height:h, perspective:1000, cursor: onClick ? 'pointer' : 'default', flexShrink:0 }}
    >
      <div style={{
        width:'100%', height:'100%', position:'relative',
        transformStyle:'preserve-3d',
        transition:`transform .8s cubic-bezier(.4,.1,.2,1) ${delay}ms`,
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden' }}>
          <CardBack w={w} glow={!flipped} />
        </div>
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)' }}>
          <CardFace card={card} reversed={reversed} w={w} />
        </div>
      </div>
    </div>
  );
}
