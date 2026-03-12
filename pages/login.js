import { useState } from 'react';
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
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
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
  );
}
