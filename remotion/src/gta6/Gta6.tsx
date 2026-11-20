import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Character, Emotion} from '../Characters';

// ---------- types ----------
export type GWord = {w: string; start: number; end: number};
export type Gta6Props = {audio: string; totalSec: number; words: GWord[]; lines: {text: string; start: number; end: number}[]; mouth: number[]};

// ---------- palette (original synthwave look; no Rockstar art/logos) ----------
const C = {
  pink: '#FF3EA5',
  hot: '#FF6B3D',
  sun: '#FFC93C',
  cyan: '#2EE6FF',
  violet: '#8B5CFF',
  ink: '#0A0614',
  night: '#160B2E',
  white: '#FFF7FB',
  green: '#3DFF9A',
  red: '#FF3355',
};
const DISPLAY = '"Lilita One", "Fredoka", Arial, sans-serif';
const BODY = '"Fredoka", Arial, sans-serif';
const MONO = '"JetBrains Mono", monospace';

// beats (seconds, on the cleaned voice timeline)
const BEATS = [0, 5.6, 9.1, 15.2, 25.2, 34.1, 39.3, 43.5, 51.6, 56.8];
const beatIndex = (t: number) => {
  let i = 0;
  for (let k = 0; k < BEATS.length; k++) if (t >= BEATS[k]) i = k;
  return i;
};

// ---------- helpers ----------
const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {f, fps, t: f / fps};
};
const pop = (f: number, fps: number, at: number, cfg = {damping: 11, stiffness: 190, mass: 0.7}) =>
  spring({frame: f - Math.round(at * fps), fps, config: cfg});
const appear = (t: number, at: number, d = 0.25) => interpolate(t, [at, at + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const rnd = (s: number) => {
  const x = Math.sin(s * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
const stroke = (px: number, col = C.ink) => ({
  WebkitTextStroke: `${px}px ${col}`,
  paintOrder: 'stroke fill' as any,
  textShadow: `0 ${px * 0.9}px 0 ${col}, 0 0 ${px * 6}px ${col}aa`,
});

// ---------- background: sunset city ----------
const Sun: React.FC<{t: number}> = ({t}) => (
  <svg viewBox="0 0 600 600" style={{position: 'absolute', left: 240, top: 560 + Math.sin(t / 3) * 6, width: 600}}>
    <defs>
      <linearGradient id="sung" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.sun} />
        <stop offset="0.55" stopColor={C.hot} />
        <stop offset="1" stopColor={C.pink} />
      </linearGradient>
      <mask id="sunm">
        <rect width="600" height="600" fill="#fff" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 330 + i * 46 + ((t * 30) % 46);
          return <rect key={i} x="0" y={y} width="600" height={6 + i * 3} fill="#000" />;
        })}
      </mask>
    </defs>
    <circle cx="300" cy="300" r="280" fill="url(#sung)" mask="url(#sunm)" style={{filter: `drop-shadow(0 0 60px ${C.hot})`}} />
  </svg>
);

const Skyline: React.FC<{t: number; f: number}> = ({t, f}) => {
  const b = Array.from({length: 26}, (_, i) => {
    const w = 50 + rnd(i) * 70;
    const h = 160 + rnd(i + 50) * 420 + (i % 7 === 3 ? 220 : 0);
    return {w, h, i};
  });
  let x = -40;
  const off = -((t * 14) % 1400);
  return (
    <svg viewBox="0 0 1400 900" style={{position: 'absolute', left: off, top: 380, width: 2800, height: 900}} preserveAspectRatio="none">
      {[0, 1].map((rep) => {
        x = -40 + rep * 1400;
        return b.map(({w, h, i}) => {
          const bx = x;
          x += w + 6;
          const top = 860 - h;
          const wins = [];
          for (let yy = top + 20; yy < 840; yy += 34)
            for (let xx = bx + 10; xx < bx + w - 12; xx += 20) {
              const on = rnd(xx * 3 + yy + Math.floor(f / 40 + rnd(xx + yy) * 5)) > 0.58;
              if (on) wins.push(<rect key={`${xx}-${yy}`} x={xx} y={yy} width={8} height={14} fill={rnd(xx + yy) > 0.5 ? C.sun : C.cyan} opacity={0.75} />);
            }
          return (
            <g key={`${rep}-${i}`}>
              <rect x={bx} y={top} width={w} height={h} fill={i % 2 ? '#1D0F3D' : '#24124A'} stroke={C.pink} strokeOpacity={0.35} strokeWidth={2} />
              {wins}
            </g>
          );
        });
      })}
    </svg>
  );
};

