

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Terminal, BarChart2, Shield, BrainCircuit, Activity, Play, Sparkles, TrendingUp, TrendingDown, Search, AlertTriangle, PieChart, ShieldAlert, Zap, Lock, Cpu, CheckCircle2, Pause } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

const HeroTicker = () => {
    return (
        <div className="absolute top-0 left-0 right-0 h-10 bg-theme-surface/80 border-b border-theme-border backdrop-blur-md z-30 flex items-center overflow-hidden">
             <div className="flex items-center whitespace-nowrap animate-marquee">
                 {[1,2,3,4,5,6].map(i => (
                     <React.Fragment key={i}>
                         <span className="mx-6 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">NIFTY</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 22,450.30</span>
                         </span>
                         <span className="mx-6 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">RELIANCE</span>
                             <span className="text-rose-500 flex items-center"><TrendingDown size={10} className="mr-0.5"/> 2,930.15</span>
                         </span>
                         <span className="mx-6 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">HDFCBANK</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 1,450.00</span>
                         </span>
                         <span className="mx-6 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">GOLD</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 68,000.00</span>
                         </span>
                     </React.Fragment>
                 ))}
             </div>
        </div>
    );
}

// --- LIVE DEMO SIMULATOR COMPONENTS ---

interface DemoScenario {
    id: string;
    label: string;
    icon: any;
    prompt: string;
    responseUI: React.ReactNode;
    color: string;
    accentColor: string;
}

