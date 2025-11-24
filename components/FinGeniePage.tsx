import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, X, FileText, Phone, AlertOctagon, Activity, Search, Factory, BrainCircuit, BarChart2, Shield, Scale, ChevronDown, ChevronUp, Zap, HelpCircle, TrendingUp, TrendingDown, DollarSign, MousePointer2, Terminal, Building2, Globe, Sparkles } from 'lucide-react';
import { ChatMessage, TickerSearchItem, DocumentType, PinnedItem, EvidenceDocument, BingoData } from '../types';
import { startChatSession, sendChatMessage, analyzeDocument, getPortfolioHealthReport } from '../services/geminiService';
import { USER_PORTFOLIO, SEARCHABLE_TICKERS, MACROS, COMMANDS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicChart from './DynamicChart';
import DominoGraph from './DominoGraph';
import PortfolioWidget from './PortfolioWidget';
import { fetchLiveNews } from '../services/geminiService';
import TickerChip from './TickerChip';
import QuickPeekDrawer from './QuickPeekDrawer';

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
        "Reading market data...",
        "Checking financial health...",
        "Analyzing sentiment...",
        "Looking for red flags...",
        "Comparing with peers...",
        "Synthesizing simple insights..."
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
                    <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce delay-200"></span>
                </div>
                <span className="text-xs font-mono text-theme-accent animate-pulse transition-all duration-500">
                    {loadingTexts[textIndex]}
                </span>
            </div>
        </div>
    );
};

const ReasoningAccordion = ({ thoughts }: { thoughts: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-theme-accent transition-colors bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-theme-border"
            >
                <BrainCircuit size={14} className={isOpen ? "text-theme-accent" : ""} />
                {isOpen ? "Hide AI Thought Process" : "See How I Thought About This"}
                {isOpen ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            
            {isOpen && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg animate-slide-up">
                     <p className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                         {thoughts}
                     </p>
                </div>
            )}
        </div>
    );
}

