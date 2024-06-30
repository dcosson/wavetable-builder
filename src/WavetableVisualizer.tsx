import React, { useState } from 'react';
import type { WavetableWithMetadata } from './wavetableUtils';
import ButtonGroup from './ButtonGroup';
import SingleWaveformChart from './SingleWaveformChart';
import TableWaveformChart from './TableWaveformChart';
import waveformBackgroundImage from './assets/waveformBackgroundImage.svg'
import * as d3 from 'd3';

type ChartType = 'single' | 'table';

const colorScale = d3.scaleLinear<string>()
  .domain([0, 1])
  .range(['steelblue', 'salmon']);

interface WavetableSynthVisualizerProps {
  width?: number;
  height?: number;
  wavetable?: WavetableWithMetadata;
  numberFrames?: number;
}

const WavetableSynthVisualizer: React.FC<WavetableSynthVisualizerProps> = ({
  width = 800,
  height = 400,
  wavetable,
  numberFrames = 64,
}) => {
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('table');

  const handleFrameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFrame(Number(event.target.value));
  };

  const handleSelectChartType = (value: ChartType) => {
    setSelectedChartType(value);
  }

  if (wavetable === undefined) {
    return (
      <div className='flex flex-row'>
        <div className='flex flex-row items-center grow min-h-48 border-solid border-2 border-slate-500 rounded-md' style={{
          backgroundImage: `url(${waveformBackgroundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundClip: 'content-box',
          backgroundSize: 'cover'
        }}>
          <div className='grow'></div>
          <h2 className='text-center p-4 font-bold text-slate-500 bg-slate-100 rounded-md bg-opacity-85'>No Wavetable loaded</h2>
          <div className='grow'></div>
        </div>
      </div >
    )
  }

  return (
    <div className='flex flex-col gap-6'>

      <div className="flex flex-row gap-4">
        <h2 className='text-left'>{wavetable.name}</h2>
        <div className='grow'></div>
        {wavetable.presetNumber !== undefined &&
          (<h3 className='text-right'>Preset: {wavetable.presetNumber}</h3>)
        }
      </div>
      <div className="flex flex-row gap-4">
        <ButtonGroup options={[{ value: 'table', label: 'Table' }, { value: 'single', label: 'Waveform' }]} selected={selectedChartType} onSelect={handleSelectChartType} />
        <div className="inline-flex grow w-32 gap-2">
          <input
            type="range"
            min={0}
            max={numberFrames - 1}
            value={selectedFrame}
            onChange={handleFrameChange}
            className="w-full accent-blue-500 hover:accent-blue-700"
          />
          <p className="my-auto">Frame:&nbsp;{selectedFrame}</p>
        </div>
      </div >

      <div className={'flex min-w-0'}>
        <SingleWaveformChart
          data={wavetable.data[selectedFrame]}
          width={width}
          height={height}
          lineColor={colorScale(selectedFrame / numberFrames)}
          hideChart={selectedChartType != 'single'}
        />
        <TableWaveformChart
          width={width}
          height={height}
          wavetable={wavetable.data}
          selectedFrame={selectedFrame}
          colorScale={colorScale}
          nonKeyframeColor='#dddddd'
          keyframeIndexes={wavetable.keyframes}
          hideChart={selectedChartType != 'table'}
        />
      </div>
    </div >
  );
};

export default WavetableSynthVisualizer;
