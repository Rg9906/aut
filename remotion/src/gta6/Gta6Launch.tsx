import React from 'react';
import {AbsoluteFill, Sequence, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Character, Emotion} from '../Characters';

// ---------- types ----------
export type GWord = {w: string; start: number; end: number};
export type GLine = {who: string; text: string; beat: number; start: number; end: number};
export type Gta6Props = {audio: string; totalSec: number; words: (GWord & {who?: string})[]; lines: GLine[]; mouth: number[]; compyMouth: number[]; beats: number[]};
const ScriptCtx = React.createContext<{lines: GLine[]; beats: number[]}>({lines: [], beats: [0]});
const useLT = (beat: number, k: number) => {const c = React.useContext(ScriptCtx); const ls = c.lines.filter((l) => l.beat === beat); return (ls[Math.min(k, ls.length - 1)]?.start ?? 0) - (c.beats[beat] ?? 0);};

const useLE = (beat: number, k: number) => {const c = React.useContext(ScriptCtx); const ls = c.lines.filter((l) => l.beat === beat); return (ls[Math.min(k, ls.length - 1)]?.end ?? 0) - (c.beats[beat] ?? 0);};

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
const SrcTag: React.FC<{text: string; o?: number}> = ({text, o = 1}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top: 1790, textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 26, color: '#ffffffc0', opacity: o}}>{text}</div>
);
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

const Coin: React.FC<{x: number; delay: number; t: number; size?: number}> = ({x, delay, t, size = 54}) => {
  const y = ((t * 520 + delay * 700) % 1100) - 160;
  const spin = Math.abs(Math.cos(t * 6 + delay * 9));
  return (
    <svg viewBox="0 0 60 60" width={size} style={{position: 'absolute', left: x, top: y}}>
      <ellipse cx="30" cy="30" rx={26 * Math.max(0.15, spin)} ry="26" fill={C.sun} stroke={C.ink} strokeWidth="4" />
      <text x="30" y="40" textAnchor="middle" fontFamily={DISPLAY} fontSize="28" fill={C.hot} opacity={spin}>$</text>
    </svg>
  );
};

const Counter: React.FC = () => {
  const {t, f, fps} = useT();
  const cEnd = useLE(1, 1);
  const val = interpolate(t, [0.2, cEnd], [0, 3790000000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pTitle = pop(f, fps, 0.05);
  const land = t > cEnd;
  const pLand = pop(f, fps, cEnd - 0.6);
  const cStart = cEnd;
  const pStamp = pop(f, fps, cStart + 0.45, {damping: 9, stiffness: 220, mass: 0.7});
  const clock = interpolate(t, [0.2, cEnd], [0, 360], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  return (
    <Stage>
      {Array.from({length: 9}, (_, i) => <Coin key={i} x={20 + i * 125 + (i % 2) * 20} delay={i * 0.37} t={t} size={44 + (i % 3) * 14} />)}
      <div style={{transform: `scale(${pTitle})`, textAlign: 'center'}}>
        <Big size={100} color={C.sun}>GTA 6</Big>
        <Big size={64} color={C.white}>FIRST 24 HOURS</Big>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 24, transform: `scale(${land ? 1 + 0.05 * Math.sin(pLand * 3) : 1})`}}>
        <svg viewBox="0 0 120 120" width={130}>
          <circle cx="60" cy="60" r="52" fill="#1A0B35" stroke={C.cyan} strokeWidth="8" />
          {Array.from({length: 12}, (_, i) => <line key={i} x1="60" y1="14" x2="60" y2={i % 3 === 0 ? 26 : 20} stroke={C.cyan} strokeWidth="4" transform={`rotate(${i * 30} 60 60)`} />)}
          <line x1="60" y1="60" x2="60" y2="22" stroke={C.pink} strokeWidth="7" strokeLinecap="round" transform={`rotate(${clock} 60 60)`} />
          <circle cx="60" cy="60" r="6" fill={C.sun} />
        </svg>
        <Panel glow={C.green} style={{padding: '14px 28px'}}>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 62, color: C.green}}>{money(val)}</div>
        </Panel>
      </div>
      <div style={{position: 'absolute', bottom: 20, right: 60, opacity: Math.min(1, pStamp * 2)}}>
        <Stamp text="REPORTEDLY*" color={C.hot} p={pStamp} size={62} rot={-7} />
      </div>
      <SrcTag o={appear(t, cStart + 1)} text="*company estimate through end of Nov 19 (Take-Two / Rockstar), not audited" />
    </Stage>
  );
};

