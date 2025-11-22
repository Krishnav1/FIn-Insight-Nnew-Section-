
import React from 'react';
import TickerChip from './TickerChip';

interface TickerTextProps {
  text: string;
  tickers: string[];
  onTickerClick?: (ticker: string) => void;
}

const TickerText: React.FC<TickerTextProps> = ({ text, tickers, onTickerClick }) => {
  if (!tickers || tickers.length === 0 || !text) {
    return <>{text}</>;
  }

  const escapedTickers = tickers
    .filter(t => t && typeof t === 'string')
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);

  if (escapedTickers.length === 0) return <>{text}</>;

  const regex = new RegExp(`\\b(${escapedTickers.join('|')})\\b`, 'g');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (tickers.includes(part)) {
          return (
            <TickerChip 
              key={i} 
              ticker={part} 
              onClick={onTickerClick}
            />
          );
        }
        return part;
      })}
    </>
  );
};

export default TickerText;
