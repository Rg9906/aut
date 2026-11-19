import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from './theme';

export type StickerSpec = {
  type: 'burst' | 'qmarks' | 'sweat' | 'exclaim';
  text?: string;
  t: number; // seconds after scene start
  x: number; // center px
  y: number;
};

const LIFE = 1.4; // seconds a sticker stays

const star = (cx: number, cy: number, ro: number, ri: number, n: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
};

const StickerArt: React.FC<{s: StickerSpec; wobble: number}> = ({s, wobble}) => {
  switch (s.type) {
    case 'burst':
      return (
        <svg width={300} height={300} viewBox="0 0 300 300" style={{overflow: 'visible'}}>
          <polygon points={star(150, 150, 140, 98, 11)} fill={theme.warn} stroke="#1a1230" strokeWidth={8} strokeLinejoin="round" />
          {(s.text || '').split(' ').map((w, i, arr) => (
            <text
              key={i}
              x={150}
              y={150 + (i - (arr.length - 1) / 2) * 56 + 16}
              textAnchor="middle"
              fontSize={arr.length > 1 ? 50 : 46}
              fontWeight={900}
              fill="#1a1230"
              fontFamily={theme.sans}
            >
              {w}
            </text>
          ))}
        </svg>
      );
    case 'qmarks':
      return (
        <svg width={260} height={220} viewBox="0 0 260 220" style={{overflow: 'visible'}}>
          {[0, 1, 2].map((i) => (
            <text
              key={i}
              x={50 + i * 72}
              y={120 + Math.sin(wobble * 2 + i * 1.7) * 14 - (i === 1 ? 30 : 0)}
              fontSize={i === 1 ? 140 : 100}
              fontWeight={900}
              fill={theme.accent2}
              stroke="#1a1230"
              strokeWidth={6}
              paintOrder="stroke"
              fontFamily={theme.sans}
              textAnchor="middle"
            >
              ?
            </text>
          ))}
        </svg>
      );
    case 'sweat':
      return (
        <svg width={120} height={170} viewBox="0 0 120 170" style={{overflow: 'visible'}}>
          <path d="M60,10 C20,70 10,100 10,118 a50,50 0 0 0 100,0 C110,100 100,70 60,10 Z" fill="#7dd3fc" stroke="#1a1230" strokeWidth={7} />
          <ellipse cx={42} cy={112} rx={10} ry={18} fill="#fff" opacity={0.6} />
        </svg>
      );
    case 'exclaim':
      return (
        <svg width={160} height={240} viewBox="0 0 160 240" style={{overflow: 'visible'}}>
          <text x={80} y={190} fontSize={260} fontWeight={900} fill={theme.bad} stroke="#1a1230" strokeWidth={9} paintOrder="stroke" textAnchor="middle" fontFamily={theme.sans}>
            !
          </text>
        </svg>
      );
  }
};

export const Stickers: React.FC<{stickers: {spec: StickerSpec; abs: number}[]}> = ({stickers}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {stickers.map(({spec, abs}, i) => {
        const dt = t - abs;
        if (dt < 0 || dt > LIFE) return null;
        const pop = spring({frame: Math.round(dt * fps), fps, config: {damping: 9, stiffness: 190}});
        const out = dt > LIFE - 0.2 ? Math.max(0, (LIFE - dt) / 0.2) : 1;
        const rot = (i % 2 ? 1 : -1) * 8 + Math.sin(dt * 9) * 3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: spec.x,
              top: spec.y,
              transform: `translate(-50%, -50%) scale(${pop * out}) rotate(${rot}deg)`,
            }}
          >
            <StickerArt s={spec} wobble={dt * 6} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Drifting 0/1 characters for a subtle "inside the computer" feel.
export const BinaryRain: React.FC = () => {
  const frame = useCurrentFrame();
  const items = Array.from({length: 30}, (_, i) => ({
    x: (i * 137) % 1080,
    y0: (i * 311) % 1920,
    speed: 0.5 + (i % 5) * 0.35,
    ch: i % 3 === 0 ? '1' : '0',
    size: 34 + (i % 4) * 12,
    op: 0.05 + (i % 4) * 0.025,
  }));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {items.map((it, i) => {
        const y = (((it.y0 - frame * it.speed * 2.2) % 2000) + 2000) % 2000 - 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: y,
              fontFamily: theme.mono,
              fontSize: it.size,
              fontWeight: 700,
              color: theme.accent,
              opacity: it.op,
            }}
          >
            {it.ch}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
