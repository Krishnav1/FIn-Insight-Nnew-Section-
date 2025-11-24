

import { Article, PortfolioItem, TickerSearchItem } from './types';

export const USER_PORTFOLIO: PortfolioItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', shares: 50, avgPrice: 2400 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', shares: 30, avgPrice: 3500 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', shares: 100, avgPrice: 1500 },
  { symbol: 'INFY', name: 'Infosys', shares: 45, avgPrice: 1450 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', shares: 200, avgPrice: 600 },
];

export const MOCK_DETAILED_PORTFOLIO: PortfolioItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', shares: 50, avgPrice: 2400, currentPrice: 2950, sector: 'Energy', dayChange: 1.2, type: 'Stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', shares: 30, avgPrice: 3500, currentPrice: 4100, sector: 'Technology', dayChange: -0.5, type: 'Stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', shares: 100, avgPrice: 1500, currentPrice: 1440, sector: 'Finance', dayChange: 0.8, type: 'Stock' },
  { symbol: 'INFY', name: 'Infosys', shares: 45, avgPrice: 1450, currentPrice: 1600, sector: 'Technology', dayChange: -0.2, type: 'Stock' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', shares: 200, avgPrice: 600, currentPrice: 980, sector: 'Automotive', dayChange: 2.1, type: 'Stock' },
  { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty BeES', shares: 500, avgPrice: 210, currentPrice: 245, sector: 'ETF', dayChange: 0.4, type: 'Mutual Fund' },
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', shares: 100, avgPrice: 45, currentPrice: 58, sector: 'Commodity', dayChange: 0.1, type: 'Gold' }
];

export const SEARCHABLE_TICKERS: TickerSearchItem[] = [
  // Indices
  { symbol: 'NIFTY 50', name: 'NSE Nifty 50 Index', type: 'Index' },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', type: 'Index' },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank Index', type: 'Index' },
  // Portfolio (mapped dynamically usually, but hardcoded for this list source)
  ...USER_PORTFOLIO.map(p => ({ symbol: p.symbol, name: p.name, type: 'Portfolio' as const })),
  // Other Major Stocks
  { symbol: 'ITC', name: 'ITC Limited', type: 'Stock' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'Stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', type: 'Stock' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', type: 'Stock' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', type: 'Stock' },
  { symbol: 'LT', name: 'Larsen & Toubro', type: 'Stock' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', type: 'Stock' },
  { symbol: 'AXISBANK', name: 'Axis Bank', type: 'Stock' },
  { symbol: 'ZOMATO', name: 'Zomato', type: 'Stock' },
  { symbol: 'PAYTM', name: 'One97 Communications', type: 'Stock' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', type: 'Stock' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', type: 'Stock' },
];

export const MACROS: TickerSearchItem[] = [
  { symbol: 'IT', name: 'Information Technology Sector', type: 'Sector' },
  { symbol: 'BANKING', name: 'Banking & Finance Sector', type: 'Sector' },
  { symbol: 'AUTO', name: 'Automobile Sector', type: 'Sector' },
  { symbol: 'FMCG', name: 'Consumer Goods Sector', type: 'Sector' },
  { symbol: 'CRUDEOIL', name: 'Brent Crude Oil', type: 'Commodity' },
  { symbol: 'GOLD', name: 'Gold Prices', type: 'Commodity' },
  { symbol: 'USDINR', name: 'USD to INR Exchange Rate', type: 'Forex' },
  { symbol: 'INFLATION', name: 'India CPI Inflation', type: 'Macro' },
  { symbol: 'REPO', name: 'RBI Repo Rate', type: 'Macro' },
  { symbol: 'BUDGET', name: 'Union Budget', type: 'Event' },
];

export const COMMANDS: TickerSearchItem[] = [
  { symbol: 'portfolio', name: 'Check Portfolio Health', type: 'Command', description: 'Run attribution & risk analysis' },
  { symbol: 'compare', name: 'Compare two stocks', type: 'Command', description: 'Launch War Room comparison' },
  { symbol: 'simulate', name: 'Ripple Effect Simulator', type: 'Command', description: 'Simulate macro events' },
  { symbol: 'screen', name: 'Stock Screener', type: 'Command', description: 'Find stocks with natural language' },
  { symbol: 'alert', name: 'Set Price Alert', type: 'Command', description: 'Notify when price hits target' },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: "Reliance Industries Plans Major Green Energy Expansion in Gujarat",
    summary: "Reliance Industries (RELIANCE) has announced a ₹50,000 crore investment plan to build a new green energy ecosystem in Gujarat, aiming for net-zero by 2035.",
    source: "MarketMint India",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    imageUrl: "https://picsum.photos/800/600?random=1",
    url: "#",
    relatedTickers: ['RELIANCE'],
    category: 'Stock',
    isTrending: true
  },
  {
    id: '2',
    title: "Sensex, Nifty Hit All-Time Highs Driven by IT Sector Rally",
    summary: "Indian benchmark indices scaled fresh peaks today as TCS and Infosys (INFY) led a strong rally in the IT sector following positive global cues.",
    source: "Dalal Street Daily",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    imageUrl: "https://picsum.photos/800/600?random=2",
    url: "#",
    relatedTickers: ['TCS', 'INFY', 'WIPRO'],
    category: 'Market',
    isTrending: true
  },
  {
    id: '3',
    title: "RBI Keeps Repo Rate Unchanged at 6.5%, Focuses on Inflation Control",
    summary: "The Reserve Bank of India's Monetary Policy Committee (MPC) has decided to keep the key lending rate unchanged for the fourth consecutive time, impacting banks like HDFCBANK.",
    source: "FinShorts",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    imageUrl: "https://picsum.photos/800/600?random=3",
    url: "#",
    relatedTickers: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
    category: 'Economy'
  },
  {
    id: '4',
    title: "Tata Motors EV Sales Jump 45% in Q3, Outpacing Competitors",
    summary: "Tata Motors (TATAMOTORS) continues its dominance in the Indian EV market with a massive surge in Nexon EV and Tiago EV sales during the last quarter.",
    source: "AutoBiz India",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    imageUrl: "https://picsum.photos/800/600?random=4",
    url: "#",
    relatedTickers: ['TATAMOTORS'],
    category: 'Stock'
  },
  {
    id: '5',
    title: "Zomato & Swiggy Face New GST Tax Regulations Starting Next Month",
    summary: "Food delivery giants like Zomato (ZOMATO) may see a squeeze in margins as the GST council proposes stricter levies on platform fees starting April 1st.",
    source: "TechCrunch India",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day 2 hours ago
    imageUrl: "https://picsum.photos/800/600?random=5",
    url: "#",
    relatedTickers: ['ZOMATO'],
    category: 'Technology'
  },
  {
    id: '6',
    title: "Adani Ports Reports 15% Growth in Cargo Volume",
    summary: "Adani Ports (ADANIPORTS) and Special Economic Zone (APSEZ) handled record cargo volumes in February, driven by coal and container segments.",
    source: "PortNews",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    imageUrl: "https://picsum.photos/800/600?random=6",
    url: "#",
    relatedTickers: ['ADANIPORTS'],
    category: 'Stock'
  }
];

export const TABS = [
  { id: 'all', label: 'All News' },
  { id: 'portfolio', label: 'My Portfolio News' },
  { id: 'trending', label: 'Trending' },
];