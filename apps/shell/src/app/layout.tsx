import type { Metadata } from 'next';
import { SolanaProvider } from '@/components/SolanaProvider';
import { QueryProvider } from '@/components/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PropFirm Shell – Powered by PropSim',
  description: 'Trade with simulated capital. Get paid in real USDC.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <QueryProvider>
          <SolanaProvider>{children}</SolanaProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
