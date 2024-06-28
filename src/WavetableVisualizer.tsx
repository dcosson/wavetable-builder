import React, { useRef, useEffect, useState } from 'react';
import type { WaveShapeKeyframe, Wavetable } from './wavetableUtils';
import { generateWavetable } from './wavetableUtils';
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
  const singleWaveformRef = useRef<SVGSVGElement>(null);
  const surfacePlotRef = useRef<SVGSVGElement>(null);
  const [wavetable, setWavetable] = useState<Wavetable>([]);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('table');

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
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

    if (selectedChartType == 'single') {
      renderSingleWaveform(selectedFrame);
    } else {
      renderSurfacePlot(selectedFrame);
    }
  }, [wavetable, selectedFrame, selectedChartType]);


  const renderSingleWaveform = (frameIndex: number) => {
    if (!singleWaveformRef.current) return;

    const svg = d3.select(singleWaveformRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([0, samplesPerFrame - 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d));

    svg.append('path')
      .datum(wavetable[frameIndex])
      .attr('fill', 'none')
      .attr('stroke', colorScale(frameIndex / waveTableFrames))
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(_ => '').tickSize(0));
  };

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

  const handleChartTypeTable = (_: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedChartType('table');
  }

  const handleChartTypeSingle = (_: React.MouseEvent<HTMLButtonElement>) => {
    console.log('set single');
    setSelectedChartType('single');
  }

  return (
    <div className='flex flex-col'>
      <div>
        <div className="flex justify-center">
          <button type="button" className={"py-3 px-4 inline-flex justify-center items-center gap-2 -ml-px first:rounded-l-lg first:ml-0 last:rounded-r-lg border font-medium bg-white text-gray-900 align-middle hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm "} onClick={handleChartTypeTable}>
            Table
          </button>
          <button type="button" className="py-3 px-4 inline-flex justify-center items-center gap-2 -ml-px first:rounded-l-lg first:ml-0 last:rounded-r-lg border font-medium bg-white text-gray-900 align-middle hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm" onClick={handleChartTypeSingle}>
            Single
          </button>
        </div>
        <div className="flex">
          <input
            type="range"
            min={0}
            max={waveTableFrames - 1}
            value={selectedFrame}
            onChange={handleFrameChange}
            className="w-full"
          />
          <p className="text-right flex-1">Frame:&nbsp;{selectedFrame}</p>
        </div>
      </div>
      <div className={'flex min-w-0'}>
        {selectedChartType == 'single' &&
          <svg ref={singleWaveformRef} viewBox={`0 0 ${width} ${height}`}></svg>}
        {selectedChartType == 'table' &&
          <svg ref={surfacePlotRef} width={'100%'} height={'100%'} viewBox={`0 ${-1 * maxLineWidth} ${width} ${height + 2 * maxLineWidth}`}></svg>}
      </div>
    </div>
  );
};

export default WavetableSynthVisualizer;
