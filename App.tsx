import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, BrainCircuit, Sparkles } from 'lucide-react';
import { SignalControls } from './components/SignalControls';
import { Stage } from './components/Stage';
import { convolve } from './utils/math';
import { explainStep } from './services/geminiService';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';

const App: React.FC = () => {
  // State
  const [x, setX] = useState<number[]>([0.1, 0.5, 1.0, 1.5]);
  const [h, setH] = useState<number[]>([1, 1, 1]);
  const [n, setN] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState(false);

  // Derived state
  const yFull = useMemo(() => convolve(x, h), [x, h]);
  const minN = 0; // Keeping simple causal start
  const maxN = x.length + h.length - 1; // Length of convolution result

  const timerRef = useRef<number | null>(null);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setN(prev => {
          if (prev >= maxN + 1) { // Little buffer at end
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, maxN, speed]);

  // Handlers
  const handleReset = () => {
    setIsPlaying(false);
    setN(0);
    setAiExplanation("");
  };

  const handleStep = (delta: number) => {
    setN(prev => Math.min(Math.max(prev + delta, -2), maxN + 2)); // Allow scrolling a bit out of bounds
  };

  const handleExplain = async () => {
      setIsExplaining(true);
      const currentY = n >= 0 && n < yFull.length ? yFull[n] : 0;
      const text = await explainStep(x, h, n, currentY);
      setAiExplanation(text);
      setIsExplaining(false);
  };

  // Chart Data preparation
  const chartData = yFull.map((val, idx) => ({
      n: idx,
      y: val,
      current: idx === n
  }));

  // Pad chart data for visual consistency if n goes beyond
  const displayData = chartData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans">
      <header className="mb-8 text-center max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-2xl">y[n]</span>
            =
            <span className="text-blue-600">x[n]</span>
            &lowast;
            <span className="text-amber-600">h[n]</span>
        </h1>
        <p className="text-slate-600">
          Demonstração interativa da soma de convolução discreta.
          Ajuste os sinais de entrada e resposta ao impulso abaixo.
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignalControls 
            label="Sinal de Entrada x[n]" 
            value={x} 
            onChange={(val) => { setX(val); handleReset(); }} 
            colorClass="border-blue-200"
          />
          <SignalControls 
            label="Resposta ao Impulso h[n]" 
            value={h} 
            onChange={(val) => { setH(val); handleReset(); }} 
            colorClass="border-amber-200"
          />
        </div>

        {/* Playback Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between sticky top-4 z-50">
            <div className="flex items-center gap-2">
                <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Reiniciar">
                    <RotateCcw size={20} />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <button onClick={() => handleStep(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <SkipBack size={20} />
                </button>
                <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className={`p-3 rounded-full text-white shadow-md transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1"/>}
                </button>
                <button onClick={() => handleStep(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <SkipForward size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-center md:justify-start min-w-[200px]">
                 <div className="flex flex-col w-full max-w-[200px]">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Velocidade</label>
                    <input 
                        type="range" 
                        min="200" 
                        max="2000" 
                        step="100" 
                        value={2200 - speed} 
                        onChange={(e) => setSpeed(2200 - parseInt(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
                 <div className="flex flex-col border-l pl-4 border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Passo Atual (n)</span>
                    <span className="font-mono text-xl font-bold text-slate-800">{n}</span>
                 </div>
            </div>

            <div>
                <button 
                    onClick={handleExplain}
                    disabled={isExplaining}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                    <BrainCircuit size={18} />
                    {isExplaining ? "Analisando..." : "Explicar Passo"}
                </button>
            </div>
        </div>
        
        {/* AI Explanation Box */}
        {aiExplanation && (
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                <h4 className="font-bold text-purple-800 text-sm mb-1 flex items-center gap-2">
                    <Sparkles size={14}/> Explicação da IA
                </h4>
                <p className="text-purple-900 text-sm leading-relaxed">{aiExplanation}</p>
            </div>
        )}

        {/* Animation Stage */}
        <section>
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Processo de Convolução</h2>
             <Stage x={x} h={h} n={n} highlightColor="#f59e0b" />
        </section>

        {/* Result Chart */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-end mb-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sinal de Saída y[n]</h2>
                <div className="text-right">
                    <span className="text-xs text-slate-400 block">Valor Atual</span>
                    <span className="text-2xl font-bold text-emerald-600">
                        {n >= 0 && n < yFull.length ? yFull[n].toFixed(2) : '--'}
                    </span>
                </div>
             </div>
             
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="n" 
                            tick={{fontSize: 12, fill: '#64748b'}} 
                            axisLine={{stroke: '#cbd5e1'}}
                            tickLine={false}
                        />
                        <YAxis 
                             tick={{fontSize: 12, fill: '#64748b'}} 
                             axisLine={false}
                             tickLine={false}
                        />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" />
                        <Bar dataKey="y" radius={[4, 4, 0, 0]} animationDuration={300}>
                            {displayData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === n ? '#10b981' : index < n ? '#34d399' : '#e2e8f0'} 
                                    stroke={index === n ? '#059669' : 'none'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </section>

      </main>
    </div>
  );
};

export default App;
