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
  numberFrames: number,
  samplesPerFrame: number,
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

  const newWavetable: WavetableWithMetadata = { keyframes: new Set([]), data: [], name, presetNumber, numberFrames, samplesPerFrame }

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


export async function downsampleAudio(inputBuffer: Float32Array, originalSampleRate: number, targetSampleRate: number): Promise<Float32Array> {
  const audioContext = new window.AudioContext();

  // Create a buffer source
  const sourceBuffer = audioContext.createBuffer(1, inputBuffer.length, originalSampleRate);
  sourceBuffer.getChannelData(0).set(inputBuffer);

  const source = audioContext.createBufferSource();
  source.buffer = sourceBuffer;

  // Create a BiquadFilterNode for low-pass filtering
  const lowPassFilter = audioContext.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.setValueAtTime(targetSampleRate / 2, audioContext.currentTime);

  // Create an OfflineAudioContext for processing
  const offlineCtx = new OfflineAudioContext(1, inputBuffer.length * targetSampleRate / originalSampleRate, targetSampleRate);

  // Connect nodes
  source.connect(lowPassFilter);
  lowPassFilter.connect(offlineCtx.destination);

  // Start the source and run the offline context
  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();

  // Extract the resampled data
  return renderedBuffer.getChannelData(0);
}

// Usage example
// async function example() {
//   const originalAudio = new Float32Array(/* your audio data */);
//   const originalSampleRate = 44100;
//   const targetSampleRate = 22050;
//
//   try {
//     const downsampledAudio = await downsampleAudio(originalAudio, originalSampleRate, targetSampleRate);
//     console.log('Downsampled audio:', downsampledAudio);
//   } catch (error) {
//     console.error('Error downsampling audio:', error);
//   }
// }

export async function upsampleAudio(inputBuffer: Float32Array, originalSampleRate: number, targetSampleRate: number): Promise<Float32Array> {
  const audioContext = new window.AudioContext();

  // Create a buffer source
  const sourceBuffer = audioContext.createBuffer(1, inputBuffer.length, originalSampleRate);
  sourceBuffer.getChannelData(0).set(inputBuffer);

  const source = audioContext.createBufferSource();
  source.buffer = sourceBuffer;

  // Create an OfflineAudioContext for processing
  const offlineCtx = new OfflineAudioContext(1, inputBuffer.length * targetSampleRate / originalSampleRate, targetSampleRate);

  // Connect source to offline context
  source.connect(offlineCtx.destination);

  // Start the source and run the offline context
  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();

  // Extract the resampled data
  return renderedBuffer.getChannelData(0);
}

// // Usage example
// async function example() {
//     const originalAudio = new Float32Array(/* your audio data */);
//     const originalSampleRate = 22050;
//     const targetSampleRate = 44100;
//     
//     try {
//         const upsampledAudio = await upsampleAudio(originalAudio, originalSampleRate, targetSampleRate);
//         console.log('Upsampled audio:', upsampledAudio);
//     } catch (error) {
//         console.error('Error upsampling audio:', error);
//     }
// }


export function downsample2xSimple(input: Float32Array): Float32Array {
  const output = new Float32Array(Math.ceil(input.length / 2));

  for (let i = 0; i < output.length; i++) {
    output[i] = input[i * 2];
  }

  return output;
}

export function upsample2xSimple(input: Float32Array): Float32Array {
  const output = new Float32Array(input.length * 2);

  for (let i = 0; i < input.length - 1; i++) {
    const currentSample = input[i];
    const nextSample = input[i + 1];
    const interpolatedSample = (currentSample + nextSample) / 2;

    output[i * 2] = currentSample;
    output[i * 2 + 1] = interpolatedSample;
  }

  // Handle the last sample
  output[output.length - 2] = input[input.length - 1];
  output[output.length - 1] = input[input.length - 1];

  return output;
}
