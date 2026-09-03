import { useState, useRef, useEffect } from 'react';
import { Bell, UserCircle, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActivities } from '../services/api';
import type { Activity } from '../types';
import GlobalSearch from './GlobalSearch';

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = (e: any) => setDocTitle(e.detail);
    window.addEventListener('update-header-title', handleUpdate);
    return () => window.removeEventListener('update-header-title', handleUpdate);
  }, []);

  useEffect(() => {
    getActivities().then(data => setActivities(data.slice(0, 8))).catch(() => {});
  }, []);

  const getPageTitle = () => {
    if (location.pathname === '/observations' && docTitle && docTitle !== 'New Observation Document') {
      return docTitle;
    }
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/my-work': return 'My Work';
      case '/team-work': return 'Team Work';
      case '/projects': return 'Projects';
      case '/tasks': return 'Tasks';
      case '/observations': return 'QA Observations';
      case '/reports': return 'Reports';
      case '/notifications': return 'Notifications';
      case '/team': return 'Team';
      case '/settings': return 'Settings';
      default: return 'Team Work';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showProfileMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const toggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      getActivities().then(data => setActivities(data.slice(0, 8))).catch(() => {});
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 z-10 relative">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4 relative">
        <GlobalSearch />

        <div ref={notifRef} className="relative">
          <button
            onClick={toggleNotifications}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors relative"
          >
            <Bell size={19} />
            {activities.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-11 right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
                ) : (
                  activities.map(a => (
                    <div key={a.id} className="px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <p className="text-sm text-slate-700">{a.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                className="w-full text-center text-xs font-medium text-indigo-600 hover:bg-slate-50 py-2.5 border-t border-slate-100"
              >
                View All
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <div ref={menuRef} className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <UserCircle size={26} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{localStorage.getItem('userName') || 'My Profile'}</span>
          </div>

          {showProfileMenu && (
            <div className="absolute top-11 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
