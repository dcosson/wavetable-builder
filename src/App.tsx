import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import WavetableVisualizer from './WavetableVisualizer'
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function App() {
  const [count, setCount] = useState<number>(0)
  const [data, setData] = useState<{ x: number, y: number }[]>([]);

  const visualizer = new WavetableVisualizer('wavetable-visualizer');
  visualizer.generateWavetable([
    { frame: 0, shape: 'sine' },
    { frame: 21, shape: 'square' },
    { frame: 42, shape: 'sawtooth' },
    { frame: 63, shape: 'triangle' }
  ]);

  useEffect(() => {
    const newData = [];
    for (let i = 0; i < 10; i++) {
      const x = i;
      const y = Math.sin(2 * Math.PI * i);
      newData.push({ x, y });
    }
    setData(newData);
    visualizer.render();
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p> Hello2 </p>
      <div id="wavetable-visualizer" />
      <p> again </p>
    </>
  )
}

export default App
