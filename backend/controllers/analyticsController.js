const Analytics = require('../models/Analytics');
const Repository = require('../models/Repository');
const User = require('../models/User');
const GithubService = require('../services/githubService');
const AiService = require('../services/aiService');

// @desc    Get analytics for a repository (and generate if not exists or old)
// @route   GET /api/analytics/:repoId
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { repoId } = req.params;
    
    // Find the repository in DB
    const repository = await Repository.findOne({ repoId, user: req.user._id });
    
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found or not connected' });
    }
    
    // Check if we have recent analytics (within last 24 hours)
    const recentAnalytics = await Analytics.findOne({ 
      repoId, 
      user: req.user._id,
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentAnalytics) {
      return res.json(recentAnalytics);
    }
    
    // Generate new analytics
    const user = await User.findById(req.user._id);
    const githubService = new GithubService();
    
    // Fetch data from GitHub
    const owner = repository.fullName.split('/')[0];
    const repoName = repository.name;
    
    const [commits, pulls, issues, contributors] = await Promise.all([
      githubService.getRepoCommits(owner, repoName),
      githubService.getRepoPulls(owner, repoName, 'all'),
      githubService.getRepoIssues(owner, repoName, 'all'),
      githubService.getRepoContributors(owner, repoName)
    ]);
    
    // Use AI service to generate insights
    const aiService = new AiService();
    const insights = await aiService.generateRepositoryInsights(repository, commits, pulls, issues);
    
    // Save or update analytics
    let analytics = await Analytics.findOne({ repoId, user: req.user._id });
    
    if (analytics) {
      analytics.commitCount = commits.length;
      analytics.pullRequests = pulls.length;
      analytics.issues = issues.length;
      analytics.activeContributors = contributors.length;
      analytics.aiSummary = insights.summary;
      analytics.recommendations = insights.recommendations;
      analytics.healthScore = insights.healthScore;
      analytics.sprintCompletion = insights.sprintCompletion;
      
      await analytics.save();
    } else {
      analytics = await Analytics.create({
        user: req.user._id,
        repoId,
        commitCount: commits.length,
        pullRequests: pulls.length,
        issues: issues.length,
        activeContributors: contributors.length,
        aiSummary: insights.summary,
        recommendations: insights.recommendations,
        healthScore: insights.healthScore,
        sprintCompletion: insights.sprintCompletion
      });
    }
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard summary (aggregate analytics for all connected repos)
// @route   GET /api/analytics/summary/all
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const analytics = await Analytics.find({ user: req.user._id });
    
    if (!analytics || analytics.length === 0) {
      return res.json({
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        averageHealthScore: 0,
        averageSprintCompletion: 0,
        reposAnalyzed: 0
      });
    }
    
    const summary = analytics.reduce((acc, curr) => {
      acc.totalCommits += curr.commitCount;
      acc.totalPullRequests += curr.pullRequests;
      acc.totalIssues += curr.issues;
      acc.totalHealthScore += curr.healthScore;
      acc.totalSprintCompletion += curr.sprintCompletion;
      return acc;
    }, { 
      totalCommits: 0, 
      totalPullRequests: 0, 
      totalIssues: 0, 
      totalHealthScore: 0, 
      totalSprintCompletion: 0 
    });
    
    const count = analytics.length;
    
    res.json({
      totalCommits: summary.totalCommits,
      totalPullRequests: summary.totalPullRequests,
      totalIssues: summary.totalIssues,
      averageHealthScore: Math.round(summary.totalHealthScore / count),
      averageSprintCompletion: Math.round(summary.totalSprintCompletion / count),
      reposAnalyzed: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chart data for a repository (mock data for commits over time since Github API requires multiple calls for this)
// @route   GET /api/analytics/:repoId/charts
// @access  Private
const getChartData = async (req, res) => {
  try {
    // Generate mock chart data for demonstration purposes
    // In a real app, you would aggregate actual commit timestamps
    const generateActivityData = () => {
      const data = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        data.push({
          name: days[i],
          commits: Math.floor(Math.random() * 20) + 1,
          prs: Math.floor(Math.random() * 5),
          issues: Math.floor(Math.random() * 8)
        });
      }
      return data;
    };

    res.json(generateActivityData());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getDashboardSummary,
  getChartData
};
