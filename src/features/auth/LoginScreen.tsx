import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldCheck, Mail, Lock, Bird } from 'lucide-react';
import { motion } from 'motion/react';

const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      // The store handles the entire Online/Offline 3-Tier fallback logic
      await login(email, password);
      // Note: No navigation needed! AuthGuard will instantly unmount this 
      // component and reveal the Dashboard the millisecond currentUser is set.
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
              <Bird size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center">
              KOA Manager
            </h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">
              Authentication Gateway
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Staff Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kentowlacademy.com"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Secure PIN
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {localError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center"
              >
                {localError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-500/50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Network Awareness Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {navigator.onLine ? 'Live Server Connected' : 'Offline Failover Active'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
