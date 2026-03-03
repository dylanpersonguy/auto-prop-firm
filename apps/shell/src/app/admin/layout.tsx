'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminContext } from './admin-context';

const navItems = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/deposits', label: 'Deposits', icon: '💰' },
  { href: '/admin/payouts', label: 'Payouts', icon: '💸' },
  { href: '/admin/fees', label: 'Fees & Revenue', icon: '🏦' },
  { href: '/admin/referrals', label: 'Referrals', icon: '🔗' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    fetch('/api/admin/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error('Not authenticated');
        return r.json();
      })
      .then((data) => {
        setEmail(data.email);
        setLoading(false);
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [router, isLoginPage]);

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  // Login page renders without the sidebar chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading admin...</div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ email, loading }}>
      <div className="min-h-screen bg-gray-950 flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-16'
          } bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200`}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-gray-800">
            {sidebarOpen ? (
              <span className="text-lg font-bold text-brand-500">Admin Panel</span>
            ) : (
              <span className="text-lg font-bold text-brand-500">AP</span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-1 px-2">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User / Collapse */}
          <div className="border-t border-gray-800 p-3 space-y-2">
            {sidebarOpen && (
              <div className="text-xs text-gray-500 truncate px-1">{email}</div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-gray-500 hover:text-white rounded transition-colors text-xs"
                title={sidebarOpen ? 'Collapse' : 'Expand'}
              >
                {sidebarOpen ? '◀' : '▶'}
              </button>
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
