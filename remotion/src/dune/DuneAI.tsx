import React from 'react';
import {AbsoluteFill, Sequence, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, Emotion} from '../Characters';

export type DWord = {w: string; start: number; end: number; who?: string};
export type DuneProps = {audio: string; totalSec: number; words: DWord[]; lines: {who: string; text: string; beat: number; start: number; end: number}[]; mouth: number[]; compyMouth: number[]; beats: number[]};

// original desert palette (no film art, logos or stills)
const C = {ink: '#120A06', night: '#2A1408', sand: '#F2B35A', orange: '#FF7A1A', rust: '#C2410C', blue: '#39C8FF', cream: '#FFF3DC', red: '#FF3B30', gold: '#FFD23F'};
const DISPLAY = '"Lilita One", "Fredoka", Arial, sans-serif';
const BODY = '"Fredoka", Arial, sans-serif';
const MONO = '"JetBrains Mono", monospace';

const useT = () => {const f = useCurrentFrame(); const {fps} = useVideoConfig(); return {f, fps, t: f / fps};};
const pop = (f: number, fps: number, at: number, cfg = {damping: 11, stiffness: 190, mass: 0.7}) => spring({frame: f - Math.round(at * fps), fps, config: cfg});
const rnd = (s: number) => {const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x);};
const stroke = (px: number, col = C.ink) => ({WebkitTextStroke: `${px}px ${col}`, paintOrder: 'stroke fill' as any, textShadow: `0 ${px * 0.9}px 0 ${col}, 0 0 ${px * 6}px ${col}aa`});

export const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 120, color = C.cream, style}) => (
  <div style={{fontFamily: DISPLAY, fontSize: size, color, lineHeight: 1.0, textAlign: 'center', textTransform: 'uppercase', ...stroke(Math.max(6, size / 14)), ...style}}>{children}</div>
);
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{top: 270, height: 800, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18}}>{children}</AbsoluteFill>
);
const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({children, style, glow = C.orange}) => (
  <div style={{background: 'linear-gradient(160deg, #2A1408ee, #160A04ee)', border: `5px solid ${glow}`, borderRadius: 30, boxShadow: `0 0 36px ${glow}77`, padding: '24px 32px', ...style}}>{children}</div>
);
const Src: React.FC<{text: string}> = ({text}) => (
  <div style={{fontFamily: BODY, fontSize: 28, color: '#FFF3DCcc', textAlign: 'center', letterSpacing: 1, marginTop: 6}}>{text}</div>
);

// ---------- background: dunes + twin moons ----------
export const Moons: React.FC<{t: number; s?: number}> = ({t, s = 1}) => (
  <>
    <div style={{position: 'absolute', left: 130 * s, top: 330 + Math.sin(t / 2) * 6, width: 150 * s, height: 150 * s, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FFF3DC, #E8B76A 60%, #B77933)', boxShadow: '0 0 60px #F2B35A88'}} />
    <div style={{position: 'absolute', left: 330 * s, top: 280 + Math.cos(t / 2) * 6, width: 90 * s, height: 90 * s, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FFF3DC, #D99A55 60%, #9A5E26)', boxShadow: '0 0 40px #F2B35A66'}} />
  </>
);
export const DuneBg: React.FC<{t: number; f: number; hue: number}> = ({t, f, hue}) => (
  <AbsoluteFill style={{filter: `hue-rotate(${hue}deg)`}}>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #1A0B05 0%, #5A2410 38%, #E0661A 62%, #F2B35A 78%, #8A3A12 100%)'}} />
    <Moons t={t} />
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}} preserveAspectRatio="none">
      {[0, 1, 2].map((i) => {
        const y = 1050 + i * 160;
        const ph = t * (0.25 + i * 0.1);
        let d = `M0 ${y}`;
        for (let x = 0; x <= 1080; x += 60) d += ` L${x} ${y + Math.sin(x / 170 + i * 2 + ph) * (50 + i * 14)}`;
        d += ' L1080 1920 L0 1920 Z';
        return <path key={i} d={d} fill={['#B9531A', '#8E3B12', '#5C250C'][i]} opacity={0.95} />;
      })}
    </svg>
    {Array.from({length: 22}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: ((rnd(i) * 1300 + t * (40 + rnd(i + 9) * 60)) % 1300) - 100, top: 300 + rnd(i + 3) * 1300, width: 6, height: 6, borderRadius: 3, background: C.sand, opacity: 0.25 + 0.3 * rnd(i + 7)}} />
    ))}
  </AbsoluteFill>
);

