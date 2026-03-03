import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutoProp Firm – Trade Simulated Capital, Earn Real USDC',
  description:
    'The first on-chain prop firm on Solana. Buy a challenge, prove your skills, get funded, and earn real USDC payouts. Transparent. Permissionless. Built for traders.',
};

/* ── Icon components ── */
function IconWallet() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

/* ── Stat counter ── */
function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

/* ── Step card ── */
function StepCard({
  num,
  title,
  desc,
  icon,
}: {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative">
      {/* Glow on hover */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-brand-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="glass relative rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-brand-500/20">
        {/* Step number */}
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 text-sm font-bold mb-6 border border-brand-500/20">
          {num}
        </div>
        {/* Icon */}
        <div className="text-brand-400 mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 group hover:border-brand-500/20 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      {/* Background effects */}
      <div className="mesh-gradient" />
      <div className="noise-overlay" />

      <main className="relative z-10">
        {/* ── Navigation ── */}
        <nav className="fixed top-0 inset-x-0 z-50">
          <div className="glass-strong mx-auto mt-4 max-w-6xl rounded-2xl px-6 py-3 flex items-center justify-between mx-4 sm:mx-auto">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Prop<span className="text-brand-400">Sim</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#why-us" className="hover:text-white transition-colors">Why Us</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/login"
                className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Admin
              </Link>
              <Link
                href="/challenges"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-500/3 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

          <div className="text-center max-w-4xl mx-auto opacity-0 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-brand text-brand-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Powered by Solana &middot; Settled On-Chain
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span className="text-white">Trade With</span>
              <br />
              <span className="text-gradient-brand">Our Capital.</span>
              <br />
              <span className="text-white">Keep The</span>{' '}
              <span className="text-gradient-brand">Profits.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              The world&apos;s first <span className="text-white font-medium">fully autonomous prop firm</span> powered
              by smart contracts. Pass the challenge, prove your edge, and withdraw
              real USDC directly from our on-chain vault &mdash; no middlemen, no delays.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/challenges"
                className="group relative px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/25 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Start Your Challenge
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 glass hover:border-gray-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto text-center"
              >
                Create Free Account
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="glass rounded-2xl px-8 py-6 inline-flex items-center gap-8 sm:gap-12">
              <StatBlock value="$50K" label="Max Allocation" />
              <div className="w-px h-10 bg-gray-800" />
              <StatBlock value="90%" label="Profit Split" />
              <div className="w-px h-10 bg-gray-800 hidden sm:block" />
              <div className="hidden sm:block">
                <StatBlock value="USDC" label="Direct Payouts" />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="relative px-4 py-32">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
                Simple Process
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Three Steps to <span className="text-gradient-brand">Funded Trading</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                No bureaucracy. No waiting weeks for approval. Our entire process is
                automated and settled on the Solana blockchain.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StepCard
                num="01"
                title="Purchase a Challenge"
                desc="Choose your challenge tier and pay with USDC on Solana. Your funded evaluation account is created instantly after on-chain confirmation — no forms, no KYC delays."
                icon={<IconWallet />}
              />
              <StepCard
                num="02"
                title="Prove Your Edge"
                desc="Trade simulated markets with real-time data through our professional terminal. Hit the profit target while staying within drawdown limits to demonstrate consistent skill."
                icon={<IconChart />}
              />
              <StepCard
                num="03"
                title="Claim Your Profits"
                desc="Once you pass, your payout is cryptographically signed and redeemable directly from our on-chain vault. Connect your wallet, redeem the claim — USDC hits your wallet in seconds."
                icon={<IconBolt />}
              />
            </div>

            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[calc(50%+2rem)] left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="relative px-4 py-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
                Platform Features
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Everything You Need to <span className="text-gradient-brand">Trade &amp; Earn</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                A complete prop trading infrastructure — from professional charting to
                trustless on-chain payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<IconChart />}
                title="Professional Trading Terminal"
                desc="Candlestick charts with lightweight-charts v5, multi-timeframe analysis, live tick data, and one-click order execution."
              />
              <FeatureCard
                icon={<IconShield />}
                title="Trustless On-Chain Vault"
                desc="Custom Solana program with Ed25519 signature verification. Every payout is cryptographically proven and replay-protected."
              />
              <FeatureCard
                icon={<IconBolt />}
                title="Instant USDC Payouts"
                desc="No waiting for wire transfers. Claims are signed server-side and redeemed instantly through your Solana wallet."
              />
              <FeatureCard
                icon={<IconGlobe />}
                title="Global & Permissionless"
                desc="Anyone with a Solana wallet can participate. No geographic restrictions, no bank accounts needed."
              />
              <FeatureCard
                icon={<IconClock />}
                title="Real-Time Challenge Tracking"
                desc="Live P&L, drawdown meters, and profit target trackers. You always know exactly where you stand."
              />
              <FeatureCard
                icon={<IconWallet />}
                title="Referral & Commission System"
                desc="Earn 15% commission on every referred user's deposit. Track earnings and withdraw commissions as signed claims."
              />
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section id="why-us" className="relative px-4 py-32">
          <div className="max-w-5xl mx-auto">
            <div className="glass-brand rounded-3xl p-10 md:p-16 text-center glow-brand">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Why Traders Choose <span className="text-gradient-brand">PropSim</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
                Traditional prop firms are opaque, slow, and riddled with hidden rules.
                We built something different — a system where every payout is provable,
                every rule is transparent, and the blockchain is the final arbiter.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
                {[
                  { stat: '100%', label: 'On-Chain Settlement', sub: 'Every payout verified' },
                  { stat: '< 5s', label: 'Payout Speed', sub: 'Solana finality' },
                  { stat: '0', label: 'Hidden Fees', sub: 'What you earn is yours' },
                  { stat: '24/7', label: 'Access', sub: 'Trade your schedule' },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-5">
                    <div className="text-2xl font-bold text-brand-400 mb-1">{item.stat}</div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Architecture / Trust Section ── */}
        <section className="relative px-4 py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
                  Transparent by Design
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Built on <span className="text-gradient-brand">Open-Source</span> Infrastructure
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Every line of code is open source. Our Solana vault program, the trading shell,
                  the admin dashboard, the referral system — everything is auditable.
                  You don&apos;t have to trust us. You can verify.
                </p>
                <ul className="space-y-3 text-gray-300 text-sm">
                  {[
                    'Ed25519 signature verification on every payout claim',
                    'Replay-protected via PDA claim markers on Solana',
                    'Daily cap enforcement enforced at the smart contract level',
                    'BFF architecture — API keys never touch the browser',
                    'Zod-validated inputs on every single API boundary',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-brand-400 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code / Architecture visual */}
              <div className="glass rounded-2xl p-6 font-mono text-sm glow-brand-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-gray-600 text-xs ml-2">solana-vault-flow</span>
                </div>
                <pre className="text-gray-400 leading-relaxed overflow-x-auto">
{`┌─────────────────┐
│   Trader Shell   │  Next.js BFF
│   ────────────   │  (secrets server-side)
└────────┬─────────┘
         │
    ┌────▼────┐
    │  Sign   │  Ed25519 claim
    │  Claim  │  signed server-side
    └────┬────┘
         │
    ┌────▼────────────────┐
    │  Solana Transaction  │
    │  ──────────────────  │
    │  ix[0] Ed25519 verify│
    │  ix[1] redeem_claim  │
    └────┬─────────────────┘
         │
    ┌────▼────┐
    │  `}<span className="text-brand-400">USDC</span>{`   │  → Trader wallet
    │ Settled │  in seconds
    └─────────┘`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Prove<br />
              <span className="text-gradient-brand">Your Edge?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join the next generation of prop trading. No middlemen,
              no trust assumptions — just you, the markets, and the blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/challenges"
                className="group px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/25 hover:-translate-y-0.5"
              >
                Start Challenge
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-10 py-4 glass hover:border-gray-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative border-t border-gray-800/50 px-4 py-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-gray-500 text-sm">
                PropSim.Markets &middot; Autonomous Prop Trading
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/proof-of-reserves" className="hover:text-gray-400 transition-colors">Proof of Reserves</Link>
              <Link href="/dashboard" className="hover:text-gray-400 transition-colors">Dashboard</Link>
              <Link href="/admin/login" className="hover:text-gray-400 transition-colors">Admin</Link>
              <a
                href="https://github.com/dylanpersonguy/auto-prop-firm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
