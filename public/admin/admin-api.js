// ══════════════════════════════════════════════════════════════
//  3D Visual Solution — Admin Panel JavaScript (API-connected)
//  Replaces localStorage with real Node.js + MongoDB backend
// ══════════════════════════════════════════════════════════════

// ── API base URL (auto-detects same-origin)
const API = window.location.origin;

// ── Token storage
const AUTH = {
  get:    ()    => localStorage.getItem('3dv_token'),
  set:    (t)   => localStorage.setItem('3dv_token', t),
  remove: ()    => localStorage.removeItem('3dv_token'),
};

// ── Universal fetch wrapper
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = AUTH.get();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);

  const res  = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Upload image to server
async function uploadImageFile(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(API + '/api/upload/image', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + AUTH.get() },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return API + data.url;
}

// ── Helpers
function uid()        { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function toYTEmbed(url) {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? 'https://www.youtube.com/embed/' + m[1] : url;
}
function toast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = (type==='success'?'✓ ':type==='error'?'✗ ':'ℹ ') + msg;
  t.className = 'show ' + type;
  clearTimeout(t._to);
  t._to = setTimeout(() => t.className = '', 3500);
}
function loading(id, show, label='Loading…') {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.opacity = show ? '0.5' : '1';
  el.style.pointerEvents = show ? 'none' : '';
}

// ══════════ AUTH ══════════
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const err      = document.getElementById('loginErr');
  const btn      = document.querySelector('.btn-login');
  err.style.display = 'none';
  btn.textContent = 'Signing in…';
  btn.disabled = true;
  try {
    const { token, admin } = await api('POST', '/api/auth/login', { email, password });
    AUTH.set(token);
    localStorage.setItem('3dv_admin_name', admin.name || admin.email);
    showApp(admin.name || admin.email);
  } catch (e) {
    err.textContent = e.message === 'Invalid credentials' ? 'Incorrect email or password.' : e.message;
    err.style.display = 'block';
  }
  btn.textContent = 'Sign In →';
  btn.disabled = false;
}

function showApp(name) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').classList.add('show');
  const n = name || localStorage.getItem('3dv_admin_name') || 'Admin';
  document.getElementById('adminName').textContent = n;
  document.getElementById('adminInitial').textContent = n[0].toUpperCase();
  nav('dashboard');
}

function logout() {
  AUTH.remove();
  localStorage.removeItem('3dv_admin_name');
  document.getElementById('appShell').classList.remove('show');
  document.getElementById('loginScreen').style.display = 'flex';
}

// ── On page load: check if already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = AUTH.get();
  if (token) {
    // Verify token is still valid
    api('GET', '/api/auth/me')
      .then(admin => showApp(admin.name || admin.email))
      .catch(() => { AUTH.remove(); });
  }
  // Enter key on login
  ['loginEmail','loginPass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
  });
});

// ══════════ NAVIGATION ══════════
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  portfolio: 'Portfolio',
  videos:    'Videos',
  posts:     'Blog Posts',
  enquiries: 'Enquiries',
  settings:  'Settings',
  seo:       '🔍 SEO Manager',
};

function nav(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-'+page);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(page.replace('-',' '))) n.classList.add('active');
  });
  document.getElementById('pageHeading').textContent = PAGE_TITLES[page] || page;
  document.getElementById('topbarActions').innerHTML = '';

  if (page === 'dashboard')  loadDashboard();
  if (page === 'portfolio')  loadPortfolio('all');
  if (page === 'videos')     loadVideos();
  if (page === 'posts')      loadPosts('all');
  if (page === 'enquiries')  loadEnquiries('all');
  if (page === 'settings')   loadSettingsPage();
  if (page === 'seo')        loadSeoPage();
}

