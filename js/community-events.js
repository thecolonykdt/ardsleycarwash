/* ================================================
   COMMUNITY & EVENTS PAGE — JS
   The Ardsley Carwash
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ===== SCROLL ANIMATIONS ===== */
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `[data-animate].animated { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(styleSheet);

  function setupAnimations() {
    const animatables = document.querySelectorAll('[data-animate]:not(.animated)');
    if (!animatables.length || !('IntersectionObserver' in window)) {
      animatables.forEach(el => el.classList.add('animated'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => entry.target.classList.add('animated'), parseInt(delay));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    animatables.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
      observer.observe(el);
    });
  }
  setupAnimations();


  /* ===== TAG COLOR MAP ===== */
  const TAG_CLASSES = {
    'Fundraiser':  'ce-tag--fundraiser',
    'Festival':    'ce-tag--festival',
    'School':      'ce-tag--school',
    'Sponsorship': 'ce-tag--sponsorship',
  };


  /* ===== RENDER HELPERS — TEAMS & PARTNERS ===== */
  function fileUrl(record, filename) {
    return `${APP_CONFIG.POCKETBASE_URL}/api/files/${record.collectionName}/${record.id}/${filename}`;
  }

  function renderTeamCard(team, index) {
    const logoHtml = team.logo
      ? `<img src="${fileUrl(team, team.logo)}" alt="${team.name}" class="ce-card-logo"/>`
      : '';
    const linkHtml = team.link
      ? `<div class="ce-card-footer">
          <a href="${team.link}" target="_blank" rel="noopener" class="ce-card-link">
            Visit Website
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        </div>` : '';
    return `
      <div class="ce-card" data-animate data-delay="${index * 80}">
        <div class="ce-card-logo-wrap">${logoHtml}</div>
        <div class="ce-card-body">
          <h3>${team.name}</h3>
          ${team.description ? `<p>${team.description}</p>` : ''}
        </div>
        ${linkHtml}
      </div>`;
  }

  function renderPartnerCard(partner, index) {
    const logoHtml = partner.logo
      ? `<img src="${fileUrl(partner, partner.logo)}" alt="${partner.name}" class="ce-card-logo"/>`
      : '';
    const linkHtml = partner.link
      ? `<div class="ce-card-footer">
          <a href="${partner.link}" target="_blank" rel="noopener" class="ce-card-link">
            Visit Website
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        </div>` : '';
    return `
      <div class="ce-card ce-card--partner" data-animate data-delay="${index * 80}">
        <div class="ce-card-logo-wrap">${logoHtml}</div>
        <div class="ce-card-body">
          <h3>${partner.name}</h3>
          ${partner.description ? `<p class="ce-card-desc">${partner.description}</p>` : ''}
        </div>
        ${linkHtml}
      </div>`;
  }


  /* ===== LOAD TEAMS FROM API ===== */
  async function loadTeams() {
    if (!APP_CONFIG.POCKETBASE_URL) return;
    const grid = document.getElementById('teamsGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="ce-events-loading">Loading teams…</p>';
    try {
      const res = await fetch(`${apiUrl(APP_CONFIG.COLLECTIONS.TEAMS)}?filter=(status='active')&sort=name&perPage=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.items || [];
      grid.innerHTML = records.length
        ? records.map((t, i) => renderTeamCard(t, i)).join('')
        : '<p class="ce-events-empty">Check back soon for team updates!</p>';
      setupAnimations();
    } catch (err) {
      console.error('Teams load error:', err);
    }
  }


  /* ===== LOAD PARTNERS FROM API ===== */
  async function loadPartners() {
    if (!APP_CONFIG.POCKETBASE_URL) return;
    const grid = document.getElementById('partnersGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="ce-events-loading">Loading partners…</p>';
    try {
      const res = await fetch(`${apiUrl(APP_CONFIG.COLLECTIONS.PARTNERS)}?filter=(status='active')&sort=name&perPage=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.items || [];
      grid.innerHTML = records.length
        ? records.map((p, i) => renderPartnerCard(p, i)).join('')
        : '<p class="ce-events-empty">Check back soon for partner updates!</p>';
      setupAnimations();
    } catch (err) {
      console.error('Partners load error:', err);
    }
  }


  /* ===== RENDER HELPERS — EVENTS ===== */
  function formatDate(dateStr) {
    // dateStr from PocketBase: "2025-06-14 00:00:00.000Z" or "2025-06-14"
    const d = new Date(dateStr);
    return {
      month: d.toLocaleString('en-US', { month: 'short' }),
      day:   d.getDate(),
      year:  d.getFullYear(),
    };
  }

  function renderEventCard(ev) {
    const { month, day, year } = formatDate(ev.date);
    const isPast = ev.status === 'past';
    const tagClass = TAG_CLASSES[ev.tag] || 'ce-tag--sponsorship';

    const timeHtml = ev.time_start
      ? `<span class="ce-event-time">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${ev.time_start}${ev.time_end ? ` – ${ev.time_end}` : ''}
        </span>` : '';

    const locHtml = ev.location
      ? `<span class="ce-event-loc">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${ev.location}
        </span>` : '';

    const ctaHtml = isPast
      ? `<span class="ce-event-past-badge">Completed</span>`
      : ev.cta_url
        ? `<a href="${ev.cta_url}" target="_blank" rel="noopener" class="btn btn-primary">
            ${ev.cta_label || 'Learn More'}
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
           </a>`
        : '';

    const tagHtml = ev.tag ? `<span class="ce-tag ${tagClass}">${ev.tag}</span>` : '';

    return `
      <article class="ce-event-card${isPast ? ' ce-event-card--past' : ''}" data-status="${ev.status}" data-animate>
        <div class="ce-event-date${isPast ? ' ce-event-date--past' : ''}">
          <span class="ce-event-month">${month}</span>
          <span class="ce-event-day">${day}</span>
          <span class="ce-event-year">${year}</span>
        </div>
        <div class="ce-event-body">
          <div class="ce-event-meta">
            ${tagHtml}
            ${timeHtml}
            ${locHtml}
          </div>
          <h4 class="ce-event-title">${ev.title}</h4>
          ${ev.description ? `<p class="ce-event-desc">${ev.description}</p>` : ''}
        </div>
        <div class="ce-event-cta">${ctaHtml}</div>
      </article>`;
  }

  function renderFallbackEvents() {
    // Static fallback so the page isn't empty before PocketBase is live
    const upcomingList = document.querySelector('#upcomingEvents .ce-events-list');
    const pastList     = document.querySelector('#pastEvents .ce-events-list');
    if (upcomingList) upcomingList.innerHTML = `
      <p class="ce-events-empty">Check back soon for upcoming events!</p>`;
    if (pastList) pastList.innerHTML = '';
  }


  /* ===== LOAD EVENTS FROM API ===== */
  async function loadEvents() {
    if (!APP_CONFIG.POCKETBASE_URL) {
      // No backend configured yet — leave the hardcoded HTML in place
      return;
    }

    const upcomingList = document.querySelector('#upcomingEvents .ce-events-list');
    const pastList     = document.querySelector('#pastEvents .ce-events-list');

    // Show loading skeleton
    if (upcomingList) upcomingList.innerHTML = '<p class="ce-events-loading">Loading events…</p>';
    if (pastList)     pastList.innerHTML     = '';

    try {
      const url = `${apiUrl(APP_CONFIG.COLLECTIONS.EVENTS)}?sort=-date&perPage=50`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.items || [];

      const upcoming = records.filter(e => e.status === 'upcoming');
      const past     = records.filter(e => e.status === 'past');

      if (upcomingList) {
        upcomingList.innerHTML = upcoming.length
          ? upcoming.map(renderEventCard).join('')
          : '<p class="ce-events-empty">Check back soon for upcoming events!</p>';
      }
      if (pastList) {
        pastList.innerHTML = past.length
          ? past.map(renderEventCard).join('')
          : '';
      }

      // Wire up animations for newly rendered cards
      setupAnimations();

    } catch (err) {
      console.error('Events load error:', err);
      renderFallbackEvents();
    }
  }

  /* ===== GALLERY ===== */

  // Predefined gallery tags and their color keys
  const GALLERY_TAG_COLORS = {
    'Event':            'blue',
    'Sponsorship':      'red',
    'Community':        'green',
    'Behind the Scenes':'yellow',
    'Fundraiser':       'purple',
    'Holiday':          'orange',
    'Team':             'navy',
  };

  // Assign varied size classes based on index for visual interest
  const GALLERY_SPANS = [
    'ce-gallery-item--big',   // 0 — 2×2
    '',                        // 1 — 1×1
    'ce-gallery-item--tall',  // 2 — 1×2
    '',                        // 3 — 1×1
    '',                        // 4 — 1×1
    'ce-gallery-item--wide',  // 5 — 2×1
    '',                        // 6 — 1×1
    'ce-gallery-item--tall',  // 7 — 1×2
    '',                        // 8 — 1×1
    'ce-gallery-item--wide',  // 9 — 2×1
    '',                        // 10 — 1×1
    '',                        // 11 — 1×1
  ];

  function renderGalleryItem(photo, imageName, index) {
    const src      = fileUrl(photo, imageName);
    const alt      = photo.alt_text || photo.caption || 'Community photo';
    const caption  = photo.caption || '';
    const span     = GALLERY_SPANS[index % GALLERY_SPANS.length] || '';
    const tag      = photo.tag || '';
    const tagColor = GALLERY_TAG_COLORS[tag] || 'blue';
    const tagHtml  = tag
      ? `<span class="ce-gallery-tag ce-gallery-tag--${tagColor}">${tag}</span>`
      : '';

    return `
      <div class="ce-gallery-item ${span}" data-animate data-delay="${Math.min(index, 5) * 60}"
           data-src="${src}" data-caption="${caption.replace(/"/g, '&quot;')}" tabindex="0" role="button" aria-label="View photo${caption ? ': ' + caption : ''}">
        <img src="${src}" alt="${alt}" loading="lazy"/>
        ${tagHtml}
        <div class="ce-gallery-overlay">
          <svg class="ce-gallery-overlay-icon" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          ${caption ? `<span class="ce-gallery-overlay-caption">${caption}</span>` : ''}
        </div>
      </div>`;
  }

  async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    if (!APP_CONFIG.POCKETBASE_URL) {
      grid.innerHTML = '<p class="ce-gallery-empty">Photo gallery coming soon!</p>';
      return;
    }

    const max = APP_CONFIG.GALLERY_MAX || 12;
    try {
      const res = await fetch(`${apiUrl(APP_CONFIG.COLLECTIONS.GALLERY)}?sort=-created&perPage=${max}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const photos = data.items || [];

      // Expand multi-image records into individual items, cap at GALLERY_MAX
      const items = [];
      for (const photo of photos) {
        const images = Array.isArray(photo.image) ? photo.image : (photo.image ? [photo.image] : []);
        for (const img of images) {
          items.push({ photo, img });
          if (items.length >= max) break;
        }
        if (items.length >= max) break;
      }

      grid.innerHTML = items.length
        ? items.map(({ photo, img }, i) => renderGalleryItem(photo, img, i)).join('')
        : '<p class="ce-gallery-empty">Photos coming soon — check back!</p>';

      setupAnimations();
    } catch (err) {
      console.error('Gallery load error:', err);
      grid.innerHTML = '<p class="ce-gallery-empty">Photos coming soon — check back!</p>';
    }
  }

  // Lightbox
  function initLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    const lbImg    = document.getElementById('lightboxImg');
    const lbCap    = document.getElementById('lightboxCaption');
    const lbClose  = document.getElementById('lightboxClose');
    if (!lightbox) return;

    function openLightbox(src, caption) {
      lbImg.src = src;
      lbImg.alt = caption || '';
      lbCap.textContent = caption || '';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    document.getElementById('galleryGrid').addEventListener('click', e => {
      const item = e.target.closest('.ce-gallery-item');
      if (!item) return;
      openLightbox(item.dataset.src, item.dataset.caption);
    });

    document.getElementById('galleryGrid').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const item = e.target.closest('.ce-gallery-item');
        if (item) { e.preventDefault(); openLightbox(item.dataset.src, item.dataset.caption); }
      }
    });

    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }

  loadGallery().then(initLightbox);

  loadEvents();
  loadTeams();
  loadPartners();


  /* ===== EVENT FILTER TABS ===== */
  const filterBtns      = document.querySelectorAll('.ce-filter-btn');
  const upcomingGroup   = document.getElementById('upcomingEvents');
  const pastGroup       = document.getElementById('pastEvents');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      if (filter === 'all') {
        upcomingGroup && upcomingGroup.classList.remove('ce-hidden');
        pastGroup     && pastGroup.classList.remove('ce-hidden');
      } else if (filter === 'upcoming') {
        upcomingGroup && upcomingGroup.classList.remove('ce-hidden');
        pastGroup     && pastGroup.classList.add('ce-hidden');
      } else if (filter === 'past') {
        upcomingGroup && upcomingGroup.classList.add('ce-hidden');
        pastGroup     && pastGroup.classList.remove('ce-hidden');
      }
    });
  });


  /* ===== NEWSLETTER FORM ===== */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      const btn   = newsletterForm.querySelector('button');
      const email = input.value.trim();
      const originalText = btn.textContent;

      btn.disabled = true;
      btn.textContent = '…';

      if (APP_CONFIG.POCKETBASE_URL) {
        try {
          const res = await fetch(apiUrl(APP_CONFIG.COLLECTIONS.NEWSLETTER), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
          console.error('Newsletter submit error:', err);
          btn.disabled = false;
          btn.textContent = originalText;
          return;
        }
      }

      btn.textContent = 'Done!';
      btn.style.background = '#2ecc71';
      btn.style.color = '#fff';
      input.value = '';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 3000);
    });
  }


  /* ===== PARTNER BADGE CLICKS (hero strip) ===== */
  document.querySelectorAll('.hp-badge[data-url]').forEach(badge => {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', () => {
      window.open(badge.dataset.url, '_blank', 'noopener');
    });
  });

});
