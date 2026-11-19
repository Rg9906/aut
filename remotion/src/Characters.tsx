import React from 'react';
import {theme} from './theme';

export type Emotion = 'neutral' | 'happy' | 'smug' | 'shocked' | 'confused' | 'thinking' | 'angry' | 'dead';
export type Who = 'byte' | 'compy';

type Brow = {a: number; y: number};
type EP = {
  lid: number; // 0..1 eyelid coverage from the top
  browL: Brow;
  browR: Brow;
  pupil: number;
  px: number;
  py: number;
  eye: number; // eye size multiplier
  mouth: 'smile' | 'grin' | 'smirk' | 'o' | 'wavy' | 'flat' | 'frown';
  xEyes?: boolean;
};

const B = (a: number, y: number): Brow => ({a, y});

const EMO: Record<Emotion, EP> = {
  neutral: {lid: 0, browL: B(0, 0), browR: B(0, 0), pupil: 1, px: 0, py: 0, eye: 1, mouth: 'smile'},
  happy: {lid: 0, browL: B(-8, -8), browR: B(8, -8), pupil: 1.15, px: 0, py: 0, eye: 1, mouth: 'grin'},
  smug: {lid: 0.5, browL: B(10, 2), browR: B(-6, -6), pupil: 1, px: 9, py: 3, eye: 1, mouth: 'smirk'},
  shocked: {lid: 0, browL: B(0, -18), browR: B(0, -18), pupil: 0.5, px: 0, py: 0, eye: 1.2, mouth: 'o'},
  confused: {lid: 0.1, browL: B(0, 0), browR: B(-8, -16), pupil: 0.9, px: -9, py: -4, eye: 1, mouth: 'wavy'},
  thinking: {lid: 0.1, browL: B(-6, -4), browR: B(-6, -4), pupil: 0.9, px: 15, py: -15, eye: 1, mouth: 'flat'},
  angry: {lid: 0.28, browL: B(20, 6), browR: B(-20, 6), pupil: 0.8, px: 0, py: 0, eye: 1, mouth: 'frown'},
  dead: {lid: 0, browL: B(0, 0), browR: B(0, 0), pupil: 1, px: 0, py: 0, eye: 1, mouth: 'flat', xEyes: true},
};

const INK = '#1a1230';

type Arms = {l: number; r: number};

const Arm: React.FC<{px: number; py: number; side: 'l' | 'r'; out: number; fill: string; stroke: string; hand: string; len?: number}> = ({px, py, side, out, fill, stroke, hand, len = 58}) => (
  <g transform={`rotate(${side === 'l' ? out : -out} ${px} ${py})`}>
    <rect x={px - 10} y={py - 4} width={20} height={len} rx={10} fill={fill} stroke={stroke} strokeWidth={5} />
    <circle cx={px} cy={py + len} r={17} fill={hand} stroke={stroke} strokeWidth={5} />
  </g>
);

// outward raise angle per arm (0 = hanging, ~150 = overhead), driven by emotion + speech
const armsFor = (who: 'byte' | 'compy', emotion: Emotion, speaking: boolean, mouth: number, frame: number): Arms => {
  const ph = who === 'byte' ? 0 : 1.7;
  let l = 24 + 6 * Math.sin(frame / 17 + ph);
  let r = 24 + 6 * Math.sin(frame / 17 + ph + 1);
  if (speaking) {
    l = 46 + 30 * Math.sin(frame / 5 + ph) + mouth * 18;
    r = 40 + 26 * Math.sin(frame / 5.7 + ph + 1.2) + mouth * 14;
  }
  switch (emotion) {
    case 'shocked':
      l = r = 135 + 8 * Math.sin(frame * 1.1);
      break;
    case 'happy':
      if (speaking) {
        l = 105 + 28 * Math.sin(frame / 3.4);
        r = 105 + 28 * Math.sin(frame / 3.4 + Math.PI);
      }
      break;
    case 'thinking':
      l = 14;
      r = 118;
      break;
    case 'confused':
      r = 128 + 8 * Math.sin(frame / 4);
      break;
    case 'angry':
      l = r = 30 + (speaking ? 14 * Math.sin(frame / 3) : 0);
      break;
    case 'smug':
      l = r = 14;
      break;
  }
  return {l, r};
};

