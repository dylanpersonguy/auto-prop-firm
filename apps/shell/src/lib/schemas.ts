/**
 * Zod schemas for every PropSim API response shape.
 * All BFF responses are validated through these before use in the UI.
 */
import { z } from 'zod';

// ── Generic Error Response ──
export const ErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
    correlationId: z.string().optional(),
  }).passthrough(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ── Account ──
export const AccountSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  label: z.string().optional(),
  status: z.string(),
  phase: z.string().optional(),
  balance: z.number().optional(),
  equity: z.number().optional(),
  startingBalance: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();
export type Account = z.infer<typeof AccountSchema>;
export const AccountListSchema = z.array(AccountSchema);

// ── Account Metrics ──
export const MetricsSchema = z.object({
  accountId: z.string().optional(),
  balance: z.number().optional(),
  equity: z.number().optional(),
  profit: z.number().optional(),
  profitPercent: z.number().optional(),
  dailyPnl: z.number().optional(),
  dailyPnlPercent: z.number().optional(),
  maxDrawdown: z.number().optional(),
  maxDrawdownPercent: z.number().optional(),
  dailyDrawdown: z.number().optional(),
  dailyDrawdownPercent: z.number().optional(),
  profitTarget: z.number().optional(),
  profitTargetPercent: z.number().optional(),
  tradingDays: z.number().optional(),
  minTradingDays: z.number().optional(),
  winRate: z.number().optional(),
  totalTrades: z.number().optional(),
  openPositions: z.number().optional(),
  lastTradeAt: z.string().nullable().optional(),
  markTimestamp: z.string().nullable().optional(),
}).passthrough();
export type Metrics = z.infer<typeof MetricsSchema>;

// ── Account Status (trading) ──
export const AccountStatusSchema = z.object({
  accountId: z.string().optional(),
  status: z.string().optional(),
  tradingEnabled: z.boolean().optional(),
  riskStatus: z.string().optional(),
  violations: z.array(z.object({
    rule: z.string().optional(),
    message: z.string().optional(),
    severity: z.string().optional(),
  }).passthrough()).optional(),
  dailyLossLimit: z.number().optional(),
  dailyLossUsed: z.number().optional(),
  maxLossLimit: z.number().optional(),
  maxLossUsed: z.number().optional(),
}).passthrough();
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

// ── Equity Snapshot ──
export const EquityPointSchema = z.object({
  timestamp: z.string(),
  equity: z.number(),
  balance: z.number().optional(),
}).passthrough();
export const EquityListSchema = z.array(EquityPointSchema);
export type EquityPoint = z.infer<typeof EquityPointSchema>;

// ── Ledger ──
export const LedgerEntrySchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  amount: z.number(),
  balance: z.number().optional(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();
export const LedgerListSchema = z.object({
  entries: z.array(LedgerEntrySchema).optional(),
  data: z.array(LedgerEntrySchema).optional(),
}).passthrough();
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ── Account Stats ──
export const AccountStatsSchema = z.object({
  totalTrades: z.number().optional(),
  winRate: z.number().optional(),
  profitFactor: z.number().optional(),
  averageWin: z.number().optional(),
  averageLoss: z.number().optional(),
  bestTrade: z.number().optional(),
  worstTrade: z.number().optional(),
  sharpeRatio: z.number().optional(),
}).passthrough();
export type AccountStats = z.infer<typeof AccountStatsSchema>;

// ── Orders ──
export const OrderSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  symbol: z.string(),
  side: z.string(),
  type: z.string(),
  quantity: z.number(),
  price: z.number().optional().nullable(),
  stopPrice: z.number().optional().nullable(),
  filledQuantity: z.number().optional(),
  averageFillPrice: z.number().optional().nullable(),
  status: z.string(),
  timeInForce: z.string().optional(),
  takeProfitPrice: z.number().optional().nullable(),
  stopLossPrice: z.number().optional().nullable(),
  trailingStopDistance: z.number().optional().nullable(),
  idempotencyKey: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();
export type Order = z.infer<typeof OrderSchema>;
export const OrderListSchema = z.array(OrderSchema);

// ── Positions ──
export const PositionSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  symbol: z.string(),
  side: z.string(),
  quantity: z.number(),
  entryPrice: z.number(),
  currentPrice: z.number().optional(),
  markPrice: z.number().optional(),
  unrealizedPnl: z.number().optional(),
  realizedPnl: z.number().optional(),
  takeProfitPrice: z.number().optional().nullable(),
  stopLossPrice: z.number().optional().nullable(),
  trailingStopDistance: z.number().optional().nullable(),
  status: z.string().optional(),
  openedAt: z.string().optional(),
  closedAt: z.string().optional().nullable(),
}).passthrough();
export type Position = z.infer<typeof PositionSchema>;
export const PositionListSchema = z.array(PositionSchema);

