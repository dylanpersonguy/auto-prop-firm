import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { calculateTradeFees } from '@/lib/fees';
import { recordFirmFees } from '@/lib/fee-recorder';
import { apiBadRequest, apiError } from '@/lib/api-response';
import { randomUUID } from 'crypto';

// ── In-memory mock order book (dev/demo only) ──
const mockOrders: any[] = [];

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await propsimFetch(`/api/trading/orders${qs ? `?${qs}` : ''}`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
    // PropSim returned non-ok — propagate
    const text = await res.text().catch(() => '');
    console.error(`PropSim /api/trading/orders returned ${res.status}: ${text}`);
    return apiError(`Upstream error: ${res.statusText}`, res.status >= 500 ? 502 : res.status);
  } catch {
    console.warn('PropSim unreachable for /api/trading/orders, using local mock');
  }

  // Return local mock orders filtered by accountId if provided
  const accountId = req.nextUrl.searchParams.get('accountId');
  const filtered = accountId
    ? mockOrders.filter((o) => o.accountId === accountId)
    : mockOrders;
  return NextResponse.json(filtered);
}

/**
 * Simulate a realistic fill price with a small slippage / spread.
 */
function simulateFillPrice(symbol: string, side: string, requestedPrice?: number | null): number {
  const basePrices: Record<string, number> = {
    EURUSD: 1.0862, GBPUSD: 1.2715, USDJPY: 149.85, AUDUSD: 0.6532,
    USDCAD: 1.3612, USDCHF: 0.8795, NZDUSD: 0.6125, XAUUSD: 2048.50,
    BTCUSD: 62450.0, ETHUSD: 3380.0, NAS100: 18250.0, US30: 39100.0, SPX500: 5150.0,
  };
  const base = requestedPrice ?? basePrices[symbol] ?? 1.0;
  // Tiny random slippage ±0.02%
  const slippage = base * (Math.random() * 0.0004 - 0.0002);
  const spreadHalf = base * 0.00015; // 1.5 pip half-spread
  return +(base + slippage + (side === 'BUY' ? spreadHalf : -spreadHalf)).toFixed(
    base > 100 ? 2 : base > 10 ? 3 : 5,
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Try PropSim first
  let propsimOk = false;
  let data: any;
  try {
    const res = await propsimFetch('/api/trading/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    data = await res.json();
    propsimOk = res.ok;
    if (propsimOk) {
      // PropSim worked — record fees and return
      await recordTradeFeesIfApplicable(body, data);
      return NextResponse.json(data, { status: res.status });
    }
  } catch {
    /* PropSim unreachable — fall through to local sim */
  }

  // ── Local order simulation ──
  const now = new Date().toISOString();
  const orderId = `sim_${randomUUID().slice(0, 8)}`;
  const isMarket = body.type === 'MARKET';
  const fillPrice = isMarket
    ? simulateFillPrice(body.symbol, body.side, body.price)
    : null;

  const order: any = {
    id: orderId,
    accountId: body.accountId,
    symbol: body.symbol,
    side: body.side,
    type: body.type,
    quantity: body.quantity,
    price: body.price ?? null,
    stopPrice: body.stopPrice ?? null,
    filledQuantity: isMarket ? body.quantity : 0,
    averageFillPrice: fillPrice,
    status: isMarket ? 'FILLED' : 'PENDING',
    timeInForce: body.timeInForce ?? 'GTC',
    takeProfitPrice: body.takeProfitPrice ?? null,
    stopLossPrice: body.stopLossPrice ?? null,
    trailingStopDistance: body.trailingStopDistance ?? null,
    idempotencyKey: body.idempotencyKey ?? null,
    createdAt: now,
    updatedAt: now,
  };

  mockOrders.unshift(order);
  // Keep only last 200 orders in memory
  if (mockOrders.length > 200) mockOrders.length = 200;

  // Record fees for simulated orders too
  await recordTradeFeesIfApplicable(body, order);

  return NextResponse.json(order, { status: 201 });
}

// ── Fee recording helper ──
async function recordTradeFeesIfApplicable(body: any, data: any) {
  if (!data.id) return;
  try {
    const quantity = Number(body.quantity || 0);
    const price = Number(body.price || data.averageFillPrice || data.price || 0);
    const notionalUsdc = quantity * price;

    if (notionalUsdc > 0) {
      const notionalBaseUnits = BigInt(Math.floor(notionalUsdc * 1_000_000));
      const fees = calculateTradeFees(notionalBaseUnits);

      await recordFirmFees([
        {
          category: 'TRADE_COMMISSION',
          amountBaseUnits: fees.commission,
          sourceType: 'TRADE',
          sourceId: data.id,
          description: `Trade commission on order ${data.id} (${body.symbol} ${body.side} ${quantity}@${price})`,
        },
        {
          category: 'SPREAD_MARKUP',
          amountBaseUnits: fees.spread,
          sourceType: 'TRADE',
          sourceId: data.id,
          description: `Spread markup on order ${data.id} (${body.symbol} ${body.side} ${quantity}@${price})`,
        },
      ]);
    }
  } catch (e) {
    console.error('Failed to record trade fees:', e);
  }
}
