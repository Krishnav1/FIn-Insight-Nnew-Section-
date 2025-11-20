import React from 'react';
import { ArrowDownUp } from 'lucide-react';
import { SortOption } from '../types';

interface SortControlsProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SortControls: React.FC<SortControlsProps> = ({ currentSort, onSortChange }) => {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 shadow-sm h-[42px]">
      <ArrowDownUp size={16} className="text-gray-500 dark:text-gray-400" />
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Sort:</span>
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer p-0 pr-6 font-medium outline-none"
        aria-label="Sort articles"
      >
        <option value="relevance" className="bg-white dark:bg-gray-800">Relevance</option>
        <option value="newest" className="bg-white dark:bg-gray-800">Newest First</option>
        <option value="oldest" className="bg-white dark:bg-gray-800">Oldest First</option>
      </select>
    </div>
  );
};

export default SortControls;