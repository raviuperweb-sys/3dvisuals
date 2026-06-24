const router  = require('express').Router();
const Video   = require('../models/Video');
const protect = require('../middleware/auth');

// Public
router.get('/public', async (req, res) => {
  const items = await Video.find({ visible: true }).sort({ createdAt: -1 });
  res.json(items);
});

router.use(protect);

router.get('/', async (req, res) => {
  res.json(await Video.find().sort({ createdAt: -1 }));
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await Video.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const v = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!v) return res.status(404).json({ error: 'Not found' });
    res.json(v);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  await Video.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
