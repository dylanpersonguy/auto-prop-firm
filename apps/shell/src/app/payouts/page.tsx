'use client';

import { useState, useCallback } from 'react';
import { useAccounts, useAllPayouts, usePayoutCalc, useRequestPayout } from '@/lib/hooks';

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayoutsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: payouts = [], isLoading: payoutsLoading } = useAllPayouts();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Filter to funded/active accounts eligible for payouts
  const fundedAccounts = accounts.filter(
    (a: any) =>
      a.status === 'ACTIVE' &&
      (a.phase === 'FUNDED' || a.phase === 'PHASE_2' || a.phase === 'PHASE_1'),
  );

  // Stats
  const totalPaid = payouts
    .filter((p: any) => p.status === 'COMPLETED' || p.status === 'PAID' || p.status === 'REDEEMED')
    .reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const pendingPayouts = payouts.filter((p: any) => p.status === 'PENDING' || p.status === 'APPROVED');

  return (
    <main className="min-h-screen px-4 py-12 max-w-6xl mx-auto relative">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Payouts
        </h1>
        <p className="text-gray-400">Request profit payouts from your funded accounts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Paid Out" value={`$${fmt(totalPaid)}`} accent="text-emerald-400" />
        <StatCard label="Pending Payouts" value={String(pendingPayouts.length)} accent="text-amber-400" />
        <StatCard label="Total Payouts" value={String(payouts.length)} accent="text-white" />
      </div>

      {/* Funded Accounts - Request Payout */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Your Accounts</h2>
        {fundedAccounts.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 text-center">
            <p className="text-gray-400">No eligible accounts. Complete a challenge to unlock payouts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fundedAccounts.map((account: any) => (
              <AccountPayoutCard
                key={account.id}
                account={account}
                isOpen={selectedAccount === account.id}
                onToggle={() =>
                  setSelectedAccount((prev) => (prev === account.id ? null : account.id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Payout History */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Payout History <span className="text-gray-500 text-sm font-normal">({payouts.length})</span>
        </h2>
        {payoutsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-xl" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 text-center">
            <p className="text-gray-400">No payout history yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout: any) => (
              <div
                key={payout.id}
                className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <StatusBadge status={payout.status} />
                  <div>
                    <div className="text-sm font-semibold tabular-nums text-white">
                      ${fmt(payout.amount)} USDC
                    </div>
                    <div className="text-xs text-gray-500">
                      {payout.accountId?.slice(0, 8)}...
                      {payout.createdAt && ` · ${new Date(payout.createdAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                {payout.txSig && (
                  <span className="text-xs text-gray-500 font-mono">{payout.txSig.slice(0, 12)}...</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    PAID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    REDEEMED: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
    APPROVED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${styles[status] || 'bg-gray-800 text-gray-500 border-gray-700'}`}
    >
      {status}
    </span>
  );
}

function AccountPayoutCard({
  account,
  isOpen,
  onToggle,
}: {
  account: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { data: calc, isLoading: calcLoading } = usePayoutCalc(account.id);
  const requestPayout = useRequestPayout();
  const [requested, setRequested] = useState(false);

  const profit = (account.equity || account.balance || 0) - (account.startingBalance || 0);
  const profitPercent = account.startingBalance ? ((profit / account.startingBalance) * 100).toFixed(2) : '0.00';
  const profitPositive = profit > 0;

  const handleRequest = useCallback(() => {
    requestPayout.mutate(
      { accountId: account.id, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => setRequested(true) },
    );
  }, [account.id, requestPayout]);

  return (
    <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden transition-all">
      {/* Card header — always visible */}
      <button onClick={onToggle} className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
        <div>
          <div className="text-sm font-semibold text-white">{account.label || account.id.slice(0, 12)}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {account.phase?.replace('_', ' ')} · ${fmt(account.startingBalance)} starting
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold tabular-nums ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {profitPositive ? '+' : ''}${fmt(profit)} ({profitPercent}%)
          </div>
          <div className="text-xs text-gray-500">P&L</div>
        </div>
      </button>

      {/* Expanded payout section */}
      {isOpen && (
        <div className="border-t border-white/[0.06] px-6 py-5 space-y-4">
          {calcLoading ? (
            <div className="text-sm text-gray-500">Calculating payout eligibility...</div>
          ) : calc ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Eligible Amount</div>
                  <div className="text-lg font-bold tabular-nums text-white">${fmt(calc.eligibleAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Your Payout</div>
                  <div className="text-lg font-bold tabular-nums text-emerald-400">${fmt(calc.payoutAmount)}</div>
                </div>
              </div>
              {calc.profitSplit != null && (
                <div className="text-xs text-gray-500">
                  Profit split: <span className="text-gray-300 font-medium">{(calc.profitSplit * 100).toFixed(0)}%</span>
                </div>
              )}
              {!calc.eligible && calc.reason && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-amber-300 text-sm">
                  {calc.reason}
                </div>
              )}
              {requested ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-sm text-center">
                  Payout requested successfully! It will be reviewed shortly.
                </div>
              ) : (
                <button
                  onClick={handleRequest}
                  disabled={!calc.eligible || requestPayout.isPending}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                    bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
                    hover:from-emerald-500 hover:to-emerald-400
                    disabled:opacity-40 disabled:cursor-not-allowed
                    shadow-lg shadow-emerald-500/15"
                >
                  {requestPayout.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Requesting...
                    </span>
                  ) : (
                    `Request Payout — $${fmt(calc.payoutAmount)}`
                  )}
                </button>
              )}
              {requestPayout.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-300 text-sm">
                  {(requestPayout.error as any)?.message || 'Payout request failed'}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">
              Payout calculation failed. The account may not be eligible yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
