import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Activity, Settings, FileText } from 'lucide-react';

const Sidebar = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const userName = localStorage.getItem('userName') || '';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Add Observations', path: '/observations', icon: FileText },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Team', path: '/team', icon: Users });
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });
  }

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <img src="/teamwork.png" alt="Team Work Logo" className="w-7 h-7 object-contain" />
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Team Work</h1>
          </div>
          <span className="text-[10px] text-gray-500 font-medium ml-11 -mt-0.5">know your work status.....</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
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
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-800 leading-tight">{userName}</p>
            <p className="text-xs text-gray-400">{isAdmin ? 'Admin' : 'Member'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
