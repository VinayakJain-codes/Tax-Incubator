'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('symax_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('symax_remembered_email', email);
    } else {
      localStorage.removeItem('symax_remembered_email');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      
      {/* Left Design Pane (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 justify-center items-center text-white p-12 relative overflow-hidden">
        {/* Abstract Background Decoration */}
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
            Centralized Corporate<br />Governance
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed font-light mt-6 max-w-lg border-l-2 border-orange-500 pl-6">
            The single source of truth for global entities, directories, strict audit reporting, and upcoming deadlines. 
            Replacing legacy sheets inside a unified, immutable digital interface.
          </p>

          <div className="mt-16 flex items-center space-x-6">
             <div className="flex -space-x-3">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-${800 - i*100} flex items-center justify-center overflow-hidden`}>
                   <img src={`https://api.dicebear.com/7.x/initials/svg?seed=U${i}&backgroundColor=f97316`} alt="User" />
                 </div>
               ))}
             </div>
             <div className="text-sm font-medium text-slate-400"><span className="text-white font-bold">Secure</span> Authorized Access Only</div>
          </div>
        </div>

          {/* ──── Vicinix Watermark ──────────────────────────── */}
          <div className="vcx-reveal absolute bottom-6 left-8 z-20" style={{maxWidth:'280px'}}>
            <div
              className="vcx-float relative rounded-xl overflow-hidden"
              style={{
                background: 'rgba(15,23,42,0.65)',
                border: '1px solid rgba(249,115,22,0.3)',
                boxShadow: '0 0 0 1px rgba(249,115,22,0.08) inset, 0 4px 24px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Scanline */}
              <div className="vcx-scanline pointer-events-none absolute left-0 right-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent)'}}/>

              <div className="px-4 py-3">
                {/* Row 1: V badge + "Provided by Vicinix" */}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-[10px] font-black text-white"
                    style={{background:'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 0 10px rgba(249,115,22,0.45)'}}
                  >V</div>
                  <span className="text-[13px] font-semibold text-white tracking-tight leading-none">
                    Provided by <span className="font-bold">Vicinix</span>
                  </span>
                </div>

                {/* Row 2: "by Vinayak Jain" */}
                <p className="text-[11px] text-slate-400 leading-none mb-2 pl-[34px]">
                  by Vinayak Jain
                </p>

                {/* Row 3: Divider + tagline + contact */}
                <div className="border-t border-white/[0.06] pt-2 pl-[34px]">
                  <p className="text-[10px] tracking-[0.12em] uppercase font-semibold leading-none mb-1.5" style={{color:'rgba(249,115,22,0.45)'}}>
                    Enterprise Intelligence Platform
                  </p>
                  <a
                    href="mailto:vinayakjain2110@gmail.com"
                    className="text-[9px] text-slate-500 hover:text-orange-400 transition-colors leading-none"
                  >
                    vinayakjain2110@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* ─────────────────────────────────────────────────── */}


      </div>

      {/* Right Login Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50 lg:bg-white relative">
        <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-2xl lg:shadow-none border border-gray-100 lg:border-none">
          
          <div className="mb-12 lg:hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center rounded-xl shadow-md mb-4 border border-orange-300/30">
              <span className="text-white font-black text-2xl leading-none tracking-tighter">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Symax Group</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-3 font-medium">Enter your corporate email and password securely to access the dashboard portal.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@symaxgroup.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Forgot password?</a>
              </div>
              <input 
                type="password" 
                name="password"
                autoComplete="current-password"
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRememberMe(v => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  rememberMe ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-200'
                }`}
                role="switch"
                aria-checked={rememberMe}
                id="remember-me-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                    rememberMe ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <label htmlFor="remember-me-toggle" className="text-sm font-medium text-slate-600 cursor-pointer select-none" onClick={() => setRememberMe(v => !v)}>
                Remember my email
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In Securely'}
            </button>
          </form>

          <div className="mt-10 text-center text-sm font-medium text-slate-500 bg-gray-50 py-4 rounded-xl border border-gray-100">
            Don't have an account? <Link href="/register" className="text-orange-600 hover:text-orange-700 font-bold ml-1">Request access here.</Link>
          </div>

        </div>
      </div>

    </div>
  );
}
