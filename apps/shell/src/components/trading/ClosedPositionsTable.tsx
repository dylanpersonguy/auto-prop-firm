'use client';

import { useClosedPositions } from '@/lib/hooks';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function PnlCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-500">—</span>;
  const color = value >= 0 ? 'text-green-400' : 'text-red-400';
  return <span className={`${color} tabular-nums`}>{value >= 0 ? '+' : ''}{fmt(value)}</span>;
}

interface Props {
  accountId: string;
  className?: string;
}

export function ClosedPositionsTable({ accountId, className = '' }: Props) {
  const { data: closed = [], isLoading } = useClosedPositions(accountId);

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-300">
        Closed Positions <span className="text-gray-500">({closed.length})</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              <th className="pb-2 pr-3 font-medium">Symbol</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
              <th className="pb-2 pr-3 font-medium text-right">Entry</th>
              <th className="pb-2 pr-3 font-medium text-right">Exit</th>
              <th className="pb-2 pr-3 font-medium text-right">P/L</th>
              <th className="pb-2 font-medium">Closed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && closed.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">No closed positions</td></tr>
            )}
            {closed.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 pr-3 font-mono text-white">{p.symbol}</td>
                <td className={`py-2 pr-3 font-semibold ${p.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {p.side}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.quantity)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.entryPrice, 5)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.exitPrice, 5)}</td>
                <td className="py-2 pr-3 text-right"><PnlCell value={p.realizedPnl} /></td>
                <td className="py-2 text-gray-400 tabular-nums">
                  {p.closedAt ? new Date(p.closedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
