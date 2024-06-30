import type { WavetableWithMetadata } from "./wavetableUtils";
const ValidSampleSizes = [256, 512, 1024, 2048, 4096];

export async function loadWavetable(file: File, numFrames: number = 64, samplesPerFrame?: number): Promise<WavetableWithMetadata> {
  // Read the file as an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Decode the audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Get the audio data as a Float32Array
  const audioData = audioBuffer.getChannelData(0);

  // If samplesPerFrame is not provided, calculate it
  if (samplesPerFrame === undefined) {
    if (audioData.length % numFrames !== 0) {
      throw new Error('The number of samples in the audio file must be an even multiple of the number of frames');
    }
    samplesPerFrame = audioData.length / numFrames;
  }

  // Calculate the total number of samples we need
  const totalSamples = numFrames * samplesPerFrame;

  // Ensure we have enough samples in the audio file
  if (audioData.length < totalSamples) {
    throw new Error('WAV file does not contain enough samples for the specified wavetable size');
  }

  if (!ValidSampleSizes.includes(samplesPerFrame)) {
    throw new Error(`Invalid samplesPerFrame. Must be one of: ${ValidSampleSizes.join(', ')}`);
  }

  // Create the wavetable array
  const data: Float32Array[] = [];

  // Fill the wavetable
  for (let i = 0; i < numFrames; i++) {
    const frame = new Float32Array(samplesPerFrame);
    for (let j = 0; j < samplesPerFrame; j++) {
      const index = i * samplesPerFrame + j;
      frame[j] = audioData[index];
    }
    data.push(frame);
  }
  const { name, presetNumber } = parseName(file.name);

  // When loading wavetable from a wav file, treat every frame as a keyframe
  const keyframes = new Set(Array.from({ length: numFrames }).map((_, i) => i));
  return { name, presetNumber, keyframes, data }
}

const parseName = (fileName: string): { name: string, presetNumber?: number } => {
  const strippedPrefix = fileName.split('.').slice(0, -1).join('.')
  const snakeParts = strippedPrefix.split('_');
  let fullName: string = '';
  let presetNumber: number | undefined = undefined;
  if (snakeParts.length >= 2) {
    presetNumber = Number(snakeParts.slice(-1)[0]) || undefined;
    if (presetNumber == undefined) {
      fullName = snakeParts.join('_')
    } else {
      fullName = snakeParts.slice(0, -1).join('_');
    }
  } else {
    fullName = snakeParts[0]
  }
  const name = fullName.slice(0, 14);
  return { name, presetNumber }
}
