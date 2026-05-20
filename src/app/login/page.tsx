'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Redirect jika sudah login sebagai customer
  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'admin') {
        // Admin yang salah masuk ke portal user → redirect ke admin
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ Gunakan 'user-credentials' provider (hanya customer)
    const res = await signIn('user-credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      // Tampilkan pesan error yang informatif
      if (res.error.includes('EMAIL_UNVERIFIED')) {
        router.push(`/otp-verification?email=${encodeURIComponent(email)}`);
      } else if (res.error.includes('admin accounts must use')) {
        setError('Akun admin harus login melalui portal admin (/admin).');
      } else {
        setError('Email atau password salah.');
      }
      setLoading(false);
    } else {
      router.push('/profile');
      router.refresh();
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="animate-pulse text-white/60">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-500">Log In</h1>
        <p className="text-center text-white/40 text-sm mb-6">Portal pelanggan Tehkalibrasi</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-white/60 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-emerald-500 hover:text-emerald-400">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
