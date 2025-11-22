
import React, { useState } from 'react';
import { PortfolioHealthReport } from '../types';
import { TrendingUp, TrendingDown, Shield, Calendar, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface PortfolioWidgetProps {
  data: PortfolioHealthReport;
}

const PortfolioWidget: React.FC<PortfolioWidgetProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'pulse' | 'risk' | 'calendar'>('pulse');

  if (!data) return null;

  const { attribution, risk, earnings } = data;

  return (
    <div className="w-full max-w-2xl my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden animate-fade-in">
      
      {/* Header / Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button 
          onClick={() => setActiveTab('pulse')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'pulse' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <TrendingUp size={16} /> Daily Pulse
        </button>
        <button 
          onClick={() => setActiveTab('risk')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'risk' ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-t-2 border-purple-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Shield size={16} /> Risk Radar
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'calendar' ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 border-t-2 border-orange-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Calendar size={16} /> Earnings
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 min-h-[250px]">
        
        {/* TAB 1: DAILY PULSE (ATTRIBUTION) */}
        {activeTab === 'pulse' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Portfolio Sentiment</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-2xl font-black ${attribution.overallSentiment === 'Bullish' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {attribution.overallSentiment}
                        </span>
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                            {attribution.movementPercentageEstimate}
                        </span>
                    </div>
                </div>
                <div className="text-right max-w-[50%]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                        "{attribution.verdict}"
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Culprits */}
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-3 border border-rose-100 dark:border-rose-800/30">
                    <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-2 flex items-center gap-1"><TrendingDown size={12}/> Dragging Down</h4>
                    {attribution.culprits.slice(0, 2).map((c, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{c.ticker}</span>
                                <span className="text-[9px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-1.5 rounded-full">{c.impact}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{c.reason}</p>
                        </div>
                    ))}
                    {attribution.culprits.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                </div>

                {/* Saviors */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                    <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1"><TrendingUp size={12}/> Lifting Up</h4>
                    {attribution.saviors.slice(0, 2).map((s, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{s.ticker}</span>
                                <span className="text-[9px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-1.5 rounded-full">{s.impact}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{s.reason}</p>
                        </div>
                    ))}
                    {attribution.saviors.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                </div>
            </div>
          </div>
        )}

        {/* TAB 2: RISK RADAR */}
        {activeTab === 'risk' && (
            <div className="animate-fade-in flex flex-col items-center text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-[6px] mb-3 transition-colors ${
                     risk.riskLevel === 'High' ? 'border-red-500 text-red-500' : 
                     risk.riskLevel === 'Medium' ? 'border-amber-500 text-amber-500' : 
                     'border-emerald-500 text-emerald-500'
                }`}>
                    <span className="text-lg font-black">{risk.riskLevel}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Concentration Level</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                    Primary Factor: <span className="font-semibold text-gray-700 dark:text-gray-300">{risk.primaryRiskFactor}</span>
                </p>

                <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-left">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Identified Vulnerabilities</h5>
                    {risk.risks.map((r, i) => (
                        <div key={i} className="flex items-center justify-between mb-2 last:mb-0 text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{r.factor}</span>
                            <span className="font-mono font-bold text-gray-500">{r.percentageExposure}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 flex items-start gap-2 text-[11px] text-left text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle size={14} className="shrink-0 mt-0.5"/>
                    <p>Tip: {risk.diversificationSuggestion}</p>
                </div>
            </div>
        )}

        {/* TAB 3: EARNINGS CALENDAR */}
        {activeTab === 'calendar' && (
            <div className="animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Upcoming 30 Days</h3>
                {earnings.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No major earnings events projected soon.</p>
                ) : (
                    <div className="space-y-3">
                        {earnings.map((e, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors group cursor-default">
                                <div className="flex-shrink-0 w-12 text-center">
                                    <div className="text-[10px] text-gray-400 uppercase">Date</div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-white">{e.date.split(' ')[0]}</div>
                                    <div className="text-[10px] text-gray-500">{e.date.split(' ')[1] || ''}</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-gray-900 dark:text-white">{e.ticker}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                            e.expectation === 'Bullish' ? 'bg-emerald-100 text-emerald-700' :
                                            e.expectation === 'Bearish' ? 'bg-rose-100 text-rose-700' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {e.expectation}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{e.insight}</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4 flex items-center gap-2 justify-center">
                    <AlertTriangle size={12} className="text-amber-500"/>
                    <span className="text-[10px] text-gray-400">Dates are estimated based on historical cycles.</span>
                </div>
            </div>
        )}
        
      </div>
    </div>
  );
};

export default PortfolioWidget;
