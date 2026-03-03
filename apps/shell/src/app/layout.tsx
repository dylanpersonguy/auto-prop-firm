import type { Metadata, Viewport } from 'next';
import { SolanaProvider } from '@/components/SolanaProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ClientShell } from '@/components/ClientShell';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autopropfirm.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: {
    default: 'AutoProp Firm – Trade Simulated Capital, Earn Real USDC',
    template: '%s | AutoProp Firm',
  },
  description:
    'Prop trading, reimagined on Solana. Pass the challenge, trade with simulated capital, and get paid out in real USDC. Transparent, on-chain, no hidden fees.',
  metadataBase: new URL(siteUrl),
  keywords: [
    'prop trading',
    'funded trading',
    'solana',
    'usdc',
    'trading challenge',
    'prop firm',
    'crypto trading',
  ],
  authors: [{ name: 'AutoProp Firm' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'AutoProp Firm',
    title: 'AutoProp Firm – Trade Simulated Capital, Earn Real USDC',
    description:
      'Prop trading, reimagined on Solana. Pass the challenge, get funded, earn USDC payouts.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AutoProp Firm',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoProp Firm – Trade Simulated Capital, Earn Real USDC',
    description:
      'Prop trading, reimagined on Solana. Pass the challenge, get funded, earn USDC payouts.',
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <QueryProvider>
          <SolanaProvider>
            <ClientShell>{children}</ClientShell>
          </SolanaProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
