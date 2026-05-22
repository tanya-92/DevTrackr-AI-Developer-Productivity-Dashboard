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
        connectedAt: new Date()
      });
    }

    // Persist repos in MongoDB
    if (req.user && reposRes.data && Array.isArray(reposRes.data)) {
      const ops = reposRes.data.map(repo => ({
        updateOne: {
          filter: { githubId: repo.id.toString(), userId: req.user._id },
          update: {
            $set: {
              userId: req.user._id,
              githubId: repo.id.toString(),
              name: repo.name,
              fullName: repo.full_name,
              owner: repo.owner.login,
              htmlUrl: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              openIssues: repo.open_issues_count,
              private: repo.private,
              updatedAtGithub: repo.updated_at
            }
          },
          upsert: true
        }
      }));
      if (ops.length > 0) {
        await Repository.bulkWrite(ops);
      }
    }
    
    // Fetch newly saved repos from DB
    const savedRepos = await Repository.find({ userId: req.user._id }).sort({ updatedAtGithub: -1 });

    return res.status(200).json({
      message: "GitHub connected successfully",
      profile: profileRes.data,
      repos: savedRepos,
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
    const repos = await Repository.find({ userId: req.user._id }).sort({ updatedAtGithub: -1 });
    
    // Map repos back to the format the frontend expects (or frontend can just use the DB schema)
    // The previous frontend expected repoId, name, fullName, description, url, language, stars, forks, openIssues
    const formattedRepos = repos.map(repo => ({
      repoId: repo.githubId,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description || "",
      url: repo.htmlUrl,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues
    }));
    
    return res.status(200).json(formattedRepos);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch repositories from database" });
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

    const repository = await Repository.findOne({ fullName: `${owner}/${repo}`, userId: req.user._id });
    
    const analyticsPayload = {
      userId: req.user._id,
      repositoryId: repository ? repository.githubId : repo,
      repoName: repoDetails.name,
      owner: repoDetails.owner?.login || owner,
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
      chartData: [],
      contributors: contributorsData.slice(0, 5),
      recentCommits: commitsData.slice(0, 5),
      aiInsights: {
        summary: insights.summary,
        bottlenecks: insights.bottlenecks || [],
        recommendations: insights.recommendations || []
      },
      analyzedAt: new Date()
    };

    if (repository) {
      await Analytics.findOneAndUpdate(
        { repositoryId: repository.githubId, userId: req.user._id },
        { $set: analyticsPayload },
        { upsert: true, new: true }
      );
    } else {
      await Analytics.create(analyticsPayload);
    }

    return res.status(200).json(analyticsPayload);

  } catch (error) {
    if (error.message === "GitHub token missing in backend .env") {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Failed to fetch analytics" });
  }
};

const testGithub = async (req, res) => {
  try {
    const { username } = req.params;
    const github = getGitHubClient();
    const response = await github.get(`/users/${username}`);
    res.json(response.data);
  } catch (error) {
    console.error("Direct GitHub Test Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

module.exports = {
  connectGitHub,
  disconnectGithub,
  getRepos,
  getRepoAnalytics,
  testGithub
};
