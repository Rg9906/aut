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


const C = {pink:'#E8742A',hot:'#D9531E',sun:'#FFC15E',cyan:'#7FD8E6',violet:'#9B6B4A',ink:'#1A0E06',night:'#2B170A',white:'#FFF4E2',green:'#9BD67A',red:'#C8341E'};
const DISPLAY = '"Lilita One", "Fredoka", Arial, sans-serif';
const BODY = '"Fredoka", Arial, sans-serif';
const MONO = '"JetBrains Mono", monospace';

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


const Dune: React.FC<{y: number; col: string; amp: number; ph: number; t: number}> = ({y, col, amp, ph, t}) => {
  const pts = Array.from({length: 25}, (_, i) => {const x = i * 50; const yy = y + Math.sin(i / 3 + ph + t * 0.15) * amp + Math.sin(i / 1.3 + ph) * amp * 0.3; return `${x},${yy}`;}).join(' L');
  return <path d={`M0,1920 L${pts} L1200,1920 Z`} fill={col} />;
};
const Background: React.FC<{t: number; f: number; hue: number}> = ({t, f, hue}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #1B0E2A 0%, #6A2D3C 30%, #E8742A 52%, #FFC15E 62%, #3A1E0E 63%)', filter: `hue-rotate(${hue}deg)`}}>
    {Array.from({length: 40}, (_, i) => (<div key={i} style={{position: 'absolute', left: rnd(i) * 1080, top: rnd(i + 9) * 520, width: 4, height: 4, borderRadius: 2, background: '#fff', opacity: 0.3 + 0.5 * Math.abs(Math.sin(f / 14 + i))}} />))}
    <div style={{position: 'absolute', left: 120, top: 330, width: 130, height: 130, borderRadius: 65, background: '#FFE9C2', boxShadow: '0 0 60px #FFC15E'}} />
    <div style={{position: 'absolute', left: 300, top: 400, width: 70, height: 70, borderRadius: 35, background: '#F4B98A', boxShadow: '0 0 40px #E8742A'}} />
    <svg viewBox="0 0 1200 1920" style={{position: 'absolute', left: -60, top: 0, width: 1200, height: 1920}}>
      <Dune y={1080} col="#B8531F" amp={30} ph={0} t={t} />
      <Dune y={1200} col="#8F3E18" amp={40} ph={2} t={t} />
      <Dune y={1380} col="#5E2910" amp={50} ph={4} t={t} />
      <Dune y={1600} col="#2B1307" amp={40} ph={1} t={t} />
    </svg>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0A061466 0%, #0A061400 22%, #0A061400 55%, #1A0E06cc 100%)'}} />
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
const SrcTag: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top: 1790, textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 26, color: '#ffffffc0'}}>{text}</div>
);

