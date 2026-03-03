'use client';

import { CHALLENGE_CATALOG } from '@/lib/catalog';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false },
);

export default function ChallengesPage() {
  const { publicKey, connected } = useWallet();
  const [purchaseStatus, setPurchaseStatus] = useState<Record<string, string>>({});

  async function handlePurchase(sku: string) {
    if (!connected || !publicKey) {
      setPurchaseStatus((s) => ({ ...s, [sku]: 'Connect your wallet first' }));
      return;
    }

    setPurchaseStatus((s) => ({ ...s, [sku]: 'Awaiting USDC transfer...' }));

    // In production, this would:
    // 1. Build a USDC transfer tx to treasury
    // 2. Send via wallet adapter
    // 3. Call /api/deposits/verify with the txSig
    // For now, show info about the flow
    setPurchaseStatus((s) => ({
      ...s,
      [sku]: `Send USDC to treasury, then verify at /api/deposits/verify with txSig and sku="${sku}"`,
    }));
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
          {CHALLENGE_CATALOG.map((item) => (
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
                className="mt-6 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
              >
                Pay with USDC
              </button>
              {purchaseStatus[item.sku] && (
                <p className="mt-2 text-xs text-gray-400">{purchaseStatus[item.sku]}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