type CharProps = {
  who: Who;
  emotion: Emotion;
  speaking: boolean;
  mouth: number; // 0..1 lip-sync openness
  frame: number;
  hit: number; // 0..1 "pop" when a scene starts
};

/* ---------------- Byte: excitable teal blob ---------------- */
const Byte: React.FC<{e: EP; speaking: boolean; mouth: number; frame: number; arms: Arms}> = ({e, speaking, mouth, frame, arms}) => {
  const blink = frame % 110 < 4 ? 0.1 : 1;
  const eyeRy = 38 * e.eye * blink;
  const eyeRx = 31 * e.eye;
  const mm = speaking ? mouth : 0;

  const Eye = ({cx, id}: {cx: number; id: string}) => (
    <g>
      <clipPath id={id}>
        <ellipse cx={cx} cy={150} rx={eyeRx} ry={eyeRy} />
      </clipPath>
      {e.xEyes ? (
        <g stroke={INK} strokeWidth={9} strokeLinecap="round">
          <line x1={cx - 16} y1={134} x2={cx + 16} y2={166} />
          <line x1={cx + 16} y1={134} x2={cx - 16} y2={166} />
        </g>
      ) : (
        <>
          <ellipse cx={cx} cy={150} rx={eyeRx} ry={eyeRy} fill="#fff" />
          <circle cx={cx + e.px} cy={150 + e.py} r={15 * e.pupil} fill={INK} clipPath={`url(#${id})`} />
          <circle cx={cx + e.px + 5} cy={150 + e.py - 6} r={4.5} fill="#fff" clipPath={`url(#${id})`} />
          {e.lid > 0 ? (
            <rect x={cx - eyeRx - 2} y={150 - eyeRy - 2} width={eyeRx * 2 + 4} height={eyeRy * 2 * e.lid + 2} fill="#2dd4bf" clipPath={`url(#${id})`} />
          ) : null}
        </>
      )}
    </g>
  );

  const mouthEl = (() => {
    if (speaking && mm > 0.04) {
      const rx = 26 - 8 * mm;
      const ry = 5 + 30 * mm;
      return (
        <g>
          <ellipse cx={150} cy={226} rx={rx} ry={ry} fill={INK} />
          <ellipse cx={150} cy={226 + ry * 0.45} rx={rx * 0.6} ry={ry * 0.38} fill="#fb7185" />
        </g>
      );
    }
    const s = {fill: 'none', stroke: INK, strokeWidth: 8, strokeLinecap: 'round' as const};
    switch (e.mouth) {
      case 'grin':
        return <path d="M114,212 Q150,266 186,212 Z" fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
      case 'smirk':
        return <path d="M122,226 Q158,236 188,206" {...s} />;
      case 'o':
        return <ellipse cx={150} cy={230} rx={16} ry={21} fill={INK} />;
      case 'wavy':
        return <path d="M116,226 q16,-16 32,0 t32,0" {...s} />;
      case 'flat':
        return <path d="M124,226 L176,226" {...s} />;
      case 'frown':
        return <path d="M118,238 Q150,206 182,238" {...s} />;
      default:
        return <path d="M118,216 Q150,244 182,216" {...s} />;
    }
  })();

  const brow = (cx: number, b: Brow, flip: number) => (
    <line
      x1={cx - 30}
      y1={104}
      x2={cx + 30}
      y2={104}
      stroke={INK}
      strokeWidth={9}
      strokeLinecap="round"
      transform={`translate(0 ${b.y}) rotate(${flip * b.a} ${cx} 104)`}
    />
  );

  return (
    <svg viewBox="0 0 300 340" width="100%" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="byteBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <line x1={150} y1={72} x2={150 + Math.sin(frame / 12) * 6} y2={30} stroke="#0f766e" strokeWidth={8} strokeLinecap="round" />
      <circle cx={150 + Math.sin(frame / 12) * 6} cy={24} r={13} fill={theme.amber} />
      {/* arms (behind the body so the shoulders tuck in) */}
      <Arm px={46} py={196} side="l" out={arms.l} fill="#2dd4bf" stroke="#0f766e" hand="#5eead4" />
      <Arm px={254} py={196} side="r" out={arms.r} fill="#2dd4bf" stroke="#0f766e" hand="#5eead4" />
      {/* legs */}
      <rect x={95} y={268} width={30} height={40} rx={14} fill="#0f766e" />
      <rect x={175} y={268} width={30} height={40} rx={14} fill="#0f766e" />
      {/* body */}
      <rect x={38} y={68} width={224} height={212} rx={78} fill="url(#byteBody)" stroke="#0f766e" strokeWidth={6} />
      <ellipse cx={90} cy={96} rx={30} ry={14} fill="#ffffff" opacity={0.22} />
      {/* cheeks */}
      <ellipse cx={78} cy={206} rx={20} ry={11} fill="#fb7185" opacity={0.4} />
      <ellipse cx={222} cy={206} rx={20} ry={11} fill="#fb7185" opacity={0.4} />
      <Eye cx={108} id="byteEyeL" />
      <Eye cx={192} id="byteEyeR" />
      {brow(108, e.browL, 1)}
      {brow(192, e.browR, -1)}
      {mouthEl}
    </svg>
  );
};

