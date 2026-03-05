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


  /* ===== RENDER HELPERS ===== */
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

  loadEvents();


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