// ---------- icons ----------
const Robot: React.FC<{size: number; f: number}> = ({size, f}) => (
  <svg viewBox="0 0 200 200" width={size} height={size}>
    <line x1="100" y1="14" x2="100" y2="40" stroke={C.cream} strokeWidth="6" />
    <circle cx="100" cy="12" r="9" fill={C.red} opacity={0.6 + 0.4 * Math.sin(f / 4)} />
    <rect x="44" y="40" width="112" height="86" rx="20" fill="#9FB4C7" stroke={C.ink} strokeWidth="6" />
    <circle cx="76" cy="80" r="14" fill={C.blue} /><circle cx="124" cy="80" r="14" fill={C.blue} />
    <rect x="76" y="104" width="48" height="8" rx="4" fill={C.ink} />
    <rect x="62" y="130" width="76" height="52" rx="12" fill="#7C93A8" stroke={C.ink} strokeWidth="6" />
  </svg>
);
const Person: React.FC<{size: number; col?: string}> = ({size, col = C.sand}) => (
  <svg viewBox="0 0 120 160" width={size} height={size * 1.33}>
    <circle cx="60" cy="38" r="26" fill={col} stroke={C.ink} strokeWidth="6" />
    <path d="M14 150 q6 -70 46 -70 q40 0 46 70 z" fill={col} stroke={C.ink} strokeWidth="6" />
  </svg>
);
const Laptop: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 200 150" width={size} height={size * 0.75}>
    <rect x="30" y="10" width="140" height="90" rx="8" fill="#2B3A4A" stroke={C.ink} strokeWidth="6" />
    <rect x="42" y="22" width="116" height="66" fill={C.blue} opacity="0.85" />
    <path d="M10 112 h180 l-14 22 h-152 z" fill="#9FB4C7" stroke={C.ink} strokeWidth="6" />
  </svg>
);

