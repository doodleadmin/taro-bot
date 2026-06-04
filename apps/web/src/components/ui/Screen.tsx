import React from 'react';

interface ScreenProps { children: React.ReactNode; k: string }

export function Screen({ children, k }: ScreenProps) {
  return (
    <div key={k} className="screen-in" style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}
