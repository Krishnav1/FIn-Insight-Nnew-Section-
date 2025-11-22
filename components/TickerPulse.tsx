
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

interface TickerPulseProps {
  ticker: string;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (ticker: string) => void;
}

const TickerPulse: React.FC<TickerPulseProps> = ({ ticker, isWatchlisted = false, onToggleWatchlist }) => {
  // Generate consistent mock data based on the ticker string to avoid hydration mismatch or jumping numbers
  const { chartData, changePercent, isPositive } = useMemo(() => {
    let seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const points = [];
    let value = 100 + (random() * 100); 
    const startValue = value;

    for (let i = 0; i < 15; i++) {
      points.push(value);
      value = value * (1 + (random() - 0.5) * 0.05);
    }
    
    const endValue = points[points.length - 1];
    const change = ((endValue - startValue) / startValue) * 100;
    
    return {
      chartData: points,
      changePercent: change,
      isPositive: change >= 0
    };
  }, [ticker]);

  const width = 60;
  const height = 24;
  
  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min;
  
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * width;
    const paddedHeight = height - 4; 
    const y = (height - 2) - ((d - min) / (range || 1)) * paddedHeight;
    return `${x},${y}`;
  }).join(' ');

  const colorClass = isPositive 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-rose-600 dark:text-rose-400';
    
  const strokeColor = isPositive ? '#10b981' : '#f43f5e'; 

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 hover:shadow-sm transition-shadow group cursor-pointer">
       <a
        href={`https://www.google.com/finance/quote/${ticker}:NSE`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
        title={`View ${ticker} Chart`}
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {ticker}
          </span>
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${colorClass}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(changePercent).toFixed(2)}%
          </span>
        </div>

        <svg width={width} height={height} className="overflow-visible">
          <path
            d={`M ${points}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle 
              cx={width} 
              cy={(height - 2) - ((chartData[chartData.length - 1] - min) / (range || 1)) * (height - 4)} 
              r="1.5" 
              fill={strokeColor}
          />
        </svg>
      </a>
      
      {onToggleWatchlist && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatchlist(ticker); }}
          className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isWatchlisted ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          <Star size={14} fill={isWatchlisted ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
};

export default TickerPulse;
