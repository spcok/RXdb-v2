import { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';

// Auth Screens
import LoginScreen from './features/auth/LoginScreen';

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

const App = () => {
  const { currentUser, initialize, isLoading } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-emerald-500 font-bold tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  // 1. Authentication Guard
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 2. Main Authenticated Application
  return (
    <ErrorBoundary>
      {/* 🚨 Using HashRouter for strict iframe/sandbox compatibility */}
      <Router>
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-[#1c1c1e] text-emerald-500 font-mono text-sm tracking-widest uppercase">
            Loading Module...
          </div>
        }>
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
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;