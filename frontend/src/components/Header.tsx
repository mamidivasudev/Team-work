import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md w-96">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search projects, tasks..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
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