const Hook: React.FC = () => {
  const {t, f, fps} = useT();
  const p1 = pop(f, fps, 0.0, {damping: 9, stiffness: 240, mass: 0.6});
  const p2 = pop(f, fps, 0.5, {damping: 8, stiffness: 220, mass: 0.7});
  const p3 = pop(f, fps, 1.9, {damping: 6, stiffness: 240, mass: 0.7});
  return (
    <Stage>
      <div style={{transform: `scale(${p1})`}}><Big size={92}>DID YOU KNOW</Big></div>
      <div style={{transform: `scale(${p2}) rotate(${-3 + (1 - p2) * 8}deg)`}}>
        <Big size={220} color={C.sun}>DUNE</Big>
        <Big size={84}>PREDICTED THE AI WAR?</Big>
      </div>
      <div style={{transform: `scale(${p3}) rotate(${2 * Math.sin(f / 5)}deg)`, marginTop: 14}}>
        <div style={{background: C.red, border: `7px solid ${C.ink}`, borderRadius: 24, padding: '2px 40px', boxShadow: `0 8px 0 ${C.ink}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 64, color: C.white, ...stroke(5)}}>SANDWORMS SAW IT COMING</div>
        </div>
      </div>
    </Stage>
  );
};

const War: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(1, 1);
  const humans = Array.from({length: 7}, (_, i) => i);
  const adv = interpolate(t, [0, 2.6], [0, 1], {extrapolateRight: 'clamp'});
  const yr = Math.floor(interpolate(t, [0.3, 2.8], [0, 100], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'}));
  return (
    <Stage>
      <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, transform: `translateX(${adv * 60}px)`}}>
          {humans.slice(0, 4).map((i) => <svg key={i} viewBox="0 0 30 30" width={70}><circle cx="15" cy="15" r="13" fill={[C.sun, C.pink, C.cyan, C.green][i % 4]} stroke={C.ink} strokeWidth="3" /><circle cx="10" cy="13" r="2.5" fill={C.ink} /><circle cx="20" cy="13" r="2.5" fill={C.ink} /></svg>)}
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: 100, color: C.sun, ...stroke(7), transform: `scale(${1 + 0.1 * Math.sin(f / 3)})`}}>VS</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, transform: `translateX(${-adv * 60}px)`}}>
          {[0, 1].map((i) => <div key={i}><RobotIcon size={150} f={f + i * 7} /></div>)}
        </div>
      </div>
      <div style={{marginTop: 30, opacity: appear(t, 0.3)}}><Panel glow={C.sun} style={{padding: '8px 36px'}}><div style={{fontFamily: MONO, fontWeight: 800, fontSize: 80, color: C.sun}}>NEARLY {Math.max(yr, 1)} YEARS</div></Panel></div>
      <div style={{opacity: appear(t, l1), marginTop: 14, fontFamily: DISPLAY, fontSize: 56, color: C.white, ...stroke(5)}}>THE BUTLERIAN JIHAD</div>
    </Stage>
  );
};

const Cause: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(2, 1);
  const x = pop(f, fps, 0.2);
  const y = pop(f, fps, l1 + 0.1);
  return (
    <Stage>
      {t < l1 ? (
        <div style={{transform: `scale(${x})`, textAlign: 'center'}}>
          <RobotIcon size={260} crossed={interpolate(t, [0.6, 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} f={f} />
          <Big size={90} color={C.red}>NOT KILLER ROBOTS</Big>
        </div>
      ) : (
        <div style={{transform: `scale(${y})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <svg viewBox="0 0 60 60" width={130}><circle cx="30" cy="30" r="26" fill={C.sun} stroke={C.ink} strokeWidth="4" /><circle cx="22" cy="26" r="3" fill={C.ink} /><circle cx="38" cy="26" r="3" fill={C.ink} /><path d="M20 40 Q30 36 40 40" fill="none" stroke={C.ink} strokeWidth="3" /></svg>
            <div style={{fontFamily: DISPLAY, fontSize: 80, color: C.cyan, ...stroke(5)}}>{'→ → →'}</div>
            <RobotIcon size={150} f={f} />
          </div>
          <Panel glow={C.red} style={{padding: '6px 34px'}}><div style={{fontFamily: DISPLAY, fontSize: 64, color: C.white}}>WE HANDED OVER OUR THINKING</div></Panel>
        </div>
      )}
    </Stage>
  );
};

const Rule: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(3, 1);
  const p = pop(f, fps, l1 + 0.05, {damping: 7, stiffness: 160, mass: 0.9});
  return (
    <Stage>
      <div style={{opacity: appear(t, 0.1), transform: `translateY(${(1 - appear(t, 0.1)) * -40}px)`}}><Big size={100} color={C.sun}>THE ONE RULE</Big></div>
      <div style={{transform: `scale(${p})`, marginTop: 20, position: 'relative'}}>
        <Panel glow={C.sun} style={{width: 860, textAlign: 'center', padding: '30px 34px'}}>
          <div style={{fontFamily: DISPLAY, fontSize: 70, color: C.white, lineHeight: 1.1}}>DON'T BUILD A MACHINE THAT COPIES A <span style={{color: C.sun}}>HUMAN MIND</span></div>
        </Panel>
        <div style={{position: 'absolute', right: -10, top: 150}}><Stamp text="BANNED" color={C.red} p={p} size={80} rot={10} /></div>
      </div>
    </Stage>
  );
};