/* ---------------- Compy: smug CRT monitor ---------------- */
type EyeShape = 'dot' | 'arc' | 'line' | 'ring' | 'x' | 'slantL' | 'slantR' | 'half';
const COMPY_EYES: Record<Emotion, [EyeShape, EyeShape]> = {
  neutral: ['dot', 'dot'],
  happy: ['arc', 'arc'],
  smug: ['half', 'half'],
  shocked: ['ring', 'ring'],
  confused: ['dot', 'ring'],
  thinking: ['dot', 'dot'],
  angry: ['slantL', 'slantR'],
  dead: ['x', 'x'],
};

const Compy: React.FC<{emotion: Emotion; speaking: boolean; mouth: number; frame: number; arms: Arms}> = ({emotion, speaking, mouth, frame, arms}) => {
  const C = theme.amber;
  const blink = frame % 130 < 4;
  const shapes = COMPY_EYES[emotion];
  const mm = speaking ? mouth : 0;

  const eye = (cx: number, shape: EyeShape) => {
    const cy = 140;
    const st = {stroke: C, strokeWidth: 9, strokeLinecap: 'round' as const, fill: 'none'};
    if (blink && shape !== 'x') return <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} {...st} />;
    switch (shape) {
      case 'arc':
        return <path d={`M${cx - 16},${cy + 8} Q${cx},${cy - 18} ${cx + 16},${cy + 8}`} {...st} />;
      case 'line':
        return <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} {...st} />;
      case 'half':
        return (
          <g>
            <path d={`M${cx - 17},${cy + 2} A17,17 0 0 0 ${cx + 17},${cy + 2} Z`} fill={C} />
            <line x1={cx - 20} y1={cy + 2} x2={cx + 20} y2={cy + 2} {...st} strokeWidth={6} />
          </g>
        );
      case 'ring':
        return <circle cx={cx} cy={cy} r={19} {...st} strokeWidth={8} />;
      case 'x':
        return (
          <g {...st}>
            <line x1={cx - 14} y1={cy - 14} x2={cx + 14} y2={cy + 14} />
            <line x1={cx + 14} y1={cy - 14} x2={cx - 14} y2={cy + 14} />
          </g>
        );
      case 'slantL':
        return <line x1={cx - 16} y1={cy - 10} x2={cx + 16} y2={cy + 8} {...st} />;
      case 'slantR':
        return <line x1={cx + 16} y1={cy - 10} x2={cx - 16} y2={cy + 8} {...st} />;
      default:
        return <circle cx={cx} cy={cy} r={13} fill={C} />;
    }
  };

  const mouthEl = (() => {
    const st = {stroke: C, strokeWidth: 9, strokeLinecap: 'round' as const, fill: 'none'};
    if (speaking && mm > 0.05) {
      const h = 6 + 34 * mm;
      return <rect x={120} y={206 - h / 2 + 8} width={60} height={h} rx={8} fill={C} />;
    }
    if (emotion === 'happy') return <path d="M120,206 Q150,234 180,206" {...st} />;
    if (emotion === 'smug') return <path d="M122,214 Q150,220 182,198" {...st} />;
    if (emotion === 'shocked') return <ellipse cx={150} cy={214} rx={14} ry={18} fill={C} />;
    if (emotion === 'angry') return <path d="M122,226 Q150,200 178,226" {...st} />;
    if (emotion === 'confused') return <path d="M120,214 q15,-12 30,0 t30,0" {...st} />;
    return <line x1={124} y1={214} x2={176} y2={214} {...st} />;
  })();

  const shiftX = emotion === 'thinking' ? 8 : 0;
  const shiftY = emotion === 'thinking' ? -8 : 0;

  return (
    <svg viewBox="0 0 300 340" width="100%" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="compyBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="2" fill="#000" opacity="0.25" />
        </pattern>
      </defs>
      {/* rabbit ears */}
      <line x1={112} y1={66} x2={78 + Math.sin(frame / 15) * 4} y2={18} stroke="#94a3b8" strokeWidth={7} strokeLinecap="round" />
      <line x1={188} y1={66} x2={222 - Math.sin(frame / 15) * 4} y2={18} stroke="#94a3b8" strokeWidth={7} strokeLinecap="round" />
      <circle cx={78 + Math.sin(frame / 15) * 4} cy={16} r={8} fill="#cbd5e1" />
      <circle cx={222 - Math.sin(frame / 15) * 4} cy={16} r={8} fill="#cbd5e1" />
      {/* arms */}
      <Arm px={30} py={178} side="l" out={arms.l} fill="#94a3b8" stroke="#1e293b" hand="#fbbf24" len={54} />
      <Arm px={270} py={178} side="r" out={arms.r} fill="#94a3b8" stroke="#1e293b" hand="#fbbf24" len={54} />
      {/* stand */}
      <rect x={112} y={276} width={76} height={20} rx={6} fill="#334155" />
      <rect x={78} y={294} width={144} height={16} rx={8} fill="#1e293b" />
      {/* body */}
      <rect x={26} y={62} width={248} height={222} rx={40} fill="url(#compyBody)" stroke="#1e293b" strokeWidth={6} />
      <circle cx={246} cy={262} r={7} fill={theme.bad} />
      <circle cx={222} cy={262} r={7} fill={theme.good} />
      {/* screen */}
      <rect x={52} y={86} width={196} height={164} rx={24} fill="#0b0f0a" stroke="#0f172a" strokeWidth={5} />
      <g style={{filter: `drop-shadow(0 0 7px ${C})`}} transform={`translate(${shiftX} ${shiftY})`}>
        {eye(112, shapes[0])}
        {eye(188, shapes[1])}
        {mouthEl}
      </g>
      <rect x={52} y={86} width={196} height={164} rx={24} fill="url(#scan)" />
      <rect x={60} y={94} width={60} height={20} rx={10} fill="#fff" opacity={0.07} />
    </svg>
  );
};