const PerSec: React.FC = () => {
  const {t, f, fps} = useT();
  const sec = Math.floor(t * 1);
  const per = 43866;
  const thinkAt = useLT(3, 2);
  const n = Math.floor(t * 3) * 0 + Math.floor(interpolate(t, [0, 4], [0, per * 3.9]));
  const p = pop(f, fps, 0.1);
  return (
    <Stage>
      <div style={{transform: `scale(${p})`, textAlign: 'center'}}>
        <Big size={150} color={C.green}>$43,866</Big>
        <Big size={80} color={C.white}>EVERY SECOND</Big>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 24}}>
        <svg viewBox="0 0 120 130" width={120}>
          <circle cx="60" cy="72" r="46" fill="#1A0B35" stroke={C.pink} strokeWidth="8" />
          <rect x="48" y="8" width="24" height="14" rx="4" fill={C.pink} />
          <line x1="60" y1="72" x2="60" y2="38" stroke={C.sun} strokeWidth="7" strokeLinecap="round" transform={`rotate(${(t * 360) % 360} 60 72)`} />
        </svg>
        <Panel glow={C.pink} style={{padding: '8px 22px'}}>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 46, color: C.sun}}>{sec + 1}s → {money(per * (sec + 1))}</div>
        </Panel>
      </div>
      {Array.from({length: 10}, (_, i) => <Coin key={i} x={10 + i * 105} delay={i * 0.31} t={t * 1.6} size={46} />)}
      {t > thinkAt && <div style={{marginTop: 18, transform: `scale(${pop(f, fps, thinkAt)})`}}><Panel glow={C.violet} style={{padding: '8px 28px'}}><div style={{fontFamily: DISPLAY, fontSize: 56, color: C.white}}>JUST THINK ABOUT THAT…</div></Panel></div>}
      <SrcTag o={appear(t, 0.8)} text="$3.79B ÷ 86,400 seconds ≈ $43,866 (our math)" />
    </Stage>
  );
};

const Icon: React.FC<{kind: 'coin' | 'star' | 'car'; col: string; f: number}> = ({kind, col, f}) => (
  <svg viewBox="0 0 100 100" width={120}>
    {kind === 'coin' && <><circle cx="50" cy="50" r="40" fill={C.sun} stroke={C.ink} strokeWidth="6" /><text x="50" y="68" textAnchor="middle" fontFamily={DISPLAY} fontSize="54" fill={C.hot}>$</text></>}
    {kind === 'star' && <polygon points="50,8 62,38 94,40 69,60 78,92 50,74 22,92 31,60 6,40 38,38" fill={col} stroke={C.ink} strokeWidth="6" strokeLinejoin="round" transform={`rotate(${Math.sin(f / 10) * 8} 50 50)`} />}
    {kind === 'car' && <><rect x="8" y="42" width="84" height="30" rx="12" fill={col} stroke={C.ink} strokeWidth="6" /><path d="M24 44 L36 24 H64 L78 44 Z" fill={col} stroke={C.ink} strokeWidth="6" strokeLinejoin="round" /><circle cx="28" cy="74" r="10" fill={C.ink} /><circle cx="72" cy="74" r="10" fill={C.ink} /></>}
  </svg>
);

