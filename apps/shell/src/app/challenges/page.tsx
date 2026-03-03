'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ChallengeItem, ChallengeCategory } from '@/lib/catalog';
import { CHALLENGE_CATALOG, CATEGORY_INFO } from '@/lib/catalog';

const CATEGORY_ORDER: ChallengeCategory[] = [
  'standard', 'aggressive', 'swing', 'consistency', 'elite', 'crypto', 'instant',
];

export default function ChallengesPage() {
  const [activeCategory, setActiveCategory] = useState<ChallengeCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return CHALLENGE_CATALOG;
    return CHALLENGE_CATALOG.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  const groupedFiltered = useMemo(() => {
    const groups: Partial<Record<ChallengeCategory, ChallengeItem[]>> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [filtered]);

  return (
    <main className="min-h-screen px-4 py-12 max-w-7xl mx-auto relative">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent mb-3">
          Trading Challenges
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Choose your challenge, prove your skills, and get funded. All accounts powered by institutional-grade simulation.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <TabButton
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          gradient="from-gray-400 to-gray-300"
        >
          All Challenges
        </TabButton>
        {CATEGORY_ORDER.map((cat) => (
          <TabButton
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            gradient={CATEGORY_INFO[cat].accent}
          >
            {CATEGORY_INFO[cat].label}
          </TabButton>
        ))}
      </div>

      {/* Challenge Cards by Category */}
      <div className="space-y-12">
        {CATEGORY_ORDER.filter((cat) => groupedFiltered[cat]).map((cat) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-1 w-8 rounded bg-gradient-to-r ${CATEGORY_INFO[cat].accent}`} />
              <h2 className="text-xl font-semibold text-white">{CATEGORY_INFO[cat].label}</h2>
              <span className="text-sm text-gray-500">{CATEGORY_INFO[cat].description}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedFiltered[cat]!.map((item) => (
                <ChallengeCard key={item.sku} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  gradient,
  children,
}: {
  active: boolean;
  onClick: () => void;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
          : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </button>
  );
}

function ChallengeCard({ item }: { item: ChallengeItem }) {
  const catInfo = CATEGORY_INFO[item.category];

  return (
    <div className="group relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.15] transition-all hover:shadow-lg hover:shadow-brand-500/5">
      {/* Popular badge */}
      {item.popular && (
        <div className="absolute -top-2.5 right-4 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-orange-400 text-black text-xs font-bold rounded-full">
          POPULAR
        </div>
      )}

      {/* Category tag */}
      <div className={`inline-block px-2.5 py-0.5 mb-4 rounded-lg text-xs font-medium bg-gradient-to-r ${catInfo.accent} text-white`}>
        {catInfo.label}
      </div>

      {/* Account size */}
      <div className="text-3xl font-bold text-white mb-1">{item.accountSize}</div>
      <div className="text-sm text-gray-500 mb-4">{item.phase}</div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Stat label="Profit Target" value={item.profitTarget} />
        <Stat label="Max Drawdown" value={item.maxDrawdown} />
        <Stat label="Leverage" value={item.leverage} />
        <Stat label="Price" value={`$${item.priceUsdc}`} highlight />
      </div>

      <p className="text-xs text-gray-500 mb-5 line-clamp-2">{item.description}</p>

      {/* CTA */}
      <Link
        href={`/challenges/checkout?sku=${item.sku}`}
        className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all
          bg-gradient-to-r ${catInfo.accent} text-white opacity-90 group-hover:opacity-100
          shadow-lg shadow-brand-500/10 group-hover:shadow-brand-500/20`}
      >
        Start Challenge — ${item.priceUsdc}
      </Link>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? 'text-brand-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}
