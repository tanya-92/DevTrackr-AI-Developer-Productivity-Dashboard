const express = require('express');
const router = express.Router();
const { 
  connectGithub, 
  getGithubRepos, 
  selectRepository,
  getConnectedRepos
} = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');

router.post('/connect', protect, connectGithub);
router.get('/repos', protect, getGithubRepos);
router.post('/repo', protect, selectRepository);
router.get('/connected-repos', protect, getConnectedRepos);

module.exports = router;
