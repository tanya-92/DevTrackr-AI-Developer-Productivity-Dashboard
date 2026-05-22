import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Star, GitFork, AlertCircle, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyzingRepo, setAnalyzingRepo] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const { user, updateGithubConnection } = useContext(AuthContext);

  const fetchRepos = async (username) => {
    try {
      setLoading(true);
      const res = await api.get(`/github/repos/${username}`);
      setRepos(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch repositories');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.githubUsername) {
      fetchRepos(user.githubUsername);
    }
  }, [user.githubUsername]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;

    try {
      setLoading(true);
      await api.post('/github/connect', { username: githubUsername });
      updateGithubConnection(githubUsername);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect GitHub');
      setLoading(false);
    }
  };

  const handleAnalyzeRepo = async (repo) => {
    try {
      setAnalyticsLoading(true);
      setAnalyzingRepo(repo.fullName);
      setAnalyticsError('');
      setAnalyticsData(null);
      
      const owner = repo.fullName.split('/')[0];
      const repoName = repo.name;
      
      const res = await api.get(`/github/repo/${owner}/${repoName}/analytics`);
      setAnalyticsData(res.data);
      // Save to localStorage for Overview
      localStorage.setItem('devtrackr_analytics', JSON.stringify(res.data));
    } catch (err) {
      setAnalyticsError(err.response?.data?.message || 'Failed to analyze repository');
    } finally {
      setAnalyticsLoading(false);
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
            <GitBranch className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Connect GitHub</h2>
          <p className="text-textMuted text-center mb-6 text-sm">
            Enter your GitHub username to fetch and analyze your repositories.
          </p>

          <form onSubmit={handleConnect} className="space-y-4">
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-textMain mb-1">GitHub Username</label>
              <input
                type="text"
                required
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="input-field"
                placeholder="e.g. torvalds"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Connecting...' : 'Connect GitHub'}
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
          <GitBranch className="w-6 h-6" /> Your Repositories
        </h2>
        <button 
          onClick={() => fetchRepos(user.githubUsername)} 
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-lg">{error}</div>}

      {/* Analytics Modal / View */}
      {analyzingRepo && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-8 border-primary/50"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Analytics for {analyzingRepo}</h3>
            <button className="text-textMuted hover:text-white" onClick={() => setAnalyzingRepo(null)}>Close</button>
          </div>
          
          {analyticsLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : analyticsError ? (
            <div className="text-red-500 bg-red-500/10 p-4 rounded-lg">{analyticsError}</div>
          ) : analyticsData ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Total Commits</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.totalCommits || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Contributors</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.contributorsCount || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Open PRs</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.openPullRequests || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Merged PRs</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.mergedPullRequests || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Open Issues</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.openIssues || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-textMuted text-sm">Closed Issues</p>
                  <p className="text-2xl font-bold">{analyticsData.metrics?.closedIssues || 0}</p>
                </div>
              </div>
              
              {analyticsData.aiInsights && (
                <div className="mt-6 bg-primary/10 border border-primary/20 p-6 rounded-lg">
                  <h4 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                    <span className="text-2xl">✨</span> AI Insights (Gemini)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-textMain mb-1">Sprint Summary</h5>
                      <p className="text-textMuted">{analyticsData.aiInsights.summary}</p>
                    </div>

                    {analyticsData.aiInsights.bottlenecks?.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-textMain mb-1 text-red-400">Identified Bottlenecks</h5>
                        <ul className="list-disc list-inside text-textMuted">
                          {analyticsData.aiInsights.bottlenecks.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {analyticsData.aiInsights.recommendations?.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-textMain mb-1 text-emerald-400">Recommendations</h5>
                        <ul className="list-disc list-inside text-textMuted">
                          {analyticsData.aiInsights.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      )}

      {loading && !repos.length ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo, index) => {
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={repo.repoId}
                className="glass-card p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold truncate pr-2" title={repo.name}>{repo.name}</h3>
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

                <button 
                  onClick={() => handleAnalyzeRepo(repo)}
                  className="btn-primary w-full flex justify-center items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4" /> Analyze Repo
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Repositories;
