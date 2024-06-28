export type WaveformData = number[];
export type Wavetable = WaveformData[];

export type WaveShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface WaveShapeKeyframe {
  frame: number;
  shape: WaveShape;
}
export const generateWaveform = (shape: WaveShape, samplesPerFrame: number): WaveformData => {
  const waveform = new Array(samplesPerFrame).fill(0);
  const frequency = 1; // One cycle per frame

  for (let i = 0; i < samplesPerFrame; i++) {
    const t = i / samplesPerFrame;
    switch (shape) {
      case 'sine':
        waveform[i] = Math.sin(2 * Math.PI * frequency * t);
        break; case 'square':
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

const interpolateWaveforms = (waveform1: WaveformData, waveform2: WaveformData, t: number): WaveformData => {
  return waveform1.map((v, i) => v * (1 - t) + waveform2[i] * t);
};

export const generateWavetable = (sortedKeyframes: WaveShapeKeyframe[], samplesPerFrame: number): Wavetable => {
  const newWavetable: Wavetable = [];

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const startKeyframe = sortedKeyframes[i];
    const endKeyframe = sortedKeyframes[i + 1];
    const startWaveform = generateWaveform(startKeyframe.shape, samplesPerFrame);
    const endWaveform = generateWaveform(endKeyframe.shape, samplesPerFrame);

    for (let frame = startKeyframe.frame; frame <= endKeyframe.frame; frame++) {
      const t = (frame - startKeyframe.frame) / (endKeyframe.frame - startKeyframe.frame);
      newWavetable[frame] = interpolateWaveforms(startWaveform, endWaveform, t);
    }
  }

  return newWavetable;
};
