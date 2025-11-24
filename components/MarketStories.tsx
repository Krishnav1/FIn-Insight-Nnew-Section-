
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ChevronRight, Play, Pause } from 'lucide-react';
import { Article } from '../types';
import TickerText from './TickerText';

interface Story {
    id: string;
    title: string;
    ticker: string;
    change: number;
    summary: string;
    imageUrl: string;
    color: string;
}

interface MarketStoriesProps {
    articles: Article[];
}

const MarketStories: React.FC<MarketStoriesProps> = ({ articles }) => {
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Generate stories from top articles
    const stories: Story[] = articles.slice(0, 6).map((article, i) => {
        // Mock data generation for demo purposes
        const seed = article.title.length;
        const isPos = seed % 2 === 0;
        return {
            id: article.id,
            title: article.title,
            ticker: article.relatedTickers[0] || 'MKT',
            change: isPos ? 1.2 + (i * 0.1) : -0.8 - (i * 0.1),
            summary: article.summary,
            imageUrl: article.imageUrl,
            color: isPos ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-orange-600'
        };
    });

    useEffect(() => {
        let interval: any;
        if (activeStoryIndex !== null && !isPaused) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        if (activeStoryIndex < stories.length - 1) {
                            setActiveStoryIndex(prevIdx => (prevIdx !== null ? prevIdx + 1 : null));
                            return 0;
                        } else {
                            setActiveStoryIndex(null);
                            return 0;
                        }
                    }
                    return prev + 2; // Speed of story
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [activeStoryIndex, isPaused, stories.length]);

    const openStory = (index: number) => {
        setActiveStoryIndex(index);
        setProgress(0);
        setIsPaused(false);
    };

    const closeStory = () => {
        setActiveStoryIndex(null);
        setProgress(0);
    };

    const nextStory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            setProgress(0);
        } else {
            closeStory();
        }
    };

    const prevStory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeStoryIndex !== null && activeStoryIndex > 0) {
            setActiveStoryIndex(activeStoryIndex - 1);
            setProgress(0);
        }
    };

    if (stories.length === 0) return null;

    return (
        <>
            {/* Stories Bar */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide mb-4">
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full bg-theme-surface border-2 border-theme-bg flex items-center justify-center">
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-blue-500 to-purple-500">+</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-theme-muted truncate w-16 text-center">Your Story</span>
                </div>

                {stories.map((story, i) => (
                    <div key={story.id} onClick={() => openStory(i)} className="flex flex-col items-center gap-1 cursor-pointer group">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${story.color} p-[2px] group-hover:scale-105 transition-transform shadow-sm`}>
                            <div className="w-full h-full rounded-full border-2 border-theme-bg overflow-hidden relative">
                                <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-theme-text truncate w-16 text-center">{story.ticker}</span>
                    </div>
                ))}
            </div>

            {/* Full Screen Overlay */}
            {activeStoryIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center sm:backdrop-blur-xl sm:bg-black/90">
                    <div className="relative w-full h-full sm:w-[400px] sm:h-[80vh] sm:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
                        
                        {/* Story Content */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                            style={{ backgroundImage: `url(${stories[activeStoryIndex].imageUrl})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
                        </div>

                        {/* Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                            {stories.map((_, i) => (
                                <div key={i} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-white transition-all duration-100 ease-linear"
                                        style={{ 
                                            width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${progress}%` : '0%' 
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-20">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${stories[activeStoryIndex].color} p-[1.5px]`}>
                                    <img src={stories[activeStoryIndex].imageUrl} className="w-full h-full rounded-full object-cover border border-black" />
                                </div>
                                <div>
                                    <span className="text-white text-sm font-bold block shadow-black drop-shadow-md">{stories[activeStoryIndex].ticker}</span>
                                    <span className="text-gray-300 text-[10px] block shadow-black drop-shadow-md">2h ago</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsPaused(!isPaused)} className="text-white/80 hover:text-white">
                                    {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                                </button>
                                <button onClick={closeStory} className="text-white/80 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-12 sm:pb-6">
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full mb-4 backdrop-blur-md border border-white/10 ${stories[activeStoryIndex].change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {stories[activeStoryIndex].change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span className="font-bold text-sm">{Math.abs(stories[activeStoryIndex].change).toFixed(2)}% Today</span>
                            </div>
                            
                            <h2 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                                <TickerText text={stories[activeStoryIndex].title} tickers={[stories[activeStoryIndex].ticker]} />
                            </h2>
                            
                            <p className="text-gray-200 text-sm leading-relaxed line-clamp-3 mb-6 drop-shadow-md">
                                {stories[activeStoryIndex].summary}
                            </p>

                            <button className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                                Read Full Analysis <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Navigation Touch Zones */}
                        <div className="absolute inset-0 z-10 flex">
                            <div className="w-1/3 h-full" onClick={prevStory}></div>
                            <div className="w-1/3 h-full" onClick={() => setIsPaused(!isPaused)}></div>
                            <div className="w-1/3 h-full" onClick={nextStory}></div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MarketStories;
