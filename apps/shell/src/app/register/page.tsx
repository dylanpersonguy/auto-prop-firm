'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-400">Loading...</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);

  // Read ?ref= from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      // Validate the referral code
      fetch(`/api/referral/validate?code=${encodeURIComponent(ref)}`)
        .then((r) => r.json())
        .then((data) => setReferralValid(data.valid))
        .catch(() => setReferralValid(false));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        ...(referralCode ? { referralCode } : {}),
      }),
    });

    if (res.ok || res.status === 201) {
      const data = await res.json();
      // Store userId for referral dashboard (in production, use session)
      if (data.userId) localStorage.setItem('userId', data.userId);
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

        {/* Referral badge */}
        {referralCode && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm text-center ${
              referralValid === true
                ? 'bg-green-900/30 border border-green-700 text-green-300'
                : referralValid === false
                  ? 'bg-red-900/30 border border-red-700 text-red-300'
                  : 'bg-gray-800 border border-gray-700 text-gray-300'
            }`}
          >
            {referralValid === true
              ? `Referred by code: ${referralCode}`
              : referralValid === false
                ? `Invalid referral code: ${referralCode}`
                : `Validating referral code...`}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Manual referral code input (if not from URL) */}
          {!searchParams.get('ref') && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Referral Code (optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD1234"
                maxLength={8}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
