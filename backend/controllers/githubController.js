const User = require('../models/User');
const Repository = require('../models/Repository');
const GithubService = require('../services/githubService');

// @desc    Connect GitHub account (save username & token)
// @route   POST /api/github/connect
// @access  Private
const connectGithub = async (req, res) => {
  try {
    const { githubUsername, githubToken } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.githubUsername = githubUsername || user.githubUsername;
      user.githubToken = githubToken || user.githubToken;
      
      await user.save();
      
      res.json({
        message: 'GitHub connected successfully',
        githubUsername: user.githubUsername
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's GitHub repositories
// @route   GET /api/github/repos
// @access  Private
const getGithubRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.githubUsername) {
      return res.status(400).json({ message: 'GitHub username not connected' });
    }
    
    const githubService = new GithubService(user.githubToken);
    const repos = await githubService.getUserRepos(user.githubUsername);
    
    // Check if we already have them saved
    const savedRepos = await Repository.find({ user: req.user._id });
    const savedRepoIds = savedRepos.map(repo => repo.repoId);
    
    // Format response
    const formattedRepos = repos.map(repo => ({
      repoId: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      isConnected: savedRepoIds.includes(repo.id.toString())
    }));
    
    res.json(formattedRepos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Select & save a repository
// @route   POST /api/github/repo
// @access  Private
const selectRepository = async (req, res) => {
  try {
    const { repoId, name, fullName, description, url, language, stars, forks, openIssues } = req.body;
    
    // Check if repo already exists for user
    const existingRepo = await Repository.findOne({ user: req.user._id, repoId });
    
    if (existingRepo) {
      return res.status(400).json({ message: 'Repository already connected' });
    }
    
    const repository = await Repository.create({
      user: req.user._id,
      repoId,
      name,
      fullName,
      description,
      url,
      language,
      stars,
      forks,
      openIssues
    });
    
    res.status(201).json(repository);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get connected repositories
// @route   GET /api/github/connected-repos
// @access  Private
const getConnectedRepos = async (req, res) => {
  try {
    const repositories = await Repository.find({ user: req.user._id });
    res.json(repositories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  connectGithub,
  getGithubRepos,
  selectRepository,
  getConnectedRepos
};
