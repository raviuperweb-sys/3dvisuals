const router    = require('express').Router();
const Portfolio = require('../models/Portfolio');
const protect   = require('../middleware/auth');

// Public: GET visible portfolio (for frontend)
router.get('/public', async (req, res) => {
  try {
    const { cat } = req.query;
    const filter = { visible: true };
    if (cat && cat !== 'all') filter.category = cat;
    const items = await Portfolio.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Protected routes below
router.use(protect);

// GET all (admin)
router.get('/', async (req, res) => {
  const { cat } = req.query;
  const filter = cat && cat !== 'all' ? { category: cat } : {};
  res.json(await Portfolio.find(filter).sort({ order: 1, createdAt: -1 }));
});

// POST create
router.post('/', async (req, res) => {
  try {
    const item = await Portfolio.create(req.body);
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const item = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
