'use client';

import { useFills } from '@/lib/hooks';

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

export function FillsTable({ accountId, className = '' }: Props) {
  const { data: fills = [], isLoading } = useFills(accountId);

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-300">
        Fills <span className="text-gray-500">({fills.length})</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              <th className="pb-2 pr-3 font-medium">Time</th>
              <th className="pb-2 pr-3 font-medium">Symbol</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
              <th className="pb-2 pr-3 font-medium text-right">Price</th>
              <th className="pb-2 pr-3 font-medium text-right">Fee</th>
              <th className="pb-2 font-medium text-right">P/L</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && fills.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">No fills yet</td></tr>
            )}
            {fills.map((f) => (
              <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 pr-3 text-gray-400 tabular-nums">
                  {f.createdAt ? new Date(f.createdAt).toLocaleTimeString() : '—'}
                </td>
                <td className="py-2 pr-3 font-mono text-white">{f.symbol}</td>
                <td className={`py-2 pr-3 font-semibold ${f.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {f.side}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(f.quantity)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(f.price, 5)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-gray-400">{f.fee != null ? fmt(f.fee) : '—'}</td>
                <td className="py-2 text-right"><PnlCell value={f.realizedPnl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
