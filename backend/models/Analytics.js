const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  repoId: {
    type: String,
    required: true,
  },
  commitCount: {
    type: Number,
    default: 0,
  },
  pullRequests: {
    type: Number,
    default: 0,
  },
  issues: {
    type: Number,
    default: 0,
  },
  aiSummary: {
    type: String,
  },
  recommendations: {
    type: [String],
    default: [],
  },
  healthScore: {
    type: Number,
    default: 100,
  },
  activeContributors: {
    type: Number,
    default: 0,
  },
  sprintCompletion: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
