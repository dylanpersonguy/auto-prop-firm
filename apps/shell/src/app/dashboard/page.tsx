'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAccounts, useAllPayouts } from '@/lib/hooks';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-green-900/50 text-green-400',
  PASSED: 'bg-blue-900/50 text-blue-400',
  FUNDED: 'bg-brand-900/50 text-brand-400',
  FAILED: 'bg-red-900/50 text-red-400',
  BREACHED: 'bg-red-900/50 text-red-400',
};

export default function DashboardPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: payouts = [] } = useAllPayouts();

  const totalEquity = accounts.reduce((s, a) => s + (a.equity ?? 0), 0);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const activeCount = accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'FUNDED').length;
  const totalPaid = payouts.filter((p) => p.status === 'COMPLETED' || p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Your trading accounts and performance overview.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Equity', value: fmt(totalEquity), color: 'text-white' },
            { label: 'Total Balance', value: fmt(totalBalance), color: 'text-white' },
            { label: 'Active Accounts', value: activeCount.toString(), color: 'text-brand-400' },
            { label: 'Total Payouts', value: fmt(totalPaid), color: 'text-brand-400' },
          ].map((c) => (
            <div key={c.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-1">{c.label}</div>
              <div className={`text-xl font-semibold tabular-nums ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-800/50 rounded-xl" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-10 text-center">
            <p className="text-gray-400 mb-4">No accounts found. Purchase a challenge to get started.</p>
            <Link href="/challenges" className="text-brand-500 hover:underline text-sm">
              View Challenges →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const pnl = account.equity != null && account.balance != null
                ? account.equity - (account.startingBalance ?? account.balance)
                : null;

              return (
                <Link
                  key={account.id}
                  href={`/account/${account.id}`}
                  className="group bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                      {account.label || account.id.slice(0, 8)}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[account.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {account.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Balance</div>
                      <div className="font-medium tabular-nums">{fmt(account.balance)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Equity</div>
                      <div className="font-medium tabular-nums">{fmt(account.equity)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">P/L</div>
                      <div className={`font-medium tabular-nums ${pnl != null && pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl != null ? `${pnl >= 0 ? '+' : ''}${fmt(pnl)}` : '—'}
                      </div>
                    </div>
                  </div>

                  {account.phase && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <span className="text-[10px] text-gray-500">Phase: </span>
                      <span className="text-xs text-gray-300">{account.phase}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    Open Terminal →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
