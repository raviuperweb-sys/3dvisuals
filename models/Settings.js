const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  _id:          { type: String, default: 'global' },
  studioName:   { type: String, default: '3D Visual Solution' },
  studioTag:    { type: String, default: 'Photo-Realistic Architectural Renders' },
  phone:        { type: String, default: '+91 88673 75534' },
  email:        { type: String, default: 'info@3dvisuals.in' },
  heroH1:       { type: String, default: 'Transform Concepts into Stunning Photo-Realistic Architectural Renders' },
  heroSub:      { type: String, default: 'We specialise in high-quality 3D visualisations — exterior & interior rendering, walkthroughs, floor plans, drone + 3D.' },
  heroProjects: { type: String, default: '500+' },
  heroClients:  { type: String, default: '200+' },
  socials: {
    ig: { type: String, default: '' },
    yt: { type: String, default: '' },
    fb: { type: String, default: '' },
    li: { type: String, default: '' },
  },
  seo: {
    siteTitle:       { type: String, default: '3D Visual Solution — Photo-Realistic Architectural Renders' },
    siteDescription: { type: String, default: 'We create stunning 3D exterior, interior, walkthrough, floor plan and drone renders for architects, developers and builders across India.' },
    keywords:        { type: String, default: '3D rendering, architectural visualization, exterior rendering, interior rendering, 3D walkthrough, floor plans, Bengaluru' },
    ogImage:         { type: String, default: '' },
    googleAnalytics: { type: String, default: '' },
    canonicalUrl:    { type: String, default: 'https://3dvisual.in' },
    robotsTxt:       { type: String, default: 'User-agent: *\nAllow: /' },
  },
}, { timestamps: true });

// Helper: get or create the single settings doc
settingsSchema.statics.getSettings = async function() {
  let s = await this.findById('global');
  if (!s) s = await this.create({ _id: 'global' });
  return s;
};

module.exports = mongoose.model('Settings', settingsSchema);
