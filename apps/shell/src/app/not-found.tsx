import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center">
        {/* 404 badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
          <span className="text-brand-400 font-mono text-xs font-bold">404</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors border border-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
