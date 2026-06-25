require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Security headers (relax CSP for admin panel fonts/icons)
app.use(helmet({
  contentSecurityPolicy: false
}));

// ── CORS — allow your domain in production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting on auth
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try later.' } }));

// ── Static files  (serve admin panel + uploads)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/videos',    require('./routes/videos'));
app.use('/api/posts',     require('./routes/posts'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/upload',    require('./routes/upload'));
app.use('/api/seo',       require('./routes/seo'));

// ── API health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ── Catch-all: serve admin panel for /admin/* routes
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/admin/', (_, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));

// ── Connect MongoDB then start
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3dvisual')
  .then(async () => {
    console.log('✅ MongoDB connected');
    await require('./models/Admin').ensureDefaultAdmin();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

module.exports = app;
