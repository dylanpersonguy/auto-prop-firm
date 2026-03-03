'use client';

import { useMetrics } from '@/lib/hooks';

function fmt(v: number | undefined | null, decimals = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pct(v: number | undefined | null) {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function Bar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pctVal = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums">
          ${fmt(used)} / ${fmt(limit)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

interface Props {
  accountId: string;
  dailyDD?: { used: number; limit: number };
  maxDD?: { used: number; limit: number };
}

export function MetricsCards({ accountId, dailyDD, maxDD }: Props) {
  const { data: m } = useMetrics(accountId);

  if (!m) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Equity',
      value: `$${fmt(m.equity)}`,
      sub: m.profitPercent != null ? pct(m.profitPercent) : null,
      subColor: (m.profitPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Balance',
      value: `$${fmt(m.balance)}`,
      sub: m.profit != null ? `P/L $${fmt(m.profit)}` : null,
      subColor: (m.profit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Daily P/L',
      value: m.dailyPnl != null ? `$${fmt(m.dailyPnl)}` : '—',
      sub: m.dailyPnlPercent != null ? pct(m.dailyPnlPercent) : null,
      subColor: (m.dailyPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Win Rate',
      value: m.winRate != null ? `${m.winRate.toFixed(1)}%` : '—',
      sub: m.totalTrades != null ? `${m.totalTrades} trades` : null,
      subColor: 'text-gray-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-lg font-semibold tabular-nums">{c.value}</div>
            {c.sub && <div className={`text-xs ${c.subColor} tabular-nums mt-0.5`}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Drawdown bars */}
      {(dailyDD || maxDD) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dailyDD && <Bar label="Daily Drawdown" used={dailyDD.used} limit={dailyDD.limit} color="bg-yellow-500" />}
          {maxDD && <Bar label="Max Drawdown" used={maxDD.used} limit={maxDD.limit} color="bg-red-500" />}
        </div>
      )}

      {/* Profit target progress */}
      {m.profitTarget != null && m.profit != null && (
        <Bar
          label="Profit Target"
          used={Math.max(0, m.profit)}
          limit={m.profitTarget}
          color="bg-brand-500"
        />
      )}
    </div>
  );
}