const TenK: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(4, 1);
  const n = Math.floor(interpolate(t, [0.2, l1 + 1.0], [0, 10000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const seg = Math.floor(interpolate(t, [0.2, l1 + 1.0], [0, 20], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <Stage>
      <Panel glow={C.sun} style={{padding: '10px 50px'}}><div style={{fontFamily: MONO, fontWeight: 800, fontSize: 150, color: C.sun}}>{n.toLocaleString('en-US')}</div></Panel>
      <div style={{fontFamily: DISPLAY, fontSize: 80, color: C.white, marginTop: 14, ...stroke(6)}}>YEARS, NO AI</div>
      <div style={{display: 'flex', gap: 6, marginTop: 28}}>
        {Array.from({length: 20}, (_, i) => <div key={i} style={{width: 36, height: 50, borderRadius: 8, background: i < seg ? C.pink : '#ffffff22', border: `3px solid ${C.ink}`}} />)}
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: '#ffffffcc', marginTop: 14}}>before Paul Atreides is born</div>
    </Stage>
  );
};

const Mentats: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(5, 1);
  const p = pop(f, fps, 0.2);
  const eq = ['87 × 93', '= 8,091'];
  const show = t > l1 - 0.2 ? 1 : 0;
  return (
    <Stage>
      <div style={{transform: `scale(${p})`, position: 'relative'}}>
        <svg viewBox="0 0 300 300" width={380}>
          <circle cx="150" cy="150" r="110" fill="#F0C9A0" stroke={C.ink} strokeWidth="8" />
          <path d="M60 130 Q150 10 240 130 Q150 70 60 130Z" fill={C.ink} />
          <circle cx="112" cy="155" r="10" fill={C.ink} /><circle cx="188" cy="155" r="10" fill={C.ink} />
          <path d="M115 205 Q150 225 185 205" fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
          <rect x="100" y="50" width="100" height="26" rx="10" fill={C.cyan} opacity={0.4 + 0.4 * Math.sin(f / 4)} />
        </svg>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{position: 'absolute', left: 280 + (i % 2) * 40, top: 20 + i * 40, fontFamily: MONO, fontWeight: 800, fontSize: 44, color: C.cyan, opacity: 0.5 + 0.5 * Math.sin(f / 5 + i)}}>{['01', '7×3', 'Σ', '√', '42'][i]}</div>)}
      </div>
      <div style={{marginTop: 14, opacity: show, transform: `scale(${0.7 + 0.3 * show})`}}><Panel glow={C.cyan} style={{padding: '8px 34px'}}><div style={{fontFamily: DISPLAY, fontSize: 76, color: C.white}}>MENTATS: HUMAN COMPUTERS</div></Panel></div>
    </Stage>
  );
};

const Now: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.2);
  const icons = [['📱', 0], ['💻', 1], ['⌚', 2], ['🎮', 3]] as const;
  return (
    <Stage>
      <div style={{display: 'flex', gap: 24}}>
        {icons.map(([ic, i]) => <div key={i} style={{fontSize: 130, transform: `scale(${pop(f, fps, 0.15 + i * 0.12)}) rotate(${Math.sin(f / 6 + i) * 6}deg)`}}>{ic}</div>)}
      </div>
      <div style={{transform: `scale(${p})`, marginTop: 24}}><Big size={110} color={C.sun}>SOUND FAMILIAR?</Big></div>
    </Stage>
  );
};

