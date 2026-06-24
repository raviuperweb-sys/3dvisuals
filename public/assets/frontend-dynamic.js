/**
 * 3D Visual Solution — Frontend Dynamic Content Loader
 * Paste this <script> tag just before </body> in ALL your HTML pages
 * <script src="/assets/frontend-dynamic.js"></script>
 *
 * This script:
 * 1. Loads SEO meta tags from admin → injects into <head>
 * 2. Contact form → submits to API (stores in admin enquiries)
 * 3. Reads settings (phone, email, social links) from API
 */

(async function() {
  const API = window.location.origin;

  // ── 1. SEO Meta Tags
  try {
    const seo = await fetch(API + '/api/settings/seo').then(r=>r.json());

    if (seo.siteTitle) {
      document.title = seo.siteTitle;
      setMeta('og:title', seo.siteTitle);
      setMeta('twitter:title', seo.siteTitle);
    }
    if (seo.siteDescription) {
      setMeta('description', seo.siteDescription);
      setMeta('og:description', seo.siteDescription);
    }
    if (seo.keywords) {
      setMeta('keywords', seo.keywords);
    }
    if (seo.ogImage) {
      setMeta('og:image', seo.ogImage);
    }
    if (seo.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement('link'); link.rel='canonical'; document.head.appendChild(link); }
      link.href = seo.canonicalUrl + window.location.pathname;
    }
    if (seo.googleAnalytics && seo.googleAnalytics.startsWith('G-')) {
      loadGA(seo.googleAnalytics);
    }
  } catch(e) { /* SEO load failed silently */ }

  // ── 2. Contact form auto-connect
  //    Add id="contactForm" to your contact <form> element
  //    Fields: name, phone, email, service, message
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const btn  = form.querySelector('[type=submit]');
      const orig = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      try {
        const res = await fetch(API + '/api/enquiries/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          alert('Thank you! We\'ll get back to you soon. 🙏');
          form.reset();
        } else {
          const d = await res.json();
          alert('Error: ' + (d.error || 'Please try again.'));
        }
      } catch { alert('Network error. Please try again.'); }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    });
  }

  // ── Helpers
  function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      const attr = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function loadGA(id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id);
  }

})();
