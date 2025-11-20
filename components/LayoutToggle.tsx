import React from 'react';
import { LayoutGrid, List, Clock } from 'lucide-react';
import { LayoutMode } from '../types';

interface LayoutToggleProps {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

const LayoutToggle: React.FC<LayoutToggleProps> = ({ mode, onChange }) => {
  const btnClass = (isActive: boolean) =>
    `p-2 rounded-md transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
    }`;

  return (
    <div id="tour-layout-toggle" className="flex space-x-2">
      <button
        onClick={() => onChange(LayoutMode.GRID)}
        className={btnClass(mode === LayoutMode.GRID)}
        aria-label="Grid View"
      >
        <LayoutGrid size={20} />
      </button>
      <button
        onClick={() => onChange(LayoutMode.LIST)}
        className={btnClass(mode === LayoutMode.LIST)}
        aria-label="List View"
      >
        <List size={20} />
      </button>
      <button
        onClick={() => onChange(LayoutMode.TIMELINE)}
        className={btnClass(mode === LayoutMode.TIMELINE)}
        aria-label="Timeline View"
      >
        <Clock size={20} />
      </button>
    </div>
  );
};

export default LayoutToggle;