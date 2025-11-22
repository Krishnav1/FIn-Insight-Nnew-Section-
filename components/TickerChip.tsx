
import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerChipProps {
  ticker: string;
  onClick?: (ticker: string) => void;
}

const TickerChip: React.FC<TickerChipProps> = ({ ticker, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate pseudo-random sparkline data based on ticker string
  const sparklinePoints = React.useMemo(() => {
    const seed = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const points = [];
    let val = 100;
    for(let i=0; i<10; i++) {
      val = val + Math.sin(seed + i) * 5;
      points.push(val);
    }
    return points;
  }, [ticker]);

  const isPositive = sparklinePoints[sparklinePoints.length - 1] > sparklinePoints[0];
  const change = ((sparklinePoints[sparklinePoints.length - 1] - sparklinePoints[0]) / sparklinePoints[0] * 100).toFixed(1);

  // Simple SVG path for sparkline
  const width = 60;
  const height = 20;
  const min = Math.min(...sparklinePoints);
  const max = Math.max(...sparklinePoints);
  const range = max - min || 1;
  
  const pathD = sparklinePoints.map((p, i) => {
    const x = (i / (sparklinePoints.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  return (
    <span 
      className="relative inline-block align-middle mx-0.5 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onClick) onClick(ticker);
        }}
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold 
          transition-all duration-200 border
          ${isHovered 
            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'}
        `}
      >
        {ticker}
        {isHovered && (
            <span className={`text-[9px] ${isPositive ? 'text-emerald-200' : 'text-rose-200'}`}>
                {isPositive ? '+' : ''}{change}%
            </span>
        )}
      </button>

      {/* Hover Mini Dashboard (Living Ticker) */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-gray-900 text-white p-3 rounded-xl shadow-xl z-50 animate-fade-in pointer-events-none">
           <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold">{ticker}</span>
               <span className={`text-xs font-bold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {isPositive ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                   {change}%
               </span>
           </div>
           <div className="h-8 w-full">
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                  <path d={pathD} fill="none" stroke={isPositive ? '#34d399' : '#fb7185'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
           </div>
           <div className="mt-1 text-[9px] text-gray-400 text-center">Click for Quick Peek</div>
           {/* Arrow */}
           <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </span>
  );
};

export default TickerChip;
