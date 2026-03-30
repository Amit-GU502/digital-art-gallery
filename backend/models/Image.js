const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const imageSchema = new mongoose.Schema({
  title: String,
  description: String,
  filename: String,
  createdAt: { type: Date, default: Date.now },
  comments: [commentSchema]
});

module.exports = mongoose.model('Image', imageSchema);
