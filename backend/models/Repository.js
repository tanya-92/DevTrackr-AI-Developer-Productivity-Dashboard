const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  repoId: {
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
  description: {
    type: String,
  },
  url: {
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
  }
}, {
  timestamps: true,
});

const Repository = mongoose.model('Repository', repositorySchema);
module.exports = Repository;
