import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

type WaveformData = number[];
type Wavetable = WaveformData[];

type WaveShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface WaveShapeKeyframe {
  frame: number;
  shape: WaveShape;
}

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

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const minLineWidth = 1;
  const maxLineWidth = 3;

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

    const newWavetable = generateWavetable(sortedKeyframes);
    setWavetable(newWavetable);
  }, [keyframes, waveTableFrames, samplesPerFrame]);

  useEffect(() => {
    if (wavetable.length > 0) {
      // renderSingleWaveform(selectedFrame);
      renderSurfacePlot(selectedFrame);
    }
  }, [wavetable, selectedFrame]);

  const generateWaveform = (shape: WaveShape): WaveformData => {
    const waveform = new Array(samplesPerFrame).fill(0);
    const frequency = 1; // One cycle per frame

    for (let i = 0; i < samplesPerFrame; i++) {
      const t = i / samplesPerFrame;
      switch (shape) {
        case 'sine':
          waveform[i] = Math.sin(2 * Math.PI * frequency * t);
          break; case 'square':
          waveform[i] = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          waveform[i] = 2 * (t * frequency - Math.floor(0.5 + t * frequency));
          break;
        case 'triangle':
          waveform[i] = 1 - 4 * Math.abs(Math.round(t * frequency) - t * frequency);
          break;
      }
    }
    return waveform;
  };

  const interpolateWaveforms = (waveform1: WaveformData, waveform2: WaveformData, t: number): WaveformData => {
    return waveform1.map((v, i) => v * (1 - t) + waveform2[i] * t);
  };

  const generateWavetable = (sortedKeyframes: WaveShapeKeyframe[]): Wavetable => {
    const newWavetable: Wavetable = [];

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const startKeyframe = sortedKeyframes[i];
      const endKeyframe = sortedKeyframes[i + 1];
      const startWaveform = generateWaveform(startKeyframe.shape);
      const endWaveform = generateWaveform(endKeyframe.shape);

      for (let frame = startKeyframe.frame; frame <= endKeyframe.frame; frame++) {
        const t = (frame - startKeyframe.frame) / (endKeyframe.frame - startKeyframe.frame);
        newWavetable[frame] = interpolateWaveforms(startWaveform, endWaveform, t);
      }
    }

    return newWavetable;
  };

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
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top)
      .attr('text-anchor', 'end')
      .text(`Frame: ${frameIndex}`);
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

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 1])
      .range(['blue', 'red']);

    const area = d3.area<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d));

    const paths: any[] = [];
    wavetable.forEach((frame, frameIndex) => {
      console.log(`Rendering frame ${frameIndex} ${colorScale(frameIndex / waveTableFrames)}`, frame);
      paths.push(svg.append('path')
        .datum(frame)
        .attr('fill', 'none')
        .attr('stroke', colorScale(frameIndex / waveTableFrames))
        .attr('stroke-width', minLineWidth)
        .attr('d', area)
        .attr('transform', `translate(0, ${zScale(frameIndex / (waveTableFrames))})`));
    });

    // Update frame indicator position when selected frame changes
    const updateFrameIndicator = () => {
      paths[selectedFrame].attr('stroke-width', maxLineWidth);
    };

    updateFrameIndicator();
  };

  const handleFrameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFrame(Number(event.target.value));
  };

  return (
    <div>
      <svg ref={singleWaveformRef} width={width} height={height}></svg>
      <div>
        <input
          type="range"
          min={0}
          max={waveTableFrames - 1}
          value={selectedFrame}
          onChange={handleFrameChange}
          className="w-full"
        />
        <p className="text-center">Frame: {selectedFrame}</p>
      </div>
      <svg ref={surfacePlotRef} width={width} height={height} viewBox={`0 ${-1 * maxLineWidth} ${width} ${height + 2 * maxLineWidth}`}></svg>
    </div>
  );
};

export default WavetableSynthVisualizer;
