const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  githubId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  htmlUrl: {
    type: String,
    required: true,
  },
  language: {
    type: String,
  },
  stars: {
    type: Number,
    default: 0,
  },
  forks: {
    type: Number,
    default: 0,
  },
  openIssues: {
    type: Number,
    default: 0,
  },
  private: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
  },
  watchers: {
    type: Number,
    default: 0,
  },
  defaultBranch: {
    type: String,
  },
  languages: {
    type: Object,
    default: {},
  },
  readmeSummary: {
    type: String,
  },
  createdAtGithub: {
    type: Date,
  },
  pushedAtGithub: {
    type: Date,
  },
  updatedAtGithub: {
    type: Date,
  },
  lastFetchedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const Repository = mongoose.model('Repository', repositorySchema);
module.exports = Repository;
