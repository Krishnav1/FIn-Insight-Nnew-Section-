
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Article, 
  LayoutMode, 
  ChatMessage, 
  AITaskType,
  SortOption,
  DocumentType
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
import { Search, Menu, PieChart, Moon, Sun, RefreshCw, ShieldAlert, BrainCircuit, MessageSquare } from 'lucide-react';

// --- BRAND ASSETS ---
const FININSIGHT_LOGO_URL = "logo.jpg"; 
const FINGENIE_AVATAR_URL = "fingenie.jpg";

const App: React.FC = () => {
  // --- State ---
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.GRID);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingNews, setLoadingNews] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  
  // Watchlist & Keywords
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Sidebar / AI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // View Mode (Dashboard vs Full Chat)
  const [isChatMode, setIsChatMode] = useState(false);

  // Modals State
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);

  // Tour State
  const [tourOpen, setTourOpen] = useState(false);

  // --- Derived Data ---
  const portfolioTickers = useMemo(() => USER_PORTFOLIO.map(p => p.symbol), []);

  // Extract Keywords from top articles
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
    
    // Tab filtering
    if (activeTab === 'portfolio') {
      filtered = articles.filter(a => a.relatedTickers.some(t => portfolioTickers.includes(t)));
    } else if (activeTab === 'trending') {
      filtered = articles.filter(a => a.isTrending);
    } else if (activeTab === 'watchlist') {
      filtered = articles.filter(a => a.relatedTickers.some(t => watchlist.has(t)));
    }

    // Keyword filtering
    if (selectedKeyword) {
      const k = selectedKeyword.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(k) || a.summary.toLowerCase().includes(k));
    }

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (sortOption === 'oldest') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      // 'relevance' assumes the API return order (usually search relevance) is best
      return 0;
    });
  }, [articles, activeTab, portfolioTickers, sortOption, watchlist, selectedKeyword]);

  // Related Articles for Modal
  const relatedArticles = useMemo(() => {
    if (!viewArticle) return [];
    return articles
      .filter(a => 
        a.id !== viewArticle.id && 
        (a.category === viewArticle.category || a.relatedTickers.some(t => viewArticle.relatedTickers.includes(t)))
      )
      .slice(0, 4);
  }, [viewArticle, articles]);

  // --- Effects ---

  // Handle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load Saved Data on Mount
  useEffect(() => {
    const savedArticle = localStorage.getItem('fingenie_selected_article');
    const savedMessages = localStorage.getItem('fingenie_chat_messages');
    const savedWatchlist = localStorage.getItem('fingenie_watchlist');
    const savedSidebarOpen = localStorage.getItem('fingenie_sidebar_open');

    if (savedArticle) {
        try {
            const parsedArticle = JSON.parse(savedArticle);
            setSelectedArticle(parsedArticle);
            
            let parsedMessages: ChatMessage[] = [];
            if (savedMessages) {
                parsedMessages = JSON.parse(savedMessages);
                setChatMessages(parsedMessages);
            }
            
            // Re-initialize the Gemini chat session with restored context and history
            startChatSession(parsedArticle, USER_PORTFOLIO, parsedMessages);
        } catch (e) {
             console.error("Failed to restore chat session:", e);
             localStorage.removeItem('fingenie_selected_article');
             localStorage.removeItem('fingenie_chat_messages');
        }
    }

    if (savedWatchlist) {
      try {
        setWatchlist(new Set(JSON.parse(savedWatchlist)));
      } catch (e) { console.error(e); }
    }

    if (savedSidebarOpen === 'true') {
        setSidebarOpen(true);
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
      localStorage.setItem('fingenie_sidebar_open', String(sidebarOpen));
  }, [sidebarOpen]);

  /**
   * Loads news data.
   */
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

  // Initialize Tour after data load
  useEffect(() => {
    if (!loadingNews && articles.length > 0) {
        const hasSeen = localStorage.getItem('hasSeenOnboarding_v1');
        if (!hasSeen) {
             setTimeout(() => setTourOpen(true), 1500);
        }
    }
  }, [loadingNews, articles.length]);

  // --- Handlers ---

  const handleToggleWatchlist = (ticker: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const handleTourClose = () => {
      setTourOpen(false);
      localStorage.setItem('hasSeenOnboarding_v1', 'true');
  };

  const handleCardClick = (article: Article) => {
      setViewArticle(article);
  };

  const handleAIAction = async (article: Article, action: AITaskType) => {
    const isSameArticle = selectedArticle?.id === article.id;
    setSidebarOpen(true);
    
    // If we are just clicking 'chat', we don't send a prompt, just open sidebar
    if (action === 'chat') {
        if (!isSameArticle) {
             setSelectedArticle(article);
             setChatMessages([]);
             startChatSession(article, USER_PORTFOLIO);
        }
        return;
    }

    // For specific actions (summary, impact, eli5, history, bear-case, jargon, compare)
    if (isSameArticle && chatMessages.length > 0) {
        const prompt = getInitialPrompt(action as any);
        await sendMessage(prompt);
        return;
    }

    // New article selected or fresh session
    if (!isSameArticle || chatMessages.length === 0) {
        setSelectedArticle(article);
        setChatMessages([]); // Clear old chat
        startChatSession(article, USER_PORTFOLIO);
        
        const initialPrompt = getInitialPrompt(action as any);
        await sendMessage(initialPrompt);
    }
  };

  const handleFeedback = (messageId: string, type: 'liked' | 'disliked') => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const isSame = (type === 'liked' && msg.liked) || (type === 'disliked' && msg.disliked);
      if (isSame) {
        return { ...msg, liked: false, disliked: false };
      }
      
      return {
        ...msg,
        liked: type === 'liked',
        disliked: type === 'disliked'
      };
    }));
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setAiLoading(true);

    // Intercept /portfolio command logic for dashboard chat
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
                    timestamp: Date.now()
                };
                setChatMessages(prev => [...prev, botMsg]);
                setAiLoading(false);
                return;
            }
        } catch (e) {
            console.error("Portfolio Command Failed", e);
            // Fall through to normal chat if failed
        }
    }

    const result = await sendChatMessage(text);

    const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        sentimentScore: result.sentiment,
        suggestions: result.suggestions,
        chartData: result.chartData,
        dominoData: result.dominoData,
        timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, aiMsg]);
    setAiLoading(false);
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
    
    // Add User Message
    setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: userText,
        timestamp: Date.now()
    }]);

    try {
        // Call specialized service which now returns chartData and dominoData
        const { text, sentiment, chartData, dominoData } = await analyzeDocument(ticker, docType);
        
        // Add Bot Message
        setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text,
            sentimentScore: sentiment,
            chartData: chartData, // Use the extracted chart data
            dominoData: dominoData,
            timestamp: Date.now()
        }]);
    } catch (error) {
        setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "I encountered an error trying to analyze that document.",
            timestamp: Date.now()
        }]);
    } finally {
        setAiLoading(false);
    }
  };

  // --- Render Helpers ---

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}>
      {/* Advanced Shimmer Effect with "Chart" Pulse */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-gray-600/30 to-transparent" />
    </div>
  );

  const renderSkeletons = () => (
    <div className={`grid gap-6 ${layoutMode === LayoutMode.GRID ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
           {/* Pulsing chart graphic placeholder in skeleton */}
          <div className="relative h-48 rounded-lg mb-4 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-300/50 dark:from-gray-600/50 to-transparent"></div>
              <svg className="absolute bottom-4 left-0 right-0 w-full h-12 text-gray-300 dark:text-gray-600 opacity-50 animate-pulse" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 20 L0 15 Q 10 5, 20 15 T 40 15 T 60 5 T 80 15 T 100 10 V 20 Z" fill="currentColor" />
              </svg>
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-gray-500/20 to-transparent" />
          </div>
          
          <Skeleton className="h-4 rounded w-3/4 mb-2" />
          <Skeleton className="h-4 rounded w-1/2 mb-4" />
          <Skeleton className="h-16 rounded flex-grow" />
        </div>
      ))}
    </div>
  );

  const TOUR_STEPS = [
      {
          targetId: '', 
          title: 'Welcome to FinInsight! 👋',
          content: 'Your professional market intelligence dashboard. Let us show you how to get the most out of your news feed.'
      },
      {
          targetId: 'tour-layout-toggle',
          title: 'Customize Your View 📐',
          content: 'Prefer a dense grid, a detailed list, or a chronological timeline? Switch layouts instantly here.'
      },
      {
          targetId: 'tour-portfolio-badge', 
          title: 'Portfolio Intelligence 💼',
          content: 'We automatically highlight news affecting your specific holdings (like Reliance or Tata) with this badge, so you never miss a beat.'
      },
      {
          targetId: 'tour-ai-actions', 
          title: 'Ask FinGenie 🧞‍♂️',
          content: 'Tap these buttons to summon your AI assistant. Get instant summaries, impact analysis, or simple explanations.'
      }
  ];

  const tabsWithWatchlist = [...TABS, { id: 'watchlist', label: 'My Watchlist' }];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 animate-fade-in cursor-pointer" onClick={() => setIsChatMode(false)}>
                   <img 
                     src={FININSIGHT_LOGO_URL} 
                     alt="FinInsight" 
                     className="h-10 w-auto object-contain" 
                   />
                </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                {/* Workspace Toggle */}
                <button
                    onClick={() => setIsChatMode(!isChatMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isChatMode ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <MessageSquare size={16} />
                    <span className="hidden sm:inline">Workspace</span>
                </button>
                
                {/* Portfolio Brain Button (Only on Dashboard) */}
                {!isChatMode && (
                    <button
                        onClick={() => setPortfolioModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-indigo-500/20"
                    >
                        <BrainCircuit size={16} />
                        <span className="hidden sm:inline">Portfolio Brain</span>
                    </button>
                )}

                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    JD
                </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Stock Ticker */}
      <StockTicker />

      {/* Main Content Switch */}
      {isChatMode ? (
          <FinGeniePage botAvatarUrl={FINGENIE_AVATAR_URL} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors flex items-center gap-3">
                        Market News
                        <button 
                            onClick={() => loadData(false)}
                            disabled={loadingNews}
                            className={`p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${loadingNews ? 'animate-spin text-blue-600' : ''}`}
                            title="Refresh News"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </h1>
                    <div 
                    onClick={() => setPortfolioModalOpen(true)}
                    className="cursor-pointer group"
                    >
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            <PieChart size={16} className="text-emerald-600 dark:text-emerald-400"/>
                            Your portfolio is up <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1.2%</span> today.
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Why?</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <SortControls currentSort={sortOption} onSortChange={setSortOption} />
                    <LayoutToggle mode={layoutMode} onChange={setLayoutMode} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide transition-colors">
                {tabsWithWatchlist.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-6 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Keyword Cloud */}
            {!loadingNews && (
                <KeywordCloud 
                    keywords={trendingKeywords} 
                    selectedKeyword={selectedKeyword} 
                    onSelect={setSelectedKeyword} 
                />
            )}

            {/* News Feed */}
            {loadingNews ? (
                renderSkeletons()
            ) : (
                <>
                    {layoutMode === LayoutMode.TIMELINE ? (
                        <TimelineView 
                            articles={filteredArticles} 
                            portfolioTickers={portfolioTickers}
                            watchlist={watchlist}
                            onToggleWatchlist={handleToggleWatchlist}
                            onAction={handleAIAction}
                            onClick={handleCardClick}
                        />
                    ) : (
                        <div className={`grid gap-6 ${
                            layoutMode === LayoutMode.GRID 
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                            : 'grid-cols-1 max-w-4xl mx-auto'
                        }`}>
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map(article => (
                                    <NewsCard 
                                        key={article.id} 
                                        article={article} 
                                        layout={layoutMode}
                                        isPortfolioRelevant={article.relatedTickers.some(t => portfolioTickers.includes(t))}
                                        watchlist={watchlist}
                                        onToggleWatchlist={handleToggleWatchlist}
                                        onAction={handleAIAction}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20">
                                    <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 transition-colors">
                                        <Search className="text-gray-400 dark:text-gray-500" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No news found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {activeTab === 'watchlist' ? "Your watchlist is empty." : "Try adjusting filters or check back later."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </main>
      )}

      {/* Disclaimer Footer (Only show on Dashboard) */}
      {!isChatMode && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                    <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">Disclaimer:</p>
                    <p>
                        FinInsight utilizes artificial intelligence (FinGenie) to aggregate news and generate insights. 
                        This content is for informational purposes only and does not constitute financial advice, endorsement, or recommendation. 
                        AI models can produce inaccurate or misleading information ("hallucinations"). 
                        Always verify market data with official sources before making investment decisions.
                    </p>
                    <p className="mt-2 opacity-70">
                        Powered by Google Gemini. Search results provided by Google Search Grounding. © {new Date().getFullYear()} FinInsight.
                    </p>
                </div>
            </div>
            </div>
        </footer>
      )}

      {/* AI Sidebar (Only on Dashboard) */}
      {!isChatMode && (
        <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            loading={aiLoading}
            selectedArticle={selectedArticle}
            messages={chatMessages}
            onSendMessage={sendMessage}
            botAvatarUrl={FINGENIE_AVATAR_URL}
            onFeedback={handleFeedback}
            onSmartAction={handleSmartAction}
        />
      )}

      {/* Expanded Article Modal */}
      <ArticleDetailModal 
        article={viewArticle}
        isOpen={!!viewArticle}
        onClose={() => setViewArticle(null)}
        relatedArticles={relatedArticles}
        onSelectRelated={setViewArticle}
      />
      
      {/* Portfolio Analysis Modal */}
      <PortfolioAnalysisModal 
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        portfolio={USER_PORTFOLIO}
        articles={articles}
      />

      {/* Onboarding Tour */}
      <OnboardingTour 
        isOpen={tourOpen} 
        onClose={handleTourClose} 
        steps={TOUR_STEPS} 
      />

    </div>
  );
};

export default App;
