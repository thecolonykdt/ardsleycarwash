/* ================================================
   COMMUNITY & EVENTS PAGE — JS
   The Ardsley Carwash
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ===== SCROLL ANIMATIONS ===== */
  const animatables = document.querySelectorAll('[data-animate]');

  if (animatables.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, parseInt(delay));
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

    document.addEventListener('animationAdded', (e) => {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    });
  }

  // Trigger animation on class add
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    [data-animate].animated {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(styleSheet);


  /* ===== EVENT FILTER TABS ===== */
  const filterBtns = document.querySelectorAll('.ce-filter-btn');
  const upcomingGroup = document.getElementById('upcomingEvents');
  const pastGroup = document.getElementById('pastEvents');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      if (filter === 'all') {
        upcomingGroup && upcomingGroup.classList.remove('ce-hidden');
        pastGroup && pastGroup.classList.remove('ce-hidden');
      } else if (filter === 'upcoming') {
        upcomingGroup && upcomingGroup.classList.remove('ce-hidden');
        pastGroup && pastGroup.classList.add('ce-hidden');
      } else if (filter === 'past') {
        upcomingGroup && upcomingGroup.classList.add('ce-hidden');
        pastGroup && pastGroup.classList.remove('ce-hidden');
      }
    });
  });


  /* ===== NEWSLETTER FORM ===== */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = newsletterForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = '✓';
      btn.style.background = '#22c55e';
      btn.style.borderColor = '#22c55e';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        newsletterForm.reset();
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
