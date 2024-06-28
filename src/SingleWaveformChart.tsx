import React, { useRef, useEffect } from 'react';
import type { WaveformData } from './wavetableUtils';
import * as d3 from 'd3';

interface SingleWaveformChartProps {
  width?: number;
  height?: number;
  data: WaveformData,
  lineColor?: string,
  hideChart?: boolean,
}

const SingleWaveformChart: React.FC<SingleWaveformChartProps> = ({
  width = 800,
  height = 400,
  data,
  lineColor = 'grey',
  hideChart = false,
}) => {
  const singleWaveformRef = useRef<SVGSVGElement>(null);
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  useEffect(() => {
    if (!data) {
      return
    }
    renderSingleWaveform();
  }, [hideChart, data]);

  const renderSingleWaveform = () => {
    if (!singleWaveformRef.current) {
      return;
    }
    const svg = d3.select(singleWaveformRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(_ => '').tickSize(0));
  };

  return (
    <>
      {!hideChart &&
        <svg ref={singleWaveformRef} viewBox={`0 0 ${width} ${height}`}></svg>}
    </>
  );
};

export default SingleWaveformChart;
