# 3D Visual Solution — Full Stack Setup & Deployment Guide
**By Uperweb | Ravi Ranjan**

---

## 📁 Project Structure

```
3dvisual-backend/
├── server.js              ← Main entry point
├── .env                   ← Environment variables (NEVER commit this)
├── package.json
├── models/
│   ├── Admin.js           ← Admin user (auto-creates default)
│   ├── Portfolio.js       ← Portfolio items
│   ├── Video.js           ← Videos
│   ├── Post.js            ← Blog posts
│   ├── Enquiry.js         ← Contact enquiries
│   └── Settings.js        ← Site settings + SEO
├── routes/
│   ├── auth.js            ← Login / change password
│   ├── portfolio.js
│   ├── videos.js
│   ├── posts.js
│   ├── enquiries.js
│   ├── settings.js        ← Studio info + SEO
│   ├── seo.js             ← sitemap.xml + robots.txt
│   └── upload.js          ← Image uploads
├── middleware/
│   └── auth.js            ← JWT token protection
└── public/
    ├── admin/
    │   ├── index.html     ← Admin panel (upload this)
    │   └── admin-api.js   ← Admin panel JS (upload this)
    ├── assets/
    │   ├── logo.png       ← Put your logo here
    │   └── frontend-dynamic.js  ← Add to frontend pages
    ├── uploads/           ← Uploaded images stored here
    └── (your HTML pages)  ← index.html, about.html, etc.
```

---

## 🖥️ STEP 1 — Local Setup

### Prerequisites
- Node.js 18+ installed → [nodejs.org](https://nodejs.org)
- MongoDB installed → [mongodb.com/try/download/community](https://mongodb.com/try/download/community)

### Install & Run Locally

```bash
# 1. Navigate to project folder
cd 3dvisual-backend

# 2. Install packages
npm install

# 3. Start MongoDB (in a separate terminal)
mongod

# 4. Start the server
npm start

# Open browser → http://localhost:3000/admin
# Login: admin@3dvisual.in | Admin@123
```

---

## 🌐 STEP 2 — Connect Your Frontend Pages

Add this ONE line before `</body>` in **every HTML page** (index.html, about.html, services.html, etc.):

```html
<script src="/assets/frontend-dynamic.js"></script>
```

For the contact form, add `id="contactForm"` to your `<form>` tag:
```html
<form id="contactForm" method="post">
  <input name="name"    type="text"  placeholder="Your Name" required>
  <input name="phone"   type="tel"   placeholder="Phone" required>
  <input name="email"   type="email" placeholder="Email">
  <input name="service" type="text"  placeholder="Service Required">
  <textarea name="message" required></textarea>
  <button type="submit">Send Enquiry</button>
</form>
```

All form submissions go directly to **Admin → Enquiries** panel.

---

## 🔑 STEP 3 — Add Your Logo

Put your logo file as:
```
public/assets/logo.png
```
The admin panel will auto-show it. Works with PNG, JPG, WebP. Recommended: 200×200px transparent PNG.

---

## 🚀 STEP 4 — Deploy to Live Server (Hostinger VPS / DigitalOcean)

### Option A — Hostinger VPS (Recommended, ~₹400/month)

```bash
# 1. SSH into your server
ssh root@YOUR_SERVER_IP

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# 4. Install PM2 (keeps server running after logout)
npm install -g pm2

# 5. Upload your project (from local machine)
scp -r ./3dvisual-backend root@YOUR_SERVER_IP:/var/www/3dvisual

# 6. On server: install packages & start
cd /var/www/3dvisual
npm install
pm2 start server.js --name "3dvisual"
pm2 save
pm2 startup
```

### Option B — Railway.app (Free tier, easiest)

1. Go to [railway.app](https://railway.app) → New Project
2. Connect GitHub → push your project to GitHub first
3. Add MongoDB plugin in Railway
4. Set Environment Variables:
   - `MONGODB_URI` → Railway gives you this automatically
   - `JWT_SECRET` → any long random string
   - `PORT` → 3000
5. Deploy → Railway gives you a `.railway.app` URL

---

## 🔒 STEP 5 — Nginx + SSL (Hostinger VPS only)

```bash
# Install Nginx
sudo apt install nginx -y

# Create site config
sudo nano /etc/nginx/sites-available/3dvisual
```

Paste this config:
```nginx
server {
    listen 80;
    server_name 3dvisual.in www.3dvisual.in;

    # Frontend + Admin
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded images
    location /uploads {
        alias /var/www/3dvisual/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Large upload support
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/3dvisual /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Free SSL via Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d 3dvisual.in -d www.3dvisual.in
```

---

## 🔧 STEP 6 — Update .env for Production

Edit `/var/www/3dvisual/.env`:
```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/3dvisual
JWT_SECRET=CHANGE_THIS_TO_SOMETHING_VERY_LONG_AND_RANDOM_2026
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://3dvisual.in,https://www.3dvisual.in
```

**Important:** Change `JWT_SECRET` to a long random string like:
`x7k2Lm9PqR4vT8wN3sJ6aE1fY5cU0dB`

---

## 🌍 STEP 7 — Point Domain to Server (Hostinger)

1. Hostinger → Domains → Manage DNS
2. **A Record** → `@` → Your Server IP
3. **A Record** → `www` → Your Server IP
4. Wait 5-30 minutes for DNS propagation

---

## 📋 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | ❌ | Admin login |
| GET | /api/portfolio/public | ❌ | Get visible portfolio |
| GET | /api/portfolio | ✅ | Get all portfolio (admin) |
| POST | /api/portfolio | ✅ | Add portfolio item |
| PUT | /api/portfolio/:id | ✅ | Update portfolio item |
| DELETE | /api/portfolio/:id | ✅ | Delete portfolio item |
| GET | /api/videos/public | ❌ | Get visible videos |
| GET | /api/posts/public | ❌ | Get published posts |
| POST | /api/enquiries/submit | ❌ | Submit contact form |
| GET | /api/enquiries | ✅ | All enquiries (admin) |
| PATCH | /api/enquiries/:id/status | ✅ | Update enquiry status |
| GET | /api/settings/public | ❌ | Get site settings |
| GET | /api/settings/seo | ❌ | Get SEO settings |
| PUT | /api/settings/seo | ✅ | Update SEO (admin) |
| POST | /api/upload/image | ✅ | Upload image |
| GET | /api/seo/sitemap.xml | ❌ | Auto-generated sitemap |
| GET | /api/seo/robots.txt | ❌ | Robots.txt |

---

## 🔐 Default Admin Credentials

**URL:** `https://3dvisual.in/admin`
**Email:** `admin@3dvisual.in`
**Password:** `Admin@123`

⚠️ **Change password immediately after first login** via Settings → Change Password

---

## 💰 Hosting Cost Summary

| Platform | Cost | Best For |
|----------|------|----------|
| Railway.app | Free (500hr/month) | Testing / Start |
| Render.com | Free (sleeps after 15min) | Testing |
| Hostinger VPS KVM1 | ~₹350/month | Production ✅ |
| DigitalOcean Droplet | ~₹600/month | Production |

**Recommendation for 3dvisual.in:** Hostinger VPS KVM1 — same provider where domain likely is, easy DNS management.

---

*Generated by Uperweb Marketing Agency — uperweb.in*
