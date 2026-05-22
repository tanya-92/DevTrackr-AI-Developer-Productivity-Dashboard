const User = require("../models/User");
const Repository = require("../models/Repository");
const Analytics = require("../models/Analytics");
const { getGitHubClient } = require("../services/githubService");
const AiService = require("../services/aiService");

const connectGitHub = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "GitHub username is required" });
    }

    const github = getGitHubClient();

    const profileRes = await github.get(`/users/${username}`);
    const reposRes = await github.get(`/users/${username}/repos?sort=updated&per_page=100`);

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        githubUsername: username,
      });
    }

    return res.status(200).json({
      message: "GitHub connected successfully",
      profile: profileRes.data,
      repos: reposRes.data,
    });
  } catch (error) {
    console.error("GitHub connect error:", error.response?.data || error.message);

    if (error.message === "GitHub token missing in backend .env") {
      return res.status(500).json({ message: error.message });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({ message: "GitHub user not found" });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({ message: "Invalid GitHub token in backend .env" });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({ message: "GitHub API rate limit or permission issue" });
    }

    return res.status(500).json({
      message: "Failed to connect GitHub",
      error: error.message,
    });
  }
};

const disconnectGithub = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.githubUsername = '';
      await user.save();
      return res.status(200).json({ message: "GitHub disconnected successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRepos = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ message: "GitHub username is required" });
    }
    
    const github = getGitHubClient();
    const reposRes = await github.get(`/users/${username}/repos?sort=updated&per_page=100`);
    
    const formattedRepos = reposRes.data.map(repo => ({
      repoId: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count
    }));
    
    return res.status(200).json(formattedRepos);
  } catch (error) {
    if (error.message === "GitHub token missing in backend .env") {
      return res.status(500).json({ message: error.message });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "GitHub user not found" });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ message: "GitHub API rate limit exceeded" });
    }
    return res.status(500).json({ message: error.message || "Failed to fetch repositories" });
  }
};

const getRepoAnalytics = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const github = getGitHubClient();

    const [repoDetailsRes, commits, pulls, issues, contributors] = await Promise.allSettled([
      github.get(`/repos/${owner}/${repo}`),
      github.get(`/repos/${owner}/${repo}/commits`),
      github.get(`/repos/${owner}/${repo}/pulls?state=all`),
      github.get(`/repos/${owner}/${repo}/issues?state=all`),
      github.get(`/repos/${owner}/${repo}/contributors`)
    ]);

    const repoDetails = repoDetailsRes.status === "fulfilled" ? repoDetailsRes.value.data : { name: repo, owner: { login: owner } };
    const commitsData = commits.status === "fulfilled" ? commits.value.data : [];
    const pullsData = pulls.status === "fulfilled" ? pulls.value.data : [];
    const allIssues = issues.status === "fulfilled" ? issues.value.data : [];
    const contributorsData = contributors.status === "fulfilled" ? contributors.value.data : [];

    // Filter out PRs from issues (GitHub API returns PRs as issues)
    const issuesData = allIssues.filter(issue => !issue.pull_request);

    const openIssuesCount = issuesData.filter(i => i.state === "open").length;
    const closedIssuesCount = issuesData.filter(i => i.state === "closed").length;
    const openPullsCount = pullsData.filter(p => p.state === "open").length;
    const mergedPullsCount = pullsData.filter(p => p.state === "closed" && p.merged_at).length;
    
    const healthScore = Math.round(Math.max(0, 100 - (openIssuesCount / (closedIssuesCount + 1)) * 10));
    const sprintCompletion = Math.round(Math.min(100, (mergedPullsCount / (openPullsCount + mergedPullsCount || 1)) * 100));

    const aiService = new AiService();
    const insights = await aiService.generateRepositoryInsights(
      repoDetails, 
      commitsData, 
      pullsData, 
      issuesData
    );

    const repository = await Repository.findOne({ fullName: `${owner}/${repo}`, user: req.user._id });
    
    if (repository) {
      let analytics = await Analytics.findOne({ repoId: repository.repoId, user: req.user._id });
      if (analytics) {
        analytics.commitCount = commitsData.length;
        analytics.pullRequests = pullsData.length;
        analytics.issues = issuesData.length;
        analytics.activeContributors = contributorsData.length;
        analytics.aiSummary = insights.summary;
        // Keep recommendations array compatibility 
        analytics.recommendations = insights.recommendations || [];
        analytics.healthScore = healthScore;
        analytics.sprintCompletion = sprintCompletion;
        await analytics.save();
      } else {
        await Analytics.create({
          user: req.user._id,
          repoId: repository.repoId,
          commitCount: commitsData.length,
          pullRequests: pullsData.length,
          issues: issuesData.length,
          activeContributors: contributorsData.length,
          aiSummary: insights.summary,
          recommendations: insights.recommendations || [],
          healthScore: healthScore,
          sprintCompletion: sprintCompletion
        });
      }
    }

    return res.status(200).json({
      repo: {
        name: repoDetails.name,
        owner: repoDetails.owner?.login || owner,
        language: repoDetails.language,
        stars: repoDetails.stargazers_count || 0,
        forks: repoDetails.forks_count || 0
      },
      metrics: {
        totalCommits: commitsData.length,
        totalPullRequests: pullsData.length,
        openPullRequests: openPullsCount,
        mergedPullRequests: mergedPullsCount,
        totalIssues: issuesData.length,
        openIssues: openIssuesCount,
        closedIssues: closedIssuesCount,
        contributorsCount: contributorsData.length,
        healthScore,
        sprintCompletion
      },
      chartData: {
        commitActivity: [],
        prActivity: [],
        issueActivity: []
      },
      contributors: contributorsData.slice(0, 5),
      recentCommits: commitsData.slice(0, 5),
      aiInsights: {
        summary: insights.summary,
        bottlenecks: insights.bottlenecks || [],
        recommendations: insights.recommendations || []
      }
    });

  } catch (error) {
    if (error.message === "GitHub token missing in backend .env") {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Failed to fetch analytics" });
  }
};

module.exports = {
  connectGitHub,
  disconnectGithub,
  getRepos,
  getRepoAnalytics
};
