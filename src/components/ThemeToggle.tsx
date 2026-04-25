"use client";

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 bg-surface border border-black/5 rounded-full p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full transition-all ${
          theme === 'light' ? 'bg-primary text-white' : 'text-on-surface/60 hover:text-on-surface'
        }`}
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full transition-all ${
          theme === 'system' ? 'bg-primary text-white' : 'text-on-surface/60 hover:text-on-surface'
        }`}
        title="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full transition-all ${
          theme === 'dark' ? 'bg-primary text-white' : 'text-on-surface/60 hover:text-on-surface'
        }`}
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
