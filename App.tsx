import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Article, 
  LayoutMode, 
  ChatMessage, 
  AITaskType 
} from './types';
import { USER_PORTFOLIO, TABS } from './constants';
import { startChatSession, sendChatMessage, getInitialPrompt, fetchLiveNews } from './services/geminiService';

// Components
import LayoutToggle from './components/LayoutToggle';
import NewsCard from './components/NewsCard';
import TimelineView from './components/TimelineView';
import Sidebar from './components/Sidebar';
import OnboardingTour from './components/OnboardingTour';
import ArticleDetailModal from './components/ArticleDetailModal';
import { Search, Bell, Menu, TrendingUp, PieChart, Moon, Sun, RefreshCw, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.GRID);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingNews, setLoadingNews] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Sidebar / AI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Detail Modal State
  const [viewArticle, setViewArticle] = useState<Article | null>(null);

  // Tour State
  const [tourOpen, setTourOpen] = useState(false);

  // --- Derived Data ---
  const portfolioTickers = useMemo(() => USER_PORTFOLIO.map(p => p.symbol), []);

  const filteredArticles = useMemo(() => {
    let filtered = articles;
    if (activeTab === 'portfolio') {
      filtered = articles.filter(a => a.relatedTickers.some(t => portfolioTickers.includes(t)));
    } else if (activeTab === 'trending') {
      filtered = articles.filter(a => a.isTrending);
    }
    return filtered;
  }, [articles, activeTab, portfolioTickers]);

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

  // Load Saved Chat Session on Mount
  useEffect(() => {
    const savedArticle = localStorage.getItem('fingenie_selected_article');
    const savedMessages = localStorage.getItem('fingenie_chat_messages');

    if (savedArticle && savedMessages) {
        try {
            const parsedArticle = JSON.parse(savedArticle);
            const parsedMessages = JSON.parse(savedMessages);
            
            setSelectedArticle(parsedArticle);
            setChatMessages(parsedMessages);
            
            // Re-initialize the Gemini session with history so it knows context
            startChatSession(parsedArticle, USER_PORTFOLIO, parsedMessages);
        } catch (e) {
            console.error("Failed to parse saved chat session", e);
            localStorage.removeItem('fingenie_selected_article');
            localStorage.removeItem('fingenie_chat_messages');
        }
    }
  }, []);

  // Persist Selected Article
  useEffect(() => {
      if (selectedArticle) {
          localStorage.setItem('fingenie_selected_article', JSON.stringify(selectedArticle));
      } else {
          localStorage.removeItem('fingenie_selected_article');
      }
  }, [selectedArticle]);

  // Persist Chat Messages
  useEffect(() => {
      if (chatMessages.length > 0) {
          localStorage.setItem('fingenie_chat_messages', JSON.stringify(chatMessages));
      } else {
          if (selectedArticle) {
              localStorage.removeItem('fingenie_chat_messages');
          }
      }
  }, [chatMessages, selectedArticle]);

  /**
   * Loads news data.
   * @param silent If true, does not trigger the main loading skeleton. Used for background refresh.
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

  // Load data on mount and setup auto-refresh interval
  useEffect(() => {
    loadData(false); 

    const intervalId = setInterval(() => {
        console.log("Auto-refreshing news...");
        loadData(true); 
    }, 300000);

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
    
    if (isSameArticle && chatMessages.length > 0 && action !== 'chat') {
        const prompt = getInitialPrompt(action as 'summary' | 'impact' | 'eli5');
        await sendMessage(prompt);
        return;
    }

    if (!isSameArticle) {
        setSelectedArticle(article);
        setChatMessages([]); 
        startChatSession(article, USER_PORTFOLIO);
        
        const initialPrompt = getInitialPrompt(action as 'summary' | 'impact' | 'eli5');
        await sendMessage(initialPrompt);
    }
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

    const result = await sendChatMessage(text);

    const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        sentimentScore: result.sentiment,
        suggestions: result.suggestions,
        timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, aiMsg]);
    setAiLoading(false);
  };

  // --- Render Helpers ---

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-gray-600/30 to-transparent" />
    </div>
  );

  const renderSkeletons = () => (
    <div className={`grid gap-6 ${layoutMode === LayoutMode.GRID ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-48 rounded-lg mb-4" />
          <Skeleton className="h-4 rounded w-3/4 mb-2" />
          <Skeleton className="h-4 rounded w-1/2 mb-4" />
          <Skeleton className="h-16 rounded" />
        </div>
      ))}
    </div>
  );

  const TOUR_STEPS = [
      {
          targetId: '', 
          title: 'Welcome to FinGenie! 👋',
          content: 'Your AI-powered assistant for the Indian Stock Market. Let us show you how to get the most out of your news feed.'
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
          title: 'Instant AI Analysis ⚡',
          content: 'Don’t just read—understand. Get one-click Summaries, Portfolio Impact analysis, or simple "Explain Like I’m 5" breakdowns.'
      }
  ];

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
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1.5 rounded">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 dark:from-blue-400 dark:to-blue-200">
                        FinGenie
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5 transition-colors">
                    <Search size={18} className="text-gray-400 dark:text-gray-300" />
                    <input 
                        type="text" 
                        placeholder="Search markets..." 
                        className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                </button>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    JD
                </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
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
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 transition-colors">
                    <PieChart size={16} className="text-emerald-600 dark:text-emerald-400"/>
                    Your portfolio is up <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1.2%</span> today.
                </p>
            </div>
            
            <LayoutToggle mode={layoutMode} onChange={setLayoutMode} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto scrollbar-hide transition-colors">
            {TABS.map((tab) => (
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

        {/* News Feed */}
        {loadingNews ? (
            renderSkeletons()
        ) : (
            <>
                {layoutMode === LayoutMode.TIMELINE ? (
                    <TimelineView 
                        articles={filteredArticles} 
                        portfolioTickers={portfolioTickers}
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
                                    onAction={handleAIAction}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 transition-colors">
                                    <Search className="text-gray-400 dark:text-gray-500" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No news found</h3>
                                <p className="text-gray-500 dark:text-gray-400">Try switching tabs or check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </main>

      {/* Disclaimer Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
                <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">Disclaimer:</p>
                <p>
                    FinGenie utilizes artificial intelligence to aggregate news and generate insights. 
                    This content is for informational purposes only and does not constitute financial advice, endorsement, or recommendation. 
                    AI models can produce inaccurate or misleading information ("hallucinations"). 
                    Always verify market data with official sources before making investment decisions.
                </p>
                <p className="mt-2 opacity-70">
                    Powered by Google Gemini. Search results provided by Google Search Grounding. © {new Date().getFullYear()} FinGenie.
                </p>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        loading={aiLoading}
        selectedArticle={selectedArticle}
        messages={chatMessages}
        onSendMessage={sendMessage}
      />

      {/* Expanded Article Modal */}
      <ArticleDetailModal 
        article={viewArticle}
        isOpen={!!viewArticle}
        onClose={() => setViewArticle(null)}
        relatedArticles={relatedArticles}
        onSelectRelated={setViewArticle}
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