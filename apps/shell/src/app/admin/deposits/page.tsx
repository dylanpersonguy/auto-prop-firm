'use client';

import { useEffect, useState, useCallback } from 'react';

interface Deposit {
  id: string;
  userId: string;
  sku: string;
  amountBaseUnits: string;
  txSig: string;
  verifiedAt: string;
  commission: { commissionAmount: string; referrerId: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SKU_OPTIONS = ['', 'starter-50k', 'standard-100k', 'pro-200k'];

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sku, setSku] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (sku) params.set('sku', sku);
    const res = await fetch(`/api/admin/deposits?${params}`);
    const data = await res.json();
    setDeposits(data.deposits);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, sku]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposits</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination ? `${pagination.total} total deposits` : 'Loading...'}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Filter by SKU</label>
        <select
          value={sku}
          onChange={(e) => { setSku(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">All Challenges</option>
          {SKU_OPTIONS.filter(Boolean).map((s) => (
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
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Amount (USDC)</th>
                <th className="px-4 py-3 font-medium">Tx Signature</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No deposits found</td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                      {d.userId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                        {d.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      ${(Number(d.amountBaseUnits) / 1_000_000).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[180px]">
                      {d.txSig}
                    </td>
                    <td className="px-4 py-3">
                      {d.commission ? (
                        <span className="text-xs text-brand-400">
                          ${(Number(d.commission.commissionAmount) / 1_000_000).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(d.verifiedAt).toLocaleDateString()}
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
