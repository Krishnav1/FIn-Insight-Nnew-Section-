import React, { useState } from 'react';
import { Article, LayoutMode } from '../types';
import { Briefcase, Zap, BookOpen, Activity, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import TickerText from './TickerText';
import TickerPulse from './TickerPulse';

interface NewsCardProps {
  article: Article;
  layout: LayoutMode;
  isPortfolioRelevant: boolean;
  onAction: (article: Article, action: 'summary' | 'impact' | 'eli5') => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, layout, isPortfolioRelevant, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isList = layout === LayoutMode.LIST;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden flex cursor-pointer group/card ${
        isList ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Image Section */}
      <div className={`relative ${isList ? 'w-48 shrink-0 h-auto' : 'h-48 w-full'}`}>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        {isPortfolioRelevant && (
          <div className="tour-portfolio-badge absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
            <Briefcase size={12} />
            PORTFOLIO
          </div>
        )}
        {article.isTrending && !isPortfolioRelevant && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
            <Activity size={12} />
            TRENDING
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow relative z-0">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{article.category}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
        </div>
        
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-2 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors ${isExpanded ? '' : 'line-clamp-2'}`}>
          <TickerText text={article.title} tickers={article.relatedTickers} />
        </h3>
        
        <p className={`text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow ${isExpanded ? '' : 'line-clamp-3'}`}>
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
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    Read Full Story <ExternalLink size={16} />
                </a>
            </div>
        )}

        {/* Market Pulse - Ticker Charts */}
        {article.relatedTickers && article.relatedTickers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pt-1">
            {article.relatedTickers.map(ticker => (
              <TickerPulse key={ticker} ticker={ticker} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
            <div className="tour-ai-actions flex gap-2">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'summary'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1.5 rounded transition-colors"
                    title="AI Summary"
                >
                    <Zap size={14} />
                    <span className="hidden sm:inline">Summary</span>
                </button>
                {isPortfolioRelevant && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction(article, 'impact'); }}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1.5 rounded transition-colors"
                        title="Impact Analysis"
                    >
                        <Activity size={14} />
                        <span className="hidden sm:inline">Impact</span>
                    </button>
                )}
                 <button 
                    onClick={(e) => { e.stopPropagation(); onAction(article, 'eli5'); }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1.5 rounded transition-colors"
                    title="Explain Like I'm 5"
                >
                    <BookOpen size={14} />
                    <span className="hidden sm:inline">ELI5</span>
                </button>
            </div>
            
            {/* Toggle Icon / Source Link */}
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {article.source}
                </span>
                <div className="text-gray-400 dark:text-gray-500">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;