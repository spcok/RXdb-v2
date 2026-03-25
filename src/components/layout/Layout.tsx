import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, ClipboardList, CheckSquare, CalendarDays, 
  Stethoscope, ArrowRightLeft, Plane, Wrench, AlertTriangle, 
  Cross, ShieldAlert, Clock, Calendar, Users, FileCheck, 
  BarChart2, Settings, HelpCircle, LogOut, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const permissions = usePermissions();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { 
    isLoading,
    view_daily_logs, view_tasks, view_medical, view_movements, 
    view_daily_rounds, view_maintenance, view_incidents, 
    view_first_aid, view_safety_drills, submit_timesheets, 
    request_holidays, view_missing_records, generate_reports, 
    view_settings 
  } = permissions;

  useEffect(() => {
    if (isLoading) return; 

    const path = location.pathname;
    let isAllowed = true;

    if (path.startsWith('/medical') && !view_medical) isAllowed = false;
    else if (path.startsWith('/daily-log') && !view_daily_logs) isAllowed = false;
    else if (path.startsWith('/tasks') && !view_tasks) isAllowed = false;
    else if (path.startsWith('/daily-rounds') && !view_daily_rounds) isAllowed = false;
    else if (path.startsWith('/movements') && !view_movements) isAllowed = false;
    else if (path.startsWith('/maintenance') && !view_maintenance) isAllowed = false;
    else if (path.startsWith('/incidents') && !view_incidents) isAllowed = false;
    else if (path.startsWith('/first-aid') && !view_first_aid) isAllowed = false;
    else if (path.startsWith('/safety-drills') && !view_safety_drills) isAllowed = false;
    else if (path.startsWith('/timesheets') && !submit_timesheets) isAllowed = false;
    else if (path.startsWith('/holidays') && !request_holidays) isAllowed = false;
    else if (path.startsWith('/compliance') && !view_missing_records) isAllowed = false;
    else if (path.startsWith('/reports') && !generate_reports) isAllowed = false;
    else if (path.startsWith('/settings') && !view_settings) isAllowed = false;

    if (!isAllowed) {
      console.warn('🛠️ [Security QA] Unauthorized route access blocked.');
      navigate('/', { replace: true });
    }
  }, [
    location.pathname, navigate, isLoading, view_medical, view_daily_logs, view_tasks, 
    view_daily_rounds, view_movements, view_maintenance, view_incidents, 
    view_first_aid, view_safety_drills, submit_timesheets, request_holidays, 
    view_missing_records, generate_reports, view_settings
  ]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Daily Log', path: '/daily-log', icon: ClipboardList, show: view_daily_logs },
    { name: 'Daily Rounds', path: '/daily-rounds', icon: CheckSquare, show: view_daily_rounds },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, show: view_tasks },
    { name: 'Feeding Schedule', path: '/feeding-schedule', icon: CalendarDays, show: true },
    { name: 'Animals', path: '/animals', icon: ClipboardList, show: true },
    { name: 'Medical', path: '/medical', icon: Stethoscope, show: view_medical },
    { name: 'Movements', path: '/movements', icon: ArrowRightLeft, show: view_movements },
    { name: 'Flight Records', path: '/flight-records', icon: Plane, show: true },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, show: view_maintenance },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle, show: view_incidents },
    { name: 'First Aid', path: '/first-aid', icon: Cross, show: view_first_aid },
    { name: 'Safety Drills', path: '/safety-drills', icon: ShieldAlert, show: view_safety_drills },
    { name: 'Timesheets', path: '/timesheets', icon: Clock, show: submit_timesheets },
    { name: 'Holidays', path: '/holidays', icon: Calendar, show: request_holidays },
    { name: 'Rota', path: '/rota', icon: Users, show: true },
    { name: 'Compliance', path: '/compliance', icon: FileCheck, show: view_missing_records },
    { name: 'Reports', path: '/reports', icon: BarChart2, show: generate_reports },
    { name: 'Settings', path: '/settings', icon: Settings, show: view_settings },
    { name: 'Help', path: '/help', icon: HelpCircle, show: true },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-slate-900 text-slate-300
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64 flex flex-col
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
          {!isSidebarCollapsed && <span className="text-xl font-bold text-white">KOA Manager</span>}
          {isSidebarCollapsed && <span className="text-xl font-bold text-white mx-auto">KM</span>}
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-white'
                    }
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <item.icon size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-950">
          <button
            onClick={logout}
            className={`
              flex items-center w-full px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
              ${isSidebarCollapsed ? 'justify-center' : ''}
            `}
            title={isSidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 z-10">
          <div className="flex items-center">
            <button
              className="md:hidden p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <button
              className="hidden md:block p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-700">
              {currentUser?.name || currentUser?.email}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <Outlet context={{ isSidebarCollapsed }} />
        </main>
      </div>
    </div>
  );
}