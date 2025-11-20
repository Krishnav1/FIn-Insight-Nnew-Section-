export enum LayoutMode {
  GRID = 'GRID',
  LIST = 'LIST',
  TIMELINE = 'TIMELINE'
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO string
  imageUrl: string;
  url: string;
  relatedTickers: string[];
  category: 'Market' | 'Stock' | 'Economy' | 'Technology';
  isTrending?: boolean;
}

export type AITaskType = 'summary' | 'impact' | 'eli5' | 'chat';

export interface AIHistoryItem {
  id: string;
  articleId: string;
  articleTitle: string;
  type: AITaskType;
  content: string;
  timestamp: number;
}

export interface GeminiResponse {
  text: string;
}

export type Role = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  sentimentScore?: number; // -100 (Bearish) to 100 (Bullish)
  suggestions?: string[]; // Dynamic follow-up questions
  timestamp: number;
  isLoading?: boolean;
}

export type SortOption = 'newest' | 'oldest' | 'relevance';