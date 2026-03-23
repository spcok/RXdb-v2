import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RxDatabase } from 'rxdb';

// --- Core Architecture ---
import Layout from './components/layout/Layout';
import { AppProvider } from './context/AppContext';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { bootCoreDatabase, startCoreSync } from './lib/DatabaseCore';
import { supabase } from './lib/supabase'; // 🚨 The missing piece is here!
import { useInactivityTimer } from './hooks/useInactivityTimer';

// --- Auth Screens ---
import LoginScreen from './features/auth/LoginScreen';
import LockScreen from './features/auth/LockScreen';

// --- Feature Screens ---
import DashboardContainer from './features/dashboard/DashboardContainer';
import WeatherView from './features/dashboard/WeatherView';
import Tasks from './features/husbandry/Tasks';
import FeedingSchedule from './features/husbandry/FeedingSchedule';
import DailyLog from './features/husbandry/DailyLog';
import DailyRounds from './features/husbandry/DailyRounds';
import MedicalRecords from './features/medical/MedicalRecords';
import Movements from './features/logistics/Movements';
import FlightRecords from './features/logistics/FlightRecords';
import Timesheets from './features/staff/Timesheets';
import Holidays from './features/staff/Holidays';
import StaffRota from './features/staff/StaffRota';
import MissingRecords from './features/compliance/MissingRecords';
import SettingsLayout from './features/settings/SettingsLayout';
import HelpSupport from './features/help/HelpSupport';
import Incidents from './features/safety/tabs/Incidents';
import FirstAidLog from './features/safety/tabs/FirstAid';
import SafetyDrills from './features/safety/tabs/SafetyDrills';
import SiteMaintenance from './features/safety/tabs/SiteMaintenance';
import ReportsDashboard from './features/reports/ReportsDashboard';

export default function App() {
  const { initialize, isLoading, session } = useAuthStore();
  const [db, setDb] = useState<RxDatabase | null>(null);
  
  useInactivityTimer();

  // 1. Initialize Real Authentication
  useEffect(() => {
    let cleanup: () => void;
    initialize().then((c: any) => {
      if (typeof c === 'function') cleanup = c;
    });
    return () => { if (cleanup) cleanup(); };
  }, [initialize]);

  // 2. Boot the Offline-First Database Engine
  useEffect(() => {
    bootCoreDatabase().then(setDb).catch(console.error);
  }, []);

  // 3. Launch Authenticated Sync (Hands the Supabase Token to the Engine)
  useEffect(() => {
    if (db && session) {
      startCoreSync(db, supabase);
    }
  }, [db, session]);

  // 🛡️ Guard 1: System Booting Screen
  if (isLoading || !db) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">Initializing Core...</p>
        </div>
      </div>
    );
  }

  // 🛡️ Guard 2: Not Logged In
  if (!session) return <LoginScreen />;

  // 🟢 System Ready: Render Application
  return (
    <ErrorBoundary>
      <AppProvider>
        <LockScreen />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardContainer />} />
              <Route path="weather" element={<div className="-mx-2.5 md:-mx-[18px] lg:-mx-[26px]"><WeatherView /></div>} />
              <Route path="daily-log" element={<DailyLog />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="feeding-schedule" element={<FeedingSchedule />} />
              <Route path="daily-rounds" element={<DailyRounds />} />
              <Route path="medical" element={<MedicalRecords />} />
              <Route path="first-aid" element={<FirstAidLog />} />
              <Route path="movements" element={<Movements />} />
              <Route path="flight-records" element={<FlightRecords />} />
              <Route path="maintenance" element={<SiteMaintenance />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="safety-drills" element={<SafetyDrills />} />
              <Route path="timesheets" element={<Timesheets />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="rota" element={<StaffRota />} />
              <Route path="compliance" element={<MissingRecords />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="missing-records" element={<MissingRecords />} />
              <Route path="settings" element={<SettingsLayout />} />
              <Route path="settings/:tab" element={<SettingsLayout />} />
              <Route path="help" element={<HelpSupport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}