const axios = require('axios');

class GithubService {
  constructor(token) {
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token && { Authorization: `token ${token}` }),
      },
    });
  }

  async getUserRepos(username) {
    try {
      const response = await this.api.get(`/users/${username}/repos?sort=updated&per_page=100`);
      return response.data;
    } catch (error) {
      console.error('Error fetching repos:', error.message);
      throw new Error('Failed to fetch user repositories from GitHub');
    }
  }

  async getRepoDetails(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch repository details');
    }
  }

  async getRepoCommits(owner, repo, since) {
    try {
      const url = since 
        ? `/repos/${owner}/${repo}/commits?since=${since}` 
        : `/repos/${owner}/${repo}/commits`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      return []; // Return empty array if no commits or error
    }
  }

  async getRepoPulls(owner, repo, state = 'all') {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/pulls?state=${state}`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async getRepoIssues(owner, repo, state = 'all') {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/issues?state=${state}`);
      // GitHub API returns PRs as issues, so we need to filter them out
      return response.data.filter(issue => !issue.pull_request);
    } catch (error) {
      return [];
    }
  }

  async getRepoContributors(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/contributors`);
      return response.data;
    } catch (error) {
      return [];
    }
  }
}

module.exports = GithubService;