const MoneyCompare: React.FC = () => {
  const {t, f, fps} = useT();
  const g5 = interpolate(t, [0.1, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const g6 = interpolate(t, [0.5, 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const H = 400;
  const h5 = (815.7 / 3790) * H * g5;
  const h6 = H * g6;
  const pX = pop(f, fps, 1.7, {damping: 8, stiffness: 200, mass: 0.7});
  return (
    <Stage>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 90, height: H + 130, marginTop: 40}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 40, color: C.cyan, opacity: g5}}>$815.7M</div>
          <div style={{width: 250, height: h5, background: `linear-gradient(180deg, ${C.cyan}, ${C.violet})`, border: `6px solid ${C.ink}`, borderRadius: '18px 18px 0 0', boxShadow: `0 0 30px ${C.cyan}88`}} />
          <div style={{fontFamily: DISPLAY, fontSize: 46, color: C.white, ...stroke(4)}}>GTA 5</div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 24, color: '#fff9'}}>day one, 2013</div>
        </div>
        <div style={{textAlign: 'center', position: 'relative'}}>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 40, color: C.green, opacity: g6}}>$3.79B</div>
          <div style={{width: 250, height: h6, background: `linear-gradient(180deg, ${C.sun}, ${C.pink})`, border: `6px solid ${C.ink}`, borderRadius: '18px 18px 0 0', boxShadow: `0 0 40px ${C.pink}aa`}} />
          <div style={{fontFamily: DISPLAY, fontSize: 46, color: C.sun, ...stroke(4)}}>GTA 6</div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 24, color: '#fff9'}}>day one, 2026</div>
          <div style={{position: 'absolute', left: -330, top: 150, opacity: Math.min(1, pX * 2)}}><Stamp text="≈4.6×" color={C.green} p={pX} size={84} rot={-9} /></div>
        </div>
      </div>
      <SrcTag o={appear(t, 1.8)} text="GTA 5 day one: $815.7M (Guinness). GTA 6: company estimate" />
    </Stage>
  );
};

const Score: React.FC = () => {
  const {t, f, fps} = useT();
  const cs = 1.3;
  const val = Math.round(interpolate(t, [0.1, 1.0], [0, 99], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const R = 150, C2 = 2 * Math.PI * R;
  const pBan = pop(f, fps, 1.0);
  const pCrit = appear(t, cs);
  return (
    <Stage>
      <div style={{position: 'relative', width: 380, height: 380, marginTop: -20}}>
        <svg viewBox="0 0 380 380" width={380} style={{transform: 'rotate(-90deg)'}}>
          <circle cx="190" cy="190" r={R} fill="#1A0B35" stroke="#ffffff22" strokeWidth="26" />
          <circle cx="190" cy="190" r={R} fill="none" stroke={val >= 99 ? C.green : C.cyan} strokeWidth="26" strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={C2 * (1 - val / 100)} style={{filter: `drop-shadow(0 0 16px ${C.green})`}} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Big size={170} color={C.white}>{val}</Big>
          <div style={{fontFamily: DISPLAY, fontSize: 34, color: C.cyan, marginTop: -6}}>METACRITIC</div>
        </div>
      </div>
      <div style={{marginTop: 14, transform: `scale(${pBan}) rotate(${-2 + Math.sin(f / 9)}deg)`}}>
        <Panel glow={C.sun} style={{padding: '10px 30px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 46, color: C.sun}}>TIES Ocarina of Time (1998)</div>
        </Panel>
      </div>
      <div style={{display: 'flex', gap: 10, marginTop: 6, opacity: pCrit}}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{transform: `translateY(${(1 - pCrit) * 40}px)`, textAlign: 'center'}}>
            <Ped seed={i + 1} f={f} action="wave" scale={0.7} />
          </div>
        ))}
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.green, opacity: pCrit}}>~150 critics · all positive · zero fights</div>
      <SrcTag o={appear(t, 1.2)} text="Metacritic PS5 score, ~150 reviews (HNGN, MNEEMO)" />
    </Stage>
  );
};

