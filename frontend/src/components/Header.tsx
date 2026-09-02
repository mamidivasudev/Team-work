import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleUpdate = (e: any) => setDocTitle(e.detail);
    window.addEventListener('update-header-title', handleUpdate);
    return () => window.removeEventListener('update-header-title', handleUpdate);
  }, []);

  const getPageTitle = () => {
    if (location.pathname === '/observations' && docTitle && docTitle !== 'New Observation Document') {
      return docTitle;
    }
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/projects': return 'Projects';
      case '/tasks': return 'Tasks';
      case '/activity': return 'Activity';
      case '/observations': return 'Add Observations';
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
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4 relative">
        <button className="text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>
        
        <div ref={menuRef} className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <UserCircle size={28} className="text-gray-600" />
            <span className="text-sm font-medium">{localStorage.getItem('userName') || 'My Profile'}</span>
          </div>

          {showProfileMenu && (
            <div className="absolute top-10 right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
              <div className="py-1">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
