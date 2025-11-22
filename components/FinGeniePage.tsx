
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, Trash2, Search, X, FileText, Phone, PieChart, AlertOctagon, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { ChatMessage, TickerSearchItem, DocumentType } from '../types';
import { startChatSession, sendChatMessage, analyzeDocument } from '../services/geminiService';
import { USER_PORTFOLIO, SEARCHABLE_TICKERS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';

interface FinGeniePageProps {
  botAvatarUrl: string;
}

const FinGeniePage: React.FC<FinGeniePageProps> = ({ botAvatarUrl }) => {
  const [sessions, setSessions] = useState<{id: string, title: string, messages: ChatMessage[]}[]>([
      { id: '1', title: 'New Chat', messages: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Smart Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived active messages
  const activeMessages = useMemo(() => 
    sessions.find(s => s.id === activeSessionId)?.messages || [], 
    [sessions, activeSessionId]
  );

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, loading]);

  // Initialize Gemini Session on load or session switch
  useEffect(() => {
      // We use null for article to trigger General Analyst mode
      startChatSession(null, USER_PORTFOLIO, activeMessages);
  }, [activeSessionId]);

  const createNewSession = () => {
      const newId = Date.now().toString();
      setSessions(prev => [{ id: newId, title: 'New Chat', messages: [] }, ...prev]);
      setActiveSessionId(newId);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (sessions.length === 1) {
          setSessions([{ id: Date.now().toString(), title: 'New Chat', messages: [] }]);
          return;
      }
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (activeSessionId === id) {
          setActiveSessionId(newSessions[0].id);
      }
  };

  const updateSessionMessages = (msgs: ChatMessage[]) => {
      setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
              // Update title if it's the first user message
              let title = s.title;
              if (s.messages.length === 0 && msgs.length > 0) {
                  const firstMsg = msgs[0].text;
                  title = firstMsg.length > 30 ? firstMsg.substring(0, 30) + '...' : firstMsg;
              }
              return { ...s, title, messages: msgs };
          }
          return s;
      }));
  };

  const handleSendMessage = async (text: string) => {
      if (!text.trim()) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text,
          timestamp: Date.now()
      };

      const newHistory = [...activeMessages, userMsg];
      updateSessionMessages(newHistory);
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
          timestamp: Date.now()
      };

      updateSessionMessages([...newHistory, aiMsg]);
      setLoading(false);
  };

  // --- Mention & Intent Logic (Reused from Sidebar for consistency) ---
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

  const handleIntentAction = async (docType: DocumentType) => {
    if (!selectedTicker) return;
    
    setShowIntentMenu(false);
    setInputValue('');
    setLoading(true);

    const intentMap: Record<DocumentType, string> = {
        'annual_report': 'Annual Report',
        'concall': 'Earnings Call',
        'quarterly_result': 'Quarterly Results',
        'red_flags': 'Red Flags'
    };
    
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: `Analyze the ${intentMap[docType]} for ${selectedTicker.symbol}`,
        timestamp: Date.now()
    };

    const newHistory = [...activeMessages, userMsg];
    updateSessionMessages(newHistory);

    try {
        // Call specialized service which now returns chartData
        const { text, sentiment, chartData } = await analyzeDocument(selectedTicker.symbol, docType);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text,
            sentimentScore: sentiment,
            chartData: chartData, // Use the extracted chart data
            timestamp: Date.now()
        };
        updateSessionMessages([...newHistory, aiMsg]);
    } catch (e) {
        // Error handling
    } finally {
        setLoading(false);
        setSelectedTicker(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px-36px)] bg-white dark:bg-gray-900">
      {/* Sidebar History */}
      <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
            <button 
                onClick={createNewSession}
                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>New Chat</span>
            </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {sessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        activeSessionId === session.id 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                    }`}
                >
                    <MessageSquare size={16} className={activeSessionId === session.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                    <span className="text-sm truncate flex-1 font-medium text-gray-800 dark:text-gray-200">{session.title}</span>
                    <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-900">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              {activeMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                          <img src={botAvatarUrl} className="w-16 h-16 rounded-full object-cover" alt="FinGenie" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">FinGenie Workspace</h2>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">
                          Your dedicated environment for deep financial research, document analysis, and market intelligence.
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
                          <button onClick={() => handleSendMessage("What happens to Indian IT if the US enters a recession?")} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all group">
                              <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-emerald-600">Scenario Planning</span>
                              <span className="text-sm text-gray-500">"Impact of US recession on IT?"</span>
                          </button>
                          <button onClick={() => handleSendMessage("Find red flags in @ADANIENT recent reports")} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-all group">
                              <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-red-600">Forensic Scan</span>
                              <span className="text-sm text-gray-500">"Find red flags in @ADANIENT"</span>
                          </button>
                      </div>
                  </div>
              )}

              {activeMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 max-w-5xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'model' && (
                          <img src={botAvatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 mt-1" alt="Bot" />
                      )}
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-none px-5 py-3' : 'w-full'}`}>
                          <div className={`prose dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white' : ''}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 border-b pb-2" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                                        table: ({node, ...props}) => <div className="overflow-x-auto my-4 border rounded-lg"><table className="w-full text-sm text-left" {...props} /></div>,
                                        th: ({node, ...props}) => <th className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold" {...props} />,
                                        td: ({node, ...props}) => <td className="border-t border-gray-200 dark:border-gray-700 px-4 py-2" {...props} />,
                                        li: ({node, ...props}) => <li className="my-1" {...props} />,
                                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                          </div>

                          {msg.chartData && (
                                <DynamicChart data={msg.chartData} />
                          )}
                          
                          {msg.role === 'model' && (
                              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                  <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                      {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                  <div className="flex-1"></div>
                                  <button className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ThumbsUp size={14} /></button>
                                  <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ThumbsDown size={14} /></button>
                              </div>
                          )}
                      </div>
                  </div>
              ))}

              {loading && (
                  <div className="flex gap-4 max-w-5xl mx-auto">
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
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative">
                {/* Intent Menu */}
                {showIntentMenu && selectedTicker && (
                    <div className="absolute bottom-full left-4 mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-80 animate-slide-up z-20">
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
                                 <div><div className="text-sm font-bold">Earnings Call</div><div className="text-xs text-gray-500">Skeptic mode analysis</div></div>
                             </button>
                             <button onClick={() => handleIntentAction('quarterly_result')} className="w-full flex items-center gap-3 p-2 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                 <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded"><PieChart size={16} className="text-purple-600 dark:text-purple-400"/></div>
                                 <div><div className="text-sm font-bold">Quarterly Results</div><div className="text-xs text-gray-500">Financial Health</div></div>
                             </button>
                             <button onClick={() => handleIntentAction('red_flags')} className="w-full flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                                 <div className="bg-red-100 dark:bg-red-900 p-2 rounded"><AlertOctagon size={16} className="text-red-600 dark:text-red-400"/></div>
                                 <div><div className="text-sm font-bold">Red Flags</div><div className="text-xs text-gray-500">Forensic scan</div></div>
                             </button>
                        </div>
                    </div>
                )}

                {/* Mention Suggestions */}
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

              <div className="max-w-4xl mx-auto relative">
                  <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                      placeholder="Ask FinGenie anything (Use @ for tickers)..."
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
              <div className="max-w-4xl mx-auto mt-2 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">FinGenie can make mistakes. Consider checking important information.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default FinGeniePage;
