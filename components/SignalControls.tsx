import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { generateSignal } from '../services/geminiService';

interface SignalControlsProps {
  label: string;
  value: number[];
  onChange: (val: number[]) => void;
  colorClass: string;
}

export const SignalControls: React.FC<SignalControlsProps> = ({ label, value, onChange, colorClass }) => {
  const [inputValue, setInputValue] = useState(value.join(', '));
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showAi, setShowAi] = useState(false);

  const handleBlur = () => {
    const parts = inputValue.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (parts.length > 0) {
      onChange(parts);
    } else {
      setInputValue(value.join(', '));
    }
  };

  const handleAiGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    const signal = await generateSignal(prompt);
    onChange(signal);
    setInputValue(signal.join(', '));
    setLoading(false);
    setShowAi(false);
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClass} bg-white shadow-sm`}>
      <div className="flex justify-between items-center mb-2">
        <label className="font-bold text-lg">{label}</label>
        <button
          onClick={() => setShowAi(!showAi)}
          className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          <Sparkles size={14} />
          {showAi ? 'Cancelar IA' : 'Gerar com IA'}
        </button>
      </div>

      {showAi && (
        <div className="mb-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Ex: exponencial decrescente, pulso retangular..."
                    className="flex-1 text-sm border border-slate-300 rounded px-2 py-1"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <button 
                    disabled={loading}
                    onClick={handleAiGenerate}
                    className="bg-purple-600 text-white text-xs px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="animate-spin" size={14}/> : 'Gerar'}
                </button>
            </div>
        </div>
      )}

      <div className="relative">
        <span className="absolute left-3 top-2.5 font-mono text-slate-400 text-sm">[</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          className="w-full font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg py-2 px-6 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="absolute right-3 top-2.5 font-mono text-slate-400 text-sm">]</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Comprimento: {value.length} amostras
      </div>
    </div>
  );
};
