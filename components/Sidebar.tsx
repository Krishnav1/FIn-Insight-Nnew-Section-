import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Sparkles, Send, User, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Article, ChatMessage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArticle: Article | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedArticle, 
  messages,
  onSendMessage,
  loading
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
      // Slight delay to ensure transition doesn't jank focus
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
    // -100 to 100
    const isBullish = score > 20;
    const isBearish = score < -20;
    const color = isBullish ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : isBearish ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700';
    const LabelIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;
    const label = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
    
    // Convert -100..100 to 0..100 for width
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
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
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
    // Only show defaults if no messages yet (start of conversation)
    if (messages.length === 0) {
      return ['What are the risks?', 'Impact on peers?', 'Long-term outlook?'];
    }
    return [];
  }, [lastModelMessage, messages.length]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
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
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
                <span className="font-bold text-gray-800 dark:text-white text-lg tracking-tight block leading-none">FinGenie</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Assistant</span>
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
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-900/50 space-y-4 transition-colors">
          {messages.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Sparkles className="w-12 h-12 mb-4 text-blue-300 dark:text-blue-500 opacity-50" />
                <p className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">Ready to analyze.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] mb-4">
                  Ask specific questions about this article's impact on your portfolio.
                </p>
                <div className="flex items-start gap-2 text-[10px] bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-700 dark:text-amber-400 text-left">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>AI can make mistakes. Verify important financial data independently.</p>
                </div>
             </div>
          )}

          {messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === 'user' 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                    }`}>
                        {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-gray-800 dark:bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none'
                        }`}>
                            {/* Basic newline parsing */}
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={`min-h-[1em] ${i < msg.text.split('\n').length - 1 ? 'mb-2' : ''}`}>
                                    {line.replace(/[*#]/g, '')}
                                </p>
                            ))}
                        </div>
                        
                        {/* Sentiment Visualization if present */}
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
            <div className="flex w-full justify-start">
                 <div className="flex max-w-[85%] gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                        <Sparkles size={14} />
                    </div>
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                 </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors">
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

            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask FinGenie about this article..."
                    className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    disabled={loading}
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
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