import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Settings, GitBranch, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, updateGithubConnection } = useContext(AuthContext);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 glass-card rounded-none border-t-0 border-l-0 border-r-0 flex items-center justify-between px-8 z-50 relative">
      <div>
        <h2 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-sm text-textMuted">Here's what's happening in your repositories today.</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile */}
        <div className="relative pl-4 border-l border-cardBorder" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-textMuted truncate w-24">
                {user?.githubUsername ? `@${user.githubUsername}` : 'Not connected'}
              </p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-56 glass-card p-2 shadow-xl border-cardBorder flex flex-col">
              <div className="px-4 py-3 border-b border-cardBorder mb-2">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-xs text-textMuted truncate">{user?.email}</p>
              </div>
              
              <div className="px-4 py-2 mb-2 flex items-center gap-2 text-sm text-textMuted">
                <GitBranch className="w-4 h-4" /> 
                <span className="truncate">
                  {user?.githubUsername ? `Connected: ${user.githubUsername}` : 'No GitHub connected'}
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowProfile(false);
                  navigate('/dashboard/settings');
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-textMain hover:bg-slate-800 rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
