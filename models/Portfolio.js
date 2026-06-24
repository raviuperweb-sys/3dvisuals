const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, enum: ['exterior','interior','walkthrough','plans','drone'], required: true },
  image:    { type: String, required: true },
  client:   { type: String, default: '' },
  location: { type: String, default: '' },
  tags:     [String],
  visible:  { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
