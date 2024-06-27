import * as d3 from 'd3';

type WaveformData = number[];
type Wavetable = WaveformData[];
type Point3D = { x: number; y: number; z: number };

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type WaveShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface WaveShapeKeyframe {
  frame: number;
  shape: WaveShape;
}

class WavetableVisualizer {
  private container: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private singleWaveformSvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private surfacePlotSvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private width: number;
  private height: number;
  private margin: Margin;
  private waveTableFrames: number;
  private samplesPerFrame: number;
  private wavetable: Wavetable;

  constructor(containerId: string, waveTableFrames: number = 64, samplesPerFrame: number = 256) {
    this.container = d3.select(`#${containerId}`);
    this.width = 800;
    this.height = 400;
    this.margin = { top: 20, right: 20, bottom: 30, left: 40 };

    this.singleWaveformSvg = this.container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.surfacePlotSvg = this.container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    this.waveTableFrames = waveTableFrames;
    this.samplesPerFrame = samplesPerFrame;
    this.wavetable = [];
  }

  private generateWaveform(shape: WaveShape, samplesPerFrame: number): WaveformData {
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
  }

  private interpolateWaveforms(waveform1: WaveformData, waveform2: WaveformData, t: number): WaveformData {
    return waveform1.map((v, i) => v * (1 - t) + waveform2[i] * t);
  }

  public generateWavetable(keyframes: WaveShapeKeyframe[]): void {
    if (keyframes.length < 2) {
      throw new Error("At least two keyframes are required");
    }

    keyframes.sort((a, b) => a.frame - b.frame);

    if (keyframes[0].frame !== 0 || keyframes[keyframes.length - 1].frame !== this.waveTableFrames - 1) {
      throw new Error("Keyframes must include frame 0 and the last frame");
    }

    this.wavetable = [];

    for (let i = 0; i < keyframes.length - 1; i++) {
      const startKeyframe = keyframes[i];
      const endKeyframe = keyframes[i + 1];
      const startWaveform = this.generateWaveform(startKeyframe.shape, this.samplesPerFrame);
      const endWaveform = this.generateWaveform(endKeyframe.shape, this.samplesPerFrame);

      for (let frame = startKeyframe.frame; frame <= endKeyframe.frame; frame++) {
        const t = (frame - startKeyframe.frame) / (endKeyframe.frame - startKeyframe.frame);
        this.wavetable[frame] = this.interpolateWaveforms(startWaveform, endWaveform, t);
      }
    }
  }

  public renderSingleWaveform(frameIndex: number = 0): void {
    const xScale = d3.scaleLinear()
      .domain([0, this.samplesPerFrame - 1])
      .range([0, this.width - this.margin.left - this.margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([this.height - this.margin.top - this.margin.bottom, 0]);

    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d));

    this.singleWaveformSvg.selectAll('*').remove();

    this.singleWaveformSvg.append('path')
      .datum(this.wavetable[frameIndex])
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    this.singleWaveformSvg.append('g')
      .attr('transform', `translate(0,${this.height - this.margin.top - this.margin.bottom})`)
      .call(d3.axisBottom(xScale));

    this.singleWaveformSvg.append('g')
      .call(d3.axisLeft(yScale));
  }

  public renderSurfacePlot(): void {
    const data: Point3D[] = this.wavetable.flatMap((frame, frameIndex) =>
      frame.map((value, sampleIndex) => ({
        x: sampleIndex,
        y: frameIndex,
        z: value
      }))
    );

    const xScale = d3.scaleLinear()
      .domain([0, this.samplesPerFrame - 1])
      .range([-this.width / 4, this.width / 4]);

    const yScale = d3.scaleLinear()
      .domain([0, this.waveTableFrames - 1])
      .range([-this.height / 4, this.height / 4]);

    const zScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, 100]);

    const colorScale = d3.scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(['blue', 'white', 'red']);

    this.surfacePlotSvg.selectAll('*').remove();

    const surfacePath = d3.area3D<Point3D>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .z(d => zScale(d.z))
      .defined(d => !isNaN(d.z));

    this.surfacePlotSvg.selectAll('.surface')
      .data(d3.group(data, d => d.y))
      .enter().append('path')
      .attr('class', 'surface')
      .attr('d', ([, points]) => surfacePath(points))
      .attr('fill', 'none')
      .attr('stroke', ([, points]) => colorScale(d3.mean(points, d => d.z) || 0))
      .attr('stroke-width', 0.5);
  }

  public render(): void {
    this.renderSingleWaveform();
    // this.renderSurfacePlot();
  }
}

