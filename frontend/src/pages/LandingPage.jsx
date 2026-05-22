import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, GitBranch, BarChart2, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px]" />

      <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="text-primary h-8 w-8" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            DevTrackr
          </span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="btn-secondary">Log in</Link>
          <Link to="/signup" className="btn-primary">Sign up</Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            AI-Powered Developer <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Productivity Dashboard
            </span>
          </h1>
          <p className="text-xl text-textMuted mb-10 max-w-2xl mx-auto">
            Connect your GitHub repositories, get real-time insights, track sprint progress, 
            and receive AI-generated recommendations to improve your team's workflow.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Connect GitHub
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="glass-card p-6 text-left">
            <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart2 className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Deep Analytics</h3>
            <p className="text-textMuted">Track commits, pull requests, issues, and contributor activity in beautiful, responsive charts.</p>
          </div>
          <div className="glass-card p-6 text-left border-primary/30">
            <div className="bg-secondary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-secondary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Insights</h3>
            <p className="text-textMuted">Get automated summaries and actionable recommendations based on your repository's recent activity.</p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="bg-accent/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="text-accent w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Repository Health</h3>
            <p className="text-textMuted">Monitor your sprint completion and overall code health score with real-time GitHub integration.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
