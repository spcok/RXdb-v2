import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';
import { bootCoreDatabase } from './lib/DatabaseCore';

// Auth Screens
import LoginScreen from './features/auth/LoginScreen';
import LockScreen from './features/auth/LockScreen';

// Main Feature Screens
import DashboardContainer from './features/dashboard/DashboardContainer';
import WeatherView from './features/dashboard/WeatherView';
import DailyLog from './features/husbandry/DailyLog';
import DailyRounds from './features/husbandry/DailyRounds';
import Tasks from './features/husbandry/Tasks';
import FeedingSchedule from './features/husbandry/FeedingSchedule';
import MedicalRecords from './features/medical/MedicalRecords';
import Movements from './features/logistics/Movements';
import FlightRecords from './features/logistics/FlightRecords';
import SiteMaintenance from './features/safety/tabs/SiteMaintenance';
import Incidents from './features/safety/tabs/Incidents';
import FirstAid from './features/safety/tabs/FirstAid';
import SafetyDrills from './features/safety/tabs/SafetyDrills';
import Timesheets from './features/staff/Timesheets';
import Holidays from './features/staff/Holidays';
import StaffRota from './features/staff/StaffRota';
import MissingRecords from './features/compliance/MissingRecords';
import ReportsDashboard from './features/reports/ReportsDashboard';
import SettingsLayout from './features/settings/SettingsLayout';
import HelpSupport from './features/help/HelpSupport';
import AnimalProfile from './features/animals/AnimalProfile';
import AnimalsList from './features/animals/AnimalsList';

// 🚨 1. We extract the routing logic into a child component so it can use Router context safely
const AppContent = () => {
  const { currentUser } = useAuthStore();
  const [isDbBooting, setIsDbBooting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Only boot the database if they are logged in
    if (currentUser) {
      setIsDbBooting(true);
      const initializeApp = async () => {
        try {
          await bootCoreDatabase();
          if (isMounted) setIsDbBooting(false);
        } catch (error) {
          console.error("Database failed to boot:", error);
          if (isMounted) setDbError(String(error));
        }
      };
      initializeApp();
    }

    return () => { isMounted = false; };
  }, [currentUser]);

  // 2. Unauthenticated Route (Now safely inside the Router)
  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  // 3. Elegant, Coordinated Boot Screen
  if (isDbBooting) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#18181b] transition-all duration-500 z-[100]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
        <p className="text-emerald-500 font-mono text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">
          Initializing Local Engine...
        </p>
      </div>
    );
  }

  // 4. Fatal Error Fallback
  if (dbError) {
     return (
       <div className="flex h-screen w-screen items-center justify-center bg-[#1c1c1e] text-rose-500 font-mono text-xs p-8 text-center z-[100]">
          <div>
            <p className="font-bold text-sm mb-4">Fatal Database Error</p>
            <p className="mb-8 text-rose-500/70">{dbError}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-900/30 hover:bg-rose-900/50 rounded border border-rose-900 transition-colors uppercase tracking-widest">
              Force Restart
            </button>
          </div>
       </div>
     );
  }

  // 5. Main Authenticated Routes
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        
        {/* Dashboard */}
        <Route index element={<DashboardContainer />} />
        <Route path="weather" element={<WeatherView />} />
        
        {/* Husbandry */}
        <Route path="daily-log" element={<DailyLog />} />
        <Route path="daily-rounds" element={<DailyRounds />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="feeding-schedule" element={<FeedingSchedule />} />
        
        {/* Animals & Medical */}
        <Route path="animals" element={<AnimalsList />} />
        <Route path="animals/:id" element={<AnimalProfile />} />
        <Route path="medical" element={<MedicalRecords />} />
        
        {/* Logistics */}
        <Route path="movements" element={<Movements />} />
        <Route path="flight-records" element={<FlightRecords />} />
        
        {/* Site & Safety */}
        <Route path="maintenance" element={<SiteMaintenance />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="first-aid" element={<FirstAid />} />
        <Route path="safety-drills" element={<SafetyDrills />} />
        
        {/* Staff */}
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="rota" element={<StaffRota />} />
        
        {/* Compliance & Reports */}
        <Route path="compliance" element={<MissingRecords />} />
        <Route path="reports" element={<ReportsDashboard />} />
        
        {/* System */}
        <Route path="settings/*" element={<SettingsLayout />} />
        <Route path="help" element={<HelpSupport />} />
        
        {/* 404 / Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Route>
    </Routes>
  );
};

// 🚨 6. The Absolute Root: The Router wraps EVERYTHING
const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
};

export default App;