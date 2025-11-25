

export enum LayoutMode {
  GRID = 'GRID',
  LIST = 'LIST',
  TIMELINE = 'TIMELINE'
}

export type Theme = 'light' | 'dark' | 'midnight' | 'terminal' | 'ocean';

export type AppView = 'landing' | 'workspace' | 'news' | 'portfolio';

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number; // Added for dashboard
  sector?: string; // Added for dashboard
  dayChange?: number; // Added for dashboard
  type?: 'Stock' | 'Mutual Fund' | 'Gold' | 'Bond';
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

export type AITaskType = 'summary' | 'impact' | 'eli5' | 'chat' | 'compare' | 'history' | 'bear-case' | 'jargon';

export type DocumentType = 'annual_report' | 'concall' | 'quarterly_result' | 'red_flags' | 'supply_chain' | 'ceo_lie_detector';

export interface TickerSearchItem {
  symbol: string;
  name: string;
  type: 'Portfolio' | 'Stock' | 'Index' | 'Sector' | 'Commodity' | 'Forex' | 'Macro' | 'Event' | 'Command';
  description?: string;
}

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

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'area';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
}

// Domino Effect (Supply Chain) Types
export interface DominoNode {
  id: string;
  name: string;
  ticker?: string;
  type: 'supplier' | 'target' | 'customer';
  sentiment: 'positive' | 'negative' | 'neutral';
  impactDetails: string; // e.g., "Steel prices up"
}

export interface DominoEdge {
  source: string;
  target: string;
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface DominoData {
  nodes: DominoNode[];
  edges: DominoEdge[];
}

// Earnings Calendar Types
export interface EarningsEvent {
  ticker: string;
  date: string; // ISO Date or "Tomorrow"
  expectation: string; // "Bullish" | "Bearish" | "Neutral"
  insight: string; // "Usually moves +/- 5%"
}

// New Interfaces for Portfolio Intelligence

export interface PortfolioAttributionResult {
  overallSentiment: 'Bullish' | 'Bearish' | 'Neutral';
  movementPercentageEstimate: string; // e.g. "-1.2%"
  culprits: Array<{ ticker: string; reason: string; impact: 'High' | 'Medium' | 'Low' }>;
  saviors: Array<{ ticker: string; reason: string; impact: 'High' | 'Medium' | 'Low' }>;
  hiddenFactor: string;
  verdict: string;
}

export interface ConcentrationRiskResult {
  riskLevel: 'High' | 'Medium' | 'Low';
  primaryRiskFactor: string; // e.g. "Oil Sensitivity" or "IT Sector Overload"
  risks: Array<{ factor: string; percentageExposure: string; explanation: string }>;
  diversificationSuggestion: string;
}

export interface PortfolioHealthReport {
  attribution: PortfolioAttributionResult;
  risk: ConcentrationRiskResult;
  earnings: EarningsEvent[];
  timestamp: number;
}

export type TemplateType = 'battle' | 'valuation' | 'forensic' | 'general';

// Structured News/Analysis Insight (The Executive Briefing)
export interface NewsInsight {
  gist: string;
  verdict?: 'BUY' | 'SELL' | 'HOLD' | 'SAFE' | 'RISKY' | 'OVERVALUED' | 'UNDERVALUED' | 'NEUTRAL' | 'WINNER' | 'MIXED';
  template?: TemplateType; // Polymorphic Template ID
  confidenceScore?: number; // 0-100
  stats: Array<{ label: string; value: string }>;
  outlook: string;
  hypeScore: number; // 0-100
  pros?: string[]; // The Good
  cons?: string[]; // The Bad / Risks
  impact: {
    beneficiaries: string[];
    negativelyImpacted: string[];
  };
  
  // Template Specific Data
  battle?: {
      winner: string;
      loser: string;
      metrics: Array<{ label: string; winnerValue: string; loserValue: string; winnerFavored: boolean }>;
  };
  valuation?: {
      currentPrice: string;
      fairValue: string;
      upside: string; // e.g. "+15%"
      status: 'Overvalued' | 'Undervalued' | 'Fair';
      justification: string[];
  };
  forensic?: {
      score: number; // 0-100 (100 is Safe)
      status: 'Clean' | 'Concern' | 'Critical';
      redFlags: Array<{ title: string; severity: 'High' | 'Medium'; desc: string }>;
      auditorNote?: string;
  };
}

export interface SourceLink {
    title: string;
    url: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  thoughts?: string; // Internal monologue/reasoning steps
  sentimentScore?: number; // -100 (Bearish) to 100 (Bullish)
  suggestions?: string[]; // Dynamic follow-up questions
  sources?: SourceLink[]; // Citations
  followUp?: string[]; // Specific follow up questions
  chartData?: ChartData; // Optional JSON for dynamic charts (Recharts)
  dominoData?: DominoData; // Optional JSON for Supply Chain Graph
  portfolioReport?: PortfolioHealthReport; // Optional JSON for Portfolio Dashboard
  insightData?: NewsInsight; // Optional JSON for Structured Summary
  forensicData?: ForensicAnalysisResult; // Optional legacy forensic data
  timestamp: number;
  isLoading?: boolean;
  liked?: boolean; // For user feedback
  disliked?: boolean; // For user feedback
}

export type SortOption = 'newest' | 'oldest' | 'relevance';

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string | null;
  audioBuffer: AudioBuffer | null;
}

export interface AnalysisResult {
  title: string;
  content: string;
  sentiment?: number;
}

export interface RippleEffectResult {
  event: string;
  impactFlow: Array<{ step: string; description: string }>; // Step 1 -> Step 2 -> Step 3
  affectedTickers: Array<{ ticker: string; effect: 'Positive' | 'Negative'; reasoning: string }>;
}

export interface ForensicAnalysisResult {
  redFlags: Array<{ flag: string; severity: 'Critical' | 'High' | 'Medium'; explanation: string }>;
  manipulationScore: number; // 0 to 100 (100 = definite manipulation)
  verdict: string;
}

// Research Canvas & Evidence
export interface PinnedItem {
  id: string;
  type: 'chart' | 'text' | 'domino';
  title: string;
  content: any; // ChartData, string, or DominoData
  timestamp: number;
  notes?: string;
}

// Gamified Analysis Types
export interface WordFrequency {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface SentimentTimePoint {
  time: string; // e.g. "0-10 min"
  sentiment: number; // -100 to 100
  annotation?: string; // e.g. "CEO Opening Remarks"
}

export interface BingoData {
  wordCloud: WordFrequency[];
  sentimentTimeline: SentimentTimePoint[];
}

export interface EvidenceDocument {
  title: string;
  type: DocumentType;
  content: string; // The raw or simulated text of the document
  ticker: string;
  bingoData?: BingoData; // Optional gamified data for Earnings Calls
}

// Quick Peek & Living Ticker Types
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio: number;
  marketCap: string;
  sector: string;
  week52High: number;
  week52Low: number;
}

export interface QuickPeekData extends StockQuote {
  chartData: number[]; // Array of prices for sparkline
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  newsCount: number;
}