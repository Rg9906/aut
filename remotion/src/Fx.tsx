import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {theme} from './theme';

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const COLS = [theme.accent, theme.accent2, theme.amber, '#fb7185'];

/** Slow drifting shapes + twinkling stars: gives the background depth and life. */
export const Floaters: React.FC = () => {
  const frame = useCurrentFrame();
  const shapes = Array.from({length: 16}, (_, i) => {
    const size = 46 + rnd(i * 3) * 96;
    const x0 = rnd(i * 5 + 1) * 1080;
    const y0 = rnd(i * 7 + 2) * 2100;
    const sp = 0.35 + rnd(i * 11) * 0.7;
    const y = ((((y0 - frame * sp * 1.6) % 2100) + 2100) % 2100) - 120;
    const x = x0 + Math.sin(frame / 55 + i) * 34;
    const rot = frame * (rnd(i * 13) - 0.5) * 1.1;
    return {i, size, x, y, rot, col: COLS[i % 4], kind: i % 4, op: 0.07 + rnd(i * 17) * 0.06};
  });
  const stars = Array.from({length: 26}, (_, i) => ({
    i,
    x: rnd(i * 19 + 4) * 1080,
    y: rnd(i * 23 + 9) * 1920,
    s: 10 + rnd(i * 29) * 18,
    ph: rnd(i * 31) * 6.28,
  }));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {shapes.map((s) => (
        <div
          key={s.i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            opacity: s.op,
            transform: `rotate(${s.rot}deg)`,
          }}
        >
          {s.kind === 0 ? (
            <div style={{width: '100%', height: '100%', borderRadius: '50%', border: `7px solid ${s.col}`}} />
          ) : s.kind === 1 ? (
            <div style={{width: '100%', height: '100%', borderRadius: 22, border: `7px solid ${s.col}`}} />
          ) : s.kind === 2 ? (
            <>
              <div style={{position: 'absolute', left: '40%', top: 0, width: '20%', height: '100%', borderRadius: 8, background: s.col}} />
              <div style={{position: 'absolute', top: '40%', left: 0, height: '20%', width: '100%', borderRadius: 8, background: s.col}} />
            </>
          ) : (
            <div style={{width: '55%', height: '55%', margin: '22%', borderRadius: '50%', background: s.col}} />
          )}
        </div>
      ))}
      {stars.map((s) => {
        const tw = 0.25 + 0.75 * Math.max(0, Math.sin(frame / 18 + s.ph));
        return (
          <svg key={s.i} width={s.s * 2} height={s.s * 2} viewBox="-10 -10 20 20" style={{position: 'absolute', left: s.x, top: s.y, opacity: tw * 0.55}}>
            <path d="M0,-9 Q1,-1 9,0 Q1,1 0,9 Q-1,1 -9,0 Q-1,-1 0,-9Z" fill="#fff" />
          </svg>
        );
      })}
      {/* vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, #00000066 100%)'}} />
    </AbsoluteFill>
  );
};

/** Pulsing coloured spotlight behind a character. */
export const Glow: React.FC<{color: string; active: boolean; frame: number}> = ({color, active, frame}) => (
  <div
    style={{
      position: 'absolute',
      left: -90,
      top: -70,
      width: 540,
      height: 540,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}${active ? '66' : '1f'} 0%, ${color}00 68%)`,
      opacity: active ? 0.8 + 0.2 * Math.sin(frame / 6) : 0.55,
      transform: `scale(${active ? 1.05 + 0.04 * Math.sin(frame / 8) : 0.95})`,
    }}
  />
);

/** One-shot celebration burst. */
export const Confetti: React.FC<{delay?: number; count?: number}> = ({delay = 0, count = 70}) => {
  const frame = useCurrentFrame() - delay;
  if (frame < 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: count}, (_, i) => {
        const x0 = 540 + (rnd(i * 3) - 0.5) * 200;
        const ang = (rnd(i * 5 + 1) - 0.5) * Math.PI * 0.95 - Math.PI / 2;
        const v = 14 + rnd(i * 7) * 22;
        const t = frame / 1.0;
        const x = x0 + Math.cos(ang) * v * t * 1.1 + Math.sin(t / 6 + i) * 14;
        const y = 640 + Math.sin(ang) * v * t + 0.62 * t * t;
        const w = 14 + rnd(i * 11) * 16;
        const op = Math.max(0, 1 - t / 95);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: w * (0.45 + rnd(i * 13) * 0.5),
              background: COLS[i % 4],
              borderRadius: rnd(i * 17) > 0.6 ? '50%' : 4,
              opacity: op,
              transform: `rotate(${t * (6 + rnd(i * 19) * 14)}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