// ══════════ DASHBOARD ══════════
async function loadDashboard() {
  try {
    const [portfolio, videos, posts, enquiries] = await Promise.all([
      api('GET', '/api/portfolio'),
      api('GET', '/api/videos'),
      api('GET', '/api/posts'),
      api('GET', '/api/enquiries'),
    ]);
    const newEnqs = enquiries.filter(e => e.status === 'new');

    document.getElementById('sPort').textContent   = portfolio.length;
    document.getElementById('sVid').textContent    = videos.length;
    document.getElementById('sPosts').textContent  = posts.length;
    document.getElementById('sNewEnq').textContent = newEnqs.length;

    // Badge
    const badge = document.getElementById('newBadge');
    if (newEnqs.length > 0) { badge.style.display=''; badge.textContent = newEnqs.length; }
    else badge.style.display = 'none';

    // Recent enquiries
    const tbody = document.getElementById('dashEnqTable');
    const recent = enquiries.slice(0,5);
    tbody.innerHTML = recent.length ? recent.map(e => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td><a href="tel:${e.phone}" style="color:var(--orange)">${e.phone}</a></td>
        <td>${e.service||'—'}</td>
        <td>${fmtDate(e.createdAt)}</td>
        <td><span class="badge ${e.status==='new'?'badge-orange':e.status==='replied'?'badge-green':'badge-gray'}">${e.status}</span></td>
      </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px">No enquiries yet</td></tr>';

  } catch(e) { toast('Dashboard load error: '+e.message,'error'); }
}

// ══════════ PORTFOLIO ══════════
let portFilter = 'all';
async function filterPortfolio(cat, btn) {
  document.querySelectorAll('#page-portfolio .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  portFilter = cat;
  loadPortfolio(cat);
}

async function loadPortfolio(cat) {
  const grid = document.getElementById('portGrid');
  grid.innerHTML = '<p style="color:var(--gray);padding:20px">Loading…</p>';
  try {
    const url = cat && cat!=='all' ? `/api/portfolio?cat=${cat}` : '/api/portfolio';
    const items = await api('GET', url);
    if (!items.length) { grid.innerHTML = '<p style="color:var(--gray);padding:20px">No items found. Add one above.</p>'; return; }
    grid.innerHTML = items.map(item => `
      <div class="port-card">
        <div class="port-card-img">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" loading="lazy">` : `<div class="placeholder-img"><div class="ico">🖼️</div><span>No image</span></div>`}
          ${!item.visible ? '<div class="port-hidden-overlay">Hidden</div>' : ''}
        </div>
        <div class="port-card-body">
          <h4 title="${item.title}">${item.title}</h4>
          <div class="cat">${item.category}${item.location?' · '+item.location:''}</div>
          <div class="port-card-actions">
            <button class="btn btn-outline btn-sm" onclick="editPortItem('${item._id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePortItem('${item._id}')">Delete</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { grid.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

async function addPortItem() {
  const title   = document.getElementById('pTitle').value.trim();
  const cat     = document.getElementById('pCat').value;
  const image   = document.getElementById('pUrl').value.trim();
  const client  = document.getElementById('pClient').value.trim();
  const location= document.getElementById('pLocation').value.trim();
  const tags    = document.getElementById('pTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const visible = document.getElementById('pVisible').value === 'true';
  if (!title) { toast('Title required','error'); return; }
  if (!image) { toast('Image URL required','error'); return; }
  try {
    await api('POST','/api/portfolio',{title,category:cat,image,client,location,tags,visible});
    toast('Portfolio item added! ✅');
    ['pTitle','pUrl','pClient','pLocation','pTags'].forEach(id=>document.getElementById(id).value='');
    loadPortfolio(portFilter);
  } catch(e) { toast(e.message,'error'); }
}

async function handlePortImg(input) {
  const file = input.files[0]; if (!file) return;
  try {
    toast('Uploading image…','info');
    const url = await uploadImageFile(file);
    document.getElementById('pUrl').value = url;
    toast('Image uploaded! ✅');
  } catch(e) { toast('Upload failed: '+e.message,'error'); }
}

async function editPortItem(id) {
  try {
    const items = await api('GET','/api/portfolio');
    const item  = items.find(i=>i._id===id);
    if (!item) return;
    const newTitle = prompt('Project title:', item.title);
    if (!newTitle) return;
    const newVis = confirm('Show on website? (OK = Yes, Cancel = Hidden)');
    await api('PUT','/api/portfolio/'+id, { ...item, title: newTitle, visible: newVis });
    toast('Updated ✅');
    loadPortfolio(portFilter);
  } catch(e) { toast(e.message,'error'); }
}

async function deletePortItem(id) {
  if (!confirm('Delete this portfolio item permanently?')) return;
  try {
    await api('DELETE','/api/portfolio/'+id);
    toast('Deleted');
    loadPortfolio(portFilter);
  } catch(e) { toast(e.message,'error'); }
}

// ══════════ VIDEOS ══════════
async function loadVideos() {
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '<p style="color:var(--gray);padding:20px">Loading…</p>';
  try {
    const items = await api('GET','/api/videos');
    if (!items.length) { grid.innerHTML='<p style="color:var(--gray);padding:20px">No videos yet. Add one above.</p>'; return; }
    grid.innerHTML = items.map(v => `
      <div class="video-card">
        <div class="video-thumb">
          ${toYTEmbed(v.url) ? `<iframe src="${toYTEmbed(v.url)}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:8px"></iframe>` : '<div style="color:var(--gray);font-size:.75rem;text-align:center">No video URL</div>'}
        </div>
        <div class="video-info">
          <div class="video-title">${v.title}</div>
          <div style="font-size:.72rem;color:var(--gray);margin-bottom:8px">${v.category} ${v.home?'· Featured on Homepage':''}</div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-danger btn-sm" onclick="deleteVideo('${v._id}')">Delete</button>
            <button class="btn btn-outline btn-sm" onclick="toggleVideoHome('${v._id}',${!v.home})">${v.home?'Unfeature':'Feature'}</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { grid.innerHTML=`<p style="color:var(--red)">${e.message}</p>`; }
}

async function addVideo() {
  const title = document.getElementById('vTitle').value.trim();
  const url   = document.getElementById('vUrl').value.trim();
  if (!title) { toast('Title required','error'); return; }
  if (!url)   { toast('Video URL required','error'); return; }
  try {
    await api('POST','/api/videos',{
      title,
      url,
      category: document.getElementById('vCat').value,
      home:     document.getElementById('vHome').value === 'true',
      desc:     document.getElementById('vDesc').value.trim(),
    });
    toast('Video added! ✅');
    ['vTitle','vUrl','vDesc'].forEach(id=>document.getElementById(id).value='');
    loadVideos();
  } catch(e) { toast(e.message,'error'); }
}

async function deleteVideo(id) {
  if (!confirm('Delete this video?')) return;
  try { await api('DELETE','/api/videos/'+id); toast('Deleted'); loadVideos(); }
  catch(e) { toast(e.message,'error'); }
}

async function toggleVideoHome(id, home) {
  try { await api('PUT','/api/videos/'+id,{home}); loadVideos(); }
  catch(e) { toast(e.message,'error'); }
}

// ══════════ BLOG POSTS ══════════
let currentPostFilter = 'all';
async function filterPosts(f, btn) {
  document.querySelectorAll('#page-posts .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentPostFilter = f;
  loadPosts(f);
}

async function loadPosts(filter) {
  const tbody = document.getElementById('postsTable');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px">Loading…</td></tr>';
  try {
    const url   = filter && filter!=='all' ? `/api/posts?status=${filter}` : '/api/posts';
    const posts = await api('GET', url);
    if (!posts.length) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px">No posts found</td></tr>'; return; }
    tbody.innerHTML = posts.map(p => `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td>${p.category||'—'}</td>
        <td><span class="badge ${p.status==='published'?'badge-green':'badge-gray'}">${p.status}</span></td>
        <td>${fmtDate(p.createdAt)}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" onclick="editPost('${p._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePost('${p._id}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML=`<tr><td colspan="5" style="color:var(--red);padding:20px">${e.message}</td></tr>`; }
}

function newPost() {
  document.getElementById('editPostId').value = '';
  ['postTitle','postExcerpt','postContent','postImage','postTags','postSeoTitle','postSeoDesc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('postAuthor').value = '3D Visual Team';
  document.getElementById('postStatus').value = 'draft';
  document.getElementById('postImagePrev').style.display='none';
  document.getElementById('editorHeading').textContent = 'New Post';
  document.getElementById('postListView').style.display = 'none';
  document.getElementById('postEditorView').style.display = 'block';
}

async function editPost(id) {
  try {
    const posts = await api('GET','/api/posts');
    const p = posts.find(x=>x._id===id);
    if (!p) return;
    document.getElementById('editPostId').value    = p._id;
    document.getElementById('postTitle').value     = p.title;
    document.getElementById('postExcerpt').value   = p.excerpt||'';
    document.getElementById('postContent').value   = p.content;
    document.getElementById('postImage').value     = p.image||'';
    document.getElementById('postCat').value       = p.category||'Blog';
    document.getElementById('postStatus').value    = p.status;
    document.getElementById('postTags').value      = (p.tags||[]).join(', ');
    document.getElementById('postAuthor').value    = p.author||'3D Visual Team';
    document.getElementById('postSeoTitle').value  = p.seo?.title||'';
    document.getElementById('postSeoDesc').value   = p.seo?.description||'';
    const prev = document.getElementById('postImagePrev');
    if (p.image) { prev.src=p.image; prev.style.display='block'; } else prev.style.display='none';
    document.getElementById('editorHeading').textContent = 'Edit Post';
    document.getElementById('postListView').style.display = 'none';
    document.getElementById('postEditorView').style.display = 'block';
  } catch(e) { toast(e.message,'error'); }
}

function cancelEditor() {
  document.getElementById('postListView').style.display = 'block';
  document.getElementById('postEditorView').style.display = 'none';
  loadPosts(currentPostFilter);
}

async function handleBlogImg(input) {
  const file = input.files[0]; if (!file) return;
  try {
    toast('Uploading…','info');
    const url = await uploadImageFile(file);
    document.getElementById('postImage').value = url;
    const prev = document.getElementById('postImagePrev');
    prev.src = url; prev.style.display='block';
    toast('Image uploaded ✅');
  } catch(e) { toast('Upload failed: '+e.message,'error'); }
}

async function savePost() {
  const id      = document.getElementById('editPostId').value;
  const title   = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  if (!title)   { toast('Title required','error'); return; }
  if (!content) { toast('Content required','error'); return; }
  const postData = {
    title,
    excerpt:  document.getElementById('postExcerpt').value.trim(),
    content,
    image:    document.getElementById('postImage').value.trim(),
    category: document.getElementById('postCat').value,
    status:   document.getElementById('postStatus').value,
    tags:     document.getElementById('postTags').value.split(',').map(t=>t.trim()).filter(Boolean),
    author:   document.getElementById('postAuthor').value.trim(),
    seo: {
      title:       document.getElementById('postSeoTitle').value.trim(),
      description: document.getElementById('postSeoDesc').value.trim(),
    },
  };
  try {
    if (id) { await api('PUT','/api/posts/'+id,postData); toast('Post updated ✅'); }
    else    { await api('POST','/api/posts',postData);    toast('Post saved ✅'); }
    cancelEditor();
    loadDashboard();
  } catch(e) { toast(e.message,'error'); }
}

async function deletePost(id) {
  if (!confirm('Delete this post permanently?')) return;
  try { await api('DELETE','/api/posts/'+id); toast('Deleted'); loadPosts(currentPostFilter); loadDashboard(); }
  catch(e) { toast(e.message,'error'); }
}

// ══════════ ENQUIRIES ══════════
async function filterEnq(f, btn) {
  document.querySelectorAll('#page-enquiries .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadEnquiries(f);
}

async function loadEnquiries(filter) {
  const tbody = document.getElementById('enqTable');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:20px">Loading…</td></tr>';
  try {
    const url  = filter && filter!=='all' ? `/api/enquiries?status=${filter}` : '/api/enquiries';
    const enqs = await api('GET', url);
    if (!enqs.length) { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:32px">No enquiries found</td></tr>'; return; }
    tbody.innerHTML = enqs.map(e => `
      <tr style="${e.status==='new'?'background:rgba(245,166,35,.03)':''}">
        <td><strong>${e.name}</strong></td>
        <td><a href="tel:${e.phone}" style="color:var(--orange)">${e.phone}</a></td>
        <td>${e.email?`<a href="mailto:${e.email}" style="color:var(--gray)">${e.email}</a>`:'—'}</td>
        <td>${e.service||'—'}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.message}">${e.message}</td>
        <td>${fmtDate(e.createdAt)}</td>
        <td><span class="badge ${e.status==='new'?'badge-orange':e.status==='replied'?'badge-green':'badge-gray'}">${e.status}</span></td>
        <td>
          <select style="background:var(--dark3);color:var(--white);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:.73rem;cursor:pointer"
                  onchange="updateEnqStatus('${e._id}',this.value)">
            <option ${e.status==='new'?'selected':''} value="new">New</option>
            <option ${e.status==='read'?'selected':''} value="read">Read</option>
            <option ${e.status==='replied'?'selected':''} value="replied">Replied</option>
          </select>
        </td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML=`<tr><td colspan="8" style="color:var(--red);padding:20px">${e.message}</td></tr>`; }
}

async function updateEnqStatus(id, status) {
  try {
    await api('PATCH','/api/enquiries/'+id+'/status',{status});
    toast(`Marked as "${status}"`);
    loadDashboard();
  } catch(e) { toast(e.message,'error'); }
}

// ══════════ SETTINGS ══════════
async function loadSettingsPage() {
  try {
    const s = await api('GET','/api/settings');
    const setVal = (id,v) => { const el=document.getElementById(id); if(el&&v!==undefined) el.value=v; };
    setVal('studioName',   s.studioName);
    setVal('studioTag',    s.studioTag);
    setVal('studioPhone',  s.phone);
    setVal('studioEmail',  s.email);
    setVal('heroH1',       s.heroH1);
    setVal('heroSub',      s.heroSub);
    setVal('heroProjects', s.heroProjects);
    setVal('heroClients',  s.heroClients);
    setVal('socIg', s.socials?.ig||'');
    setVal('socYt', s.socials?.yt||'');
    setVal('socFb', s.socials?.fb||'');
    setVal('socLi', s.socials?.li||'');
  } catch(e) { toast('Error loading settings: '+e.message,'error'); }
}

async function saveSettings() {
  const getVal = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
  try {
    await api('PUT','/api/settings',{
      studioName:   getVal('studioName'),
      studioTag:    getVal('studioTag'),
      phone:        getVal('studioPhone'),
      email:        getVal('studioEmail'),
      heroH1:       getVal('heroH1'),
      heroSub:      getVal('heroSub'),
      heroProjects: getVal('heroProjects'),
      heroClients:  getVal('heroClients'),
      socials: {
        ig: getVal('socIg'),
        yt: getVal('socYt'),
        fb: getVal('socFb'),
        li: getVal('socLi'),
      }
    });
    toast('Settings saved ✅ Live on website!');
  } catch(e) { toast(e.message,'error'); }
}

async function changePassword() {
  const cur  = document.getElementById('curPass').value;
  const nw   = document.getElementById('newPass').value;
  const conf = document.getElementById('confPass').value;
  if (!cur || !nw) { toast('Fill all fields','error'); return; }
  if (nw !== conf) { toast('Passwords do not match','error'); return; }
  if (nw.length < 6) { toast('Min 6 characters','error'); return; }
  try {
    await api('POST','/api/auth/change-password',{ currentPassword: cur, newPassword: nw });
    ['curPass','newPass','confPass'].forEach(id=>document.getElementById(id).value='');
    toast('Password updated ✅');
  } catch(e) { toast(e.message,'error'); }
}

// ══════════ SEO ══════════
async function loadSeoPage() {
  try {
    const s = await api('GET','/api/settings');
    const seo = s.seo || {};
    const setVal = (id,v) => { const el=document.getElementById(id); if(el&&v!==undefined) el.value=v; };
    setVal('seoSiteTitle', seo.siteTitle);
    setVal('seoSiteDesc',  seo.siteDescription);
    setVal('seoKeywords',  seo.keywords);
    setVal('seoCanonical', seo.canonicalUrl);
    setVal('seoOgImage',   seo.ogImage);
    setVal('seoGA',        seo.googleAnalytics);
    setVal('seoRobots',    seo.robotsTxt);

    // OG image preview
    if (seo.ogImage) {
      document.getElementById('seoOgPreview').style.display='block';
      document.getElementById('seoOgImg').src = seo.ogImage;
    }

    // Description character counter
    const desc = document.getElementById('seoSiteDesc');
    const counter = document.getElementById('seoDescCount');
    const updateCount = () => { counter.textContent = (desc.value||'').length + '/160 characters'; counter.style.color = desc.value.length > 160 ? 'var(--red)' : 'var(--gray)'; };
    updateCount();
    desc.oninput = updateCount;
  } catch(e) { toast('Error loading SEO settings','error'); }
}

async function saveSeo() {
  const getVal = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
  try {
    await api('PUT','/api/settings/seo',{
      siteTitle:       getVal('seoSiteTitle'),
      siteDescription: getVal('seoSiteDesc'),
      keywords:        getVal('seoKeywords'),
      canonicalUrl:    getVal('seoCanonical'),
      ogImage:         getVal('seoOgImage'),
      googleAnalytics: getVal('seoGA'),
      robotsTxt:       document.getElementById('seoRobots')?.value || 'User-agent: *\nAllow: /',
    });
    toast('SEO settings saved ✅');

    // Update OG preview
    const ogUrl = getVal('seoOgImage');
    if (ogUrl) {
      document.getElementById('seoOgPreview').style.display='block';
      document.getElementById('seoOgImg').src = ogUrl;
    }
  } catch(e) { toast(e.message,'error'); }
}

function openPreview() {
  window.open('https://3dvisual.in', '_blank');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('postEditorView').style.display === 'block') {
    cancelEditor();
  }
});
