const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  excerpt:  { type: String, default: '' },
  content:  { type: String, required: true },
  image:    { type: String, default: '' },
  category: { type: String, default: 'General' },
  status:   { type: String, enum: ['published','draft'], default: 'draft' },
  tags:     [String],
  author:   { type: String, default: '3D Visual Team' },
  slug:     { type: String, unique: true, sparse: true },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
}, { timestamps: true });

// Auto-generate slug from title
postSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
