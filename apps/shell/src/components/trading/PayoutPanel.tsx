'use client';

import { usePayoutCalc, useRequestPayout, usePayoutHistory } from '@/lib/hooks';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

interface Props {
  accountId: string;
  className?: string;
}

export function PayoutPanel({ accountId, className = '' }: Props) {
  const { data: calc } = usePayoutCalc(accountId);
  const { data: history = [] } = usePayoutHistory(accountId);
  const requestPayout = useRequestPayout();

  const handleRequest = () => {
    requestPayout.mutate({
      accountId,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payout calculator */}
      <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Payout Calculator</h4>
        {calc ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Eligible Amount</div>
                <div className="text-lg font-semibold tabular-nums text-white">${fmt(calc.eligibleAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Your Payout</div>
                <div className="text-lg font-semibold tabular-nums text-brand-400">${fmt(calc.payoutAmount)}</div>
              </div>
            </div>
            {calc.profitSplit != null && (
              <div className="text-xs text-gray-500">
                Profit split: {(calc.profitSplit * 100).toFixed(0)}%
              </div>
            )}
            {calc.reason && !calc.eligible && (
              <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-900/30 rounded px-2 py-1.5">
                {calc.reason}
              </div>
            )}
            <button
              onClick={handleRequest}
              disabled={!calc.eligible || requestPayout.isPending}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestPayout.isPending ? 'Requesting…' : 'Request Payout'}
            </button>
            {requestPayout.isSuccess && (
              <div className="text-green-400 text-xs text-center">Payout requested successfully ✓</div>
            )}
            {requestPayout.error && (
              <div className="text-red-400 text-xs bg-red-900/20 border border-red-900/40 rounded px-2 py-1.5">
                {(requestPayout.error as any)?.message || 'Payout request failed'}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading payout info…</div>
        )}
      </div>

      {/* History */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Payout History <span className="text-gray-500">({history.length})</span>
        </h4>
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
          {history.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-3">No payouts yet</div>
          )}
          {history.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-800/40 rounded px-3 py-2">
              <div className="flex items-center gap-3">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  p.status === 'COMPLETED' || p.status === 'PAID' ? 'bg-green-900/40 text-green-400' :
                  p.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {p.status}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-white">${fmt(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
