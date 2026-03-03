'use client';

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { Navbar } from '@/components/Navbar';
import { useAllPayouts } from '@/lib/hooks';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false },
);

interface ClaimResponse {
  claimId: string;
  claimFields: any;
  messageB64: string;
  signatureB64: string;
  propsimSignerPubkey: string;
  programId: string;
  configPda: string;
  vaultUsdcTokenAccount: string;
  usdcMint: string;
  status?: string;
}

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayoutsPage() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { data: payouts = [], isLoading } = useAllPayouts();
  const [claimStatus, setClaimStatus] = useState<Record<string, string>>({});

  const issueClaim = useCallback(
    async (payoutId: string) => {
      if (!publicKey) {
        setClaimStatus((s) => ({ ...s, [payoutId]: 'Connect wallet first' }));
        return;
      }

      setClaimStatus((s) => ({ ...s, [payoutId]: 'Issuing claim...' }));

      try {
        const res = await fetch(`/api/payouts/${payoutId}/issue-claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletPubkey: publicKey.toBase58() }),
        });

        if (!res.ok) {
          const err = await res.json();
          setClaimStatus((s) => ({ ...s, [payoutId]: `Error: ${err.error || 'Failed'}` }));
          return;
        }

        const claim: ClaimResponse = await res.json();
        setClaimStatus((s) => ({ ...s, [payoutId]: 'Claim issued! Building tx...' }));
        await redeemOnChain(payoutId, claim);
      } catch (err: any) {
        setClaimStatus((s) => ({ ...s, [payoutId]: `Error: ${err.message}` }));
      }
    },
    [publicKey, connection, sendTransaction],
  );

  async function redeemOnChain(payoutId: string, claim: ClaimResponse) {
    if (!publicKey || !sendTransaction) return;

    try {
      const { makeEd25519VerifyIx, makeRedeemIx } = await import('@auto-prop-firm/vault-sdk');
      const messageBytes = Buffer.from(claim.messageB64, 'base64');
      const signatureBytes = Buffer.from(claim.signatureB64, 'base64');
      const signerPubkey = Buffer.from(claim.propsimSignerPubkey, 'base64');

      const ed25519Ix = makeEd25519VerifyIx(
        new Uint8Array(signerPubkey),
        new Uint8Array(messageBytes),
        new Uint8Array(signatureBytes),
      );

      const cf = claim.claimFields;
      const programId = new PublicKey(claim.programId);

      const redeemIx = makeRedeemIx({
        programId,
        configAuthority: new PublicKey(claim.configPda),
        usdcMint: new PublicKey(claim.usdcMint),
        user: publicKey,
        claimFields: {
          version: cf.version,
          domain: new Uint8Array(cf.domain),
          programId,
          config: new PublicKey(cf.config),
          claimId: new Uint8Array(cf.claimId),
          user: publicKey,
          usdcMint: new PublicKey(cf.usdcMint),
          amount: BigInt(cf.amount),
          validAfter: BigInt(cf.validAfter),
          validBefore: BigInt(cf.validBefore),
          dayId: cf.dayId,
          dailyCap: BigInt(cf.dailyCap),
        },
        signature: new Uint8Array(signatureBytes),
      });

      const tx = new Transaction();
      tx.add(ed25519Ix);
      tx.add(redeemIx);

      setClaimStatus((s) => ({ ...s, [payoutId]: 'Please approve the transaction...' }));

      const sig = await sendTransaction(tx, connection);
      setClaimStatus((s) => ({ ...s, [payoutId]: `Confirming: ${sig.slice(0, 16)}...` }));

      await connection.confirmTransaction(sig, 'confirmed');

      await fetch(`/api/payouts/${payoutId}/mark-redeemed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txSig: sig }),
      });

      setClaimStatus((s) => ({ ...s, [payoutId]: `Redeemed! Tx: ${sig}` }));
    } catch (err: any) {
      setClaimStatus((s) => ({ ...s, [payoutId]: `Tx error: ${err.message}` }));
    }
  }

  // Stats
  const totalPaid = payouts
    .filter((p) => p.status === 'COMPLETED' || p.status === 'PAID' || p.status === 'REDEEMED')
    .reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED');

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Payouts</h1>
            <p className="text-gray-400 text-sm mt-1">Request payouts and redeem claims on Solana.</p>
          </div>
          {!connected && <WalletMultiButton />}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Total Paid Out</div>
            <div className="text-xl font-semibold tabular-nums text-brand-400">${fmt(totalPaid)}</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Pending / Approved</div>
            <div className="text-xl font-semibold tabular-nums text-yellow-400">{pending.length}</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Total Payouts</div>
            <div className="text-xl font-semibold tabular-nums">{payouts.length}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-xl" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-10 text-center">
            <p className="text-gray-400">No payouts yet. Start trading to earn payouts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-semibold tabular-nums text-white">${fmt(payout.amount)} USDC</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Account: {payout.accountId?.slice(0, 8)} &middot;{' '}
                      {payout.createdAt && new Date(payout.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {payout.status === 'APPROVED' && connected && (
                      <button
                        onClick={() => issueClaim(payout.id)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Issue Claim & Redeem
                      </button>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      payout.status === 'APPROVED' ? 'bg-green-900/40 text-green-400' :
                      payout.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400' :
                      payout.status === 'REDEEMED' || payout.status === 'COMPLETED' || payout.status === 'PAID' ? 'bg-brand-900/40 text-brand-400' :
                      'bg-gray-800 text-gray-500'
                    }`}>
                      {payout.status}
                    </span>
                  </div>
                </div>
                {claimStatus[payout.id] && (
                  <p className="mt-3 text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 font-mono">
                    {claimStatus[payout.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
