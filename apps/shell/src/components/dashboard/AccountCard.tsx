'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { useEquity } from '@/lib/hooks';
import { fmt, pct, timeAgo, statusConfig } from './helpers';
import { Sparkline } from './widgets';

export const AccountCard = memo(function AccountCard({
  account,
  idx,
  totalEquity,
}: {
  account: any;
  idx: number;
  totalEquity: number;
}) {
  const pnl = (account.equity ?? 0) - (account.startingBalance ?? account.balance ?? 0);
  const pnlPct =
    (account.startingBalance ?? account.balance ?? 0) > 0
      ? (pnl / (account.startingBalance ?? account.balance ?? 1)) * 100
      : 0;
  const sc = statusConfig[account.status] ?? {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    dot: 'bg-gray-400',
    glow: '',
  };

  /* Real equity history for sparkline */
  const { data: equityHistory = [] } = useEquity(account.id, 24);
  const acctSparkData = useMemo(() => {
    if (equityHistory.length >= 2) {
      return equityHistory.map((p: any) => p.equity);
    }
    const start = account.startingBalance ?? account.balance ?? 0;
    const end = account.equity ?? start;
    return [start, end];
  }, [equityHistory, account.startingBalance, account.balance, account.equity]);

  const ddUsed =
    account.equity != null && account.startingBalance
      ? Math.max(0, (account.startingBalance - account.equity) / account.startingBalance)
      : 0;

  return (
    <Link
      href={`/account/${account.id}`}
      className="group glass rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.01]"
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors text-sm">
          {account.label || account.id.slice(0, 8)}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {account.status}
        </span>
      </div>

      {/* Equity + Sparkline */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Equity</div>
          <div className="text-lg font-bold text-white tabular-nums">{fmt(account.equity)}</div>
        </div>
        <Sparkline data={acctSparkData} color={pnl >= 0 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Balance</div>
          <div className="text-xs font-medium text-gray-200 tabular-nums">{fmt(account.balance)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">P/L</div>
          <div
            className={`text-xs font-medium tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {pnl >= 0 ? '+' : ''}
            {fmt(pnl)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Return</div>
          <div
            className={`text-xs font-medium tabular-nums ${pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {pct(pnlPct)}
          </div>
        </div>
      </div>

      {/* DD bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-gray-500">Drawdown</span>
          <span className="text-gray-400 tabular-nums">{(ddUsed * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              ddUsed > 0.08 ? 'bg-red-500' : ddUsed > 0.04 ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(ddUsed * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Phase + Open link */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        {account.phase ? (
          <span className="text-[10px] text-gray-500">
            Phase: <span className="text-gray-400">{account.phase}</span>
          </span>
        ) : (
          <span className="text-[10px] text-gray-600">{timeAgo(account.createdAt)}</span>
        )}
        <span className="text-[11px] text-gray-500 group-hover:text-brand-400 flex items-center gap-1 transition-colors">
          Open Terminal
          <svg
            className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
});
