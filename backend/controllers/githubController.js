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
      languages: repo.languages || {},
      watchers: repo.watchers || 0,
      defaultBranch: repo.defaultBranch || 'main',
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues
    }));
    
    return res.status(200).json(formattedRepos);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch repositories from database" });
  }
};

const getRepoDetails = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const github = getGitHubClient();

    const [
      repoDetailsRes,
      languagesRes,
      commitsRes,
      pullsRes,
      issuesRes,
      contributorsRes,
      deploymentsRes,
      readmeRes
    ] = await Promise.allSettled([
      github.get(`/repos/${owner}/${repo}`),
      github.get(`/repos/${owner}/${repo}/languages`),
      github.get(`/repos/${owner}/${repo}/commits?per_page=100`),
      github.get(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`),
      github.get(`/repos/${owner}/${repo}/issues?state=all&per_page=100`),
      github.get(`/repos/${owner}/${repo}/contributors?per_page=100`),
      github.get(`/repos/${owner}/${repo}/deployments?per_page=100`),
      github.get(`/repos/${owner}/${repo}/readme`)
    ]);

    const repoDetails = repoDetailsRes.status === "fulfilled" ? repoDetailsRes.value.data : null;
    if (!repoDetails) {
      return res.status(404).json({ message: "Repository not found or access denied" });
    }

    const languages = languagesRes.status === "fulfilled" ? languagesRes.value.data : {};
    const commits = commitsRes.status === "fulfilled" ? commitsRes.value.data.map(c => ({
      message: c.commit?.message,
      authorName: c.commit?.author?.name,
      authorUsername: c.author?.login,
      date: c.commit?.author?.date,
      sha: c.sha,
      url: c.html_url
    })) : [];
    
    const pullRequests = pullsRes.status === "fulfilled" ? pullsRes.value.data.map(p => ({
      title: p.title,
      state: p.state,
      createdAt: p.created_at,
      mergedAt: p.merged_at,
      user: p.user?.login,
      url: p.html_url
    })) : [];

    const allIssues = issuesRes.status === "fulfilled" ? issuesRes.value.data : [];
    const issues = allIssues.filter(i => !i.pull_request).map(i => ({
      title: i.title,
      state: i.state,
      labels: i.labels?.map(l => l.name) || [],
      createdAt: i.created_at,
      closedAt: i.closed_at,
      user: i.user?.login,
      url: i.html_url
    }));

    const contributors = contributorsRes.status === "fulfilled" ? contributorsRes.value.data.map(c => ({
      username: c.login,
      avatar: c.avatar_url,
      contributions: c.contributions,
      profileUrl: c.html_url
    })) : [];

    const deployments = deploymentsRes.status === "fulfilled" ? deploymentsRes.value.data.map(d => ({
      environment: d.environment,
      state: d.state || 'N/A',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      sha: d.sha,
      url: d.url
    })) : [];

    let readme = { readmeContent: "README not found" };
    if (readmeRes.status === "fulfilled") {
      const data = readmeRes.value.data;
      const buff = Buffer.from(data.content, 'base64');
      readme = {
        readmeName: data.name,
        readmeContent: buff.toString('utf-8'),
        readmeHtml: data.html_url,
        readmeUrl: data.html_url
      };
    }

    // Update Repository Model
    await Repository.findOneAndUpdate(
      { githubId: repoDetails.id.toString(), userId: req.user._id },
      { 
        $set: {
          watchers: repoDetails.watchers_count,
          defaultBranch: repoDetails.default_branch,
          visibility: repoDetails.visibility,
          createdAtGithub: repoDetails.created_at,
          pushedAtGithub: repoDetails.pushed_at,
          languages,
          readmeSummary: readme.readmeContent.substring(0, 200),
          lastFetchedAt: new Date()
        }
      },
      { new: true }
    );

    // Update Analytics Model
    await Analytics.findOneAndUpdate(
      { repositoryId: repoDetails.id.toString(), userId: req.user._id },
      {
        $set: {
          commits,
          pullRequests,
          issues,
          contributors,
          deployments,
          analyzedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      repo: repoDetails,
      languages,
      commits,
      pullRequests,
      issues,
      contributors,
      deployments,
      readme
    });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch detailed repository data" });
  }
};

const getRepoAnalytics = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const github = getGitHubClient();

    const [
      repoDetailsRes,
      languagesRes,
      commitsRes,
      pullsRes,
      issuesRes,
      contributorsRes,
      deploymentsRes,
      readmeRes
    ] = await Promise.allSettled([
      github.get(`/repos/${owner}/${repo}`),
      github.get(`/repos/${owner}/${repo}/languages`),
      github.get(`/repos/${owner}/${repo}/commits`),
      github.get(`/repos/${owner}/${repo}/pulls?state=all`),
      github.get(`/repos/${owner}/${repo}/issues?state=all`),
      github.get(`/repos/${owner}/${repo}/contributors`),
      github.get(`/repos/${owner}/${repo}/deployments`),
      github.get(`/repos/${owner}/${repo}/readme`)
    ]);

    const repoDetails = repoDetailsRes.status === "fulfilled" ? repoDetailsRes.value.data : { name: repo, owner: { login: owner } };
    const languagesData = languagesRes.status === "fulfilled" ? languagesRes.value.data : {};
    const commitsData = commitsRes.status === "fulfilled" ? commitsRes.value.data : [];
    const pullsData = pullsRes.status === "fulfilled" ? pullsRes.value.data : [];
    const allIssues = issuesRes.status === "fulfilled" ? issuesRes.value.data : [];
    const contributorsData = contributorsRes.status === "fulfilled" ? contributorsRes.value.data : [];
    const deploymentsData = deploymentsRes.status === "fulfilled" ? deploymentsRes.value.data : [];
    
    let readmeData = { content: "" };
    if (readmeRes.status === "fulfilled") {
      const buff = Buffer.from(readmeRes.value.data.content, 'base64');
      readmeData.content = buff.toString('utf-8');
    }

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
      issuesData,
      languagesData,
      contributorsData,
      deploymentsData,
      readmeData
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
  getRepoDetails,
  getRepoAnalytics,
  testGithub
};
