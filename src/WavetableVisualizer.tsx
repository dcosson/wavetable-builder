import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

type WaveformData = number[];
type Wavetable = WaveformData[];
type Point3D = { x: number; y: number; z: number };

type WaveShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface WaveShapeKeyframe {
  frame: number;
  shape: WaveShape;
}

interface WavetableVisualizerProps {
  width?: number;
  height?: number;
  waveTableFrames?: number;
  samplesPerFrame?: number;
  keyframes: WaveShapeKeyframe[];
}

const WavetableVisualizer: React.FC<WavetableVisualizerProps> = ({
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
      renderSurfacePlot();
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
          break;
        case 'square':
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

    // Add frame number text
    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top)
      .attr('text-anchor', 'end')
      .text(`Frame: ${frameIndex}`);
  };

  const renderSurfacePlot = () => {
    if (!surfacePlotRef.current) return;

    const svg = d3.select(surfacePlotRef.current);
    svg.selectAll("*").remove();

    const data: Point3D[] = wavetable.flatMap((frame, frameIndex) =>
      frame.map((value, sampleIndex) => ({
        x: sampleIndex,
        y: frameIndex,
        z: value
      }))
    );

    const xScale = d3.scaleLinear()
      .domain([0, samplesPerFrame - 1])
      .range([-width / 4, width / 4]);

    const yScale = d3.scaleLinear()
      .domain([0, waveTableFrames - 1])
      .range([-height / 4, height / 4]);

    const zScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, 100]);

    const colorScale = d3.scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(['blue', 'white', 'red']);

    const surfacePath = d3.area3D<Point3D>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .z(d => zScale(d.z))
      .defined(d => !isNaN(d.z));

    svg.attr('transform', `translate(${width / 2},${height / 2})`);

    svg.selectAll('.surface')
      .data(d3.group(data, d => d.y))
      .enter().append('path')
      .attr('class', 'surface')
      .attr('d', ([, points]) => surfacePath(points))
      .attr('fill', 'none')
      .attr('stroke', ([, points]) => colorScale(d3.mean(points, d => d.z) || 0))
      .attr('stroke-width', 0.5);
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
      <svg ref={surfacePlotRef} width={width} height={height}></svg>
    </div>
  );
};

export default WavetableVisualizer;
