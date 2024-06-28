import React, { useRef, useEffect, useState } from 'react';
import type { WaveShapeKeyframe, Wavetable } from './wavetableUtils';
import { generateWavetable } from './wavetableUtils';
import ButtonGroup from './ButtonGroup';
import SingleWaveformChart from './SingleWaveformChart';
import * as d3 from 'd3';

type ChartType = 'single' | 'table';

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
  const surfacePlotRef = useRef<SVGSVGElement>(null);
  const [wavetable, setWavetable] = useState<Wavetable>([]);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('single');

  const minLineWidth = 1;
  const maxLineWidth = 3;

  const colorScale = d3.scaleLinear<string>()
    .domain([0, 1])
    .range(['steelblue', 'salmon']);

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

  useEffect(() => {
    if (wavetable.length == 0) {
      return
    }

    if (selectedChartType == 'table') {
      renderSurfacePlot(selectedFrame);
    }
  }, [wavetable, selectedFrame, selectedChartType]);


  const renderSurfacePlot = (selectedFrame: number) => {
    if (!surfacePlotRef.current) return;

    const svg = d3.select(surfacePlotRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([0, samplesPerFrame - 1])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, waveTableFrames - 1])
      .range([0, -1 * height]);

    const zScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([-(waveTableFrames - 2) / waveTableFrames * height, height]);

    const keyframeColorScale = (frameIndex: number) => {
      if (keyframes.map(k => k.frame).includes(frameIndex)) {
        return colorScale(frameIndex / waveTableFrames);
      } else {
        return '#dddddd'
      }
    }

    const area = d3.area<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d));

    const paths: any[] = [];
    wavetable.forEach((frame, frameIndex) => {
      // console.log(`Rendering frame ${frameIndex} ${colorScale(frameIndex / waveTableFrames)}`, frame);
      paths.push(svg.append('path')
        .datum(frame)
        .attr('fill', 'none')
        .attr('stroke', keyframeColorScale(frameIndex))
        .attr('stroke-width', minLineWidth)
        .attr('d', area)
        .attr('transform', `translate(0, ${zScale(frameIndex / (waveTableFrames))})`));
    });

    // Update frame indicator position when selected frame changes
    const updateFrameIndicator = () => {
      paths[selectedFrame]
        .attr('stroke-width', maxLineWidth)
        .attr('stroke', colorScale(selectedFrame / waveTableFrames));
    };

    updateFrameIndicator();
  };

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
        {selectedChartType == 'table' &&
          <svg ref={surfacePlotRef} width={'100%'} height={'100%'} viewBox={`0 ${-1 * maxLineWidth} ${width} ${height + 2 * maxLineWidth}`}></svg>}
      </div>
    </div >
  );
};

export default WavetableSynthVisualizer;
