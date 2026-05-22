import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Github, Star, GitFork, AlertCircle, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [connectedRepos, setConnectedRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const { user, updateGithubConnection } = useContext(AuthContext);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const [allReposRes, connectedReposRes] = await Promise.all([
        api.get('/github/repos'),
        api.get('/github/connected-repos')
      ]);
      setRepos(allReposRes.data);
      setConnectedRepos(connectedReposRes.data.map(r => r.repoId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.githubUsername) {
      fetchRepos();
    }
  }, [user.githubUsername]);

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/github/connect', { 
        githubUsername, 
        githubToken 
      });
      updateGithubConnection(githubUsername);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect GitHub');
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo) => {
    try {
      await api.post('/github/repo', repo);
      // Trigger analytics generation immediately
      await api.get(`/analytics/${repo.repoId}`);
      fetchRepos(); // Refresh lists
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect repository');
    }
  };

  if (!user.githubUsername) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 w-full"
        >
          <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Github className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Connect GitHub</h2>
          <p className="text-textMuted text-center mb-6 text-sm">
            Connect your account to analyze your repositories. A Personal Access Token is required to access private repositories.
          </p>

          <form onSubmit={handleConnect} className="space-y-4">
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-textMain mb-1">GitHub Username *</label>
              <input
                type="text"
                required
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="input-field"
                placeholder="torvalds"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-textMain mb-1">Personal Access Token (Optional)</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="input-field"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Connecting...' : 'Connect Account'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Github className="w-6 h-6" /> Your Repositories
        </h2>
        <button 
          onClick={fetchRepos} 
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-lg">{error}</div>}

      {loading && !repos.length ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo, index) => {
            const isConnected = connectedRepos.includes(repo.repoId);
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={repo.repoId}
                className={`glass-card p-6 flex flex-col ${isConnected ? 'border-primary/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold truncate pr-2" title={repo.name}>{repo.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-textMuted'}`}>
                    {isConnected ? 'Connected' : 'Available'}
                  </span>
                </div>
                
                <p className="text-textMuted text-sm mb-6 flex-1 line-clamp-2">
                  {repo.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-textMuted mb-6">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {repo.forks}</span>
                </div>

                {isConnected ? (
                  <button className="btn-secondary w-full flex justify-center items-center gap-2 border-primary/50 text-primary hover:bg-primary/10">
                    <BarChart2 className="w-4 h-4" /> View Analytics
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSelectRepo(repo)}
                    className="btn-primary w-full flex justify-center items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Connect for Analytics
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Repositories;
