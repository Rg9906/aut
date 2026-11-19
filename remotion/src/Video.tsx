import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, safe, speakerColor, applyTheme} from './theme';
import {Captions, Word} from './Captions';
import {SceneVisual, Visual} from './scenes';
import {Character, Emotion, Who} from './Characters';
import {BinaryRain, StickerSpec, Stickers} from './Extras';

export type FxSpec = {t: number; type: 'shake' | 'zoom'};

export type SceneData = {
  start: number;
  end: number;
  narrationEnd: number;
  speaker: Who;
  emotions: {byte: Emotion; compy: Emotion};
  visual: Visual | null;
  words: Word[];
  mouth: number[];
  fx: FxSpec[];
  stickers: StickerSpec[];
};

export type VideoProps = {
  id: string;
  series: string;
  theme?: Record<string, string>;
  names?: {byte: string; compy: string};
  episode?: number;
  audio: string;
  totalSec: number;
  scenes: SceneData[];
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.18;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 760px at ${30 + (drift % 40)}% 24%, ${theme.bg2} 0%, ${theme.bg} 72%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.bg2}55 1px, transparent 1px), linear-gradient(90deg, ${theme.bg2}55 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `${-drift * 6}px ${-drift * 3}px`,
          opacity: 0.5,
        }}
      />
      <BinaryRain />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  const pct = Math.min(1, frame / total);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: '#ffffff12'}}>
      <div style={{width: `${pct * 100}%`, height: '100%', background: theme.accent}} />
    </div>
  );
};

const NameTag: React.FC<{who: Who; active: boolean; label?: string}> = ({who, active, label}) => (
  <div
    style={{
      marginTop: 6,
      textAlign: 'center',
      fontSize: 34,
      fontWeight: 900,
      letterSpacing: 4,
      color: active ? '#0B0F1A' : speakerColor[who],
      background: active ? speakerColor[who] : 'transparent',
      border: `3px solid ${speakerColor[who]}`,
      borderRadius: 999,
      padding: '4px 22px',
      display: 'inline-block',
    }}
  >
    {(label || who).toUpperCase()}
  </div>
);

export const Video: React.FC<VideoProps> = (props) => {
  applyTheme(props.theme);
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  let si = props.scenes.findIndex((s) => t >= s.start && t < s.end);
  if (si < 0) si = props.scenes.length - 1;
  const sc = props.scenes[si];
  const local = t - sc.start;
  const speaking = t < sc.narrationEnd;
  const mouthNow = sc.mouth[Math.floor(local * fps)] ?? 0;
  const hit = spring({frame: Math.round(local * fps), fps, config: {damping: 8, stiffness: 200}});

  // camera fx: shake + punch-in zoom
  let shakeX = 0;
  let shakeY = 0;
  let zoom = 1;
  for (const s of props.scenes) {
    for (const f of s.fx) {
      const dt = t - (s.start + f.t);
      if (f.type === 'shake' && dt >= 0 && dt < 0.45) {
        const amp = (1 - dt / 0.45) * 20;
        shakeX += Math.sin(dt * 95) * amp;
        shakeY += Math.cos(dt * 80) * amp * 0.6;
      }
      if (f.type === 'zoom' && dt >= 0 && dt < 0.32) {
        zoom += 0.075 * Math.sin((Math.PI * dt) / 0.32);
      }
    }
  }

  const stickers = props.scenes.flatMap((s) => s.stickers.map((spec) => ({spec, abs: s.start + spec.t})));
  const charProps = (who: Who) => ({
    who,
    emotion: sc.emotions[who],
    speaking: speaking && sc.speaker === who,
    mouth: sc.speaker === who ? mouthNow : 0,
    frame,
    hit: sc.speaker === who ? hit : 0,
  });

  return (
    <AbsoluteFill style={{fontFamily: theme.sans, color: theme.text, background: theme.bg}}>
      {props.audio ? <Audio src={staticFile(props.audio)} /> : null}
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`}}>
        <Background />

        <div
          style={{
            position: 'absolute',
            top: safe.top - 100,
            left: safe.side,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: 3,
            color: theme.accent,
            textTransform: 'uppercase',
          }}
        >
          {props.series}
        </div>
        {props.episode ? (
          <div
            style={{
              position: 'absolute',
              top: safe.top - 104,
              right: safe.side,
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: 3,
              color: '#0B0F1A',
              background: theme.amber,
              borderRadius: 999,
              padding: '4px 24px',
            }}
          >
            EP {String(props.episode).padStart(2, '0')}
          </div>
        ) : null}

        {props.scenes.map((s, i) =>
          s.visual ? (
            <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * fps))}>
              <SceneVisual visual={s.visual} index={i} />
            </Sequence>
          ) : null,
        )}

        {/* the cast */}
        <div style={{position: 'absolute', left: 50, top: 905, width: 360, textAlign: 'center'}}>
          <Character {...charProps('byte')} />
          <NameTag who="byte" label={props.names?.byte} active={speaking && sc.speaker === 'byte'} />
        </div>
        <div style={{position: 'absolute', right: 50, top: 905, width: 360, textAlign: 'center'}}>
          <Character {...charProps('compy')} />
          <NameTag who="compy" label={props.names?.compy} active={speaking && sc.speaker === 'compy'} />
        </div>

        <Captions scenes={props.scenes} />
        <Stickers stickers={stickers} />
      </AbsoluteFill>
      <ProgressBar total={durationInFrames} />
    </AbsoluteFill>
  );
};
