/* ── Dashboard helper functions ── */

export function fmt(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function pct(v: number | null | undefined, d = 2) {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(d) + '%';
}

export function timeAgo(date: string | undefined) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const statusConfig: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
  ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  PASSED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', glow: 'shadow-blue-500/20' },
  FUNDED: { bg: 'bg-brand-500/10', text: 'text-brand-400', dot: 'bg-brand-400', glow: 'shadow-brand-500/20' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', glow: 'shadow-red-500/20' },
  BREACHED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', glow: 'shadow-red-500/20' },
};
