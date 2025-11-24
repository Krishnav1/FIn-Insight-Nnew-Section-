
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Send, TrendingUp, TrendingDown, Minus, Copy, ThumbsUp, ThumbsDown, Check, MessageCircle, FileText, Search, AlertOctagon, PieChart, Phone, Factory, Pin, Zap, Target, ArrowRight, Activity, AlertTriangle, Building2, Globe, Terminal } from 'lucide-react';
import { Article, ChatMessage, TickerSearchItem, DocumentType, PinnedItem, NewsInsight } from '../types';
import { SEARCHABLE_TICKERS, MACROS, COMMANDS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';
import DominoGraph from './DominoGraph';
import PortfolioWidget from './PortfolioWidget';
import TickerChip from './TickerChip';
import QuickPeekDrawer from './QuickPeekDrawer';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArticle: Article | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, apiPrompt?: string) => void;
  loading: boolean;
  botAvatarUrl: string;
  onFeedback: (messageId: string, type: 'liked' | 'disliked') => void;
  onSmartAction: (ticker: string, docType: DocumentType) => void;
}

const SidebarLoadingIndicator = () => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    "Reading Article...",
    "Scanning for Red Flags...",
    "Analyzing Sentiment...",
    "Cross-referencing sources...",
    "Generating Chart...",
    "Synthesizing Insights..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[140px] transition-all duration-300">
                {texts[textIndex]}
            </span>
        </div>
    </div>
  );
};

