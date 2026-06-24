const router   = require('express').Router();
const Settings = require('../models/Settings');
const protect  = require('../middleware/auth');

// Public: get settings for frontend to consume
router.get('/public', async (req, res) => {
  const s = await Settings.getSettings();
  // Return only what the frontend needs
  res.json({
    studioName: s.studioName,
    studioTag:  s.studioTag,
    phone:      s.phone,
    email:      s.email,
    heroH1:     s.heroH1,
    heroSub:    s.heroSub,
    heroProjects: s.heroProjects,
    heroClients:  s.heroClients,
    socials:    s.socials,
  });
});

// Public: get SEO data for a page (used by frontend <head>)
router.get('/seo', async (req, res) => {
  const s = await Settings.getSettings();
  res.json(s.seo);
});

router.use(protect);

// GET full settings (admin)
router.get('/', async (req, res) => {
  res.json(await Settings.getSettings());
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const s = await Settings.findByIdAndUpdate('global', req.body, { new: true, upsert: true, runValidators: true });
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT update SEO only
router.put('/seo', async (req, res) => {
  try {
    const s = await Settings.findByIdAndUpdate('global', { seo: req.body }, { new: true, upsert: true });
    res.json(s.seo);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
