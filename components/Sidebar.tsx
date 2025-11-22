
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Send, User, TrendingUp, TrendingDown, Minus, AlertTriangle, Copy, ThumbsUp, ThumbsDown, Check, MessageCircle, FileText, Search, AlertOctagon, PieChart, Phone } from 'lucide-react';
import { Article, ChatMessage, TickerSearchItem, DocumentType } from '../types';
import { SEARCHABLE_TICKERS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';

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

  // Get current suggestions
  const lastModelMessage = useMemo(() => 
    messages.filter(m => m.role === 'model').pop(), 
    [messages]
  );

  const currentSuggestions = useMemo(() => {
    if (lastModelMessage?.suggestions && lastModelMessage.suggestions.length > 0) {
      return lastModelMessage.suggestions;
    }
    if (messages.length === 0) {
      return ['What are the risks?', 'Impact on peers?', 'Long-term outlook?'];
    }
    return [];
  }, [lastModelMessage, messages.length]);

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
        <div className="flex-none h-16 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
                <img 
                    src={botAvatarUrl} 
                    alt="FinGenie" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" 
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
            </div>
            <div>
                <span className="font-bold text-gray-800 dark:text-white text-lg tracking-tight block leading-none">FinGenie</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">AI Assistant</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Article Context Banner */}
        {selectedArticle && (
            <div className="flex-none bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 px-6 py-3 flex items-start gap-3 transition-colors">
                <div className="min-w-[3px] h-full bg-blue-400 rounded-full self-stretch"></div>
                <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-0.5">Active Context</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{selectedArticle.title}</p>
                </div>
            </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-900/50 space-y-6 transition-colors">
          
          {/* Empty State with Floating Genie */}
          {messages.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="relative w-32 h-32 mb-6 animate-float">
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                    <img 
                        src={botAvatarUrl} 
                        alt="FinGenie" 
                        className="relative w-full h-full object-contain drop-shadow-xl z-10" 
                    />
                </div>
                <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">I'm listening...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px] mb-6 leading-relaxed">
                  Ask me to summarize this article, analyze stock risks, or explain complex financial terms.
                </p>
                <div className="flex items-start gap-2 text-[11px] bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-700 dark:text-amber-400 text-left border border-amber-100 dark:border-amber-900/30">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>AI can make mistakes. Verify important financial data independently.</p>
                </div>
             </div>
          )}

          {messages.map((msg, idx) => (
            <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group/message`}
                style={{ animationDelay: `${idx * 0.05}s` }}
            >
                <div className={`flex max-w-[95%] sm:max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 self-end mb-1">
                        {msg.role === 'user' ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                <User size={14} />
                            </div>
                        ) : (
                            <img 
                                src={botAvatarUrl} 
                                alt="AI" 
                                className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-gray-700" 
                            />
                        )}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative group w-full overflow-hidden ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                        }`}>
                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Headings
                                        h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-3 mb-2 uppercase tracking-wide" {...props} />,
                                        
                                        // Lists
                                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 my-3 space-y-2 text-gray-700 dark:text-gray-300 marker:text-blue-500 dark:marker:text-blue-400" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 my-3 space-y-2 text-gray-700 dark:text-gray-300 marker:font-bold marker:text-blue-500 dark:marker:text-blue-400" {...props} />,
                                        li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
                                        
                                        // Text styles
                                        p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300 last:mb-0" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r" {...props} />,
                                        hr: ({node, ...props}) => <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />,

                                        // Table styling
                                        table: ({node, ...props}) => (
                                            <div className="my-4 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                                                </div>
                                            </div>
                                        ),
                                        thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800/80" {...props} />,
                                        tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props} />,
                                        tr: ({node, ...props}) => <tr className="transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10" {...props} />,
                                        th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />,
                                        td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props} />,
                                        
                                        // Code block styling
                                        code: ({node, className, children, ...props}: any) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const isInline = !match && !String(children).includes('\n');
                                            
                                            return isInline ? (
                                                <code className="bg-gray-100 dark:bg-gray-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <div className="my-4 rounded-lg overflow-hidden bg-gray-900 shadow-md">
                                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                                                        <span className="text-xs font-mono text-gray-400 lowercase">{match?.[1] || 'text'}</span>
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 overflow-x-auto">
                                                        <code className="text-sm font-mono text-gray-300 whitespace-pre" {...props}>
                                                            {children}
                                                        </code>
                                                    </div>
                                                </div>
                                            );
                                        },
                                        // Link styling
                                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>

                            {/* Copy & Feedback Actions (only for model) */}
                            {msg.role === 'model' && (
                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
                                    <button 
                                        onClick={() => handleCopy(msg.text, msg.id)}
                                        className="flex items-center gap-1 p-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                        <span className="hidden sm:inline">Copy</span>
                                    </button>
                                    
                                    <div className="flex items-center gap-1 ml-auto">
                                        <button 
                                            onClick={() => onFeedback(msg.id, 'liked')}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${msg.liked ? 'text-green-600' : 'text-gray-400'}`}
                                            title="Helpful"
                                        >
                                            <ThumbsUp size={12} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                onFeedback(msg.id, 'disliked');
                                                setActiveFeedbackId(msg.id === activeFeedbackId ? null : msg.id);
                                            }}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${msg.disliked ? 'text-red-600' : 'text-gray-400'}`}
                                            title="Not Helpful"
                                        >
                                            <ThumbsDown size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Smart Feedback Chips - Show when Disliked */}
                        {msg.disliked && activeFeedbackId === msg.id && (
                            <div className="mt-2 animate-fade-in flex flex-wrap gap-2">
                                <button 
                                    onClick={() => handleDislikeAction('too_complex')}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Too complex (ELI5)
                                </button>
                                <button 
                                    onClick={() => handleDislikeAction('too_long')}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Too long
                                </button>
                                <button 
                                    onClick={() => handleDislikeAction('inaccurate')}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Inaccurate
                                </button>
                                <button 
                                    onClick={() => handleDislikeAction('missed_point')}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Missed key point
                                </button>
                                <button 
                                    onClick={() => setActiveFeedbackId(null)}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                        
                        {msg.chartData && (
                             <DynamicChart data={msg.chartData} />
                        )}

                        {msg.sentimentScore !== undefined && (
                            <div className="w-full mt-1 animate-fade-in">
                                <SentimentGauge score={msg.sentimentScore} />
                            </div>
                        )}

                        <span className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 ${msg.role === 'model' ? 'mb-6' : ''}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
            </div>
          ))}

          {loading && (
            <div className="flex w-full justify-start animate-slide-up">
                 <div className="flex max-w-[85%] gap-3">
                    <div className="flex-shrink-0 self-end mb-1">
                        <div className="relative w-8 h-8">
                             <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                             <img src={botAvatarUrl} className="relative w-8 h-8 rounded-full object-cover border border-blue-200" alt="Thinking..." />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 px-5 py-4 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1.5 animate-pulse-glow">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                 </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors z-10 relative">
            {/* Intent Menu (Floating) */}
            {showIntentMenu && selectedTicker && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 animate-slide-up z-20">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                @{selectedTicker.symbol}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Selected</span>
                        </div>
                        <button onClick={() => setShowIntentMenu(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => handleIntentAction('annual_report')}
                            className="flex items-center gap-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-left"
                        >
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-md"><FileText size={16} /></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Annual Report</span>
                                <span className="text-[10px] text-gray-500">Strategy Analysis</span>
                            </div>
                        </button>
                        <button 
                             onClick={() => handleIntentAction('concall')}
                             className="flex items-center gap-2 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left"
                        >
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-md"><Phone size={16} /></div>
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Earnings Call</span>
                                <span className="text-[10px] text-gray-500">Skeptic Mode</span>
                            </div>
                        </button>
                        <button 
                             onClick={() => handleIntentAction('quarterly_result')}
                             className="flex items-center gap-2 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-left"
                        >
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-md"><PieChart size={16} /></div>
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Quarterly Results</span>
                                <span className="text-[10px] text-gray-500">Financial Health</span>
                            </div>
                        </button>
                         <button 
                             onClick={() => handleIntentAction('red_flags')}
                             className="flex items-center gap-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                        >
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-md"><AlertOctagon size={16} /></div>
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Red Flags</span>
                                <span className="text-[10px] text-gray-500">Forensic Scan</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Mention Suggestions (Floating) */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-30">
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700">
                        Suggested Tickers
                    </div>
                    {filteredSuggestions.map((ticker) => (
                        <button
                            key={ticker.symbol}
                            onClick={() => handleSelectSuggestion(ticker)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between group transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                            <div>
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200 block group-hover:text-blue-600 dark:group-hover:text-blue-400">{ticker.symbol}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{ticker.name}</span>
                            </div>
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                                {ticker.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}

             {/* Suggestion Chips (Standard) */}
             {!loading && !showIntentMenu && !showSuggestions && currentSuggestions.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                    {currentSuggestions.map((suggestion) => (
                        <button 
                            key={suggestion}
                            onClick={() => onSendMessage(suggestion)}
                            className="whitespace-nowrap px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
             )}

            <div className="relative flex items-center group">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={showIntentMenu ? `Asking about ${selectedTicker?.symbol}...` : "Ask FinGenie (Type @ for tickers)..."}
                    className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-gray-600"
                    disabled={loading}
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-transform active:scale-95 shadow-sm"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
