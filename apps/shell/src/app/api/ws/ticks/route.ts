import { NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * GET /api/ws/ticks?symbols=EURUSD,BTCUSD
 * 
 * Server-Sent Events endpoint that streams live tick data.
 * Polls PropSim every 500ms and pushes updates to connected clients.
 * 
 * Event format:
 *   event: tick
 *   data: {"symbol":"EURUSD","bid":1.0845,"ask":1.0847,"mid":1.0846,"spread":0.0002,"timestamp":"..."}
 */
export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols') || '';
  const symbols = symbolsParam ? symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : [];

  const propsimUrl = env.propsimBaseUrl || 'http://localhost:3000';
  const apiKey = env.propsimApiKey;

  let alive = true;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

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
      send('connected', { symbols, timestamp: new Date().toISOString() });

      // Track last tick values to only send changes
      const lastTicks: Record<string, string> = {};

      async function poll() {
        if (!alive) return;

        try {
          const res = await fetch(`${propsimUrl}/api/market-data/ticks`, {
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
            signal: AbortSignal.timeout(2000),
          });

          if (res.ok) {
            const json = await res.json();
            const raw = json?.data ?? json;

            // PropSim returns dict { EURUSD: {...}, ... }
            const entries = typeof raw === 'object' && !Array.isArray(raw)
              ? Object.entries(raw)
              : [];

            for (const [sym, data] of entries) {
              if (symbols.length && !symbols.includes(sym)) continue;
              const tick = normalizeTick(sym, data as Record<string, unknown>);
              // Only send if bid or ask actually changed
              const priceKey = `${tick.bid}:${tick.ask}`;
              if (lastTicks[tick.symbol] !== priceKey) {
                lastTicks[tick.symbol] = priceKey;
                send('tick', tick);
              }
            }

            // On first poll, send at least one tick per requested symbol even if "unchanged"
            if (!hasSentInitial) {
              hasSentInitial = true;
              for (const [sym, data] of entries) {
                if (symbols.length && !symbols.includes(sym)) continue;
                if (!lastTicks[sym]) {
                  const tick = normalizeTick(sym, data as Record<string, unknown>);
                  lastTicks[sym] = `${tick.bid}:${tick.ask}`;
                  send('tick', tick);
                }
              }
            }
          }
        } catch {
          // Silently continue — network hiccups shouldn't kill the stream
        }

        if (alive) {
          setTimeout(poll, 500);
        }
      }

      let hasSentInitial = false;

      // Start polling
      poll();

      // Also send heartbeat every 15s to keep connection alive
      heartbeatTimer = setInterval(() => {
        if (!alive) {
          clearInterval(heartbeatTimer);
          return;
        }
        send('heartbeat', { timestamp: new Date().toISOString() });
      }, 15_000);
    },

    cancel() {
      alive = false;
      clearInterval(heartbeatTimer);
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

function normalizeTick(symbol: string, raw: Record<string, unknown>) {
  const bid = Number(raw.bid ?? raw.bidPrice ?? 0);
  const ask = Number(raw.ask ?? raw.askPrice ?? 0);
  const mid = bid && ask ? (bid + ask) / 2 : Number(raw.mid ?? bid);
  const spread = bid && ask ? ask - bid : Number(raw.spread ?? 0);

  let timestamp = raw.timestamp ?? raw.time ?? raw.updatedAt;
  if (typeof timestamp === 'number' && timestamp > 1e12) {
    timestamp = new Date(timestamp).toISOString();
  } else if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp * 1000).toISOString();
  }

  return {
    symbol,
    bid,
    ask,
    mid,
    spread,
    timestamp: timestamp || new Date().toISOString(),
  };
}
