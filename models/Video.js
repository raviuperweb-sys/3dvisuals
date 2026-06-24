const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  url:      { type: String, required: true },
  category: { type: String, default: 'walkthrough' },
  desc:     { type: String, default: '' },
  home:     { type: Boolean, default: false },
  visible:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
