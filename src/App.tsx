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
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:w-4/5 sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative p-6 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <h1 className="text-xl sm:text-4xl font-bold mb-2 sm:mb-8 text-center text-gray-800">Wavetable Visualizer</h1>
          <WavetableVisualizer keyframes={keyframes} />
        </div>
      </div>
    </div>
  )
}

export default App
