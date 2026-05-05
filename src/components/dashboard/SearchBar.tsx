'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  agencyId?: string;
}

export function SearchBar({ agencyId }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        // Mock search results for now
        const mockResults = [
          {
            id: '1',
            type: 'client',
            title: 'John Smith',
            subtitle: 'john.smith@email.com',
            icon: '👤',
            href: '/dashboard/clients'
          },
          {
            id: '2',
            type: 'policy',
            title: 'Auto Insurance - POL123',
            subtitle: 'State Farm • $1,200/year',
            icon: '📄',
            href: '/dashboard/clients'
          },
          {
            id: '3',
            type: 'renewal',
            title: 'Renewal Due - POL456',
            subtitle: 'Expires in 15 days',
            icon: '🔄',
            href: '/dashboard/renewals'
          }
        ].filter(result => 
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        
        setResults(mockResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-secondary/5 text-secondary border-secondary/10';
      case 'policy': return 'bg-primary/5 text-primary border-primary/10';
      case 'renewal': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-on-surface/40 border-black/5';
    }
  };

  return (
    <div className="flex-1 max-w-md relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search Book of Business..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 font-medium text-on-surface placeholder:text-on-surface/30 transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full mt-3 w-full bg-surface rounded-[24px] shadow-2xl border border-black/5 z-50 overflow-hidden font-body animate-in fade-in slide-in-from-top-2 duration-200">
            {results.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-on-surface/10" />
                </div>
                <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest text-balance">No intelligence matches found for "{query}"</p>
              </div>
            ) : (
              <>
                <div className="p-2">
                  <div className="px-4 py-2 mb-1">
                    <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em]">Policy Match Results</p>
                  </div>
                  {results.map((result) => (
                    <a
                      key={result.id}
                      href={result.href}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center text-xl group-hover:bg-white transition-colors">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-on-surface text-sm truncate group-hover:text-primary transition-colors">
                            {result.title}
                          </p>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all ${getTypeColor(result.type)}`}>
                            {result.type} Protocol
                          </span>
                        </div>
                        <p className="text-xs text-on-surface/40 font-medium truncate mt-0.5 italic">
                          {result.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-on-surface/10 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
                <div className="p-4 border-t border-black/5 bg-slate-50/50">
                  <a
                    href="/dashboard/clients"
                    className="flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-secondary transition-colors"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                  >
                    Authorize Advanced Policy Search
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
