import React, { useState } from 'react';
import type { WavetableWithKeyframes } from './wavetableUtils';
import ButtonGroup from './ButtonGroup';
import SingleWaveformChart from './SingleWaveformChart';
import TableWaveformChart from './TableWaveformChart';
import * as d3 from 'd3';

type ChartType = 'single' | 'table';

const colorScale = d3.scaleLinear<string>()
  .domain([0, 1])
  .range(['steelblue', 'salmon']);

interface WavetableSynthVisualizerProps {
  width?: number;
  height?: number;
  wavetable: WavetableWithKeyframes | undefined,
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
      <div>Error - no valid waveform</div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className="flex flex-row gap-4">

        <ButtonGroup options={[{ value: 'table', label: 'Table' }, { value: 'single', label: 'Single' }]} defaultSelected={selectedChartType} onSelect={handleSelectChartType} />
        <div className="inline-flex grow w-32 gap-2">
          <input
            type="range"
            min={0}
            max={numberFrames - 1}
            value={selectedFrame}
            onChange={handleFrameChange}
            className="w-full"
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
