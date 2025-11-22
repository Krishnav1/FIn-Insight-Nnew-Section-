import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Send, TrendingUp, TrendingDown, Minus, Copy, ThumbsUp, ThumbsDown, Check, MessageCircle, FileText, Search, AlertOctagon, PieChart, Phone, Factory, Pin } from 'lucide-react';
import { Article, ChatMessage, TickerSearchItem, DocumentType, PinnedItem } from '../types';
import { SEARCHABLE_TICKERS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';
import DominoGraph from './DominoGraph';
import PortfolioWidget from './PortfolioWidget';
import TickerChip from './TickerChip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArticle: Article | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  loading: boolean;
  botAvatarUrl: string;
  onFeedback: (messageId: string, type: 'liked' | 'disliked') => void;
  onSmartAction: (ticker: string, docType: DocumentType) => void;
}

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
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);

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

      // Detect @ mention
      const lastAtPos = val.lastIndexOf('@', cursorPos - 1);
      if (lastAtPos !== -1) {
          const query = val.substring(lastAtPos + 1, cursorPos);
          // Only show if query doesn't contain spaces (or is short)
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
      ).slice(0, 5); // Limit to 5
  }, [mentionQuery]);

  const handleSelectSuggestion = (ticker: TickerSearchItem) => {
      if (!inputRef.current) return;
      
      const val = inputValue;
      const lastAtPos = val.lastIndexOf('@', cursorIndex - 1);
      
      const newVal = val.substring(0, lastAtPos) + `@${ticker.symbol} ` + val.substring(cursorIndex);
      setInputValue(newVal);
      setShowSuggestions(false);
      setMentionQuery(null);
      
      // Trigger Intent Menu
      setSelectedTicker(ticker);
      setShowIntentMenu(true);
      
      // Reset focus
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
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Widgets */}
                    {msg.sentimentScore !== undefined && <SentimentGauge score={msg.sentimentScore} />}
                    
                    {msg.chartData && (
                        <div className="mt-4 mb-2 h-64 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          
          {loading && (
            <div className="flex justify-start animate-pulse">
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
          )}
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
                <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-64 overflow-hidden animate-slide-up">
                    {filteredSuggestions.map(t => (
                        <button 
                            key={t.symbol}
                            onClick={() => handleSelectSuggestion(t)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0 flex justify-between items-center group/item"
                        >
                            <div>
                                <span className="block font-bold text-sm text-gray-800 dark:text-white group-hover/item:text-blue-600">{t.symbol}</span>
                                <span className="block text-xs text-gray-500">{t.name}</span>
                            </div>
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">{t.type}</span>
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
                        placeholder="Ask a question... (Type @ for stock actions)"
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

export default Sidebar;