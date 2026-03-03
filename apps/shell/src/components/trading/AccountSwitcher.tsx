'use client';

import { useState, createContext, useContext } from 'react';
import { useAccounts } from '@/lib/hooks';
import type { Account } from '@/lib/schemas';

type Ctx = { accountId: string; setAccountId: (id: string) => void; accounts: Account[] };
const AccountCtx = createContext<Ctx>({ accountId: '', setAccountId: () => {}, accounts: [] });
export const useSelectedAccount = () => useContext(AccountCtx);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState('');

  const activeId = accountId || accounts[0]?.id || '';

  return (
    <AccountCtx.Provider value={{ accountId: activeId, setAccountId, accounts }}>
      {children}
    </AccountCtx.Provider>
  );
}

export function AccountSwitcher({ className = '' }: { className?: string }) {
  const { accountId, setAccountId, accounts } = useSelectedAccount();

  if (!accounts.length) return null;

  return (
    <select
      value={accountId}
      onChange={(e) => setAccountId(e.target.value)}
      className={`bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 ${className}`}
    >
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.label || a.id.slice(0, 8)} – {a.status}
          {a.balance != null ? ` ($${a.balance.toLocaleString()})` : ''}
        </option>
      ))}
    </select>
  );
}
