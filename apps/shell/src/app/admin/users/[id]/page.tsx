'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserDetail {
  id: string;
  email: string;
  walletAddress: string | null;
  role: string;
  referralCode: string | null;
  referredById: string | null;
  commissionBalanceLamports: string;
  createdAt: string;
  referredBy: { email: string; referralCode: string } | null;
  _count: { referrals: number; commissionsEarned: number; withdrawals: number };
}

interface Deposit {
  id: string;
  sku: string;
  amountBaseUnits: string;
  txSig: string;
  verifiedAt: string;
}

interface PayoutClaim {
  id: string;
  amountBaseUnits: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  redeemedTxSig: string | null;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [payoutClaims, setPayoutClaims] = useState<PayoutClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setDeposits(data.deposits || []);
        setPayoutClaims(data.payoutClaims || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function toggleRole() {
    if (!user) return;
    setUpdating(true);
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser({ ...user, role: updated.role });
    }
    setUpdating(false);
  }

  if (loading) {
    return <div className="text-gray-500">Loading user...</div>;
  }

  if (!user) {
    return <div className="text-red-400">User not found.</div>;
  }

  const balance = (Number(user.commissionBalanceLamports) / 1_000_000).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="text-gray-500 hover:text-white text-sm">← Back</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user.email}</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">{user.id}</p>
        </div>
        <button
          onClick={toggleRole}
          disabled={updating}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            user.role === 'ADMIN'
              ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80'
              : 'bg-purple-900/50 text-purple-400 hover:bg-purple-900/80'
          } disabled:opacity-50`}
        >
          {updating ? 'Updating...' : user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
        </button>
      </div>

      {/* Profile info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
            user.role === 'ADMIN' ? 'bg-purple-900/50 text-purple-400' : 'bg-gray-800 text-gray-400'
          }`}>
            {user.role}
          </span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Referral Code</p>
          <p className="text-sm text-gray-300 font-mono">{user.referralCode || 'None'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Commission Balance</p>
          <p className="text-sm text-brand-400 font-medium">${balance}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Joined</p>
          <p className="text-sm text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Referral info */}
      {(user.referredBy || user._count.referrals > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Referral Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {user.referredBy && (
              <div>
                <p className="text-xs text-gray-500">Referred By</p>
                <p className="text-gray-300">{user.referredBy.email}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Users Referred</p>
              <p className="text-gray-300">{user._count.referrals}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Commissions Earned</p>
              <p className="text-gray-300">{user._count.commissionsEarned}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Withdrawals</p>
              <p className="text-gray-300">{user._count.withdrawals}</p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet */}
      {user.walletAddress && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Wallet</h2>
          <p className="text-xs text-gray-300 font-mono break-all">{user.walletAddress}</p>
        </div>
      )}

      {/* Deposits */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Deposits ({deposits.length})</h2>
        {deposits.length === 0 ? (
          <p className="text-xs text-gray-500">No deposits</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium">Amount (USDC)</th>
                  <th className="pb-2 font-medium">Tx Signature</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {deposits.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 text-gray-300">{d.sku}</td>
                    <td className="py-2 text-gray-300">${(Number(d.amountBaseUnits) / 1_000_000).toFixed(2)}</td>
                    <td className="py-2 text-gray-500 font-mono text-xs truncate max-w-[200px]">{d.txSig}</td>
                    <td className="py-2 text-gray-500 text-xs">{new Date(d.verifiedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Claims */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Payout Claims ({payoutClaims.length})</h2>
        {payoutClaims.length === 0 ? (
          <p className="text-xs text-gray-500">No payout claims</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 font-medium">Amount (USDC)</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Expires</th>
                  <th className="pb-2 font-medium">Tx Sig</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {payoutClaims.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-300">${(Number(p.amountBaseUnits) / 1_000_000).toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.status === 'ISSUED' ? 'bg-yellow-900/50 text-yellow-400' :
                        p.status === 'REDEEMED' ? 'bg-green-900/50 text-green-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-gray-500 text-xs">{new Date(p.expiresAt).toLocaleDateString()}</td>
                    <td className="py-2 text-gray-500 font-mono text-xs truncate max-w-[150px]">
                      {p.redeemedTxSig || '—'}
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