const Palm: React.FC<{x: number; y: number; s: number; flip?: boolean; f: number}> = ({x, y, s, flip, f}) => {
  const sway = Math.sin(f / 28 + x) * 3;
  return (
    <svg viewBox="0 0 300 700" style={{position: 'absolute', left: x, top: y, width: 300 * s, transform: `scaleX(${flip ? -1 : 1}) rotate(${sway}deg)`, transformOrigin: '50% 100%'}}>
      <path d="M150 700 C 160 520, 120 300, 170 120" stroke="#0B0418" strokeWidth="26" fill="none" strokeLinecap="round" />
      {[-70, -30, 10, 50, 95, 140, 180].map((a, i) => (
        <path
          key={i}
          d="M170 120 q 60 -40 130 10 q -70 -10 -130 -10"
          fill="#0B0418"
          transform={`rotate(${a + Math.sin(f / 20 + i) * 4} 170 120)`}
        />
      ))}
    </svg>
  );
};

const GridFloor: React.FC<{t: number}> = ({t}) => (
  <svg viewBox="0 0 1080 700" style={{position: 'absolute', left: 0, top: 1220, width: 1080, height: 700}}>
    <defs>
      <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A0B4A" />
        <stop offset="1" stopColor={C.ink} />
      </linearGradient>
    </defs>
    <rect width="1080" height="700" fill="url(#fl)" />
    {Array.from({length: 22}, (_, i) => {
      const x = -1100 + i * 150;
      return <line key={i} x1={540} y1={0} x2={x} y2={700} stroke={C.pink} strokeOpacity={0.45} strokeWidth={2} />;
    })}
    {Array.from({length: 10}, (_, i) => {
      const p = ((i + ((t * 1.2) % 1)) / 10) ** 2;
      return <line key={i} x1={0} x2={1080} y1={p * 700} y2={p * 700} stroke={C.cyan} strokeOpacity={0.15 + p * 0.5} strokeWidth={2 + p * 3} />;
    })}
  </svg>
);

const Background: React.FC<{t: number; f: number; hue: number}> = ({t, f, hue}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, #12052A 0%, #3A0F5C 38%, #B0306E 62%, #FF7A45 74%, #2A0B4A 75%)`, filter: `hue-rotate(${hue}deg)`}}>
    {Array.from({length: 40}, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: rnd(i) * 1080,
          top: rnd(i + 9) * 600,
          width: 4,
          height: 4,
          borderRadius: 2,
          background: '#fff',
          opacity: 0.3 + 0.5 * Math.abs(Math.sin(f / 14 + i)),
        }}
      />
    ))}
    <Sun t={t} />
    <Skyline t={t} f={f} />
    <GridFloor t={t} />
    <Palm x={-90} y={560} s={1.25} f={f} />
    <Palm x={760} y={640} s={1.1} flip f={f} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0A061499 0%, #0A061400 22%, #0A061400 55%, #0A0614cc 100%)'}} />
  </AbsoluteFill>
);

// ---------- reusable UI ----------
const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({children, style, glow = C.pink}) => (
  <div
    style={{
      background: 'linear-gradient(160deg, #1A0B35ee, #0E0620ee)',
      border: `5px solid ${glow}`,
      borderRadius: 34,
      boxShadow: `0 0 40px ${glow}88, inset 0 0 30px ${glow}33`,
      padding: '26px 34px',
      ...style,
    }}
  >
    {children}
  </div>
);

const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 120, color = C.white, style}) => (
  <div style={{fontFamily: DISPLAY, fontSize: size, color, lineHeight: 1.0, textAlign: 'center', ...stroke(Math.max(6, size / 14)), ...style}}>{children}</div>
);

const Source: React.FC<{text: string; o?: number}> = ({text, o = 1}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top: 680, textAlign: 'center', fontFamily: BODY, fontSize: 26, color: '#ffffffcc', opacity: o, letterSpacing: 1}}>
    {text}
  </div>
);

const Stamp: React.FC<{text: string; color: string; p: number; rot?: number; size?: number}> = ({text, color, p, rot = -8, size = 110}) => (
  <div
    style={{
      transform: `scale(${interpolate(p, [0, 1], [2.6, 1])}) rotate(${rot}deg)`,
      opacity: Math.min(1, p * 2),
      border: `10px solid ${color}`,
      borderRadius: 26,
      padding: '8px 34px',
      fontFamily: DISPLAY,
      fontSize: size,
      color,
      background: '#0A0614cc',
      boxShadow: `0 0 50px ${color}aa`,
      ...stroke(0),
      textShadow: `0 0 26px ${color}`,
    }}
  >
    {text}
  </div>
);

