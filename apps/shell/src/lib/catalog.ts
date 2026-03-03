/**
 * Challenge Catalog — maps SKU -> PropSim template + pricing.
 * Template IDs come from PropSim's /api/admin/templates endpoint.
 */
export type ChallengeCategory = 'standard' | 'aggressive' | 'swing' | 'consistency' | 'elite' | 'crypto' | 'instant';

export interface ChallengeItem {
  sku: string;
  templateId: string;
  priceUsdc: number;
  name: string;
  description: string;
  accountSize: string;
  category: ChallengeCategory;
  leverage: string;
  profitTarget: string;
  maxDrawdown: string;
  phase: string;
  popular?: boolean;
}

export const CHALLENGE_CATALOG: ChallengeItem[] = [
  // ── Standard Two-Phase ─────────────────────────────────
  {
    sku: 'standard-10k',
    templateId: '5de27000-a88b-49e5-aa6e-7f00943983c4',
    priceUsdc: 50,
    name: 'Standard 10K',
    description: 'Phase 1 evaluation. 8% profit target, 5% daily loss, 10% max drawdown, 30-day window.',
    accountSize: '$10,000',
    category: 'standard',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'standard-25k',
    templateId: 'a1ef4397-25f6-4852-abdf-a0951de10c8e',
    priceUsdc: 100,
    name: 'Standard 25K',
    description: 'Phase 1 evaluation. 8% profit target, 5% daily loss, 10% max drawdown, 30-day window.',
    accountSize: '$25,000',
    category: 'standard',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'standard-50k',
    templateId: 'd60d81e4-06e7-436c-a0ee-c324ea35c935',
    priceUsdc: 150,
    name: 'Standard 50K',
    description: 'Phase 1 evaluation. 8% profit target, 5% daily loss, 10% max drawdown, 30-day window.',
    accountSize: '$50,000',
    category: 'standard',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
    popular: true,
  },
  {
    sku: 'standard-100k',
    templateId: 'f086f65e-be7c-4f64-a0ce-f4a2b53d68c5',
    priceUsdc: 250,
    name: 'Standard 100K',
    description: 'Phase 1 evaluation. 8% profit target, 5% daily loss, 10% max drawdown, 30-day window.',
    accountSize: '$100,000',
    category: 'standard',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
    popular: true,
  },
  {
    sku: 'standard-200k',
    templateId: '4abf1016-4c30-4268-af47-cf2ca4fdd0ee',
    priceUsdc: 400,
    name: 'Standard 200K',
    description: 'Phase 1 evaluation. 8% profit target, 5% daily loss, 10% max drawdown, 30-day window.',
    accountSize: '$200,000',
    category: 'standard',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },

  // ── Aggressive Single-Phase ────────────────────────────
  {
    sku: 'aggressive-25k',
    templateId: 'f4078f6c-f204-47fa-88ba-56ed9490964c',
    priceUsdc: 120,
    name: 'Aggressive 25K',
    description: 'Single-phase challenge. 10% target, 4% daily loss, 8% max drawdown. High risk, high reward.',
    accountSize: '$25,000',
    category: 'aggressive',
    leverage: '1:50',
    profitTarget: '10%',
    maxDrawdown: '8%',
    phase: 'Single Phase',
  },
  {
    sku: 'aggressive-50k',
    templateId: '57550206-8e5b-44fa-bea6-b9767362e4fe',
    priceUsdc: 200,
    name: 'Aggressive 50K',
    description: 'Single-phase challenge. 10% target, 4% daily loss, 8% max drawdown. High risk, high reward.',
    accountSize: '$50,000',
    category: 'aggressive',
    leverage: '1:50',
    profitTarget: '10%',
    maxDrawdown: '8%',
    phase: 'Single Phase',
  },
  {
    sku: 'aggressive-100k',
    templateId: '0db3ca29-0be9-4503-a142-a4c2a4239840',
    priceUsdc: 350,
    name: 'Aggressive 100K',
    description: 'Single-phase challenge. 10% target, 4% daily loss, 8% max drawdown. High risk, high reward.',
    accountSize: '$100,000',
    category: 'aggressive',
    leverage: '1:50',
    profitTarget: '10%',
    maxDrawdown: '8%',
    phase: 'Single Phase',
    popular: true,
  },

  // ── Swing Trader ───────────────────────────────────────
  {
    sku: 'swing-50k',
    templateId: '016153bc-4eb2-414f-b29a-8f54e533bbe3',
    priceUsdc: 180,
    name: 'Swing 50K',
    description: 'Swing trader challenge. No time limit, weekend holding allowed. 8% target.',
    accountSize: '$50,000',
    category: 'swing',
    leverage: '1:50',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'swing-100k',
    templateId: '6859c60d-e789-4002-829a-5d92e7c388f7',
    priceUsdc: 300,
    name: 'Swing 100K',
    description: 'Swing trader challenge. No time limit, weekend holding allowed. 8% target.',
    accountSize: '$100,000',
    category: 'swing',
    leverage: '1:50',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'swing-200k',
    templateId: 'bf2640b4-2dd3-4be3-8e5a-124a05d4c216',
    priceUsdc: 500,
    name: 'Swing 200K',
    description: 'Swing trader challenge. No time limit, weekend holding allowed. 8% target.',
    accountSize: '$200,000',
    category: 'swing',
    leverage: '1:50',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },

  // ── Consistency ────────────────────────────────────────
  {
    sku: 'consistency-50k',
    templateId: 'ff65d3b2-9ce2-4218-8dca-6c5c33037b21',
    priceUsdc: 180,
    name: 'Consistency 50K',
    description: 'Consistency challenge. 10% target, no single day > 30% of total profit. Proves discipline.',
    accountSize: '$50,000',
    category: 'consistency',
    leverage: '1:100',
    profitTarget: '10%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'consistency-100k',
    templateId: '5ce3f7c4-fc47-4ccc-befd-f4710b8bfc52',
    priceUsdc: 300,
    name: 'Consistency 100K',
    description: 'Consistency challenge. 10% target, no single day > 30% of total profit. Proves discipline.',
    accountSize: '$100,000',
    category: 'consistency',
    leverage: '1:100',
    profitTarget: '10%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'consistency-200k',
    templateId: '4dc7fd75-035f-482a-87ac-ac1463177ee2',
    priceUsdc: 500,
    name: 'Consistency 200K',
    description: 'Consistency challenge. 10% target, no single day > 30% of total profit. Proves discipline.',
    accountSize: '$200,000',
    category: 'consistency',
    leverage: '1:100',
    profitTarget: '10%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },

  // ── Elite ──────────────────────────────────────────────
  {
    sku: 'elite-300k',
    templateId: 'ba888e4b-0d2a-4e78-b180-3ab518493eb5',
    priceUsdc: 600,
    name: 'Elite 300K',
    description: 'Elite evaluation. 8% target, min 10 trading days, 45-day window. 90/10 profit split when funded.',
    accountSize: '$300,000',
    category: 'elite',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
  },
  {
    sku: 'elite-500k',
    templateId: '0edbb6d8-7edf-4e7e-b9f8-73037d9e82ee',
    priceUsdc: 900,
    name: 'Elite 500K',
    description: 'Elite evaluation. 8% target, min 10 trading days, 45-day window. 90/10 profit split when funded.',
    accountSize: '$500,000',
    category: 'elite',
    leverage: '1:100',
    profitTarget: '8%',
    maxDrawdown: '10%',
    phase: 'Phase 1',
    popular: true,
  },

  // ── Crypto ─────────────────────────────────────────────
  {
    sku: 'crypto-5k',
    templateId: '3937a8d9-1374-4217-8233-c5002660b9c6',
    priceUsdc: 40,
    name: 'Crypto 5K',
    description: 'Crypto-focused challenge. 15% target (higher for crypto volatility), 8% daily loss, 15% max DD.',
    accountSize: '$5,000',
    category: 'crypto',
    leverage: '1:20',
    profitTarget: '15%',
    maxDrawdown: '15%',
    phase: 'Phase 1',
  },
  {
    sku: 'crypto-10k',
    templateId: '538ffbf8-d34c-4e98-a4a0-e70f51f77ac7',
    priceUsdc: 70,
    name: 'Crypto 10K',
    description: 'Crypto-focused challenge. 15% target (higher for crypto volatility), 8% daily loss, 15% max DD.',
    accountSize: '$10,000',
    category: 'crypto',
    leverage: '1:20',
    profitTarget: '15%',
    maxDrawdown: '15%',
    phase: 'Phase 1',
  },
  {
    sku: 'crypto-25k',
    templateId: '62cfea47-e12c-43cd-920b-afe0744a808b',
    priceUsdc: 130,
    name: 'Crypto 25K',
    description: 'Crypto-focused challenge. 15% target (higher for crypto volatility), 8% daily loss, 15% max DD.',
    accountSize: '$25,000',
    category: 'crypto',
    leverage: '1:20',
    profitTarget: '15%',
    maxDrawdown: '15%',
    phase: 'Phase 1',
  },
  {
    sku: 'crypto-50k',
    templateId: 'f270a1a1-80fb-4f52-8b56-5a52127bd0f9',
    priceUsdc: 220,
    name: 'Crypto 50K',
    description: 'Crypto-focused challenge. 15% target (higher for crypto volatility), 8% daily loss, 15% max DD.',
    accountSize: '$50,000',
    category: 'crypto',
    leverage: '1:20',
    profitTarget: '15%',
    maxDrawdown: '15%',
    phase: 'Phase 1',
  },

  // ── Instant Funding (skip evaluation) ──────────────────
  {
    sku: 'instant-10k',
    templateId: '6a8223bf-7379-4ca2-9512-ebc740647015',
    priceUsdc: 100,
    name: 'Instant 10K',
    description: 'Skip the evaluation — go straight to a funded account. Tighter risk limits apply.',
    accountSize: '$10,000',
    category: 'instant',
    leverage: '1:30',
    profitTarget: 'N/A',
    maxDrawdown: '6%',
    phase: 'Funded',
  },
  {
    sku: 'instant-25k',
    templateId: '0623587a-b8aa-4213-8f81-bbaa93c90963',
    priceUsdc: 200,
    name: 'Instant 25K',
    description: 'Skip the evaluation — go straight to a funded account. Tighter risk limits apply.',
    accountSize: '$25,000',
    category: 'instant',
    leverage: '1:30',
    profitTarget: 'N/A',
    maxDrawdown: '6%',
    phase: 'Funded',
  },
  {
    sku: 'instant-50k',
    templateId: 'c3e15dd5-a27e-4e94-9a3a-7e3866db60a7',
    priceUsdc: 350,
    name: 'Instant 50K',
    description: 'Skip the evaluation — go straight to a funded account. Tighter risk limits apply.',
    accountSize: '$50,000',
    category: 'instant',
    leverage: '1:30',
    profitTarget: 'N/A',
    maxDrawdown: '6%',
    phase: 'Funded',
  },
  {
    sku: 'instant-100k',
    templateId: 'afc08e09-2d0b-4e2d-9500-20d9aadc1870',
    priceUsdc: 600,
    name: 'Instant 100K',
    description: 'Skip the evaluation — go straight to a funded account. Tighter risk limits apply.',
    accountSize: '$100,000',
    category: 'instant',
    leverage: '1:30',
    profitTarget: 'N/A',
    maxDrawdown: '6%',
    phase: 'Funded',
  },
];

// Category display info
export const CATEGORY_INFO: Record<ChallengeCategory, { label: string; accent: string; description: string }> = {
  standard: { label: 'Standard', accent: 'from-blue-500 to-cyan-400', description: 'Classic two-phase evaluation with balanced rules' },
  aggressive: { label: 'Aggressive', accent: 'from-red-500 to-orange-400', description: 'Single-phase, tighter drawdown, bigger rewards' },
  swing: { label: 'Swing', accent: 'from-purple-500 to-pink-400', description: 'No time limit, hold over weekends' },
  consistency: { label: 'Consistency', accent: 'from-emerald-500 to-teal-400', description: 'Prove steady discipline — no single day > 30% of profit' },
  elite: { label: 'Elite', accent: 'from-amber-500 to-yellow-400', description: 'Large capital, 90/10 profit split when funded' },
  crypto: { label: 'Crypto', accent: 'from-violet-500 to-indigo-400', description: 'Crypto-focused with adapted rules for volatility' },
  instant: { label: 'Instant Funding', accent: 'from-green-500 to-emerald-400', description: 'Skip the evaluation — funded immediately' },
};

export function getCatalogItem(sku: string): ChallengeItem | undefined {
  return CHALLENGE_CATALOG.find((c) => c.sku === sku);
}

export function getCatalogByCategory(): Record<ChallengeCategory, ChallengeItem[]> {
  const grouped: Record<string, ChallengeItem[]> = {};
  for (const item of CHALLENGE_CATALOG) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped as Record<ChallengeCategory, ChallengeItem[]>;
}
