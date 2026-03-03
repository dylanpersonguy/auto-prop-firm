'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useAccountStatus, useTradingStream } from '@/lib/hooks';
import {
  StatusBanner,
  MetricsCards,
  SymbolSelector,
  CandleChart,
  OrderTicket,
  PositionsTable,
  OrdersTable,
  FillsTable,
  ClosedPositionsTable,
  JournalPanel,
  PayoutPanel,
  LedgerPanel,
} from '@/components/trading';

const tabs = [
  { key: 'positions', label: 'Positions' },
  { key: 'orders', label: 'Orders' },
  { key: 'fills', label: 'Fills' },
  { key: 'closed', label: 'Closed' },
  { key: 'journal', label: 'Journal' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'ledger', label: 'Ledger' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'] as const;

export default function AccountPage() {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading, isError } = useAccount(id);
  const { data: status } = useAccountStatus(id);

  // Real-time SSE stream — injects positions/orders/fills into query cache
  const { connected: streamConnected } = useTradingStream(id);

  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [activeTab, setActiveTab] = useState<TabKey>('positions');

  if (isLoading) {
    return (
      <>
        <main className="max-w-[1920px] mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-800 rounded" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800/50 rounded-xl" />)}
            </div>
            <div className="h-[400px] bg-gray-800/50 rounded-xl" />
          </div>
        </main>
      </>
    );
  }

  if (!account || isError) {
    return (
      <>
        <main className="max-w-[1920px] mx-auto px-4 py-20">
          <div className="glass rounded-2xl p-10 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h-14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account not found</h2>
            <p className="text-gray-400 text-sm mb-6">
              The account <span className="font-mono text-gray-300">{id.slice(0, 12)}…</span> could not be loaded. It may have been deleted or you may not have access.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="max-w-[1920px] mx-auto px-4 py-4 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">
              ← Dashboard
            </Link>
            <h1 className="text-lg font-bold text-white">
              {account?.label || `Account ${id.slice(0, 8)}`}
            </h1>
            {account?.status && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                account.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' :
                account.status === 'FUNDED' ? 'bg-brand-900/50 text-brand-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {account.status}
              </span>
            )}
            {/* Real-time stream indicator */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              streamConnected ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'
            }`} title={streamConnected ? 'Live data stream connected' : 'Connecting to live data...'}>
              <span className={`w-1.5 h-1.5 rounded-full ${streamConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
              {streamConnected ? 'LIVE' : 'CONNECTING'}
            </span>
          </div>
        </div>

        {/* Risk banner */}
        <StatusBanner accountId={id} />

        {/* Metrics */}
        <MetricsCards
          accountId={id}
          dailyDD={status?.dailyLossLimit != null ? { used: status.dailyLossUsed ?? 0, limit: status.dailyLossLimit } : undefined}
          maxDD={status?.maxLossLimit != null ? { used: status.maxLossUsed ?? 0, limit: status.maxLossLimit } : undefined}
        />

        {/* Trading terminal: Chart + Order Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Chart section */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
            {/* Chart toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900/80">
              <SymbolSelector value={symbol} onChange={setSymbol} className="w-48" />
              <div className="flex items-center gap-1 ml-2">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 text-[11px] rounded transition-colors ${
                      timeframe === tf
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            {/* Chart */}
            <CandleChart symbol={symbol} timeframe={timeframe} className="h-[400px] lg:h-[480px]" />
          </div>

          {/* Order ticket */}
          <OrderTicket accountId={id} symbol={symbol} />
        </div>

        {/* Bottom tabs */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-800 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.key
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'positions' && <PositionsTable accountId={id} />}
            {activeTab === 'orders' && <OrdersTable accountId={id} />}
            {activeTab === 'fills' && <FillsTable accountId={id} />}
            {activeTab === 'closed' && <ClosedPositionsTable accountId={id} />}
            {activeTab === 'journal' && <JournalPanel accountId={id} />}
            {activeTab === 'payouts' && <PayoutPanel accountId={id} />}
            {activeTab === 'ledger' && <LedgerPanel accountId={id} />}
          </div>
        </div>
      </main>
    </>
  );
}
