import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AppProvider } from './context/AppContext';
import { useAuthStore } from './store/authStore';
import LoginScreen from './features/auth/LoginScreen';
import LockScreen from './features/auth/LockScreen';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { initialize, isLoading, session } = useAuthStore();
  useInactivityTimer();

  useEffect(() => {
    let cleanup: () => void;
    initialize().then(c => {
      if (typeof c === 'function') cleanup = c;
    });
    return () => { if (cleanup) cleanup(); };
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <ErrorBoundary>
      <AppProvider>
        <LockScreen />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<div>Blank Slate</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
