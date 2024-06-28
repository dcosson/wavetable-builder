import React, { useState } from 'react';
import type { WaveformData, WaveShape, WaveformDataWithKeyframe } from './wavetableUtils';
import { LabeledWaveShapes, generateWaveform, generateWavetable } from './wavetableUtils';
import SingleWaveformChart from './SingleWaveformChart';
import ButtonGroup from './ButtonGroup';
import { TrashIcon } from '@heroicons/react/24/solid';

interface WavetableCreatorProps {
  numberFrames: number,
  samplesPerFrame: number,
}

const WavetableCreator: React.FC<WavetableCreatorProps> = ({
  numberFrames,
  samplesPerFrame,
}) => {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [currentShapeSelection, setCurrentShapeSelection] = useState<WaveShape>('none');
  const [currentFrameNumber, setCurrentFrameNumber] = useState<number>(0);
  const [currentWaveformData, setCurrentWaveformData] = useState<WaveformData>(generateWaveform(currentShapeSelection, samplesPerFrame));


  const [wavetableKeyframes, setWavetableKeyframes] = useState<WaveformDataWithKeyframe[]>([]);

  // useEffect(() => {
  //   setWavetable
  //   if (wavetable.length == 0) {
  //     renderWaveform(EmptyWaveform);
  //   } else {
  //     renderWaveform(wavetable[0])
  //   }
  // }, [keyframes]);

  const newWavetableHandler = () => {
    setInProgress(true);
  }

  const discardNewWavetable = () => {
    setInProgress(false);
    setCurrentShapeSelection('none');
    setCurrentFrameNumber(0);
    setCurrentWaveformData(generateWaveform('none', samplesPerFrame));
    setWavetableKeyframes([]);
  }

  const saveFrame = () => {
    // keyframes.push(currentWaveshape);
    // setCurrentWaveshape(generateWaveform('none', samplesPerFrame));
  }

  const newFrame = () => {
    const nextFrame = (wavetableKeyframes.length > 0 && wavetableKeyframes[0].frame || 0) + 1;
    setWavetableKeyframes(wavetableKeyframes.concat({ frame: nextFrame, data: currentWaveformData }))
  }

  const selectFrame = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentFrameNumber(Number(e.target.value));
  }

  const currentShapeSelectionHandler = (value: WaveShape) => {
    setCurrentShapeSelection(value);
    setCurrentWaveformData(generateWaveform(value, samplesPerFrame));
  }


  return (
    <div className="flex-row m-8">
      {!inProgress && <button className="center bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded" onClick={newWavetableHandler}>New Wavetable</button>}
      {inProgress && (
        <div className="flex flex-col p-8 pb-16 gap-4">
          <h2 className="text-center">Creating New Wavetable ({numberFrames} frames x {samplesPerFrame} samples)</h2>
          <div className='flex flex-row gap-2'>
            <select className="grow-0 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" value={currentFrameNumber} onChange={selectFrame}>
              {wavetableKeyframes.map((_, idx) => (
                <option key={`option-${idx}`} value={idx}>Keyframe {idx}</option>
              ))}
            </select>
            <button onClick={newFrame} className="grow-0 flex-end bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded disabled:bg-gray-400">
              New Frame
            </button>


          </div>
          <div className="flex flex-row gap-2">
            <div className="grow">
              <ButtonGroup options={LabeledWaveShapes} defaultSelected={currentShapeSelection} onSelect={currentShapeSelectionHandler} />
            </div>
            <button onClick={saveFrame} className="grow-0 flex-end bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded disabled:bg-gray-400">
              Save Frame
            </button>
            <button onClick={discardNewWavetable} className="w-8 grow-0 flex-end bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded">
              <TrashIcon />
            </button>
          </div>
          <SingleWaveformChart data={currentWaveformData} lineColor={'steelblue'} />
        </div>
      )}
    </div >
  );
};

export default WavetableCreator;

