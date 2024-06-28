import React, { useEffect, useState } from 'react';
import type { WaveShapeKeyframe, Wavetable } from './wavetableUtils';
import { generateWavetable } from './wavetableUtils';
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
  waveTableFrames?: number;
  samplesPerFrame?: number;
  keyframes: WaveShapeKeyframe[];
}

const WavetableSynthVisualizer: React.FC<WavetableSynthVisualizerProps> = ({
  width = 800,
  height = 400,
  waveTableFrames = 64,
  samplesPerFrame = 256,
  keyframes,
}) => {
  const [wavetable, setWavetable] = useState<Wavetable>([]);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('table');

  useEffect(() => {
    if (keyframes.length < 2) {
      console.error("At least two keyframes are required");
      return;
    }

    const sortedKeyframes = [...keyframes].sort((a, b) => a.frame - b.frame);

    if (sortedKeyframes[0].frame !== 0 || sortedKeyframes[sortedKeyframes.length - 1].frame !== waveTableFrames - 1) {
      console.error("Keyframes must include frame 0 and the last frame");
      return;
    }

    const newWavetable = generateWavetable(sortedKeyframes, samplesPerFrame);
    setWavetable(newWavetable);
  }, [keyframes, waveTableFrames, samplesPerFrame]);

  const handleFrameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFrame(Number(event.target.value));
  };

  const handleSelectChartType = (value: ChartType) => {
    setSelectedChartType(value);
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className="flex flex-row gap-4">

        <ButtonGroup options={[{ value: 'table', label: 'Table' }, { value: 'single', label: 'Single' }]} defaultSelected={selectedChartType} onSelect={handleSelectChartType} />
        <div className="inline-flex grow w-32 gap-2">
          <input
            type="range"
            min={0}
            max={waveTableFrames - 1}
            value={selectedFrame}
            onChange={handleFrameChange}
            className="w-full"
          />
          <p className="my-auto">Frame:&nbsp;{selectedFrame}</p>
        </div>
      </div >

      <div className={'flex min-w-0'}>
        <SingleWaveformChart
          data={wavetable[selectedFrame]}
          width={width}
          height={height}
          lineColor={colorScale(selectedFrame / waveTableFrames)}
          hideChart={selectedChartType != 'single'}
        />
        <TableWaveformChart
          width={width}
          height={height}
          wavetable={wavetable}
          selectedFrame={selectedFrame}
          colorScale={colorScale}
          nonKeyframeColor='#dddddd'
          keyframeIndexes={new Set(keyframes.map(v => v.frame))}
          hideChart={selectedChartType != 'table'}
        />
      </div>
    </div >
  );
};

export default WavetableSynthVisualizer;