const Fps: React.FC = () => {
  const {t, f, fps} = useT();
  const cs = 0.9;
  const frame = (Math.floor(t * 30) % 30) + 1;
  const pStamp = pop(f, fps, 0.25, {damping: 9, stiffness: 220, mass: 0.7});
  const pBook = pop(f, fps, cs);
  const flip = (f * 0.5) % 1;
  const px = 420 + ((frame - 1) % 10) * 22;
  return (
    <Stage>
      <div style={{opacity: Math.min(1, pStamp * 2), marginBottom: 14}}><Stamp text="THE CATCH" color={C.red} p={pStamp} size={86} rot={-4} /></div>
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <Big size={220} color={C.sun}>30</Big>
        <div style={{textAlign: 'left'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 70, color: C.white, ...stroke(5)}}>FPS</div>
          <div style={{fontFamily: DISPLAY, fontSize: 38, color: C.cyan}}>every console</div>
        </div>
      </div>
      <Panel glow={C.cyan} style={{width: 780, padding: '12px 30px', marginTop: 12}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.cyan}}>
          <span>frame {String(frame).padStart(2, '0')}/30</span><span>1 second</span>
        </div>
        <div style={{height: 14, background: '#ffffff22', borderRadius: 7, marginTop: 8}}><div style={{width: `${(frame / 30) * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink})`}} /></div>
      </Panel>
      <div style={{marginTop: 18, transform: `scale(${pBook})`, opacity: Math.min(1, pBook * 2)}}>
        <svg viewBox="0 0 300 150" width={330}>
          <rect x="30" y="40" width="240" height="90" rx="10" fill={C.white} stroke={C.ink} strokeWidth="6" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={40 + i * 5 + flip * 150 * (i === 4 ? 1 : 0)} y={34 - i * 2} width="224" height="90" rx="8" fill="#fff" stroke={C.ink} strokeWidth="3" opacity={0.9} />)}
          <circle cx={px - 330 + 150} cy="90" r="14" fill={C.pink} stroke={C.ink} strokeWidth="4" />
        </svg>
      </div>
      <SrcTag o={appear(t, 0.8)} text="30 fps on all consoles incl. PS5 Pro (HNGN, EsportNow, BivashVlog)" />
    </Stage>
  );
};


