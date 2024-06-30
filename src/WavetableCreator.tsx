import React, { useEffect, useState } from 'react';
import type { WaveformData, WaveShape, WavetableWithMetadata } from './wavetableUtils';
import { LabeledWaveShapes, generateWaveform, generateWavetable } from './wavetableUtils';
import { insertAtIndex } from './utils'
import SingleWaveformChart from './SingleWaveformChart';
import ButtonGroup from './ButtonGroup';
import { TrashIcon } from '@heroicons/react/24/solid';

interface WaveformWithMetadata {
  data: WaveformData;
  shapeSelection: WaveShape;
}

interface WavetableCreatorProps {
  numberFrames: number;
  samplesPerFrame: number;
  wavetableChanged(wavetable: WavetableWithMetadata | undefined): any;
}

const WavetableCreator: React.FC<WavetableCreatorProps> = ({
  numberFrames,
  samplesPerFrame,
  wavetableChanged,
}) => {
  const [inProgress, setInProgress] = useState<boolean>(false);

  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(-1);
  const [name, setName] = useState<string>('Empty Wavetable');
  const [presetNumber, setPresetNumber] = useState<number | undefined>(undefined);
  const [wavetableKeyframes, setWavetableKeyframes] = useState<WaveformWithMetadata[]>([]);

  const currentWaveform = wavetableKeyframes[currentFrameIndex];

  useEffect(() => {
    if (wavetableKeyframes.length == 0) {
      wavetableChanged(undefined);
    }
    const wavetable = generateWavetable(wavetableKeyframes.map(w => w.data), numberFrames, samplesPerFrame, name, presetNumber);
    if (wavetable) {
      wavetableChanged(wavetable);
      console.log('wavetable changed', wavetable)
    }
  }, [wavetableKeyframes, name, presetNumber]);

  const newWavetableHandler = () => {
    setInProgress(true);
  }

  const discardNewWavetable = () => {
    setInProgress(false);
    setCurrentFrameIndex(-1);
    setWavetableKeyframes([]);
  }

  const saveNewWavetable = () => {
    setInProgress(false);
  }

  const newFrame = () => {
    const shapeSelection: WaveShape = 'none';
    const data = generateWaveform(shapeSelection, samplesPerFrame);
    const newIndex = currentFrameIndex + 1;
    const newKeyframes = insertAtIndex(wavetableKeyframes, newIndex, { data, shapeSelection });
    setWavetableKeyframes(newKeyframes);
    setCurrentFrameIndex(newIndex);
  }

  const deleteFrame = () => {
    const newKeyframes = [...wavetableKeyframes];
    newKeyframes.splice(currentFrameIndex, 1);
    setWavetableKeyframes(newKeyframes);
    const nextFrameIndex = currentFrameIndex == 0 && newKeyframes.length > 0 ? 0 : currentFrameIndex - 1;
    setCurrentFrameIndex(nextFrameIndex);
  }

  const selectFrame = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentFrameIndex(Number(e.target.value));
  }

  const nameHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }

  const presetNumberHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPresetNumber(Number(e.target.value));
  }

  const currentShapeSelectionHandler = (shapeSelection: WaveShape) => {
    const data = generateWaveform(shapeSelection, samplesPerFrame);
    const newKeyframes = [...wavetableKeyframes];
    newKeyframes[currentFrameIndex] = { data, shapeSelection }
    setWavetableKeyframes(newKeyframes);
  }

  if (!inProgress) {
    const text = wavetableKeyframes.length == 0 ? 'Build New Wavetable' : 'Edit Wavetable';
    return (
      <div className="flex-row my-8">
        <button className="center bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded" onClick={newWavetableHandler}>{text}</button>
      </div>
    );
  }

  return (
    <div className="flex-row m-8">
      <div className="flex flex-col p-8 pb-16 gap-4">
        <h2 className="text-center">Creating New Wavetable ({numberFrames} frames x {samplesPerFrame} samples)</h2>

        <div className='flex flex-row gap-2 h-8'>
          <input className="border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-1 min-w-36" type="text" value={name} onChange={nameHandler}></input>
          <div className='grow' />
          <label >Preset Number</label>
          <input className="border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-1 w-auto" type="number" value={presetNumber == undefined ? '' : presetNumber} onChange={presetNumberHandler}></input>
        </div>

        <div className='flex flex-row gap-2 h-8'>
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-1 min-w-36" value={currentFrameIndex} onChange={selectFrame} disabled={wavetableKeyframes.length == 0}>
            {wavetableKeyframes.map((_, idx) => (
              <option key={`option-${idx}`} value={idx}>Keyframe {idx}</option>
            ))}
            {wavetableKeyframes.length == 0 && (<option>No Keyframes</option>)}
          </select>
          <button onClick={newFrame} className="flex-end bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded disabled:bg-gray-400">
            New Frame
          </button>
        </div>

        {currentWaveform !== undefined ? (
          <div>
            <div className="flex flex-row gap-2">
              <div className="grow">
                <ButtonGroup options={LabeledWaveShapes} selected={currentWaveform.shapeSelection} onSelect={currentShapeSelectionHandler} />
              </div>
              <button onClick={deleteFrame} className="w-8 grow-0 flex-end bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded">
                <TrashIcon />
              </button>
            </div>
            <SingleWaveformChart data={currentWaveform.data} lineColor={'steelblue'} />
          </div>
        ) : (<></>)}
        <div className="flex flex-row gap-2">
          {currentWaveform !== undefined && (
            <button onClick={saveNewWavetable} className="flex-end bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded disabled:bg-gray-400">
              Save Wavetable
            </button>
          )}
          <div className='grow' />
          <button onClick={discardNewWavetable} className="grow-0 flex-end bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded">Discard Wavetable</button>
        </div>
      </div >
    </div>
  )
};

export default WavetableCreator;

