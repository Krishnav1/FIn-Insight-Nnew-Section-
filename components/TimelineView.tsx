
import React from 'react';
import { Article, AITaskType } from '../types';
import { Zap, BookOpen, Activity, Scale } from 'lucide-react';
import TickerText from './TickerText';
import TickerPulse from './TickerPulse';

interface TimelineViewProps {
  articles: Article[];
  portfolioTickers: string[];
  watchlist: Set<string>;
  onToggleWatchlist: (ticker: string) => void;
  onAction: (article: Article, action: AITaskType) => void;
  onClick: (article: Article) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ articles, portfolioTickers, watchlist, onToggleWatchlist, onAction, onClick }) => {
  return (
    <div className="relative container mx-auto px-4 max-w-3xl">
        {/* Vertical Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

      <div className="space-y-8 py-4">
        {articles.map((article) => {
            const isPortfolio = article.relatedTickers.some(t => portfolioTickers.includes(t));
            const date = new Date(article.publishedAt);
            const timeString = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            return (
                <div key={article.id} className="relative pl-20">
                    {/* Dot */}
                    <div className={`absolute left-[26px] top-5 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 shadow-sm z-10 ${isPortfolio ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    
                    {/* Time Label */}
                    <div className="absolute left-0 top-4 text-xs font-bold text-gray-400 dark:text-gray-500 w-16 text-right">
                        {timeString}
                    </div>

                    {/* Content Card */}
                    <div 
                        onClick={() => onClick(article)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative hover:shadow-md transition-all cursor-pointer group/card"
                    >
                         {isPortfolio && (
                            <div className="absolute -top-2 -right-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-start gap-4">
                             <img src={article.imageUrl} alt="" className="w-16 h-16 rounded object-cover bg-gray-100 dark:bg-gray-700" />
                             <div className="flex-1">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                                    <TickerText text={article.title} tickers={article.relatedTickers} />
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    <TickerText text={article.summary} tickers={article.relatedTickers} />
                                </p>
                                
                                {/* Market Pulse */}
                                {article.relatedTickers && article.relatedTickers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
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
                                
                                <div className="mt-3 flex gap-3 flex-wrap">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAction(article, 'summary'); }}
                                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        <Zap size={12} /> Summary
                                    </button>
                                    {isPortfolio && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onAction(article, 'impact'); }}
                                            className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                            <Activity size={12} /> Impact
                                        </button>
                                    )}
                                    {article.relatedTickers.length >= 2 && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onAction(article, 'compare'); }}
                                            className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            <Scale size={12} /> Compare
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAction(article, 'eli5'); }}
                                        className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        <BookOpen size={12} /> ELI5
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
