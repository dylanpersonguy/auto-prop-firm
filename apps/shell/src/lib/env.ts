import { z } from 'zod';

// ── Environment helpers ──

export const env = {
  propsimBaseUrl: process.env.PROPSIM_BASE_URL || 'http://localhost:3000',
  propsimApiKey: process.env.PROPSIM_API_KEY || '',
  publicPropsimBaseUrl: process.env.NEXT_PUBLIC_PROPSIM_BASE_URL || 'http://localhost:3000',
  jwtSecret: process.env.PROPSIM_SHELL_JWT_SECRET || 'changeme_local_dev',
  solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899',
  usdcMint: process.env.NEXT_PUBLIC_USDC_MINT || '',
  treasuryWallet: process.env.NEXT_PUBLIC_TREASURY_WALLET || '',
  profitWallet: process.env.NEXT_PUBLIC_PROFIT_WALLET || '',
  vaultProgramId: process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || '',
  vaultConfigPda: process.env.NEXT_PUBLIC_VAULT_CONFIG_PDA || '',
  vaultUsdcTokenAccount: process.env.NEXT_PUBLIC_VAULT_USDC_TOKEN_ACCOUNT || '',
  claimSignerPrivateKeyB64: process.env.PROPSIM_CLAIM_SIGNER_ED25519_PRIVATE_KEY_BASE64 || '',
  claimDomain: process.env.CLAIM_DOMAIN || 'PROPSIM_PAYOUT_V1',
  claimTtlSeconds: parseInt(process.env.CLAIM_TTL_SECONDS || '604800', 10),
  dailyCapUsdc: parseInt(process.env.DAILY_CAP_USDC || '5000', 10),
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'admin_secret_changeme',
};

// ── Zod schemas for PropSim API responses ──

export const AccountSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  label: z.string().optional(),
  status: z.string(),
  balance: z.number().optional(),
  equity: z.number().optional(),
  createdAt: z.string().optional(),
});

export const AccountListSchema = z.array(AccountSchema);

export const MetricsSchema = z.object({
  accountId: z.string().optional(),
  profit: z.number().optional(),
  profitPercent: z.number().optional(),
  maxDrawdown: z.number().optional(),
  maxDrawdownPercent: z.number().optional(),
  tradingDays: z.number().optional(),
  winRate: z.number().optional(),
}).passthrough();

export const PayoutCalcSchema = z.object({
  eligibleAmount: z.number(),
  profitSplit: z.number().optional(),
  payoutAmount: z.number().optional(),
}).passthrough();

export const PayoutSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  status: z.string(),
  createdAt: z.string().optional(),
}).passthrough();

export const PayoutListSchema = z.array(PayoutSchema);

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const FirmSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

export const SymbolSchema = z.object({
  symbol: z.string(),
  description: z.string().optional(),
}).passthrough();

export const SymbolListSchema = z.array(SymbolSchema);

export const OrderSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.string(),
  type: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  status: z.string(),
}).passthrough();

export const PositionSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.string(),
  quantity: z.number(),
  entryPrice: z.number(),
  unrealizedPnl: z.number().optional(),
}).passthrough();

export type Account = z.infer<typeof AccountSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type PayoutCalc = z.infer<typeof PayoutCalcSchema>;
export type Payout = z.infer<typeof PayoutSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
