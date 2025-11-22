
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, LineChart, Search, AlertCircle, Loader2, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeEarningsTranscript, analyzeChartImage } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface FinancialToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolTab = 'earnings' | 'chart';

const FinancialToolsModal: React.FC<FinancialToolsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('earnings');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Earnings State
  const [transcriptText, setTranscriptText] = useState('');
  
  // Chart State
  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleEarningsAnalyze = async () => {
    if (!transcriptText.trim()) return;
    setLoading(true);
    setResult(null);
    
    try {
      const analysis = await analyzeEarningsTranscript(transcriptText);
      setResult(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChartPreview(reader.result as string);
        setResult(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChartAnalyze = async () => {
    if (!chartPreview) return;
    setLoading(true);
    
    try {
      // Extract base64 data (remove "data:image/png;base64," prefix)
      const base64Data = chartPreview.split(',')[1];
      const analysis = await analyzeChartImage(base64Data);
      setResult(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
      setResult(null);
      setTranscriptText('');
      setChartPreview(null);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
                {activeTab === 'earnings' ? <FileText size={20} /> : <LineChart size={20} />}
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Financial Intelligence Tools</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini Pro Vision & NLP</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Tabs */}
            <div className="md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2">
                <button 
                    onClick={() => { setActiveTab('earnings'); reset(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === 'earnings' 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Mic size={18} />
                    Earnings Analyzer
                </button>
                <button 
                    onClick={() => { setActiveTab('chart'); reset(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === 'chart' 
                        ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <LineChart size={18} />
                    Chart Vision
                </button>
                
                <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <strong>Tip:</strong> {activeTab === 'earnings' ? 'Paste the Q&A section of a transcript for best results.' : 'Upload a clear screenshot of a daily or weekly candlestick chart.'}
                    </p>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
                
                {/* EARNINGS TAB */}
                {activeTab === 'earnings' && (
                    <div className="h-full flex flex-col">
                        {!result && (
                            <>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Paste Earnings Transcript / Q&A Text
                                </label>
                                <textarea
                                    className="flex-1 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4 dark:text-gray-200"
                                    placeholder="Paste text here... (e.g. 'Operator: Our first question comes from...')"
                                    value={transcriptText}
                                    onChange={(e) => setTranscriptText(e.target.value)}
                                />
                                <button
                                    onClick={handleEarningsAnalyze}
                                    disabled={loading || !transcriptText}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                    Analyze Sentiment & Skepticism
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* CHART TAB */}
                {activeTab === 'chart' && (
                    <div className="h-full flex flex-col items-center justify-center">
                        {!chartPreview && !result && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                            >
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <p className="font-medium text-gray-600 dark:text-gray-300">Click to upload Chart Screenshot</p>
                                <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG</p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleChartUpload}
                                />
                            </div>
                        )}

                        {chartPreview && !result && (
                            <div className="w-full flex flex-col items-center">
                                <div className="relative w-full max-h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
                                    <img src={chartPreview} alt="Chart Preview" className="w-full h-full object-contain bg-gray-900" />
                                    <button 
                                        onClick={() => setChartPreview(null)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleChartAnalyze}
                                    disabled={loading}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <LineChart size={20} />}
                                    Identify Patterns & Levels
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* RESULTS VIEW */}
                {result && (
                    <div className="h-full flex flex-col animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{result.title}</h3>
                            <button 
                                onClick={reset}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Analyze Another
                            </button>
                        </div>
                        
                        {result.sentiment !== undefined && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Q&A Sentiment Score</span>
                                    <span className={`text-lg font-bold ${result.sentiment > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {result.sentiment > 0 ? '+' : ''}{result.sentiment}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${result.sentiment > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                        style={{ width: `${Math.abs(result.sentiment)}%`, marginLeft: result.sentiment < 0 ? '50%' : '0', transform: result.sentiment > 0 ? 'translateX(50%)' : 'translateX(-100%)' }} // Approximate visual
                                    />
                                    {/* Simpler visual: 0-100 mapping */}
                                    <div className="h-full w-full bg-gradient-to-r from-rose-500 via-gray-300 to-emerald-500 relative">
                                         <div 
                                            className="absolute top-0 bottom-0 w-1 bg-black dark:bg-white" 
                                            style={{ left: `${((result.sentiment + 100) / 200) * 100}%` }}
                                         />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="prose dark:prose-invert prose-sm max-w-none overflow-y-auto pr-2 custom-scrollbar">
                             <ReactMarkdown>{result.content}</ReactMarkdown>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialToolsModal;
