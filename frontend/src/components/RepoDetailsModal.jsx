import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, GitCommit, GitPullRequest, AlertCircle, Users, Activity, FileText } from 'lucide-react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';

const RepoDetailsModal = ({ repoFullName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [owner, repo] = repoFullName.split('/');
        const res = await api.get(`/github/repo/${owner}/${repo}/details`);
        setDetails(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch repository details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [repoFullName]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Fetching deep repository insights...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="text-red-500 mb-4 flex items-center gap-2"><AlertCircle /> Error</div>
          <p>{error || 'Failed to load details'}</p>
        </div>
      </div>
    );
  }

  const tabs = ['Overview', 'Commits', 'Contributors', 'README'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-textMuted text-sm">Stars</p>
                <p className="text-2xl font-bold">{details.repo?.watchers_count || 0}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-textMuted text-sm">Forks</p>
                <p className="text-2xl font-bold">{details.repo?.forks_count || 0}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-textMuted text-sm">Open Issues</p>
                <p className="text-2xl font-bold">{details.repo?.open_issues_count || 0}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-textMuted text-sm">Default Branch</p>
                <p className="text-xl font-bold mt-1">{details.repo?.default_branch || 'main'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-3 border-b border-cardBorder pb-2">Tech Stack Usage (Bytes)</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(details.languages || {}).length > 0 ? (
                  Object.entries(details.languages).map(([lang, bytes]) => (
                    <div key={lang} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {lang}: {bytes}
                    </div>
                  ))
                ) : (
                  <p className="text-textMuted text-sm">No language data available.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'Commits':
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {details.commits?.length > 0 ? details.commits.map((c, i) => (
              <div key={i} className="bg-slate-800/50 p-4 rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm w-3/4">{c.message}</p>
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>
                </div>
                <div className="text-xs text-textMuted flex items-center gap-2">
                  <span className="font-medium text-white">{c.authorName || c.authorUsername}</span>
                  <span>•</span>
                  <span>{new Date(c.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-mono">{c.sha.substring(0, 7)}</span>
                </div>
              </div>
            )) : <p className="text-textMuted">No commits found.</p>}
          </div>
        );
      
      case 'Contributors':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {details.contributors?.length > 0 ? details.contributors.map((c, i) => (
              <div key={i} className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4">
                <img src={c.avatar} alt={c.username} className="w-12 h-12 rounded-full border border-cardBorder" />
                <div>
                  <a href={c.profileUrl} target="_blank" rel="noreferrer" className="font-bold hover:text-primary transition-colors">{c.username}</a>
                  <p className="text-sm text-textMuted">{c.contributions} contributions</p>
                </div>
              </div>
            )) : <p className="text-textMuted col-span-2">No contributors found.</p>}
          </div>
        );
      
      case 'README':
        return (
          <div className="prose prose-invert max-w-none max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar bg-slate-900/50 p-6 rounded-lg">
            {details.readme?.readmeContent === "README not found" ? (
              <p className="text-textMuted">This repository does not have a README file.</p>
            ) : (
              <ReactMarkdown>{details.readme?.readmeContent || ''}</ReactMarkdown>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col bg-background/95 border border-primary/20 shadow-2xl overflow-hidden relative"
      >
        <div className="flex justify-between items-center p-6 border-b border-cardBorder">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="text-primary w-6 h-6" /> {details.repo?.full_name}
            </h2>
            <p className="text-textMuted text-sm mt-1">{details.repo?.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-textMuted hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-cardBorder px-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-textMuted hover:text-white hover:border-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </motion.div>
    </div>
  );
};

export default RepoDetailsModal;
