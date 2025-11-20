import React from 'react';
import { X, Calendar, ExternalLink } from 'lucide-react';
import { Article } from '../types';
import TickerText from './TickerText';

interface ArticleDetailModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  relatedArticles: Article[];
  onSelectRelated: (article: Article) => void;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  isOpen,
  onClose,
  relatedArticles,
  onSelectRelated
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col border border-gray-200 dark:border-gray-700">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 w-full shrink-0 group">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
             <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                    {article.category}
                </span>
                <span className="text-gray-300 text-xs font-medium flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(article.publishedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </span>
             </div>
             <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-sm">
                {article.title}
             </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 bg-white dark:bg-gray-800">
            <div className="prose dark:prose-invert max-w-none mb-8">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    <TickerText text={article.summary} tickers={article.relatedTickers} />
                </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Source:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{article.source}</span>
                </div>
                <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    Read Full Story <ExternalLink size={16} />
                </a>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Related News</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {relatedArticles.map(related => (
                            <div 
                                key={related.id} 
                                onClick={() => onSelectRelated(related)}
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex gap-3 group"
                            >
                                <img src={related.imageUrl} className="w-16 h-16 object-cover rounded-md bg-gray-200 dark:bg-gray-700" alt="" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {related.title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1.5">
                                        <span>{related.source}</span>
                                        <span>•</span>
                                        <span>{new Date(related.publishedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailModal;