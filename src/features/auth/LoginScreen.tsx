import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldCheck, Mail, Lock, Bird, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';

const LoginScreen: React.FC = () => {
  const { login, initialize } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = true; // Mocked as always configured for offline mode

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (navigator.onLine) {
        try {
          // Tier 1 (Online): Attempt Supabase Login
          await login(email, password);
          await bootCoreDatabase(); // Wake engine to rebuild empty cache
          return; 
        } catch (onlineError: any) {
          // SECURITY GUARD: If Supabase rejected the password, STOP immediately.
          // Do not fall back to offline mode.
          const errorMsg = onlineError?.message?.toLowerCase() || '';
          if (errorMsg.includes('credentials') || errorMsg.includes('invalid login') || errorMsg.includes('password')) {
             throw new Error("Invalid email or password.");
          }
          console.warn("Network unreachable. Engaging offline failover...");
        }
      }

      // Tier 2 & 3 (Offline Failover): Query the local rulebook
      const db = await bootCoreDatabase();
      const users = await db.admin_records.find({
        selector: { record_type: 'user' }
      }).exec();

      // Tier 3 (Empty Cache Hard-Stop)
      if (!users || users.length === 0) {
        throw new Error("No internet connection and no local profile found. You must connect to Wi-Fi at least once to set up this device for offline use.");
      }

      // 🚨 Fix: Properly extract the RxDB document data
      const rawUsers = users.map(u => u.toJSON());
      const localUser = rawUsers.find(u => u.email === email);

      if (!localUser) {
         throw new Error("User profile not found on this offline device.");
      }

      // SECURITY GUARD: Verify the password/PIN offline!
      // Checking against the 'pin' field stored in admin_records
      if (localUser.pin !== password && localUser.password !== password) {
         throw new Error("Invalid email or password.");
      }

      // Offline Login Success
      useAuthStore.setState({
         currentUser: {
           id: String(localUser.id),
           email: localUser.email,
           name: localUser.name || 'Offline User',
           initials: localUser.initials || 'OU',
           role: localUser.role || 'GUEST',
         },
         session: null, // No active Supabase session
         isLoading: false
      });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfflineMode = async () => {
    setIsSubmitting(true);
    try {
      // Re-run initialize which handles the offline fallback
      await initialize();
    } catch (err) {
      setError('Failed to enter offline mode.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
              <Bird size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center">
              Kent Owl Academy
            </h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">
              Management System V2
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] shadow-xl shadow-emerald-500/5">
              <div className="flex items-center gap-3 mb-3">
                <WifiOff size={20} className="text-emerald-500" />
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                  Ready for Offline Use
                </p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                Supabase is not configured yet. You can start using the system immediately in <strong>Offline Mode</strong>. Your data will be saved locally in your browser.
              </p>
              <button
                onClick={handleOfflineMode}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <ShieldCheck size={18} />
                Continue to Dashboard
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  disabled={!isConfigured}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kentowlacademy.com"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  disabled={!isConfigured}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isConfigured}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Sign In to KOA
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;