'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { getCatalogItem, CATEGORY_INFO } from '@/lib/catalog';
import type { ChallengeItem } from '@/lib/catalog';

const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
);
const TREASURY_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY_WALLET || '11111111111111111111111111111111',
);

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sku = searchParams.get('sku') || '';
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [item, setItem] = useState<ChallengeItem | null>(null);
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mock' | 'usdc'>('mock');
  const [createdAccount, setCreatedAccount] = useState<{
    id: string;
    label: string;
    startingBalance: number;
    phase: string;
  } | null>(null);

  useEffect(() => {
    const found = getCatalogItem(sku);
    if (!found) {
      setStep('error');
      setError('Challenge not found');
    } else {
      setItem(found);
    }
  }, [sku]);

  const handleUsdcPurchase = useCallback(async () => {
    if (!item || !publicKey || !sendTransaction) return;
    setStep('processing');
    setError('');

    try {
      // Build USDC transfer transaction
      const amount = BigInt(item.priceUsdc * 1_000_000); // 6 decimals
      const senderAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET, true);

      const tx = new Transaction();

      // Create treasury ATA if it doesn't exist
      try {
        await getAccount(connection, treasuryAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryAta,
            TREASURY_WALLET,
            USDC_MINT,
          ),
        );
      }

      tx.add(
        createTransferInstruction(senderAta, treasuryAta, publicKey, amount),
      );

      // Sign + send via wallet adapter
      const sig = await sendTransaction(tx, connection);

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, ...latestBlockhash },
        'confirmed',
      );

      // Send to our API with the verified tx signature
      const res = await fetch('/api/challenges/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, paymentMethod: 'usdc', txSig: sig }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Purchase verification failed');
        setStep('error');
        return;
      }

      setCreatedAccount(data.account);
      setStep('success');
    } catch (err: any) {
      const msg = err?.message || 'Transaction failed';
      setError(msg.includes('User rejected') ? 'Transaction was rejected by wallet.' : msg);
      setStep('error');
    }
  }, [item, publicKey, sendTransaction, connection, sku]);

  const handleMockPurchase = useCallback(async () => {
    setStep('processing');
    setError('');

    try {
      const res = await fetch('/api/challenges/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, paymentMethod: 'mock' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Purchase failed');
        setStep('error');
        return;
      }

      setCreatedAccount(data.account);
      setStep('success');
    } catch {
      setError('Network error. Please try again.');
      setStep('error');
    }
  }, [sku]);

  function handlePurchase() {
    if (paymentMethod === 'usdc') {
      handleUsdcPurchase();
    } else {
      handleMockPurchase();
    }
  }

  if (!item && step !== 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  const catInfo = item ? CATEGORY_INFO[item.category] : null;

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto relative">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Back link */}
      <Link href="/challenges" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Challenges
      </Link>

      {/* Review Step */}
      {step === 'review' && item && catInfo && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className={`inline-block px-2.5 py-0.5 mb-2 rounded-lg text-xs font-medium bg-gradient-to-r ${catInfo.accent} text-white`}>
                {catInfo.label}
              </div>
              <h1 className="text-2xl font-bold text-white">{item.name}</h1>
              <p className="text-gray-400 text-sm mt-1">{item.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">${item.priceUsdc}</div>
              <div className="text-sm text-gray-500">USDC</div>
            </div>
          </div>

          {/* Order details */}
          <div className="border-t border-white/[0.08] pt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Order Details</h3>
            <DetailRow label="Account Size" value={item.accountSize} />
            <DetailRow label="Phase" value={item.phase} />
            <DetailRow label="Profit Target" value={item.profitTarget} />
            <DetailRow label="Max Drawdown" value={item.maxDrawdown} />
            <DetailRow label="Leverage" value={item.leverage} />
          </div>

          {/* Payment section */}
          <div className="border-t border-white/[0.08] mt-6 pt-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Payment Method</h3>

            {/* Payment method toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('usdc')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentMethod === 'usdc'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5a1.5 1.5 0 010 3H9" />
                  </svg>
                  USDC on Solana
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('mock')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentMethod === 'mock'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Demo Mode
                </div>
              </button>
            </div>

            {/* USDC: wallet not connected warning */}
            {paymentMethod === 'usdc' && !connected && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm">
                Connect your Solana wallet using the button in the top bar to pay with USDC.
              </div>
            )}

            {/* Mock payment notice */}
            {paymentMethod === 'mock' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm">
                <strong>Demo Mode:</strong> Payment is simulated. No real funds are needed.
              </div>
            )}

            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-white">${item.priceUsdc} USDC</span>
            </div>

            <button
              onClick={handlePurchase}
              disabled={paymentMethod === 'usdc' && !connected}
              className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg
                ${paymentMethod === 'usdc' && !connected
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${catInfo.accent} text-white hover:opacity-90 shadow-brand-500/20`
                }`}
            >
              {paymentMethod === 'usdc'
                ? connected
                  ? `Pay ${item.priceUsdc} USDC with Wallet`
                  : 'Connect Wallet to Pay'
                : `Confirm Purchase — $${item.priceUsdc} USDC (Demo)`}
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/20 mb-6">
            <svg className="animate-spin h-8 w-8 text-brand-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Processing Purchase</h2>
          <p className="text-gray-400">Creating your trading account...</p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && createdAccount && item && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Challenge Activated!</h2>
            <p className="text-gray-400">Your trading account is ready. Good luck, trader!</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-5 space-y-3 mb-6">
            <DetailRow label="Account" value={createdAccount.label} />
            <DetailRow label="Starting Balance" value={`$${createdAccount.startingBalance.toLocaleString()}`} />
            <DetailRow label="Phase" value={createdAccount.phase.replace('_', ' ')} />
            <DetailRow label="Account ID" value={createdAccount.id.slice(0, 8) + '...'} />
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 text-center py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-semibold transition-all hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/20"
            >
              Go to Dashboard
            </Link>
            <Link
              href={`/trading?account=${createdAccount.id}`}
              className="flex-1 text-center py-2.5 bg-white/[0.06] border border-white/[0.1] text-white rounded-xl font-semibold transition-all hover:bg-white/[0.1]"
            >
              Start Trading
            </Link>
          </div>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Purchase Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {item && (
              <button
                onClick={() => setStep('review')}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-semibold transition-all hover:from-brand-500 hover:to-brand-400"
              >
                Try Again
              </button>
            )}
            <Link
              href="/challenges"
              className="px-6 py-2.5 bg-white/[0.06] border border-white/[0.1] text-white rounded-xl font-semibold transition-all hover:bg-white/[0.1]"
            >
              Back to Challenges
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