const Recap: React.FC = () => {
  const {t, f, fps} = useT();
  const items = [
    {at: useLT(7, 0), n: 'AI WAR', sub: 'against thinking machines', col: C.red},
    {at: useLT(7, 1), n: '10,000', sub: 'years of no computers', col: C.sun},
    {at: useLT(7, 2), n: 'MENTATS', sub: 'humans do the math', col: C.cyan},
  ];
  return (
    <Stage>
      <div style={{transform: `scale(${pop(f, fps, 0.05)})`, marginBottom: 20}}><Big size={100} color={C.sun}>RECAP</Big></div>
      {items.map((it, i) => {
        const p = pop(f, fps, it.at + 0.05);
        return (
          <div key={i} style={{opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -700}px)`, marginBottom: 18}}>
            <Panel glow={it.col} style={{display: 'flex', alignItems: 'center', gap: 24, width: 900, padding: '14px 28px'}}>
              <svg viewBox="0 0 60 60" width={80}><circle cx="30" cy="30" r="26" fill={C.green} stroke={C.ink} strokeWidth="5" /><path d="M16 31 L26 41 L45 20" fill="none" stroke={C.ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div style={{fontFamily: DISPLAY, fontSize: 62, color: it.col}}>{it.n}</div>
              <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.white}}>{it.sub}</div>
            </Panel>
          </div>
        );
      })}
    </Stage>
  );
};

const Connect: React.FC = () => {
  const {t, f, fps} = useT();
  const l1 = useLT(8, 1), l2 = useLT(8, 2);
  const pd = pop(f, fps, 0.2);
  const pq = pop(f, fps, l1 + 0.1, {damping: 8, stiffness: 180, mass: 0.8});
  const pc = pop(f, fps, l2 + 0.05);
  const days = Math.max(0, Math.round(interpolate(t, [0, 1], [26, 0], {extrapolateRight: 'clamp'})));
  return (
    <Stage>
      {t < l1 ? (
        <div style={{transform: `scale(${pd})`, textAlign: 'center'}}>
          <Panel glow={C.sun} style={{padding: '10px 50px'}}><div style={{fontFamily: DISPLAY, fontSize: 130, color: C.sun}}>DEC 18</div></Panel>
          <div style={{fontFamily: DISPLAY, fontSize: 56, color: C.white, marginTop: 14, ...stroke(5)}}>DUNE: PART THREE</div>
        </div>
      ) : t < l2 ? (
        <div style={{transform: `scale(${pq}) rotate(${Math.sin(f / 9) * 1.5}deg)`, textAlign: 'center'}}>
          <Big size={86} color={C.white}>BAN ONE TECH.</Big>
          <Big size={130} color={C.sun}>WHICH ONE?</Big>
        </div>
      ) : (
        <div style={{transform: `scale(${pc})`, textAlign: 'center'}}>
          <Panel glow={C.cyan} style={{padding: '10px 50px'}}><div style={{fontFamily: DISPLAY, fontSize: 96, color: C.white}}>COMMENT IT 👇</div></Panel>
        </div>
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
      <div style={{display: 'flex', gap: 24, transform: `scale(${p * pulse})`}}>
        <div style={{background: C.red, borderRadius: 30, padding: '16px 44px', border: `8px solid ${C.ink}`, boxShadow: `0 12px 0 ${C.ink}`}}><div style={{fontFamily: DISPLAY, fontSize: 84, color: C.white, ...stroke(6)}}>LIKE</div></div>
        <div style={{background: C.sun, borderRadius: 30, padding: '16px 44px', border: `8px solid ${C.ink}`, boxShadow: `0 12px 0 ${C.ink}`}}><div style={{fontFamily: DISPLAY, fontSize: 84, color: C.ink}}>SUBSCRIBE</div></div>
      </div>
    </Stage>
  );
};

const SCENES = [Hook, War, Cause, Rule, TenK, Mentats, Now, Recap, Connect, EndCard];

// ---------- captions ----------
const KEY = /^(dune|computers|banned|AI|war|machines|thinking|human|mind|ten|thousand|years|Mentats|math|December|eighteenth|Doomsday|ban|technology|comments|like|subscribe|nearly|century|rule|never|decades)$/i;
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
const EMO: [Emotion, Emotion][] = [['shocked','smug'],['confused','smug'],['shocked','smug'],['thinking','smug'],['shocked','shocked'],['happy','smug'],['confused','smug'],['happy','happy'],['thinking','thinking'],['happy','happy']];

const Mascots: React.FC<{mouth: number[]; cm: number[]; bi: number}> = ({mouth, cm, bi}) => {
  const {f} = useT();
  const m = mouth[f] ?? 0;
  const c = cm[f] ?? 0;
  const end = bi === 9;
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
      <div style={{background: C.pink, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.white, transform: `rotate(${Math.sin(f / 10) * 3}deg)`, ...stroke(3)}}>DUNE FACT</div>
    </div>
  );
};

const Ticker: React.FC = () => {
  const {t} = useT();
  const txt = '  ★ DUNE  ★  AI WAS BANNED  ★  10,000 YEARS, NO COMPUTERS  ★  PART THREE DEC 18  ★  ';
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
export const DuneSpecial: React.FC<Gta6Props> = ({audio, totalSec, words, lines, mouth, compyMouth, beats}) => {
  const {f, t, fps} = useT();
  let bi = 0;
  beats.forEach((b, k) => { if (t >= b) bi = k; });
  const since = t - beats[bi];
  const hue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0][bi] ?? 0;
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
