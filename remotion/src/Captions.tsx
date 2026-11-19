import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {theme, speakerColor} from './theme';

export type Word = {w: string; start: number; end: number};

const CHUNK = 4;

type Page = {words: Word[]; speaker: 'byte' | 'compy'};

const pagesFor = (words: Word[], speaker: 'byte' | 'compy'): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= CHUNK || /[.,:;?!…]$/.test(w.w)) {
      pages.push({words: cur, speaker});
      cur = [];
    }
  }
  if (cur.length) pages.push({words: cur, speaker});
  return pages;
};

export const Captions: React.FC<{scenes: {words: Word[]; speaker: 'byte' | 'compy'}[]}> = ({scenes}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const pages = scenes.flatMap((s) => pagesFor(s.words, s.speaker));
  const idx = pages.findIndex((p, i) => {
    const start = p.words[0].start;
    const nextStart = pages[i + 1]?.words[0].start ?? p.words[p.words.length - 1].end + 0.4;
    return t >= start - 0.05 && t < nextStart;
  });
  if (idx < 0) return null;
  const page = pages[idx];
  const color = speakerColor[page.speaker];

  const pageStartFrame = Math.round(page.words[0].start * fps);
  const pop = spring({frame: frame - pageStartFrame, fps, config: {damping: 12, stiffness: 240}});

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 360}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 14px',
          padding: '0 50px',
          transform: `scale(${0.9 + 0.1 * pop}) translateY(${(1 - pop) * 24}px)`,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.06;
          const spoken = t >= w.end;
          const shout = /[A-Z]{3,}|[!?]$/.test(w.w);
          const wf = Math.round(w.start * fps);
          const wp = spring({frame: frame - wf, fps, config: {damping: 9, stiffness: 320}});
          return (
            <span
              key={i}
              style={{
                fontFamily: theme.display,
                fontSize: 96,
                letterSpacing: 1,
                lineHeight: 1.1,
                color: active ? '#0B0F1A' : spoken ? theme.text : '#ffffffb8',
                background: active ? color : 'transparent',
                borderRadius: 26,
                padding: '2px 18px 6px',
                textShadow: active ? 'none' : '0 6px 18px #000c',
                WebkitTextStroke: active ? '0px' : '9px #0B0F1A',
                paintOrder: 'stroke fill',
                transform: active ? `translateY(${-6 * wp}px) rotate(${(i % 2 ? 1 : -1) * 2.2 * wp}deg) scale(${(shout ? 1.18 : 1.08) * (0.9 + 0.1 * wp)})` : 'none',
                boxShadow: active ? `0 10px 30px ${color}66` : 'none',
                display: 'inline-block',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
