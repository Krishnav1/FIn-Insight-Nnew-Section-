

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { MOCK_DETAILED_PORTFOLIO } from '../constants';
import { TrendingUp, TrendingDown, DollarSign, BrainCircuit, AlertTriangle, Wallet, PieChart as PieIcon, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { PortfolioItem } from '../types';

interface PortfolioPageProps {
  onAuditClick: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onAuditClick }) => {
  
  // Calculations
  const totalValue = useMemo(() => {
    return MOCK_DETAILED_PORTFOLIO.reduce((acc, item) => acc + ((item.currentPrice || 0) * item.shares), 0);
  }, []);

  const totalInvested = useMemo(() => {
    return MOCK_DETAILED_PORTFOLIO.reduce((acc, item) => acc + (item.avgPrice * item.shares), 0);
  }, []);

  const totalGain = totalValue - totalInvested;
  const totalGainPercent = (totalGain / totalInvested) * 100;

  const allocationData = useMemo(() => {
    const sectors: Record<string, number> = {};
    MOCK_DETAILED_PORTFOLIO.forEach(item => {
      const val = (item.currentPrice || 0) * item.shares;
      const sector = item.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + val;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in pb-20 sm:pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-theme-text mb-1">My Portfolio</h1>
                <p className="text-theme-muted text-xs sm:text-sm">Real-time valuation provided by CDSL/NSDL Link</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-theme-surface border border-theme-border text-theme-text rounded-xl hover:bg-theme-bg transition-all active:scale-95 font-medium text-sm shadow-sm w-full sm:w-auto">
                    <RefreshCw size={16} /> Sync
                </button>
                <button 
                    onClick={onAuditClick}
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-theme-accent text-white rounded-xl hover:bg-theme-accent/90 transition-all active:scale-95 font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 w-full sm:w-auto"
                >
                    <BrainCircuit size={18} /> AI Audit
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Net Worth */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Wallet size={100} />
                </div>
                <div className="relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">Net Worth</p>
                    <h2 className="text-3xl sm:text-4xl font-mono font-bold">₹{totalValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h2>
                    <div className="flex items-center gap-2 mt-4 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                        {totalGain >= 0 ? <TrendingUp size={16} className="text-emerald-300"/> : <TrendingDown size={16} className="text-rose-300"/>}
                        <span className={`font-bold ${totalGain >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                        </span>
                        <span className="text-white/60 text-xs">Overall Gain</span>
                    </div>
                </div>
            </div>

            {/* Day Change */}
             <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-sm flex flex-col justify-center hover:shadow-md transition-all hover:border-theme-accent/30 duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-theme-bg rounded-lg text-theme-muted border border-theme-border group-hover:bg-theme-accent/10 group-hover:text-theme-accent transition-colors">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-theme-muted font-medium">Day Change</span>
                </div>
                <h3 className="text-2xl font-bold text-theme-text mb-1">
                    +₹{(totalValue * 0.012).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                </h3>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                    <TrendingUp size={12} /> +1.2% <span className="text-theme-muted font-normal">Today</span>
                </span>
            </div>

            {/* AI Health Score */}
            <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-sm flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-all hover:border-theme-accent/30 duration-300">
                <div className="absolute right-4 top-4">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 flex items-center justify-center animate-pulse-glow">
                        <span className="text-xl font-bold text-emerald-500">A-</span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2 text-theme-muted font-medium">
                        <ShieldCheck size={20} className="text-emerald-500"/> Portfolio Health
                    </div>
                    <h3 className="text-2xl font-bold text-theme-text mb-1">Excellent</h3>
                    <p className="text-xs text-theme-muted max-w-[180px]">Low concentration risk. Good sector diversification.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Holdings Table */}
            <div className="lg:col-span-2 bg-theme-surface rounded-2xl border border-theme-border shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-4 sm:p-6 border-b border-theme-border flex justify-between items-center">
                    <h3 className="font-bold text-lg text-theme-text">Holdings</h3>
                    <span className="text-xs font-bold bg-theme-bg text-theme-muted px-2 py-1 rounded border border-theme-border">{MOCK_DETAILED_PORTFOLIO.length} Assets</span>
                </div>
                
                {/* Scrollable Container for Mobile */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="bg-theme-bg text-theme-muted font-medium border-b border-theme-border">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Instrument</th>
                                <th className="px-6 py-3 whitespace-nowrap">Sector</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Qty</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Price</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Gain/Loss</th>
                                <th className="px-6 py-3 whitespace-nowrap">AI Signal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                            {MOCK_DETAILED_PORTFOLIO.map((item, i) => {
                                const current = item.currentPrice || 0;
                                const gain = (current - item.avgPrice) / item.avgPrice * 100;
                                const isProfit = gain >= 0;
                                
                                // Mock AI Signal
                                let signal = { text: 'Hold', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
                                if (gain > 20) signal = { text: 'Trim?', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
                                if (gain < -10) signal = { text: 'Review', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
                                if (item.sector === 'Finance') signal = { text: 'Undervalued', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };

                                return (
                                    <tr key={i} className="hover:bg-theme-bg/80 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-theme-text group-hover:text-theme-accent transition-colors">{item.symbol}</div>
                                            <div className="text-xs text-theme-muted">{item.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-theme-text whitespace-nowrap">{item.sector}</td>
                                        <td className="px-6 py-4 text-right font-mono text-theme-text">{item.shares}</td>
                                        <td className="px-6 py-4 text-right font-mono text-theme-text">₹{current.toLocaleString()}</td>
                                        <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isProfit ? '+' : ''}{gain.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${signal.color}`}>
                                                {signal.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Allocation Chart & Ideas */}
            <div className="space-y-6">
                <div className="bg-theme-surface p-6 rounded-2xl border border-theme-border shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-bold text-lg text-theme-text mb-4 flex items-center gap-2">
                        <PieIcon size={18} /> Allocation
                    </h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                                />
                                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Future Feature Teasers */}
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Smart Features</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 cursor-pointer transition-colors group/item">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <ShieldCheck size={16} className="text-purple-300"/> Hidden Fees Scanner
                                </div>
                                <ArrowRight size={14} className="text-white/50 group-hover/item:translate-x-1 transition-transform" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 cursor-pointer transition-colors group/item">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <DollarSign size={16} className="text-emerald-300"/> Tax Harvesting AI
                                </div>
                                <ArrowRight size={14} className="text-white/50 group-hover/item:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PortfolioPage;