// ── Fills ──
export const FillSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  accountId: z.string().optional(),
  symbol: z.string(),
  side: z.string(),
  quantity: z.number(),
  price: z.number(),
  fee: z.number().optional(),
  realizedPnl: z.number().optional().nullable(),
  createdAt: z.string().optional(),
}).passthrough();
export type Fill = z.infer<typeof FillSchema>;
export const FillListSchema = z.array(FillSchema);

// ── Closed Positions ──
export const ClosedPositionSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  symbol: z.string(),
  side: z.string(),
  quantity: z.number(),
  entryPrice: z.number(),
  exitPrice: z.number().optional(),
  realizedPnl: z.number().optional(),
  openedAt: z.string().optional(),
  closedAt: z.string().optional(),
}).passthrough();
export type ClosedPosition = z.infer<typeof ClosedPositionSchema>;
export const ClosedPositionListSchema = z.array(ClosedPositionSchema);

// ── Market Data ──
export const SymbolInfoSchema = z.object({
  symbol: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  exchange: z.string().optional(),
  pipSize: z.number().optional(),
  lotSize: z.number().optional(),
  minQuantity: z.number().optional(),
  maxQuantity: z.number().optional(),
  contractSize: z.number().optional(),
}).passthrough();
export type SymbolInfo = z.infer<typeof SymbolInfoSchema>;
export const SymbolListSchema = z.array(SymbolInfoSchema);

export const TickSchema = z.object({
  symbol: z.string(),
  bid: z.number(),
  ask: z.number(),
  mid: z.number().optional(),
  timestamp: z.string().optional(),
  spread: z.number().optional(),
}).passthrough();
export type Tick = z.infer<typeof TickSchema>;
export const TickListSchema = z.array(TickSchema);

export const CandleSchema = z.object({
  time: z.union([z.number(), z.string()]),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
}).passthrough();
export type Candle = z.infer<typeof CandleSchema>;
export const CandleListSchema = z.array(CandleSchema);

// ── Payouts ──
export const PayoutCalcSchema = z.object({
  eligible: z.boolean().optional(),
  eligibleAmount: z.number().optional(),
  profitSplit: z.number().optional(),
  payoutAmount: z.number().optional(),
  reason: z.string().optional(),
}).passthrough();
export type PayoutCalc = z.infer<typeof PayoutCalcSchema>;

export const PayoutSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  status: z.string(),
  createdAt: z.string().optional(),
}).passthrough();
export type Payout = z.infer<typeof PayoutSchema>;
export const PayoutListSchema = z.array(PayoutSchema);

// ── Journal ──
export const JournalEntrySchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  symbol: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mood: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export const JournalListSchema = z.array(JournalEntrySchema);

// ── Features ──
export const FeaturesSchema = z.object({
  features: z.record(z.boolean()).optional(),
}).passthrough();
export type Features = z.infer<typeof FeaturesSchema>;

// ── Firm ──
export const FirmSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).passthrough();
export type Firm = z.infer<typeof FirmSchema>;

// ── Place Order Request ──
export const PlaceOrderSchema = z.object({
  accountId: z.string(),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive().optional().nullable(),
  stopPrice: z.number().positive().optional().nullable(),
  takeProfitPrice: z.number().positive().optional().nullable(),
  stopLossPrice: z.number().positive().optional().nullable(),
  trailingStopDistance: z.number().positive().optional().nullable(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'DAY']).default('GTC'),
  idempotencyKey: z.string(),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

// ── Modify Order Request ──
export const ModifyOrderSchema = z.object({
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  takeProfitPrice: z.number().positive().optional().nullable(),
  stopLossPrice: z.number().positive().optional().nullable(),
}).passthrough();
export type ModifyOrderInput = z.infer<typeof ModifyOrderSchema>;

// ── Modify Position Request ──
export const ModifyPositionSchema = z.object({
  takeProfitPrice: z.number().positive().optional().nullable(),
  stopLossPrice: z.number().positive().optional().nullable(),
  trailingStopDistance: z.number().positive().optional().nullable(),
}).passthrough();
export type ModifyPositionInput = z.infer<typeof ModifyPositionSchema>;

// ── Paginated wrapper ──
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional(),
  }).passthrough();
}
