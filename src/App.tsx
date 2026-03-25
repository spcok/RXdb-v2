import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';

// 🛡️ Infrastructure Modules
import { DatabaseBootProvider } from './providers/DatabaseBootProvider';
import { AuthGuard } from './components/auth/AuthGuard';

// 📱 Main Feature Screens
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
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <Router>
        <DatabaseBootProvider>
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<DashboardContainer />} />
                <Route path="weather" element={<WeatherView />} />
                <Route path="daily-log" element={<DailyLog />} />
                <Route path="daily-rounds" element={<DailyRounds />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="feeding-schedule" element={<FeedingSchedule />} />
                <Route path="animals" element={<AnimalsList />} />
                <Route path="animals/:id" element={<AnimalProfile />} />
                <Route path="medical" element={<MedicalRecords />} />
                <Route path="movements" element={<Movements />} />
                <Route path="flight-records" element={<FlightRecords />} />
                <Route path="maintenance" element={<SiteMaintenance />} />
                <Route path="incidents" element={<Incidents />} />
                <Route path="first-aid" element={<FirstAid />} />
                <Route path="safety-drills" element={<SafetyDrills />} />
                <Route path="timesheets" element={<Timesheets />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="rota" element={<StaffRota />} />
                <Route path="compliance" element={<MissingRecords />} />
                <Route path="reports" element={<ReportsDashboard />} />
                <Route path="settings/*" element={<SettingsLayout />} />
                <Route path="help" element={<HelpSupport />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthGuard>
        </DatabaseBootProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
