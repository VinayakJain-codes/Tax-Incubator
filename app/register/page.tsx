'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        toast.success('Account created! Welcome aboard.');
        router.push('/dashboard');
      } else {
        toast.success('Account created! Please check your email to confirm.');
        router.push('/login');
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">

      {/* Left Design Pane */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500 via-transparent to-transparent"></div>

        <div className="max-w-xl relative z-10 px-8">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center rounded-xl shadow-lg border border-orange-300/30">
              <span className="text-white font-black text-2xl leading-none tracking-tighter">S</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Symax Group</h1>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6 tracking-tight text-white drop-shadow-sm">
            Join the Governance<br />Platform
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed font-light mt-6 max-w-lg border-l-2 border-orange-500 pl-6">
            Create your authorized account to access the full suite of corporate governance tools — entities, directors, UBOs, audits, and beyond.
          </p>

          <div className="mt-16 grid grid-cols-2 gap-6">
            {[
              { label: 'Entities Managed', value: '25+' },
              { label: 'Jurisdictions', value: '8' },
              { label: 'Audit Logs', value: '100%' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <p className="text-3xl font-extrabold text-orange-400">{stat.value}</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sign Up Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-2xl lg:shadow-none border border-gray-100 lg:border-none">

          {/* Mobile Logo */}
          <div className="mb-10 lg:hidden flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center rounded-xl shadow-md mb-4 border border-orange-300/30">
              <span className="text-white font-black text-2xl leading-none tracking-tighter">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Symax Group</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Fill in your details below to request platform access.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@symaxgroup.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500 bg-gray-50 py-4 rounded-xl border border-gray-100">
            Already have an account? <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold ml-1">Sign in here.</Link>
          </div>

        </div>
      </div>

    </div>
  );
}