export const Character: React.FC<CharProps> = ({who, emotion, speaking, mouth, frame, hit}) => {
  const e = EMO[emotion];
  const phase = who === 'byte' ? 0 : 2;
  const bob = Math.sin(frame / 9 + phase) * (speaking ? 7 : 3.5);
  const jump = emotion === 'shocked' && speaking ? -14 * Math.abs(Math.sin(frame / 3.2)) : 0;
  const scale = (speaking ? 1.08 : 0.93) + 0.05 * hit;
  const squash = speaking ? 1 - 0.035 * mouth : 1;
  const tilt = (speaking ? Math.sin(frame / 7) * 2.2 : 0) + (who === 'byte' ? -1 : 1);
  const arms = armsFor(who, emotion, speaking, mouth, frame);
  const lift = bob - (speaking ? 12 : 0) + jump;
  return (
    <div style={{position: 'relative'}}>
      {/* ground shadow shrinks as the character hops */}
      <div
        style={{
          position: 'absolute',
          left: '14%',
          width: '72%',
          bottom: 4,
          height: 30,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #000c 0%, #0000 70%)',
          transform: `scale(${1 - lift / 160})`,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          transform: `translateY(${lift}px) rotate(${tilt}deg) scale(${scale}, ${scale * squash})`,
          transformOrigin: '50% 100%',
          opacity: speaking ? 1 : 0.9,
          filter: speaking ? 'drop-shadow(0 10px 26px #0009)' : 'saturate(0.85) drop-shadow(0 6px 16px #0007)',
        }}
      >
        {who === 'byte' ? (
          <Byte e={e} speaking={speaking} mouth={mouth} frame={frame} arms={arms} />
        ) : (
          <Compy emotion={emotion} speaking={speaking} mouth={mouth} frame={frame} arms={arms} />
        )}
      </div>
    </div>
  );
};