// little pedestrian (original design)
const Ped: React.FC<{seed: number; f: number; action?: 'walk' | 'phone' | 'jog' | 'dog' | 'coffee' | 'wave'; scale?: number}> = ({seed, f, action = 'walk', scale = 1}) => {
  const speed = action === 'jog' ? 3.2 : 5.5;
  const ph = f / speed + seed * 2;
  const leg = Math.sin(ph) * 26;
  const shirt = [C.pink, C.cyan, C.sun, C.green, C.violet, C.hot][seed % 6];
  const skin = ['#F5C9A8', '#C98E64', '#8D5A3B', '#E8B48F', '#6B4429'][seed % 5];
  const bob = Math.abs(Math.sin(ph)) * (action === 'jog' ? 8 : 4);
  const armR = action === 'wave' ? -150 + Math.sin(f / 4) * 25 : action === 'phone' || action === 'coffee' ? -70 : -leg;
  return (
    <svg viewBox="-60 -10 160 220" width={110 * scale} style={{overflow: 'visible', transform: `translateY(${-bob}px)`}}>
      <g stroke={C.ink} strokeWidth={5} strokeLinecap="round">
        <line x1="20" y1="120" x2={20 + Math.sin((leg * Math.PI) / 180) * 50} y2={185} stroke="#2B2350" strokeWidth={14} />
        <line x1="20" y1="120" x2={20 - Math.sin((leg * Math.PI) / 180) * 50} y2={185} stroke="#2B2350" strokeWidth={14} />
        <rect x="-4" y="52" width="48" height="74" rx="18" fill={shirt} />
        <g transform={`rotate(${armR} 34 64)`}>
          <line x1="34" y1="64" x2="34" y2="112" stroke={skin} strokeWidth={11} />
          {action === 'coffee' && <rect x="26" y="108" width="18" height="22" rx="4" fill="#fff" />}
          {action === 'phone' && <rect x="27" y="104" width="14" height="22" rx="3" fill="#111" stroke={C.cyan} />}
        </g>
        <line x1="6" y1="64" x2={6 + Math.sin((-leg * Math.PI) / 180) * 30} y2="110" stroke={skin} strokeWidth={11} />
        <circle cx="20" cy="30" r="24" fill={skin} />
        {seed % 3 === 0 && <path d="M-6 22 q 26 -34 52 0 z" fill={C.ink} />}
        {seed % 3 === 1 && <rect x="-8" y="2" width="56" height="14" rx="6" fill={shirt} />}
        <circle cx="12" cy="30" r="3" fill={C.ink} stroke="none" />
        <circle cx="28" cy="30" r="3" fill={C.ink} stroke="none" />
      </g>
      {action === 'dog' && (
        <g transform={`translate(70 ${150 - Math.abs(Math.sin(ph * 1.4)) * 6})`} stroke={C.ink} strokeWidth={4}>
          <line x1="-30" y1="-40" x2="0" y2="0" stroke="#fff" strokeWidth={2} />
          <rect x="0" y="0" width="50" height="22" rx="10" fill={C.sun} />
          <circle cx="54" cy="0" r="12" fill={C.sun} />
          <line x1="8" y1="20" x2="4" y2="36" />
          <line x1="40" y1="20" x2="44" y2="36" />
        </g>
      )}
    </svg>
  );
};

const RobotIcon: React.FC<{size: number; crossed?: number; f: number}> = ({size, crossed = 0, f}) => (
  <svg viewBox="0 0 200 200" width={size} style={{overflow: 'visible'}}>
    <line x1="100" y1="20" x2="100" y2="45" stroke={C.cyan} strokeWidth="8" />
    <circle cx="100" cy="16" r="10" fill={C.pink} opacity={0.6 + 0.4 * Math.sin(f / 4)} />
    <rect x="30" y="45" width="140" height="110" rx="30" fill="#2A1A55" stroke={C.cyan} strokeWidth="8" />
    <rect x="58" y="80" width="28" height="22" rx="8" fill={C.cyan} />
    <rect x="114" y="80" width="28" height="22" rx="8" fill={C.cyan} />
    <rect x="70" y="120" width="60" height="10" rx="5" fill={C.cyan} />
    <text x="100" y="190" textAnchor="middle" fontFamily={DISPLAY} fontSize="34" fill={C.white}>AI</text>
    {crossed > 0 && (
      <g opacity={crossed} stroke={C.red} strokeWidth="22" strokeLinecap="round">
        <line x1={20} y1={20} x2={20 + 160 * crossed} y2={20 + 160 * crossed} />
        <line x1={180} y1={20} x2={180 - 160 * Math.max(0, crossed * 2 - 1)} y2={20 + 160 * Math.max(0, crossed * 2 - 1)} />
      </g>
    )}
  </svg>
);

const GameBox: React.FC<{label: string; col: string}> = ({label, col}) => (
  <div style={{width: 150, height: 190, borderRadius: 16, background: `linear-gradient(160deg, ${col}, #1A0B35)`, border: `5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 0 ${C.ink}`}}>
    <div style={{fontFamily: DISPLAY, fontSize: 34, color: C.white, textAlign: 'center', ...stroke(4)}}>{label}</div>
  </div>
);

// ---------- scenes ----------
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 330, height: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
);

