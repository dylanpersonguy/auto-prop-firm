'use client';

import { useLedger } from '@/lib/hooks';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

interface Props {
  accountId: string;
  className?: string;
}

const typeColors: Record<string, string> = {
  DEPOSIT: 'text-green-400',
  WITHDRAWAL: 'text-red-400',
  TRADE: 'text-blue-400',
  FEE: 'text-yellow-400',
  COMMISSION: 'text-purple-400',
  PAYOUT: 'text-brand-400',
};

export function LedgerPanel({ accountId, className = '' }: Props) {
  const { data: entries = [], isLoading } = useLedger(accountId);

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-300">
        Ledger <span className="text-gray-500">({entries.length})</span>
      </h3>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              <th className="pb-2 pr-3 font-medium">Time</th>
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium text-right">Amount</th>
              <th className="pb-2 pr-3 font-medium text-right">Balance</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && entries.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">No ledger entries</td></tr>
            )}
            {entries.map((e, i) => (
              <tr key={e.id ?? i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 pr-3 text-gray-400 tabular-nums whitespace-nowrap">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                </td>
                <td className={`py-2 pr-3 font-medium ${typeColors[e.type] ?? 'text-gray-400'}`}>
                  {e.type}
                </td>
                <td className={`py-2 pr-3 text-right tabular-nums ${e.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {e.amount >= 0 ? '+' : ''}{fmt(e.amount)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-gray-300">{fmt(e.balance)}</td>
                <td className="py-2 text-gray-500 truncate max-w-[200px]">{e.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
