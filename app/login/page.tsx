'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-slate-900 font-medium placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
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
