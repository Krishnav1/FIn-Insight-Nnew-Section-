import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, Globe, ExternalLink, Clock, Zap } from 'lucide-react';
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
  const themeColor = isPos ? 'emerald' : 'rose';
  const ThemeIcon = isPos ? TrendingUp : TrendingDown;

  return (
    <>
        {/* Backdrop */}
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] transition-opacity"
            onClick={onClose}
        />
        
        {/* Drawer */}
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-theme-surface shadow-2xl z-[70] border-l border-theme-border animate-slide-left flex flex-col">
             
             {/* Premium Header */}
             <div className="relative p-6 overflow-hidden bg-theme-bg border-b border-theme-border">
                 {/* Background Gradient */}
                 <div className={`absolute top-0 right-0 w-64 h-64 bg-${themeColor}-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>

                 <div className="relative z-10 flex justify-between items-start mb-4">
                     <div className="flex flex-col">
                         <h2 className="text-3xl font-black text-theme-text tracking-tight">{data.symbol}</h2>
                         <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">{data.sector}</span>
                     </div>
                     <button 
                        onClick={onClose} 
                        className="p-2 bg-theme-surface hover:bg-theme-bg rounded-full text-theme-muted hover:text-theme-text transition-colors border border-theme-border"
                     >
                        <X size={18}/>
                     </button>
                 </div>

                 <div className="relative z-10 flex items-baseline gap-3">
                     <span className="text-4xl font-mono font-bold text-theme-text">
                        ₹{data.price.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                     </span>
                 </div>
                 <div className={`relative z-10 flex items-center gap-2 mt-1 font-bold text-sm ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                     <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isPos ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <ThemeIcon size={14} />
                        {Math.abs(data.changePercent).toFixed(2)}%
                     </span>
                     <span className="text-theme-muted text-xs font-normal">Today</span>
                 </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-theme-bg">
                 
                 {/* Chart Section */}
                 <div className="h-48 w-full bg-gradient-to-b from-theme-surface to-theme-bg border-b border-theme-border p-4 relative">
                      <div className="absolute top-4 right-4 flex gap-1">
                          {['1D', '1W', '1M'].map(t => (
                              <span key={t} className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${t === '1D' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:bg-theme-surface'}`}>{t}</span>
                          ))}
                      </div>
                      <div className="h-full w-full pt-6">
                        <DynamicChart data={{
                            type: 'area',
                            title: '',
                            labels: Array.from({length:20}, (_,i)=>`${9+Math.floor(i/2)}:${i%2===0?'00':'30'}`),
                            datasets: [{ label: 'Price', data: data.chartData }]
                        }} />
                      </div>
                 </div>

                 <div className="p-6 space-y-6">
                    {/* Key Stats Grid */}
                    <div>
                        <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity size={12} /> Key Fundamentals
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-theme-surface rounded-xl border border-theme-border hover:border-theme-accent/30 transition-colors">
                                <div className="text-theme-muted text-[10px] uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Market Cap</div>
                                <div className="font-bold text-theme-text font-mono">₹{data.marketCap}</div>
                            </div>
                            <div className="p-3 bg-theme-surface rounded-xl border border-theme-border hover:border-theme-accent/30 transition-colors">
                                <div className="text-theme-muted text-[10px] uppercase mb-1 flex items-center gap-1"><BarChart2 size={10}/> P/E Ratio</div>
                                <div className="font-bold text-theme-text font-mono">{data.peRatio}</div>
                            </div>
                            <div className="p-3 bg-theme-surface rounded-xl border border-theme-border hover:border-theme-accent/30 transition-colors">
                                <div className="text-theme-muted text-[10px] uppercase mb-1">52W High</div>
                                <div className="font-bold text-theme-text font-mono">₹{data.week52High.toFixed(0)}</div>
                            </div>
                            <div className="p-3 bg-theme-surface rounded-xl border border-theme-border hover:border-theme-accent/30 transition-colors">
                                <div className="text-theme-muted text-[10px] uppercase mb-1">52W Low</div>
                                <div className="font-bold text-theme-text font-mono">₹{data.week52Low.toFixed(0)}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Sentiment */}
                    <div className={`p-5 rounded-2xl border relative overflow-hidden ${
                        isPos ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                    }`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${isPos ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                    <Zap size={16} />
                                </div>
                                <h3 className={`text-sm font-bold ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    AI Verdict: {data.sentiment}
                                </h3>
                            </div>
                            <p className="text-xs text-theme-muted leading-relaxed">
                                FinGenie analyzed <strong>{data.newsCount} recent sources</strong>. Momentum indicators suggest {isPos ? 'strength' : 'weakness'} in the short term.
                            </p>
                        </div>
                    </div>

                    <a 
                        href={`https://www.google.com/finance/quote/${ticker}:NSE`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 flex items-center justify-center gap-2 bg-theme-text text-theme-bg hover:opacity-90 rounded-xl font-bold text-sm transition-all shadow-lg"
                    >
                        Detailed Analysis <ExternalLink size={14} />
                    </a>
                 </div>
             </div>
        </div>
    </>
  );
};

export default QuickPeekDrawer;