const Hook: React.FC = () => {
  const {t, f, fps} = useT();
  const p1 = pop(f, fps, 0.0, {damping: 9, stiffness: 240, mass: 0.6});
  const p2 = pop(f, fps, 0.55, {damping: 7, stiffness: 220, mass: 0.7});
  const p3 = pop(f, fps, 1.7, {damping: 6, stiffness: 240, mass: 0.7});
  const shake = t > 0.55 && t < 0.9 ? Math.sin(f * 4) * 12 : 0;
  const rays = 14;
  return (
    <Stage>
      <svg viewBox="-540 -360 1080 720" width={1080} style={{position: 'absolute', opacity: 0.35, transform: `rotate(${t * 18}deg)`}}>
        {Array.from({length: rays}, (_, i) => <polygon key={i} points="0,0 -60,-700 60,-700" fill={i % 2 ? C.pink : C.sun} transform={`rotate(${(i * 360) / rays})`} />)}
      </svg>
      <div style={{transform: `scale(${p1}) translateX(${shake}px)`}}><Big size={104} color={C.white}>EVER WONDERED</Big></div>
      <div style={{transform: `scale(${p2}) translateX(${shake}px) rotate(${-3 + (1 - p2) * 10}deg)`}}>
        <Big size={150} color={C.sun}>HOW BIG</Big>
        <Big size={210} color={C.pink} style={{marginTop: -10}}>GTA 6</Big>
      </div>
      <div style={{transform: `scale(${p3}) rotate(${3 * Math.sin(f / 5)}deg)`, marginTop: 8}}>
        <div style={{background: C.red, border: `7px solid ${C.ink}`, borderRadius: 24, padding: '2px 40px', boxShadow: `0 8px 0 ${C.ink}, 0 0 40px ${C.red}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 96, color: C.white, ...stroke(5)}}>REALLY?!</div>
        </div>
      </div>
    </Stage>
  );
};

const StreamerAvatar: React.FC<{seed: number; f: number; skin: string; hair: string; shirt: string}> = ({seed, f, skin, hair, shirt}) => {
  const bob = Math.sin(f / 6 + seed) * 5;
  const mouth = Math.abs(Math.sin(f / 3 + seed * 2));
  return (
    <svg viewBox="0 0 200 230" width={230} style={{overflow: 'visible', transform: `translateY(${bob}px) rotate(${Math.sin(f / 9 + seed) * 2}deg)`}}>
      <g stroke={C.ink} strokeWidth="6" strokeLinejoin="round">
        <rect x="35" y="130" width="130" height="90" rx="40" fill={shirt} />
        <circle cx="100" cy="80" r="56" fill={skin} />
        {seed % 2 ? <path d="M42 70 Q100 -20 158 70 Q130 40 100 42 Q70 40 42 70Z" fill={hair} /> : <path d="M44 72 Q60 14 100 20 Q146 14 156 72 Q120 38 100 40 Q70 38 44 72Z" fill={hair} />}
        <path d="M40 84 Q40 18 100 18 Q160 18 160 84" fill="none" stroke="#222" strokeWidth="9" />
        <rect x="26" y="74" width="22" height="38" rx="10" fill={C.pink} />
        <rect x="152" y="74" width="22" height="38" rx="10" fill={C.pink} />
        <path d="M40 112 Q46 140 84 134" fill="none" stroke="#222" strokeWidth="6" />
        <circle cx="88" cy="134" r="8" fill="#222" />
      </g>
      <circle cx="80" cy="80" r="8" fill={C.ink} /><circle cx="120" cy="80" r="8" fill={C.ink} />
      <ellipse cx="100" cy="106" rx="16" ry={4 + mouth * 12} fill={C.ink} />
    </svg>
  );
};

const Streamers: React.FC = () => {
  const {t, f, fps} = useT();
  const cards = [
    {at: 1.9, name: 'KAI CENAT', note: 'marathon: aiming for 100% completion', col: C.cyan, skin: '#8D5A3B', hair: '#1a1a1a', shirt: C.violet, seed: 1},
    {at: 3.3, name: 'ISHOWSPEED', note: 'says: ~10 hours a day until he beats it', col: C.pink, skin: '#6B4429', hair: '#0e0e0e', shirt: C.red, seed: 2},
  ];
  const pT = pop(f, fps, 0.05);
  const bubbles = ['LETS GOOO', 'W GAME', 'no spoilers pls', 'first', 'KEKW', 'clip it', 'GOAT', '99?!'];
  return (
    <Stage>
      <div style={{transform: `scale(${pT})`, marginBottom: 6}}><Big size={84} color={C.white}>EVERYONE’S PLAYING</Big></div>
      <div style={{display: 'flex', gap: 30, alignItems: 'flex-start'}}>
        {cards.map((c, i) => {
          const p = pop(f, fps, c.at);
          return (
            <div key={i} style={{opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 120}px) scale(${0.7 + 0.3 * p})`}}>
              <Panel glow={c.col} style={{width: 470, padding: '12px 10px', textAlign: 'center', position: 'relative'}}>
                <div style={{position: 'absolute', top: 12, left: 14, background: C.red, borderRadius: 10, padding: '2px 14px', fontFamily: DISPLAY, fontSize: 30, color: C.white, opacity: 0.6 + 0.4 * Math.abs(Math.sin(f / 8))}}>● LIVE</div>
                <div style={{display: 'flex', justifyContent: 'center'}}><StreamerAvatar seed={c.seed} f={f} skin={c.skin} hair={c.hair} shirt={c.shirt} /></div>
                <div style={{fontFamily: DISPLAY, fontSize: 50, color: c.col, ...stroke(3)}}>{c.name}</div>
                <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.white, lineHeight: 1.1}}>{c.note}</div>
              </Panel>
            </div>
          );
        })}
      </div>
      {bubbles.map((b, i) => {
        const at = 2.2 + i * 0.9;
        const k = interpolate(t, [at, at + 2.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (k <= 0 || k >= 1) return null;
        return <div key={i} style={{position: 'absolute', left: 60 + ((i * 197) % 800), top: 600 - k * 520, opacity: Math.sin(k * Math.PI), background: '#ffffffee', color: C.ink, fontFamily: BODY, fontWeight: 700, fontSize: 30, padding: '4px 16px', borderRadius: 18}}>{b}</div>;
      })}
      <SrcTag text="Streamer plans per The Hype Magazine (Nov 20). Illustrated avatars, not real footage" />
    </Stage>
  );
};

