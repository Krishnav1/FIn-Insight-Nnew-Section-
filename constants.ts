import { Article, PortfolioItem } from './types';

export const USER_PORTFOLIO: PortfolioItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', shares: 50, avgPrice: 2400 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', shares: 30, avgPrice: 3500 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', shares: 100, avgPrice: 1500 },
  { symbol: 'INFY', name: 'Infosys', shares: 45, avgPrice: 1450 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', shares: 200, avgPrice: 600 },
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