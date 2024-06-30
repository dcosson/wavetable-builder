export type WaveformData = Float32Array;
interface WaveformDataWithKeyframe {
  frame: number;
  data: WaveformData;
}
type WavetableData = WaveformData[];
export interface WavetableWithMetadata {
  name?: string;
  presetNumber?: number;
  keyframes: Set<number>,
  data: WavetableData,
}

export type WaveShape = 'none' | 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
export type LabeledWaveShape = { 'value': WaveShape, 'label': string };
export const LabeledWaveShapes: LabeledWaveShape[] = [
  { value: 'none', label: 'None' },
  { value: 'sine', label: 'Sin' },
  { value: 'square', label: 'Sqr' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'triangle', label: 'Tri' },
  { value: 'custom', label: 'Custom' },
];


export const generateWaveform = (shape: WaveShape, samplesPerFrame: number): WaveformData => {
  const waveform = new Float32Array(samplesPerFrame).fill(0);
  const frequency = 1; // One cycle per frame

  for (let i = 0; i < samplesPerFrame; i++) {
    const t = i / samplesPerFrame;
    switch (shape) {
      case 'none':
        waveform[i] = 0;
        break;
      case 'sine':
        waveform[i] = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        waveform[i] = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        break;
      case 'sawtooth':
        waveform[i] = 2 * (t * frequency - Math.floor(0.5 + t * frequency));
        break;
      case 'triangle':
        waveform[i] = 1 - 4 * Math.abs(Math.round(t * frequency) - t * frequency);
        break;
    }
  }
  return waveform;
};

const spreadKeyframes = (keyframes: WaveformData[], numberFrames: number): WaveformDataWithKeyframe[] => {
  return keyframes.map((data, idx) => {
    const newFramePct = idx / (keyframes.length - 1);
    return {
      frame: Math.round(newFramePct * (numberFrames - 1)),
      data: data
    };
  });
}

export const generateWavetable = (keyframes: WaveformData[], numberFrames: number, samplesPerFrame: number, name?: string, presetNumber?: number): WavetableWithMetadata | undefined => {
  // Validate keyframes
  if (keyframes.length < 2) {
    console.error("At least two keyframes are required");
    return;
  }
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].length != samplesPerFrame) {
      console.error(`Expected all waveforms to have ${samplesPerFrame}, but keyframe ${i} has ${keyframes[i].length} samples`);
      return;
    }
  }

  const keyframeValues = spreadKeyframes(keyframes, numberFrames);

  const newWavetable: WavetableWithMetadata = { keyframes: new Set([]), data: [], name, presetNumber }

  for (let i = 0; i < keyframeValues.length - 1; i++) {
    const startKeyframe = keyframeValues[i];
    const endKeyframe = keyframeValues[i + 1];
    const startWaveform = startKeyframe.data;
    const endWaveform = endKeyframe.data;

    for (let frame = startKeyframe.frame; frame <= endKeyframe.frame; frame++) {
      const t = (frame - startKeyframe.frame) / (endKeyframe.frame - startKeyframe.frame);
      newWavetable.data[frame] = interpolateWaveforms(startWaveform, endWaveform, t);
    }
  }

  keyframeValues.forEach(kf => {
    newWavetable.keyframes.add(kf.frame);
  })

  return newWavetable;
}

const interpolateWaveforms = (waveform1: WaveformData, waveform2: WaveformData, t: number): WaveformData => {
  return waveform1.map((v, i) => v * (1 - t) + waveform2[i] * t);
};
