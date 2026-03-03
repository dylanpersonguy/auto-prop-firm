'use client';

import { useEffect, useState } from 'react';

interface ReferralStats {
  totalUsers: number;
  usersWithReferrer: number;
  referralConversionRate: string;
  totalCommissions: number;
  totalCommissionAmountBaseUnits: string;
  totalWithdrawals: number;
  totalWithdrawnAmountBaseUnits: string;
  outstandingBalanceBaseUnits: string;
  topReferrers: {
    email: string;
    referralCode: string;
    referralCount: number;
    commissionsEarned: number;
    currentBalanceBaseUnits: string;
  }[];
}

function toUsdc(baseUnits: string): string {
  return (Number(baseUnits) / 1_000_000).toFixed(2);
}

export default function AdminReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/referral/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading referral stats...</div>;
  }

  if (!stats) {
    return <div className="text-red-400">Failed to load referral stats.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-sm text-gray-500 mt-1">Referral and commission metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-brand-400">{stats.referralConversionRate}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.usersWithReferrer} of {stats.totalUsers} users
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Commissions</p>
          <p className="text-2xl font-bold text-white">
            ${toUsdc(stats.totalCommissionAmountBaseUnits)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalCommissions} payouts earned</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Withdrawn</p>
          <p className="text-2xl font-bold text-white">
            ${toUsdc(stats.totalWithdrawnAmountBaseUnits)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalWithdrawals} withdrawal(s)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-400">
            ${toUsdc(stats.outstandingBalanceBaseUnits)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Unpaid commissions</p>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Top Referrers</h2>
        {stats.topReferrers.length === 0 ? (
          <p className="text-xs text-gray-500">No referrers yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Referral Code</th>
                  <th className="pb-2 font-medium">Referrals</th>
                  <th className="pb-2 font-medium">Commissions</th>
                  <th className="pb-2 font-medium">Balance (USDC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {stats.topReferrers.map((r, i) => (
                  <tr key={r.referralCode} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 text-gray-500">{i + 1}</td>
                    <td className="py-2.5 text-gray-300">{r.email}</td>
                    <td className="py-2.5 text-gray-500 font-mono text-xs">{r.referralCode}</td>
                    <td className="py-2.5 text-gray-300">{r.referralCount}</td>
                    <td className="py-2.5 text-gray-300">{r.commissionsEarned}</td>
                    <td className="py-2.5 text-brand-400">
                      ${toUsdc(r.currentBalanceBaseUnits)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
