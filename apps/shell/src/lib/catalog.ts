/**
 * Challenge Catalog — maps SKU -> PropSim template + pricing.
 * This is shell config, NOT fetched from PropSim admin endpoints.
 */
export interface ChallengeItem {
  sku: string;
  templateId: string;
  priceUsdc: number; // in whole USDC (e.g., 100)
  name: string;
  description: string;
  accountSize: string; // e.g., "$50,000"
}

export const CHALLENGE_CATALOG: ChallengeItem[] = [
  {
    sku: 'starter-50k',
    templateId: 'tpl_starter_50k', // Replace with actual PropSim template ID
    priceUsdc: 100,
    name: 'Starter Challenge',
    description: '$50K simulated account. 10% profit target, 5% max drawdown.',
    accountSize: '$50,000',
  },
  {
    sku: 'standard-100k',
    templateId: 'tpl_standard_100k',
    priceUsdc: 200,
    name: 'Standard Challenge',
    description: '$100K simulated account. 10% profit target, 5% max drawdown.',
    accountSize: '$100,000',
  },
  {
    sku: 'pro-200k',
    templateId: 'tpl_pro_200k',
    priceUsdc: 400,
    name: 'Pro Challenge',
    description: '$200K simulated account. 8% profit target, 5% max drawdown.',
    accountSize: '$200,000',
  },
];

export function getCatalogItem(sku: string): ChallengeItem | undefined {
  return CHALLENGE_CATALOG.find((c) => c.sku === sku);
}
