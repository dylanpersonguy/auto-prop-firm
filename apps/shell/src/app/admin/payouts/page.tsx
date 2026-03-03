'use client';

import { useEffect, useState, useCallback } from 'react';

interface Payout {
  id: string;
  userId: string;
  amountBaseUnits: string;
  status: string;
  claimSignature: string;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedTxSig: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['', 'ISSUED', 'REDEEMED', 'EXPIRED'];

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    const res = await fetch(`/api/admin/payouts?${params}`);
    const data = await res.json();
    setPayouts(data.payouts);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)));
    }
    setUpdatingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination ? `${pagination.total} total payout claims` : 'Loading...'}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Filter by Status</label>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 font-medium">User ID</th>
                <th className="px-4 py-3 font-medium">Amount (USDC)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Redeemed Tx</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No payout claims found</td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                      {p.userId}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      ${(Number(p.amountBaseUnits) / 1_000_000).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.status === 'ISSUED' ? 'bg-yellow-900/50 text-yellow-400' :
                        p.status === 'REDEEMED' ? 'bg-green-900/50 text-green-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[150px]">
                      {p.redeemedTxSig || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'ISSUED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(p.id, 'EXPIRED')}
                            disabled={updatingId === p.id}
                            className="text-xs px-2 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/60 rounded transition-colors disabled:opacity-50"
                          >
                            Expire
                          </button>
                        </div>
                      )}
                      {p.status === 'EXPIRED' && (
                        <button
                          onClick={() => updateStatus(p.id, 'ISSUED')}
                          disabled={updatingId === p.id}
                          className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60 rounded transition-colors disabled:opacity-50"
                        >
                          Re-issue
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
