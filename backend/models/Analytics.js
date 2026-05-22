const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  repositoryId: {
    type: String,
    required: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  metrics: {
    type: Object,
    default: {}
  },
  chartData: {
    type: Array,
    default: []
  },
  contributors: {
    type: Array,
    default: []
  },
  commits: {
    type: Array,
    default: []
  },
  pullRequests: {
    type: Array,
    default: []
  },
  issues: {
    type: Array,
    default: []
  },
  deployments: {
    type: Array,
    default: []
  },
  aiInsights: {
    type: Object,
    default: {
      summary: "",
      bottlenecks: [],
      recommendations: []
    }
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
