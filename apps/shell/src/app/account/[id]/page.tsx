'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAccount, useAccountStatus } from '@/lib/hooks';
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
  const router = useRouter();
  const { data: account, isLoading } = useAccount(id);
  const { data: status } = useAccountStatus(id);

  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [activeTab, setActiveTab] = useState<TabKey>('positions');

  if (isLoading) {
    return (
      <>
        <Navbar />
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

  return (
    <>
      <Navbar />
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
