'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCatalogItem, CATEGORY_INFO } from '@/lib/catalog';
import type { ChallengeItem } from '@/lib/catalog';

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
  const [item, setItem] = useState<ChallengeItem | null>(null);
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [error, setError] = useState('');
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

  async function handlePurchase() {
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
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Payment</h3>

            {/* Mock payment notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm">
              <strong>Demo Mode:</strong> Payment is simulated. In production, this will use on-chain USDC on Solana.
            </div>

            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-white">${item.priceUsdc} USDC</span>
            </div>

            <button
              onClick={handlePurchase}
              className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg
                bg-gradient-to-r ${catInfo.accent} text-white
                hover:opacity-90 shadow-brand-500/20`}
            >
              Confirm Purchase — ${item.priceUsdc} USDC
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
