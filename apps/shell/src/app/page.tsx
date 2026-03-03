import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Trade Smarter.{' '}
          <span className="text-brand-500">Get Paid in USDC.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
          Pass our trading challenge with simulated capital and receive real
          USDC payouts through our trust-minimized Solana vault.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/challenges"
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
          >
            View Challenges
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 text-white rounded-lg font-semibold transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {[
          {
            title: '1. Purchase a Challenge',
            desc: 'Pay with USDC on Solana. Your account is created instantly after on-chain verification.',
          },
          {
            title: '2. Prove Your Skill',
            desc: 'Trade simulated markets with real-time data. Hit the profit target without exceeding drawdown limits.',
          },
          {
            title: '3. Claim Your Payout',
            desc: 'Redeem your earnings directly from our on-chain vault. No intermediaries.',
          },
        ].map((step) => (
          <div key={step.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
