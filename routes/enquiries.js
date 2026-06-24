const router   = require('express').Router();
const Enquiry  = require('../models/Enquiry');
const protect  = require('../middleware/auth');

// Public: submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, phone, email, service, message } = req.body;
    if (!name || !phone || !message) return res.status(400).json({ error: 'Name, phone and message are required' });
    const enq = await Enquiry.create({ name, phone, email, service, message });
    res.status(201).json({ success: true, id: enq._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.use(protect);

// GET all (admin) with optional filter
router.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'all' ? { status } : {};
  const enqs = await Enquiry.find(filter).sort({ createdAt: -1 });
  res.json(enqs);
});

// PATCH status
router.patch('/:id/status', async (req, res) => {
  try {
    const enq = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!enq) return res.status(404).json({ error: 'Not found' });
    res.json(enq);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Count new
router.get('/count/new', async (req, res) => {
  const count = await Enquiry.countDocuments({ status: 'new' });
  res.json({ count });
});

module.exports = router;
