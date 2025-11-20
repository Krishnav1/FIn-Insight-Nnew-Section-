import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Send, User, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Article, ChatMessage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArticle: Article | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  loading: boolean;
  botAvatarUrl: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedArticle, 
  messages,
  onSendMessage,
  loading,
  botAvatarUrl
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
          inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
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
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                style={{ animationDelay: `${idx * 0.05}s` }}
            >
                <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                        }`}>
                            {/* Basic newline parsing */}
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={`min-h-[1em] ${i < msg.text.split('\n').length - 1 ? 'mb-2' : ''}`}>
                                    {line.replace(/[*#]/g, '')}
                                </p>
                            ))}
                        </div>
                        
                        {msg.sentimentScore !== undefined && (
                            <div className="w-full mt-1 animate-fade-in">
                                <SentimentGauge score={msg.sentimentScore} />
                            </div>
                        )}

                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
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
        <div className="flex-none p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors z-10">
             {/* Suggestion Chips */}
             {!loading && currentSuggestions.length > 0 && (
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
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask FinGenie..."
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