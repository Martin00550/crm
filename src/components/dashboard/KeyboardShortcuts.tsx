'use client';

import { useState, useEffect } from 'react';
import { Keyboard, X, Command, Search, Download, RefreshCw } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: 'K', description: 'Open search', icon: Search },
    { key: 'G + D', description: 'Go to Dashboard', icon: Command },
    { key: 'G + C', description: 'Go to Clients', icon: Command },
    { key: 'G + R', description: 'Go to Renewals', icon: Command },
    { key: 'G + A', description: 'Go to Analytics', icon: Command },
    { key: 'E', description: 'Export current view', icon: Download },
    { key: 'R', description: 'Refresh data', icon: RefreshCw },
    { key: '?', description: 'Show keyboard shortcuts', icon: Keyboard },
    { key: 'Escape', description: 'Close modal / cancel', icon: X },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
      }
      // Open shortcuts on ?
      if (e.key === '?' && !isOpen) {
        // This would be handled by the parent component
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            const keys = shortcut.key.split(' + ');
            
            return (
              <div key={shortcut.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{shortcut.description}</span>
                </div>
                <div className="flex gap-2">
                  {keys.map((key, index) => (
                    <div key={index} className="flex gap-1">
                      <kbd className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                        {key}
                      </kbd>
                      {index < keys.length - 1 && <span className="text-slate-400 self-center">+</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">Escape</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Toggle shortcuts on ?
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }

      // Search on K
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        // Focus search input - this would need to be implemented per page
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Navigation shortcuts
      if (e.key === 'g' || e.key === 'G') {
        const handleG = (event: KeyboardEvent) => {
          switch (event.key.toLowerCase()) {
            case 'd':
              window.location.href = '/dashboard';
              break;
            case 'c':
              window.location.href = '/dashboard/clients';
              break;
            case 'r':
              window.location.href = '/dashboard/renewals';
              break;
            case 'a':
              window.location.href = '/dashboard/analytics';
              break;
          }
          document.removeEventListener('keydown', handleG);
        };
        document.addEventListener('keydown', handleG);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { showShortcuts, setShowShortcuts };
}
