
import React, { useState, useEffect } from 'react';
import { X, TrendingDown, TrendingUp, AlertTriangle, Shield, Activity, Zap, ChevronRight, Search, FileText, Loader2 } from 'lucide-react';
import { PortfolioItem, Article, PortfolioAttributionResult, ConcentrationRiskResult, RippleEffectResult, ForensicAnalysisResult } from '../types';
import { analyzePortfolioAttribution, analyzeConcentrationRisk, analyzeRippleEffect, analyzeForensicDocument } from '../services/geminiService';

interface PortfolioAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioItem[];
  articles: Article[];
}

type Tab = 'attribution' | 'risk' | 'ripple' | 'forensic';

const SAMPLE_FORENSIC_TEXT = `
NOTE 14: RELATED PARTY TRANSACTIONS
The Company entered into a licensing agreement with Entity X, a company fully owned by the CEO. 
Under this agreement, we paid $50M upfront for intellectual property rights that have not yet been commercialized. 
Additionally, we changed our revenue recognition policy this quarter to recognize software license revenue immediately upon contract signing, rather than over the service period. 
This change resulted in a one-time boost to Net Income of $120M. 
Operating Cash Flow remained negative due to significant increase in accounts receivable.
`;

const PortfolioAnalysisModal: React.FC<PortfolioAnalysisModalProps> = ({ isOpen, onClose, portfolio, articles }) => {
  const [activeTab, setActiveTab] = useState<Tab>('attribution');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [attributionData, setAttributionData] = useState<PortfolioAttributionResult | null>(null);
  const [riskData, setRiskData] = useState<ConcentrationRiskResult | null>(null);
  const [rippleData, setRippleData] = useState<RippleEffectResult | null>(null);
  const [forensicData, setForensicData] = useState<ForensicAnalysisResult | null>(null);

  // Input States
  const [rippleEvent, setRippleEvent] = useState("Crude Oil rises to $100");
  const [forensicText, setForensicText] = useState("");

  useEffect(() => {
    if (isOpen && activeTab === 'attribution' && !attributionData) {
      loadAttribution();
    }
    if (isOpen && activeTab === 'risk' && !riskData) {
      loadRisk();
    }
  }, [isOpen, activeTab]);

  const loadAttribution = async () => {
    setLoading(true);
    const data = await analyzePortfolioAttribution(portfolio, articles);
    setAttributionData(data);
    setLoading(false);
  };

  const loadRisk = async () => {
    setLoading(true);
    const data = await analyzeConcentrationRisk(portfolio);
    setRiskData(data);
    setLoading(false);
  };

  const handleRippleAnalyze = async () => {
    if (!rippleEvent) return;
    setLoading(true);
    const data = await analyzeRippleEffect(rippleEvent, portfolio);
    setRippleData(data);
    setLoading(false);
  };

  const handleForensicAnalyze = async () => {
    if (!forensicText) return;
    setLoading(true);
    const data = await analyzeForensicDocument(forensicText);
    setForensicData(data);
    setLoading(false);
  };

  const handleLoadSample = () => {
      setForensicText(SAMPLE_FORENSIC_TEXT.trim());
  };

  if (!isOpen) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: Tab; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-up">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="text-blue-600" /> Portfolio Intelligence
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">FinGenie Deep Dive Engine</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <TabButton id="attribution" icon={TrendingDown} label="Attribution Autopsy" />
          <TabButton id="risk" icon={Shield} label="Risk Radar" />
          <TabButton id="ripple" icon={Zap} label="Ripple Simulator" />
          <TabButton id="forensic" icon={Search} label="Forensic Accountant" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {loading && !attributionData && !riskData && !rippleData && !forensicData && (
             <div className="flex flex-col items-center justify-center h-64">
                <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">FinGenie is crunching the numbers...</p>
             </div>
          )}

          {/* 1. Attribution Analysis */}
          {activeTab === 'attribution' && attributionData && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Daily Autopsy</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          attributionData.overallSentiment === 'Bearish' ? 'bg-red-100 text-red-700' :
                          attributionData.overallSentiment === 'Bullish' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                          {attributionData.overallSentiment} ({attributionData.movementPercentageEstimate})
                      </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg font-medium leading-relaxed">
                      "{attributionData.verdict}"
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                          <h4 className="text-red-700 dark:text-red-400 font-bold mb-3 flex items-center gap-2"><TrendingDown size={18}/> The Culprits</h4>
                          <ul className="space-y-3">
                              {attributionData.culprits.map((c, i) => (
                                  <li key={i} className="bg-white dark:bg-gray-800 p-3 rounded border border-red-100 dark:border-red-900 shadow-sm">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="font-bold text-gray-900 dark:text-white">{c.ticker}</span>
                                          <span className="text-[10px] uppercase bg-red-100 dark:bg-red-900 text-red-600 px-1.5 rounded">{c.impact} Impact</span>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{c.reason}</p>
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                          <h4 className="text-green-700 dark:text-green-400 font-bold mb-3 flex items-center gap-2"><TrendingUp size={18}/> The Saviors</h4>
                          <ul className="space-y-3">
                              {attributionData.saviors.map((s, i) => (
                                  <li key={i} className="bg-white dark:bg-gray-800 p-3 rounded border border-green-100 dark:border-green-900 shadow-sm">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="font-bold text-gray-900 dark:text-white">{s.ticker}</span>
                                          <span className="text-[10px] uppercase bg-green-100 dark:bg-green-900 text-green-600 px-1.5 rounded">{s.impact} Impact</span>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{s.reason}</p>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                      <AlertTriangle className="text-blue-600 shrink-0 mt-1" size={20} />
                      <div>
                          <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Hidden Factor Detected</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{attributionData.hiddenFactor}</p>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {/* 2. Risk Radar */}
          {activeTab === 'risk' && riskData && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 mb-4 ${
                            riskData.riskLevel === 'High' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' :
                            riskData.riskLevel === 'Medium' ? 'border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                            'border-green-500 text-green-500 bg-green-50 dark:bg-green-900/20'
                        }`}>
                            <span className="text-2xl font-bold">{riskData.riskLevel}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Concentration Risk</h3>
                        <p className="text-gray-500 text-sm mt-2">{riskData.primaryRiskFactor}</p>
                    </div>
                    
                    <div className="flex-[2] bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Identified Vulnerabilities</h3>
                        <div className="space-y-4">
                            {riskData.risks.map((risk, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{risk.factor}</span>
                                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">{risk.percentageExposure} Exposure</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{risk.explanation}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                💡 AI Suggestion: {riskData.diversificationSuggestion}
                            </p>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* 3. Ripple Effect */}
          {activeTab === 'ripple' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Simulate Macro Event</label>
                       <div className="flex gap-2">
                           <input 
                                type="text" 
                                value={rippleEvent} 
                                onChange={(e) => setRippleEvent(e.target.value)}
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                                placeholder="e.g. RBI hikes rates by 50bps"
                           />
                           <button 
                                onClick={handleRippleAnalyze}
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                           >
                               {loading ? 'Simulating...' : 'Run Simulation'}
                           </button>
                       </div>
                  </div>

                  {rippleData && (
                      <div className="relative">
                          {/* Flow Chart Visualization */}
                          <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8 overflow-x-auto pb-4">
                               {rippleData.impactFlow.map((step, i) => (
                                   <div key={i} className="flex-1 min-w-[200px] bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm relative">
                                       <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">{step.step}</div>
                                       <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">{step.description}</p>
                                       {i < rippleData.impactFlow.length - 1 && (
                                           <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-gray-300 z-10">
                                               <ChevronRight size={24} />
                                           </div>
                                       )}
                                   </div>
                               ))}
                          </div>

                          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Portfolio Impact</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                              {rippleData.affectedTickers.map((item, i) => (
                                  <div key={i} className={`p-4 rounded-lg border ${item.effect === 'Positive' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="font-bold text-gray-900 dark:text-white">{item.ticker}</span>
                                          <span className={`text-xs font-bold px-2 py-1 rounded ${item.effect === 'Positive' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                              {item.effect}
                                          </span>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.reasoning}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* 4. Forensic Accountant */}
          {activeTab === 'forensic' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                       <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Paste Financial Text (10-K / Notes)</label>
                            <button 
                                onClick={handleLoadSample}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                            >
                                Load Suspicious Sample
                            </button>
                       </div>
                       <textarea 
                            value={forensicText} 
                            onChange={(e) => setForensicText(e.target.value)}
                            className="w-full h-32 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Paste footnotes or management discussion here..."
                       />
                       <button 
                            onClick={handleForensicAnalyze}
                            disabled={loading || !forensicText}
                            className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 w-full flex items-center justify-center gap-2"
                       >
                           {loading ? <Loader2 className="animate-spin"/> : <Search size={16}/>} 
                           Scan for Red Flags
                       </button>
                  </div>

                  {forensicData && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
                           <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Forensic Report</h3>
                               <div className="text-right">
                                   <div className="text-xs text-gray-500 uppercase">Manipulation Risk Score</div>
                                   <div className={`text-2xl font-black ${forensicData.manipulationScore > 70 ? 'text-red-600' : forensicData.manipulationScore > 40 ? 'text-amber-500' : 'text-green-600'}`}>
                                       {forensicData.manipulationScore}/100
                                   </div>
                               </div>
                           </div>

                           <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">"{forensicData.verdict}"</p>

                           <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Detected Red Flags</h4>
                           <div className="space-y-3">
                               {forensicData.redFlags.map((flag, i) => (
                                   <div key={i} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                       <AlertTriangle className={`shrink-0 mt-1 ${flag.severity === 'Critical' ? 'text-red-600' : 'text-amber-500'}`} />
                                       <div>
                                           <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900 dark:text-white">{flag.flag}</span>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${
                                                    flag.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 
                                                    flag.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                }`}>
                                                    {flag.severity}
                                                </span>
                                           </div>
                                           <p className="text-sm text-gray-600 dark:text-gray-400">{flag.explanation}</p>
                                       </div>
                                   </div>
                               ))}
                               {forensicData.redFlags.length === 0 && (
                                   <p className="text-green-600 font-medium flex items-center gap-2">
                                       <Shield size={18} /> No obvious red flags detected in the provided text.
                                   </p>
                               )}
                           </div>
                      </div>
                  )}
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalysisModal;