const Viewers: React.FC = () => {
  const {t, f, fps} = useT();
  const end = useLE(5, 0);
  const val = interpolate(t, [0.3, end - 1.6], [0, 7.91], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const crowd = Math.floor(interpolate(t, [0.3, end - 1.6], [0, 150], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const pStamp = pop(f, fps, end - 1.6, {damping: 9, stiffness: 220, mass: 0.7});
  return (
    <Stage>
      <Big size={64} color={C.white}>WATCHING AT THE SAME TIME</Big>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 190, color: C.green, lineHeight: 1.05, textShadow: `0 0 40px ${C.green}`, transform: `scale(${1 + 0.02 * Math.sin(f / 3)})`}}>{val.toFixed(2)}M</div>
      <div style={{display: 'flex', flexWrap: 'wrap', width: 900, justifyContent: 'center', gap: 4, marginTop: 6}}>
        {Array.from({length: crowd}, (_, i) => (
          <svg key={i} viewBox="0 0 30 30" width={44}><circle cx="15" cy="15" r="13" fill={[C.pink, C.cyan, C.sun, C.green, C.violet][i % 5]} stroke={C.ink} strokeWidth="3" /><circle cx="10" cy="13" r="2.5" fill={C.ink} /><circle cx="20" cy="13" r="2.5" fill={C.ink} /><path d="M9 19 Q15 24 21 19" fill="none" stroke={C.ink} strokeWidth="2.5" /></svg>
        ))}
      </div>
      <div style={{position: 'absolute', right: 50, bottom: 40, opacity: Math.min(1, pStamp * 2)}}><Stamp text="LAUNCH RECORD" color={C.hot} p={pStamp} size={52} rot={7} /></div>
      <SrcTag text="Streams Charts via MNEEMO. Preliminary, single report" />
    </Stage>
  );
};

const Recap: React.FC = () => {
  const {t, f, fps} = useT();
  const items = [
    {at: useLT(8, 0), n: '$3.79B', sub: 'in 24 hours', col: C.sun},
    {at: useLT(8, 1), n: 'MILLIONS', sub: 'watching live', col: C.green},
    {at: useLT(8, 2), n: '99', sub: 'Metacritic', col: C.cyan},
  ];
  return (
    <Stage>
      <div style={{transform: `scale(${pop(f, fps, 0.05)})`, marginBottom: 20}}><Big size={100} color={C.sun}>RECAP</Big></div>
      {items.map((it, i) => {
        const p = pop(f, fps, it.at + 0.05);
        return (
          <div key={i} style={{opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -700}px)`, marginBottom: 18}}>
            <Panel glow={it.col} style={{display: 'flex', alignItems: 'center', gap: 24, width: 860, padding: '14px 28px'}}>
              <svg viewBox="0 0 60 60" width={80}><circle cx="30" cy="30" r="26" fill={C.green} stroke={C.ink} strokeWidth="5" /><path d="M16 31 L26 41 L45 20" fill="none" stroke={C.ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div style={{fontFamily: DISPLAY, fontSize: 70, color: it.col}}>{it.n}</div>
              <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.white}}>{it.sub}</div>
            </Panel>
          </div>
        );
      })}
    </Stage>
  );
};

const Connect: React.FC = () => {
  const {t, f, fps} = useT();
  const l2 = useLT(9, 2), l3 = useLT(9, 3), l1 = useLT(9, 1);
  const year = Math.floor(interpolate(t, [0, l1], [2013, 2026], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const crowd = Math.floor(interpolate(t, [l2, l3 + 0.3], [0, 120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const pYou = pop(f, fps, l3 + 0.9, {damping: 8, stiffness: 180, mass: 0.8});
  const pDelay = pop(f, fps, l1 + 0.1, {damping: 8, stiffness: 220, mass: 0.7});
  return (
    <Stage>
      {t < l2 ? (
        <>
          <Panel glow={C.cyan} style={{padding: '10px 40px'}}><div style={{fontFamily: MONO, fontWeight: 800, fontSize: 150, color: C.cyan}}>{year}</div></Panel>
          <div style={{fontFamily: DISPLAY, fontSize: 60, color: C.white, marginTop: 16, ...stroke(5)}}>{year < 2026 ? 'still waiting…' : 'FINALLY'}</div>
          <div style={{opacity: Math.min(1, pDelay * 2), marginTop: 20}}><Stamp text="2 DELAYS" color={C.hot} p={pDelay} size={80} rot={-5} /></div>
        </>
      ) : (
        <>
          <div style={{display: 'flex', flexWrap: 'wrap', width: 940, justifyContent: 'center', gap: 4}}>
            {Array.from({length: crowd}, (_, i) => (
              <svg key={i} viewBox="0 0 30 30" width={56}><circle cx="15" cy="15" r="13" fill={[C.pink, C.cyan, C.sun, C.green, C.violet][i % 5]} stroke={C.ink} strokeWidth="3" /><circle cx="10" cy="13" r="2.5" fill={C.ink} /><circle cx="20" cy="13" r="2.5" fill={C.ink} /><path d="M9 19 Q15 24 21 19" fill="none" stroke={C.ink} strokeWidth="2.5" /></svg>
            ))}
          </div>
          <div style={{position: 'absolute', bottom: 40, opacity: Math.min(1, pYou * 2), transform: `scale(${0.6 + 0.4 * pYou}) rotate(${-3 + Math.sin(f / 9)}deg)`}}>
            <Panel glow={C.pink} style={{padding: '8px 36px'}}><div style={{fontFamily: DISPLAY, fontSize: 88, color: C.white, ...stroke(5)}}>YOU WERE THERE</div></Panel>
          </div>
        </>
      )}
    </Stage>
  );
};

const EndCard: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.3);
  const pulse = 1 + 0.06 * Math.sin(f / 4);
    return (
    <Stage>
      <div style={{transform: `scale(${p * pulse})`}}>
        <div style={{background: C.red, borderRadius: 30, padding: '20px 70px', border: `8px solid ${C.ink}`, boxShadow: `0 12px 0 ${C.ink}, 0 0 50px ${C.red}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 120, color: C.white, ...stroke(6)}}>FOLLOW</div>
        </div>
      </div>
      <div style={{marginTop: 34, opacity: appear(t, 1.1), transform: `translateY(${(1 - appear(t, 1.1)) * 60}px)`}}>
        <Panel glow={C.cyan} style={{width: 860, textAlign: 'center'}}>
          <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.cyan}}>NEXT EPISODE</div>
          <div style={{fontFamily: DISPLAY, fontSize: 58, color: C.white, lineHeight: 1.1}}>Why do games even have loading screens?</div>
        </Panel>
      </div>
    </Stage>
  );
};

const SCENES = [Hook, Counter, MoneyCompare, PerSec, Streamers, Viewers, Score, Fps, Recap, Connect, EndCard];

// ---------- captions ----------
const KEY = /^(insane|really|big|Kai|Cenat|IShowSpeed|million|record|watching|hundred|streaming|percent|GTA|6|3\.79|billion|dollars|forty-four|thousand|second|5|eight|hundred|sixteen|million|four|ninety-nine|Metacritic|Ocarina|thirty|frames|console|catch|busy|services|PC|follow|money|score|traffic|recap|Thursday|24|hours)$/i;
const clean = (w: string) => w.replace(/[“”"]/g, '').replace(/[.,?!:]+$/, '');

const Captions: React.FC<{words: (GWord & {who?: string})[]}> = ({words}) => {
  const {t, f, fps} = useT();
  const pages: (GWord & {who?: string})[][] = [];
  let cur: (GWord & {who?: string})[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= 3 || /[.,:;?!”]$/.test(w.w) || (next && (next.start - w.end > 0.2 || next.who !== w.who))) {
      pages.push(cur);
      cur = [];
    }
  });
  if (cur.length) pages.push(cur);
  const page = pages.find((p) => t >= p[0].start - 0.05 && t < p[p.length - 1].end + 0.25);
  if (!page) return null;
  const p = pop(f, fps, page[0].start - 0.05, {damping: 12, stiffness: 260, mass: 0.5});
  const compy = page[0].who === 'compy';
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1075, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 34px', transform: `scale(${0.7 + 0.3 * p})`}}>
      {page.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.05;
        const key = KEY.test(clean(w.w));
        const col = active ? C.sun : key ? C.cyan : compy ? '#E6D6FF' : C.white;
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
  ['shocked', 'shocked'], ['shocked', 'smug'], ['happy', 'smug'], ['shocked', 'shocked'], ['happy', 'happy'],
  ['shocked', 'smug'], ['happy', 'smug'], ['confused', 'smug'], ['happy', 'happy'], ['thinking', 'thinking'], ['happy', 'happy'],
];

const Mascots: React.FC<{mouth: number[]; cm: number[]; bi: number}> = ({mouth, cm, bi}) => {
  const {f} = useT();
  const m = mouth[f] ?? 0;
  const c = cm[f] ?? 0;
  const end = bi === 10;
  const [eb, ec] = EMO[bi];
  const hop = (k: number) => -Math.abs(Math.sin(f / 7 + k)) * (end ? 40 : 10);
  const size = end ? 340 : 230;
  const y = end ? 1300 : 1290;
  return (
    <>
      <div style={{position: 'absolute', left: end ? 120 : 20, top: y + hop(0), width: size}}>
        <Character who="byte" emotion={eb} speaking={m > 0.12} mouth={m} frame={f} hit={0} />
      </div>
      <div style={{position: 'absolute', right: end ? 120 : 20, top: y + 20 + hop(1.6), width: size}}>
        <Character who="compy" emotion={ec} speaking={c > 0.12} mouth={c} frame={f} hit={0} />
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
      <div style={{background: C.pink, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.white, transform: `rotate(${Math.sin(f / 10) * 3}deg)`, ...stroke(3)}}>INSANE NUMBERS</div>
    </div>
  );
};

const Ticker: React.FC = () => {
  const {t} = useT();
  const txt = '  ★ GTA 6  ★  $3.79B IN 24 HOURS  ★  99 METACRITIC  ★  RECORD LAUNCH  ★  ';
  const row = txt.repeat(4);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 215, height: 52, background: C.red, overflow: 'hidden', borderTop: `4px solid ${C.ink}`, borderBottom: `4px solid ${C.ink}`}}>
      <div style={{whiteSpace: 'nowrap', transform: `translateX(${-((t * 260) % 1500)}px)`, fontFamily: DISPLAY, fontSize: 38, color: C.white, lineHeight: '52px'}}>{row}</div>
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

const Transition: React.FC<{since: number; bi: number}> = ({since, bi}) => {
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
export const Gta6Launch: React.FC<Gta6Props> = ({audio, totalSec, words, lines, mouth, compyMouth, beats}) => {
  const {f, t, fps} = useT();
  let bi = 0;
  beats.forEach((b, k) => { if (t >= b) bi = k; });
  const since = t - beats[bi];
  const hue = [0, 20, -15, 0, 15, -20, 10, 0, 15, -10, 5][bi] ?? 0;
  let punch = 0;
  for (const w of words) if (KEY.test(clean(w.w)) && t >= w.start && t < w.start + 0.22) punch = Math.max(punch, 1 - (t - w.start) / 0.22);
  const zoom = 1 + 0.012 * Math.sin(f / 40) + 0.03 * Math.max(0, 1 - since / 0.4) + 0.025 * punch;
  return (
    <ScriptCtx.Provider value={{lines, beats}}>
      <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
        {audio ? <Audio src={staticFile(audio)} /> : null}
        <div style={{position: 'absolute', inset: 0, transform: `scale(${1.02 + 0.01 * Math.sin(f / 60)})`}}>
          <Background t={t} f={f} hue={hue} />
        </div>
        <AbsoluteFill style={{transform: `scale(${zoom}) rotate(${Math.sin(f / 50) * 0.4}deg)`}}>
          {beats.map((b, k) => {
            const S = SCENES[k];
            const end = k + 1 < beats.length ? beats[k + 1] : totalSec;
            return (
              <Sequence key={k} from={Math.round(b * fps)} durationInFrames={Math.max(1, Math.round((end - b) * fps))}>
                <S />
              </Sequence>
            );
          })}
        </AbsoluteFill>
        <Mascots mouth={mouth} cm={compyMouth} bi={bi} />
        <Captions words={words} />
        <Header />
        <Ticker />
        <Progress total={totalSec} />
        <Transition since={since} bi={bi} />
      </AbsoluteFill>
    </ScriptCtx.Provider>
  );
};
