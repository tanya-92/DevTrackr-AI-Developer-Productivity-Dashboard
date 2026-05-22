const express = require('express');
const router = express.Router();
const { 
  getAnalytics, 
  getLatestAnalytics,
  getChartData
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/latest', protect, getLatestAnalytics);
router.get('/:repoId', protect, getAnalytics);
router.get('/:repoId/charts', protect, getChartData);

module.exports = router;
