/* ================================================
   THE ARDSLEY CARWASH — Production JavaScript
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

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

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      bookingForm.style.display = 'none';
      confirmation.classList.add('visible');
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (bookAgain) {
    bookAgain.addEventListener('click', () => {
      bookingForm.reset();
      bookingForm.style.display = '';
      confirmation.classList.remove('visible');
    });
  }


  // ===== NEWSLETTER FORM =====
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      const btn = newsletterForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Done!';
      btn.style.background = '#2ecc71';
      btn.style.color = '#fff';
      input.value = '';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
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

});
