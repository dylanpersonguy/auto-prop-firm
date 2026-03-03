'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  currentBalanceBaseUnits: string;
  lifetimeEarnedBaseUnits: string;
  totalWithdrawnBaseUnits: string;
  referralCount: number;
}

interface Commission {
  id: string;
  referredEmail: string;
  sku: string;
  depositTxSig: string;
  depositAmount: string;
  commissionAmount: string;
  createdAt: string;
}

function formatUsdc(baseUnits: string): string {
  return (Number(baseUnits) / 1_000_000).toFixed(2);
}

export default function ReferralDashboardPage() {
  const { publicKey } = useWallet();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState('');
  const [error, setError] = useState('');

  // TODO: In production, userId comes from session/JWT context.
  // For demo, we read it from localStorage (set during registration).
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const fetchInfo = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/referral/me?userId=${userId}`);
    if (res.ok) setInfo(await res.json());
  }, [userId]);

  const fetchCommissions = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/referral/commissions?userId=${userId}&page=${page}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      setCommissions(data.commissions);
      setTotalPages(data.pagination.totalPages);
    }
  }, [userId, page]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);
  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  async function handleCopy() {
    if (!info) return;
    await navigator.clipboard.writeText(info.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw() {
    if (!userId || !publicKey) return;
    setWithdrawing(true);
    setWithdrawResult('');
    setError('');

    try {
      const res = await fetch('/api/referral/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, wallet: publicKey.toBase58() }),
      });

      const data = await res.json();
      if (res.ok) {
        setWithdrawResult(
          `Claim issued for ${data.amountUsdc} USDC. Redeem on the Payouts page.`,
        );
        fetchInfo(); // Refresh balances
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setWithdrawing(false);
    }
  }

  if (!userId) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Referral Program</h1>
        <p className="text-gray-400">Please register or log in to access your referral dashboard.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Referral Program</h1>
      <p className="text-gray-400">
        Earn <span className="text-brand-400 font-semibold">15% commission</span> on every
        challenge purchase made by users you refer.
      </p>

      {/* ── Referral Link Card ── */}
      {info && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Your Referral Link</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-950 px-4 py-2 rounded-lg text-sm text-brand-400 overflow-x-auto">
              {info.referralLink}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Code: <span className="font-mono text-gray-300">{info.referralCode}</span>
          </p>
        </div>
      )}

      {/* ── Stats Grid ── */}
      {info && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Referrals" value={info.referralCount.toString()} />
          <StatCard label="Lifetime Earned" value={`$${formatUsdc(info.lifetimeEarnedBaseUnits)}`} />
          <StatCard label="Available Balance" value={`$${formatUsdc(info.currentBalanceBaseUnits)}`} accent />
          <StatCard label="Total Withdrawn" value={`$${formatUsdc(info.totalWithdrawnBaseUnits)}`} />
        </div>
      )}

      {/* ── Withdraw Button ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Withdraw Earnings</h2>
        <p className="text-sm text-gray-400">
          Minimum withdrawal: <span className="text-white">$50.00 USDC</span>.
          Withdrawals are issued as signed claims redeemable through the Solana vault.
        </p>
        {!publicKey && (
          <p className="text-yellow-400 text-sm">Connect your wallet to withdraw.</p>
        )}
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || !publicKey}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {withdrawing ? 'Processing...' : 'Withdraw Full Balance'}
        </button>
        {withdrawResult && <p className="text-green-400 text-sm">{withdrawResult}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* ── Commission Ledger ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Commission History</h2>
        {commissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No commissions yet. Share your referral link to start earning!</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Referred User</th>
                    <th className="text-left py-2 px-3">SKU</th>
                    <th className="text-right py-2 px-3">Deposit</th>
                    <th className="text-right py-2 px-3">Commission (15%)</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="py-2 px-3 text-gray-300">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-gray-300">{c.referredEmail}</td>
                      <td className="py-2 px-3 text-gray-400">{c.sku}</td>
                      <td className="py-2 px-3 text-right text-white">
                        ${formatUsdc(c.depositAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-brand-400 font-medium">
                        ${formatUsdc(c.commissionAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-800 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm bg-gray-800 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-brand-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
