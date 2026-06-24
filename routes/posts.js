const router  = require('express').Router();
const Post    = require('../models/Post');
const protect = require('../middleware/auth');

// Public: published posts only
router.get('/public', async (req, res) => {
  const posts = await Post.find({ status: 'published' }).sort({ createdAt: -1 }).select('-content');
  res.json(posts);
});

// Public: single post by slug (for blog page)
router.get('/public/:slug', async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, status: 'published' });
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

router.use(protect);

router.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'all' ? { status } : {};
  res.json(await Post.find(filter).sort({ createdAt: -1 }));
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await Post.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const p = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
