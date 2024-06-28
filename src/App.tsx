import WavetableVisualizer from './WavetableVisualizer'
import WavetableCreator from './WavetableCreator';
import { generateWavetable, generateWaveform } from './wavetableUtils'

function App() {
  const wavetable = generateWavetable(
    [
      { frame: 0, data: generateWaveform('sine', 256) },
      { frame: 21, data: generateWaveform('square', 256) },
      { frame: 42, data: generateWaveform('sawtooth', 256) },
      { frame: 63, data: generateWaveform('triangle', 256) },
    ],
    64,
    256);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:w-4/5 sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative p-6 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <h1 className="text-xl sm:text-4xl font-bold mb-2 sm:mb-8 text-center text-gray-800">Wavetable Visualizer</h1>
          <WavetableCreator numberFrames={64} samplesPerFrame={256} />
          <WavetableVisualizer wavetable={wavetable} />
        </div>
      </div>
    </div>
  )
}

export default App
