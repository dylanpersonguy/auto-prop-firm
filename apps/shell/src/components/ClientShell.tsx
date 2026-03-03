'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/trading/Toast';

/**
 * Client-side shell that wraps all pages with:
 * - ToastProvider (always)
 * - Navbar (conditionally — hidden on landing, login, register, admin pages)
 */

const NO_NAVBAR_PATTERNS = [
  '/',          // Landing page has its own nav
  '/login',
  '/register',
  '/admin',     // Admin has its own sidebar layout
];

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const showNavbar = !NO_NAVBAR_PATTERNS.some(
    (p) => p === '/' ? pathname === '/' : pathname.startsWith(p),
  );

  return (
    <ToastProvider>
      {showNavbar && <Navbar />}
      {children}
    </ToastProvider>
  );
}
