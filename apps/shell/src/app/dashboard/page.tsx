'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAccounts, useAllPayouts, useTicks, useEquity } from '@/lib/hooks';

/* ── Helpers ── */
function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function pct(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(d) + '%';
}

function timeAgo(date: string | undefined) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Animated counter ── */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, duration = 1200 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/* ── Mini sparkline ── */
function Sparkline({ data, color = '#22c55e', className = '' }: { data: number[]; color?: string; className?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-20 h-8 ${className}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#sg-${color.replace('#', '')})`}
        stroke="none"
      />
    </svg>
  );
}

/* ── Progress ring ── */
function ProgressRing({ progress, size = 48, strokeWidth = 3, color = '#22c55e' }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
    </svg>
  );
}

/* ── Status config ── */
const statusConfig: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
  ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  PASSED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', glow: 'shadow-blue-500/20' },
  FUNDED: { bg: 'bg-brand-500/10', text: 'text-brand-400', dot: 'bg-brand-400', glow: 'shadow-brand-500/20' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', glow: 'shadow-red-500/20' },
  BREACHED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', glow: 'shadow-red-500/20' },
};

/* ── Stagger animation wrapper ── */
function StaggerIn({ children, index, className = '' }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <div
      className={`opacity-0 animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

/* ── Account Card (extracted to avoid hooks-in-map violation) ── */
function AccountCard({ account, idx, totalEquity }: {
  account: any; idx: number; totalEquity: number;
}) {
  const pnl = (account.equity ?? 0) - (account.startingBalance ?? account.balance ?? 0);
  const pnlPct = (account.startingBalance ?? account.balance ?? 0) > 0
    ? (pnl / (account.startingBalance ?? account.balance ?? 1)) * 100
    : 0;
  const sc = statusConfig[account.status] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', glow: '' };

  /* Real equity history for sparkline */
  const { data: equityHistory = [] } = useEquity(account.id, 24);
  const acctSparkData = useMemo(() => {
    if (equityHistory.length >= 2) {
      return equityHistory.map((p: any) => p.equity);
    }
    // Fallback: just show starting → current as a simple 2-point line
    const start = account.startingBalance ?? account.balance ?? 0;
    const end = account.equity ?? start;
    return [start, end];
  }, [equityHistory, account.startingBalance, account.balance, account.equity]);

  const equityRatio = totalEquity > 0 ? (account.equity ?? 0) / totalEquity : 0;

  const ddUsed = account.equity != null && account.startingBalance
    ? Math.max(0, (account.startingBalance - account.equity) / account.startingBalance)
    : 0;

  return (
    <Link
      key={account.id}
      href={`/account/${account.id}`}
      className="group glass rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.01]"
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors text-sm">
            {account.label || account.id.slice(0, 8)}
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {account.status}
        </span>
      </div>

      {/* Equity + Sparkline */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Equity</div>
          <div className="text-lg font-bold text-white tabular-nums">{fmt(account.equity)}</div>
        </div>
        <Sparkline data={acctSparkData} color={pnl >= 0 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Balance</div>
          <div className="text-xs font-medium text-gray-200 tabular-nums">{fmt(account.balance)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">P/L</div>
          <div className={`text-xs font-medium tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{fmt(pnl)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Return</div>
          <div className={`text-xs font-medium tabular-nums ${pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pct(pnlPct)}
          </div>
        </div>
      </div>

      {/* DD bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-gray-500">Drawdown</span>
          <span className="text-gray-400 tabular-nums">{(ddUsed * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              ddUsed > 0.08 ? 'bg-red-500' : ddUsed > 0.04 ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(ddUsed * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Phase + Open link */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        {account.phase ? (
          <span className="text-[10px] text-gray-500">Phase: <span className="text-gray-400">{account.phase}</span></span>
        ) : (
          <span className="text-[10px] text-gray-600">{timeAgo(account.createdAt)}</span>
        )}
        <span className="text-[11px] text-gray-500 group-hover:text-brand-400 flex items-center gap-1 transition-colors">
          Open Terminal
          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  DASHBOARD PAGE
 * ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: payouts = [] } = useAllPayouts();
  const { data: ticks = [] } = useTicks();

  /* ── Derived stats ── */
  const totalEquity = useMemo(() => accounts.reduce((s, a) => s + (a.equity ?? 0), 0), [accounts]);
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + (a.balance ?? 0), 0), [accounts]);
  const activeCount = useMemo(() => accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'FUNDED').length, [accounts]);
  const totalPaid = useMemo(
    () => payouts.filter((p) => p.status === 'COMPLETED' || p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    [payouts],
  );
  const totalPnl = useMemo(
    () => accounts.reduce((s, a) => s + ((a.equity ?? 0) - (a.startingBalance ?? a.balance ?? 0)), 0),
    [accounts],
  );
  const pnlPercent = useMemo(() => {
    const startBal = accounts.reduce((s, a) => s + (a.startingBalance ?? a.balance ?? 0), 0);
    return startBal > 0 ? (totalPnl / startBal) * 100 : 0;
  }, [accounts, totalPnl]);

  /* Generate sparkline from real equity data of first account, or simple start→end line */
  const firstAccountId = accounts.length > 0 ? accounts[0].id : '';
  const { data: topEquityHistory = [] } = useEquity(firstAccountId, 24);
  const sparkData = useMemo(() => {
    if (topEquityHistory.length >= 2) {
      return topEquityHistory.map((p: any) => p.equity);
    }
    if (accounts.length === 0) return [];
    return [totalBalance, totalEquity];
  }, [topEquityHistory, accounts.length, totalBalance, totalEquity]);

  /* Market watchlist (top 6 tickers) — track initial prices for change % */
  const watchlist = useMemo(() => ticks.slice(0, 6), [ticks]);
  const initialPricesRef = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const t of ticks) {
      if (t.symbol && t.mid && !(t.symbol in initialPricesRef.current)) {
        initialPricesRef.current[t.symbol] = t.mid;
      }
    }
  }, [ticks]);

  return (
    <>
      {/* Mesh gradient background */}
      <div className="mesh-gradient" />
      <div className="noise-overlay" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* ── Header ── */}
        <StaggerIn index={0}>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-2">Your trading performance at a glance.</p>
          </div>
        </StaggerIn>

        {/* ── Hero Stat Cards ── */}
        <StaggerIn index={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Equity */}
            <div className="glass-strong rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total Equity</span>
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                <AnimatedNumber value={totalEquity} prefix="$" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Sparkline data={sparkData} color="#22c55e" />
              </div>
            </div>

            {/* Total Balance */}
            <div className="glass-strong rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total Balance</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                <AnimatedNumber value={totalBalance} prefix="$" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>

            {/* P/L */}
            <div className="glass-strong rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Unrealized P/L</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <svg className={`w-4 h-4 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={totalPnl >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
                  </svg>
                </div>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}<AnimatedNumber value={totalPnl} prefix="$" />
              </div>
              <p className={`text-xs mt-2 tabular-nums ${pnlPercent >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                {pct(pnlPercent)} all time
              </p>
            </div>

            {/* Payouts */}
            <div className="glass-strong rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total Payouts</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-400 tabular-nums">
                <AnimatedNumber value={totalPaid} prefix="$" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{payouts.length} payout{payouts.length !== 1 ? 's' : ''} processed</p>
            </div>
          </div>
        </StaggerIn>

        {/* ── Portfolio Overview + Market Watch row ── */}
        <StaggerIn index={2}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Portfolio Allocation */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white">Portfolio Overview</h2>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{activeCount} Active</span>
              </div>
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">No accounts yet</p>
                  <Link href="/challenges" className="text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors">
                    Get Your First Challenge →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => {
                    const pnl = (account.equity ?? 0) - (account.startingBalance ?? account.balance ?? 0);
                    const pnlPct = (account.startingBalance ?? account.balance ?? 0) > 0
                      ? (pnl / (account.startingBalance ?? account.balance ?? 1)) * 100
                      : 0;
                    const equityRatio = totalEquity > 0 ? (account.equity ?? 0) / totalEquity : 0;
                    const sc = statusConfig[account.status] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', glow: '' };

                    return (
                      <Link
                        key={account.id}
                        href={`/account/${account.id}`}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300"
                      >
                        {/* Progress ring showing portfolio weight */}
                        <div className="relative flex-shrink-0">
                          <ProgressRing progress={equityRatio} size={44} color={pnl >= 0 ? '#22c55e' : '#ef4444'} />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-300 tabular-nums">
                            {(equityRatio * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Account info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                              {account.label || account.id.slice(0, 8)}
                            </h3>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                              {account.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">Bal: <span className="text-gray-300 tabular-nums">{fmt(account.balance)}</span></span>
                            <span className="text-xs text-gray-500">Eq: <span className="text-gray-300 tabular-nums">{fmt(account.equity)}</span></span>
                            {account.phase && <span className="text-xs text-gray-600">{account.phase}</span>}
                          </div>
                        </div>

                        {/* P/L */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                          </div>
                          <div className={`text-[10px] tabular-nums ${pnlPct >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                            {pct(pnlPct)}
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Market Watchlist */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white">Market Watch</h2>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
              </div>
              {watchlist.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">Loading market data…</p>
              ) : (
                <div className="space-y-2">
                  {watchlist.map((t) => {
                    const initPrice = initialPricesRef.current[t.symbol];
                    const currentPrice = t.mid ?? t.bid;
                    const change = initPrice && currentPrice ? ((currentPrice - initPrice) / initPrice) * 100 : 0;
                    return (
                      <div key={t.symbol} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div>
                          <span className="text-xs font-semibold text-white">{t.symbol}</span>
                          <div className="text-[10px] text-gray-500 tabular-nums">{t.spread?.toFixed(t.bid > 100 ? 1 : 4)} spread</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-gray-200 tabular-nums">
                            {(t.mid ?? t.bid)?.toFixed(t.bid > 100 ? 2 : 5)}
                          </span>
                          <div className={`text-[10px] tabular-nums ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </StaggerIn>

        {/* ── Account Cards Grid ── */}
        {accounts.length > 0 && (
          <StaggerIn index={3}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Your Accounts</h2>
                <Link href="/challenges" className="text-[11px] text-brand-500 hover:text-brand-400 transition-colors font-medium">
                  + New Challenge
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account, idx) => (
                  <AccountCard key={account.id} account={account} idx={idx} totalEquity={totalEquity} />
                ))}

                {/* Add account card */}
                <Link
                  href="/challenges"
                  className="group glass rounded-2xl p-5 flex flex-col items-center justify-center min-h-[220px] hover:border-brand-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-brand-400 transition-colors">New Challenge</span>
                  <span className="text-[10px] text-gray-600 mt-1">Start a new evaluation</span>
                </Link>
              </div>
            </div>
          </StaggerIn>
        )}

        {/* ── Quick Stats Footer ── */}
        <StaggerIn index={4}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Accounts', value: accounts.length.toString(), icon: '📊' },
              { label: 'Active', value: activeCount.toString(), icon: '🟢' },
              { label: 'Payouts', value: payouts.length.toString(), icon: '💰' },
              { label: 'Markets', value: watchlist.length.toString(), icon: '📈' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <div className="text-lg font-bold text-white tabular-nums">{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </StaggerIn>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-60 glass rounded-2xl" />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
