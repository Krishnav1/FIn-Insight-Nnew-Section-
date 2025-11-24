
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Article, 
  LayoutMode, 
  ChatMessage, 
  AITaskType,
  SortOption,
  DocumentType,
  Theme
} from './types';
import { USER_PORTFOLIO, TABS } from './constants';
import { startChatSession, sendChatMessage, getInitialPrompt, fetchLiveNews, analyzeDocument, getPortfolioHealthReport } from './services/geminiService';

// Components
import LayoutToggle from './components/LayoutToggle';
import NewsCard from './components/NewsCard';
import TimelineView from './components/TimelineView';
import Sidebar from './components/Sidebar';
import OnboardingTour from './components/OnboardingTour';
import ArticleDetailModal from './components/ArticleDetailModal';
import SortControls from './components/SortControls';
import KeywordCloud from './components/KeywordCloud';
import PortfolioAnalysisModal from './components/PortfolioAnalysisModal';
import StockTicker from './components/StockTicker';
import FinGeniePage from './components/FinGeniePage'; 
import LandingPage from './components/LandingPage';
import ThemeSelector from './components/ThemeSelector';

import { Search, Menu, PieChart, Moon, Sun, RefreshCw, ShieldAlert, BrainCircuit, MessageSquare, Newspaper, Zap, Terminal, Settings, LogOut, Palette, ChevronLeft, ChevronRight, Home } from 'lucide-react';

// --- BRAND ASSETS ---
const FININSIGHT_LOGO_URL = "logo.jpg"; 
const FINGENIE_AVATAR_URL = "fingenie.jpg";

