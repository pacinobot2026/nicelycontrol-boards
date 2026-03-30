import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabaseClient } from '../lib/supabase-client';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showMigrate, setShowMigrate] = useState(false);
  const [migrateStatus, setMigrateStatus] = useState('idle'); // idle | running | done | error
  const [migrateResults, setMigrateResults] = useState(null);
  const [supabaseToken, setSupabaseToken] = useState('');

  useEffect(() => {
    // Key is tied to the Supabase project URL so migrations re-run when the project changes
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = `migrations_done_${projectUrl}`;
    if (!localStorage.getItem(key)) {
      setShowMigrate(true);
    }
  }, []);

  async function handleMigrate() {
    setMigrateStatus('running');
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: supabaseToken }),
      });
      const data = await res.json();
      if (res.status === 400 && data.fix) {
        // Missing SUPABASE_ACCESS_TOKEN
        setMigrateStatus('needs_token');
        setMigrateResults([{ file: 'setup', status: 'error', error: data.fix }]);
        return;
      }
      setMigrateResults(data.results || null);
      if (data.success) {
        const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        localStorage.setItem(`migrations_done_${projectUrl}`, '1');
        setMigrateStatus('done');
        setTimeout(() => setShowMigrate(false), 3000);
      } else {
        setMigrateStatus('error');
      }
    } catch (err) {
      setMigrateStatus('error');
      setMigrateResults([{ file: 'connection', status: 'error', error: err.message }]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Head><title>Reset Password</title></Head>
        <div className="glass-card rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {resetSent ? (
            <div className="bg-green-900/40 border border-green-500/50 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">
              Check your email for a password reset link.
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <button onClick={() => { setForgotMode(false); setResetSent(false); setError(''); }} className="text-purple-400 hover:text-purple-300 bg-transparent border-none cursor-pointer">
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Head><title>Sign In</title></Head>
      <div className="w-full max-w-md space-y-4">

        {showMigrate && (
          <div className="glass-card rounded-2xl p-5 border border-yellow-500/30 bg-yellow-900/10">
            <p className="text-yellow-300 text-sm font-medium mb-1">🗄️ First time setup — Create database tables</p>
            <p className="text-gray-400 text-xs mb-4">
              Paste your Supabase Personal Access Token to set up the database automatically. This only runs once.{' '}
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 underline hover:text-yellow-300"
              >
                Get your token here ↗
              </a>
            </p>

            <input
              type="password"
              placeholder="sbp_xxxxxxxxxxxxxxxx"
              value={supabaseToken}
              onChange={e => setSupabaseToken(e.target.value)}
              disabled={migrateStatus === 'running' || migrateStatus === 'done'}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500 mb-3"
            />

            <button
              onClick={handleMigrate}
              disabled={!supabaseToken.trim() || migrateStatus === 'running' || migrateStatus === 'done'}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {migrateStatus === 'idle' && 'Set Up Database'}
              {migrateStatus === 'running' && 'Running migrations…'}
              {migrateStatus === 'done' && '✅ Database ready!'}
              {migrateStatus === 'error' && '❌ Some migrations failed — see details below'}
            </button>

            {migrateResults && (
              <div className="mt-3 max-h-40 overflow-y-auto text-xs font-mono space-y-1">
                {migrateResults.map((r, i) => (
                  <div key={i} className={`flex gap-2 ${r.status === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
                    <span>{r.status === 'ok' ? '✓' : r.status === 'error' ? '✗' : '–'}</span>
                    <span className="truncate flex-1">{r.file}</span>
                    {r.error && <span className="text-red-400 truncate">— {r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="glass-card rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
        <p className="text-gray-400 text-sm mb-6">Welcome back to the dashboard.</p>

        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-400">Password</label>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setError(''); }}
                className="text-xs text-purple-400 hover:text-purple-300 bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300">
            Register
          </Link>
        </p>
        </div>

      </div>
    </div>
  );
}
