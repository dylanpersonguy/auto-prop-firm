'use client';

import { useState } from 'react';
import { useOrders, useCancelOrder, useCancelAllOrders, useModifyOrder } from '@/lib/hooks';
import type { Order } from '@/lib/schemas';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

interface Props {
  accountId: string;
  className?: string;
}

export function OrdersTable({ accountId, className = '' }: Props) {
  const { data: orders = [], isLoading } = useOrders(accountId);
  const cancelOrder = useCancelOrder();
  const cancelAll = useCancelAllOrders();
  const modifyOrder = useModifyOrder();
  const [editing, setEditing] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');

  const startEdit = (o: Order) => {
    setEditing(o.id);
    setPriceInput(o.price?.toString() ?? '');
    setQtyInput(o.quantity.toString());
  };

  const saveEdit = (id: string) => {
    const input: Record<string, number> = {};
    if (priceInput) input.price = parseFloat(priceInput);
    if (qtyInput) input.quantity = parseFloat(qtyInput);
    modifyOrder.mutate({ id, input });
    setEditing(null);
  };

  const pending = orders.filter((o) => ['PENDING', 'NEW', 'OPEN', 'PARTIALLY_FILLED'].includes(o.status));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Orders <span className="text-gray-500">({pending.length})</span>
        </h3>
        {pending.length > 0 && (
          <button
            onClick={() => cancelAll.mutate({ accountId })}
            disabled={cancelAll.isPending}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            Cancel All
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              <th className="pb-2 pr-3 font-medium">Symbol</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
              <th className="pb-2 pr-3 font-medium text-right">Price</th>
              <th className="pb-2 pr-3 font-medium text-right">Filled</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">TIF</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="py-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-center text-gray-500">No orders</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 pr-3 font-mono text-white">{o.symbol}</td>
                <td className={`py-2 pr-3 font-semibold ${o.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {o.side}
                </td>
                <td className="py-2 pr-3 text-gray-400">{o.type}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {editing === o.id ? (
                    <input
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs tabular-nums text-white"
                    />
                  ) : (
                    fmt(o.quantity)
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {editing === o.id ? (
                    <input
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs tabular-nums text-white"
                    />
                  ) : (
                    fmt(o.price, 5)
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-gray-400">
                  {o.filledQuantity != null ? fmt(o.filledQuantity) : '—'}
                </td>
                <td className="py-2 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    o.status === 'FILLED' ? 'bg-green-900/40 text-green-400' :
                    o.status === 'CANCELLED' ? 'bg-gray-800 text-gray-500' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-500">{o.timeInForce ?? '—'}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editing === o.id ? (
                      <>
                        <button onClick={() => saveEdit(o.id)} className="text-brand-400 hover:text-brand-300 px-1">Save</button>
                        <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 px-1">✕</button>
                      </>
                    ) : (
                      <>
                        {['PENDING', 'NEW', 'OPEN'].includes(o.status) && (
                          <>
                            <button onClick={() => startEdit(o)} className="text-gray-400 hover:text-white px-1" title="Edit">✏</button>
                            <button
                              onClick={() => cancelOrder.mutate(o.id)}
                              disabled={cancelOrder.isPending}
                              className="text-red-400 hover:text-red-300 px-1"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
