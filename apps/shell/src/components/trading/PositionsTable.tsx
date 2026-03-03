'use client';

import { useState } from 'react';
import { usePositions, useClosePosition, useCloseAllPositions, useBreakevenPosition, useModifyPosition } from '@/lib/hooks';
import type { Position } from '@/lib/schemas';

function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function PnlCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-500">—</span>;
  const color = value >= 0 ? 'text-green-400' : 'text-red-400';
  return <span className={`${color} tabular-nums`}>{value >= 0 ? '+' : ''}{fmt(value)}</span>;
}

interface Props {
  accountId: string;
  className?: string;
}

export function PositionsTable({ accountId, className = '' }: Props) {
  const { data: positions = [], isLoading } = usePositions(accountId);
  const closePos = useClosePosition();
  const closeAll = useCloseAllPositions();
  const breakeven = useBreakevenPosition();
  const modifyPos = useModifyPosition();
  const [editing, setEditing] = useState<string | null>(null);
  const [tpInput, setTpInput] = useState('');
  const [slInput, setSlInput] = useState('');

  const startEdit = (p: Position) => {
    setEditing(p.id);
    setTpInput(p.takeProfitPrice?.toString() ?? '');
    setSlInput(p.stopLossPrice?.toString() ?? '');
  };

  const saveEdit = (id: string) => {
    modifyPos.mutate({
      id,
      input: {
        takeProfitPrice: tpInput ? parseFloat(tpInput) : null,
        stopLossPrice: slInput ? parseFloat(slInput) : null,
      },
    });
    setEditing(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Positions <span className="text-gray-500">({positions.length})</span>
        </h3>
        {positions.length > 0 && (
          <button
            onClick={() => closeAll.mutate({ accountId })}
            disabled={closeAll.isPending}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            Close All
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              <th className="pb-2 pr-3 font-medium">Symbol</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
              <th className="pb-2 pr-3 font-medium text-right">Entry</th>
              <th className="pb-2 pr-3 font-medium text-right">Current</th>
              <th className="pb-2 pr-3 font-medium text-right">P/L</th>
              <th className="pb-2 pr-3 font-medium text-right">TP</th>
              <th className="pb-2 pr-3 font-medium text-right">SL</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="py-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && positions.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-center text-gray-500">No open positions</td></tr>
            )}
            {positions.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 pr-3 font-mono text-white">{p.symbol}</td>
                <td className={`py-2 pr-3 font-semibold ${p.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {p.side}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.quantity)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.entryPrice, 5)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.currentPrice ?? p.markPrice, 5)}</td>
                <td className="py-2 pr-3 text-right"><PnlCell value={p.unrealizedPnl} /></td>
                <td className="py-2 pr-3 text-right">
                  {editing === p.id ? (
                    <input
                      value={tpInput}
                      onChange={(e) => setTpInput(e.target.value)}
                      className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs tabular-nums text-white"
                    />
                  ) : (
                    <span className="tabular-nums text-gray-400">{p.takeProfitPrice ? fmt(p.takeProfitPrice, 5) : '—'}</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">
                  {editing === p.id ? (
                    <input
                      value={slInput}
                      onChange={(e) => setSlInput(e.target.value)}
                      className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs tabular-nums text-white"
                    />
                  ) : (
                    <span className="tabular-nums text-gray-400">{p.stopLossPrice ? fmt(p.stopLossPrice, 5) : '—'}</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editing === p.id ? (
                      <>
                        <button onClick={() => saveEdit(p.id)} className="text-brand-400 hover:text-brand-300 px-1">Save</button>
                        <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 px-1">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-white px-1" title="Edit TP/SL">✏</button>
                        <button onClick={() => breakeven.mutate(p.id)} className="text-yellow-400 hover:text-yellow-300 px-1" title="Breakeven">BE</button>
                        <button
                          onClick={() => closePos.mutate({ id: p.id })}
                          disabled={closePos.isPending}
                          className="text-red-400 hover:text-red-300 px-1"
                          title="Close"
                        >
                          ✕
                        </button>
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
