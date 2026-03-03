'use client';

import { useEffect, useState } from 'react';

interface ProofData {
  treasury: {
    wallet: string;
    usdcAta: string;
    balanceUsdc: string;
    explorerUrl: string | null;
  };
  vault: {
    programId: string;
    configPda: string;
    usdcTokenAccount: string;
    balanceUsdc: string;
    explorerUrl: string | null;
  };
  totalReservesUsdc: string;
}

export default function ProofOfReservesPage() {
  const [proof, setProof] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/transparency/proof')
      .then((r) => r.json())
      .then((data) => {
        setProof(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Proof of Reserves</h1>
        <p className="text-gray-400 mb-8">
          Real-time on-chain balances of our Treasury and Payout Vault. Verify independently on Solana Explorer.
        </p>

        {loading ? (
          <p className="text-gray-400">Loading balances...</p>
        ) : proof ? (
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-brand-600/10 border border-brand-600/30 rounded-xl p-6 text-center">
              <div className="text-sm text-brand-500 mb-1">Total Reserves</div>
              <div className="text-4xl font-bold text-brand-500">
                ${proof.totalReservesUsdc} USDC
              </div>
            </div>

            {/* Treasury */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Treasury</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet</span>
                  <span className="font-mono text-xs">{proof.treasury.wallet || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">USDC ATA</span>
                  <span className="font-mono text-xs">{proof.treasury.usdcAta || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance</span>
                  <span className="font-bold">${proof.treasury.balanceUsdc} USDC</span>
                </div>
                {proof.treasury.explorerUrl && (
                  <a
                    href={proof.treasury.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline block"
                  >
                    View on Solana Explorer &rarr;
                  </a>
                )}
              </div>
            </div>

            {/* Vault */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Payout Vault (On-Chain)</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Program ID</span>
                  <span className="font-mono text-xs">{proof.vault.programId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Config PDA</span>
                  <span className="font-mono text-xs">{proof.vault.configPda || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">USDC Token Account</span>
                  <span className="font-mono text-xs">{proof.vault.usdcTokenAccount || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance</span>
                  <span className="font-bold">${proof.vault.balanceUsdc} USDC</span>
                </div>
                {proof.vault.explorerUrl && (
                  <a
                    href={proof.vault.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline block"
                  >
                    View on Solana Explorer &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-red-400">Failed to load proof data.</p>
        )}
      </main>
    </>
  );
}
