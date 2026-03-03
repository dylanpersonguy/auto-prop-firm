'use client';

import { useEffect, useState } from 'react';

interface FeeEntry {
  id: string;
  category: string;
  amountUsdc: string;
  amountBaseUnits: string;
  sourceType: string;
  sourceId: string;
  description: string | null;
  createdAt: string;
}

interface CategoryBreakdown {
  category: string;
  amountUsdc: string;
  amountBaseUnits: string;
  count: number;
}

interface FeeConfig {
  tradeCommissionBps: number;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  payoutSplitBps: number;
  challengeProviderFeeBps: number;
  overheadFeeBps: number;
  spreadMarkupBps: number;
}

interface FeeDashboardData {
  totalRevenueUsdc: string;
  totalRevenueBaseUnits: string;
  profitAccountBalanceUsdc: string;
  profitAccountBalanceBaseUnits: string;
  categoryBreakdown: CategoryBreakdown[];
  recentEntries: FeeEntry[];
  feeConfig: FeeConfig;
  totalEntries: number;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  TRADE_COMMISSION: { label: 'Trade Commissions', color: 'text-blue-400', icon: '📈' },
  DEPOSIT_FEE: { label: 'Deposit Fees', color: 'text-green-400', icon: '💰' },
  WITHDRAWAL_FEE: { label: 'Withdrawal Fees', color: 'text-yellow-400', icon: '🏦' },
  PAYOUT_SPLIT: { label: 'Payout Splits', color: 'text-purple-400', icon: '💸' },
  CHALLENGE_PROVIDER_FEE: { label: 'Challenge Provider Fees', color: 'text-brand-400', icon: '🎯' },
  OVERHEAD_FEE: { label: 'Overhead / Operating', color: 'text-orange-400', icon: '⚙️' },
  SPREAD_MARKUP: { label: 'Spread Markup', color: 'text-cyan-400', icon: '📊' },
};

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export default function AdminFeesPage() {
  const [data, setData] = useState<FeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/fees')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Failed to load fee data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading fee data...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400">
          {error || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Firm Revenue & Fees</h1>
        <p className="text-sm text-gray-500">
          All fees collected from challenges, trades, payouts, and withdrawals.
        </p>
      </div>

      {/* ── Top Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-brand-400">${data.totalRevenueUsdc}</p>
          <p className="text-xs text-gray-500 mt-1">USDC across {data.totalEntries} fee entries</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Profit Account Balance</p>
          <p className="text-3xl font-bold text-green-400">${data.profitAccountBalanceUsdc}</p>
          <p className="text-xs text-gray-500 mt-1">USDC accumulated in firm profit wallet</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Revenue Streams</p>
          <p className="text-3xl font-bold text-white">{data.categoryBreakdown.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active fee categories generating revenue</p>
        </div>
      </div>

      {/* ── Fee Schedule ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Fee Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Trade Commission</p>
            <p className="text-xl font-bold text-blue-400">{bpsToPercent(data.feeConfig.tradeCommissionBps)}</p>
            <p className="text-xs text-gray-600">per trade notional</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Spread Markup</p>
            <p className="text-xl font-bold text-cyan-400">{bpsToPercent(data.feeConfig.spreadMarkupBps)}</p>
            <p className="text-xs text-gray-600">per trade notional</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Payout Split</p>
            <p className="text-xl font-bold text-purple-400">{bpsToPercent(data.feeConfig.payoutSplitBps)}</p>
            <p className="text-xs text-gray-600">of trader profit payouts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Withdrawal Fee</p>
            <p className="text-xl font-bold text-yellow-400">{bpsToPercent(data.feeConfig.withdrawalFeeBps)}</p>
            <p className="text-xs text-gray-600">of withdrawal amount</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Challenge Provider Fee</p>
            <p className="text-xl font-bold text-brand-400">{bpsToPercent(data.feeConfig.challengeProviderFeeBps)}</p>
            <p className="text-xs text-gray-600">of challenge price</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Overhead / Operating</p>
            <p className="text-xl font-bold text-orange-400">{bpsToPercent(data.feeConfig.overheadFeeBps)}</p>
            <p className="text-xs text-gray-600">of challenge price</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Deposit Fee</p>
            <p className="text-xl font-bold text-green-400">{bpsToPercent(data.feeConfig.depositFeeBps)}</p>
            <p className="text-xs text-gray-600">of deposit amount</p>
          </div>
        </div>
      </div>

      {/* ── Revenue Breakdown by Category ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Revenue by Category</h2>
        {data.categoryBreakdown.length === 0 ? (
          <p className="text-gray-500 text-sm">No fees recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {data.categoryBreakdown.map((cat) => {
              const meta = CATEGORY_LABELS[cat.category] || { label: cat.category, color: 'text-gray-400', icon: '📋' };
              const total = Number(data.totalRevenueBaseUnits);
              const amount = Number(cat.amountBaseUnits);
              const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0';
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="text-xl w-8">{meta.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                      <span className="text-sm text-gray-400">${cat.amountUsdc} USDC ({cat.count} entries)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Fee Ledger Entries ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Recent Fee Ledger</h2>
        {data.recentEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">No entries yet. Fees will appear here as they are collected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Category</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Source</th>
                  <th className="text-left py-2 pr-4">Description</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEntries.map((entry) => {
                  const meta = CATEGORY_LABELS[entry.category] || { label: entry.category, color: 'text-gray-400', icon: '📋' };
                  return (
                    <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-medium ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-white">
                        ${entry.amountUsdc}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                          {entry.sourceType}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-500 max-w-xs truncate">
                        {entry.description || '—'}
                      </td>
                      <td className="py-2 text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
