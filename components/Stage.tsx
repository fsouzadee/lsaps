import React from 'react';

interface StageProps {
  x: number[];
  h: number[];
  n: number;
  highlightColor: string;
}

export const Stage: React.FC<StageProps> = ({ x, h, n }) => {
  // Config
  const stemWidth = 4;
  const stemHeadRadius = 5;
  const unitWidth = 40;
  const zeroX = 100; // Left padding
  
  // Calculate view bounds
  // h is fixed at [0, h.length-1]. 
  // x enters from left (negative k) as n starts small.
  const minK = -x.length - 2; 
  const maxK = h.length + x.length + 2;
  const viewBoxWidth = (maxK - minK) * unitWidth + 2 * zeroX;
  
  // Vertical Layout
  const topPadding = 40;
  const graphHeight = 120; 
  const gap = 40;
  
  const centerY_H = topPadding + 60; // Row 1: Fixed h[k]
  const centerY_X = centerY_H + graphHeight + gap; // Row 2: Moving x[n-k]
  const centerY_P = centerY_X + graphHeight + gap; // Row 3: Product
  
  const viewBoxHeight = centerY_P + 100;

  // Helper to map k to pixel x
  const getX = (k: number) => zeroX + (k - minK) * unitWidth;

  // Scale value to pixel height
  const scaleY = (val: number) => val * -30;

  // Data for X reversed and shifted (Moving Signal: x[n-k])
  const xVisuals = [];
  for (let k = minK; k <= maxK; k++) {
    const xIndex = n - k;
    if (xIndex >= 0 && xIndex < x.length) {
      xVisuals.push({ k, val: x[xIndex] });
    }
  }

  // Calculate Products for visualization: h[k] * x[n-k]
  const products: { k: number, val: number }[] = [];
  let currentSum = 0;
  for (let k = minK; k <= maxK; k++) {
      // Find h[k] (Fixed)
      const hVal = (k >= 0 && k < h.length) ? h[k] : 0;
      
      // Find x[n-k] (Moving)
      const xIndex = n - k;
      const xVal = (xIndex >= 0 && xIndex < x.length) ? x[xIndex] : 0;
      
      const p = hVal * xVal;
      
      if (p !== 0) {
        currentSum += p;
      }
      products.push({ k, val: p });
  }

  return (
    <div className="w-full overflow-x-auto border rounded-xl bg-white shadow-sm p-4">
      <svg 
        width="100%" 
        height={viewBoxHeight} 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="min-w-[800px]"
      >
        {/* --- GRID LINES & LABELS --- */}
        
        {/* Row 1: h[k] (Fixed) */}
        <text x={10} y={centerY_H - 50} className="font-bold text-sm fill-amber-600">Resposta ao Impulso: h[k]</text>
        <line x1={0} y1={centerY_H} x2={viewBoxWidth} y2={centerY_H} stroke="#e2e8f0" strokeWidth={2} />

        {/* Row 2: x[n-k] (Moving) */}
        <text x={10} y={centerY_X - 50} className="font-bold text-sm fill-blue-600">Entrada Deslocada: x[{n}-k]</text>
        <line x1={0} y1={centerY_X} x2={viewBoxWidth} y2={centerY_X} stroke="#e2e8f0" strokeWidth={2} />

        {/* Row 3: Product */}
        <text x={10} y={centerY_P - 50} className="font-bold text-sm fill-purple-600">Produto: w[{n}, k]</text>
        <text x={10} y={centerY_P - 35} className="text-[10px] fill-slate-400">h[k] &middot; x[{n}-k]</text>
        <line x1={0} y1={centerY_P} x2={viewBoxWidth} y2={centerY_P} stroke="#e2e8f0" strokeWidth={2} />
        
        {/* Axis Ticks */}
        {Array.from({ length: maxK - minK + 1 }).map((_, i) => {
            const k = minK + i;
            const px = getX(k);
            return (
                <g key={`tick-${k}`}>
                    <circle cx={px} cy={centerY_H} r={2} fill="#cbd5e1" />
                    <circle cx={px} cy={centerY_X} r={2} fill="#cbd5e1" />
                    <circle cx={px} cy={centerY_P} r={2} fill="#cbd5e1" />
                    <text x={px} y={centerY_P + 20} textAnchor="middle" className="text-[10px] fill-slate-400 select-none">{k}</text>
                </g>
            )
        })}

        {/* --- DATA --- */}

        {/* Draw h[k] (Fixed - Amber) */}
        {h.map((val, k) => {
           const px = getX(k);
           const py = centerY_H + scaleY(val);
           return (
             <g key={`h-${k}`} className="transition-all duration-300">
               <line x1={px} y1={centerY_H} x2={px} y2={py} stroke="#f59e0b" strokeWidth={stemWidth} />
               <circle cx={px} cy={py} r={stemHeadRadius} fill="#f59e0b" />
               <text x={px + 8} y={py} className="text-xs fill-amber-600 font-medium opacity-50">{val}</text>
             </g>
           );
        })}

        {/* Draw x[n-k] (Moving - Blue) */}
        {xVisuals.map(({ k, val }) => {
           const px = getX(k);
           const py = centerY_X + scaleY(val);
           
           // Check overlap with fixed h range (h is at [0, len(h)-1])
           const isOverlap = k >= 0 && k < h.length;

           return (
             <g key={`x-${k}`} className="transition-all duration-300 ease-out">
               <line x1={px} y1={centerY_X} x2={px} y2={py} stroke="#3b82f6" strokeWidth={stemWidth} />
               <circle cx={px} cy={py} r={stemHeadRadius} fill="#3b82f6" />
               <text x={px + 8} y={py} className="text-xs fill-slate-500 font-medium opacity-50">{val}</text>
               
               {/* Dashed line connecting fixed h to moving x to product */}
               {isOverlap && (
                   <line 
                    x1={px} y1={centerY_H + 10} 
                    x2={px} y2={centerY_P - 10} 
                    stroke="#9333ea" 
                    strokeWidth={1} 
                    strokeDasharray="4"
                    opacity={0.3} 
                   />
               )}
             </g>
           );
        })}

        {/* Draw Product Graph */}
        {products.map(({ k, val }) => {
             const px = getX(k);
             const py = centerY_P + scaleY(val);
             
             if (val === 0) return null;

             return (
                <g key={`prod-${k}`}>
                    <line x1={px} y1={centerY_P} x2={px} y2={py} stroke="#9333ea" strokeWidth={stemWidth} />
                    <circle cx={px} cy={py} r={stemHeadRadius} fill="#9333ea" />
                    <text x={px + 8} y={py} className="text-xs font-bold fill-purple-700">{parseFloat(val.toFixed(2))}</text>
                </g>
             );
        })}

      </svg>
      
      {/* Calculation visual breakdown */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Somatório para n = {n}</h3>
             <span className="text-xs text-slate-500">Perspectiva: h[k] fixo, x[n-k] deslizando</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span className="font-bold text-emerald-700">y[{n}]</span>
            <span>=</span>
            <span className="text-slate-500">&Sigma; w[{n}, k]</span>
            <span>=</span>
            {products.filter(p => p.val !== 0).length === 0 ? (
                <span className="text-slate-400 italic">0 (Sem sobreposição)</span>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    {products.filter(p => p.val !== 0).map((p, i) => (
                        <React.Fragment key={p.k}>
                            {i > 0 && <span>+</span>}
                            <div className="flex flex-col items-center bg-purple-50 border border-purple-100 px-2 py-1 rounded">
                                <span className="text-[10px] text-slate-400">k={p.k}</span>
                                <span className="text-purple-700 font-bold">{p.val.toFixed(2)}</span>
                            </div>
                        </React.Fragment>
                    ))}
                    <span>=</span>
                    <span className="font-bold text-emerald-600 text-lg">{currentSum.toFixed(2)}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};