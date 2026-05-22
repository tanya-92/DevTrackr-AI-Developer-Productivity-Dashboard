const express = require("express");
const router = express.Router();
const {
  connectGitHub,
  getRepos,
  getRepoAnalytics,
  disconnectGithub
} = require("../controllers/githubController");

const { protect } = require("../middleware/authMiddleware");

router.post("/connect", protect, connectGitHub);
router.post("/disconnect", protect, disconnectGithub);
router.get("/repos/:username", protect, getRepos);
router.get("/repo/:owner/:repo/analytics", protect, getRepoAnalytics);

module.exports = router;