// ---------- scenes ----------
const Hook: React.FC = () => {
  const {t, f, fps} = useT();
  const p1 = pop(f, fps, 0.05, {damping: 9, stiffness: 240, mass: 0.6});
  const p2 = pop(f, fps, 0.7, {damping: 7, stiffness: 220, mass: 0.7});
  const p3 = pop(f, fps, 2.0, {damping: 8, stiffness: 200, mass: 0.7});
  const shake = t > 0.7 && t < 1.05 ? Math.sin(f * 4) * 12 : 0;
  return (
    <Stage>
      <svg viewBox="-540 -360 1080 720" width={1080} style={{position: 'absolute', opacity: 0.28, transform: `rotate(${t * 14}deg)`}}>
        {Array.from({length: 14}, (_, i) => <polygon key={i} points="0,0 -60,-700 60,-700" fill={i % 2 ? C.orange : C.gold} transform={`rotate(${(i * 360) / 14})`} />)}
      </svg>
      <div style={{transform: `scale(${p1}) translateX(${shake}px)`}}><Big size={150} color={C.gold}>DUNE</Big></div>
      <div style={{transform: `scale(${p2}) translateX(${shake}px) rotate(${-3 + (1 - p2) * 8}deg)`}}><Big size={190} color={C.cream}>BANNED AI</Big></div>
      <div style={{transform: `scale(${p3}) rotate(${3 * Math.sin(f / 6)}deg)`}}>
        <div style={{background: C.red, border: `7px solid ${C.ink}`, borderRadius: 22, padding: '2px 38px', boxShadow: `0 8px 0 ${C.ink}, 0 0 40px ${C.red}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 104, color: C.cream, ...stroke(5)}}>IN 1965</div>
        </div>
      </div>
    </Stage>
  );
};

const Jihad: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.1);
  const x = pop(f, fps, 1.4, {damping: 6, stiffness: 260, mass: 0.6});
  return (
    <Stage>
      <div style={{position: 'relative', transform: `scale(${p})`}}>
        <Robot size={380} f={f} />
        <svg viewBox="0 0 200 200" width={380} height={380} style={{position: 'absolute', inset: 0, opacity: x, transform: `scale(${1 + (1 - x) * 1.5})`}}>
          <circle cx="100" cy="100" r="92" fill="none" stroke={C.red} strokeWidth="14" />
          <line x1="34" y1="166" x2="166" y2="34" stroke={C.red} strokeWidth="14" />
        </svg>
      </div>
      <div style={{transform: `scale(${pop(f, fps, 1.9)})`}}><Big size={96} color={C.gold}>BUTLERIAN</Big><Big size={120} color={C.cream}>JIHAD</Big></div>
      <Src text="Dune's backstory: thinking machines get banned" />
    </Stage>
  );
};

const Butler: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.1, {damping: 10, stiffness: 140, mass: 0.9});
  const full = 'Darwin among the Machines';
  const n = Math.min(full.length, Math.floor(Math.max(0, t - 0.6) * 22));
  const stamp = pop(f, fps, 2.4, {damping: 8, stiffness: 240, mass: 0.6});
  return (
    <Stage>
      <div style={{transform: `scale(${0.8 + 0.2 * p}) rotate(${-2 * p}deg)`, background: '#F5E6C4', color: '#2A1A0A', borderRadius: 10, padding: '34px 40px', width: 860, boxShadow: '0 20px 50px #0009', border: '3px solid #B79A62'}}>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 30, letterSpacing: 4, textAlign: 'center', borderBottom: '3px double #2A1A0A', paddingBottom: 8}}>THE PRESS · CHRISTCHURCH</div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 28, marginTop: 10, textAlign: 'center'}}>13 JUNE 1863 · LETTER TO THE EDITOR</div>
        <div style={{fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 64, marginTop: 22, minHeight: 80, textAlign: 'center'}}>{full.slice(0, n)}<span style={{opacity: f % 14 < 7 ? 1 : 0}}>|</span></div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 32, textAlign: 'right', marginTop: 18}}>— "Cellarius" (Samuel Butler)</div>
      </div>
      <div style={{transform: `scale(${1 + (1 - stamp) * 2}) rotate(-6deg)`, opacity: Math.min(1, stamp * 2)}}>
        <div style={{border: `9px solid ${C.red}`, borderRadius: 20, padding: '4px 34px', fontFamily: DISPLAY, fontSize: 80, color: C.red, background: '#120A06cc'}}>MACHINES WIN?</div>
      </div>
    </Stage>
  );
};

const Timeline: React.FC = () => {
  const {t, f, fps} = useT();
  const mark = interpolate(t, [0.4, 2.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cur = 1863 + mark * 13;
  const x1 = 200, x2 = 880;
  const k2 = pop(f, fps, 2.5, {damping: 8, stiffness: 220, mass: 0.7});
  return (
    <Stage>
      <Big size={190} color={C.gold}>{Math.round(cur)}</Big>
      <div style={{position: 'relative', width: 1080, height: 260}}>
        <div style={{position: 'absolute', left: x1, width: x2 - x1, top: 110, height: 14, background: '#FFF3DC33', borderRadius: 7}} />
        <div style={{position: 'absolute', left: x1, width: (x2 - x1) * mark, top: 110, height: 14, background: C.orange, borderRadius: 7, boxShadow: `0 0 18px ${C.orange}`}} />
        <div style={{position: 'absolute', left: x1 - 60, top: 85, width: 64, height: 64, borderRadius: 32, background: C.gold, border: `6px solid ${C.ink}`}} />
        <div style={{position: 'absolute', left: x1 - 150, top: 160, width: 260, textAlign: 'center', fontFamily: DISPLAY, fontSize: 44, color: C.gold, ...stroke(5)}}>BUTLER'S<br />WARNING</div>
        <div style={{position: 'absolute', left: x2 - 40 + 0, top: 85, width: 64, height: 64, borderRadius: 32, background: C.blue, border: `6px solid ${C.ink}`, transform: `scale(${k2})`}} />
        <div style={{position: 'absolute', left: x2 - 110, top: 160, width: 260, textAlign: 'center', fontFamily: DISPLAY, fontSize: 44, color: C.blue, transform: `scale(${k2})`, ...stroke(5)}}>TELEPHONE<br />1876</div>
        <div style={{position: 'absolute', left: 430, top: 20, width: 220, textAlign: 'center', fontFamily: DISPLAY, fontSize: 60, color: C.cream, opacity: mark > 0.9 ? 1 : 0, ...stroke(6)}}>13 YEARS</div>
      </div>
    </Stage>
  );
};

const Mentat: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.1);
  const eq = ['17 x 23', '= 391', 'ORBIT MATH...'];
  return (
    <Stage>
      <div style={{position: 'relative', transform: `scale(${p})`}}>
        <svg viewBox="-60 -60 360 360" width={400} height={400} style={{position: 'absolute', left: -20, top: -20, opacity: 0.7, transform: `rotate(${t * 40}deg)`}}>
          {Array.from({length: 10}, (_, i) => <circle key={i} cx={100 + Math.cos(i) * 100} cy={100 + Math.sin(i) * 100} r="8" fill={C.blue} />)}
        </svg>
        <Person size={300} />
        <div style={{position: 'absolute', left: 250, top: 10, width: 260, textAlign: 'left', fontFamily: MONO, fontSize: 44, color: C.blue, ...stroke(0), textShadow: `0 0 14px ${C.blue}`}}>{eq[Math.min(2, Math.floor(t / 1.2) % 3)]}</div>
      </div>
      <Big size={120} color={C.gold}>MENTAT</Big>
      <Big size={64} color={C.cream}>= HUMAN COMPUTER</Big>
      <Panel glow={C.blue} style={{padding: '8px 28px'}}><div style={{fontFamily: MONO, fontSize: 38, color: C.blue}}>battery: needs lunch</div></Panel>
    </Stage>
  );
};

const Computer: React.FC = () => {
  const {t, f, fps} = useT();
  const sw = interpolate(t, [2.8, 3.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p = pop(f, fps, 0.1);
  return (
    <Stage>
      <Panel glow={C.gold} style={{width: 860, transform: `scale(${p})`}}>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 80, color: C.cream}}>computer <span style={{fontSize: 38, color: C.sand}}>noun</span></div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 44, color: C.cream, marginTop: 10}}>1. one who computes <span style={{color: C.gold}}>— a person.</span></div>
        <div style={{fontFamily: MONO, fontSize: 40, color: C.gold, marginTop: 14}}>earliest record: 1613</div>
      </Panel>
      <div style={{position: 'relative', width: 400, height: 330}}>
        <div style={{position: 'absolute', left: 90, top: 0, opacity: 1 - sw, transform: `scale(${1 - sw * 0.4})`}}><Person size={240} /></div>
        <div style={{position: 'absolute', left: 80, top: 50, opacity: sw, transform: `scale(${0.6 + sw * 0.4})`}}><Laptop size={250} /></div>
      </div>
      <Src text="Oxford English Dictionary, earliest citation" />
    </Stage>
  );
};

const Verdict: React.FC = () => {
  const {t, f, fps} = useT();
  const a = pop(f, fps, 0.15), b = pop(f, fps, 3.4, {damping: 9, stiffness: 200, mass: 0.7});
  return (
    <Stage>
      <Big size={96} color={C.gold}>PREDICTED?</Big>
      <div style={{display: 'flex', gap: 28, width: 1000}}>
        <Panel glow={C.red} style={{flex: 1, textAlign: 'center', transform: `scale(${a})`}}>
          <Big size={64} color={C.cream}>DUNE</Big>
          <div style={{fontFamily: DISPLAY, fontSize: 92, color: C.red, marginTop: 10}}>BAN IT</div>
        </Panel>
        <Panel glow={C.blue} style={{flex: 1, textAlign: 'center', transform: `scale(${b})`}}>
          <Big size={64} color={C.cream}>US</Big>
          <div style={{fontFamily: DISPLAY, fontSize: 70, color: C.blue, marginTop: 20, lineHeight: 1}}>SHIP IT, FIX LATER</div>
        </Panel>
      </div>
    </Stage>
  );
};

const Movie: React.FC = () => {
  const {t, f, fps} = useT();
  const p = pop(f, fps, 0.1, {damping: 8, stiffness: 200, mass: 0.7});
  return (
    <Stage>
      <div style={{transform: `scale(${p})`, textAlign: 'center'}}>
        <Big size={110} color={C.cream}>DUNE: PART THREE</Big>
        <div style={{marginTop: 20, display: 'inline-block', background: C.orange, border: `7px solid ${C.ink}`, borderRadius: 24, padding: '0 40px', boxShadow: `0 8px 0 ${C.ink}`}}>
          <div style={{fontFamily: DISPLAY, fontSize: 110, color: C.ink}}>DEC 18</div>
        </div>
      </div>
    </Stage>
  );
};

const Recap: React.FC = () => {
  const {f, fps} = useT();
  const rows = ['A BAN IN FICTION', 'A WARNING FROM 1863', 'A JOB TITLE THAT WAS HUMAN'];
  return (
    <Stage>
      <Big size={90} color={C.gold}>RECAP</Big>
      {rows.map((r, i) => (
        <div key={i} style={{transform: `scale(${pop(f, fps, 0.05 + i * 1.0)}) translateX(${(i - 1) * 6}px)`}}>
          <Panel glow={[C.orange, C.gold, C.blue][i]} style={{padding: '10px 32px'}}><div style={{fontFamily: DISPLAY, fontSize: 56, color: C.cream}}>{i + 1}. {r}</div></Panel>
        </div>
      ))}
    </Stage>
  );
};

const Connect: React.FC = () => {
  const {t, f, fps} = useT();
  const a = pop(f, fps, 0.1), b = pop(f, fps, 2.2);
  return (
    <Stage>
      <Big size={92} color={C.cream}>PRESS THE BUTTON?</Big>
      <div style={{display: 'flex', gap: 30}}>
        <div style={{transform: `scale(${a})`, background: C.red, border: `7px solid ${C.ink}`, borderRadius: 26, padding: '14px 44px', boxShadow: `0 8px 0 ${C.ink}`}}><div style={{fontFamily: DISPLAY, fontSize: 90, color: C.cream, ...stroke(4)}}>BAN IT</div></div>
        <div style={{transform: `scale(${b})`, background: C.blue, border: `7px solid ${C.ink}`, borderRadius: 26, padding: '14px 44px', boxShadow: `0 8px 0 ${C.ink}`}}><div style={{fontFamily: DISPLAY, fontSize: 90, color: C.ink}}>KEEP IT</div></div>
      </div>
      <Big size={60} color={C.gold}>COMMENT YOUR SIDE</Big>
    </Stage>
  );
};

const EndCard: React.FC = () => {
  const {f, fps} = useT();
  const p = pop(f, fps, 0.1);
  return (
    <Stage>
      <div style={{transform: `scale(${p})`, textAlign: 'center'}}>
        <Big size={130} color={C.gold}>FOLLOW</Big>
        <Big size={64} color={C.cream} style={{marginTop: 20}}>NEXT: WHY GAMES</Big>
        <Big size={64} color={C.cream}>HAVE LOADING SCREENS</Big>
      </div>
    </Stage>
  );
};

const SCENES = [Hook, Jihad, Butler, Timeline, Mentat, Computer, Verdict, Movie, Recap, Connect, EndCard];
const KEY = /^(dune|nineteen|sixty-five|banned|ai|butlerian|jihad|machines?|eighteen|sixty-three|thirteen|telephone|mentats?|human|computers?|sixteen|thirteen|december|eighteenth|ban|ship|follow|comment|lunch|thinking|holy|war)$/i;
const clean = (w: string) => w.replace(/[“”"]/g, '').replace(/[.,?!:]+$/, '');

const Captions: React.FC<{words: DWord[]}> = ({words}) => {
  const {t, f, fps} = useT();
  const pages: DWord[][] = [];
  let cur: DWord[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= 3 || /[.,:;?!”]$/.test(w.w) || (next && next.start - w.end > 0.2)) {pages.push(cur); cur = [];}
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
        const col = active ? C.gold : key ? C.blue : C.cream;
        return <span key={i} style={{fontFamily: DISPLAY, fontSize: 92, color: col, textTransform: 'uppercase', display: 'inline-block', transform: `scale(${active ? 1.08 : 1}) translateY(${active ? -6 : 0}px) rotate(${active ? (i % 2 ? 2 : -2) : 0}deg)`, ...stroke(9)}}>{clean(w.w)}</span>;
      })}
    </div>
  );
};

const EMO: Emotion[] = ['shocked', 'confused', 'thinking', 'shocked', 'happy', 'shocked', 'smug', 'happy', 'happy', 'thinking', 'happy'];

export const DuneAI: React.FC<DuneProps> = ({audio, totalSec, words, mouth, beats}) => {
  const {f, t, fps} = useT();
  let bi = 0;
  beats.forEach((b, k) => {if (t >= b) bi = k;});
  const since = t - beats[bi];
  const hue = [0, -8, 6, 0, 10, -6, 8, 0, 4, -8, 0][bi] ?? 0;
  let punch = 0;
  for (const w of words) if (KEY.test(clean(w.w)) && t >= w.start && t < w.start + 0.22) punch = Math.max(punch, 1 - (t - w.start) / 0.22);
  const zoom = 1 + 0.012 * Math.sin(f / 40) + 0.03 * Math.max(0, 1 - since / 0.4) + 0.025 * punch;
  const m = mouth[f] ?? 0;
  const end = bi === 10;
  const sx = interpolate(since, [0, 0.3], [-1400, 1400], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <DuneBg t={t} f={f} hue={hue} />
      <AbsoluteFill style={{transform: `scale(${zoom}) rotate(${Math.sin(f / 50) * 0.4}deg)`}}>
        {beats.map((b, k) => {
          const S = SCENES[k];
          const e = k + 1 < beats.length ? beats[k + 1] : totalSec;
          return <Sequence key={k} from={Math.round(b * fps)} durationInFrames={Math.max(1, Math.round((e - b) * fps))}><S /></Sequence>;
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: end ? 330 : 330, top: (end ? 1330 : 1330) + -Math.abs(Math.sin(f / 7)) * (end ? 30 : 8), width: 420}}>
        <Character who="byte" emotion={EMO[bi]} speaking={m > 0.12} mouth={m} frame={f} hit={0} />
      </div>
      <Captions words={words} />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
        <div style={{background: C.ink, border: `4px solid ${C.blue}`, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.cream}}>BYTE</div>
        <div style={{background: C.orange, borderRadius: 40, padding: '8px 26px', fontFamily: DISPLAY, fontSize: 42, color: C.ink, transform: `rotate(${Math.sin(f / 10) * 3}deg)`}}>DUNE × CS</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: '#ffffff18'}}>
        <div style={{width: `${(t / totalSec) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.orange}, ${C.gold})`}} />
      </div>
      {bi > 0 && since < 0.35 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <AbsoluteFill style={{background: '#fff', opacity: interpolate(since, [0, 0.12], [0.5, 0], {extrapolateRight: 'clamp'})}} />
          <div style={{position: 'absolute', top: -400, left: sx, width: 360, height: 2800, background: `linear-gradient(90deg, transparent, ${C.orange}, ${C.gold}, transparent)`, transform: 'rotate(18deg)', opacity: 0.85}} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- thumbnail (1280x720) ----------
export const DuneThumb: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #1A0B05 0%, #7A300E 45%, #FF7A1A 75%, #F2B35A 100%)'}} />
    <svg viewBox="-640 -360 1280 720" width={1280} height={720} style={{position: 'absolute', opacity: 0.22}}>
      {Array.from({length: 18}, (_, i) => <polygon key={i} points="0,0 -50,-900 50,-900" fill={i % 2 ? C.gold : C.orange} transform={`rotate(${(i * 360) / 18})`} />)}
    </svg>
    <Moons t={0} s={1.2} />
    <svg viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
      <path d="M0 560 Q200 480 420 540 T860 520 T1280 560 L1280 720 L0 720Z" fill="#8E3B12" />
      <path d="M0 640 Q300 580 600 630 T1280 620 L1280 720 L0 720Z" fill="#5C250C" />
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 18, textAlign: 'center'}}>
      <div style={{fontFamily: DISPLAY, fontSize: 118, color: C.gold, lineHeight: 1, ...stroke(12)}}>DUNE BANNED</div>
      <div style={{fontFamily: DISPLAY, fontSize: 250, color: C.cream, lineHeight: 0.9, marginTop: -4, ...stroke(18)}}>AI</div>
    </div>
    <div style={{position: 'absolute', left: 36, bottom: 30, background: C.red, border: `8px solid ${C.ink}`, borderRadius: 22, padding: '0 26px', transform: 'rotate(-5deg)', boxShadow: `0 8px 0 ${C.ink}`}}>
      <div style={{fontFamily: DISPLAY, fontSize: 84, color: C.cream, ...stroke(4)}}>IN 1965?!</div>
    </div>
    <div style={{position: 'absolute', right: 80, bottom: 70, width: 260, transform: 'rotate(3deg)'}}>
      <Robot size={260} f={0} />
      <svg viewBox="0 0 200 200" width={260} height={260} style={{position: 'absolute', inset: 0}}>
        <circle cx="100" cy="100" r="92" fill="none" stroke={C.red} strokeWidth="16" />
        <line x1="34" y1="166" x2="166" y2="34" stroke={C.red} strokeWidth="16" />
      </svg>
    </div>
    <div style={{position: 'absolute', left: 430, bottom: -20, width: 340}}>
      <Character who="byte" emotion="shocked" speaking={true} mouth={0.9} frame={20} hit={0} />
    </div>
  </AbsoluteFill>
);