const LiveDemo = () => {
    const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [stage, setStage] = useState<'idle' | 'typing' | 'scanning' | 'thinking' | 'result'>('idle');
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const scenarios: DemoScenario[] = [
        {
            id: 'compare',
            label: 'Market Battle',
            icon: BarChart2,
            color: 'text-blue-400',
            accentColor: 'bg-blue-500',
            prompt: "Compare TCS vs Infosys. Who wins on growth?",
            responseUI: (
                <div className="w-full animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <h4 className="font-bold text-white text-sm tracking-wide">Growth Analysis</h4>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-500/20 font-mono">
                            VERDICT: TCS
                        </span>
                    </div>
                    
                    {/* Visual Comparison Chart */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="text-[10px] text-gray-400 uppercase mb-1">TCS Revenue (3Y)</div>
                            <div className="text-xl font-bold text-white mb-1">12.5%</div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[85%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-500"></div>
                            <div className="text-[10px] text-gray-400 uppercase mb-1">INFY Revenue (3Y)</div>
                            <div className="text-xl font-bold text-gray-300 mb-1">9.8%</div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gray-500 h-full w-[65%]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-blue-900/20 to-transparent border-l-2 border-blue-500">
                        <p className="text-xs text-blue-100 leading-relaxed font-mono">
                            <span className="text-blue-400 font-bold">INSIGHT:</span> TCS secured $11B in TCV this quarter, outperforming Infosys in large deal conversions despite macro headwinds.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'forensic',
            label: 'Forensic Scan',
            icon: ShieldAlert,
            color: 'text-rose-400',
            accentColor: 'bg-rose-500',
            prompt: "Scan Adani Enterprises annual report for red flags.",
            responseUI: (
                <div className="w-full animate-fade-in relative overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700/50">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] relative">
                             <AlertTriangle size={24} />
                             <div className="absolute inset-0 border border-rose-500/40 rounded-xl animate-ping opacity-20"></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Forensic Risk Detected</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 w-[78%]"></div>
                                </div>
                                <span className="text-[10px] text-rose-400 font-mono font-bold">RISK: HIGH (78/100)</span>
                            </div>
                        </div>
                    </div>

                    {/* Findings */}
                    <div className="space-y-2">
                        <div className="p-3 bg-rose-950/30 rounded border border-rose-500/20 flex gap-3 items-start group hover:bg-rose-900/20 transition-colors">
                             <div className="mt-0.5 text-rose-500"><Search size={14}/></div>
                             <div>
                                 <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-0.5 group-hover:text-rose-200">Related Party Transactions</div>
                                 <p className="text-[11px] text-gray-400 leading-tight">Loans to subsidiary "Entity X" increased by <span className="text-white font-bold">400%</span> without corresponding revenue growth.</p>
                             </div>
                        </div>
                        <div className="p-3 bg-amber-950/20 rounded border border-amber-500/20 flex gap-3 items-start">
                             <div className="mt-0.5 text-amber-500"><Activity size={14}/></div>
                             <div>
                                 <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-0.5">Cash Flow Divergence</div>
                                 <p className="text-[11px] text-gray-400 leading-tight">Operating Profit is up, but <span className="text-white font-bold">Operating Cash Flow is negative</span> for Q3.</p>
                             </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'portfolio',
            label: 'Portfolio Audit',
            icon: PieChart,
            color: 'text-purple-400',
            accentColor: 'bg-purple-500',
            prompt: "Audit my portfolio. Is my allocation safe?",
            responseUI: (
                <div className="w-full animate-fade-in">
                     <div className="flex gap-4 items-center mb-4">
                         <div className="relative">
                             <svg className="w-16 h-16 transform -rotate-90">
                                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-purple-500" strokeDasharray="175" strokeDashoffset="40" />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center flex-col">
                                 <span className="text-[10px] text-gray-400 font-bold uppercase">Risk</span>
                                 <span className="text-sm font-bold text-white">High</span>
                             </div>
                         </div>
                         <div>
                             <h4 className="font-bold text-white text-sm mb-1">Concentration Alert</h4>
                             <p className="text-[11px] text-gray-400 leading-tight max-w-[200px]">
                                 You are <strong className="text-white">65% exposed to Banking</strong>. Regulatory changes could impact >50% of your capital.
                             </p>
                         </div>
                     </div>
                     
                     {/* Suggestion */}
                     <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <Zap size={14} />
                         </div>
                         <div>
                             <div className="text-[10px] text-gray-400 uppercase font-bold">AI Suggestion</div>
                             <div className="text-xs text-gray-200">Hedge with <span className="text-emerald-400 font-bold">Gold BeES</span> or diversify into Pharma.</div>
                         </div>
                     </div>
                </div>
            )
        }
    ];

    useEffect(() => {
        if (isPaused) return;

        let typingInterval: any;
        let nextStageTimeout: any;

        const currentScenario = scenarios[activeScenarioIdx];

        const runSequence = () => {
            setTypedText('');
            setStage('typing');
            
            let charIdx = 0;
            // Type faster
            typingInterval = setInterval(() => {
                if (charIdx <= currentScenario.prompt.length) {
                    setTypedText(currentScenario.prompt.slice(0, charIdx));
                    charIdx++;
                } else {
                    clearInterval(typingInterval);
                    setStage('scanning');
                    
                    // Show "Scanning/Thinking" visualization
                    nextStageTimeout = setTimeout(() => {
                        setStage('thinking');
                        
                        setTimeout(() => {
                            setStage('result');
                            
                            nextStageTimeout = setTimeout(() => {
                                // Go to next scenario
                                setActiveScenarioIdx(prev => (prev + 1) % scenarios.length);
                            }, 6000); // Wait 6s on result to let user read
                        }, 1200);

                    }, 800);
                }
            }, 30);
        };

        runSequence();

        return () => {
            clearInterval(typingInterval);
            clearTimeout(nextStageTimeout);
        };
    }, [activeScenarioIdx, isPaused]);

    const activeScenario = scenarios[activeScenarioIdx];

    return (
        <div className="w-full max-w-5xl mx-auto" ref={containerRef}>
            {/* Terminal Window Frame */}
            <div className="rounded-xl bg-[#0d1117] border border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10 relative group">
                 
                 {/* Decorative Glow */}
                 <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-${activeScenario.color.split('-')[1]}-500/50 blur-[2px] transition-colors duration-500`}></div>

                 {/* Terminal Header */}
                 <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 justify-between relative z-10">
                      <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50"></div>
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50"></div>
                          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50"></div>
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                          <Lock size={10} />
                          <span>fingenie_core_v2.5.exe</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <div className="flex gap-4">
                           <button onClick={() => setIsPaused(!isPaused)} className="text-gray-500 hover:text-white transition-colors">
                                {isPaused ? <Play size={12} /> : <Pause size={12} />}
                           </button>
                      </div>
                 </div>

                 {/* Terminal Body */}
                 <div className="p-6 md:p-10 min-h-[400px] flex flex-col font-mono relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-20">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                     
                     <div className="relative z-10 flex flex-col gap-8 max-w-3xl mx-auto w-full">
                         
                         {/* Scenario Tabs (Interactive) */}
                         <div className="flex justify-center gap-2 mb-4">
                            {scenarios.map((s, idx) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setActiveScenarioIdx(idx); setStage('typing'); }}
                                    className={`
                                        px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-300
                                        ${idx === activeScenarioIdx 
                                            ? `bg-gray-800 border-gray-600 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105` 
                                            : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400 hover:bg-gray-800/50'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <s.icon size={14} className={idx === activeScenarioIdx ? s.color : ''} />
                                        {s.label}
                                    </div>
                                </button>
                            ))}
                         </div>

                         {/* Chat Bubble (User) */}
                         <div className="flex gap-4 items-start animate-slide-up">
                             <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 shadow-lg">
                                 <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                                     <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                 </div>
                             </div>
                             <div className="bg-[#1e232a] text-gray-200 px-6 py-4 rounded-2xl rounded-tl-none border border-gray-700/50 shadow-xl w-full">
                                 <div className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">User Input</div>
                                 <div className="text-sm md:text-base font-medium">
                                     {typedText}<span className="typing-cursor inline-block w-2 h-4 bg-blue-500 ml-1 align-middle"></span>
                                 </div>
                             </div>
                         </div>

                         {/* Scanning / Thinking State */}
                         {(stage === 'scanning' || stage === 'thinking') && (
                             <div className="pl-14 animate-fade-in">
                                 <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                     <Cpu size={14} className="text-theme-accent animate-spin" />
                                     Processing Data...
                                 </div>
                                 <div className="h-1 w-64 bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-shimmer w-full"></div>
                                 </div>
                             </div>
                         )}

                         {/* AI Response Card */}
                         {stage === 'result' && (
                             <div className="flex gap-4 items-start animate-fade-in-up">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 border border-white/10 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                      F
                                  </div>
                                  <div className="flex-1 w-full">
                                      <div className="bg-[#13161c] rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden relative">
                                          {/* Top Accent Line */}
                                          <div className={`h-1 w-full ${activeScenario.accentColor}`}></div>
                                          
                                          <div className="p-6">
                                              {activeScenario.responseUI}
                                          </div>

                                          {/* Footer Metadata */}
                                          <div className="bg-[#0d1015] px-6 py-3 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                              <div className="flex gap-4">
                                                  <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Confidence: 98%</span>
                                                  <span className="flex items-center gap-1"><Search size={10} /> Sources: 4</span>
                                              </div>
                                              <span>Latency: 45ms</span>
                                          </div>
                                      </div>
                                  </div>
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text relative overflow-hidden selection:bg-theme-accent/30 pt-10">
      
      <HeroTicker />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto mt-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold font-mono text-xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">F</div>
           <div>
               <span className="font-bold text-lg tracking-tight text-theme-text block leading-none">FinInsight</span>
               <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider">Institutional Intelligence</span>
           </div>
        </div>
        <button 
            onClick={onLaunch}
            className="px-6 py-2.5 rounded-full border border-theme-border hover:bg-theme-surface hover:border-theme-accent/50 transition-all text-sm font-bold flex items-center gap-2 text-theme-text group shadow-sm bg-white/5 backdrop-blur-sm"
        >
            Enter Workspace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-wider shadow-sm mb-8 animate-fade-in backdrop-blur-sm">
              <Sparkles size={12} /> v2.0 Now Live
           </div>
           
           <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-theme-text mb-6 max-w-5xl mx-auto drop-shadow-sm">
              Decode the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse-glow">Market Noise.</span>
           </h1>
           
           <p className="text-lg md:text-xl text-theme-muted max-w-2xl leading-relaxed mx-auto mb-10 font-medium">
              Your professional financial workspace. Stop scrolling through endless news feeds. 
              <strong> FinGenie</strong> analyzes annual reports, simulates portfolio risks, and detects red flags in seconds.
           </p>

           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24 w-full sm:w-auto">
              <button 
                onClick={onLaunch}
                className="group relative px-8 py-4 bg-theme-accent text-white rounded-xl font-bold text-lg shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden w-full sm:w-auto"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                 Launch Workspace
                 <ArrowRight size={18} className="text-white group-hover:translate-x-1 transition-transform"/>
              </button>
              <button className="px-8 py-4 bg-theme-surface/50 border border-theme-border hover:border-theme-text/30 rounded-xl font-bold text-lg text-theme-text transition-all duration-300 flex items-center justify-center gap-2 hover:bg-theme-bg w-full sm:w-auto backdrop-blur-sm">
                 <Play size={18} className="fill-current"/> Watch Video
              </button>
           </div>

           {/* LIVE PRODUCT SIMULATOR SECTION */}
           <div className="w-full relative z-20">
               {/* Glowing Backdrop for Simulator */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
               
               <div className="flex items-center justify-between max-w-5xl mx-auto mb-6 px-4">
                   <div className="text-sm font-bold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       Live System Demo
                   </div>
               </div>

               <LiveDemo />
           </div>
      </main>

      {/* Feature Grid Section */}
      <section className="relative z-10 py-32 border-t border-theme-border bg-theme-surface/30">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-black text-theme-text mb-4">Institutional Grade Tools</h2>
                  <p className="text-theme-muted">Everything you need to analyze like a hedge fund.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-theme-accent/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-2xl hover:shadow-theme-accent/10 hover:-translate-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10">
                          <Terminal size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-theme-text">Command Center</h3>
                      <p className="text-theme-muted text-sm leading-relaxed">
                          Your central command. Use <span className="font-mono text-blue-400 font-bold">@stock</span> to analyze companies and <span className="font-mono text-purple-400 font-bold">#macro</span> for economic context.
                      </p>
                  </div>

                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-purple-500/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10">
                          <BrainCircuit size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-theme-text">Portfolio Brain</h3>
                      <p className="text-theme-muted text-sm leading-relaxed">
                          Don't just watch your stocks. Understand *why* they move. Our **Attribution Engine** links news events directly to your P&L in real-time.
                      </p>
                  </div>

                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-emerald-500/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10">
                          <Shield size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-theme-text">Forensic Scan</h3>
                      <p className="text-theme-muted text-sm leading-relaxed">
                          Detect manipulation. Paste earnings transcripts or 10-K notes, and FinGenie will sniff out accounting red flags and creative language.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-xs text-theme-muted border-t border-theme-border bg-theme-bg">
          <div className="flex items-center justify-center gap-2 mb-4">
               <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">F</div>
               <span className="font-bold text-theme-text text-sm">FinInsight</span>
          </div>
          <p>© {new Date().getFullYear()} FinInsight. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
