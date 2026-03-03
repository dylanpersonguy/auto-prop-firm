import { NextRequest } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

/**
 * GET /api/ws/trading?accountId=xxx
 *
 * Server-Sent Events endpoint that streams live trading data:
 *   - positions (open/closed)
 *   - orders
 *   - fills
 *   - account status (equity, balance, drawdown)
 *
 * Polls PropSim every 1s for positions/orders and 2s for fills.
 * Only pushes events when data changes (hash-based diffing).
 *
 * Events:
 *   event: positions
 *   data: [...]
 *
 *   event: orders
 *   data: [...]
 *
 *   event: fills
 *   data: [...]
 *
 *   event: accountStatus
 *   data: { equity, balance, ... }
 */
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('accountId');

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId query param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let alive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          alive = false;
        }
      }

      // Send initial connection event
      send('connected', { accountId, timestamp: new Date().toISOString() });

      // Track previous snapshots via simple JSON hash to avoid redundant pushes
      let lastPositions = '';
      let lastOrders = '';
      let lastFills = '';
      let lastStatus = '';

      async function fetchAndPush(
        path: string,
        event: string,
        lastHash: string,
      ): Promise<string> {
        try {
          const res = await propsimFetch(path, {
            signal: AbortSignal.timeout(3000),
          });
          if (!res.ok) return lastHash;
          const json = await res.json();
          const data = json?.data ?? json;
          const hash = JSON.stringify(data);
          if (hash !== lastHash) {
            send(event, data);
            return hash;
          }
        } catch {
          // Network hiccup — keep last hash, no push
        }
        return lastHash;
      }

      // ── Fast loop: positions + orders (1s) ──
      async function pollFast() {
        if (!alive) return;

        lastPositions = await fetchAndPush(
          `/api/trading/positions?accountId=${accountId}`,
          'positions',
          lastPositions,
        );
        lastOrders = await fetchAndPush(
          `/api/trading/orders?accountId=${accountId}&status=OPEN`,
          'orders',
          lastOrders,
        );
        lastStatus = await fetchAndPush(
          `/api/trading/account-status?accountId=${accountId}`,
          'accountStatus',
          lastStatus,
        );

        if (alive) setTimeout(pollFast, 1000);
      }

      // ── Slow loop: fills (3s) ──
      async function pollSlow() {
        if (!alive) return;

        lastFills = await fetchAndPush(
          `/api/trading/fills?accountId=${accountId}&pageSize=50`,
          'fills',
          lastFills,
        );

        if (alive) setTimeout(pollSlow, 3000);
      }

      // Start polling loops
      pollFast();
      pollSlow();

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (!alive) {
          clearInterval(heartbeat);
          return;
        }
        send('heartbeat', { timestamp: new Date().toISOString() });
      }, 15_000);
    },

    cancel() {
      alive = false;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
