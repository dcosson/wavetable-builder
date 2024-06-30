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


function convertFloatToBlofeld(data: Float32Array, wavetableName: string, slot: number): Uint8Array {
  // Validate input
  if (slot < 80 || slot > 118) {
    throw new Error('Slot must be between 80 and 118');
  }
  if (wavetableName.length > 14 || !isValidName(wavetableName)) {
    throw new Error('Wavetable name must be less than 14 ASCII characters long');
  }

  const expectedSamples = 64 * 128;
  if (data.length !== expectedSamples) {
    throw new Error(`Float array must have ${expectedSamples} samples`);
  }

  // Convert float samples to 21-bit integer samples
  const max = 1048575; // 21-bit values are in [-1048575, 1048575]
  const samples = new Int32Array(64 * 128);

  for (let i = 0; i < 64 * 128; i++) {
    const floatSample = Math.max(-1, Math.min(1, data[i])); // Clamp to [-1, 1]
    samples[i] = Math.round(floatSample * max);
  }

  // Generate SysEx data
  const sysExData = new Uint8Array(64 * 410); // 64 waves * 410 bytes per wave
  let dataIndex = 0;

  for (let wave = 0; wave < 64; ++wave) {
    sysExData[dataIndex++] = 0xf0; // SysEx
    sysExData[dataIndex++] = 0x3e; // Waldorf ID
    sysExData[dataIndex++] = 0x13; // Blofeld ID
    sysExData[dataIndex++] = 0x00; // Device ID
    sysExData[dataIndex++] = 0x12; // Wavetable Dump
    sysExData[dataIndex++] = 0x50 + slot - 80; // Wavetable Number
    sysExData[dataIndex++] = wave & 0x7f; // Wave Number
    sysExData[dataIndex++] = 0x00; // Format

    // Actual samples
    for (let i = 0; i < 128; ++i) {
      const sampleValue = samples[i + wave * 128];
      sysExData[dataIndex++] = (sampleValue >> 14) & 0x7f;
      sysExData[dataIndex++] = (sampleValue >> 7) & 0x7f;
      sysExData[dataIndex++] = sampleValue & 0x7f;
    }

    // Wavetable name
    for (let i = 0; i < 14; ++i) {
      sysExData[dataIndex++] = wavetableName.charCodeAt(i) & 0x7f;
    }

    sysExData[dataIndex++] = 0x0; // Reserved
    sysExData[dataIndex++] = 0x0; // Reserved

    // Calculate checksum
    let checksum = 0;
    for (let i = dataIndex - 401; i < dataIndex; i++) {
      checksum += sysExData[i];
    }
    sysExData[dataIndex++] = checksum & 0x7f;

    sysExData[dataIndex++] = 0xf7; // End
  }

  return sysExData;
}

function isValidName(s: string): boolean {
  return s.split('').every(c => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) <= 0x7f);
}

function saveSysExToFile(sysExData: Uint8Array, fileName: string): void {
  const blob = new Blob([sysExData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { convertFloatToBlofeld, saveSysExToFile };
