import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Star, GitFork, AlertCircle, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import RepoDetailsModal from '../../components/RepoDetailsModal';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyzingRepo, setAnalyzingRepo] = useState(null);
  const [selectedRepoForDetails, setSelectedRepoForDetails] = useState(null);
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
        <div className="flex gap-2">
          <button 
            onClick={() => fetchRepos(user.githubUsername)} 
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
        </div>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-lg">{error}</div>}

      {/* Details Modal */}
      {selectedRepoForDetails && (
        <RepoDetailsModal 
          repoFullName={selectedRepoForDetails} 
          onClose={() => setSelectedRepoForDetails(null)} 
        />
      )}

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
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                      <span className="text-2xl">✨</span> AI Insights
                    </h4>
                    {analyticsData.aiInsights.riskLevel && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        analyticsData.aiInsights.riskLevel.toLowerCase().includes('high') ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        analyticsData.aiInsights.riskLevel.toLowerCase().includes('medium') ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        Risk: {analyticsData.aiInsights.riskLevel}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold text-textMain mb-1 border-b border-white/10 pb-1">Sprint Summary</h5>
                      <p className="text-textMuted text-sm leading-relaxed">{analyticsData.aiInsights.summary}</p>
                    </div>

                    {analyticsData.aiInsights.productivityAnalysis && (
                      <div>
                        <h5 className="font-semibold text-textMain mb-1 border-b border-white/10 pb-1">Productivity Analysis</h5>
                        <p className="text-textMuted text-sm leading-relaxed">{analyticsData.aiInsights.productivityAnalysis}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analyticsData.aiInsights.bottlenecks?.length > 0 && (
                        <div className="bg-red-500/5 p-3 rounded-md border border-red-500/10">
                          <h5 className="font-semibold text-red-400 mb-2">Identified Bottlenecks</h5>
                          <ul className="list-disc list-inside text-textMuted text-sm space-y-1">
                            {analyticsData.aiInsights.bottlenecks.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}

                      {analyticsData.aiInsights.recommendations?.length > 0 && (
                        <div className="bg-emerald-500/5 p-3 rounded-md border border-emerald-500/10">
                          <h5 className="font-semibold text-emerald-400 mb-2">Recommendations</h5>
                          <ul className="list-disc list-inside text-textMuted text-sm space-y-1">
                            {analyticsData.aiInsights.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {analyticsData.aiInsights.healthComment && (
                      <div className="bg-blue-500/5 p-4 rounded-md border border-blue-500/10">
                        <h5 className="font-semibold text-blue-400 mb-1">Health Comment</h5>
                        <p className="text-textMuted text-sm italic">"{analyticsData.aiInsights.healthComment}"</p>
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
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-textMuted mb-6">
                  {repo.languages && Object.keys(repo.languages).length > 0 ? (
                    Object.keys(repo.languages).slice(0, 3).map(lang => (
                      <span key={lang} className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-xs">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        {lang}
                      </span>
                    ))
                  ) : repo.language ? (
                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {repo.language}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 ml-auto"><Star className="w-4 h-4" /> {repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {repo.forks}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button 
                    onClick={() => setSelectedRepoForDetails(repo.fullName)}
                    className="btn-secondary w-full flex justify-center items-center gap-2 text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleAnalyzeRepo(repo)}
                    className="btn-primary w-full flex justify-center items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700"
                  >
                    <BarChart2 className="w-4 h-4" /> Analyze
                  </button>
                </div>
                <a 
                  href={repo.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-center text-xs text-textMuted hover:text-white mt-4 border-t border-cardBorder pt-3"
                >
                  Open on GitHub
                </a>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Repositories;
