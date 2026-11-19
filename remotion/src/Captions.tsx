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
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 372}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px 30px',
          padding: '0 60px',
          transform: `scale(${0.88 + 0.12 * pop}) rotate(${(1 - pop) * -2}deg)`,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.08;
          const spoken = t >= w.end;
          const shout = /[A-Z]{3,}|[!?]$/.test(w.w);
          return (
            <span
              key={i}
              style={{
                fontSize: 86,
                fontWeight: 900,
                color: active ? color : spoken ? theme.text : '#ffffffaa',
                textShadow: '0 6px 24px #000d, 0 0 3px #000',
                WebkitTextStroke: '2.5px #000b',
                paintOrder: 'stroke fill',
                transform: active ? `scale(${shout ? 1.22 : 1.08})` : 'scale(1)',
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
