import React, { useEffect, useState } from 'react';
import { bootCoreDatabase } from '../lib/DatabaseCore';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
}

export const DatabaseBootProvider: React.FC<Props> = ({ children }) => {
  const { currentUser } = useAuthStore();
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initDb = async () => {
      try {
        await bootCoreDatabase();
        if (isMounted) setIsBooting(false);
      } catch (err) {
        console.error("Fatal Database Boot Error:", err);
        if (isMounted) setError(String(err));
      }
    };
    
    initDb();
    return () => { isMounted = false; };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1c1c1e] text-rose-500 font-mono text-xs p-8 text-center z-[100]">
        <div>
          <p className="font-bold text-sm mb-4">Fatal Database Error</p>
          <p className="mb-8 text-rose-500/70">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-900/30 hover:bg-rose-900/50 rounded border border-rose-900 transition-colors uppercase tracking-widest">
            Force Restart
          </button>
        </div>
      </div>
    );
  }

  if (isBooting && currentUser) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#18181b] transition-all duration-500 z-[100]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
        <p className="text-emerald-500 font-mono text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">
          Initializing Local Engine...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
