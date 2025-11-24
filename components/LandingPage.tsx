

import React, { useState, useEffect } from 'react';
import { ArrowRight, Terminal, BarChart2, Shield, BrainCircuit, Activity, ChevronRight, Play, Sparkles, Check, TrendingUp, TrendingDown } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

const HeroTicker = () => {
    return (
        <div className="absolute top-0 left-0 right-0 h-10 bg-theme-surface/50 border-b border-theme-border backdrop-blur-sm z-20 flex items-center overflow-hidden">
             <div className="flex items-center whitespace-nowrap animate-marquee">
                 {[1,2,3,4].map(i => (
                     <React.Fragment key={i}>
                         <span className="mx-4 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">NIFTY</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 22,450.30</span>
                         </span>
                         <span className="mx-4 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">RELIANCE</span>
                             <span className="text-rose-500 flex items-center"><TrendingDown size={10} className="mr-0.5"/> 2,930.15</span>
                         </span>
                         <span className="mx-4 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">HDFCBANK</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 1,450.00</span>
                         </span>
                         <span className="mx-4 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">GOLD</span>
                             <span className="text-emerald-500 flex items-center"><TrendingUp size={10} className="mr-0.5"/> 68,000.00</span>
                         </span>
                         <span className="mx-4 text-xs font-mono text-theme-muted flex items-center gap-2">
                             <span className="font-bold text-theme-text">USD/INR</span>
                             <span className="text-theme-text">83.40</span>
                         </span>
                     </React.Fragment>
                 ))}
             </div>
        </div>
    );
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  // Simulator State
  const [typedText, setTypedText] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);

  const examples = [
    { cmd: "Analyze Reliance annual report", response: "Processing FY24 Annual Report... Revenue up 12%. Key Risks: O2C Margin Pressure." },
    { cmd: "Check portfolio risk", response: "Concentration Detected: 40% exposure to Banking Sector. Suggestion: Diversify into Pharma." },
    { cmd: "Explain recent RBI policy", response: "RBI kept repo rate at 6.5%. Hawkish stance on inflation. Impact: Neutral for Banks." }
  ];

  // Typing Effect Logic
  useEffect(() => {
    let currentText = '';
    const fullText = examples[exampleIndex].cmd;
    let charIndex = 0;
    let typeInterval: any;
    let resetTimeout: any;

    const startTyping = () => {
       setShowResponse(false);
       setTypedText('');
       currentText = '';
       charIndex = 0;

       typeInterval = setInterval(() => {
          if (charIndex < fullText.length) {
            currentText += fullText.charAt(charIndex);
            setTypedText(currentText);
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => setShowResponse(true), 500);
            
            // Move to next example
            resetTimeout = setTimeout(() => {
                setExampleIndex((prev) => (prev + 1) % examples.length);
            }, 4000);
          }
       }, 50); // Typing speed
    };

    startTyping();

    return () => {
        clearInterval(typeInterval);
        clearTimeout(resetTimeout);
    };
  }, [exampleIndex]);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text relative overflow-hidden selection:bg-theme-accent/30 pt-10">
      
      <HeroTicker />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>

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
            className="px-6 py-2.5 rounded-full border border-theme-border hover:bg-theme-surface hover:border-theme-accent/50 transition-all text-sm font-bold flex items-center gap-2 text-theme-text group shadow-sm"
        >
            Enter Workspace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Text Content */}
        <div className="lg:w-1/2 space-y-8 animate-fade-in text-center lg:text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-accent/10 border border-theme-accent/20 text-theme-accent text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={12} /> The AI Advantage
           </div>
           
           <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] text-theme-text">
              Decode the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse-glow">Market Noise.</span>
           </h1>
           
           <p className="text-lg text-theme-muted max-w-xl leading-relaxed mx-auto lg:mx-0">
              Your professional financial workspace. Stop scrolling through endless news feeds. 
              <strong> FinGenie</strong> analyzes annual reports, simulates portfolio risks, and detects red flags in seconds.
           </p>

           <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <button 
                onClick={onLaunch}
                className="group relative px-8 py-4 bg-theme-accent text-white rounded-xl font-bold text-lg shadow-xl shadow-theme-accent/20 hover:shadow-2xl hover:shadow-theme-accent/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                 Launch FinGenie
                 <ArrowRight size={18} className="text-white"/>
              </button>
              <button className="px-8 py-4 bg-theme-surface border border-theme-border hover:border-theme-accent/50 rounded-xl font-bold text-lg text-theme-text transition-all duration-300 flex items-center justify-center gap-2 hover:bg-theme-bg">
                 <Play size={18} className="fill-current"/> Watch Demo
              </button>
           </div>
           
           <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-theme-muted font-mono pt-6 border-t border-theme-border/50 mt-6 max-w-md mx-auto lg:mx-0">
               <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500"/> Real-time Analysis</span>
               <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500"/> Privacy Focused</span>
               <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500"/> Institutional Grade</span>
           </div>
        </div>

        {/* Interactive Simulator / Visual */}
        <div className="lg:w-1/2 w-full relative perspective-1000">
            {/* The Floating Card */}
            <div className="relative z-20 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-float transform rotate-y-6 hover:rotate-y-0 transition-transform duration-700">
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-auto text-[10px] font-mono text-gray-400 flex items-center gap-2">
                        <Activity size={10} className="text-emerald-500 animate-pulse"/>
                        fingenie_core.exe
                    </div>
                </div>

                {/* Simulation Area */}
                <div className="p-6 font-mono text-sm h-[360px] flex flex-col">
                    {/* Bot Greeting */}
                    <div className="flex gap-3 mb-6">
                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                            <Terminal size={16} />
                        </div>
                        <div className="text-gray-400">
                            <p className="text-white font-bold mb-1">FinGenie v2.5 Online</p>
                            <p className="text-xs">System initialized. Market data feed active.</p>
                        </div>
                    </div>

                    {/* User Input Simulation */}
                    <div className="flex gap-3 mb-6 items-center">
                         <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/30">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        </div>
                        <div className="text-white font-bold text-base bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 w-full">
                            <span className="text-purple-400 mr-2">$</span>
                            {typedText}<span className="typing-cursor"></span>
                        </div>
                    </div>

                    {/* Bot Response Simulation */}
                    {showResponse && (
                        <div className="flex gap-3 animate-fade-in mt-auto">
                            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                                <BrainCircuit size={16} />
                            </div>
                            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 w-full shadow-lg">
                                <div className="text-emerald-400 text-[10px] font-bold mb-2 flex items-center gap-1 border-b border-gray-700 pb-2">
                                    <Activity size={10} /> ANALYSIS COMPLETE • 0.4s
                                </div>
                                <p className="text-gray-200 leading-relaxed text-sm">
                                    {examples[exampleIndex].response}
                                </p>
                                {/* Mock Chart Bar */}
                                <div className="mt-4 flex items-end gap-1 h-10 border-l border-b border-gray-600 pl-1 pb-1">
                                    <div className="w-3 bg-blue-500/30 h-4 rounded-t-sm"></div>
                                    <div className="w-3 bg-blue-500/50 h-6 rounded-t-sm"></div>
                                    <div className="w-3 bg-blue-500/80 h-3 rounded-t-sm"></div>
                                    <div className="w-3 bg-emerald-500 h-8 rounded-t-sm animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    <div className="w-3 bg-blue-500/40 h-5 rounded-t-sm"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Decorative Elements behind card */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-theme-accent/30 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-600/30 rounded-full blur-[60px]"></div>
        </div>
      </main>

      {/* Feature Grid Section */}
      <section className="relative z-10 py-24 border-t border-theme-border bg-theme-surface/30">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4 text-theme-text">Not just a news feed. <span className="text-theme-accent">A Financial Weapon.</span></h2>
                  <p className="text-theme-muted max-w-2xl mx-auto">FinInsight provides the tools hedge funds use, democratized for you. Access institutional-grade analysis without the terminal fee.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-theme-accent/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-xl hover:shadow-theme-accent/5 hover:-translate-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center text-theme-accent mb-6 group-hover:scale-110 transition-transform ring-1 ring-theme-accent/20">
                          <Terminal size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-theme-text">FinGenie Workspace</h3>
                      <p className="text-theme-muted text-sm leading-relaxed">
                          Your central command. Use <span className="font-mono text-theme-accent bg-theme-bg px-1 rounded border border-theme-border">@stock</span> to analyze companies and <span className="font-mono text-purple-400 bg-theme-bg px-1 rounded border border-theme-border">#macro</span> for economic context.
                      </p>
                  </div>

                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-purple-500/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform ring-1 ring-purple-500/20">
                          <BrainCircuit size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-theme-text">Portfolio Brain</h3>
                      <p className="text-theme-muted text-sm leading-relaxed">
                          Don't just watch your stocks. Understand *why* they move. Our **Attribution Engine** links news events directly to your P&L in real-time.
                      </p>
                  </div>

                  <div className="group p-8 rounded-3xl bg-theme-surface border border-theme-border hover:border-emerald-500/50 transition-all duration-300 hover:bg-theme-bg hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform ring-1 ring-emerald-500/20">
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
      <footer className="py-10 text-center text-xs text-theme-muted border-t border-theme-border bg-theme-bg">
          <div className="flex items-center justify-center gap-2 mb-4">
               <div className="w-6 h-6 rounded bg-theme-accent/20 flex items-center justify-center text-theme-accent font-bold">F</div>
               <span className="font-bold text-theme-text text-sm">FinInsight</span>
          </div>
          <p>© {new Date().getFullYear()} FinInsight. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default LandingPage;