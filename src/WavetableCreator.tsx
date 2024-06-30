import React, { useEffect, useRef, useState } from 'react';
import type { WaveformData, WaveShape, WavetableWithMetadata } from './wavetableUtils';
import { LabeledWaveShapes, generateWaveform, generateWavetable } from './wavetableUtils';
import { insertAtIndex } from './utils'
import SingleWaveformChart from './SingleWaveformChart';
import ButtonGroup from './ButtonGroup';
import type { ButtonOption } from './ButtonGroup';
import { TrashIcon } from '@heroicons/react/24/solid';
import { loadWavetable } from './fileUtils';

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
  const mouseDownAudioTimeout = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const [_, setAudioFileContent] = useState<Float32Array | undefined>(undefined);

  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(-1);
  const [name, setName] = useState<string>('Empty Wavetable');
  const [presetNumber, setPresetNumber] = useState<number | undefined>(undefined);
  const [wavetableKeyframes, setWavetableKeyframes] = useState<WaveformWithMetadata[]>([]);

  const ButtonOptions: ButtonOption<WaveShape>[] = [...LabeledWaveShapes];
  ButtonOptions[ButtonOptions.length - 1].disabled = true;
  const currentWaveform = wavetableKeyframes[currentFrameIndex];

  useEffect(() => {
    if (wavetableKeyframes.length < 2) {
      wavetableChanged(undefined);
      return
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

  const fileDropHandler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length != 1) {
      console.error("Please upload 1 file at a time");
      return
    }
    uploadWavetableFileHandler(e.dataTransfer.files[0]);
  }

  const fileClickHandler = (_: React.MouseEvent<HTMLDivElement>) => {
    //@ts-ignore not recognizing this method on window
    window.showOpenFilePicker().then((fsHandle: FileSystemFileHandle[]) => {
      if (fsHandle.length != 1) {
        console.error("Please pick 1 file at a time");
        return
      }
      if (fsHandle[0].kind != 'file') {
        console.error("Please pick a file not a directory");
        return
      }
      fsHandle[0].getFile().then(file => {
        uploadWavetableFileHandler(file);
      });
    });

  }

  const fileDragHandler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  const uploadWavetableFileHandler = (file: File) => {
    loadWavetable(file).then(newWavetable => {
      console.log('loaded file', newWavetable)
      wavetableChanged(newWavetable);
      setInProgress(true);
      setName(newWavetable.name || 'Uploaded Wavetable');
      setPresetNumber(newWavetable.presetNumber);
      const newKeyframes: WaveformWithMetadata[] = newWavetable.data.map(v => ({ data: v, shapeSelection: 'custom' }));
      setWavetableKeyframes(newKeyframes);
      setCurrentFrameIndex(0);
    });
  }

  const audioClickHandler = (_: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownAudioTimeout.current > 0) {
      clearTimeout(mouseDownAudioTimeout.current);
      mouseDownAudioTimeout.current = 0;
    }
    if (mediaRecorderRef.current) {
      console.log('stopping recording', mediaRecorderRef.current.state, mediaRecorderRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
      });
      mediaRecorderRef.current.stop();
      console.log('stopping recording 2', mediaRecorderRef.current.state, mediaRecorderRef.current);
      mediaRecorderRef.current = undefined;
      return;
    }
  }

  const audioMouseLeaveHandler = (_: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownAudioTimeout.current > 0) {
      clearTimeout(mouseDownAudioTimeout.current);
      mouseDownAudioTimeout.current = 0;
    }
  }

  const audioMouseDownHandler = (_: React.MouseEvent<HTMLDivElement>) => {
    mouseDownAudioTimeout.current = setTimeout(audioMouseDownLongPress, 2000);
  }
  const audioMouseDownLongPress = () => {
    if (mouseDownAudioTimeout.current == 0) {
      return;
    }

    mouseDownAudioTimeout.current = 0;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      console.log('starting recording');
      mediaRecorderRef.current.start();
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('got blob', event);
        event.data.arrayBuffer().then(buff => {
          const audioContext = new AudioContext();
          audioContext.decodeAudioData(buff).then(decodedBuff => {
            setAudioFileContent(decodedBuff.getChannelData(0));
          });
        });
      };
    });
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
      <div className="flex flex-row my-8 min-h-12 gap-2">
        <div className='flex'>
          <button className="center bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded h-full" onClick={newWavetableHandler}>{text}</button>
        </div>
        <div className='grow'></div>
        <div className='flex flex-col border border-2 border-slate-500 px-4 text-slate-500 rounded-md cursor-pointer hover:text-gray-50 hover:border-blue-700 hover:bg-blue-700'
          onMouseDown={audioMouseDownHandler}
          onMouseLeave={audioMouseLeaveHandler}
          onClick={audioClickHandler}
        >
          <div className='grow'></div>
          <h3 className='text-center'>Use Audio</h3>
          <div className='grow'></div>
        </div>
        <div className='flex flex-col border border-2 border-slate-500 px-4 text-slate-500 rounded-md cursor-pointer hover:text-gray-50 hover:border-blue-700 hover:bg-blue-700'
          onClick={fileClickHandler}
          onDrop={fileDropHandler}
          onDragOver={fileDragHandler}
          onDragEnter={fileDragHandler}
          onDragLeave={fileDragHandler}
        >
          <div className='grow'></div>
          <h3 className='text-center'>Upload Wavetable</h3>
          <div className='grow'></div>
        </div>
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
                <ButtonGroup options={ButtonOptions} selected={currentWaveform.shapeSelection} onSelect={currentShapeSelectionHandler} />
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

