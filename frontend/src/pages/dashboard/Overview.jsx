import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, GitPullRequest, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-6"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-textMuted text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

const Overview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Read from localStorage
    const cachedData = localStorage.getItem('devtrackr_analytics');
    if (cachedData) {
      try {
        setAnalytics(JSON.parse(cachedData));
      } catch (err) {
        console.error("Failed to parse analytics", err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;

  if (!user.githubUsername) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="glass-card p-10 max-w-lg">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your GitHub</h2>
          <p className="text-textMuted mb-6">You need to connect your GitHub account to see productivity insights.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/dashboard/repos'}>
            Go to Repositories
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-textMuted">
        <div className="glass-card p-10 max-w-lg">
          <GitCommit className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-textMain mb-2">No data available</h2>
          <p className="text-textMuted mb-6">No activity data available yet. Analyze a repository first.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/dashboard/repos'}>
            Go to Repositories
          </button>
        </div>
      </div>
    );
  }

  const metrics = analytics.metrics || {};
  const aiInsights = analytics.aiInsights || {};
  
  // Create a minimal dummy chart data since actual commit time-series isn't available from raw /commits API easily without grouping by date
  // We'll just show the empty state logic if chartData is empty, or a basic flat representation
  const chartData = [
    { name: 'Commits', value: metrics.totalCommits || 0 },
    { name: 'PRs', value: metrics.totalPullRequests || 0 },
    { name: 'Issues', value: metrics.totalIssues || 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Commits" 
          value={metrics.totalCommits || 0} 
          icon={GitCommit} 
          colorClass="bg-blue-500/20 text-blue-500"
          delay={0.1}
        />
        <StatCard 
          title="Total PRs" 
          value={metrics.totalPullRequests || 0} 
          icon={GitPullRequest} 
          colorClass="bg-purple-500/20 text-purple-500"
          delay={0.2}
        />
        <StatCard 
          title="Open Issues" 
          value={metrics.openIssues || 0} 
          icon={AlertCircle} 
          colorClass="bg-red-500/20 text-red-500"
          delay={0.3}
        />
        <StatCard 
          title="Health Score" 
          value={`${metrics.healthScore || 0}%`} 
          icon={TrendingUp} 
          colorClass="bg-emerald-500/20 text-emerald-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6 lg:col-span-2 h-96 flex flex-col"
        >
          <h3 className="text-lg font-bold mb-6">Activity Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-card p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold mb-4">Sprint Completion</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-slate-700 stroke-current" 
                  strokeWidth="10" 
                  cx="50" cy="50" r="40" fill="transparent"
                ></circle>
                <circle 
                  className="text-primary stroke-current" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                  cx="50" cy="50" r="40" fill="transparent"
                  strokeDasharray={`${(metrics.sprintCompletion || 0) * 2.51} 251.2`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                ></circle>
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-3xl font-bold">{metrics.sprintCompletion || 0}%</span>
              </div>
            </div>
            <p className="text-center text-textMuted text-sm">
              Estimated sprint completion across the tracked repository based on merged PRs vs open PRs.
            </p>
          </div>
        </motion.div>
      </div>
      
      {aiInsights.summary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="glass-card p-6 bg-primary/5 border border-primary/20"
        >
          <h3 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
            <span className="text-2xl">✨</span> Recent AI Insights ({analytics.repo?.name})
          </h3>
          <p className="text-textMain mb-4">{aiInsights.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiInsights.bottlenecks?.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-400 mb-2">Bottlenecks</h4>
                <ul className="list-disc list-inside text-textMuted">
                  {aiInsights.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
            
            {aiInsights.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-emerald-400 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside text-textMuted">
                  {aiInsights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Overview;
