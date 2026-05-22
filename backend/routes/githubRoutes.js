const express = require("express");
const router = express.Router();
const {
  connectGitHub,
  getRepos,
  getRepoDetails,
  getRepoAnalytics,
  disconnectGithub
} = require("../controllers/githubController");

const { protect } = require("../middleware/authMiddleware");

router.post("/connect", protect, connectGitHub);
router.delete("/disconnect", protect, disconnectGithub);
router.get("/repos/:username", protect, getRepos);
router.get("/repo/:owner/:repo/details", protect, getRepoDetails);
router.get("/repo/:owner/:repo/analytics", protect, getRepoAnalytics);

// Direct test route without auth
const { testGithub } = require("../controllers/githubController");
router.get("/test/:username", testGithub);

module.exports = router;
