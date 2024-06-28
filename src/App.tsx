import './App.css'
import WavetableVisualizer from './WavetableVisualizer'
import { WaveShapeKeyframe } from './wavetableUtils'

function App() {
  const keyframes: WaveShapeKeyframe[] = [
    { frame: 0, shape: 'sine' },
    { frame: 21, shape: 'square' },
    { frame: 42, shape: 'sawtooth' },
    { frame: 63, shape: 'triangle' }
  ];

  return (
    <>
      <h1>Wavetable Visualizer</h1>
      <WavetableVisualizer keyframes={keyframes} />
    </>
  )
}

export default App