const Hook: React.FC = () => {
  const {t, f, fps} = useT();
  const year = Math.floor(interpolate(t, [0.2, 2.2], [2013, 2026], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const p13 = t < 1.6 ? 1 : pop(f, fps, 2.2);
  const pOther = pop(f, fps, 3.4);
  const shake = t > 2.2 && t < 2.5 ? Math.sin(f * 3) * 10 : 0;
  return (
    <Stage>
      <div style={{transform: `translateX(${shake}px)`}}>
        <Big size={96} color={C.white}>WHY DID</Big>
        <Big size={190} color={C.sun} style={{marginTop: -6}}>GTA 6</Big>
        <Big size={96} color={C.white}>TAKE</Big>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 16}}>
        <Panel glow={C.cyan} style={{padding: '10px 26px'}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 70, color: C.cyan}}>{year}</div>
        </Panel>
        <div style={{transform: `scale(${0.6 + 0.4 * p13}) rotate(${-6 + 6 * p13}deg)`}}>
          <Big size={150} color={C.pink}>13 YRS?</Big>
        </div>
      </div>
      <div style={{marginTop: 30, opacity: pOther, transform: `translateY(${(1 - pOther) * 80}px)`}}>
        <Panel glow={C.green} style={{padding: '12px 30px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 54, color: C.white}}>
            other games: <span style={{color: C.green}}>2–3 years</span>
          </div>
        </Panel>
      </div>
    </Stage>
  );
};

const Factory: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 5.7);
  const belt = (t * 420) % 230;
  const labels = ['GAME', 'GAME 2', 'GAME 3', 'GAME 4', 'GAME 5', 'GAME 6', 'GAME 7'];
  const cols = [C.pink, C.cyan, C.violet, C.hot, C.green, C.sun, C.pink];
  return (
    <Stage>
      <div style={{transform: `scale(${p})`}}>
        <Big size={84} color={C.white}>IN THE AGE OF</Big>
        <div style={{display: 'flex', justifyContent: 'center', margin: '10px 0'}}>
          <RobotIcon size={220} f={f} />
        </div>
      </div>
      <div style={{position: 'relative', width: 1080, height: 230, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 200, height: 22, background: `repeating-linear-gradient(90deg, #444 0 30px, #222 30px 60px)`, backgroundPosition: `${belt}px 0`}} />
        {labels.map((l, i) => (
          <div key={i} style={{position: 'absolute', top: 4, left: -230 + i * 230 + belt}}>
            <GameBox label={l} col={cols[i]} />
          </div>
        ))}
      </div>
      <div style={{marginTop: 26, opacity: appear(t, 7.6)}}>
        <Big size={70} color={C.cyan}>A NEW GAME EVERY OTHER DAY?</Big>
      </div>
    </Stage>
  );
};

const ThreeThings: React.FC = () => {
  const {t, f, fps} = useT();
  const items = [
    {at: 11.1, n: '1', label: 'THE TIMELINE', col: C.cyan, icon: '⏳'},
    {at: 11.9, n: '2', label: 'THE NPC TEAM', col: C.sun, icon: '🚶'},
    {at: 12.9, n: '3', label: 'THE SHORTCUT THEY REFUSED', col: C.pink, icon: '🚫'},
  ];
  const pH = pop(f, fps, 9.2);
  return (
    <Stage>
      <div style={{transform: `scale(${pH})`, marginBottom: 30}}>
        <Big size={110} color={C.sun}>3 REASONS</Big>
      </div>
      {items.map((it, i) => {
        const p = pop(f, fps, it.at);
        const wob = Math.sin(f / 8 + i) * 2;
        return (
          <div key={i} style={{opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * (i % 2 ? 700 : -700)}px) rotate(${wob}deg)`, marginBottom: 22}}>
            <Panel glow={it.col} style={{display: 'flex', alignItems: 'center', gap: 26, width: 860, padding: '18px 28px'}}>
              <div style={{width: 96, height: 96, borderRadius: 48, background: it.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 64, color: C.ink}}>{it.n}</div>
              <div style={{fontFamily: DISPLAY, fontSize: i === 2 ? 52 : 64, color: C.white}}>{it.label}</div>
              {i === 2 && <div style={{fontFamily: DISPLAY, fontSize: 64, color: C.pink, opacity: 0.6 + 0.4 * Math.sin(f / 5)}}>???</div>}
            </Panel>
          </div>
        );
      })}
    </Stage>
  );
};

const Timeline: React.FC = () => {
  const {t, f, fps} = useT();
  const nodes = [
    {at: 16.4, x: 120, year: '2013', label: 'GTA V\nreleased', col: C.cyan},
    {at: 18.2, x: 470, year: '2018', label: 'Red Dead 2\nships', col: C.hot},
    {at: 20.2, x: 900, year: '2026', label: 'GTA 6', col: C.pink},
  ];
  const lineP = interpolate(t, [15.6, 20.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const runP = interpolate(t, [20.2, 22.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p8 = pop(f, fps, 22.6);
  const pHead = pop(f, fps, 15.25);
  return (
    <Stage>
      <div style={{position: 'absolute', top: 0, transform: `scale(${pHead})`}}>
        <Panel glow={C.cyan} style={{padding: '8px 30px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 56, color: C.cyan}}>#1 THE TIMELINE</div>
        </Panel>
      </div>
      <div style={{position: 'absolute', left: 0, top: 230, width: 1080, height: 300}}>
        <div style={{position: 'absolute', left: 120, top: 60, height: 14, width: 780 * lineP, borderRadius: 7, background: `linear-gradient(90deg, ${C.cyan}, ${C.hot}, ${C.pink})`, boxShadow: `0 0 24px ${C.pink}`}} />
        {nodes.map((n, i) => {
          const p = pop(f, fps, n.at);
          return (
            <div key={i} style={{position: 'absolute', left: n.x - 120, top: 0, width: 240, textAlign: 'center', transform: `scale(${p})`}}>
              <div style={{margin: '0 auto', width: 130, height: 130, borderRadius: 65, background: '#1A0B35', border: `8px solid ${n.col}`, boxShadow: `0 0 30px ${n.col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 36, color: C.white}}>{n.year}</div>
              <div style={{whiteSpace: 'pre-line', marginTop: 12, fontFamily: DISPLAY, fontSize: 40, color: n.col, ...stroke(4)}}>{n.label}</div>
            </div>
          );
        })}
        {/* the studio "moves" from RDR2 to GTA 6 */}
        {runP > 0 &&
          [0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{position: 'absolute', top: -120, left: 470 + (900 - 470) * Math.min(1, Math.max(0, runP * 1.4 - i * 0.1)) - 40 - i * 34}}>
              <Ped seed={i + 3} f={f} action="jog" scale={0.6} />
            </div>
          ))}
      </div>
      <div style={{position: 'absolute', top: 470, display: 'flex', alignItems: 'center', gap: 24, opacity: Math.min(1, p8 * 2)}}>
        <Stamp text="8+ YEARS" color={C.sun} p={p8} size={100} />
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.white, width: 280}}>of development (press reports)</div>
      </div>
      <Source o={appear(t, 22.3)} text="Development timeline: Bloomberg reporting" />
    </Stage>
  );
};

