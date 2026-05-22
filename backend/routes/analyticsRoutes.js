const express = require('express');
const router = express.Router();
const { 
  getAnalytics, 
  getDashboardSummary,
  getChartData
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary/all', protect, getDashboardSummary);
router.get('/:repoId', protect, getAnalytics);
router.get('/:repoId/charts', protect, getChartData);

module.exports = router;
