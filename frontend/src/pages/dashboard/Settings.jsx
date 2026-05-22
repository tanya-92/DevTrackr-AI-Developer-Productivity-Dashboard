import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { User, GitBranch, LogOut, CheckCircle, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import api from '../../services/api';

const Settings = () => {
  const { user, updateGithubConnection, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDisconnectGithub = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');
      await api.post('/github/disconnect');
      updateGithubConnection('');
      setMessage('GitHub account successfully disconnected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect GitHub account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" /> Account Settings
      </h2>

      {message && (
        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 p-4 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/50 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cardBorder pb-2">
          <User className="w-5 h-5 text-primary" /> Profile Information
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-textMuted mb-1">Full Name</p>
            <p className="font-medium text-lg">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-textMuted mb-1">Email Address</p>
            <p className="font-medium text-lg">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cardBorder pb-2">
          <GitBranch className="w-5 h-5 text-primary" /> GitHub Integration
        </h3>
        
        {user?.githubUsername ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold">Connected as <span className="text-primary">@{user.githubUsername}</span></p>
                <p className="text-sm text-textMuted">Your account is actively syncing repositories.</p>
              </div>
            </div>
            
            <button 
              onClick={handleDisconnectGithub}
              disabled={loading}
              className="btn-secondary border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {loading ? 'Disconnecting...' : 'Disconnect GitHub Account'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-700 p-2 rounded-full">
                <AlertCircle className="w-5 h-5 text-textMuted" />
              </div>
              <div>
                <p className="font-bold">Not Connected</p>
                <p className="text-sm text-textMuted">Connect your GitHub account to access developer insights.</p>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/dashboard/repos'}
              className="btn-primary"
            >
              Go to Repositories
            </button>
          </div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cardBorder pb-2 text-red-500">
          <LogOut className="w-5 h-5" /> Session
        </h3>
        <p className="text-textMuted mb-4">Log out of your current DevTrackr session.</p>
        <button 
          onClick={logout}
          className="btn-secondary border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Logout
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;
