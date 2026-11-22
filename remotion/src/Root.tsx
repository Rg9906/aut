import React from 'react';
import {Composition} from 'remotion';
import {Video, VideoProps} from './Video';
import {Gta6, Gta6Props} from './gta6/Gta6';
import {DuneSpecial} from './dune/DuneSpecial';
import {Gta6Launch, Gta6Props as LaunchProps} from './gta6/Gta6Launch';

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
    <>
    <Composition
      id="Gta6"
      component={Gta6}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
      defaultProps={{audio: '', totalSec: 10, words: [], lines: [], mouth: []} as Gta6Props}
      calculateMetadata={({props}) => ({durationInFrames: Math.ceil(props.totalSec * FPS)})}
    />
    <Composition
      id="Gta6Launch"
      component={Gta6Launch}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
      defaultProps={{audio: '', totalSec: 10, words: [], lines: [], mouth: [], compyMouth: [], beats: [0]} as LaunchProps}
      calculateMetadata={({props}) => ({durationInFrames: Math.ceil(props.totalSec * FPS)})}
    />
    <Composition id="Dune" component={DuneSpecial} width={1080} height={1920} fps={FPS} durationInFrames={300}
      defaultProps={{audio: '', totalSec: 10, words: [], lines: [], mouth: [], compyMouth: [], beats: [0]} as LaunchProps}
      calculateMetadata={({props}) => ({durationInFrames: Math.ceil(props.totalSec * FPS)})} />
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
    </>
  );
};