const NpcTeam: React.FC = () => {
  const {t, f, fps} = useT();
  const pTeam = pop(f, fps, 29.4);
  const pLA = pop(f, fps, 31.9);
  const pHead = pop(f, fps, 25.3);
  const walkers = Array.from({length: 9}, (_, i) => i);
  return (
    <Stage>
      <div style={{position: 'absolute', top: 0, transform: `scale(${pHead})`}}>
        <Panel glow={C.sun} style={{padding: '8px 30px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 56, color: C.sun}}>#2 THE NPC TEAM</div>
        </Panel>
      </div>
      {/* street of walking people */}
      <div style={{position: 'absolute', top: 130, left: 0, width: 1080, height: 300, overflow: 'hidden'}}>
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: '#2B1B4F', borderTop: `4px solid ${C.cyan}66`}} />
        {walkers.map((i) => {
          const dir = i % 2 ? 1 : -1;
          const sp = 70 + rnd(i) * 60;
          const x = dir > 0 ? ((t * sp + i * 160) % 1300) - 150 : 1150 - ((t * sp + i * 160) % 1300);
          const acts = ['walk', 'phone', 'coffee', 'walk', 'dog', 'walk', 'phone', 'jog', 'walk'] as const;
          return (
            <div key={i} style={{position: 'absolute', bottom: 18 + (i % 3) * 6, left: x, transform: `scaleX(${dir})`}}>
              <Ped seed={i} f={f} action={acts[i]} scale={1 + (i % 3) * 0.1} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 470, display: 'flex', gap: 30, alignItems: 'center'}}>
        <div style={{transform: `scale(${pTeam}) rotate(${-4 * pTeam}deg)`}}>
          <Panel glow={C.pink} style={{padding: '18px 30px', textAlign: 'center'}}>
            <div style={{fontFamily: DISPLAY, fontSize: 40, color: C.white}}>A WHOLE TEAM</div>
            <div style={{fontFamily: DISPLAY, fontSize: 64, color: C.pink}}>JUST FOR NPCs</div>
          </Panel>
        </div>
        <div style={{transform: `scale(${pLA}) translateY(${Math.sin(f / 6) * 8}px)`, textAlign: 'center'}}>
          <svg viewBox="0 0 100 130" width={110}>
            <path d="M50 125 C 20 80, 5 60, 5 45 A 45 45 0 0 1 95 45 C 95 60, 80 80, 50 125 Z" fill={C.red} stroke={C.ink} strokeWidth={6} />
            <circle cx="50" cy="45" r="18" fill={C.white} />
          </svg>
          <div style={{fontFamily: DISPLAY, fontSize: 40, color: C.white, ...stroke(4)}}>LA office</div>
          <div style={{fontFamily: BODY, fontSize: 24, color: '#ffffffcc'}}>(reportedly)</div>
        </div>
      </div>
      <Source o={appear(t, 29.5)} text="Source: GamesRadar+, PC Gamer (Aug 2026)" />
    </Stage>
  );
};

const Counts: React.FC = () => {
  const {t, f, fps} = useT();
  const n5 = Math.floor(interpolate(t, [34.6, 35.8], [0, 55000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const n6 = Math.floor(interpolate(t, [37.2, 38.7], [0, 600000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const w5 = (n5 / 600000) * 820;
  const w6 = (n6 / 600000) * 820;
  const p11 = pop(f, fps, 38.7);
  const shake = t > 38.7 && t < 39.0 ? Math.sin(f * 3) * 12 : 0;
  const Row: React.FC<{name: string; n: number; w: number; col: string; plus?: boolean}> = ({name, n, w, col, plus}) => (
    <div style={{marginBottom: 46}}>
      <div style={{fontFamily: DISPLAY, fontSize: 52, color: col, ...stroke(5), marginBottom: 8}}>{name}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{height: 90, width: Math.max(12, w), borderRadius: 18, background: `linear-gradient(90deg, ${col}88, ${col})`, boxShadow: `0 0 30px ${col}`}} />
      </div>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 64, color: C.white, marginTop: 6, ...stroke(5)}}>
        {n.toLocaleString('en-US')}
        {plus && n >= 600000 ? '+' : ''} <span style={{fontSize: 36, color: '#ffffffcc'}}>animations</span>
      </div>
    </div>
  );
  return (
    <Stage>
      <div style={{width: 900, transform: `translateX(${shake}px)`}}>
        <Row name="GTA 5" n={n5} w={w5} col={C.cyan} />
        <Row name="GTA 6" n={n6} w={w6} col={C.pink} plus />
      </div>
      <div style={{position: 'absolute', right: 70, top: 300}}>
        <Stamp text="~11×" color={C.sun} p={p11} rot={10} size={120} />
      </div>
      <Source text="Rockstar via The New York Times, reported by PC Gamer & GamesRadar+" />
    </Stage>
  );
};

const Quote: React.FC = () => {
  const {t, f, fps} = useT();
  const q = 'We art-directed each individual one.';
  const n = Math.floor(interpolate(t, [41.4, 43.1], [0, q.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const p = pop(f, fps, 39.4);
  const spot = 300 + Math.sin(f / 18) * 260;
  return (
    <Stage>
      <div style={{position: 'absolute', top: 40, left: spot, width: 260, height: 620, background: `radial-gradient(ellipse at 50% 0%, ${C.sun}55, transparent 70%)`}} />
      <div style={{transform: `scale(${p})`}}>
        <Panel glow={C.sun} style={{width: 880, padding: '40px 46px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 160, color: C.sun, lineHeight: 0.6, height: 70}}>“</div>
          <div style={{fontFamily: DISPLAY, fontSize: 78, color: C.white, lineHeight: 1.1, minHeight: 260}}>
            {q.slice(0, n)}
            <span style={{opacity: f % 16 < 8 ? 1 : 0, color: C.sun}}>|</span>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.cyan, marginTop: 10}}>— Aaron Garbut, Rockstar North co-head</div>
          <div style={{fontFamily: BODY, fontSize: 26, color: '#ffffffaa'}}>to The New York Times, via PC Gamer</div>
        </Panel>
      </div>
      <div style={{position: 'absolute', bottom: -10, display: 'flex', gap: 10}}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{transform: `scale(${appear(t, 41.4 + i * 0.25)})`}}>
            <Ped seed={i + 1} f={f} action={(['wave', 'phone', 'coffee', 'dog', 'walk'] as const)[i]} scale={0.7} />
          </div>
        ))}
      </div>
    </Stage>
  );
};

const AiTwist: React.FC = () => {
  const {t, f, fps} = useT();
  const pHead = pop(f, fps, 43.6);
  const cross = interpolate(t, [47.0, 47.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const meter = interpolate(t, [47.2, 48.6], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const pZero = pop(f, fps, 48.6);
  const pHand = pop(f, fps, 50.3, {damping: 9, stiffness: 220, mass: 0.6});
  const shake = (t > 48.6 && t < 48.9) || (t > 50.3 && t < 50.6) ? Math.sin(f * 3) * 14 : 0;
  const blocks = Array.from({length: 8}, (_, i) => i);
  return (
    <Stage>
      <div style={{position: 'absolute', top: 0, transform: `scale(${pHead})`}}>
        <Panel glow={C.pink} style={{padding: '8px 30px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 56, color: C.pink}}>#3 THE SHORTCUT</div>
        </Panel>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 40, transform: `translateX(${shake}px)`, marginTop: 40}}>
        <RobotIcon size={250} crossed={cross} f={f} />
        <div>
          <div style={{fontFamily: DISPLAY, fontSize: 48, color: C.white, ...stroke(5)}}>GENERATIVE AI</div>
          <div style={{width: 360, height: 60, borderRadius: 30, border: `5px solid ${C.white}`, overflow: 'hidden', marginTop: 10, background: '#0A0614'}}>
            <div style={{width: `${meter}%`, height: '100%', background: `linear-gradient(90deg, ${C.red}, ${C.hot})`}} />
          </div>
          <div style={{transform: `scale(${0.5 + 0.5 * pZero})`, transformOrigin: 'left center'}}>
            <Big size={120} color={C.red} style={{textAlign: 'left'}}>
              {Math.round(meter)}%
            </Big>
          </div>
        </div>
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.white, marginTop: 6, opacity: appear(t, 47.2)}}>“zero part”, said Take-Two CEO Strauss Zelnick</div>
      <div style={{position: 'relative', height: 220, width: 1000, marginTop: 20}}>
        {blocks.map((i) => {
          const a = appear(t, 49.9 + i * 0.12, 0.2);
          const h = 60 + rnd(i + 3) * 130;
          return <div key={i} style={{position: 'absolute', bottom: 0, left: 40 + i * 118, width: 100, height: h * a, background: i % 2 ? '#2A1A55' : '#3A1F6B', border: `4px solid ${C.cyan}`, borderRadius: 8}} />;
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pHand * 2)}}>
          <Stamp text="100% HANDCRAFTED" color={C.green} p={pHand} size={88} />
        </div>
      </div>
      <Source o={appear(t, 50.6)} text="Take-Two still uses AI tools for things like testing, just not to build the world." />
    </Stage>
  );
};

const Recap: React.FC = () => {
  const {t, f, fps} = useT();
  const pQ = pop(f, fps, 51.7);
  const pSlow = pop(f, fps, 53.0);
  const acts = ['wave', 'phone', 'jog', 'dog', 'coffee'] as const;
  const loading = interpolate(t, [53.0, 56.8], [0.1, 0.42], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage>
      <div style={{transform: `scale(${pQ})`}}>
        <Big size={100} color={C.white}>SO WHY 13 YEARS?</Big>
      </div>
      <div style={{marginTop: 30, opacity: Math.min(1, pSlow * 2), transform: `scale(${pSlow})`, textAlign: 'center'}}>
        <Big size={130} color={C.sun}>THE SLOW WAY</Big>
        <div style={{width: 760, height: 54, margin: '20px auto 0', borderRadius: 27, border: `5px solid ${C.white}`, overflow: 'hidden', background: '#0A0614'}}>
          <div style={{width: `${loading * 100}%`, height: '100%', background: `repeating-linear-gradient(45deg, ${C.green} 0 20px, #2bd47d 20px 40px)`, backgroundPosition: `${f * 2}px 0`}} />
        </div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.white, marginTop: 8}}>handmade... {Math.round(loading * 100)}%</div>
      </div>
      <div style={{display: 'flex', gap: 40, marginTop: 60}}>
        {acts.map((a, i) => (
          <div key={a} style={{textAlign: 'center', transform: `scale(${appear(t, 54.8 + i * 0.18)})`}}>
            <Ped seed={i + 2} f={f} action={a} scale={0.85} />
            <div style={{fontFamily: DISPLAY, fontSize: 30, color: [C.pink, C.cyan, C.sun, C.green, C.hot][i], ...stroke(3)}}>{a}</div>
          </div>
        ))}
      </div>
    </Stage>
  );
};

const EndCard: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 56.9);
  const pulse = 1 + 0.06 * Math.sin(f / 4);
  return (
    <Stage>
      <div style={{transform: `scale(${p * pulse})`}}>
        <div style={{background: C.red, borderRadius: 30, padding: '20px 70px', border: `8px solid ${C.ink}`, boxShadow: `0 12px 0 ${C.ink}, 0 0 50px ${C.red}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 120, color: C.white, ...stroke(6)}}>FOLLOW</div>
        </div>
      </div>
      <div style={{marginTop: 40, opacity: appear(t, 57.5), transform: `translateY(${(1 - appear(t, 57.5)) * 60}px)`}}>
        <Panel glow={C.cyan} style={{width: 860, textAlign: 'center'}}>
          <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.cyan}}>NEXT EPISODE</div>
          <div style={{fontFamily: DISPLAY, fontSize: 58, color: C.white, lineHeight: 1.1}}>How GTA 6 loads a whole city with no loading screen</div>
        </Panel>
      </div>
    </Stage>
  );
};

const SCENES = [Hook, Factory, ThreeThings, Timeline, NpcTeam, Counts, Quote, AiTwist, Recap, EndCard];

// ---------- captions ----------
const KEY = /^(GTA|6|13|years|AI|three|NPC|team|shortcut|Rockstar|refused|2013|2018|8|55,000|600,000|zero|handcrafted|slow|pedestrian|differently|follow|timeline|dedicated|LA|Take-Two's|generative)$/i;
const clean = (w: string) => w.replace(/[“”"]/g, '').replace(/[.,?!:]+$/, '');

const Captions: React.FC<{words: GWord[]}> = ({words}) => {
  const {t, f, fps} = useT();
  const pages: GWord[][] = [];
  let cur: GWord[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= 3 || /[.,:;?!”]$/.test(w.w) || (next && next.start - w.end > 0.2)) {
      pages.push(cur);
      cur = [];
    }
  });
  if (cur.length) pages.push(cur);
  const page = pages.find((p) => t >= p[0].start - 0.05 && t < p[p.length - 1].end + 0.25);
  if (!page) return null;
  const p = pop(f, fps, page[0].start - 0.05, {damping: 12, stiffness: 260, mass: 0.5});
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1075, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 34px', transform: `scale(${0.7 + 0.3 * p})`}}>
      {page.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.05;
        const key = KEY.test(clean(w.w));
        const col = active ? C.sun : key ? C.cyan : C.white;
        return (
          <span key={i} style={{fontFamily: DISPLAY, fontSize: 92, color: col, textTransform: 'uppercase', display: 'inline-block', transform: `scale(${active ? 1.08 : 1}) translateY(${active ? -6 : 0}px) rotate(${active ? (i % 2 ? 2 : -2) : 0}deg)`, ...stroke(9)}}>
            {clean(w.w)}
          </span>
        );
      })}
    </div>
  );
};

// ---------- mascots ----------
const EMO: [Emotion, Emotion][] = [
  ['shocked', 'smug'],
  ['thinking', 'smug'],
  ['happy', 'thinking'],
  ['thinking', 'neutral'],
  ['happy', 'happy'],
  ['shocked', 'shocked'],
  ['happy', 'smug'],
  ['shocked', 'smug'],
  ['happy', 'smug'],
  ['happy', 'happy'],
];

const Mascots: React.FC<{mouth: number[]; bi: number}> = ({mouth, bi}) => {
  const {f, t} = useT();
  const m = mouth[f] ?? 0;
  const speaking = m > 0.12;
  const end = bi === 9;
  const [eb, ec] = EMO[bi];
  const hop = (k: number) => -Math.abs(Math.sin(f / 7 + k)) * (end ? 40 : 10);
  const size = end ? 340 : 230;
  const y = end ? 1300 : 1290;
  return (
    <>
      <div style={{position: 'absolute', left: end ? 120 : 20, top: y + hop(0), width: size}}>
        <Character who="byte" emotion={eb} speaking={speaking} mouth={m} frame={f} hit={0} />
      </div>
      <div style={{position: 'absolute', right: end ? 120 : 20, top: y + 20 + hop(1.6), width: size}}>
        <Character who="compy" emotion={ec} speaking={false} mouth={0} frame={f} hit={0} />
      </div>
    </>
  );
};

// ---------- chrome ----------
const Header: React.FC = () => {
  const {f} = useT();
  return (
    <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
      <div style={{background: C.ink, border: `4px solid ${C.cyan}`, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.white, boxShadow: `0 0 24px ${C.cyan}88`}}>
        BYTE <span style={{color: C.pink}}>&</span> COMPY
      </div>
      <div style={{background: C.pink, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.white, transform: `rotate(${Math.sin(f / 10) * 3}deg)`, ...stroke(3)}}>GTA 6 EXPLAINED</div>
    </div>
  );
};

const Progress: React.FC<{total: number}> = ({total}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: '#ffffff18'}}>
      <div style={{width: `${(t / total) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.sun})`, boxShadow: `0 0 18px ${C.pink}`}} />
    </div>
  );
};

const Transition: React.FC = () => {
  const {t} = useT();
  const bi = beatIndex(t);
  const since = t - BEATS[bi];
  if (bi === 0 || since > 0.35) return null;
  const x = interpolate(since, [0, 0.35], [-1400, 1400]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(since, [0, 0.12], [0.55, 0], {extrapolateRight: 'clamp'})}} />
      <div style={{position: 'absolute', top: -400, left: x, width: 360, height: 2800, background: `linear-gradient(90deg, transparent, ${C.pink}, ${C.cyan}, transparent)`, transform: 'rotate(18deg)', opacity: 0.85}} />
    </AbsoluteFill>
  );
};

// ---------- root ----------
export const Gta6: React.FC<Gta6Props> = ({audio, totalSec, words, mouth}) => {
  const {f, t, fps} = useT();
  const bi = beatIndex(t);
  const Scene = SCENES[bi];
  const since = t - BEATS[bi];
  // camera: gentle drift + punch-in on each new beat + punch on key words
  let punch = 0;
  for (const w of words) {
    if (KEY.test(clean(w.w)) && t >= w.start && t < w.start + 0.25) punch = Math.max(punch, 1 - (t - w.start) / 0.25);
  }
  const zoom = 1 + 0.012 * Math.sin(f / 40) + 0.03 * Math.max(0, 1 - since / 0.4) + 0.012 * punch;
  const hue = [0, 20, -15, 0, 15, -20, 10, -30, 0, 15][bi];
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1.02 + 0.01 * Math.sin(f / 60)})`}}>
        <Background t={t} f={f} hue={hue} />
      </div>
      <AbsoluteFill style={{transform: `scale(${zoom}) rotate(${Math.sin(f / 50) * 0.4}deg)`}}>
        <Scene />
      </AbsoluteFill>
      <Mascots mouth={mouth} bi={bi} />
      <Captions words={words} />
      <Header />
      <Progress total={totalSec} />
      <Transition />
    </AbsoluteFill>
  );
};
