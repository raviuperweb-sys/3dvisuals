const router   = require('express').Router();
const Settings = require('../models/Settings');
const Post     = require('../models/Post');
const protect  = require('../middleware/auth');

// Public: dynamic robots.txt
router.get('/robots.txt', async (req, res) => {
  const s = await Settings.getSettings();
  res.type('text/plain').send(s.seo.robotsTxt || 'User-agent: *\nAllow: /');
});

// Public: dynamic sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const s       = await Settings.getSettings();
    const base    = (s.seo.canonicalUrl || 'https://3dvisual.in').replace(/\/$/, '');
    const posts   = await Post.find({ status: 'published' }).select('slug updatedAt');
    const pages   = ['', '/services', '/portfolio', '/interior', '/exterior', '/3d-walkthrough', '/plans', '/drone-3d', '/about', '/contact'];
    const now     = new Date().toISOString();

    const urls = [
      ...pages.map(p => `
  <url>
    <loc>${base}${p}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`),
      ...posts.map(p => `
  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`),
    ];

    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
