import React, { useRef, useEffect } from 'react';
import type { Wavetable } from './wavetableUtils';
import * as d3 from 'd3';

interface TableWaveformChartProps {
  width?: number;
  height?: number;
  wavetable: Wavetable;
  selectedFrame: number;
  colorScale: d3.ScaleLinear<string, string>;
  nonKeyframeColor: string,
  keyframeIndexes: Set<number>;
  hideChart?: boolean,
}

const TableWaveformChart: React.FC<TableWaveformChartProps> = ({
  width = 800,
  height = 400,
  wavetable,
  selectedFrame,
  colorScale,
  nonKeyframeColor = '#dddddd',
  keyframeIndexes,
  hideChart,
}) => {
  const surfacePlotRef = useRef<SVGSVGElement>(null);

  const minLineWidth = 1;
  const maxLineWidth = 3;

  const waveTableFrames = wavetable.length;
  const samplesPerFrame = wavetable.length > 0 && wavetable[0].length || 0;

  useEffect(() => {
    if (wavetable.length == 0) {
      return
    }
    renderSurfacePlot(selectedFrame);
  }, [wavetable, selectedFrame, colorScale, nonKeyframeColor, keyframeIndexes, hideChart]);


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
      if (keyframeIndexes.has(frameIndex)) {
        return colorScale(frameIndex / waveTableFrames);
      } else {
        return nonKeyframeColor;
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
    // Make the selected frame more prominent
    const updateFrameIndicator = () => {
      paths[selectedFrame]
        .attr('stroke-width', maxLineWidth)
        .attr('stroke', colorScale(selectedFrame / waveTableFrames));
    };

    updateFrameIndicator();
  };

  return (
    <>
      {!hideChart &&
        <svg ref={surfacePlotRef} width={'100%'} height={'100%'} viewBox={`0 ${-1 * maxLineWidth} ${width} ${height + 2 * maxLineWidth}`}></svg>}
    </>
  );
};

export default TableWaveformChart;