const SmartInsightCard = ({ data }: { data: NewsInsight }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-4 mb-6 animate-fade-in">
            {/* Header - The Gist */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                        <Target size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">The Gist</h4>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {data.gist}
                </p>
            </div>

            {/* Key Numbers Grid */}
            {data.stats && data.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                    {data.stats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-3 text-center">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{stat.label}</div>
                            <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5 font-mono">{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Impact Pills - Winners & Losers */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                        <TrendingUp size={12}/> Beneficiaries
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                        {data.impact.beneficiaries.length > 0 ? (
                            data.impact.beneficiaries.map((t, i) => (
                                <span key={i} className="text-[10px] font-bold bg-white dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800 shadow-sm">
                                    {t}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-400 italic">None identified</span>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10">
                    <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-2 flex items-center gap-1">
                        <TrendingDown size={12}/> Negative Impact
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                        {data.impact.negativelyImpacted.length > 0 ? (
                            data.impact.negativelyImpacted.map((t, i) => (
                                <span key={i} className="text-[10px] font-bold bg-white dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded border border-rose-100 dark:border-rose-800 shadow-sm">
                                    {t}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-400 italic">None identified</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Outlook & Hype Meter */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Zap size={12}/> Outlook</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{data.outlook}</p>
                    </div>
                </div>
                
                {/* Hype vs Reality Meter */}
                <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                        <span>Hype vs Reality</span>
                        <span className={data.hypeScore > 70 ? "text-rose-500" : "text-emerald-500"}>{data.hypeScore > 70 ? "High Hype" : "Balanced"}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${data.hypeScore > 70 ? 'bg-rose-500' : data.hypeScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${data.hypeScore}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedArticle, 
  messages,
  onSendMessage,
  loading,
  botAvatarUrl,
  onFeedback,
  onSmartAction
}) => {
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  // Mention System State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [triggerType, setTriggerType] = useState<'@' | '#' | '/' | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);
  
  // Living Tickers State
  const [quickPeekTicker, setQuickPeekTicker] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, activeFeedbackId]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
          inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

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
      } else if (currentWord.startsWith('#')) {
          setTriggerType('#');
          setMentionQuery(currentWord.substring(1));
          setShowSuggestions(true);
      } else if (currentWord.startsWith('/') && words.length === 1) {
          setTriggerType('/');
          setMentionQuery(currentWord.substring(1));
          setShowSuggestions(true);
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
      const textBeforeCursor = val.substring(0, cursorIndex);
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1];
      const startPos = textBeforeCursor.lastIndexOf(lastWord);
      
      if (triggerType === '/') {
          // Commands
          if (item.symbol === 'portfolio') {
              onSendMessage("/portfolio");
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

  const handleIntentAction = (docType: DocumentType) => {
      if (!selectedTicker) return;
      
      // Use the specific smart action handler passed from App.tsx
      onSmartAction(selectedTicker.symbol, docType);
      
      setShowIntentMenu(false);
      setSelectedTicker(null);
      setInputValue('');
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
      setShowSuggestions(false);
      setShowIntentMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (showSuggestions && filteredSuggestions.length > 0) {
            handleSelectSuggestion(filteredSuggestions[0]);
            e.preventDefault();
        } else {
            handleSend();
        }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDislikeAction = (action: string) => {
      if (action === 'too_complex') {
          onSendMessage("That was too complex. Explain it like I'm 5.");
      } else if (action === 'inaccurate') {
          onSendMessage("I think there is an inaccuracy. Can you verify the source?");
      } else if (action === 'too_long') {
          onSendMessage("That was too long. Please summarize the key points in 3 short bullets.");
      } else if (action === 'missed_point') {
          onSendMessage("I think you missed the most important part. Can you re-analyze the key impact?");
      }
      setActiveFeedbackId(null); // Close options
  };

  // Sentiment Gauge Component
  const SentimentGauge = ({ score }: { score: number }) => {
    const isBullish = score > 20;
    const isBearish = score < -20;
    const color = isBullish ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : isBearish ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700';
    const LabelIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;
    const label = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
    const percentage = Math.min(Math.max(((score + 100) / 200) * 100, 0), 100);

    return (
      <div className="mt-3 mb-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Market Sentiment</span>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${color}`}>
            <LabelIcon size={14} />
            {label} ({score > 0 ? '+' : ''}{score})
          </div>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-rose-500 via-gray-300 to-emerald-500" style={{ width: '100%' }}>
            <div className="h-full w-1 bg-black dark:bg-white relative" style={{ left: `${percentage}%`, transition: 'left 0.5s ease' }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/20 dark:bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Quick Peek Drawer (Stacked on top of Sidebar) */}
      {quickPeekTicker && (
          <QuickPeekDrawer ticker={quickPeekTicker} onClose={() => setQuickPeekTicker(null)} />
      )}

      {/* Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-50 flex flex-col border-l border-transparent dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-none h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px]">
                    <img src={botAvatarUrl} alt="AI" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">FinGenie</h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">AI Financial Analyst</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900 transition-colors">
          {/* Context Card if Article selected */}
          {selectedArticle && messages.length === 0 && (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
                 <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">Context</span>
                     <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{selectedArticle.source}</span>
                 </div>
                 <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{selectedArticle.title}</h3>
                 <div className="text-xs text-gray-600 dark:text-gray-300 flex gap-2">
                     <button onClick={() => onSendMessage("Summarize this")} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400">Summarize</button>
                     <button onClick={() => onSendMessage("Analyze impact")} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400">Impact</button>
                 </div>
             </div>
          )}

          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[90%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                
                {msg.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm border border-gray-200 dark:border-gray-700 text-sm relative group">
                    
                    <div className="prose dark:prose-invert prose-sm max-w-none mb-2">
                         <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                li: ({node, ...props}) => (
                                    <li className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300" {...props}>
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                        <span className="flex-1">
                                            {React.Children.map(props.children, child => {
                                                if (typeof child === 'string') {
                                                    return <TickerChipWrapper text={child} onTickerClick={setQuickPeekTicker} />;
                                                }
                                                return child;
                                            })}
                                        </span>
                                    </li>
                                ),
                                p: ({node, ...props}) => (
                                    <p className="mb-4" {...props}>
                                        {React.Children.map(props.children, child => {
                                            if (typeof child === 'string') {
                                                return <TickerChipWrapper text={child} onTickerClick={setQuickPeekTicker} />;
                                            }
                                            return child;
                                        })}
                                    </p>
                                ),
                            }}
                         >
                             {msg.text}
                         </ReactMarkdown>
                    </div>

                    {/* Widgets */}
                    {msg.sentimentScore !== undefined && <SentimentGauge score={msg.sentimentScore} />}
                    
                    {/* Structured News Insight */}
                    {msg.insightData && (
                        <SmartInsightCard data={msg.insightData} />
                    )}

                    {msg.chartData && (
                         <div className="mt-4 mb-2">
                             <DynamicChart data={msg.chartData} />
                         </div>
                    )}

                    {msg.dominoData && (
                         <div className="mt-4 mb-2 overflow-hidden">
                             <DominoGraph data={msg.dominoData} targetTicker="Target" />
                         </div>
                    )}

                    {msg.portfolioReport && (
                         <div className="mt-4">
                             <PortfolioWidget data={msg.portfolioReport} />
                         </div>
                    )}
                    
                    {/* Feedback & Copy Actions */}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                            <button 
                                onClick={() => handleCopy(msg.text, msg.id)}
                                className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                                title="Copy text"
                            >
                                {copiedId === msg.id ? <Check size={14}/> : <Copy size={14}/>}
                            </button>
                        </div>
                        <div className="flex gap-1 relative">
                            <button 
                                onClick={() => onFeedback(msg.id, 'liked')}
                                className={`p-1 rounded transition-colors ${msg.liked ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400 hover:text-emerald-500'}`}
                            >
                                <ThumbsUp size={14}/>
                            </button>
                            <button 
                                onClick={() => {
                                    onFeedback(msg.id, 'disliked');
                                    setActiveFeedbackId(activeFeedbackId === msg.id ? null : msg.id);
                                }}
                                className={`p-1 rounded transition-colors ${msg.disliked ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-400 hover:text-rose-500'}`}
                            >
                                <ThumbsDown size={14}/>
                            </button>

                            {/* Dislike Feedback Menu */}
                            {activeFeedbackId === msg.id && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10 animate-fade-in">
                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Tell us more</div>
                                    <button onClick={() => handleDislikeAction('too_complex')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Too complex / jargon</button>
                                    <button onClick={() => handleDislikeAction('inaccurate')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Inaccurate info</button>
                                    <button onClick={() => handleDislikeAction('too_long')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Too long / verbose</button>
                                    <button onClick={() => handleDislikeAction('missed_point')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Missed the point</button>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 mt-1 block px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {loading && <SidebarLoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {!loading && messages.length === 0 && !selectedArticle && (
            <div className="px-4 pt-2 pb-0 bg-gray-50 dark:bg-gray-900 flex gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => onSendMessage("Market Outlook")} className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm">Market Outlook</button>
                <button onClick={() => onSendMessage("My Portfolio Risk")} className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm">Portfolio Risk</button>
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 relative">
             {/* Intent Menu for Smart Actions */}
             {showIntentMenu && selectedTicker && (
                <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-64 animate-slide-up">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700 mb-1 flex justify-between">
                        <span>Analyze {selectedTicker.symbol}</span>
                        <button onClick={() => setShowIntentMenu(false)}><X size={12}/></button>
                    </div>
                    <button onClick={() => handleIntentAction('annual_report')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><FileText size={14} className="text-blue-500"/> Annual Report Analysis</button>
                    <button onClick={() => handleIntentAction('concall')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><Phone size={14} className="text-emerald-500"/> Earnings Call Analysis</button>
                    <button onClick={() => handleIntentAction('red_flags')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><AlertOctagon size={14} className="text-red-500"/> Forensic Scan</button>
                    <button onClick={() => handleIntentAction('quarterly_result')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><PieChart size={14} className="text-purple-500"/> Quarterly Results</button>
                    <button onClick={() => handleIntentAction('supply_chain')} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"><Factory size={14} className="text-orange-500"/> Supply Chain Map</button>
                </div>
            )}

             {/* Autocomplete Suggestions */}
             {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-72 overflow-hidden animate-slide-up">
                    {/* Suggestion Header with Helpful Tips */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                        {triggerType === '@' && (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <Building2 size={14} />
                                <span className="text-xs font-bold uppercase">Analyze Companies</span>
                            </div>
                        )}
                        {triggerType === '#' && (
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                <Globe size={14} />
                                <span className="text-xs font-bold uppercase">Economic Context</span>
                            </div>
                        )}
                        {triggerType === '/' && (
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                <Terminal size={14} />
                                <span className="text-xs font-bold uppercase">Command Center</span>
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {triggerType === '@' ? "Mention to fetch earnings, news, & analysis." : 
                             triggerType === '#' ? "Compare assets against macro indicators." : 
                             "Run specialized AI workflows instantly."}
                        </p>
                    </div>

                    {filteredSuggestions.map(t => (
                        <button 
                            key={t.symbol}
                            onClick={() => handleSelectSuggestion(t)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0 flex justify-between items-center group/item"
                        >
                            <div className="min-w-0">
                                <span className="block font-bold text-sm text-gray-800 dark:text-white group-hover/item:text-blue-600 truncate">
                                    {triggerType === '#' ? '#' : triggerType === '/' ? '/' : ''}{t.symbol}
                                </span>
                                <span className="block text-xs text-gray-500 truncate">{t.name}</span>
                                {t.description && <span className="block text-[10px] text-gray-400 italic truncate mt-0.5">{t.description}</span>}
                            </div>
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap ml-2">{t.type}</span>
                        </button>
                    ))}
                </div>
             )}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question... (Type @ for stocks, # for macros, / for tools)"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                        disabled={loading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MessageCircle size={18} />
                    </div>
                </div>
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-blue-500/30"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

// Helper component to parse text nodes and replace tickers with chips (Copied from FinGeniePage)
const TickerChipWrapper = ({ text, onTickerClick }: { text: string; onTickerClick: (t: string) => void }) => {
    const tickers = SEARCHABLE_TICKERS.map(t => t.symbol);
    
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

export default Sidebar;
