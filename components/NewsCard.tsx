
import React, { useState, useMemo } from 'react';
import { Article, LayoutMode, AITaskType } from '../types';
import { Briefcase, Zap, BookOpen, Activity, ExternalLink, ChevronDown, ChevronUp, Clock, Scale, Share2, History, AlertOctagon, FileQuestion } from 'lucide-react';
import TickerText from './TickerText';
import TickerPulse from './TickerPulse';

interface NewsCardProps {
  article: Article;
  layout: LayoutMode;
  isPortfolioRelevant: boolean;
  watchlist: Set<string>;
  onToggleWatchlist: (ticker: string) => void;
  onAction: (article: Article, action: AITaskType) => void;
  style?: React.CSSProperties; // Allow passing style for animations
}

const NewsCard: React.FC<NewsCardProps> = ({ article, layout, isPortfolioRelevant, watchlist, onToggleWatchlist, onAction, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isList = layout === LayoutMode.LIST;

  const readingTime = useMemo(() => {
    const text = article.summary + " " + article.title;
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)); 
  }, [article]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: article.title,
      text: `Check out this market impact on ${article.relatedTickers.join(', ')}: ${article.title} - via FinInsight`,
      url: article.url || window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex cursor-pointer group/card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-blue-900/10 ${
        isList ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${isList ? 'w-48 shrink-0 h-auto' : 'h-48 w-full'}`}>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover/card:opacity-40 transition-opacity duration-300" />
        
        {isPortfolioRelevant && (
          <div className="tour-portfolio-badge absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md z-10 animate-fade-in">
            <Briefcase size={12} />
            PORTFOLIO
          </div>
        )}
        {article.isTrending && !isPortfolioRelevant && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md z-10 animate-fade-in">
            <Activity size={12} />
            TRENDING
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Clock size={10} />
            {readingTime} min read
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow relative z-0">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">{article.category}</span>
          <div className="flex items-center gap-3">
             <span>{new Date(article.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
             <button 
                onClick={handleShare}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:scale-110 active:scale-95 duration-200"
                title="Share"
             >
               <Share2 size={14} />
             </button>
          </div>
        </div>
        
        <h3 className={`text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors ${isExpanded ? '' : 'line-clamp-2'}`}>
          <TickerText text={article.title} tickers={article.relatedTickers} />
        </h3>
        
        <p className={`text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          <TickerText text={article.summary} tickers={article.relatedTickers} />
        </p>

        {/* Expanded Content: Read More Button */}
        {isExpanded && (
            <div className="mb-4 animate-fade-in">
                <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    Read Full Story <ExternalLink size={16} />
                </a>
            </div>
        )}

        {/* Market Pulse - Ticker Charts */}
        {article.relatedTickers && article.relatedTickers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pt-1">
            {article.relatedTickers.map(ticker => (
              <TickerPulse 
                key={ticker} 
                ticker={ticker} 
                isWatchlisted={watchlist.has(ticker)}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
            <div className="tour-ai-actions flex gap-2 flex-wrap">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'summary'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                    title="AI Summary"
                >
                    <Zap size={14} />
                </button>
                {isPortfolioRelevant && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction(article, 'impact'); }}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                        title="Impact Analysis"
                    >
                        <Activity size={14} />
                        <span className="hidden sm:inline">Impact</span>
                    </button>
                )}
                {article.relatedTickers.length >= 2 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction(article, 'compare'); }}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                        title="Compare Companies"
                    >
                        <Scale size={14} />
                        <span className="hidden sm:inline">Compare</span>
                    </button>
                )}
                
                {/* Pro Features */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'history'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 bg-gray-50 dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                    title="History Repeats Analysis"
                >
                    <History size={14} />
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'bear-case'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-50 dark:bg-gray-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                    title="Devil's Advocate / Bear Case"
                >
                    <AlertOctagon size={14} />
                </button>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'jargon'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1.5 rounded transition-all hover:scale-105 active:scale-95"
                    title="Jargon Buster"
                >
                    <FileQuestion size={14} />
                </button>
            </div>
            
            {/* Toggle Icon */}
            <div className="text-gray-400 dark:text-gray-500 transition-transform duration-300 group-hover/card:text-gray-600 dark:group-hover/card:text-gray-300">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
