/**
 * Typed API client for the Shell BFF.
 * All browser-side code calls these functions — never PropSim directly.
 * Each function parses the response with Zod and returns typed data.
 */
import {
  AccountListSchema, AccountSchema, MetricsSchema, AccountStatusSchema,
  EquityListSchema, LedgerListSchema, AccountStatsSchema,
  OrderSchema, OrderListSchema, PositionSchema, PositionListSchema,
  FillListSchema, ClosedPositionListSchema,
  SymbolListSchema, TickListSchema, TickSchema, CandleListSchema,
  PayoutCalcSchema, PayoutListSchema, PayoutSchema,
  JournalEntrySchema, JournalListSchema,
  FeaturesSchema, FirmSchema, ErrorResponseSchema,
  type Account, type Metrics, type AccountStatus, type EquityPoint,
  type LedgerEntry, type AccountStats,
  type Order, type Position, type Fill, type ClosedPosition,
  type SymbolInfo, type Tick, type Candle,
  type PayoutCalc, type Payout, type JournalEntry,
  type PlaceOrderInput, type ModifyOrderInput, type ModifyPositionInput,
  type ErrorResponse,
} from './schemas';

// ── Helpers ──

class ApiError extends Error {
  status: number;
  code?: string;
  correlationId?: string;
  constructor(msg: string, status: number, code?: string, correlationId?: string) {
    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
  }
}

async function handleResponse<T>(res: Response, schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: any } }): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    // Try to parse as ErrorResponse
    const err = ErrorResponseSchema.safeParse(json);
    if (err.success) {
      throw new ApiError(
        err.data.error.message,
        res.status,
        err.data.error.code,
        err.data.error.correlationId,
      );
    }
    throw new ApiError(
      json.error?.message || json.message || `HTTP ${res.status}`,
      res.status,
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.warn('Zod parse warning:', parsed.error?.issues);
    // Return raw data on parse failure (passthrough-safe)
    return json as T;
  }
  return parsed.data!;
}

async function handleArrayResponse<T>(res: Response, schema: { safeParse: (d: unknown) => { success: boolean; data?: T[]; error?: any } }): Promise<T[]> {
  const json = await res.json();

  if (!res.ok) {
    const err = ErrorResponseSchema.safeParse(json);
    if (err.success) {
      throw new ApiError(err.data.error.message, res.status, err.data.error.code, err.data.error.correlationId);
    }
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }

  // Handle both array and {data: array} shapes
  const data = Array.isArray(json) ? json : (json.data ?? json.entries ?? json);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.warn('Zod array parse warning:', parsed.error?.issues);
    return (Array.isArray(data) ? data : []) as T[];
  }
  return parsed.data!;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── Accounts ──

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/accounts');
  return handleArrayResponse<Account>(res, AccountListSchema);
}

export async function fetchAccount(id: string): Promise<Account> {
  const res = await fetch(`/api/accounts/${id}`);
  return handleResponse(res, AccountSchema);
}

export async function fetchMetrics(id: string): Promise<Metrics> {
  const res = await fetch(`/api/accounts/${id}/metrics`);
  return handleResponse(res, MetricsSchema);
}

export async function fetchAccountStatus(accountId: string): Promise<AccountStatus> {
  const res = await fetch(`/api/trading/account-status${qs({ accountId })}`);
  return handleResponse(res, AccountStatusSchema);
}

export async function fetchEquity(id: string, limit?: number): Promise<EquityPoint[]> {
  const res = await fetch(`/api/accounts/${id}/equity${qs({ limit })}`);
  return handleArrayResponse<EquityPoint>(res, EquityListSchema);
}

export async function fetchLedger(id: string, page?: number, pageSize?: number): Promise<LedgerEntry[]> {
  const res = await fetch(`/api/accounts/${id}/ledger${qs({ page, pageSize })}`);
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  const entries = json.entries ?? json.data ?? (Array.isArray(json) ? json : []);
  return entries as LedgerEntry[];
}

export async function fetchAccountStats(id: string): Promise<AccountStats> {
  const res = await fetch(`/api/accounts/${id}/stats`);
  return handleResponse(res, AccountStatsSchema);
}

// ── Trading: Orders ──

