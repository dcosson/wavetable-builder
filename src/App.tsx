import { useState } from 'react';
import WavetableVisualizer from './WavetableVisualizer'
import WavetableCreator from './WavetableCreator';
import type { WavetableWithMetadata } from './wavetableUtils';

function App() {
  const [wavetable, setWavetable] = useState<WavetableWithMetadata | undefined>(undefined);

  const wavetableChangedHandler = (wavetable: WavetableWithMetadata) => {
    setWavetable(wavetable)
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-top sm:py-12">
      <div className="relative sm:py-3 sm:w-4/5 sm:mx-auto">
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative p-6 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <h1 className="text-xl sm:text-4xl font-bold mb-2 sm:mb-8 text-center text-gray-800">Wavetable Builder</h1>
          <WavetableCreator wavetableChanged={wavetableChangedHandler} />
          <WavetableVisualizer wavetable={wavetable} />
        </div>
      </div>
    </div>
  )
}

export default App
