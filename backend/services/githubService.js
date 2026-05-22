const axios = require("axios");

const getGitHubClient = () => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GitHub token missing in backend .env");
  }

  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
};

module.exports = { getGitHubClient };
