import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, ClipboardList, CheckSquare, CalendarDays, 
  Stethoscope, ArrowRightLeft, Plane, Wrench, AlertTriangle, 
  Cross, ShieldAlert, Clock, Calendar, Users, FileCheck, 
  BarChart2, Settings, HelpCircle, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Loader2, Accessibility
} from 'lucide-react';
import { A11yControlPanel } from './A11yControlPanel';

const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, permKey: null },
    ]
  },
  {
    title: 'Husbandry',
    items: [
      { name: 'Daily Log', path: '/daily-log', icon: ClipboardList, permKey: 'view_daily_logs' },
      { name: 'Daily Rounds', path: '/daily-rounds', icon: CheckSquare, permKey: 'view_daily_rounds' },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare, permKey: 'view_tasks' },
      { name: 'Feeding Schedule', path: '/feeding-schedule', icon: CalendarDays, permKey: null },
    ]
  },
  {
    title: 'Animals',
    items: [
      { name: 'Animals', path: '/animals', icon: ClipboardList, permKey: null },
      { name: 'Medical', path: '/medical', icon: Stethoscope, permKey: 'view_medical' },
    ]
  },
  {
    title: 'Logistics',
    items: [
      { name: 'Movements', path: '/movements', icon: ArrowRightLeft, permKey: 'view_movements' },
      { name: 'Flight Records', path: '/flight-records', icon: Plane, permKey: null },
    ]
  },
  {
    title: 'Safety',
    items: [
      { name: 'Maintenance', path: '/maintenance', icon: Wrench, permKey: 'view_maintenance' },
      { name: 'Incidents', path: '/incidents', icon: AlertTriangle, permKey: 'view_incidents' },
      { name: 'First Aid', path: '/first-aid', icon: Cross, permKey: 'view_first_aid' },
      { name: 'Safety Drills', path: '/safety-drills', icon: ShieldAlert, permKey: 'view_safety_drills' },
    ]
  },
  {
    title: 'Staff',
    items: [
      { name: 'Timesheets', path: '/timesheets', icon: Clock, permKey: 'submit_timesheets' },
      { name: 'Holidays', path: '/holidays', icon: Calendar, permKey: 'request_holidays' },
      { name: 'Rota', path: '/rota', icon: Users, permKey: null },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Compliance', path: '/compliance', icon: FileCheck, permKey: 'view_missing_records' },
      { name: 'Reports', path: '/reports', icon: BarChart2, permKey: 'generate_reports' },
      { name: 'Settings', path: '/settings', icon: Settings, permKey: 'view_settings' },
      { name: 'Help', path: '/help', icon: HelpCircle, permKey: null },
    ]
  }
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const permissions = usePermissions();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  useEffect(() => {
    if (permissions.isLoading) return; 

    const path = location.pathname;
    let isAllowed = true;

    if (path.startsWith('/medical') && !permissions.view_medical) isAllowed = false;
    else if (path.startsWith('/daily-log') && !permissions.view_daily_logs) isAllowed = false;
    else if (path.startsWith('/tasks') && !permissions.view_tasks) isAllowed = false;
    else if (path.startsWith('/daily-rounds') && !permissions.view_daily_rounds) isAllowed = false;
    else if (path.startsWith('/movements') && !permissions.view_movements) isAllowed = false;
    else if (path.startsWith('/maintenance') && !permissions.view_maintenance) isAllowed = false;
    else if (path.startsWith('/incidents') && !permissions.view_incidents) isAllowed = false;
    else if (path.startsWith('/first-aid') && !permissions.view_first_aid) isAllowed = false;
    else if (path.startsWith('/safety-drills') && !permissions.view_safety_drills) isAllowed = false;
    else if (path.startsWith('/timesheets') && !permissions.submit_timesheets) isAllowed = false;
    else if (path.startsWith('/holidays') && !permissions.request_holidays) isAllowed = false;
    else if (path.startsWith('/compliance') && !permissions.view_missing_records) isAllowed = false;
    else if (path.startsWith('/reports') && !permissions.generate_reports) isAllowed = false;
    else if (path.startsWith('/settings') && !permissions.view_settings) isAllowed = false;

    if (!isAllowed) {
      console.warn('🛠️ [Security QA] Unauthorized route access blocked.');
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate, permissions]);

  if (permissions.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/90 z-40 md:hidden"
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
          w-64 flex flex-col border-r border-slate-800
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950 border-b border-slate-800">
          {!isSidebarCollapsed && <span className="text-xl font-bold text-white">KOA Manager</span>}
          {isSidebarCollapsed && <span className="text-xl font-bold text-white mx-auto">KM</span>}
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="space-y-6 px-2">
            {NAVIGATION_GROUPS.map((group) => {
              // Filter items based on permissions
              const visibleItems = group.items.filter(item => {
                if (!item.permKey) return true;
                return (permissions as any)[item.permKey];
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {group.title}
                    </h3>
                  )}
                  {visibleItems.map((item) => {
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
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setIsA11yOpen(true)}
            className={`
              flex items-center w-full px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
              ${isSidebarCollapsed ? 'justify-center' : ''}
            `}
            title={isSidebarCollapsed ? "Accessibility" : undefined}
          >
            <Accessibility size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
            {!isSidebarCollapsed && <span>Accessibility</span>}
          </button>
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
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-10">
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
      
      <A11yControlPanel isOpen={isA11yOpen} onClose={() => setIsA11yOpen(false)} />
    </div>
  );
}
