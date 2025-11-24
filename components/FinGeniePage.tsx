
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, Trash2, X, FileText, Phone, PieChart, AlertOctagon, ThumbsUp, ThumbsDown, Copy, Check, Pin, Layout, Download, Layers, Zap, Activity, Grid, Search, ZoomIn, ZoomOut, Factory, ArrowUpRight, Sparkles, ArrowRight, Lightbulb, Scale, ShieldAlert, Network, ChevronLeft, Briefcase, Menu, Command, Hash } from 'lucide-react';
import { ChatMessage, TickerSearchItem, DocumentType, PinnedItem, EvidenceDocument, BingoData } from '../types';
import { startChatSession, sendChatMessage, analyzeDocument, compareAnalysis, getPortfolioHealthReport } from '../services/geminiService';
import { USER_PORTFOLIO, SEARCHABLE_TICKERS, MACROS, COMMANDS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';
import DominoGraph from './DominoGraph';
import PortfolioWidget from './PortfolioWidget';
import { fetchLiveNews } from '../services/geminiService';
import TickerChip from './TickerChip';
import QuickPeekDrawer from './QuickPeekDrawer';
import FocusWrapper from './FocusWrapper';

interface FinGeniePageProps {
  botAvatarUrl: string;
}

interface WorkspaceTab {
    id: string;
    title: string;
    ticker?: string;
    docType?: DocumentType;
    messages: ChatMessage[];
    evidence?: EvidenceDocument | null;
}

// --- SUB-COMPONENTS ---

const LoadingIndicator = ({ avatarUrl }: { avatarUrl: string }) => {
    const [textIndex, setTextIndex] = useState(0);
    const loadingTexts = [
        "Reading Article...",
        "Scanning for Red Flags...",
        "Analyzing Sentiment...",
        "Cross-referencing sources...",
        "Generating Chart...",
        "Synthesizing Insights..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % loadingTexts.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex gap-4 max-w-4xl mx-auto animate-slide-up pl-4 mt-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center animate-orb-green flex-shrink-0">
                <img src={avatarUrl} className="w-6 h-6 rounded-full object-cover opacity-90" alt="Bot" />
            </div>
            <div className="flex flex-col justify-center mt-1">
                 <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 animate-pulse transition-all duration-500">
                    {loadingTexts[textIndex]}
                </span>
            </div>
        </div>
    );
};

const HighlightedText = ({ text, keywords, searchTerm }: { text: string; keywords: string[]; searchTerm?: string }) => {
  if ((!keywords || keywords.length === 0) && !searchTerm) return <>{text}</>;
  
  const termsToHighlight = [...keywords];
  if (searchTerm) termsToHighlight.push(searchTerm);

  if (termsToHighlight.length === 0) return <>{text}</>;
  
  const escaped = termsToHighlight.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = termsToHighlight.some(k => k.toLowerCase() === part.toLowerCase());
        const isExactSearch = searchTerm && part.toLowerCase() === searchTerm.toLowerCase();

        return isMatch ? (
          <span key={i} className={`${isExactSearch ? 'bg-blue-200 dark:bg-blue-900/80 border-blue-400' : 'bg-yellow-200 dark:bg-yellow-900/60 border-yellow-400 dark:border-yellow-600'} text-gray-900 dark:text-white font-bold px-0.5 rounded border-b-2`}>
            {part}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
};

const EarningsBingo = ({ data }: { data: BingoData }) => {
    return (
        <div className="space-y-6 animate-fade-in mb-8 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400">
                    <Zap size={16}/> 
                </div>
                <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Transcript Analysis</h4>
            </div>

            <div className="mb-4">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Key Topics</h5>
                <div className="flex flex-wrap gap-2">
                    {(data.wordCloud || []).map((w, i) => (
                        <span 
                        key={i} 
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 cursor-default shadow-sm ${
                            w.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                            w.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' :
                            'bg-white text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-600'
                        }`}
                        style={{ fontSize: `${Math.min(16, Math.max(11, w.count / 1.5))}px` }}
                        >
                            {w.word}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Sentiment Flow</h5>
                <div className="h-24 flex items-end gap-2 relative border-b border-gray-200 dark:border-slate-600 pb-1">
                    <div className="absolute top-1/2 w-full h-px bg-gray-300 dark:bg-slate-600 border-dashed opacity-50"></div>
                    
                    {(data.sentimentTimeline || []).map((pt, i) => {
                        const height = Math.abs(pt.sentiment);
                        const isPos = pt.sentiment >= 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col justify-center items-center group relative h-full">
                                <div 
                                    className={`w-full max-w-[20px] rounded-sm ${isPos ? 'bg-emerald-400/80' : 'bg-rose-400/80'} transition-all hover:opacity-100`}
                                    style={{ 
                                        height: `${height}%`, 
                                        transform: isPos ? 'translateY(-50%)' : 'translateY(50%)',
                                        transformOrigin: isPos ? 'bottom' : 'top'
                                    }}
                                ></div>
                                <span className="text-[9px] text-gray-400 absolute -bottom-5 whitespace-nowrap">{pt.time}</span>
                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                    {pt.annotation || `${pt.sentiment > 0 ? '+' : ''}${pt.sentiment}`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const InsightDeck = ({ isOpen, onClose, pinnedItems, onRemovePin }: { 
    isOpen: boolean; 
    onClose: () => void; 
    pinnedItems: PinnedItem[]; 
    onRemovePin: (id: string) => void; 
}) => {
    return (
        <div className={`
            absolute md:static inset-y-0 right-0 z-50
            w-full sm:w-[360px] md:w-[340px] md:ml-4 md:my-4 
            glass-panel shadow-2xl md:rounded-2xl flex flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            ${!isOpen && 'hidden md:hidden'} // Hide completely if closed on mobile/desktop unless explicitly open or logic adjusted
        `}>
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-blue-600 dark:text-blue-400"/>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white">Research Deck</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-20">
                {pinnedItems.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                        <Pin size={32} className="mx-auto mb-4 opacity-30"/>
                        <p className="text-sm font-medium">Your deck is empty.</p>
                        <p className="text-xs mt-2">Pin charts, tables, and insights here to build your investment thesis.</p>
                    </div>
                ) : (
                    pinnedItems.map(item => (
                        <div key={item.id} className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 group relative transition-all hover:shadow-md">
                            <button onClick={() => onRemovePin(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                <X size={14}/>
                            </button>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`p-1 rounded ${item.type === 'chart' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {item.type === 'chart' ? <PieChart size={12}/> : <FileText size={12}/>}
                                </div>
                                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase truncate pr-4">{item.title}</h4>
                            </div>
                            
                            {item.type === 'chart' ? (
                                <div className="rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 h-32">
                                    <DynamicChart data={item.content} />
                                </div>
                            ) : item.type === 'domino' ? (
                                <div className="h-32 overflow-hidden rounded-lg border border-gray-100 bg-white">
                                    <DominoGraph data={item.content} targetTicker={'Target'} />
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert prose-xs max-h-32 overflow-y-auto font-mono text-xs bg-gray-50 dark:bg-slate-900/50 p-2 rounded border border-gray-100 dark:border-slate-700 custom-scrollbar">
                                    <ReactMarkdown>{item.content}</ReactMarkdown>
                                </div>
                            )}
                            <div className="mt-3 text-[10px] text-gray-400 text-right font-mono">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {pinnedItems.length > 0 && (
                <div className="p-4 border-t border-white/20 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 absolute bottom-0 w-full">
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-lg">
                        <Download size={14}/> Export Thesis PDF
                    </button>
                </div>
            )}
        </div>
    );
};

const EvidenceViewer = ({ evidence, onClose }: { evidence: EvidenceDocument; onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [zoom, setZoom] = useState(100);

    const highlights = useMemo(() => {
        if (!evidence.bingoData || !evidence.bingoData?.wordCloud) return [];
        return evidence.bingoData.wordCloud.map(w => w.word);
    }, [evidence]);

    return (
        <div className="absolute inset-0 z-50 md:static md:flex-shrink-0 md:w-[45%] md:my-4 md:mr-4 flex flex-col h-full glass-panel shadow-2xl animate-slide-up rounded-none md:rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 flex-shrink-0">
                        <FileText size={18}/>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-xs">{evidence.title}</h3>
                        <p className="text-xs text-gray-500">Source Document</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 transition-colors"><X size={18}/></button>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/30 dark:bg-slate-900/30 border-b border-white/20 dark:border-slate-700/50">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 flex-1 mr-2">
                    <Search size={14} className="text-gray-400 flex-shrink-0"/>
                    <input 
                        type="text" 
                        placeholder="Search text..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-xs bg-transparent border-none focus:ring-0 w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 p-0" 
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600"><X size={12}/></button>
                    )}
                </div>
                <div className="flex items-center gap-1 text-gray-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 hidden sm:flex">
                    <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><ZoomOut size={14}/></button>
                    <span className="text-xs font-mono w-8 text-center select-none">{zoom}%</span>
                    <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><ZoomIn size={14}/></button>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/50 dark:bg-black/20 custom-scrollbar">
                <div className="max-w-3xl mx-auto transition-transform origin-top" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                    
                    {evidence.bingoData && (
                        <EarningsBingo data={evidence.bingoData} />
                    )}

                    <div className="bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-10 min-h-[600px] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-sm">
                            <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                <HighlightedText 
                                    text={evidence.content} 
                                    keywords={highlights} 
                                    searchTerm={searchTerm}
                                />
                            </div>
                            
                            <div className="mt-16 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between text-[10px] text-gray-400 uppercase tracking-widest font-sans">
                                <span>Confidential</span>
                                <span>FinInsight Verification</span>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TickerSelector = ({ action, onSelect, onCancel }: { action: DocumentType; onSelect: (ticker: string) => void; onCancel: () => void }) => {
    const [search, setSearch] = useState('');

    const getActionDetails = (type: DocumentType) => {
        switch(type) {
            case 'red_flags': return { title: "Forensic Scan", desc: "Audit footnotes for accounting risks.", icon: AlertOctagon, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" };
            case 'annual_report': return { title: "Annual Report", desc: "Summarize long-term strategy & risks.", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" };
            case 'concall': return { title: "Earnings Call", desc: "Analyze management tone & skepticism.", icon: Phone, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
            case 'supply_chain': return { title: "Supply Chain", desc: "Visualize suppliers & dependencies.", icon: Network, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" };
            case 'quarterly_result': return { title: "Quarterly Results", desc: "Visualize growth trends & margins.", icon: PieChart, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" };
            default: return { title: "Analyze Stock", desc: "Select a stock to analyze.", icon: Zap, color: "text-gray-500", bg: "bg-gray-50" };
        }
    };

    const details = getActionDetails(action);
    const Icon = details.icon;

    const filteredTickers = SEARCHABLE_TICKERS.filter(t => 
        t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8);

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in p-2">
            <button onClick={onCancel} className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-4 hover:text-gray-800 dark:hover:text-white transition-colors">
                <ChevronLeft size={14}/> Back to Actions
            </button>
            
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2.5 rounded-lg ${details.bg} ${details.color}`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{details.title}</h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{details.desc}</p>
                        </div>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Search (e.g. Reliance)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="p-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                    {/* Portfolio Section */}
                    {!search && (
                        <div className="mb-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2">Your Portfolio</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2">
                                {USER_PORTFOLIO.map(stock => (
                                    <button 
                                        key={stock.symbol}
                                        onClick={() => onSelect(stock.symbol)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-800 transition-all group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                            <Briefcase size={14}/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">{stock.symbol}</span>
                                            <span className="block text-[10px] text-gray-500">{stock.shares} Shares</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2">{search ? 'Results' : 'Trending'}</h3>
                         <div className="grid grid-cols-1 gap-1 px-2">
                            {filteredTickers.map(t => (
                                <button
                                    key={t.symbol}
                                    onClick={() => onSelect(t.symbol)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 flex items-center justify-center font-bold text-xs group-hover:bg-white dark:group-hover:bg-slate-600">
                                            {t.symbol[0]}
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">{t.symbol}</span>
                                            <span className="block text-xs text-gray-500">{t.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 px-2 py-1 rounded">{t.type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const FinGeniePage: React.FC<FinGeniePageProps> = ({ botAvatarUrl }) => {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
      { id: '1', title: 'New Chat', messages: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI Toggles
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false); // Mobile Toggle

  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Focus Mode
  const [isGlobalFocus, setIsGlobalFocus] = useState(false);
  const [quickPeekTicker, setQuickPeekTicker] = useState<string | null>(null);

  // Action/Mention States
  const [pendingAction, setPendingAction] = useState<DocumentType | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [triggerType, setTriggerType] = useState<'@' | '#' | '/' | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab?.messages, loading]);

  useEffect(() => {
      startChatSession(null, USER_PORTFOLIO, activeTab?.messages || []);
  }, [activeTabId]);

  // Tab Management
  const createNewTab = () => {
      const newId = Date.now().toString();
      setTabs(prev => [...prev, { id: newId, title: 'New Chat', messages: [] }]);
      setActiveTabId(newId);
      if(window.innerWidth < 768) setIsLeftSidebarOpen(false); // Close sidebar on mobile
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (tabs.length === 1) {
          setTabs([{ id: Date.now().toString(), title: 'New Chat', messages: [] }]);
          return;
      }
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const updateActiveTab = (updates: Partial<WorkspaceTab>) => {
      setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, ...updates } : t)));
  };

  // Messaging Logic
  const handleSendMessage = async (text: string) => {
      if (!text.trim() || !activeTab) return;
      
      setInputValue('');
      setShowSuggestions(false);
      setShowIntentMenu(false);
      setLoading(true);

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text,
          timestamp: Date.now()
      };
      const newHistory = [...activeTab.messages, userMsg];
      
      let newTitle = activeTab.title;
      if (activeTab.messages.length === 0) {
          newTitle = text.length > 20 ? text.substring(0, 20) + '...' : text;
      }
      updateActiveTab({ messages: newHistory, title: newTitle });

      // Intercept Portfolio Command
      if (text.toLowerCase().includes('/portfolio') || text.toLowerCase() === 'check portfolio health') {
           try {
               const articles = await fetchLiveNews();
               const report = await getPortfolioHealthReport(USER_PORTFOLIO, articles || []);
               
               if (report) {
                   const botMsg: ChatMessage = {
                       id: (Date.now() + 1).toString(),
                       role: 'model',
                       text: `I've analyzed your portfolio health against today's news. Here is your Command Center report:`,
                       portfolioReport: report,
                       timestamp: Date.now()
                   };
                   updateActiveTab({ messages: [...newHistory, botMsg], title: 'Portfolio Health' });
                   setLoading(false);
                   return;
               }
           } catch (e) {
               console.error("Portfolio Command Failed", e);
           }
      }

      try {
        const result = await sendChatMessage(text);
        
        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text,
            sentimentScore: result.sentiment,
            suggestions: result.suggestions,
            chartData: result.chartData,
            dominoData: result.dominoData,
            timestamp: Date.now()
        };

        updateActiveTab({ messages: [...newHistory, botMsg] });
      } catch (error) {
        const errorMsg: ChatMessage = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             text: "I encountered an error processing your request. Please try again.",
             timestamp: Date.now()
        };
        updateActiveTab({ messages: [...newHistory, errorMsg] });
      } finally {
        setLoading(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const cursorPos = e.target.selectionStart || 0;
    setCursorIndex(cursorPos);

    const textBeforeCursor = val.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@')) {
        setTriggerType('@');
        setMentionQuery(currentWord.substring(1));
        setShowSuggestions(true);
        setSelectedIndex(0);
    } else if (currentWord.startsWith('#')) {
        setTriggerType('#');
        setMentionQuery(currentWord.substring(1));
        setShowSuggestions(true);
        setSelectedIndex(0);
    } else if (currentWord.startsWith('/') && words.length === 1) {
        setTriggerType('/');
        setMentionQuery(currentWord.substring(1));
        setShowSuggestions(true);
        setSelectedIndex(0);
    } else {
        setShowSuggestions(false);
        setTriggerType(null);
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery && mentionQuery !== '') return [];
    const q = mentionQuery.toLowerCase();
    
    let sourceList: TickerSearchItem[] = [];
    if (triggerType === '@') sourceList = SEARCHABLE_TICKERS;
    if (triggerType === '#') sourceList = MACROS;
    if (triggerType === '/') sourceList = COMMANDS;

    return sourceList.filter(t => 
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [mentionQuery, triggerType]);

  const handleSelectSuggestion = (item: TickerSearchItem) => {
    if (!inputRef.current) return;
    const val = inputValue;
    // Find start of the word being typed
    const textBeforeCursor = val.substring(0, cursorIndex);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];
    const startPos = textBeforeCursor.lastIndexOf(lastWord);
    
    if (triggerType === '/') {
        // Commands execute immediately or replace input
        if (item.symbol === 'portfolio') {
            handleSendMessage("/portfolio");
        } else {
            setInputValue(`/${item.symbol} `);
        }
        setShowSuggestions(false);
        return;
    }

    const prefix = triggerType || '';
    const newVal = val.substring(0, startPos) + `${prefix}${item.symbol} ` + val.substring(cursorIndex);
    
    setInputValue(newVal);
    setShowSuggestions(false);
    setMentionQuery(null);
    
    // Trigger Intent Menu only for stocks (@)
    if (triggerType === '@') {
        setSelectedTicker(item);
        setShowIntentMenu(true);
    }
    
    inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Suggestion Navigation
    if (showSuggestions && filteredSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            handleSelectSuggestion(filteredSuggestions[selectedIndex]);
            return;
        }
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            return;
        }
    }

    // Default Enter to Send
    if (e.key === 'Enter') {
        handleSendMessage(inputValue);
    }
  };

  const handleIntentAction = async (docType: DocumentType, tickerOverride?: string) => {
      const ticker = tickerOverride || selectedTicker?.symbol;
      if (!ticker || !activeTab) return;
      
      const intentMap: Record<DocumentType, string> = {
        'annual_report': 'Annual Report Analysis',
        'concall': 'Earnings Call Analysis',
        'quarterly_result': 'Quarterly Results',
        'red_flags': 'Forensic Scan',
        'supply_chain': 'Supply Chain Map'
      };
      const userText = `Analyze the ${intentMap[docType]} for ${ticker}`;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: userText,
        timestamp: Date.now()
      };
      updateActiveTab({ messages: [...activeTab.messages, userMsg], title: `${ticker} Analysis` });
      
      setShowIntentMenu(false);
      setSelectedTicker(null);
      setInputValue('');
      setPendingAction(null);
      setLoading(true);

      try {
           const { text, sentiment, chartData, bingoData, sourceDocument, dominoData } = await analyzeDocument(ticker, docType);
           const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: text,
                sentimentScore: sentiment,
                chartData: chartData,
                dominoData: dominoData,
                timestamp: Date.now()
           };
           
           let evidence: EvidenceDocument | null = null;
           if (sourceDocument) {
               evidence = {
                   title: `${ticker} ${intentMap[docType]}`,
                   type: docType,
                   content: sourceDocument,
                   ticker: ticker,
                   bingoData: bingoData
               };
           }

           updateActiveTab({ messages: [...activeTab.messages, userMsg, botMsg], evidence: evidence });

      } catch (error) {
           console.error(error);
      } finally {
           setLoading(false);
      }
  };

  const handlePin = (msg: ChatMessage) => {
      const newItem: PinnedItem = {
          id: Date.now().toString(),
          type: msg.chartData ? 'chart' : msg.dominoData ? 'domino' : 'text',
          title: msg.chartData ? 'Chart Analysis' : msg.dominoData ? 'Supply Chain' : 'Insight Note',
          content: msg.chartData || msg.dominoData || msg.text.substring(0, 200) + '...',
          timestamp: Date.now()
      };
      setPinnedItems(prev => [newItem, ...prev]);
      setIsCanvasOpen(true);
  };

  const handleRemovePin = (id: string) => {
      setPinnedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCompareTabs = async () => {
      if (tabs.length < 2) return;
      setLoading(true);
      createNewTab();
      const tabA = tabs[0];
      const tabB = tabs[1];
      
      const contentA = tabA.messages.filter(m => m.role === 'model').pop()?.text || "";
      const contentB = tabB.messages.filter(m => m.role === 'model').pop()?.text || "";

      const result = await compareAnalysis(tabA.title, contentA, tabB.title, contentB);
      
      const botMsg: ChatMessage = {
           id: Date.now().toString(),
           role: 'model',
           text: result.text,
           chartData: result.chartData,
           timestamp: Date.now()
      };

      setTabs(prev => {
          const last = prev[prev.length - 1];
          return prev.map(t => t.id === last.id ? { ...t, title: 'Comparison Report', messages: [botMsg] } : t);
      });
      setLoading(false);
  };

  const handleTickerClick = (ticker: string) => {
      setQuickPeekTicker(ticker);
  };

  return (
    <div className={`flex h-[calc(100dvh-64px)] bg-gray-50 dark:bg-slate-950 overflow-hidden relative bg-grid-pattern transition-opacity duration-500 ${isGlobalFocus ? 'opacity-dimmed' : ''}`}>
        
        {isGlobalFocus && <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none transition-opacity" />}

        {/* Quick Peek Drawer */}
        {quickPeekTicker && (
            <QuickPeekDrawer ticker={quickPeekTicker} onClose={() => setQuickPeekTicker(null)} />
        )}

        {/* MOBILE OVERLAY for Left Sidebar */}
        {isLeftSidebarOpen && (
            <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsLeftSidebarOpen(false)} />
        )}

        {/* Left Sidebar (Tabs) - Responsive */}
        <div className={`
            absolute md:relative top-0 left-0 bottom-0 w-64 z-40
            bg-white/90 dark:bg-slate-900/90 border-r border-white/20 dark:border-slate-800/50 backdrop-blur-md 
            flex flex-col transition-transform duration-300 ease-in-out
            ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
             <div className="p-4 border-b border-white/20 dark:border-slate-800/50 flex justify-between items-center">
                 <button 
                    onClick={createNewTab}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                 >
                     <Plus size={16} strokeWidth={3} /> New Analysis
                 </button>
                 {/* Close button only on mobile */}
                 <button onClick={() => setIsLeftSidebarOpen(false)} className="md:hidden p-2 text-gray-500">
                    <X size={20} />
                 </button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 {tabs.map(tab => (
                     <div 
                        key={tab.id}
                        onClick={() => { setActiveTabId(tab.id); if(window.innerWidth<768) setIsLeftSidebarOpen(false); }}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                            activeTabId === tab.id 
                            ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/50 shadow-sm' 
                            : 'hover:bg-white/50 dark:hover:bg-slate-800/30 border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                     >
                         <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`p-1.5 rounded-md flex-shrink-0 ${activeTabId === tab.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                 <MessageSquare size={14} />
                             </div>
                             <span className={`text-sm font-medium truncate ${activeTabId === tab.id ? 'text-gray-900 dark:text-white' : ''}`}>
                                 {tab.title}
                             </span>
                         </div>
                         <button 
                            onClick={(e) => closeTab(e, tab.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                         >
                             <X size={14} />
                         </button>
                     </div>
                 ))}
             </div>
             
             <div className="p-4 border-t border-white/20 dark:border-slate-800/50">
                 <button 
                    onClick={handleCompareTabs}
                    disabled={tabs.length < 2}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                     <Scale size={14} /> Compare Active Tabs
                 </button>
             </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col relative min-w-0 w-full z-0">
            
            {/* Header */}
            <div className="h-14 border-b border-white/20 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20">
                <div className="flex items-center gap-3">
                    {/* Mobile Hamburger */}
                    <button onClick={() => setIsLeftSidebarOpen(true)} className="md:hidden p-1.5 text-gray-600 dark:text-gray-300">
                        <Menu size={20} />
                    </button>
                    <h2 className="font-bold text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-md">{activeTab?.title}</h2>
                    {activeTab?.messages.length > 0 && (
                        <span className="hidden sm:inline text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-mono">
                            {activeTab.messages.length} msgs
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                        className={`p-2 rounded-lg transition-colors ${isCanvasOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        title="Toggle Research Deck"
                    >
                        <Layout size={18} />
                    </button>
                </div>
            </div>

            {/* Stream Area */}
            <div className="flex-1 overflow-hidden relative flex">
                
                {/* Chat Stream */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-48 transition-all duration-500 ${activeTab?.evidence ? 'hidden md:block opacity-100' : 'mx-auto max-w-4xl w-full'}`}>
                    
                    {(!activeTab?.messages || activeTab.messages.length === 0) && !loading && (
                        <div className="h-full flex flex-col items-center justify-center animate-fade-in px-4">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                                <img src={botAvatarUrl} className="relative w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-xl" alt="FinGenie" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Good Afternoon, Investor</h1>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 text-center text-sm sm:text-base">Ready to find your next winning trade?</p>

                            {pendingAction ? (
                                <TickerSelector 
                                    action={pendingAction} 
                                    onSelect={(ticker) => handleIntentAction(pendingAction, ticker)} 
                                    onCancel={() => setPendingAction(null)} 
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
                                    <button onClick={() => setPendingAction('red_flags')} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><ShieldAlert size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Forensic Scan</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Find hidden red flags</span>
                                    </button>

                                    <button onClick={() => handleSendMessage("Compare TCS vs Infosys fundamentals")} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><Scale size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Compare with Rivals</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">See who is winning the race</span>
                                    </button>

                                    <button onClick={() => setPendingAction('supply_chain')} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><Network size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Supply Chain Map</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Visualize business connections</span>
                                    </button>

                                    <button onClick={() => setPendingAction('concall')} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><Phone size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Earnings Call Analysis</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Decode CEO tone & skepticism</span>
                                    </button>

                                    <button onClick={() => handleSendMessage("Check Portfolio Health")} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><PieChart size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Check Portfolio Health</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Attribution & risk analysis</span>
                                    </button>

                                    <button onClick={() => handleSendMessage("What happens if Crude Oil hits $100?")} className="group flex flex-col items-start p-4 bg-white dark:bg-slate-800/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-gray-200 dark:border-slate-700 hover:border-yellow-200 dark:hover:border-yellow-800 rounded-xl transition-all shadow-sm hover:shadow-md text-left">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg mb-3 group-hover:scale-110 transition-transform"><Zap size={20}/></div>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">Predict "What If"</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Simulate oil or tax changes</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab?.messages.map((msg, idx) => (
                        <div key={msg.id} className={`mb-8 animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                            {msg.role === 'user' ? (
                                <div className="max-w-[90%] sm:max-w-[85%]">
                                    <h3 className="text-base font-medium text-gray-800 dark:text-white text-right mb-1 bg-blue-50 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-br-sm border border-blue-100 dark:border-slate-700 shadow-sm">
                                        {msg.text}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 block text-right pr-1 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                            ) : (
                                <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/40 dark:border-slate-700/40 shadow-sm relative group">
                                    
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={() => handlePin(msg)} className="p-1.5 bg-white dark:bg-slate-800 rounded text-gray-400 hover:text-blue-500 shadow-sm border border-gray-100 dark:border-slate-700" title="Pin to Deck">
                                            <Pin size={14} />
                                        </button>
                                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 bg-white dark:bg-slate-800 rounded text-gray-400 hover:text-blue-500 shadow-sm border border-gray-100 dark:border-slate-700">
                                            {copiedId === msg.id ? <Check size={14}/> : <Copy size={14}/>}
                                        </button>
                                    </div>

                                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                ul: ({node, ...props}) => <ul className="list-none space-y-2 pl-0 my-4" {...props} />,
                                                li: ({node, ...props}) => {
                                                    return (
                                                        <li className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300" {...props}>
                                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                                            <span className="flex-1">
                                                                {React.Children.map(props.children, child => {
                                                                    if (typeof child === 'string') {
                                                                        return <TickerChipWrapper text={child} onTickerClick={handleTickerClick} />;
                                                                    }
                                                                    return child;
                                                                })}
                                                            </span>
                                                        </li>
                                                    );
                                                },
                                                p: ({node, ...props}) => (
                                                    <p className="mb-4" {...props}>
                                                        {React.Children.map(props.children, child => {
                                                            if (typeof child === 'string') {
                                                                return <TickerChipWrapper text={child} onTickerClick={handleTickerClick} />;
                                                            }
                                                            return child;
                                                        })}
                                                    </p>
                                                ),
                                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3" {...props} />,
                                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic rounded-r-lg" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                                sup: ({node, ...props}) => (
                                                    <sup className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded ml-0.5 cursor-help" title="Source Citation">
                                                        {props.children}
                                                    </sup>
                                                )
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {/* Dynamic Widgets - Moved Below Text for better flow */}
                                    {(msg.portfolioReport || msg.dominoData || msg.chartData) && (
                                        <FocusWrapper onFocusChange={setIsGlobalFocus}>
                                            <div className="mt-6 space-y-6 border-t border-gray-100 dark:border-slate-800 pt-4">
                                                {msg.portfolioReport && (
                                                    <div className="w-full">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Portfolio Intelligence</h4>
                                                        <PortfolioWidget data={msg.portfolioReport} />
                                                    </div>
                                                )}
                                                
                                                {msg.dominoData && (
                                                    <div className="w-full">
                                                        <DominoGraph data={msg.dominoData} targetTicker={'Target'} />
                                                    </div>
                                                )}
                                                
                                                {msg.chartData && (
                                                    <div className="w-full max-w-2xl">
                                                        <DynamicChart data={msg.chartData} />
                                                    </div>
                                                )}
                                            </div>
                                        </FocusWrapper>
                                    )}

                                    {/* Suggested Follow-ups */}
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/50 flex flex-wrap gap-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 py-1.5">Suggested:</span>
                                            {msg.suggestions.map((s, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => handleSendMessage(s)}
                                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-1"
                                                >
                                                    <Lightbulb size={12} className="text-amber-400"/> {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && <LoadingIndicator avatarUrl={botAvatarUrl} />}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Gradient Mask at bottom of chat to smooth scroll behind input */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-slate-950 to-transparent pointer-events-none z-10" />

                {/* Right Panels (Evidence or Deck) - RESPONSIVE */}
                {activeTab?.evidence ? (
                    <EvidenceViewer evidence={activeTab.evidence} onClose={() => updateActiveTab({ evidence: null })} />
                ) : (
                    <InsightDeck 
                        isOpen={isCanvasOpen} 
                        onClose={() => setIsCanvasOpen(false)} 
                        pinnedItems={pinnedItems} 
                        onRemovePin={handleRemovePin}
                    />
                )}

            </div>

            {/* Floating Command Deck (Omnibar) */}
            <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-30 pointer-events-none">
                <div className="w-full max-w-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2 flex flex-col pointer-events-auto transition-all hover:shadow-blue-500/10 group mb-safe">
                    
                    {/* Intent Menu */}
                    {showIntentMenu && selectedTicker && (
                         <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-2 w-64 animate-slide-up mx-2">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 dark:border-slate-700 mb-1 flex justify-between">
                                <span>Analyze {selectedTicker.symbol}</span>
                                <button onClick={() => setShowIntentMenu(false)}><X size={12}/></button>
                            </div>
                            <button onClick={() => handleIntentAction('annual_report')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><FileText size={14} className="text-blue-500"/> Annual Report Analysis</button>
                            <button onClick={() => handleIntentAction('concall')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><Phone size={14} className="text-emerald-500"/> Earnings Call Analysis</button>
                            <button onClick={() => handleIntentAction('red_flags')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><AlertOctagon size={14} className="text-red-500"/> Forensic Scan</button>
                            <button onClick={() => handleIntentAction('quarterly_result')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><PieChart size={14} className="text-purple-500"/> Quarterly Results</button>
                             <button onClick={() => handleIntentAction('supply_chain')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><Factory size={14} className="text-orange-500"/> Supply Chain Map</button>
                         </div>
                    )}

                    {/* Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                         <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 w-64 overflow-hidden animate-slide-up mx-2">
                            {filteredSuggestions.map((t, index) => (
                                <button 
                                    key={t.symbol}
                                    onClick={() => handleSelectSuggestion(t)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 last:border-0 flex justify-between items-center group/item transition-colors ${
                                        index === selectedIndex 
                                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                                >
                                    <div>
                                        <span className="block font-bold text-sm text-gray-800 dark:text-white group-hover/item:text-blue-600">
                                            {triggerType === '#' ? '#' : triggerType === '/' ? '/' : ''}{t.symbol}
                                        </span>
                                        <span className="block text-xs text-gray-500">{t.name}</span>
                                        {t.description && <span className="block text-[10px] text-gray-400 italic truncate">{t.description}</span>}
                                    </div>
                                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 px-1.5 py-0.5 rounded">{t.type}</span>
                                </button>
                            ))}
                         </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask FinGenie... (Type @ for stocks, # for macros, / for tools)" 
                                className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 py-3 px-4 text-sm sm:text-base font-medium"
                            />
                        </div>
                        <button 
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || loading}
                            className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                        >
                            <ArrowUpRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

// Helper component to parse text nodes and replace tickers with chips
const TickerChipWrapper = ({ text, onTickerClick }: { text: string; onTickerClick: (t: string) => void }) => {
    const tickers = SEARCHABLE_TICKERS.map(t => t.symbol);
    
    // Regex to find tickers (basic word boundary check against known list)
    // We sort by length desc to match longer tickers first
    const escapedTickers = tickers
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length);

    if (escapedTickers.length === 0) return <>{text}</>;

    const regex = new RegExp(`\\b(${escapedTickers.join('|')})\\b`, 'g');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                if (tickers.includes(part)) {
                    return <TickerChip key={i} ticker={part} onClick={onTickerClick} />;
                }
                return part;
            })}
        </>
    );
}

export default FinGeniePage;