const EarningsBingo = ({ data }: { data: BingoData }) => {
    return (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="p-1 bg-purple-100 text-purple-600 rounded">🎯</span> 
                Earnings Bingo
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {data.wordCloud.map((w, i) => (
                    <span 
                        key={i} 
                        className={`text-xs px-2 py-1 rounded border font-medium ${
                            w.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 
                            w.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' : 
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                        }`}
                        style={{ fontSize: `${Math.max(10, Math.min(16, 10 + w.count))}px` }}
                    >
                        {w.word} ({w.count})
                    </span>
                ))}
            </div>

            <div className="h-24 flex items-end gap-1 border-b border-gray-200 dark:border-gray-700 pb-1">
                {data.sentimentTimeline.map((p, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                        <div 
                            className={`w-full rounded-t transition-all duration-300 ${p.sentiment >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                            style={{ height: `${Math.max(5, Math.abs(p.sentiment))}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                            {p.time}: {p.annotation} ({p.sentiment})
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Start</span>
                <span>End of Call</span>
            </div>
        </div>
    );
};

// --- NEW WORKFLOW WIZARD ---

type WizardType = 'compare' | 'risk' | 'valuation' | 'macro';

interface WorkflowWizardProps {
    type: WizardType;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
}

const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ type, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [inputs, setInputs] = useState<Record<string, string>>({});

    const getConfig = () => {
        switch(type) {
            case 'compare': return {
                title: "Stock Battle",
                icon: Scale,
                color: "text-orange-500",
                steps: [
                    { key: "stockA", label: "First Stock (e.g., TCS)", placeholder: "Enter symbol..." },
                    { key: "stockB", label: "Second Stock (e.g., Infosys)", placeholder: "Enter symbol..." },
                    { key: "focus", label: "What matters to you?", placeholder: "e.g., Dividend, Growth, Safety..." }
                ],
                promptTemplate: (i: any) => `Compare ${i.stockA} and ${i.stockB}. I am a retail investor interested in ${i.focus}. Create a comparison table and declare a winner.`
            };
            case 'risk': return {
                title: "Safety Check",
                icon: Shield,
                color: "text-red-500",
                steps: [
                    { key: "stock", label: "Which Stock?", placeholder: "Enter symbol..." },
                    { key: "concern", label: "Any specific worry?", placeholder: "e.g., Debt, Management, Competition" }
                ],
                promptTemplate: (i: any) => `Analyze the safety of ${i.stock}. I am worried about ${i.concern}. Look for red flags in the balance sheet and management quality. Be critical.`
            };
            case 'valuation': return {
                title: "Is it Overvalued?",
                icon: DollarSign,
                color: "text-emerald-500",
                steps: [
                    { key: "stock", label: "Which Stock?", placeholder: "Enter symbol..." },
                    { key: "horizon", label: "Investment Horizon", placeholder: "e.g., 5 years, Short term" }
                ],
                promptTemplate: (i: any) => `Is ${i.stock} overvalued or undervalued right now for a ${i.horizon} investor? Explain using simple valuation metrics like P/E and PEG ratio. Don't use complex jargon.`
            };
            case 'macro': return {
                title: "Market Simulator",
                icon: Activity,
                color: "text-blue-500",
                steps: [
                    { key: "event", label: "What happens?", placeholder: "e.g., Oil price hits $100, BJP wins election" },
                    { key: "sector", label: "Which sector?", placeholder: "e.g., Paints, Banking, Defense" }
                ],
                promptTemplate: (i: any) => `Simulate this scenario: ${i.event}. How would this impact the ${i.sector} sector in India? List the winners and losers.`
            };
            default: return null;
        }
    };

    const config = getConfig();
    if (!config) return null;

    const handleNext = () => {
        if (step < config.steps.length) {
            setStep(step + 1);
        } else {
            onSubmit(config.promptTemplate(inputs));
        }
    };

    return (
        <div className="absolute inset-x-4 bottom-24 top-auto bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 z-50 animate-slide-up max-w-lg mx-auto">
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18}/></button>
             
             <div className="flex items-center gap-3 mb-6">
                 <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${config.color}`}>
                     <config.icon size={24} />
                 </div>
                 <div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">{config.title}</h3>
                     <p className="text-xs text-gray-500">Step {step} of {config.steps.length}</p>
                 </div>
             </div>

             <div className="mb-6">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                     {config.steps[step-1].label}
                 </label>
                 <input 
                    autoFocus
                    type="text"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-accent outline-none"
                    placeholder={config.steps[step-1].placeholder}
                    value={inputs[config.steps[step-1].key] || ''}
                    onChange={(e) => setInputs({...inputs, [config.steps[step-1].key]: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                 />
             </div>

             <div className="flex justify-between items-center">
                 <div className="flex gap-1">
                     {config.steps.map((_, i) => (
                         <div key={i} className={`w-2 h-2 rounded-full ${i + 1 === step ? 'bg-theme-accent' : 'bg-gray-300 dark:bg-gray-700'}`} />
                     ))}
                 </div>
                 <button 
                    onClick={handleNext}
                    disabled={!inputs[config.steps[step-1].key]}
                    className="bg-theme-accent hover:bg-theme-accent/90 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     {step === config.steps.length ? 'Review Prompt' : 'Next'}
                 </button>
             </div>
        </div>
    );
};

// --- SIMPLIFIED GRID ---

const WorkflowSelector = ({ onSelect }: { onSelect: (type: WizardType) => void }) => {
    const workflows = [
        { id: 'compare', title: "Compare Stocks", desc: "Compare A vs B", example: "Compare TCS vs Infy for growth", icon: Scale, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10", border: "hover:border-orange-500" },
        { id: 'risk', title: "Safe or Risky?", desc: "Check for red flags", example: "Analyze Adani Ent debt risks", icon: Shield, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10", border: "hover:border-red-500" },
        { id: 'valuation', title: "Is it Overvalued?", desc: "Check price fairness", example: "Is Reliance overvalued now?", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "hover:border-emerald-500" },
        { id: 'macro', title: "What If...?", desc: "Simulate events", example: "Impact of oil at $100 on Paints", icon: Activity, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10", border: "hover:border-blue-500" },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mt-6 max-w-xl mx-auto">
            {workflows.map((w) => (
                <button 
                    key={w.id}
                    onClick={() => onSelect(w.id as WizardType)}
                    className={`p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-left transition-all hover:-translate-y-1 hover:shadow-md ${w.bg} ${w.border} group`}
                >
                    <div className={`mb-2 ${w.color}`}>
                        <w.icon size={20} />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:underline decoration-2 underline-offset-2">{w.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{w.desc}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono italic">
                        Try: "{w.example}"
                    </div>
                </button>
            ))}
        </div>
    );
}

// --- HELPER LEGEND COMPONENT ---

const InputLegend = ({ onTrigger }: { onTrigger: (char: string) => void }) => (
    <div className="flex items-center gap-3 px-2 mb-2">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quick Insert:</span>
        <button onClick={() => onTrigger('@')} className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
            @ Stocks
        </button>
        <button onClick={() => onTrigger('#')} className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded hover:bg-purple-100 transition-colors">
            # Macro
        </button>
        <button onClick={() => onTrigger('/')} className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded hover:bg-orange-100 transition-colors">
            / Tools
        </button>
    </div>
);

// --- CONTEXTUAL SUGGESTIONS ---

const ContextualSuggestions = ({ triggerType, item, onAction }: { triggerType: string, item: string, onAction: (text: string) => void }) => {
    if (!triggerType || !item) return null;

    const suggestions: Record<string, string[]> = {
        '@': ["Analyze Earnings", "Check Valuation", "Latest News", "Compare Peers"],
        '#': ["Analyze Sector Impact", "Market Trend", "Winners & Losers", "Historical Context"],
        '/': ["Run Default"]
    };

    const actions = suggestions[triggerType] || [];

    return (
        <div className="absolute bottom-full left-0 mb-3 px-2 animate-fade-in flex gap-2">
            <span className="text-xs text-gray-400 py-1">Suggested:</span>
            {actions.map(action => (
                <button 
                    key={action}
                    onClick={() => onAction(action)}
                    className="text-xs bg-theme-surface border border-theme-border text-theme-accent px-3 py-1 rounded-full hover:bg-theme-bg shadow-sm transition-colors flex items-center gap-1"
                >
                    <Sparkles size={10} /> {action}
                </button>
            ))}
        </div>
    );
}


// --- MAIN PAGE COMPONENT ---

const FinGeniePage: React.FC<FinGeniePageProps> = ({ botAvatarUrl }) => {
  // Tabs State
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
      { id: 'tab-1', title: 'General Chat', messages: [], evidence: null }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Input & UI State
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeWizard, setActiveWizard] = useState<WizardType | null>(null);
  const [quickPeekTicker, setQuickPeekTicker] = useState<string | null>(null);
  
  // Search Highlight
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mention System State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [triggerType, setTriggerType] = useState<'@' | '#' | '/' | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchItem | null>(null);
  const [showIntentMenu, setShowIntentMenu] = useState(false);
  
  // Suggested Actions State
  const [contextualItem, setContextualItem] = useState<string | null>(null);
  const [contextualType, setContextualType] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab.messages, loading, activeWizard]);

  useEffect(() => {
    if (activeTab.messages.length === 0) {
        startChatSession(null, USER_PORTFOLIO);
    }
  }, [activeTabId]);

  // --- Handlers ---

  const handleNewTab = () => {
      const newId = `tab-${Date.now()}`;
      setTabs(prev => [...prev, { id: newId, title: 'New Analysis', messages: [], evidence: null }]);
      setActiveTabId(newId);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (tabs.length === 1) return; // Don't close last tab
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const updateActiveTab = (updates: Partial<WorkspaceTab>) => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  // Input Change for Mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      
      const cursorPos = e.target.selectionStart || 0;
      setCursorIndex(cursorPos);

      // Check if user just deleted content, clear suggestions
      if (val === '') {
          setContextualItem(null);
          setContextualType(null);
      }

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

  const handleTriggerClick = (char: string) => {
      if (!inputRef.current) return;
      const val = inputValue;
      const newVal = val + (val.length > 0 && !val.endsWith(' ') ? ' ' : '') + char;
      setInputValue(newVal);
      inputRef.current.focus();
      // Manually trigger the state update that handleInputChange would do
      setTriggerType(char as any);
      setMentionQuery('');
      setShowSuggestions(true);
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
      
      if (triggerType === '/') {
          if (item.symbol === 'portfolio') {
              handleSendMessage("/portfolio");
          } else {
              setInputValue(`/${item.symbol} `);
          }
          setShowSuggestions(false);
          return;
      }

      const val = inputValue;
      const textBeforeCursor = val.substring(0, cursorIndex);
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1];
      const startPos = textBeforeCursor.lastIndexOf(lastWord);
      const prefix = triggerType || '';
      
      // Update input
      const newVal = val.substring(0, startPos) + `${prefix}${item.symbol} ` + val.substring(cursorIndex);
      setInputValue(newVal);
      
      // Set Contextual State for Suggestion Pills
      setContextualType(prefix);
      setContextualItem(item.symbol);

      setShowSuggestions(false);
      setMentionQuery(null);
      
      if (triggerType === '@') {
          setSelectedTicker(item);
          // Don't show intent menu automatically if we are showing contextual pills, keeps UI cleaner
          // setShowIntentMenu(true); 
      }
      inputRef.current.focus();
  };

  const handleContextualAction = (action: string) => {
      if (!contextualItem) return;
      const finalPrompt = `${action} for ${contextualItem}`;
      setInputValue(finalPrompt);
      setContextualItem(null); // Clear context after selection
      // Optional: focus input so user can hit enter or edit
      inputRef.current?.focus();
  };

  // --- CORE AI ACTIONS ---

  const handleSendMessage = async (text: string) => {
      if (!text.trim()) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text,
          timestamp: Date.now()
      };
      
      updateActiveTab({ messages: [...activeTab.messages, userMsg] });
      setInputValue('');
      setShowSuggestions(false);
      setShowIntentMenu(false);
      setContextualItem(null);
      setActiveWizard(null); // Close wizard if open
      setLoading(true);

      // Handle Special Command: /portfolio
      if (text.toLowerCase().includes('/portfolio') || text.toLowerCase() === 'check portfolio health') {
          try {
             const fetchedNews = await fetchLiveNews();
             const report = await getPortfolioHealthReport(USER_PORTFOLIO, fetchedNews || []);
             if (report) {
                 const botMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: "I've analyzed your portfolio health against today's news. Here is your Command Center report:",
                    portfolioReport: report,
                    thoughts: "1. Fetched live news for portfolio tickers.\n2. Cross-referenced news sentiment with holdings.\n3. Calculated concentration risk based on current market cap.\n4. Generated attribution analysis for daily movements.",
                    timestamp: Date.now()
                 };
                 updateActiveTab({ messages: [...activeTab.messages, userMsg, botMsg] });
                 setLoading(false);
                 return;
             }
          } catch(e) { console.error(e); }
      }

      try {
          const result = await sendChatMessage(text);
          const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: result.text,
              thoughts: result.thoughts,
              sentimentScore: result.sentiment,
              suggestions: result.suggestions,
              chartData: result.chartData,
              dominoData: result.dominoData,
              insightData: result.insightData,
              timestamp: Date.now()
          };
          
          setTabs(prev => prev.map(t => {
              if (t.id === activeTabId) {
                  return { ...t, messages: [...t.messages, aiMsg] };
              }
              return t;
          }));
          
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const handleWizardSubmit = (prompt: string) => {
      setInputValue(prompt);
      setActiveWizard(null);
      inputRef.current?.focus();
  };

  const handleSmartAction = async (ticker: string, docType: DocumentType) => {
      setLoading(true);
      setShowIntentMenu(false);
      setInputValue('');
      
      const intentMap: Record<DocumentType, string> = {
          'annual_report': 'Annual Report Analysis',
          'concall': 'Earnings Call Analysis',
          'quarterly_result': 'Quarterly Results',
          'red_flags': 'Forensic Red Flags',
          'supply_chain': 'Supply Chain Map'
      };

      updateActiveTab({ 
          title: `${ticker} ${intentMap[docType]}`, 
          ticker, 
          docType,
          messages: [...activeTab.messages, {
              id: Date.now().toString(),
              role: 'user',
              text: `Analyze ${intentMap[docType]} for ${ticker}`,
              timestamp: Date.now()
          }]
      });

      try {
          const { text, thoughts, sentiment, chartData, bingoData, dominoData, sourceDocument } = await analyzeDocument(ticker, docType);
          
          setTabs(prev => prev.map(t => {
              if (t.id === activeTabId) {
                  return {
                      ...t,
                      evidence: {
                          title: `${ticker} Source Doc`,
                          type: docType,
                          content: sourceDocument || "No source text available.",
                          ticker,
                          bingoData
                      },
                      messages: [...t.messages, {
                          id: (Date.now() + 1).toString(),
                          role: 'model',
                          text: text,
                          thoughts: thoughts,
                          sentimentScore: sentiment,
                          chartData,
                          dominoData,
                          timestamp: Date.now()
                      }]
                  }
              }
              return t;
          }));

      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  // Helper to safely render markdown children without [object Object] bug
  const renderChildren = (children: React.ReactNode) => {
      return React.Children.map(children, child => {
          if (typeof child === 'string') {
              return <TickerChipWrapper text={child} />;
          }
          return child;
      });
  };

  // Helper component for ticker chips in text
  const TickerChipWrapper = ({ text }: { text: string }) => {
    const tickers = SEARCHABLE_TICKERS.map(t => t.symbol);
    const escapedTickers = tickers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
    if (escapedTickers.length === 0) return <>{text}</>;
    
    const regex = new RegExp(`\\b(${escapedTickers.join('|')})\\b`, 'g');
    const parts = text.split(regex);
    
    return (
        <>
            {parts.map((part, i) => {
                if (tickers.includes(part)) {
                    return <TickerChip key={i} ticker={part} onClick={setQuickPeekTicker} />;
                }
                return part;
            })}
        </>
    );
  }

  return (
    <div className="flex h-full bg-theme-bg text-theme-text font-sans overflow-hidden">
        
        {/* Quick Peek Drawer */}
        {quickPeekTicker && (
            <QuickPeekDrawer ticker={quickPeekTicker} onClose={() => setQuickPeekTicker(null)} />
        )}

        {/* LEFT PANEL: CHAT WORKSPACE */}
        <div className={`flex flex-col border-r border-theme-border transition-all duration-300 ${activeTab.evidence ? 'w-1/2' : 'w-full max-w-5xl mx-auto'}`}>
            
            {/* Tab Bar */}
            <div className="h-10 flex items-center bg-theme-surface border-b border-theme-border px-2 gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium cursor-pointer min-w-[120px] max-w-[200px] border-t border-x transition-colors
                            ${activeTabId === tab.id 
                                ? 'bg-theme-bg border-theme-border text-theme-accent' 
                                : 'bg-theme-surface border-transparent text-theme-muted hover:bg-theme-bg hover:text-theme-text'}
                        `}
                    >
                        <span className="truncate flex-1">{tab.title}</span>
                        <button 
                            onClick={(e) => handleCloseTab(e, tab.id)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-theme-surface p-0.5 rounded text-theme-muted"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                <button onClick={handleNewTab} className="p-1 hover:bg-theme-surface rounded text-theme-muted hover:text-theme-text transition-colors">
                    <Plus size={16} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-theme-bg relative">
                {activeTab.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-90 animate-fade-in pb-16">
                        <div className="w-16 h-16 bg-theme-surface rounded-2xl flex items-center justify-center mb-4 ring-1 ring-theme-border shadow-lg">
                            <Terminal size={32} className="text-theme-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-theme-text mb-2">Hello, Investor.</h3>
                        <p className="text-sm max-w-md text-theme-muted mb-8 leading-relaxed">
                            I am FinGenie, your retail investment analyst. I can help you check stock safety, valuations, and market trends simply.
                        </p>
                        
                        {/* New Retail Friendly Workflow Selector */}
                        <div className="w-full">
                            <h4 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Quick Actions</h4>
                            <WorkflowSelector onSelect={(t) => setActiveWizard(t)} />
                        </div>
                    </div>
                ) : (
                    activeTab.messages.map((msg) => (
                         <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                             {msg.role === 'model' && (
                                 <div className="w-8 h-8 rounded-full bg-theme-surface mr-3 flex items-center justify-center shrink-0 border border-theme-border">
                                     <img src={botAvatarUrl} alt="AI" className="w-6 h-6 rounded-full" />
                                 </div>
                             )}
                             <div className={`max-w-[90%] ${msg.role === 'user' ? 'bg-theme-accent text-white rounded-2xl rounded-tr-sm px-4 py-3' : 'w-full'}`}>
                                 {msg.role === 'model' ? (
                                     <div className="space-y-4">
                                         
                                         {/* Chain of Thought UI */}
                                         {msg.thoughts && <ReasoningAccordion thoughts={msg.thoughts} />}

                                         {/* Text Content */}
                                         <div className="prose dark:prose-invert prose-sm max-w-none">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="leading-relaxed text-theme-text" {...props}>{renderChildren(props.children)}</p>,
                                                    li: ({node, ...props}) => <li className="text-theme-text" {...props}>{renderChildren(props.children)}</li>,
                                                    strong: ({node, ...props}) => <strong className="text-theme-text font-bold" {...props} />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                         </div>

                                         {/* Dynamic Widgets */}
                                         {msg.chartData && <DynamicChart data={msg.chartData} />}
                                         {msg.dominoData && <DominoGraph data={msg.dominoData} targetTicker="Target" />}
                                         {msg.portfolioReport && <PortfolioWidget data={msg.portfolioReport} />}
                                         
                                         {/* Sentiment Gauge */}
                                         {msg.sentimentScore !== undefined && (
                                             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-surface border border-theme-border text-xs font-bold">
                                                 <Activity size={12} className={msg.sentimentScore > 0 ? 'text-emerald-500' : 'text-rose-500'} />
                                                 Sentiment: <span className={msg.sentimentScore > 0 ? 'text-emerald-500' : 'text-rose-500'}>{msg.sentimentScore > 0 ? '+' : ''}{msg.sentimentScore}</span>
                                             </div>
                                         )}
                                     </div>
                                 ) : (
                                     <div className="text-sm font-medium">{msg.text}</div>
                                 )}
                             </div>
                         </div>
                    ))
                )}
                {loading && <LoadingIndicator avatarUrl={botAvatarUrl} />}
                
                {/* Active Wizard Overlay */}
                {activeWizard && (
                    <WorkflowWizard 
                        type={activeWizard} 
                        onClose={() => setActiveWizard(null)} 
                        onSubmit={handleWizardSubmit}
                    />
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-theme-surface border-t border-theme-border relative z-20">
                {/* Intent Menu */}
                {showIntentMenu && selectedTicker && (
                    <div className="absolute bottom-full left-4 mb-2 bg-theme-surface rounded-xl shadow-2xl border border-theme-border p-2 w-72 animate-slide-up overflow-hidden">
                        <div className="px-3 py-2 text-[10px] font-bold text-theme-muted uppercase border-b border-theme-border mb-1 flex justify-between items-center bg-theme-bg/50">
                            <span>Analysis for {selectedTicker.symbol}</span>
                            <button onClick={() => setShowIntentMenu(false)}><X size={12} /></button>
                        </div>
                        <button onClick={() => handleSmartAction(selectedTicker.symbol, 'annual_report')} className="w-full text-left p-2.5 hover:bg-theme-bg rounded flex items-center gap-3 text-xs font-bold text-theme-text transition-colors"><FileText size={14} className="text-blue-500"/> Annual Report Deep Dive</button>
                        <button onClick={() => handleSmartAction(selectedTicker.symbol, 'concall')} className="w-full text-left p-2.5 hover:bg-theme-bg rounded flex items-center gap-3 text-xs font-bold text-theme-text transition-colors"><Phone size={14} className="text-purple-500"/> Earnings Call Sentiment</button>
                        <button onClick={() => handleSmartAction(selectedTicker.symbol, 'red_flags')} className="w-full text-left p-2.5 hover:bg-theme-bg rounded flex items-center gap-3 text-xs font-bold text-theme-text transition-colors"><AlertOctagon size={14} className="text-red-500"/> Safety Check (Red Flags)</button>
                    </div>
                )}
                
                {/* Autocomplete */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 bg-theme-surface rounded-xl shadow-2xl border border-theme-border w-72 overflow-hidden animate-slide-up z-30">
                        {/* Header */}
                         <div className="px-3 py-2 bg-theme-bg border-b border-theme-border">
                             <div className="flex items-center gap-2">
                                {triggerType === '@' && <Building2 size={12} className="text-blue-400"/>}
                                {triggerType === '#' && <Globe size={12} className="text-purple-400"/>}
                                {triggerType === '/' && <Terminal size={12} className="text-orange-400"/>}
                                <span className="text-[10px] font-bold uppercase text-theme-muted">
                                    {triggerType === '@' ? 'Select Stock' : triggerType === '#' ? 'Select Macro' : 'Commands'}
                                </span>
                             </div>
                         </div>
                         {filteredSuggestions.map(t => (
                             <button
                                key={t.symbol}
                                onClick={() => handleSelectSuggestion(t)}
                                className="w-full text-left px-4 py-3 hover:bg-theme-bg/50 border-b border-theme-border last:border-0 flex justify-between items-center group transition-colors"
                             >
                                 <div>
                                     <span className="block font-bold text-sm text-theme-text group-hover:text-theme-accent">{t.symbol}</span>
                                     <span className="block text-xs text-theme-muted">{t.name}</span>
                                 </div>
                                 <span className="text-[10px] bg-theme-bg text-theme-muted px-1.5 py-0.5 rounded">{t.type}</span>
                             </button>
                         ))}
                    </div>
                )}
                
                {/* Contextual Suggestion Pills (Appears after selecting # or @) */}
                {(contextualItem && !showSuggestions) && (
                    <ContextualSuggestions 
                        triggerType={contextualType || ''} 
                        item={contextualItem} 
                        onAction={handleContextualAction} 
                    />
                )}

                {/* Input Legend Bar */}
                <InputLegend onTrigger={handleTriggerClick} />

                <div className="relative flex items-center gap-2">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (showSuggestions && filteredSuggestions.length > 0) {
                                    handleSelectSuggestion(filteredSuggestions[0]);
                                    e.preventDefault();
                                } else {
                                    handleSendMessage(inputValue);
                                }
                            }
                        }}
                        placeholder="Type here... (e.g. Compare TCS vs Infy)"
                        className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50 transition-all placeholder-theme-muted text-theme-text"
                        disabled={loading}
                    />
                    <button 
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim() || loading}
                        className="p-3 bg-theme-accent hover:bg-theme-accent/80 disabled:bg-theme-surface disabled:text-theme-muted text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: EVIDENCE / DOCUMENT VIEWER (CONDITIONAL) */}
        {activeTab.evidence && (
            <div className="w-1/2 flex flex-col bg-theme-surface border-l border-theme-border animate-slide-left">
                {/* Header */}
                <div className="h-10 flex items-center justify-between px-4 border-b border-theme-border bg-theme-bg">
                    <div className="flex items-center gap-2 text-xs font-bold text-theme-text">
                        <FileText size={14} className="text-blue-500" />
                        Evidence: {activeTab.evidence.title}
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="relative group">
                            <Search size={14} className="text-theme-muted absolute left-2 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Find..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-theme-surface border border-theme-border rounded-md py-1 pl-7 pr-2 text-xs w-32 focus:w-48 transition-all focus:border-theme-accent outline-none text-theme-text"
                            />
                         </div>
                    </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-theme-surface">
                    <div className="max-w-3xl mx-auto bg-theme-bg shadow-2xl p-8 min-h-full border border-theme-border rounded-sm relative">
                        {/* Bingo Data Visualization (If Earnings Call) */}
                        {activeTab.evidence.bingoData && (
                            <EarningsBingo data={activeTab.evidence.bingoData} />
                        )}

                        <h1 className="text-2xl font-bold text-theme-text mb-6 border-b border-theme-border pb-4">{activeTab.evidence.title}</h1>
                        <div className="prose dark:prose-invert prose-sm max-w-none text-theme-muted leading-relaxed font-serif">
                             <div className="whitespace-pre-wrap">
                                 {/* Highlighted text content */}
                                 {activeTab.evidence.content}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default FinGeniePage;