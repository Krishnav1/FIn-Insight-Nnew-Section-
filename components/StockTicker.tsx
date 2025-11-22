
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { USER_PORTFOLIO } from '../constants';

// Indices configuration with static base data
const INDICES = [
  { symbol: 'NIFTY 50', price: 22450.30, change: 0.85 },
  { symbol: 'SENSEX', price: 73890.15, change: 0.72 },
  { symbol: 'BANKNIFTY', price: 47800.50, change: -0.24 },
  { symbol: 'NASDAQ', price: 16274.90, change: 1.14 },
  { symbol: 'GOLD', price: 65500.00, change: 0.45 },
  { symbol: 'CRUDE OIL', price: 6450.00, change: -1.20 },
  { symbol: 'BITCOIN', price: 5842000.00, change: 2.45 },
];

const StockTicker: React.FC = () => {
  // Generate display items once to keep them stable during scrolling
  const displayItems = useMemo(() => {
      // Combine Indices and Portfolio Items (Mocking current price/change for portfolio for display)
      const combinedItems = [
        ...INDICES,
        ...USER_PORTFOLIO.map(item => {
            // Mocking a random daily change for portfolio items to make it look alive
            // Deterministic random based on symbol char codes so it doesn't jitter on re-renders
            const seed = item.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const randomChange = ((seed % 300) / 100) - 1.5; // -1.5% to +1.5%
            
            return {
                symbol: item.symbol,
                price: item.avgPrice * (1 + (Math.abs(randomChange) + 10)/100), // Assume ~10% gain roughly
                change: randomChange
            };
        })
      ];
      
      // Duplicate list to ensure seamless scrolling loop
      // The animation moves -50%, so we need 2 copies.
      return [...combinedItems, ...combinedItems];
  }, []);

  return (
    <div className="w-full bg-gray-900 text-white border-b border-gray-800 overflow-hidden h-9 flex items-center relative z-20 shadow-sm">
       {/* Scrolling Container */}
       <div className="flex items-center whitespace-nowrap animate-marquee hover:pause will-change-transform">
          {displayItems.map((item, index) => (
            <div key={`${item.symbol}-${index}`} className="inline-flex items-center gap-2 px-6 border-r border-gray-800/50">
                <span className="font-bold text-xs text-gray-400">{item.symbol}</span>
                <span className="text-xs font-mono font-medium text-gray-200">
                    {item.symbol === 'BITCOIN' ? '₹' : ''}
                    {item.price.toLocaleString('en-IN', { style: item.symbol !== 'BITCOIN' ? 'currency' : 'decimal', currency: 'INR', maximumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(item.change).toFixed(2)}%
                </span>
            </div>
          ))}
       </div>
       
       {/* Gradient Fades for edges to smooth entrance/exit */}
       <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
       <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default StockTicker;
