import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, safe} from './theme';

export type TermLine = {text: string; kind?: 'cmd' | 'out' | 'err' | 'hl'};

export type Visual =
  | {type: 'titleCard'; props: {kicker: string; title: string; chips?: string[]}}
  | {type: 'agenda'; props: {heading: string; items: string[]}}
  | {type: 'recap'; props: {label: string; rule: string; code?: string}}
  | {type: 'endCard'; props: {cta: string; next: string; hint?: string}}
  | {type: 'bigText'; props: {text: string; sub?: string}}
  | {type: 'terminal'; props: {lines: TermLine[]}}
  | {type: 'code'; props: {code: string}}
  | {type: 'timeline'; props: {heading?: string; events: {when: string; what: string}[]}}
  | {type: 'stat'; props: {value: string; label: string; sub?: string}}
  | {type: 'verdict'; props: {title: string; score: number; outOf?: number; pros?: string[]; cons?: string[]}}
  | {type: 'compare'; props: {left: {title: string; value: string}; right: {title: string; value: string}; footer?: string}};

// Visual area sits between the series tag and the captions.
const area: React.CSSProperties = {
  position: 'absolute',
  left: safe.side,
  right: safe.side,
  top: 250,
  height: 640,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping: 16, stiffness: 140}});
};

const BigText: React.FC<{text: string; sub?: string}> = ({text, sub}) => {
  const e = useEnter();
  const e2 = useEnter(10);
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div
        style={{
          fontSize: text.includes(' ') ? Math.min(120, Math.floor(880 / (Math.ceil(text.length / 2) * 0.6))) : Math.min(130, Math.floor(860 / (text.length * 0.68))),
          fontWeight: 900,
          lineHeight: 1.05,
          transform: `translateY(${(1 - e) * 60}px) scale(${0.92 + 0.08 * e})`,
          opacity: e,
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {text}
      </div>
      {sub ? (
        <div style={{marginTop: 24, fontSize: 50, color: theme.dim, fontWeight: 600, opacity: e2, transform: `translateY(${(1 - e2) * 30}px)`}}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

const TitleCard: React.FC<{kicker: string; title: string; chips?: string[]}> = ({kicker, title, chips = []}) => {
  const e = useEnter();
  const e2 = useEnter(8);
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div
        style={{
          alignSelf: 'center',
          background: theme.accent,
          color: '#0B0F1A',
          fontWeight: 900,
          fontSize: 34,
          letterSpacing: 4,
          padding: '8px 28px',
          borderRadius: 999,
          opacity: e,
          transform: `scale(${0.8 + 0.2 * e})`,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: title.length <= 26 ? 108 : 86,
          fontWeight: 900,
          lineHeight: 1.06,
          opacity: e2,
          transform: `translateY(${(1 - e2) * 60}px) scale(${0.94 + 0.06 * e2})`,
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {title}
      </div>
      <div style={{display: 'flex', gap: 16, justifyContent: 'center', marginTop: 34}}>
        {chips.map((c, i) => {
          const ce = useEnter(18 + i * 6);
          return (
            <div
              key={i}
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: theme.text,
                border: `3px solid ${theme.accent2}`,
                borderRadius: 999,
                padding: '6px 24px',
                opacity: ce,
                transform: `translateY(${(1 - ce) * 24}px)`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Agenda: React.FC<{heading: string; items: string[]}> = ({heading, items}) => {
  const e = useEnter();
  return (
    <div style={{...area}}>
      <div style={{fontSize: 40, fontWeight: 900, letterSpacing: 3, color: theme.amber, marginBottom: 26, opacity: e, textTransform: 'uppercase'}}>
        {heading}
      </div>
      {items.map((it, i) => {
        const ie = useEnter(10 + i * 14);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              background: theme.card,
              border: '3px solid #ffffff14',
              borderRadius: 26,
              padding: '20px 30px',
              marginBottom: 18,
              opacity: ie,
              transform: `translateX(${(1 - ie) * -90}px)`,
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 33,
                background: theme.accent,
                color: '#0B0F1A',
                fontSize: 40,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{fontSize: 46, fontWeight: 700, lineHeight: 1.1}}>{it}</div>
          </div>
        );
      })}
    </div>
  );
};

const Recap: React.FC<{label: string; rule: string; code?: string}> = ({label, rule, code}) => {
  const e = useEnter();
  const e2 = useEnter(12);
  const e3 = useEnter(26);
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div
        style={{
          alignSelf: 'center',
          background: theme.good,
          color: '#0B0F1A',
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: 4,
          padding: '8px 28px',
          borderRadius: 999,
          opacity: e,
          transform: `scale(${0.8 + 0.2 * e})`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 34,
          fontSize: 100,
          fontWeight: 900,
          lineHeight: 1.06,
          opacity: e2,
          transform: `scale(${0.9 + 0.1 * e2}) rotate(${(1 - e2) * -3}deg)`,
          color: theme.text,
        }}
      >
        {rule}
      </div>
      {code ? (
        <div
          style={{
            marginTop: 40,
            alignSelf: 'center',
            fontFamily: theme.mono,
            fontSize: 46,
            fontWeight: 700,
            color: theme.good,
            background: theme.card,
            border: `3px solid ${theme.good}66`,
            borderRadius: 22,
            padding: '16px 34px',
            opacity: e3,
            transform: `translateY(${(1 - e3) * 30}px)`,
          }}
        >
          {code}
        </div>
      ) : null}
    </div>
  );
};

const EndCard: React.FC<{cta: string; next: string; hint?: string}> = ({cta, next, hint}) => {
  const frame = useCurrentFrame();
  const e = useEnter();
  const e2 = useEnter(14);
  const pulse = 1 + 0.035 * Math.sin(frame / 5);
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div
        style={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: '#ef4444',
          color: '#fff',
          fontSize: 74,
          fontWeight: 900,
          borderRadius: 999,
          padding: '20px 56px',
          boxShadow: '0 16px 50px #ef444466',
          opacity: e,
          transform: `scale(${(0.7 + 0.3 * e) * pulse})`,
        }}
      >
        <svg width={70} height={70} viewBox="0 0 24 24" fill="#fff">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 0 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
        </svg>
        {cta}
      </div>
      <div
        style={{
          marginTop: 56,
          width: '100%',
          background: theme.card,
          border: `3px solid ${theme.accent2}88`,
          borderRadius: 28,
          padding: '28px 36px',
          opacity: e2,
          transform: `translateY(${(1 - e2) * 50}px)`,
        }}
      >
        <div style={{fontSize: 32, fontWeight: 800, letterSpacing: 3, color: theme.accent2, marginBottom: 10}}>NEXT EPISODE</div>
        <div style={{fontSize: 54, fontWeight: 800, lineHeight: 1.1}}>{next}</div>
      </div>
      {hint ? <div style={{marginTop: 28, fontSize: 38, color: theme.dim, fontWeight: 600, opacity: e2}}>{hint}</div> : null}
    </div>
  );
};

const kindColor = (k?: string) =>
  k === 'cmd' ? theme.text : k === 'err' ? theme.warn : k === 'hl' ? theme.accent : theme.dim;

const Window: React.FC<{children: React.ReactNode; title: string}> = ({children, title}) => {
  const e = useEnter();
  return (
    <div style={{...area}}>
      <div
        style={{
          background: theme.card,
          border: '2px solid #ffffff14',
          borderRadius: 28,
          boxShadow: '0 30px 80px #0009',
          overflow: 'hidden',
          opacity: e,
          transform: `translateY(${(1 - e) * 50}px)`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '16px 26px', background: '#0d1426'}}>
          {['#FB7185', '#FBBF24', '#4ADE80'].map((c) => (
            <div key={c} style={{width: 22, height: 22, borderRadius: 11, background: c}} />
          ))}
          <div style={{marginLeft: 16, color: theme.dim, fontSize: 30, fontFamily: theme.mono}}>{title}</div>
        </div>
        <div style={{padding: '26px 36px 30px'}}>{children}</div>
      </div>
    </div>
  );
};

// Types text line by line, then each line's characters.
const Terminal: React.FC<{lines: TermLine[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const perLine = 22; // frames between line starts
  const cps = 1.6; // chars per frame for typing
  return (
    <Window title="python3">
      {lines.map((ln, i) => {
        const start = 6 + i * perLine;
        const shown = Math.max(0, Math.floor((frame - start) * cps));
        const txt = ln.text.slice(0, shown);
        const typing = shown < ln.text.length && frame >= start;
        const big = ln.kind === 'err' || ln.kind === 'hl';
        return (
          <div
            key={i}
            style={{
              fontFamily: theme.mono,
              fontSize: ln.text.length > 34 ? 31 : ln.text.length > 28 ? 36 : big ? 50 : 42,
              fontWeight: big ? 700 : 500,
              color: kindColor(ln.kind),
              minHeight: 58,
              marginBottom: 8,
              wordBreak: 'break-all',
            }}
          >
            {txt}
            {typing ? <span style={{color: theme.accent}}>▍</span> : null}
          </div>
        );
      })}
    </Window>
  );
};

const kw = new Set(['import', 'from', 'def', 'return', 'if', 'else', 'for', 'in', 'True', 'False', 'None']);

const colorize = (line: string) => {
  if (line.trim().startsWith('#')) return <span style={{color: theme.good}}>{line}</span>;
  const parts = line.split(/(\s+|[().,=<>+\-*/:])/);
  return parts.map((p, i) => (
    <span key={i} style={{color: kw.has(p) ? theme.accent2 : /^\d/.test(p) ? theme.warn : theme.text}}>
      {p}
    </span>
  ));
};

const Code: React.FC<{code: string}> = ({code}) => {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  return (
    <Window title="main.py">
      {lines.map((ln, i) => {
        const show = frame >= 6 + i * 14;
        return (
          <div
            key={i}
            style={{
              fontFamily: theme.mono,
              fontSize: 44,
              minHeight: 62,
              opacity: show ? 1 : 0,
              transform: `translateX(${show ? 0 : -20}px)`,
              whiteSpace: 'pre',
            }}
          >
            {colorize(ln)}
          </div>
        );
      })}
    </Window>
  );
};

const Compare: React.FC<{left: {title: string; value: string}; right: {title: string; value: string}; footer?: string}> = ({left, right, footer}) => {
  const a = useEnter();
  const b = useEnter(14);
  const c = useEnter(34);
  const Card = ({d, e, color}: {d: {title: string; value: string}; e: number; color: string}) => (
    <div
      style={{
        background: theme.card,
        border: `3px solid ${color}55`,
        borderRadius: 28,
        padding: '22px 34px',
        marginBottom: 20,
        opacity: e,
        transform: `translateX(${(1 - e) * -80}px)`,
      }}
    >
      <div style={{fontSize: 32, color: theme.dim, fontWeight: 700, marginBottom: 8}}>{d.title}</div>
      <div style={{fontSize: 54, fontFamily: theme.mono, color, fontWeight: 700, wordBreak: 'break-all'}}>{d.value}</div>
    </div>
  );
  return (
    <div style={{...area}}>
      <Card d={left} e={a} color={theme.accent} />
      <Card d={right} e={b} color={theme.accent2} />
      {footer ? (
        <div style={{textAlign: 'center', fontSize: 46, fontWeight: 800, color: theme.warn, opacity: c, transform: `scale(${0.9 + 0.1 * c})`}}>
          {footer}
        </div>
      ) : null}
    </div>
  );
};


const Timeline: React.FC<{heading?: string; events: {when: string; what: string}[]}> = ({heading, events}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{...area}}>
      {heading ? <div style={{fontSize: 40, fontWeight: 900, letterSpacing: 3, color: theme.amber, marginBottom: 22, textTransform: 'uppercase'}}>{heading}</div> : null}
      <div style={{position: 'relative', paddingLeft: 40}}>
        <div style={{position: 'absolute', left: 14, top: 8, bottom: 8, width: 8, borderRadius: 4, background: `linear-gradient(${theme.accent}, ${theme.accent2})`}} />
        {events.map((ev, i) => {
          const e = spring({frame: frame - 6 - i * 14, fps, config: {damping: 14, stiffness: 150}});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 22, opacity: e, transform: `translateX(${(1 - e) * 80}px)`}}>
              <div style={{position: 'absolute', left: 4, width: 28, height: 28, borderRadius: 14, background: theme.amber, border: `5px solid ${theme.bg}`}} />
              <div style={{fontSize: 42, fontWeight: 900, color: theme.accent, minWidth: 190}}>{ev.when}</div>
              <div style={{fontSize: 40, fontWeight: 700, color: theme.text, lineHeight: 1.15}}>{ev.what}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Stat: React.FC<{value: string; label: string; sub?: string}> = ({value, label, sub}) => {
  const e = useEnter();
  const e2 = useEnter(10);
  const frame = useCurrentFrame();
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div style={{fontSize: 40, fontWeight: 900, letterSpacing: 4, color: theme.accent2, opacity: e2, textTransform: 'uppercase'}}>{label}</div>
      <div
        style={{
          fontSize: Math.min(190, Math.floor(900 / (Math.max(value.length, 3) * 0.62))),
          fontWeight: 900,
          lineHeight: 1.05,
          margin: '14px 0',
          transform: `scale(${0.7 + 0.3 * e}) rotate(${Math.sin(frame / 18) * 1.2}deg)`,
          opacity: e,
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.amber})`,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {value}
      </div>
      {sub ? <div style={{fontSize: 46, color: theme.dim, fontWeight: 600, opacity: e2}}>{sub}</div> : null}
    </div>
  );
};

const Verdict: React.FC<{title: string; score: number; outOf?: number; pros?: string[]; cons?: string[]}> = ({title, score, outOf = 10, pros = [], cons = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = useEnter();
  const fill = spring({frame: frame - 8, fps, config: {damping: 20, stiffness: 60}});
  const shown = (score * fill).toFixed(1);
  return (
    <div style={{...area, alignItems: 'center', textAlign: 'center'}}>
      <div style={{fontSize: 44, fontWeight: 800, color: theme.dim, opacity: e}}>{title}</div>
      <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1.05, color: theme.amber, transform: `scale(${0.8 + 0.2 * e})`}}>
        {shown}<span style={{fontSize: 70, color: theme.dim}}>/{outOf}</span>
      </div>
      <div style={{width: 820, height: 26, borderRadius: 13, background: theme.card, overflow: 'hidden', margin: '6px 0 24px'}}>
        <div style={{width: `${(score / outOf) * fill * 100}%`, height: '100%', background: `linear-gradient(90deg, ${theme.accent}, ${theme.amber})`}} />
      </div>
      <div style={{display: 'flex', gap: 28, width: '100%', justifyContent: 'center'}}>
        {[{items: pros, c: theme.good, s: '+'}, {items: cons, c: theme.bad, s: '-'}].map((col, k) => (
          <div key={k} style={{flex: 1, textAlign: 'left'}}>
            {col.items.map((x, i) => {
              const a = spring({frame: frame - 18 - i * 8 - k * 4, fps, config: {damping: 14, stiffness: 140}});
              return (
                <div key={i} style={{fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 10, opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
                  <span style={{color: col.c, fontWeight: 900}}>{col.s} </span>{x}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SceneVisual: React.FC<{visual: Visual; index: number}> = ({visual}) => {
  const frame = useCurrentFrame();
  // subtle slow zoom on every scene so no frame is static
  const zoom = interpolate(frame, [0, 240], [1, 1.035], {extrapolateRight: 'clamp'});
  const inner = (() => {
    switch (visual.type) {
      case 'titleCard':
        return <TitleCard {...visual.props} />;
      case 'agenda':
        return <Agenda {...visual.props} />;
      case 'recap':
        return <Recap {...visual.props} />;
      case 'endCard':
        return <EndCard {...visual.props} />;
      case 'bigText':
        return <BigText {...visual.props} />;
      case 'terminal':
        return <Terminal {...visual.props} />;
      case 'code':
        return <Code {...visual.props} />;
      case 'compare':
        return <Compare {...visual.props} />;
      case 'timeline':
        return <Timeline {...visual.props} />;
      case 'stat':
        return <Stat {...visual.props} />;
      case 'verdict':
        return <Verdict {...visual.props} />;
    }
  })();
  return <AbsoluteFill style={{transform: `scale(${zoom})`}}>{inner}</AbsoluteFill>;
};
