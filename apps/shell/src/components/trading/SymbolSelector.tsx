'use client';

import { useState, useMemo } from 'react';
import { useSymbols } from '@/lib/hooks';

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

export function SymbolSelector({ value, onChange, className = '' }: Props) {
  const { data: symbols = [] } = useSymbols();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return symbols;
    const q = search.toLowerCase();
    return symbols.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q),
    );
  }, [symbols, search]);

  const categories = useMemo(() => {
    const cats = new Set(symbols.map((s) => s.category ?? 'Other'));
    return Array.from(cats).sort();
  }, [symbols]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 w-full text-left flex items-center justify-between hover:border-gray-600 transition-colors"
      >
        <span className="font-mono">{value || 'Select symbol…'}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <input
              autoFocus
              placeholder="Search symbols…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1.5 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="overflow-y-auto max-h-60">
            {categories.map((cat) => {
              const items = filtered.filter((s) => (s.category ?? 'Other') === cat);
              if (!items.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-800/50">
                    {cat}
                  </div>
                  {items.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => {
                        onChange(s.symbol);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
                        s.symbol === value ? 'text-brand-400 bg-gray-800/60' : 'text-gray-300'
                      }`}
                    >
                      <span className="font-mono">{s.symbol}</span>
                      {s.description && (
                        <span className="text-xs text-gray-500 truncate ml-2 max-w-[140px]">
                          {s.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No symbols found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
