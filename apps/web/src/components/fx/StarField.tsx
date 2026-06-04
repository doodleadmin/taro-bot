import React, { useRef, useEffect } from 'react';

interface StarFieldProps { density?: number }

export function StarField({ density = 1 }: StarFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    let raf: number;
    let W = 0, H = 0;
    let t = 0;
    type Star = { x:number; y:number; r:number; sp:number; ph:number; tw:number; drift:number };
    let stars: Star[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const parent = cv!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cv!.width = W * dpr; cv!.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((W * H) / 9000 * density);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        sp: Math.random() * 0.25 + 0.04,
        ph: Math.random() * Math.PI * 2,
        tw: Math.random() * 0.02 + 0.005,
        drift: (Math.random() - 0.5) * 0.08,
      }));
    }

    resize();

    function frame() {
      t += 1; ctx.clearRect(0, 0, W, H);
      const gold = getComputedStyle(cv!).getPropertyValue('--star') || '#d4af6a';
      for (const s of stars) {
        s.y -= s.sp; s.x += s.drift;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
        if (s.x < -2) s.x = W + 2;
        if (s.x > W + 2) s.x = -2;
        const a = 0.35 + Math.sin(t * s.tw + s.ph) * 0.35;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = gold.trim(); ctx.globalAlpha = Math.max(0, a);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    frame();

    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className="star-canvas"
      style={{ ['--star' as string]: 'var(--glow)' }}
    />
  );
}
