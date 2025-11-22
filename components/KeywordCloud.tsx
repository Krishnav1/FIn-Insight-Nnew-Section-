
import React from 'react';
import { Hash } from 'lucide-react';

interface KeywordCloudProps {
  keywords: string[];
  selectedKeyword: string | null;
  onSelect: (keyword: string | null) => void;
}

const KeywordCloud: React.FC<KeywordCloudProps> = ({ keywords, selectedKeyword, onSelect }) => {
  if (keywords.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2 items-center animate-fade-in">
      <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mr-2">
        <Hash size={12} />
        Trending:
      </div>
      {keywords.map(keyword => (
        <button
          key={keyword}
          onClick={() => onSelect(selectedKeyword === keyword ? null : keyword)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 border ${
            selectedKeyword === keyword
              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          {keyword}
        </button>
      ))}
       {selectedKeyword && (
        <button 
            onClick={() => onSelect(null)}
            className="text-xs text-red-500 hover:underline ml-2"
        >
            Clear
        </button>
      )}
    </div>
  );
};

export default KeywordCloud;