type AppView = 'landing' | 'workspace' | 'news';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- News / Data State ---
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.GRID);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingNews, setLoadingNews] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  
  // Watchlist & Keywords
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Sidebar / AI State (Used when in News Mode for quick chat)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Modals State
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);

  // Tour State
  const [tourOpen, setTourOpen] = useState(false);

  // --- Derived Data ---
  const portfolioTickers = useMemo(() => USER_PORTFOLIO.map(p => p.symbol), []);

  // Extract Keywords
  const trendingKeywords = useMemo(() => {
    const text = articles.map(a => a.title).join(' ');
    const stopWords = ['the', 'and', 'in', 'to', 'of', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'down', 'is', 'are', 'will', 'has', 'have', 'be', 'a', 'an'];
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
    
    const freq: Record<string, number> = {};
    words.forEach(w => {
      const clean = w.replace(/[^a-z]/g, '');
      if (clean) freq[clean] = (freq[clean] || 0) + 1;
    });

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    if (activeTab === 'portfolio') {
      filtered = articles.filter(a => a.relatedTickers.some(t => portfolioTickers.includes(t)));
    } else if (activeTab === 'trending') {
      filtered = articles.filter(a => a.isTrending);
    } else if (activeTab === 'watchlist') {
      filtered = articles.filter(a => a.relatedTickers.some(t => watchlist.has(t)));
    }

    if (selectedKeyword) {
      const k = selectedKeyword.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(k) || a.summary.toLowerCase().includes(k));
    }

    return [...filtered].sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (sortOption === 'oldest') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      return 0;
    });
  }, [articles, activeTab, portfolioTickers, sortOption, watchlist, selectedKeyword]);

  // Related Articles
  const relatedArticles = useMemo(() => {
    if (!viewArticle) return [];
    return articles
      .filter(a => 
        a.id !== viewArticle.id && 
        (a.category === viewArticle.category || a.relatedTickers.some(t => viewArticle.relatedTickers?.includes(t)))
      )
      .slice(0, 4);
  }, [viewArticle, articles]);

  // --- Effects ---

  // Apply Theme
  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-terminal', 'theme-ocean', 'dark');
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Ensure Tailwind dark mode works for all dark-ish themes
    if (theme !== 'light') {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Load Saved Data
  useEffect(() => {
    const savedArticle = localStorage.getItem('fingenie_selected_article');
    const savedMessages = localStorage.getItem('fingenie_chat_messages');
    const savedWatchlist = localStorage.getItem('fingenie_watchlist');
    const savedTheme = localStorage.getItem('fingenie_theme') as Theme;

    if(savedTheme) setTheme(savedTheme);

    if (savedArticle) {
        try {
            const parsedArticle = JSON.parse(savedArticle);
            setSelectedArticle(parsedArticle);
            let parsedMessages: ChatMessage[] = [];
            if (savedMessages) parsedMessages = JSON.parse(savedMessages);
            setChatMessages(parsedMessages);
            startChatSession(parsedArticle, USER_PORTFOLIO, parsedMessages);
        } catch (e) { console.error("Failed to restore chat", e); }
    }

    if (savedWatchlist) {
      try { setWatchlist(new Set(JSON.parse(savedWatchlist))); } catch (e) { console.error(e); }
    }
  }, []);

  // Persist Data
  useEffect(() => {
      if (selectedArticle) localStorage.setItem('fingenie_selected_article', JSON.stringify(selectedArticle));
      else localStorage.removeItem('fingenie_selected_article');
  }, [selectedArticle]);

  useEffect(() => {
      if (chatMessages.length > 0) localStorage.setItem('fingenie_chat_messages', JSON.stringify(chatMessages));
      else localStorage.removeItem('fingenie_chat_messages');
  }, [chatMessages]);

  useEffect(() => {
      localStorage.setItem('fingenie_watchlist', JSON.stringify(Array.from(watchlist)));
  }, [watchlist]);
  
  useEffect(() => {
      localStorage.setItem('fingenie_theme', theme);
  }, [theme]);

  // Data Loading
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoadingNews(true);
    try {
        const fetchedArticles = await fetchLiveNews();
        if (fetchedArticles && fetchedArticles.length > 0) {
            setArticles(fetchedArticles);
        }
    } catch (error) {
        console.error("Failed to load news:", error);
    } finally {
        if (!silent) setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    loadData(false); 
    const intervalId = setInterval(() => loadData(true), 300000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  // Tour Logic
  useEffect(() => {
    if (!loadingNews && articles.length > 0 && currentView === 'news') {
        const hasSeen = localStorage.getItem('hasSeenOnboarding_v1');
        if (!hasSeen) {
             setTimeout(() => setTourOpen(true), 1500);
        }
    }
  }, [loadingNews, articles.length, currentView]);

  // --- Handlers ---

  const handleLaunch = () => {
      setCurrentView('workspace');
  };

  const handleToggleWatchlist = (ticker: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const handleAIAction = async (article: Article, action: AITaskType) => {
    const isSameArticle = selectedArticle?.id === article.id;
    setSidebarOpen(true);
    
    if (action === 'chat') {
        if (!isSameArticle) {
             setSelectedArticle(article);
             setChatMessages([]);
             startChatSession(article, USER_PORTFOLIO);
        }
        return;
    }

    const displayTexts: Record<string, string> = {
        'summary': "Summarize this article for me.",
        'impact': "How does this affect my portfolio?",
        'eli5': "Explain this like I'm 5.",
        'compare': "Compare the companies mentioned.",
        'history': "Has this happened before?",
        'bear-case': "Play Devil's Advocate.",
        'jargon': "Explain the jargon."
    };

    const displayMessage = displayTexts[action] || "Analyze this.";
    const complexPrompt = getInitialPrompt(action as any);

    if (!isSameArticle || chatMessages.length === 0) {
        setSelectedArticle(article);
        setChatMessages([]); 
        startChatSession(article, USER_PORTFOLIO);
        await sendMessage(displayMessage, complexPrompt);
    } else {
        await sendMessage(displayMessage, complexPrompt);
    }
  };

  const sendMessage = async (text: string, apiPromptOverride?: string) => {
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text, 
        timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    const promptToSend = apiPromptOverride || text;
    try {
        const result = await sendChatMessage(promptToSend);
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text,
            sentimentScore: result.sentiment,
            suggestions: result.suggestions,
            chartData: result.chartData,
            dominoData: result.dominoData,
            insightData: result.insightData,
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setAiLoading(false);
    }
  };

  const handleSmartAction = async (ticker: string, docType: DocumentType) => {
    setSidebarOpen(true);
    setAiLoading(true);

    const intentMap: Record<DocumentType, string> = {
        'annual_report': 'Annual Report Analysis',
        'concall': 'Earnings Call Analysis',
        'quarterly_result': 'Quarterly Results',
        'red_flags': 'Forensic Red Flags',
        'supply_chain': 'Supply Chain Map'
    };
    const userText = `Analyze the ${intentMap[docType]} for ${ticker}`;
    
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() }]);

    try {
        const { text, sentiment, chartData, dominoData } = await analyzeDocument(ticker, docType);
        setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text,
            sentimentScore: sentiment,
            chartData: chartData,
            dominoData: dominoData,
            timestamp: Date.now()
        }]);
    } catch (error) { /* */ } finally { setAiLoading(false); }
  };

  const TOUR_STEPS = [
      { targetId: '', title: 'Welcome to Market Pulse', content: 'This module keeps you updated with real-time news while FinGenie handles deep analysis.' },
      { targetId: 'tour-layout-toggle', title: 'Customize View', content: 'Switch between Grid, List, or Timeline view.' },
      { targetId: 'tour-ai-actions', title: 'Quick Analysis', content: 'Use AI to instantly summarize or check impact.' }
  ];

  const tabsWithWatchlist = [...TABS, { id: 'watchlist', label: 'My Watchlist' }];

  // --- RENDER ---

  if (currentView === 'landing') {
      return <LandingPage onLaunch={handleLaunch} />;
  }

  // --- APP SHELL LAYOUT ---
  return (
    <div className="flex h-screen bg-theme-bg text-theme-text font-sans overflow-hidden transition-colors duration-300">
      
      {/* EXPANDED SIDEBAR NAVIGATION */}
      <aside className={`flex-shrink-0 bg-theme-surface border-r border-theme-border flex flex-col transition-all duration-300 z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
         
         {/* Logo Area */}
         <div className="h-16 flex items-center gap-3 px-5 border-b border-theme-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xl shadow-lg">
                F
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="font-bold text-lg text-theme-text tracking-tight whitespace-nowrap">FinInsight</span>
                <span className="text-[10px] text-theme-muted uppercase tracking-wider whitespace-nowrap">Intelligence</span>
            </div>
         </div>

         {/* Navigation Links */}
         <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
             <button 
                onClick={() => setCurrentView('workspace')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    currentView === 'workspace' 
                    ? 'bg-theme-bg text-theme-accent shadow-sm ring-1 ring-theme-border' 
                    : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'
                }`}
             >
                <Terminal size={20} className="flex-shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    Workspace
                </span>
                {currentView === 'workspace' && !isSidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-theme-accent"></div>}
             </button>
             
             <button 
                onClick={() => setCurrentView('news')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    currentView === 'news' 
                    ? 'bg-theme-bg text-theme-accent shadow-sm ring-1 ring-theme-border' 
                    : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'
                }`}
             >
                <Newspaper size={20} className="flex-shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    Market Pulse
                </span>
                {currentView === 'news' && !isSidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-theme-accent"></div>}
             </button>
         </nav>

         {/* Footer Actions */}
         <div className="p-3 border-t border-theme-border space-y-2 bg-theme-surface">
             {/* Theme Toggle */}
             <div className="relative">
                 <button 
                    onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-theme-muted hover:bg-theme-bg hover:text-theme-text ${isThemeSelectorOpen ? 'bg-theme-bg text-theme-accent' : ''}`}
                 >
                    <Palette size={20} className="flex-shrink-0" />
                    <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        Appearance
                    </span>
                 </button>
                 <ThemeSelector 
                    isOpen={isThemeSelectorOpen} 
                    onClose={() => setIsThemeSelectorOpen(false)}
                    currentTheme={theme}
                    onChange={setTheme}
                 />
             </div>

             {/* Back / Logout */}
             <button 
                onClick={() => setCurrentView('landing')}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-theme-muted hover:bg-red-500/10 hover:text-red-500"
                title="Exit to Landing"
             >
                <LogOut size={20} className="flex-shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    Back to Home
                </span>
             </button>
             
             {/* Sidebar Toggle */}
             <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 text-theme-muted hover:text-theme-text hover:bg-theme-bg rounded-lg mt-2"
             >
                 {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
             </button>
         </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-theme-bg">
        {/* Top Bar (Contextual) */}
        <header className="h-16 border-b border-theme-border bg-theme-bg/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
                <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
                    {currentView === 'workspace' && <Terminal size={20} className="text-theme-accent"/>}
                    {currentView === 'news' && <Newspaper size={20} className="text-theme-accent"/>}
                    {currentView === 'workspace' ? 'FinGenie Workspace' : 'Market Pulse'}
                </h2>
                <p className="text-xs text-theme-muted font-mono mt-0.5">
                    {currentView === 'workspace' ? 'AI ANALYST • ONLINE' : 'REAL-TIME INTELLIGENCE FEED'}
                </p>
            </div>
            <div className="flex items-center gap-6">
                <div className="hidden md:block w-96">
                    <StockTicker />
                </div>
                <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-theme-surface cursor-pointer shadow-sm">
                        JD
                     </div>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-theme-bg scrollbar-hide relative">
             {currentView === 'workspace' ? (
                 <FinGeniePage botAvatarUrl={FINGENIE_AVATAR_URL} />
             ) : (
                /* MARKET PULSE VIEW */
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-theme-text mb-2 flex items-center gap-3">
                                Market Pulse
                                <button 
                                    onClick={() => loadData(false)}
                                    disabled={loadingNews}
                                    className={`p-1.5 text-theme-muted hover:text-theme-accent transition-all rounded-full hover:bg-theme-surface ${loadingNews ? 'animate-spin text-theme-accent' : ''}`}
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </h1>
                            <p className="text-theme-muted">
                                Real-time feed filtered for your portfolio and trending topics.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <SortControls currentSort={sortOption} onSortChange={setSortOption} />
                            <LayoutToggle mode={layoutMode} onChange={setLayoutMode} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-theme-border mb-6 overflow-x-auto scrollbar-hide">
                        {tabsWithWatchlist.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-6 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab.id 
                                    ? 'border-theme-accent text-theme-accent' 
                                    : 'border-transparent text-theme-muted hover:text-theme-text hover:border-theme-border'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {!loadingNews && (
                        <KeywordCloud 
                            keywords={trendingKeywords} 
                            selectedKeyword={selectedKeyword} 
                            onSelect={setSelectedKeyword} 
                        />
                    )}

                    {/* News Feed */}
                    {loadingNews ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                           {[1,2,3].map(i => (
                               <div key={i} className="h-64 bg-theme-surface rounded-xl animate-pulse"></div>
                           ))}
                        </div>
                    ) : (
                        <>
                            {layoutMode === LayoutMode.TIMELINE ? (
                                <TimelineView 
                                    articles={filteredArticles} 
                                    portfolioTickers={portfolioTickers}
                                    watchlist={watchlist}
                                    onToggleWatchlist={handleToggleWatchlist}
                                    onAction={handleAIAction}
                                    onClick={(a) => setViewArticle(a)}
                                />
                            ) : (
                                <div className={`grid gap-6 ${
                                    layoutMode === LayoutMode.GRID 
                                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                                    : 'grid-cols-1 max-w-4xl mx-auto'
                                }`}>
                                    {filteredArticles.map(article => (
                                        <NewsCard 
                                            key={article.id} 
                                            article={article} 
                                            layout={layoutMode}
                                            isPortfolioRelevant={article.relatedTickers.some(t => portfolioTickers.includes(t))}
                                            watchlist={watchlist}
                                            onToggleWatchlist={handleToggleWatchlist}
                                            onAction={handleAIAction}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>
             )}
        </div>

        {/* Overlays */}
        <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            loading={aiLoading}
            selectedArticle={selectedArticle}
            messages={chatMessages}
            onSendMessage={sendMessage}
            botAvatarUrl={FINGENIE_AVATAR_URL}
            onFeedback={() => {}}
            onSmartAction={handleSmartAction}
        />

        <ArticleDetailModal 
            article={viewArticle}
            isOpen={!!viewArticle}
            onClose={() => setViewArticle(null)}
            relatedArticles={relatedArticles}
            onSelectRelated={setViewArticle}
        />
        
        <PortfolioAnalysisModal 
            isOpen={portfolioModalOpen}
            onClose={() => setPortfolioModalOpen(false)}
            portfolio={USER_PORTFOLIO}
            articles={articles}
        />

        <OnboardingTour 
            isOpen={tourOpen} 
            onClose={() => { setTourOpen(false); localStorage.setItem('hasSeenOnboarding_v1', 'true'); }} 
            steps={TOUR_STEPS} 
        />
      </div>
    </div>
  );
};

export default App;
