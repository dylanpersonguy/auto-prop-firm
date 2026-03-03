'use client';

import { CHALLENGE_CATALOG } from '@/lib/catalog';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false },
);

type PurchaseState = {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
};

export default function ChallengesPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [purchaseStates, setPurchaseStates] = useState<Record<string, PurchaseState>>({});

  async function handlePurchase(sku: string) {
    if (!connected || !publicKey) {
      setPurchaseStates((s) => ({
        ...s,
        [sku]: { status: 'error', message: 'Connect your wallet first' },
      }));
      return;
    }

    setPurchaseStates((s) => ({
      ...s,
      [sku]: { status: 'processing', message: 'Processing payment...' },
    }));

    try {
      const res = await fetch('/api/deposits/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          depositorWallet: publicKey.toBase58(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPurchaseStates((s) => ({
          ...s,
          [sku]: { status: 'error', message: data.error || 'Payment failed' },
        }));
        return;
      }

      // Payment succeeded — redirect to trader dashboard
      router.push('/dashboard');
    } catch {
      setPurchaseStates((s) => ({
        ...s,
        [sku]: { status: 'error', message: 'Network error — please try again.' },
      }));
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Trading Challenges</h1>
        <p className="text-gray-400 mb-8">
          Choose a challenge, pay with USDC on Solana, and start trading immediately.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHALLENGE_CATALOG.map((item) => {
            const state = purchaseStates[item.sku];
            const isProcessing = state?.status === 'processing';

            return (
              <div
                key={item.sku}
                className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{item.name}</h2>
                  <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-brand-500">
                      ${item.priceUsdc}
                    </span>
                    <span className="text-gray-400 text-sm">USDC</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Account Size: {item.accountSize}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(item.sku)}
                  disabled={isProcessing}
                  className="mt-6 w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Pay with USDC'
                  )}
                </button>

                {state?.status === 'error' && (
                  <p className="mt-2 text-xs text-red-400">{state.message}</p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
