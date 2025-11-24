
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, X, FileText, Phone, AlertOctagon, Activity, Search, Factory, BrainCircuit, BarChart2, Shield, Scale, ChevronDown, ChevronUp, Zap, HelpCircle, TrendingUp, TrendingDown, DollarSign, MousePointer2, Terminal, Building2, Globe, Sparkles, ExternalLink, MessageSquare, CheckCircle2, Copy, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import { ChatMessage, TickerSearchItem, DocumentType, PinnedItem, EvidenceDocument, BingoData, SourceLink, NewsInsight } from '../types';
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

const ContextAwareLoading = ({ lastUserMessage }: { lastUserMessage?: string }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [steps, setSteps] = useState<string[]>(["Initializing AI..."]);

    useEffect(() => {
        if (!lastUserMessage) {
            setSteps(["Connecting to market data...", "Calibrating models...", "Ready."]);
            return;
        }

        const msg = lastUserMessage.toLowerCase();
        let newSteps = ["Analyzing request..."];

        if (msg.includes("compare") || msg.includes("vs")) {
            newSteps = ["Fetching Ticker A Financials...", "Fetching Ticker B Financials...", "Aligning Valuation Metrics...", "Generating Comparison Table..."];
        } else if (msg.includes("risk") || msg.includes("safe") || msg.includes("debt")) {
            newSteps = ["Scanning Balance Sheet...", "Checking Debt Covenants...", "Analyzing Cash Flow Stability...", "Looking for Red Flags..."];
        } else if (msg.includes("valuation") || msg.includes("fair") || msg.includes("price")) {
            newSteps = ["Retrieving P/E and PEG Ratios...", "Comparing with Industry Peers...", "Projecting Future Growth...", "Calculating Fair Value..."];
        } else if (msg.includes("ceo") || msg.includes("lie") || msg.includes("management")) {
            newSteps = ["Parsing Earnings Call Transcript...", "Analyzing Tone vs. Financials...", "Detecting Evasiveness...", "Fact-checking Optimism..."];
        } else {
            newSteps = ["Reading market data...", "Checking financial health...", "Synthesizing insights..."];
        }
        
        setSteps(newSteps);
        setStepIndex(0);
    }, [lastUserMessage]);

    useEffect(() => {
        if (stepIndex < steps.length - 1) {
            const timeout = setTimeout(() => {
                setStepIndex(prev => prev + 1);
            }, 1200); // 1.2s per step
            return () => clearTimeout(timeout);
        }
    }, [stepIndex, steps]);

    return (
        <div className="flex gap-4 max-w-4xl mx-auto animate-fade-in pl-2 mt-4 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-theme-surface border border-theme-border shadow-sm">
                <BrainCircuit className="w-6 h-6 text-theme-accent animate-pulse" />
            </div>
            <div className="flex flex-col justify-center mt-1">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-theme-accent uppercase tracking-widest">Processing Intelligence</span>
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-bounce delay-150"></span>
                    </span>
                </div>
                <div className="h-6 overflow-hidden relative w-64 bg-theme-surface/50 rounded-md border border-theme-border/50 px-3 py-1">
                    {steps.map((step, i) => (
                        <span 
                            key={i}
                            className={`absolute top-1 left-3 text-xs font-mono text-theme-muted transition-all duration-500 transform ${
                                i === stepIndex ? 'opacity-100 translate-y-0' : i < stepIndex ? 'opacity-0 -translate-y-full' : 'opacity-0 translate-y-full'
                            }`}
                        >
                            &gt; {step}
                        </span>
                    ))}
                </div>
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
                className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-lg border w-full md:w-auto ${
                    isOpen 
                    ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30' 
                    : 'bg-theme-surface hover:bg-theme-bg text-theme-muted border-theme-border'
                }`}
            >
                <BrainCircuit size={14} className={isOpen ? "text-theme-accent" : "text-theme-muted"} />
                {isOpen ? "Hide Analytical Process" : "View Analytical Reasoning"}
                {isOpen ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            
            {isOpen && (
                <div className="mt-2 p-4 bg-[#0d1117] dark:bg-black/40 border border-gray-800 dark:border-gray-700/50 rounded-xl animate-slide-up shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-theme-accent/50"></div>
                     <p className="text-xs font-mono text-gray-300 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                         <span className="text-theme-accent opacity-50 select-none">{'// Chain of Thought Log\n'}</span>
                         {thoughts}
                     </p>
                </div>
            )}
        </div>
    );
}

const SmartInsightCard = ({ data }: { data: NewsInsight }) => {
    const getVerdictColor = (v: string) => {
        if (['SAFE', 'BUY', 'UNDERVALUED', 'STRONG'].includes(v)) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
        if (['RISKY', 'SELL', 'OVERVALUED', 'WEAK'].includes(v)) return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
    };

    const verdictColorClass = data.verdict ? getVerdictColor(data.verdict) : '';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-theme-border shadow-lg overflow-hidden mb-6 animate-fade-in">
            {/* Executive Summary Header */}
            <div className="p-5 border-b border-theme-border bg-gradient-to-r from-theme-surface to-transparent">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 bg-theme-accent/10 text-theme-accent rounded-lg">
                                <Activity size={16} />
                            </span>
                            <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest">Executive Briefing</h4>
                        </div>
                        <p className="text-base font-bold text-theme-text leading-tight mt-1">
                            {data.gist}
                        </p>
                    </div>
                    {data.verdict && (
                        <div className={`px-3 py-1.5 rounded-lg border font-black text-xs uppercase tracking-wide shadow-sm flex-shrink-0 ml-2 ${verdictColorClass}`}>
                            {data.verdict}
                        </div>
                    )}
                </div>
            </div>

            {/* Pros & Cons Grid - Stacks on Mobile */}
            {(data.pros || data.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-theme-border border-b border-theme-border">
                    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/5">
                        <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-1.5">
                            <CheckCircle2 size={12}/> The Good
                        </h5>
                        <ul className="space-y-2">
                            {(data.pros || []).map((pro, i) => (
                                <li key={i} className="text-xs text-theme-text flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                    <span className="leading-relaxed">{pro}</span>
                                </li>
                            ))}
                            {!data.pros?.length && <li className="text-xs text-theme-muted italic">No major positives.</li>}
                        </ul>
                    </div>
                    <div className="p-4 bg-rose-50/30 dark:bg-rose-900/5">
                        <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-3 flex items-center gap-1.5">
                            <AlertOctagon size={12}/> The Bad / Risks
                        </h5>
                        <ul className="space-y-2">
                            {(data.cons || []).map((con, i) => (
                                <li key={i} className="text-xs text-theme-text flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0"></span>
                                    <span className="leading-relaxed">{con}</span>
                                </li>
                            ))}
                            {!data.cons?.length && <li className="text-xs text-theme-muted italic">No major risks detected.</li>}
                        </ul>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid - Responsive */}
            {data.stats && data.stats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-theme-border border-b border-theme-border bg-theme-surface/30">
                    {data.stats.map((stat, i) => (
                        <div key={i} className="p-3 text-center hover:bg-theme-surface transition-colors">
                            <div className="text-[10px] text-theme-muted uppercase font-bold mb-1">{stat.label}</div>
                            <div className="text-sm font-mono font-bold text-theme-text">{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hype Meter */}
            <div className="p-4 bg-theme-bg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-theme-muted uppercase">
                    <Zap size={12} className={data.hypeScore > 50 ? "text-theme-accent" : "text-gray-400"}/>
                    Hype Meter
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                    <div className="h-1.5 w-full bg-theme-border rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${data.hypeScore > 70 ? 'bg-rose-500' : data.hypeScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${data.hypeScore}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono font-bold text-theme-text">{data.hypeScore}/100</span>
                </div>
            </div>
        </div>
    );
};

const SourceChips = ({ sources }: { sources: SourceLink[] }) => {
    return (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-theme-border/40">
            <span className="text-[10px] text-theme-muted font-bold uppercase py-1 flex items-center gap-1">
                <Search size={10} /> Verified Sources:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((source, i) => (
                    <a 
                        key={i} 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col p-2 rounded-lg bg-theme-surface/50 border border-theme-border hover:border-theme-accent/50 hover:bg-theme-bg transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-theme-text leading-tight line-clamp-1 group-hover:text-theme-accent transition-colors">
                                {source.title}
                            </span>
                            <ExternalLink size={12} className="text-theme-muted shrink-0 group-hover:text-theme-accent" />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <img 
                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}`} 
                                alt="" 
                                className="w-3 h-3 opacity-60" 
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <span className="text-[10px] text-theme-muted truncate">{new URL(source.url).hostname.replace('www.', '')}</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

const FollowUpSuggestions = ({ questions, onSelect }: { questions: string[], onSelect: (q: string) => void }) => {
    return (
        <div className="flex flex-col gap-3 mt-5 animate-fade-in">
            <span className="text-[10px] font-bold text-theme-muted uppercase flex items-center gap-1.5 pl-1">
                <MessageSquare size={10} /> Suggested Deep Dives
            </span>
            <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                    <button 
                        key={i}
                        onClick={() => onSelect(q)}
                        className="text-left text-xs bg-theme-surface hover:bg-theme-bg border border-theme-border hover:border-theme-accent text-theme-text px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-muted group-hover:bg-theme-accent transition-colors"></span>
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}

const EarningsBingo = ({ data }: { data: BingoData }) => {
    return (
        <div className="mb-6 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><Activity size={16}/></span> 
                Earnings Call Sentiment
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
                {data.wordCloud.map((w, i) => (
                    <span 
                        key={i} 
                        className={`text-xs px-2.5 py-1 rounded-md border font-bold ${
                            w.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' : 
                            w.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800' : 
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                        }`}
                        style={{ fontSize: `${Math.max(10, Math.min(18, 10 + w.count))}px` }}
                    >
                        {w.word}
                    </span>
                ))}
            </div>

            <div className="h-32 flex items-end gap-1.5 border-b border-gray-200 dark:border-gray-700 pb-2 px-2 relative">
                {/* Baseline */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 dark:bg-gray-600 border-dashed border-t"></div>
                
                {data.sentimentTimeline.map((p, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                        <div 
                            className={`w-full rounded-t-sm transition-all duration-300 opacity-80 group-hover:opacity-100 ${p.sentiment >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ 
                                height: `${Math.abs(p.sentiment)}%`,
                                marginBottom: p.sentiment < 0 ? '0' : '50%', // Push up if positive
                                marginTop: p.sentiment < 0 ? '50%' : '0' // Push down if negative
                            }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none shadow-xl border border-gray-700">
                            <strong>{p.time}</strong><br/>
                            <span className="text-gray-400">{p.annotation}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">
                <span>Start of Call</span>
                <span>Q&A Session</span>
                <span>End</span>
            </div>
        </div>
    );
};

// --- NEW WORKFLOW WIZARD ---

type WizardType = 'compare' | 'risk' | 'valuation' | 'macro' | 'lie_detector';

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
            case 'lie_detector': return {
                title: "CEO Lie Detector",
                icon: AlertOctagon,
                color: "text-purple-500",
                steps: [
                    { key: "stock", label: "Which Stock?", placeholder: "Enter symbol..." },
                    { key: "context", label: "Recent context?", placeholder: "e.g. Latest earnings call, recent scandal" }
                ],
                promptTemplate: (i: any) => `Perform a 'CEO Lie Detector' test on ${i.stock} regarding ${i.context}. Compare management's optimistic tone in recent calls against the cold hard numbers in the financial statements. Highlight any contradictions or evasive answers.`
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
        <div className="absolute inset-x-2 sm:inset-x-4 bottom-24 top-auto bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 sm:p-6 z-50 animate-slide-up max-w-lg mx-auto ring-1 ring-white/10">
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18}/></button>
             
             <div className="flex items-center gap-3 mb-6 sm:mb-8">
                 <div className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 ${config.color} shadow-inner`}>
                     <config.icon size={24} />
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{config.title}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Wizard Step {step} of {config.steps.length}</p>
                 </div>
             </div>

             <div className="mb-8">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">
                     {config.steps[step-1].label}
                 </label>
                 <input 
                    autoFocus
                    type="text"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none text-base shadow-inner placeholder:text-gray-500 transition-all"
                    placeholder={config.steps[step-1].placeholder}
                    value={inputs[config.steps[step-1].key] || ''}
                    onChange={(e) => setInputs({...inputs, [config.steps[step-1].key]: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                 />
             </div>

             <div className="flex justify-between items-center pt-2">
                 <div className="flex gap-1.5">
                     {config.steps.map((_, i) => (
                         <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-8 bg-theme-accent' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
                     ))}
                 </div>
                 <button 
                    onClick={handleNext}
                    disabled={!inputs[config.steps[step-1].key]}
                    className="bg-theme-accent hover:bg-theme-accent/90 text-white px-6 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-theme-accent/20 hover:shadow-theme-accent/40 active:scale-95"
                 >
                     {step === config.steps.length ? 'Generate Analysis' : 'Next Step'}
                 </button>
             </div>
        </div>
    );
};

// --- SIMPLIFIED GRID ---

const WorkflowSelector = ({ onSelect }: { onSelect: (type: WizardType) => void }) => {
    const workflows = [
        { id: 'compare', title: "Compare Stocks", desc: "Compare A vs B", example: "Compare TCS vs Infy for growth", icon: Scale, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-100 dark:border-orange-900/30", hover: "hover:border-orange-500 dark:hover:border-orange-500" },
        { id: 'risk', title: "Safe or Risky?", desc: "Check for red flags", example: "Analyze Adani Ent debt risks", icon: Shield, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-100 dark:border-red-900/30", hover: "hover:border-red-500 dark:hover:border-red-500" },
        { id: 'valuation', title: "Is it Overvalued?", desc: "Check price fairness", example: "Is Reliance overvalued now?", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/30", hover: "hover:border-emerald-500 dark:hover:border-emerald-500" },
        { id: 'macro', title: "What If...?", desc: "Simulate events", example: "Impact of oil at $100 on Paints", icon: Activity, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-100 dark:border-blue-900/30", hover: "hover:border-blue-500 dark:hover:border-blue-500" },
        { id: 'lie_detector', title: "CEO Lie Detector", desc: "Tone vs Reality", example: "Did the CEO avoid questions?", icon: AlertOctagon, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-100 dark:border-purple-900/30", hover: "hover:border-purple-500 dark:hover:border-purple-500" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto px-4">
            {workflows.map((w) => (
                <button 
                    key={w.id}
                    onClick={() => onSelect(w.id as WizardType)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${w.bg} ${w.border} ${w.hover} group relative overflow-hidden`}
                >
                    <div className="relative z-10">
                        <div className={`mb-3 p-2 w-fit rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm ${w.color}`}>
                            <w.icon size={22} />
                        </div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:underline decoration-2 underline-offset-4 mb-1">{w.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">{w.desc}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono italic truncate bg-white/50 dark:bg-black/20 p-1.5 rounded border border-transparent group-hover:border-current/10 transition-colors">
                            Try: "{w.example}"
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

// --- HELPER LEGEND COMPONENT ---

const InputLegend = ({ onTrigger }: { onTrigger: (char: string) => void }) => (
    <div className="flex items-center gap-3 px-1 mb-3 overflow-x-auto scrollbar-hide py-1">
        <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider opacity-70 hidden sm:inline flex-shrink-0">Quick Actions:</span>
        <div className="flex gap-3 flex-nowrap">
            <button onClick={() => onTrigger('@')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Building2 size={10} /> @Stocks
            </button>
            <button onClick={() => onTrigger('#')} className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Globe size={10} /> #Macro
            </button>
            <button onClick={() => onTrigger('/')} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-md hover:bg-orange-100 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Terminal size={10} /> /Tools
            </button>
        </div>
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
        <div className="absolute bottom-full left-0 mb-3 px-2 animate-fade-in flex gap-2 overflow-x-auto w-full scrollbar-hide py-1">
            <span className="text-xs text-theme-muted py-1 pl-2 whitespace-nowrap hidden sm:inline">Suggested:</span>
            {actions.map(action => (
                <button 
                    key={action}
                    onClick={() => onAction(action)}
                    className="text-xs bg-theme-surface/80 backdrop-blur-md border border-theme-accent/30 text-theme-accent px-3 py-1.5 rounded-full hover:bg-theme-accent hover:text-white shadow-sm transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0"
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
              sources: result.sources,
              followUp: result.followUp,
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
          'supply_chain': 'Supply Chain Map',
          'ceo_lie_detector': 'CEO Lie Detector'
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
          const { text, thoughts, sentiment, chartData, bingoData, dominoData, sourceDocument, sources, followUp, insightData } = await analyzeDocument(ticker, docType);
          
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
                          insightData,
                          sources,
                          followUp,
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
        <div className={`flex flex-col border-r border-theme-border transition-all duration-300 ${activeTab.evidence ? 'hidden lg:flex lg:w-1/2' : 'w-full max-w-5xl mx-auto'}`}>
            
            {/* Tab Bar */}
            <div className="h-10 flex items-center bg-theme-surface/50 border-b border-theme-border px-2 gap-1 overflow-x-auto scrollbar-hide backdrop-blur-sm sticky top-0 z-10">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer min-w-[120px] max-w-[200px] border-t border-x transition-all duration-200 select-none
                            ${activeTabId === tab.id 
                                ? 'bg-theme-bg border-theme-border text-theme-accent shadow-sm translate-y-px' 
                                : 'bg-transparent border-transparent text-theme-muted hover:bg-theme-bg/50 hover:text-theme-text'}
                        `}
                    >
                        <span className="truncate flex-1">{tab.title}</span>
                        <button 
                            onClick={(e) => handleCloseTab(e, tab.id)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-theme-surface p-0.5 rounded text-theme-muted hover:text-red-500 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                <button onClick={handleNewTab} className="p-1.5 hover:bg-theme-surface rounded-md text-theme-muted hover:text-theme-text transition-colors ml-1">
                    <Plus size={16} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scrollbar-hide bg-theme-bg relative selection:bg-theme-accent/30">
                {activeTab.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-90 animate-fade-in pb-16">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-theme-accent/20 blur-xl rounded-full animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-theme-surface rounded-2xl flex items-center justify-center ring-1 ring-theme-border shadow-2xl">
                                <Terminal size={40} className="text-theme-accent" />
                            </div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-theme-text mb-3 tracking-tight">FinGenie <span className="text-xs align-top bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded-md ml-1 font-mono">v2.5</span></h3>
                        <p className="text-sm max-w-md text-theme-muted mb-10 leading-relaxed font-medium">
                            Institutional-grade analytics for retail investors. <br/>
                            Identify risks, audit portfolios, and decode complex filings instantly.
                        </p>
                        
                        {/* New Retail Friendly Workflow Selector */}
                        <div className="w-full relative z-10">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="h-px w-8 bg-theme-border"></span>
                                <h4 className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Select Intelligence Module</h4>
                                <span className="h-px w-8 bg-theme-border"></span>
                            </div>
                            <WorkflowSelector onSelect={(t) => setActiveWizard(t)} />
                        </div>
                    </div>
                ) : (
                    activeTab.messages.map((msg) => (
                         <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                             {msg.role === 'model' && (
                                 <div className="w-8 h-8 rounded-xl bg-theme-surface mr-4 flex items-center justify-center shrink-0 border border-theme-border shadow-sm mt-1 hidden sm:flex">
                                     <img src={botAvatarUrl} alt="AI" className="w-6 h-6 rounded-lg" />
                                 </div>
                             )}
                             <div className={`max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                                 {msg.role === 'user' ? (
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg shadow-blue-500/20 text-sm leading-relaxed tracking-wide font-medium">
                                         {msg.text}
                                    </div>
                                 ) : (
                                     <div className="bg-white/80 dark:bg-[#121820]/90 backdrop-blur-sm rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                                         {/* Header Strip */}
                                         <div className="h-1 w-full bg-gradient-to-r from-theme-accent via-purple-500 to-transparent opacity-50"></div>
                                         
                                         <div className="p-4 sm:p-6 space-y-5">
                                             {/* Chain of Thought UI */}
                                             {msg.thoughts && <ReasoningAccordion thoughts={msg.thoughts} />}

                                             {/* Structured Insight Card (Executive Summary) */}
                                             {msg.insightData && <SmartInsightCard data={msg.insightData} />}

                                             {/* Text Content - Collapsible if Card exists */}
                                             {msg.text && (
                                                 msg.insightData ? (
                                                     <details className="group/details">
                                                         <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-theme-muted hover:text-theme-accent transition-colors py-2 select-none">
                                                             <BookOpen size={14} /> Read Detailed Report
                                                             <ChevronDown size={12} className="transition-transform group-open/details:rotate-180" />
                                                         </summary>
                                                         <div className="mt-3 pl-4 border-l-2 border-theme-border/50 prose dark:prose-invert prose-sm max-w-none text-theme-text/90 animate-slide-up">
                                                             <ReactMarkdown 
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    p: ({node, ...props}) => <p className="leading-relaxed mb-4 last:mb-0" {...props}>{renderChildren(props.children)}</p>,
                                                                    li: ({node, ...props}) => (
                                                                        <li className="flex gap-2.5 mb-2" {...props}>
                                                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-theme-accent shrink-0"></div>
                                                                            <div>{renderChildren(props.children)}</div>
                                                                        </li>
                                                                    ),
                                                                    strong: ({node, ...props}) => <strong className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1 rounded mx-0.5 inline-block" {...props} />,
                                                                    table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-theme-border shadow-sm"><table className="w-full text-sm" {...props} /></div>,
                                                                    thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-bold text-theme-muted" {...props} />,
                                                                    th: ({node, ...props}) => <th className="px-4 py-3 text-left border-b border-theme-border whitespace-nowrap" {...props} />,
                                                                    td: ({node, ...props}) => <td className="px-4 py-3 border-b border-theme-border/50 text-theme-text" {...props} />,
                                                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-accent pl-4 italic text-theme-muted my-4" {...props} />
                                                                }}
                                                            >
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                         </div>
                                                     </details>
                                                 ) : (
                                                     <div className="prose dark:prose-invert prose-sm max-w-none text-theme-text/90">
                                                        <ReactMarkdown 
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                p: ({node, ...props}) => <p className="leading-relaxed mb-4 last:mb-0" {...props}>{renderChildren(props.children)}</p>,
                                                                li: ({node, ...props}) => (
                                                                    <li className="flex gap-2.5 mb-2" {...props}>
                                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-theme-accent shrink-0"></div>
                                                                        <div>{renderChildren(props.children)}</div>
                                                                    </li>
                                                                ),
                                                                strong: ({node, ...props}) => <strong className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1 rounded mx-0.5 inline-block" {...props} />,
                                                                table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-theme-border shadow-sm"><table className="w-full text-sm" {...props} /></div>,
                                                                thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-bold text-theme-muted" {...props} />,
                                                                th: ({node, ...props}) => <th className="px-4 py-3 text-left border-b border-theme-border whitespace-nowrap" {...props} />,
                                                                td: ({node, ...props}) => <td className="px-4 py-3 border-b border-theme-border/50 text-theme-text" {...props} />,
                                                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-accent pl-4 italic text-theme-muted my-4" {...props} />
                                                            }}
                                                        >
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                     </div>
                                                 )
                                             )}

                                             {/* Citations / Sources - IMPROVED UI */}
                                             {msg.sources && msg.sources.length > 0 && <SourceChips sources={msg.sources} />}

                                             {/* Dynamic Widgets */}
                                             {msg.chartData && <div className="mt-6"><DynamicChart data={msg.chartData} /></div>}
                                             {msg.dominoData && <div className="mt-6"><DominoGraph data={msg.dominoData} targetTicker="Target" /></div>}
                                             {msg.portfolioReport && <div className="mt-6"><PortfolioWidget data={msg.portfolioReport} /></div>}
                                             
                                             {/* Sentiment Gauge */}
                                             {msg.sentimentScore !== undefined && !msg.insightData && (
                                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-theme-border/50">
                                                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-xs font-bold">
                                                         <Activity size={14} className={msg.sentimentScore > 0 ? 'text-emerald-500' : 'text-rose-500'} />
                                                         Market Sentiment: 
                                                         <span className={msg.sentimentScore > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                             {msg.sentimentScore > 0 ? 'Bullish' : 'Bearish'} ({msg.sentimentScore > 0 ? '+' : ''}{msg.sentimentScore})
                                                         </span>
                                                     </div>
                                                     <div className="flex gap-2">
                                                         <button className="p-1.5 text-theme-muted hover:text-theme-text transition-colors"><Copy size={14}/></button>
                                                     </div>
                                                </div>
                                             )}

                                             {/* Suggested Follow-Ups */}
                                             {msg.followUp && msg.followUp.length > 0 && (
                                                 <FollowUpSuggestions 
                                                    questions={msg.followUp} 
                                                    onSelect={(q) => handleSendMessage(q)} 
                                                 />
                                             )}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                    ))
                )}
                {loading && <ContextAwareLoading lastUserMessage={activeTab.messages.filter(m => m.role === 'user').pop()?.text} />}
                
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

            {/* Input Area - Command Deck Style */}
            <div className="p-2 sm:p-4 bg-theme-bg/95 backdrop-blur-md border-t border-theme-border relative z-20 pb-safe">
                <div className="max-w-4xl mx-auto">
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
                        <div className="absolute bottom-full left-4 mb-2 bg-theme-surface rounded-xl shadow-2xl border border-theme-border w-72 overflow-hidden animate-slide-up z-30 ring-1 ring-black/5">
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
                                     <span className="text-[10px] bg-theme-bg text-theme-muted px-1.5 py-0.5 rounded border border-theme-border">{t.type}</span>
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

                    <div className="relative flex items-center gap-2 group pb-1">
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
                            placeholder="Type a command... (Try 'Compare TCS vs Infy')"
                            className="flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-3 sm:px-5 sm:py-4 text-sm focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all placeholder-theme-muted text-theme-text shadow-sm group-hover:shadow-md"
                            disabled={loading}
                        />
                        <button 
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || loading}
                            className="absolute right-2 p-2.5 bg-theme-accent hover:bg-theme-accent/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-all shadow-lg shadow-theme-accent/20 hover:shadow-theme-accent/40 active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-[10px] text-theme-muted text-center mt-1 opacity-60 hidden sm:block">
                         FinGenie AI can make mistakes. Verify important financial data.
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: EVIDENCE / DOCUMENT VIEWER (CONDITIONAL) */}
        {activeTab.evidence && (
            <div className="w-full lg:w-1/2 flex flex-col bg-theme-surface border-l border-theme-border animate-slide-left shadow-2xl z-20 absolute inset-0 lg:static">
                {/* Header */}
                <div className="h-12 flex items-center justify-between px-6 border-b border-theme-border bg-theme-bg">
                    <div className="flex items-center gap-2 text-xs font-bold text-theme-text uppercase tracking-wider">
                        <FileText size={14} className="text-theme-accent" />
                        Evidence: {activeTab.evidence.title}
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="relative group hidden sm:block">
                            <Search size={14} className="text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-theme-accent transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search doc..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-theme-bg border border-theme-border rounded-full py-1.5 pl-8 pr-3 text-xs w-32 focus:w-48 transition-all focus:border-theme-accent outline-none text-theme-text placeholder-theme-muted"
                            />
                         </div>
                         <button onClick={() => updateActiveTab({ evidence: null })} className="p-1 hover:bg-theme-bg rounded-full text-theme-muted hover:text-red-500 transition-colors">
                             <X size={16}/>
                         </button>
                    </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#fcfcfc] dark:bg-[#0d1117]">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-[#161b22] shadow-sm p-6 sm:p-10 min-h-full border border-gray-200 dark:border-gray-800 rounded-sm relative selection:bg-yellow-200 dark:selection:bg-yellow-900 selection:text-black dark:selection:text-white">
                        {/* Bingo Data Visualization (If Earnings Call) */}
                        {activeTab.evidence.bingoData && (
                            <EarningsBingo data={activeTab.evidence.bingoData} />
                        )}

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4 leading-tight">{activeTab.evidence.title}</h1>
                        <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
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
