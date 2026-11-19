import React from 'react';
import {Composition} from 'remotion';
import {Video, VideoProps} from './Video';

export const FPS = 30;

const defaultProps: VideoProps = {
  id: 'demo',
  series: '60-Second CS',
  audio: '',
  totalSec: 5,
  scenes: [
    {
      start: 0,
      end: 5,
      narrationEnd: 4,
      speaker: 'byte',
      emotions: {byte: 'happy', compy: 'smug'},
      visual: {type: 'bigText', props: {text: 'Hello', sub: 'preview'}},
      words: [{w: 'Hello', start: 0.2, end: 0.8}],
      mouth: [0, 0.4, 0.8, 0.3],
      fx: [],
      stickers: [],
    },
  ],
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={Video}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={150}
      defaultProps={defaultProps}
      calculateMetadata={({props}) => ({
        durationInFrames: Math.max(30, Math.ceil(props.totalSec * FPS)),
      })}
    />
  );
};
