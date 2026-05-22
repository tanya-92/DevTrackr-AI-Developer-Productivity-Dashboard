import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bell, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="h-20 glass-card rounded-none border-t-0 border-l-0 border-r-0 flex items-center justify-between px-8 z-10 relative">
      <div>
        <h2 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-sm text-textMuted">Here's what's happening in your repositories today.</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-textMuted hover:text-primary transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-cardBorder">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-textMuted">{user?.githubUsername || 'Not connected'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
