'use client';

import { useQuery } from '@tanstack/react-query';

interface CatalogItem {
  sku: string;
  templateId: string;
  priceUsdc: number;
  name: string;
  description: string;
  accountSize: string;
}

interface SettingsData {
  catalog: CatalogItem[];
  environment: Record<string, string>;
  adminSecurity: Record<string, string>;
}

export default function AdminSettingsPage() {
  const { data, isLoading, isError } = useQuery<SettingsData>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return <div className="text-gray-500">Loading settings...</div>;
  if (isError || !data) return <div className="text-red-400">Failed to load settings.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and challenge catalog</p>
      </div>

      {/* Challenge Catalog */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Challenge Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.catalog.map((item) => (
            <div
              key={item.sku}
              className="border border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded">
                  ${item.priceUsdc}
                </span>
              </div>
              <p className="text-xs text-gray-400">{item.description}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">SKU</span>
                  <span className="text-gray-300 font-mono">{item.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Template ID</span>
                  <span className="text-gray-300 font-mono">{item.templateId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Size</span>
                  <span className="text-gray-300">{item.accountSize}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Environment</h2>
        <div className="space-y-2 text-sm">
          {Object.entries(data.environment).map(([key, value]) => (
            <ConfigRow key={key} label={formatLabel(key)} value={value} />
          ))}
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Admin Security</h2>
        <div className="space-y-2 text-sm">
          <ConfigRow label="Admin Password" value="••••••••" />
          <ConfigRow label="JWT Secret" value="••••••••" />
          {Object.entries(data.adminSecurity).map(([key, value]) => (
            <ConfigRow key={key} label={formatLabel(key)} value={value} />
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Admin credentials are configured via environment variables (ADMIN_PASSWORD, ADMIN_JWT_SECRET).
        </p>
      </div>
    </div>
  );
}

function formatLabel(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
