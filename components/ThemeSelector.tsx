
import React from 'react';
import { Theme } from '../types';
import { Check, Palette } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
  isOpen: boolean;
  onClose: () => void;
}

const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'light', name: 'Classic Light', color: '#ffffff' },
  { id: 'dark', name: 'Slate Dark', color: '#0f172a' },
  { id: 'midnight', name: 'Midnight', color: '#09090b' },
  { id: 'terminal', name: 'Terminal', color: '#050505' },
  { id: 'ocean', name: 'Ocean', color: '#020617' },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onChange, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-14 left-4 z-50 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-2 w-56 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme-border mb-1">
          <Palette size={14} className="text-theme-accent" />
          <span className="text-xs font-bold text-theme-text uppercase tracking-wider">Theme</span>
      </div>
      <div className="space-y-1">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => { onChange(theme.id); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              currentTheme === theme.id 
                ? 'bg-theme-bg text-theme-accent shadow-sm' 
                : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'
            }`}
          >
            <div className="flex items-center gap-3">
                <div 
                    className="w-4 h-4 rounded-full border border-gray-500/20" 
                    style={{ backgroundColor: theme.color }} 
                />
                <span>{theme.name}</span>
            </div>
            {currentTheme === theme.id && <Check size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
