
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, Trash2, X, FileText, Phone, PieChart, AlertOctagon, ThumbsUp, ThumbsDown, Copy, Check, Pin, Layout, Download, Layers, Zap, Activity, Grid, SidebarOpen, SidebarClose, Search, ZoomIn, ZoomOut, Factory } from 'lucide-react';
import { ChatMessage, TickerSearchItem, DocumentType, PinnedItem, EvidenceDocument, BingoData } from '../types';
import { startChatSession, sendChatMessage, analyzeDocument, compareAnalysis } from '../services/geminiService';
import { USER_PORTFOLIO, SEARCHABLE_TICKERS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';
import DominoGraph from './DominoGraph';

interface FinGeniePageProps {
  botAvatarUrl: string;
}

// Define a Tab interface
interface WorkspaceTab {
    id: string;
    title: string;
    ticker?: string;
    docType?: DocumentType;
    messages: ChatMessage[];
    evidence?: EvidenceDocument | null;
}

// Helper: Highlighted Text Component
const HighlightedText = ({ text, keywords }: { text: string; keywords: string[] }) => {
  if (!keywords || keywords.length === 0) return <>{text}</>;
  
  // Create a regex to match keywords case-insensitively
  // Escape special chars in keywords just in case
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-gray-900 dark:text-white font-bold px-0.5 rounded border-b-2 border-yellow-400 dark:border-yellow-600">
            {part}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
};

const FinGeniePage: React.FC<FinGeniePageProps> = ({ botAvatarUrl }) => {
  // Tab Management
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
      { id: '1', title: 'New Chat', messages: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  const [loading, setLoading] = useState(false);

  // Input State
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Workspace State
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  
  // UI Helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Smart Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab?.messages, loading]);

  useEffect(() => {
      startChatSession(null, USER_PORTFOLIO, activeTab?.messages || []);
  }, [activeTabId]);

  // Tab Actions
  const createNewTab = () => {
      const newId = Date.now().toString();
      setTabs(prev => [...prev, { id: newId, title: 'New Chat', messages: [] }]);
      setActiveTabId(newId);
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

  const handleSendMessage = async (text: string) => {
      if (!text.trim() || !activeTab) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text,
          timestamp: Date.now()
      };

      const newHistory = [...activeTab.messages, userMsg];
      
      // Update title if first message
      let newTitle = activeTab.title;
      if (activeTab.messages.length === 0) {
          newTitle = text.length > 20 ? text.substring(0, 20) + '...' : text;
      }

      updateActiveTab({ messages: newHistory, title: newTitle });
      
      setInputValue('');
      setShowSuggestions(false);
      setShowIntentMenu(false);
      setLoading(true);

      const response = await sendChatMessage(text);

      const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.text,
          sentimentScore: response.sentiment,
          chartData: response.chartData,
          suggestions: response.suggestions,
          dominoData: response.dominoData,
          timestamp: Date.now()
      };

      updateActiveTab({ messages: [...newHistory, aiMsg], title: newTitle });
      setLoading(false);
  };

  const handleIntentAction = async (docType: DocumentType) => {
    if (!selectedTicker || !activeTab) return;
    setShowIntentMenu(false);
    setInputValue('');
    setLoading(true);
    
    const intentMap: Record<DocumentType, string> = {
        'annual_report': 'Annual Report',
        'concall': 'Earnings Call',
        'quarterly_result': 'Quarterly Results',
        'red_flags': 'Red Flags',
        'supply_chain': 'Supply Chain Map'
    };
    
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: `Analyze the ${intentMap[docType]} for ${selectedTicker.symbol}`,
        timestamp: Date.now()
    };

    const newHistory = [...activeTab.messages, userMsg];
    // Rename tab to reflect analysis
    updateActiveTab({ 
        messages: newHistory, 
        title: `${selectedTicker.symbol} ${intentMap[docType]}`,
        ticker: selectedTicker.symbol,
        docType: docType,
        evidence: null 
    });

    try {
        const { text, sentiment, chartData, sourceDocument, bingoData, dominoData } = await analyzeDocument(selectedTicker.symbol, docType);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text,
            sentimentScore: sentiment,
            chartData: chartData,
            dominoData: dominoData,
            timestamp: Date.now()
        };
        
        // Trigger Split-Screen Evidence with Bingo Data (Except for Supply Chain which is in-chat)
        let evidence: EvidenceDocument | undefined;
        if (sourceDocument && docType !== 'supply_chain') {
             evidence = {
                title: `${selectedTicker.symbol} - ${intentMap[docType]}`,
                type: docType,
                content: sourceDocument,
                ticker: selectedTicker.symbol,
                bingoData: bingoData
            };
        }

        updateActiveTab({ 
            messages: [...newHistory, aiMsg], 
            evidence: evidence 
        });
        
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
        setSelectedTicker(null);
    }
  };

  // War Room Logic
  const handleCompareTabs = async () => {
      if (tabs.length < 2) return;
      // For simplicity, compare the last 2 tabs or active + previous
      const tabA = tabs[0];
      const tabB = tabs[1]; // In real app, open a modal to select
      
      createNewTab(); // Create a comparison tab
      setLoading(true);
      
      // Get last AI message from both
      const contentA = tabA.messages.filter(m => m.role === 'model').pop()?.text || "";
      const contentB = tabB.messages.filter(m => m.role === 'model').pop()?.text || "";
      
      const result = await compareAnalysis(
          tabA.ticker || tabA.title, 
          contentA, 
          tabB.ticker || tabB.title, 
          contentB
      );

      // Update the new tab (which is now active)
      setTabs(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
              ...updated[lastIdx],
              title: `VS: ${tabA.ticker || 'A'} vs ${tabB.ticker || 'B'}`,
              messages: [{
                  id: Date.now().toString(),
                  role: 'model',
                  text: result.text,
                  chartData: result.chartData,
                  timestamp: Date.now()
              }]
          };
          return updated;
      });
      setLoading(false);
  };

  // Canvas Actions
  const handlePinItem = (item: PinnedItem) => {
      if (!pinnedItems.some(p => p.id === item.id)) {
          setPinnedItems(prev => [item, ...prev]);
      }
      if (!isCanvasOpen) setIsCanvasOpen(true);
  };

  const handleRemovePin = (id: string) => {
      setPinnedItems(prev => prev.filter(p => p.id !== id));
  };

  // Input Handlers (Same as before)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const cursorPos = e.target.selectionStart || 0;
    setCursorIndex(cursorPos);

    const lastAtPos = val.lastIndexOf('@', cursorPos - 1);
    if (lastAtPos !== -1) {
        const query = val.substring(lastAtPos + 1, cursorPos);
        if (!query.includes(' ')) {
            setMentionQuery(query);
            setShowSuggestions(true);
            return;
        }
    }
    setShowSuggestions(false);
    setMentionQuery(null);
  };

  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.toLowerCase();
    return SEARCHABLE_TICKERS.filter(t => 
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [mentionQuery]);

  const handleSelectSuggestion = (ticker: TickerSearchItem) => {
    if (!inputRef.current) return;
    const val = inputValue;
    const lastAtPos = val.lastIndexOf('@', cursorIndex - 1);
    const newVal = val.substring(0, lastAtPos) + `@${ticker.symbol} ` + val.substring(cursorIndex);
    setInputValue(newVal);
    setShowSuggestions(false);
    setSelectedTicker(ticker);
    setShowIntentMenu(true);
    inputRef.current.focus();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // --- Sub-Components ---

  const ResearchCanvas = () => (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-[350px] flex-shrink-0 shadow-xl z-20">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                  <Layout size={18} className="text-blue-600 dark:text-blue-400"/>
                  <h3 className="font-bold text-gray-800 dark:text-white">Research Canvas</h3>
              </div>
              <button onClick={() => setIsCanvasOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pinnedItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                      <Pin size={32} className="mx-auto mb-2 opacity-20"/>
                      <p className="text-sm">Pin charts and key insights from the chat to build your research board.</p>
                  </div>
              ) : (
                  pinnedItems.map(item => (
                      <div key={item.id} className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 group relative">
                           <button onClick={() => handleRemovePin(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                               <X size={14}/>
                           </button>
                           <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{item.title}</h4>
                           {item.type === 'chart' ? (
                               <DynamicChart data={item.content} />
                           ) : item.type === 'domino' ? (
                                <DominoGraph data={item.content} targetTicker={activeTab?.ticker || 'Target'} />
                           ) : (
                               <div className="prose dark:prose-invert prose-xs max-h-40 overflow-y-auto">
                                   <ReactMarkdown>{item.content}</ReactMarkdown>
                               </div>
                           )}
                           <div className="mt-2 text-[10px] text-gray-400 text-right">
                               {new Date(item.timestamp).toLocaleTimeString()}
                           </div>
                      </div>
                  ))
              )}
          </div>
          {pinnedItems.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                      <Download size={16}/> Download Report
                  </button>
              </div>
          )}
      </div>
  );

  const EarningsBingo = ({ data }: { data: BingoData }) => {
      return (
          <div className="space-y-6 animate-fade-in mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400">
                        <Zap size={16}/> 
                    </div>
                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Transcript Analysis</h4>
              </div>

              {/* 1. Word Cloud */}
              <div className="mb-4">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Key Topics</h5>
                  <div className="flex flex-wrap gap-2">
                      {data.wordCloud.map((w, i) => (
                          <span 
                            key={i} 
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 cursor-default ${
                                w.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' :
                                w.sentiment === 'negative' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800' :
                                'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                            }`}
                            style={{ fontSize: `${Math.min(18, Math.max(11, w.count / 1.5))}px` }}
                          >
                              {w.word}
                          </span>
                      ))}
                  </div>
              </div>

              {/* 2. Sentiment Timeline */}
              <div>
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Sentiment Flow</h5>
                   <div className="h-24 flex items-end gap-2 relative border-b border-gray-200 dark:border-gray-600 pb-1">
                       {/* Base line */}
                       <div className="absolute top-1/2 w-full h-px bg-gray-300 dark:bg-gray-600 border-dashed opacity-50"></div>
                       
                       {data.sentimentTimeline.map((pt, i) => {
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
                                   
                                   {/* Time Label */}
                                   <span className="text-[9px] text-gray-400 absolute -bottom-5 whitespace-nowrap">{pt.time}</span>
                                   
                                   {/* Tooltip */}
                                   <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
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

  const EvidenceViewer = () => {
      if (!activeTab?.evidence) return null;
      const { evidence } = activeTab;

      // Extract high sentiment words for highlighting
      const highlights = useMemo(() => {
          if (!evidence.bingoData) return [];
          // highlight top words from cloud
          return evidence.bingoData.wordCloud.map(w => w.word);
      }, [evidence]);

      return (
          <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 w-full md:w-[45%] shadow-xl z-20 animate-slide-up transition-all flex-shrink-0">
              
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400 flex-shrink-0">
                          <FileText size={18}/>
                      </div>
                      <div className="min-w-0">
                          <h3 className="font-bold text-sm text-gray-800 dark:text-white truncate">{evidence.title}</h3>
                          <p className="text-xs text-gray-500">Source Document</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => updateActiveTab({ evidence: null })} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><X size={18}/></button>
                  </div>
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1">
                      <Search size={14} className="text-gray-400"/>
                      <input type="text" placeholder="Find..." className="text-xs bg-transparent border-none focus:ring-0 w-16 sm:w-24 text-gray-700 dark:text-gray-200 placeholder-gray-400" />
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                      <button className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><ZoomOut size={14}/></button>
                      <span className="text-xs font-mono">100%</span>
                      <button className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><ZoomIn size={14}/></button>
                  </div>
              </div>

              {/* Content Scroller */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900/50">
                   <div className="max-w-3xl mx-auto">
                        
                        {/* Gamified Analysis Section (if available) */}
                        {evidence.bingoData && (
                            <EarningsBingo data={evidence.bingoData} />
                        )}

                        {/* Document Paper Look */}
                        <div className="bg-white dark:bg-gray-800 shadow-md p-8 min-h-[500px] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                             <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                 {/* Highlighted Content */}
                                 {highlights.length > 0 ? (
                                     <HighlightedText text={evidence.content} keywords={highlights} />
                                 ) : (
                                     evidence.content
                                 )}
                             </div>
                             
                             {/* Fake Page Footer */}
                             <div className="mt-10 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-[10px] text-gray-400 uppercase tracking-widest">
                                 <span>Confidential</span>
                                 <span>Page 1 of 4</span>
                             </div>
                        </div>
                   </div>
              </div>
          </div>
      );
  };

  // Tab Bar Component
  const TabBar = () => (
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 pt-2 gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-bold max-w-[200px] cursor-pointer select-none transition-colors ${
                    activeTabId === tab.id 
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm border-t border-x border-gray-200 dark:border-gray-700' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                  <span className="truncate">{tab.title}</span>
                  <button 
                    onClick={(e) => closeTab(e, tab.id)}
                    className={`p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                      <X size={12} />
                  </button>
              </div>
          ))}
          <button 
            onClick={createNewTab}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
              <Plus size={16} />
          </button>
          
          {/* War Room Button */}
          {tabs.length >= 2 && (
               <button 
                  onClick={handleCompareTabs}
                  className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm animate-fade-in whitespace-nowrap"
               >
                   <Grid size={14} />
                   Compare Tabs
               </button>
          )}
      </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-900 overflow-hidden flex-col">
      
      {/* TOP: Tab Bar */}
      <TabBar />

      <div className="flex-1 flex overflow-hidden">
          
          {/* CENTER: Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 relative z-0 border-r border-gray-200 dark:border-gray-800">
              
              {/* Top Bar for Workspace Toggle */}
              <div className="h-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-end px-4 bg-white dark:bg-gray-900">
                  <button 
                      onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                      className={`p-1.5 rounded-lg transition-colors ${isCanvasOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Toggle Research Canvas"
                  >
                      {isCanvasOpen ? <SidebarOpen size={18} /> : <SidebarClose size={18} />}
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
                  {activeTab?.messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                              <img src={botAvatarUrl} className="w-14 h-14 rounded-full object-cover" alt="FinGenie" />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">FinGenie Workspace</h2>
                          <p className="text-gray-500 dark:text-gray-400 mb-8">
                              Multi-Tab Research Environment with Gamified Analysis.
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
                              <button onClick={() => handleSendMessage("Analyze the Q3 Results of @TCS")} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all group">
                                  <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-blue-600">Analyze Q3 Results</span>
                                  <span className="text-sm text-gray-500">"Analyze the Q3 Results of @TCS"</span>
                              </button>
                              <button onClick={() => handleSendMessage("Compare @INFY and @WIPRO revenue growth")} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all group">
                                  <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-purple-600">Compare Peers</span>
                                  <span className="text-sm text-gray-500">"Compare @INFY and @WIPRO"</span>
                              </button>
                          </div>
                      </div>
                  )}

                  {activeTab?.messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'model' && (
                              <img src={botAvatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 mt-1" alt="Bot" />
                          )}
                          <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-none px-5 py-3' : 'w-full'}`}>
                              <div className={`prose dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white' : ''}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                              </div>

                              {msg.chartData && (
                                  <div className="relative group/chart mt-2">
                                        <DynamicChart data={msg.chartData} />
                                        <button 
                                            onClick={() => handlePinItem({
                                                id: Date.now().toString(),
                                                type: 'chart',
                                                title: msg.chartData?.title || 'Chart',
                                                content: msg.chartData,
                                                timestamp: Date.now()
                                            })}
                                            className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 shadow-md rounded text-gray-400 hover:text-blue-600 opacity-0 group-hover/chart:opacity-100 transition-opacity"
                                            title="Pin to Research Canvas"
                                        >
                                            <Pin size={14}/>
                                        </button>
                                  </div>
                              )}

                              {msg.dominoData && (
                                  <div className="relative group/domino mt-2">
                                      <DominoGraph data={msg.dominoData} targetTicker={activeTab.ticker || 'Target'} />
                                      <button 
                                          onClick={() => handlePinItem({
                                              id: Date.now().toString(),
                                              type: 'domino',
                                              title: 'Supply Chain Map',
                                              content: msg.dominoData,
                                              timestamp: Date.now()
                                          })}
                                          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 shadow-md rounded text-gray-400 hover:text-blue-600 opacity-0 group-hover/domino:opacity-100 transition-opacity"
                                          title="Pin to Research Canvas"
                                      >
                                          <Pin size={14}/>
                                      </button>
                                  </div>
                              )}
                              
                              {msg.role === 'model' && (
                                  <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                      <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                      </button>
                                      <button 
                                          onClick={() => handlePinItem({
                                              id: msg.id,
                                              type: 'text',
                                              title: 'Key Insight',
                                              content: msg.text,
                                              timestamp: Date.now()
                                          })}
                                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                      >
                                          <Pin size={14} />
                                      </button>
                                      <div className="flex-1"></div>
                                      <button className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ThumbsUp size={14} /></button>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}

                  {loading && (
                      <div className="flex gap-4 max-w-3xl mx-auto">
                          <img src={botAvatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 mt-1" alt="Bot" />
                          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative z-10">
                    {showIntentMenu && selectedTicker && (
                        <div className="absolute bottom-full left-4 mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-80 animate-slide-up z-20">
                            {/* Intent Menu Content */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-sm font-bold">Actions for @{selectedTicker.symbol}</span>
                                <button onClick={() => setShowIntentMenu(false)}><X size={16} className="text-gray-400"/></button>
                            </div>
                            <div className="space-y-2">
                                 <button onClick={() => handleIntentAction('annual_report')} className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                     <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded"><FileText size={16} className="text-blue-600 dark:text-blue-400"/></div>
                                     <div><div className="text-sm font-bold">Annual Report</div><div className="text-xs text-gray-500">Strategic analysis</div></div>
                                 </button>
                                 <button onClick={() => handleIntentAction('concall')} className="w-full flex items-center gap-3 p-2 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                     <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded"><Phone size={16} className="text-emerald-600 dark:text-emerald-400"/></div>
                                     <div><div className="text-sm font-bold">Earnings Call</div><div className="text-xs text-gray-500">Skeptic mode + Bingo</div></div>
                                 </button>
                                 <button onClick={() => handleIntentAction('quarterly_result')} className="w-full flex items-center gap-3 p-2 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                     <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded"><PieChart size={16} className="text-purple-600 dark:text-purple-400"/></div>
                                     <div><div className="text-sm font-bold">Quarterly Results</div><div className="text-xs text-gray-500">Financial health check</div></div>
                                 </button>
                                 <button onClick={() => handleIntentAction('red_flags')} className="w-full flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                     <div className="bg-red-100 dark:bg-red-900 p-2 rounded"><AlertOctagon size={16} className="text-red-600 dark:text-red-400"/></div>
                                     <div><div className="text-sm font-bold">Red Flags</div><div className="text-xs text-gray-500">Forensic scan</div></div>
                                 </button>
                                 <button onClick={() => handleIntentAction('supply_chain')} className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                     <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded"><Factory size={16} className="text-orange-600 dark:text-orange-400"/></div>
                                     <div><div className="text-sm font-bold">Supply Chain Map</div><div className="text-xs text-gray-500">Visual Domino Effect</div></div>
                                 </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-30">
                            {filteredSuggestions.map((ticker) => (
                                <button
                                    key={ticker.symbol}
                                    onClick={() => handleSelectSuggestion(ticker)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 last:border-0"
                                >
                                    <span className="font-bold text-sm">{ticker.symbol}</span>
                                    <span className="text-xs text-gray-500">{ticker.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                  <div className="max-w-3xl mx-auto relative">
                      <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={handleInputChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                          placeholder={activeTab?.title === 'New Chat' ? "Start a new analysis (Use @ for tickers)..." : "Ask a follow-up question..."}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-4 pl-6 pr-12 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
                          disabled={loading}
                      />
                      <button 
                          onClick={() => handleSendMessage(inputValue)}
                          disabled={!inputValue.trim() || loading}
                          className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                          <Send size={20} />
                      </button>
                  </div>
              </div>
          </div>

          {/* RIGHT: Split-Screen Evidence OR Research Canvas */}
          {activeTab?.evidence ? (
              <EvidenceViewer />
          ) : (
              isCanvasOpen && <ResearchCanvas />
          )}

      </div>

    </div>
  );
};

export default FinGeniePage;
