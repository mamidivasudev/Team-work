import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ListChecks, Users, FolderKanban, CheckSquare, FileText, BarChart3, Bell, Settings, UserCog } from 'lucide-react';

const NAV_KEYS: Record<string, string> = {
  'Dashboard':       'setting_nav_dashboard',
  'My Work':         'setting_nav_mywork',
  'Team Work':       'setting_nav_teamwork',
  'Projects':        'setting_nav_projects',
  'Tasks':           'setting_nav_tasks',
  'QA Observations': 'setting_nav_qaobservations',
  'Reports':         'setting_nav_reports',
  'Notifications':   'setting_nav_notifications',
  'Team Members':    'setting_nav_teammembers',
};

const readNavSettings = () => {
  const result: Record<string, boolean> = {};
  Object.entries(NAV_KEYS).forEach(([name, key]) => {
    const val = localStorage.getItem(key);
    result[name] = val === null ? true : val === 'true'; // default ON
  });
  return result;
};

const Sidebar = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const userName = localStorage.getItem('userName') || '';
  const [navVisible, setNavVisible] = useState<Record<string, boolean>>(readNavSettings);

  useEffect(() => {
    const handler = () => setNavVisible(readNavSettings());
    window.addEventListener('settings_updated', handler);
    return () => window.removeEventListener('settings_updated', handler);
  }, []);

  let allNavItems = [
    { name: 'Dashboard',       path: '/',              icon: LayoutDashboard },
    { name: 'Projects',        path: '/projects',      icon: FolderKanban },
    { name: 'QA Observations', path: '/observations',  icon: FileText },
    { name: 'Tasks',           path: '/tasks',         icon: CheckSquare },
    { name: 'Team Members',    path: '/team',          icon: UserCog },
    { name: 'Reports',         path: '/reports',       icon: BarChart3 },
    { name: 'Notifications',   path: '/notifications', icon: Bell },
    { name: 'Team Work',       path: '/team-work',     icon: Users },
    { name: 'My Work',         path: '/my-work',       icon: ListChecks },
  ];

  if (isAdmin) {
    allNavItems = allNavItems.filter(item => item.name !== 'My Work');
    allNavItems.push({ name: 'Settings', path: '/settings', icon: Settings });
  } else {
    allNavItems = allNavItems.filter(item => item.name !== 'Team Members');
  }

  // Settings is always visible so admin can re-enable things
  const navItems = allNavItems.filter(item =>
    item.name === 'Settings' ? true : navVisible[item.name] !== false
  );

  return (
    <div className="w-56 bg-slate-900 h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 shrink-0">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2.5">
            <img src="/teamwork.png" alt="Team Work Logo" className="w-7 h-7 object-contain rounded" />
            <h1 className="text-base font-bold text-white leading-tight tracking-tight">Team Work</h1>
          </div>
          <span className="text-[10px] text-slate-500 font-medium ml-[38px] -mt-0.5">know your work status.....</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-semibold text-white leading-tight truncate">{userName}</p>
            <p className="text-xs text-slate-500">{isAdmin ? 'Admin' : 'Member'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
