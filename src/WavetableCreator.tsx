import React, { useRef, useEffect, useState } from 'react';
import type { WaveShapeKeyframe, Wavetable, WaveShape } from './wavetableUtils';
import { generateWavetable } from './wavetableUtils';
import ButtonGroup from './ButtonGroup';
import * as d3 from 'd3';

interface WavetableCreatorProps {
  width?: number;
  height?: number;
  waveTableFrames?: number;
  samplesPerFrame?: number;
  keyframes: WaveShapeKeyframe[];
}

const WavetableCreator: React.FC<WavetableCreatorProps> = ({ }) => {
  return (
    <div>
    </div >
  );
};

export default WavetableCreator;

