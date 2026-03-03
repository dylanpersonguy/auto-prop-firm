'use client';

import { useState, useCallback } from 'react';
import { usePlaceOrder, useRealtimeTick } from '@/lib/hooks';
import { PlaceOrderSchema } from '@/lib/schemas';

interface Props {
  accountId: string;
  symbol: string;
  className?: string;
}

type Side = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
type TIF = 'GTC' | 'IOC' | 'FOK' | 'DAY';

const orderTypes: OrderType[] = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];
const tifOptions: TIF[] = ['GTC', 'IOC', 'FOK', 'DAY'];

function numOrNull(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function OrderTicket({ accountId, symbol, className = '' }: Props) {
  const [side, setSide] = useState<Side>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState('0.01');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [trailing, setTrailing] = useState('');
  const [tif, setTif] = useState<TIF>('GTC');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tick = useRealtimeTick(symbol);
  const placeOrder = usePlaceOrder();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const payload = {
        accountId,
        symbol,
        side,
        type,
        quantity: parseFloat(quantity),
        price: type === 'LIMIT' || type === 'STOP_LIMIT' ? numOrNull(price) : null,
        stopPrice: type === 'STOP' || type === 'STOP_LIMIT' ? numOrNull(stopPrice) : null,
        takeProfitPrice: numOrNull(tp),
        stopLossPrice: numOrNull(sl),
        trailingStopDistance: numOrNull(trailing),
        timeInForce: tif,
        idempotencyKey: crypto.randomUUID(),
      };

      const result = PlaceOrderSchema.safeParse(payload);
      if (!result.success) {
        setError(result.error.issues.map((i) => i.message).join(', '));
        return;
      }

      placeOrder.mutate(result.data, {
        onError: (err: any) => setError(err.message || 'Order failed'),
      });
    },
    [accountId, symbol, side, type, quantity, price, stopPrice, tp, sl, trailing, tif, placeOrder],
  );

  const needsPrice = type === 'LIMIT' || type === 'STOP_LIMIT';
  const needsStop = type === 'STOP' || type === 'STOP_LIMIT';

  return (
    <form onSubmit={handleSubmit} className={`bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3 ${className}`}>
      {/* Side toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            side === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            side === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Price display */}
      {tick && (
        <div className="flex justify-between text-xs tabular-nums">
          <span className="text-green-400">Bid {tick.bid.toFixed(5)}</span>
          <span className="text-gray-500">Spread {tick.spread?.toFixed(1) ?? '—'}</span>
          <span className="text-red-400">Ask {tick.ask.toFixed(5)}</span>
        </div>
      )}

      {/* Order type */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Order Type</label>
        <div className="grid grid-cols-4 gap-1">
          {orderTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`text-[11px] py-1.5 rounded transition-colors ${
                type === t ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Quantity (lots)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {/* Price / Stop price */}
      {needsPrice && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Price</label>
          <input
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={tick ? (side === 'BUY' ? tick.ask.toFixed(5) : tick.bid.toFixed(5)) : '0.00'}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      )}
      {needsStop && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Stop Price</label>
          <input
            type="number"
            step="any"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      )}

      {/* Advanced: TP/SL/Trailing/TIF */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Advanced
      </button>

      {showAdvanced && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">Take Profit</label>
              <input
                type="number"
                step="any"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                placeholder="TP price"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">Stop Loss</label>
              <input
                type="number"
                step="any"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                placeholder="SL price"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">Trailing Stop</label>
              <input
                type="number"
                step="any"
                value={trailing}
                onChange={(e) => setTrailing(e.target.value)}
                placeholder="Distance"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs tabular-nums text-white focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">Time In Force</label>
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value as TIF)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:ring-brand-500 focus:border-brand-500"
              >
                {tifOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {(error || placeOrder.error) && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-900/40 rounded px-2 py-1.5">
          {error || (placeOrder.error as any)?.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={placeOrder.isPending || !symbol}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
          side === 'BUY'
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {placeOrder.isPending
          ? 'Placing…'
          : `${side} ${quantity} ${symbol || '—'} ${type}`}
      </button>

      {placeOrder.isSuccess && (
        <div className="text-green-400 text-xs text-center">Order placed ✓</div>
      )}
    </form>
  );
}
