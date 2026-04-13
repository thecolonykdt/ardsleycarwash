/* ================================================
   THE ARDSLEY CARWASH — Production JavaScript
   ================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ===== SITE CONTENT OVERRIDES (from PocketBase) =====
  async function applySiteContentOverrides() {
    if (!APP_CONFIG.POCKETBASE_URL) return;
    try {
      const res = await fetch(
        `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records?perPage=200&fields=content_key,content_value`
      );
      if (!res.ok) return;
      const data = await res.json();
      const map = {};
      (data.items || []).forEach(r => { map[r.content_key] = r.content_value; });

      document.querySelectorAll('[data-content-key]').forEach(el => {
        const key = el.dataset.contentKey;
        if (!(key in map)) return;
        const val = map[key];
        const type = el.dataset.contentType || 'plain';

        if (type === 'html') {
          el.innerHTML = val;
        } else if (type === 'text-node') {
          // Preserve child nodes (e.g. SVG icon in FAQ buttons) — only update first text node
          let textNode = null;
          el.childNodes.forEach(node => {
            if (!textNode && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              textNode = node;
            }
          });
          if (textNode) {
            textNode.textContent = '\n          ' + val + '\n          ';
          }
        } else {
          el.textContent = val;
        }
      });
    } catch (err) {
      console.warn('[content] Failed to load site overrides:', err);
    }
  }

  await applySiteContentOverrides();

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });


  // ===== MOBILE MENU =====
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function closeMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('open');
    if (mobileOverlay) mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMenu);
  }

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });


  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  // ===== FAQ ACCORDION =====
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });

      // Toggle current
      item.classList.toggle('active', !isActive);
    });
  });


  // ===== BOOKING FORM =====
  const bookingForm = document.getElementById('bookingForm');
  const confirmation = document.getElementById('bookingConfirmation');
  const bookAgain = document.getElementById('bookAgain');

  if (bookingForm) {
    const dateInput = document.getElementById('date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = bookingForm.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const payload = {
        name:             document.getElementById('name').value.trim(),
        contact:          document.getElementById('contact').value.trim(),
        preferred_date:   document.getElementById('date').value || null,
        preferred_time:   document.getElementById('time').value || null,
        detailing_service: document.getElementById('service').value || null,
        message:          (document.getElementById('message').value || '').trim(),
        status:           'new',
      };

      if (APP_CONFIG.POCKETBASE_URL) {
        try {
          const res = await fetch(apiUrl(APP_CONFIG.COLLECTIONS.BOOKINGS), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          // Fire-and-forget notification email — won't block the confirmation
          emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
            name:             payload.name,
            contact:          payload.contact,
            preferred_date:   payload.preferred_date    || 'Not specified',
            preferred_time:   payload.preferred_time    || 'Not specified',
            detailing_service: payload.detailing_service || 'Not specified',
            message:          payload.message           || 'No message',
          }).catch(err => console.warn('EmailJS notification failed:', err));
        } catch (err) {
          console.error('Booking submit error:', err);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          alert('Something went wrong. Please call us at (914) 693-2200 or email theardsleycarwash@gmail.com.');
          return;
        }
      }

      bookingForm.style.display = 'none';
      confirmation.classList.add('visible');
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (bookAgain) {
    bookAgain.addEventListener('click', () => {
      const submitBtn = bookingForm.querySelector('[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Request';
      bookingForm.reset();
      bookingForm.style.display = '';
      confirmation.classList.remove('visible');
    });
  }


  // ===== NEWSLETTER FORM =====
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      const btn = newsletterForm.querySelector('button');
      const originalText = btn.textContent;
      const email = input.value.trim();

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


  // ===== BACK TO TOP =====
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  // ===== SCROLL ANIMATIONS (Intersection Observer) =====
  const animatedElements = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.getAttribute('data-delay') || 0;
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, parseInt(delay));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    animatedElements.forEach(el => el.classList.add('animated'));
  }


  // ===== COUNTER ANIMATION =====
  const counters = document.querySelectorAll('[data-count]');

  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-count'));
          const isDecimal = target % 1 !== 0;
          const duration = 2000;
          const startTime = performance.now();

          function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out curve
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = target * ease;

            if (isDecimal) {
              el.textContent = current.toFixed(1);
            } else if (target >= 1000) {
              el.textContent = Math.floor(current).toLocaleString() + '+';
            } else {
              el.textContent = Math.floor(current) + '+';
            }

            if (progress < 1) {
              requestAnimationFrame(updateCount);
            }
          }

          requestAnimationFrame(updateCount);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }


  // ===== ACTIVE NAV LINK HIGHLIGHTING =====
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  }, { passive: true });

  // ===== PROMO BANNER =====
  const promoBanner = document.getElementById('promoBanner');
  const promoBannerClose = document.getElementById('promoBannerClose');
  if (promoBanner && promoBannerClose) {
    if (sessionStorage.getItem('promoBannerDismissed')) {
      promoBanner.classList.add('hidden');
    }
    promoBannerClose.addEventListener('click', function() {
      promoBanner.classList.add('hidden');
      sessionStorage.setItem('promoBannerDismissed', '1');
    });
  }

  // ===== PROMO POPUP =====
  const promoOverlay = document.getElementById('promoOverlay');
  if (promoOverlay && !sessionStorage.getItem('promoDismissed')) {
    const promoClose = document.getElementById('promoClose');
    const promoCta = document.getElementById('promoCta');
    let promoShown = false;

    function showPromo() {
      if (promoShown) return;
      promoShown = true;
      promoOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      clearTimeout(promoTimer);
      window.removeEventListener('scroll', promoScrollCheck);
    }

    function hidePromo() {
      promoOverlay.classList.remove('active');
      document.body.style.overflow = '';
      sessionStorage.setItem('promoDismissed', '1');
    }

    // Trigger: 50% scroll
    function promoScrollCheck() {
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct >= 0.5) showPromo();
    }
    window.addEventListener('scroll', promoScrollCheck, { passive: true });

    // Trigger: 30s delay
    const promoTimer = setTimeout(showPromo, 30000);

    // Dismiss: close button
    promoClose.addEventListener('click', hidePromo);

    // Dismiss: click overlay background
    promoOverlay.addEventListener('click', function(e) {
      if (e.target === promoOverlay) hidePromo();
    });

    // Dismiss: Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && promoOverlay.classList.contains('active')) hidePromo();
    });

    // Dismiss after CTA click (with slight delay to allow scroll)
    promoCta.addEventListener('click', function() {
      setTimeout(hidePromo, 300);
    });
  }

  // ===== COMMUNITY PARTNERS ANIMATION =====
  (function () {
    const track = document.querySelector('.hp-track');
    if (!track) return;
    const scenes = () => track.querySelectorAll('.hp-scene');

    // --- Pause on hover (desktop) ---
    track.addEventListener('mouseenter', () =>
      scenes().forEach(s => s.style.animationPlayState = 'paused'));
    track.addEventListener('mouseleave', () =>
      scenes().forEach(s => s.style.animationPlayState = 'running'));

    // --- Click → open partner URL ---
    track.addEventListener('click', e => {
      const badge = e.target.closest('[data-url]');
      if (badge) window.open(badge.dataset.url, '_blank', 'noopener noreferrer');
    });

    // --- Touch swipe (mobile) ---
    let touchStartX = 0;
    let snapshots = [];
    let dragging = false;

    function getTranslateX(el) {
      return new DOMMatrix(getComputedStyle(el).transform).m41;
    }

    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      snapshots = [...scenes()].map(s => {
        const x = getTranslateX(s);
        s.style.animationPlayState = 'paused';
        s.style.transform = `translateX(${x}px)`;
        return x;
      });
      dragging = true;
    }, { passive: true });

    track.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      [...scenes()].forEach((s, i) => {
        s.style.transform = `translateX(${snapshots[i] + dx}px)`;
      });
    }, { passive: true });

    track.addEventListener('touchend', e => {
      if (!dragging) return;
      dragging = false;
      const vw = window.innerWidth;
      [...scenes()].forEach(s => {
        const currentX = getTranslateX(s);
        const sceneWidth = s.offsetWidth;
        const from = vw * 1.1;
        const to = -sceneWidth;
        const progress = Math.max(0, Math.min(1, (from - currentX) / (from - to)));
        s.style.transform = '';
        s.style.animationDelay = `${-(progress * 24)}s`;
        s.style.animationPlayState = 'running';
      });
    }, { passive: true });
  })();


  // ===== ANNOUNCEMENT WIDGET =====
  (async function () {
    const ANN_KEY     = 'announcement_widget';
    const DISMISS_KEY = 'annWidgetDismissed';
    const widget      = document.getElementById('annWidget');
    if (!widget || sessionStorage.getItem(DISMISS_KEY)) return;

    // Load config from PocketBase
    let cfg = null;
    if (APP_CONFIG.POCKETBASE_URL) {
      try {
        const res = await fetch(
          `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records?filter=(content_key='${ANN_KEY}')&perPage=1`
        );
        if (res.ok) {
          const data = await res.json();
          const record = (data.items || [])[0];
          if (record) cfg = JSON.parse(record.content_value);
        }
      } catch (_) {}
    }

    if (!cfg) return;
    const hasContent = cfg.icon || cfg.heading || cfg.body || cfg.btnLabel || cfg.videoUrl;
    if (!hasContent) return;

    // Build widget HTML
    let html = `<button class="ann-widget-x" id="annWidgetClose" aria-label="Close">&times;</button>`;

    if (cfg.icon) {
      const isUrl = cfg.icon.startsWith('http') || cfg.icon.startsWith('/');
      html += `<div class="ann-widget-icon">${isUrl ? `<img src="${cfg.icon}" alt="">` : cfg.icon}</div>`;
    }
    if (cfg.heading)  html += `<h3 class="ann-widget-heading">${cfg.heading}</h3>`;
    if (cfg.videoUrl) html += `<div class="ann-widget-video"><iframe src="${cfg.videoUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    if (cfg.body)     html += `<div class="ann-widget-body">${cfg.body}</div>`;
    if (cfg.btnLabel) {
      const href = cfg.btnUrl || '#';
      html += `<a href="${href}" class="ann-widget-btn">${cfg.btnLabel}</a>`;
    }

    widget.innerHTML = html;
    widget.classList.remove('hidden');

    // Trigger entrance animation after next paint
    requestAnimationFrame(() => requestAnimationFrame(() => widget.classList.add('visible')));

    // Close button
    document.getElementById('annWidgetClose').addEventListener('click', () => {
      widget.classList.remove('visible');
      sessionStorage.setItem(DISMISS_KEY, '1');
      setTimeout(() => widget.classList.add('hidden'), 350);
    });
  })();

});
