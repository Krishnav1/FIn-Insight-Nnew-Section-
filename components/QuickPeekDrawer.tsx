
import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, Globe, ExternalLink } from 'lucide-react';
import { QuickPeekData } from '../types';
import DynamicChart from './DynamicChart';

interface QuickPeekDrawerProps {
  ticker: string | null;
  onClose: () => void;
}

const QuickPeekDrawer: React.FC<QuickPeekDrawerProps> = ({ ticker, onClose }) => {
  
  // Mock Data Generation
  const data: QuickPeekData | null = useMemo(() => {
      if (!ticker) return null;
      
      // Deterministic random based on ticker
      const seed = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const price = 1000 + (seed % 2000);
      const change = (seed % 500) / 100 - 2.5;
      const pe = 15 + (seed % 30);
      
      return {
          symbol: ticker,
          price: price,
          change: parseFloat(price.toFixed(2)) * (change/100),
          changePercent: change,
          peRatio: parseFloat(pe.toFixed(1)),
          marketCap: `${(seed % 100) + 10}T`,
          sector: (seed % 2 === 0) ? 'Technology' : 'Finance',
          week52High: price * 1.2,
          week52Low: price * 0.8,
          chartData: Array.from({length: 20}, (_, i) => price * (1 + Math.sin(i + seed)*0.05)),
          sentiment: change > 0 ? 'Bullish' : 'Bearish',
          newsCount: 12
      };
  }, [ticker]);

  if (!ticker || !data) return null;

  const isPos = data.changePercent >= 0;

  return (
    <>
        {/* Backdrop */}
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[60]"
            onClick={onClose}
        />
        
        {/* Drawer */}
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-[70] border-l border-gray-200 dark:border-slate-700 animate-slide-left flex flex-col">
             {/* Header */}
             <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                 <div className="flex justify-between items-start mb-2">
                     <div>
                         <h2 className="text-2xl font-black text-gray-900 dark:text-white">{data.symbol}</h2>
                         <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{data.sector}</span>
                     </div>
                     <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full text-gray-400"><X size={20}/></button>
                 </div>
                 <div className="flex items-end gap-3">
                     <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{data.price.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                     </span>
                     <span className={`text-sm font-bold mb-1.5 flex items-center ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {isPos ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                         {Math.abs(data.changePercent).toFixed(2)}%
                     </span>
                 </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                 
                 {/* Mini Chart */}
                 <div className="h-32 mb-6 -mx-2">
                      <DynamicChart data={{
                          type: 'area',
                          title: 'Intraday',
                          labels: Array.from({length:20}, (_,i)=>`${9+Math.floor(i/2)}:${i%2===0?'00':'30'}`),
                          datasets: [{ label: 'Price', data: data.chartData }]
                      }} />
                 </div>

                 {/* Key Stats Grid */}
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fundamentals</h3>
                 <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                         <div className="text-gray-400 text-[10px] uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Market Cap</div>
                         <div className="font-bold text-gray-800 dark:text-gray-200">₹{data.marketCap}</div>
                     </div>
                     <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                         <div className="text-gray-400 text-[10px] uppercase mb-1 flex items-center gap-1"><BarChart2 size={10}/> P/E Ratio</div>
                         <div className="font-bold text-gray-800 dark:text-gray-200">{data.peRatio}</div>
                     </div>
                     <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                         <div className="text-gray-400 text-[10px] uppercase mb-1">52W High</div>
                         <div className="font-bold text-gray-800 dark:text-gray-200">₹{data.week52High.toFixed(0)}</div>
                     </div>
                     <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                         <div className="text-gray-400 text-[10px] uppercase mb-1">52W Low</div>
                         <div className="font-bold text-gray-800 dark:text-gray-200">₹{data.week52Low.toFixed(0)}</div>
                     </div>
                 </div>

                 {/* AI Sentiment */}
                 <div className={`p-4 rounded-xl mb-6 border ${
                     isPos ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'
                 }`}>
                     <div className="flex items-center gap-2 mb-1">
                         <Activity size={16} className={isPos ? 'text-emerald-600' : 'text-rose-600'} />
                         <h3 className={`text-sm font-bold ${isPos ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                             AI Verdict: {data.sentiment}
                         </h3>
                     </div>
                     <p className="text-xs text-gray-600 dark:text-gray-400">
                         Based on analysis of {data.newsCount} recent news articles and market momentum.
                     </p>
                 </div>

                 <a 
                    href={`https://www.google.com/finance/quote/${ticker}:NSE`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all"
                 >
                     Open in Google Finance <ExternalLink size={14} />
                 </a>

             </div>
        </div>
    </>
  );
};

export default QuickPeekDrawer;
