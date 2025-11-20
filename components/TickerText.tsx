import React from 'react';

interface TickerTextProps {
  text: string;
  tickers: string[];
}

const TickerText: React.FC<TickerTextProps> = ({ text, tickers }) => {
  if (!tickers || tickers.length === 0 || !text) {
    return <>{text}</>;
  }

  // Escape special regex characters to prevent crashes and sort by length to match longest first
  const escapedTickers = tickers
    .filter(t => t && typeof t === 'string')
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);

  if (escapedTickers.length === 0) return <>{text}</>;

  // Create a regex that matches any of the tickers as a whole word
  const regex = new RegExp(`\\b(${escapedTickers.join('|')})\\b`, 'g');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        // Check if this part is one of our tickers
        if (tickers.includes(part)) {
          return (
            <a
              key={i}
              href={`https://www.google.com/finance/quote/${part}:NSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium relative z-10 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={`View ${part} on Google Finance`}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

export default TickerText;