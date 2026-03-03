'use client';

import { useAccountStatus } from '@/lib/hooks';
import type { AccountStatus } from '@/lib/schemas';

const risk: Record<string, { bg: string; text: string; label: string }> = {
  OK: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Normal' },
  WARNING: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'Warning' },
  BREACHED: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Breached' },
};

function Banner({ status }: { status: AccountStatus }) {
  const r = risk[status.riskStatus ?? ''] ?? risk.OK;
  const hasViolations = (status.violations?.length ?? 0) > 0;

  if (!hasViolations && status.riskStatus === 'OK') return null;

  return (
    <div className={`${r.bg} border border-current/20 rounded-lg px-4 py-3 ${r.text}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex h-2 w-2 rounded-full bg-current" />
        <span className="font-semibold text-sm">Risk: {r.label}</span>
        {status.violations?.map((v, i) => (
          <span key={i} className="text-xs opacity-80">
            {v.message ?? v.rule}
          </span>
        ))}

        {status.dailyLossLimit != null && (
          <span className="ml-auto text-xs tabular-nums">
            Daily DD: ${(status.dailyLossUsed ?? 0).toFixed(2)} / ${status.dailyLossLimit.toFixed(2)}
          </span>
        )}
        {status.maxLossLimit != null && (
          <span className="text-xs tabular-nums">
            Max DD: ${(status.maxLossUsed ?? 0).toFixed(2)} / ${status.maxLossLimit.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatusBanner({ accountId }: { accountId: string }) {
  const { data } = useAccountStatus(accountId);
  if (!data) return null;
  return <Banner status={data} />;
}
