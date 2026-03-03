'use client';

import { memo, useEffect, useRef } from 'react';

export const MarketWatch = memo(function MarketWatch({ ticks }: { ticks: any[] }) {
  const watchlist = ticks.slice(0, 6);
  const initialPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const t of ticks) {
      if (t.symbol && t.mid && !(t.symbol in initialPricesRef.current)) {
        initialPricesRef.current[t.symbol] = t.mid;
      }
    }
  }, [ticks]);

  return (
    <div className="glass rounded-2xl p-6" role="region" aria-label="Market watchlist">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Market Watch</h2>
        <span className="relative flex h-2 w-2" aria-label="Live">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
        </span>
      </div>
      {watchlist.length === 0 ? (
        <p className="text-xs text-gray-500 py-4 text-center">Loading market data…</p>
      ) : (
        <div className="space-y-2">
          {watchlist.map((t) => {
            const initPrice = initialPricesRef.current[t.symbol];
            const currentPrice = t.mid ?? t.bid;
            const change =
              initPrice && currentPrice
                ? ((currentPrice - initPrice) / initPrice) * 100
                : 0;
            return (
              <div
                key={t.symbol}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold text-white">{t.symbol}</span>
                  <div className="text-[10px] text-gray-500 tabular-nums">
                    {t.spread?.toFixed(t.bid > 100 ? 1 : 4)} spread
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-gray-200 tabular-nums">
                    {(t.mid ?? t.bid)?.toFixed(t.bid > 100 ? 2 : 5)}
                  </span>
                  <div
                    className={`text-[10px] tabular-nums ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