export async function fetchOrders(accountId: string, status?: string): Promise<Order[]> {
  const res = await fetch(`/api/trading/orders${qs({ accountId, status })}`);
  return handleArrayResponse<Order>(res, OrderListSchema);
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const res = await fetch('/api/trading/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res, OrderSchema);
}

export async function modifyOrder(id: string, input: ModifyOrderInput): Promise<Order> {
  const res = await fetch(`/api/trading/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res, OrderSchema);
}

export async function cancelOrder(id: string): Promise<void> {
  const res = await fetch(`/api/trading/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

export async function cancelAllOrders(accountId: string, reason?: string): Promise<void> {
  const res = await fetch('/api/trading/orders/cancel-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, reason: reason || 'User requested cancel-all' }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

// ── Trading: Positions ──

export async function fetchPositions(accountId: string, status?: string): Promise<Position[]> {
  const res = await fetch(`/api/trading/positions${qs({ accountId, status })}`);
  return handleArrayResponse<Position>(res, PositionListSchema);
}

export async function modifyPosition(id: string, input: ModifyPositionInput): Promise<Position> {
  const res = await fetch(`/api/trading/positions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res, PositionSchema);
}

export async function closePosition(id: string, quantity?: number): Promise<void> {
  const res = await fetch(`/api/trading/positions/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quantity ? { quantity } : {}),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

export async function closeAllPositions(accountId: string, reason?: string): Promise<void> {
  const res = await fetch('/api/trading/positions/close-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, reason: reason || 'User requested close-all' }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

export async function breakevenPosition(id: string): Promise<void> {
  const res = await fetch(`/api/trading/positions/${id}/breakeven`, { method: 'POST' });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

// ── Trading: Fills / Closed ──

export async function fetchFills(accountId: string, page?: number, pageSize?: number): Promise<Fill[]> {
  const res = await fetch(`/api/trading/fills${qs({ accountId, page, pageSize })}`);
  return handleArrayResponse<Fill>(res, FillListSchema);
}

export async function fetchClosedPositions(accountId: string, page?: number, pageSize?: number): Promise<ClosedPosition[]> {
  const res = await fetch(`/api/trading/closed-positions${qs({ accountId, page, pageSize })}`);
  return handleArrayResponse<ClosedPosition>(res, ClosedPositionListSchema);
}

// ── Market Data ──

export async function fetchSymbols(): Promise<SymbolInfo[]> {
  const res = await fetch('/api/market/symbols');
  return handleArrayResponse<SymbolInfo>(res, SymbolListSchema);
}

export async function fetchTicks(): Promise<Tick[]> {
  const res = await fetch('/api/market/ticks');
  return handleArrayResponse<Tick>(res, TickListSchema);
}

export async function fetchTick(symbol: string): Promise<Tick> {
  const res = await fetch(`/api/market/ticks/${encodeURIComponent(symbol)}`);
  return handleResponse(res, TickSchema);
}

export async function fetchCandles(symbol: string, timeframe?: string, limit?: number): Promise<Candle[]> {
  const res = await fetch(`/api/market/candles/${encodeURIComponent(symbol)}${qs({ timeframe, limit })}`);
  return handleArrayResponse<Candle>(res, CandleListSchema);
}

// ── Journal ──

export async function fetchJournal(accountId: string, opts?: { limit?: number; offset?: number; symbol?: string }): Promise<JournalEntry[]> {
  const res = await fetch(`/api/trading/journal${qs({ accountId, ...opts })}`);
  return handleArrayResponse<JournalEntry>(res, JournalListSchema);
}

export async function createJournalEntry(data: { accountId: string; symbol?: string; title?: string; content?: string; tags?: string[]; mood?: string }): Promise<JournalEntry> {
  const res = await fetch('/api/trading/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, JournalEntrySchema);
}

export async function updateJournalEntry(id: string, data: Partial<{ title: string; content: string; tags: string[]; mood: string; symbol: string }>): Promise<JournalEntry> {
  const res = await fetch(`/api/trading/journal/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, JournalEntrySchema);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(`/api/trading/journal/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json();
    throw new ApiError(json.error?.message || `HTTP ${res.status}`, res.status);
  }
}

// ── Payouts ──

export async function fetchPayoutCalc(accountId: string): Promise<PayoutCalc> {
  const res = await fetch(`/api/accounts/${accountId}/payout/calc`);
  return handleResponse(res, PayoutCalcSchema);
}

export async function requestPayout(accountId: string, idempotencyKey: string): Promise<Payout> {
  const res = await fetch(`/api/accounts/${accountId}/payout/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idempotencyKey }),
  });
  return handleResponse(res, PayoutSchema);
}

export async function fetchPayoutHistory(accountId: string): Promise<Payout[]> {
  const res = await fetch(`/api/accounts/${accountId}/payout/history`);
  return handleArrayResponse<Payout>(res, PayoutListSchema);
}

export async function fetchAllPayouts(): Promise<Payout[]> {
  const res = await fetch('/api/payouts');
  return handleArrayResponse<Payout>(res, PayoutListSchema);
}

// ── System ──

export async function fetchFeatures() {
  const res = await fetch('/api/features');
  return handleResponse(res, FeaturesSchema);
}

export async function fetchFirm() {
  const res = await fetch('/api/firm');
  return handleResponse(res, FirmSchema);
}

// ── Re-export error class ──
export { ApiError };