export default WavetableVisualizer


// Import D3.js
// import * as d3 from 'd3';
//
// // Create the main visualization class
// class WavetableSynthVisualizer {
//     constructor(containerId) {
//         this.container = d3.select(`#${containerId}`);
//         this.width = 800;
//         this.height = 400;
//         this.margin = {top: 20, right: 20, bottom: 30, left: 40};
//
//         this.singleWaveformSvg = this.container.append('svg')
//             .attr('width', this.width)
//             .attr('height', this.height)
//             .append('g')
//             .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
//
//         this.surfacePlotSvg = this.container.append('svg')
//             .attr('width', this.width)
//             .attr('height', this.height)
//             .append('g')
//             .attr('transform', `translate(${this.width / 2},${this.height / 2})`);
//
//         this.waveTableFrames = 64;
//         this.samplesPerFrame = 256;
//         this.generateWavetable();
//     }
//
//     generateWavetable() {
//         this.wavetable = Array(this.waveTableFrames).fill().map(() => 
//             Array(this.samplesPerFrame).fill().map((_, i) => 
//                 Math.sin(2 * Math.PI * i / this.samplesPerFrame)
//             )
//         );
//     }
//
//     renderSingleWaveform(frameIndex = 0) {
//         const xScale = d3.scaleLinear()
//             .domain([0, this.samplesPerFrame - 1])
//             .range([0, this.width - this.margin.left - this.margin.right]);
//
//         const yScale = d3.scaleLinear()
//             .domain([-1, 1])
//             .range([this.height - this.margin.top - this.margin.bottom, 0]);
//
//         const line = d3.line()
//             .x((d, i) => xScale(i))
//             .y(d => yScale(d));
//
//         this.singleWaveformSvg.selectAll('*').remove();
//
//         this.singleWaveformSvg.append('path')
//             .datum(this.wavetable[frameIndex])
//             .attr('fill', 'none')
//             .attr('stroke', 'steelblue')
//             .attr('stroke-width', 1.5)
//             .attr('d', line);
//
//         this.singleWaveformSvg.append('g')
//             .attr('transform', `translate(0,${this.height - this.margin.top - this.margin.bottom})`)
//             .call(d3.axisBottom(xScale));
//
//         this.singleWaveformSvg.append('g')
//             .call(d3.axisLeft(yScale));
//     }
//
//     renderSurfacePlot() {
//         const data = this.wavetable.flatMap((frame, frameIndex) => 
//             frame.map((value, sampleIndex) => ({
//                 x: sampleIndex,
//                 y: frameIndex,
//                 z: value
//             }))
//         );
//
//         const xScale = d3.scaleLinear()
//             .domain([0, this.samplesPerFrame - 1])
//             .range([-this.width / 4, this.width / 4]);
//
//         const yScale = d3.scaleLinear()
//             .domain([0, this.waveTableFrames - 1])
//             .range([-this.height / 4, this.height / 4]);
//
//         const zScale = d3.scaleLinear()
//             .domain([-1, 1])
//             .range([0, 100]);
//
//         const colorScale = d3.scaleLinear()
//             .domain([-1, 0, 1])
//             .range(['blue', 'white', 'red']);
//
//         this.surfacePlotSvg.selectAll('*').remove();
//
//         const surfacePath = d3.area3D()
//             .x(d => xScale(d.x))
//             .y(d => yScale(d.y))
//             .z(d => zScale(d.z))
//             .defined(d => !isNaN(d.z));
//
//         this.surfacePlotSvg.selectAll('.surface')
//             .data(d3.group(data, d => d.y))
//             .enter().append('path')
//             .attr('class', 'surface')
//             .attr('d', ([, points]) => surfacePath(points))
//             .attr('fill', 'none')
//             .attr('stroke', ([, points]) => colorScale(d3.mean(points, d => d.z)))
//             .attr('stroke-width', 0.5);
//     }
//
//     render() {
//         this.renderSingleWaveform();
//         this.renderSurfacePlot();
//     }
// }
//
// // Usage
// const visualizer = new WavetableSynthVisualizer('visualization-container');
// visualizer.render();
