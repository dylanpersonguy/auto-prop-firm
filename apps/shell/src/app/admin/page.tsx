'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OverviewData {
  users: {
    total: number;
    recent: { id: string; email: string; role: string; createdAt: string }[];
  };
  revenue: {
    totalDeposits: number;
    totalRevenueUsdc: string;
    depositsBySku: { sku: string; count: number }[];
  };
  payouts: {
    totalClaims: number;
    totalPayoutsUsdc: string;
    byStatus: Record<string, number>;
  };
  referrals: {
    totalCommissions: number;
    totalCommissionsUsdc: string;
    totalWithdrawals: number;
  };
  netRevenue: {
    usdc: string;
  };
}

function StatCard({ title, value, subtitle, accent }: { title: string; value: string; subtitle?: string; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent || 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading overview...</div>;
  }

  if (!data) {
    return <div className="text-red-400">Failed to load overview data.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Key metrics for your prop firm</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={data.users.total.toLocaleString()} />
        <StatCard
          title="Total Revenue"
          value={`$${Number(data.revenue.totalRevenueUsdc).toLocaleString()}`}
          subtitle={`${data.revenue.totalDeposits} deposits`}
          accent="text-brand-400"
        />
        <StatCard
          title="Total Payouts"
          value={`$${Number(data.payouts.totalPayoutsUsdc).toLocaleString()}`}
          subtitle={`${data.payouts.totalClaims} claims`}
        />
        <StatCard
          title="Referral Commissions"
          value={`$${Number(data.referrals.totalCommissionsUsdc).toLocaleString()}`}
          subtitle={`${data.referrals.totalCommissions} earned`}
        />
        <StatCard
          title="Net Revenue"
          value={`$${Number(data.netRevenue.usdc).toLocaleString()}`}
          accent="text-green-400"
        />
      </div>

      {/* Middle row: Payouts by status + Deposits by SKU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payouts by Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Payouts by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.payouts.byStatus).length === 0 ? (
              <p className="text-xs text-gray-500">No payout claims yet</p>
            ) : (
              Object.entries(data.payouts.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    status === 'ISSUED' ? 'bg-yellow-900/50 text-yellow-400' :
                    status === 'REDEEMED' ? 'bg-green-900/50 text-green-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {status}
                  </span>
                  <span className="text-sm text-white font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deposits by SKU */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Deposits by Challenge</h2>
          <div className="space-y-3">
            {data.revenue.depositsBySku.length === 0 ? (
              <p className="text-xs text-gray-500">No deposits yet</p>
            ) : (
              data.revenue.depositsBySku.map((d) => (
                <div key={d.sku} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{d.sku}</span>
                  <span className="text-sm text-white font-medium">{d.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Users</h2>
          <Link href="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.users.recent.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 text-gray-300">{u.email}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      u.role === 'ADMIN' ? 'bg-purple-900/50 text-purple-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
