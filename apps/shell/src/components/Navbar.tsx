'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCurrentUser } from '@/lib/hooks';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false },
);

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/dashboard/referrals', label: 'Referrals' },
  { href: '/proof-of-reserves', label: 'Proof of Reserves' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <nav className="border-b border-white/[0.06] bg-gray-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              PropFirm
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:block text-sm text-gray-400">
                {user.email}
              </span>
            )}
            <WalletMultiButton />
            {user ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
