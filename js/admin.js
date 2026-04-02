/* ================================================
   ARDSLEY CARWASH — Admin Content Editor
   ================================================ */

(function () {
  'use strict';

  // ── CONSTANTS ──
  const ADMIN_EMAIL    = 'admin@ardsley.com';
  const ADMIN_PASSWORD = 'ArdsleyAdmin123';
  const SESSION_KEY    = 'ardsley_admin_authed';

  // ── STATE ──
  let contentMap      = {};   // key → { pbId, value }
  let currentEditKey  = null;
  let currentEditEl   = null;
  let currentEditType = null;
  let activePencilBtn = null;

  // ── DOM REFS (populated after DOMContentLoaded) ──
  let loginOverlay, loginForm, loginEmailInput, loginPasswordInput, loginError;
  let toolbar;
  let popover, popoverKeyLabel, popoverTextarea, popoverHint, popoverSaveBtn, popoverCancelBtn, popoverStatus;
  let heroGroupPopover, heroGroupTextareas, heroGroupSaveBtn, heroGroupStatus;
  let heroGroupEls = []; // the actual DOM elements for each phrase

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', async () => {
    // Immediately reveal all scroll-animated elements — no IntersectionObserver in admin
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('animated'));

    cacheElements();
    bindLoginEvents();
    bindPopoverEvents();

    if (sessionStorage.getItem(SESSION_KEY)) {
      hideLoginOverlay();
      await enterAdminMode();
    } else {
      showLoginOverlay();
    }
  });

  function cacheElements() {
    loginOverlay      = document.getElementById('adminLoginOverlay');
    loginForm         = document.getElementById('adminLoginForm');
    loginEmailInput   = document.getElementById('adminEmail');
    loginPasswordInput = document.getElementById('adminPassword');
    loginError        = document.getElementById('adminLoginError');
    toolbar           = document.getElementById('adminToolbar');
    popover           = document.getElementById('adminEditPopover');
    popoverKeyLabel   = document.getElementById('adminEditKeyLabel');
    popoverTextarea   = document.getElementById('adminEditTextarea');
    popoverHint       = document.getElementById('adminEditHint');
    popoverSaveBtn    = document.getElementById('adminEditSave');
    popoverCancelBtn  = document.getElementById('adminEditCancel');
    popoverStatus     = document.getElementById('adminEditStatus');

    heroGroupPopover   = document.getElementById('adminHeroGroupPopover');
    heroGroupSaveBtn   = document.getElementById('adminHeroGroupSave');
    heroGroupStatus    = document.getElementById('adminHeroGroupStatus');
    heroGroupTextareas = [
      document.getElementById('adminHeroPhrase0'),
      document.getElementById('adminHeroPhrase1'),
      document.getElementById('adminHeroPhrase2'),
    ];
  }

  // ── LOGIN ──
  function showLoginOverlay() {
    loginOverlay.classList.remove('hidden');
  }

  function hideLoginOverlay() {
    loginOverlay.classList.add('hidden');
  }

  function bindLoginEvents() {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email    = loginEmailInput.value.trim().toLowerCase();
    const password = loginPasswordInput.value;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      loginError.hidden = true;
      hideLoginOverlay();
      enterAdminMode();
    } else {
      loginError.textContent = 'Incorrect email or password.';
      loginError.hidden = false;
      loginPasswordInput.value = '';
      loginPasswordInput.focus();
    }
  }

  // ── ADMIN MODE ──
  async function enterAdminMode() {
    document.body.classList.add('admin-mode');

    // Clear promo dismiss so it's visible for editing
    sessionStorage.removeItem('promoBannerDismissed');
    sessionStorage.removeItem('promoDismissed');

    // Show toolbar
    toolbar.classList.remove('hidden');

    // Load all saved content from PocketBase
    await loadAllContent();

    // Apply saved content to DOM
    applyContentToDOM();

    // Inject pencil icons
    injectPencilIcons();

    // Replace individual hero-phrase pencils with one grouped pencil
    groupHeroPhrases();

    // FAQ accordion (main.js is not loaded on admin page)
    initFaqAccordion();

    // Bind hero group popover events
    bindHeroGroupEvents();

    // Bind logout
    document.getElementById('adminLogout').addEventListener('click', handleLogout);
  }

  // ── CONTENT LOADING ──
  async function loadAllContent() {
    if (!APP_CONFIG.POCKETBASE_URL) return;
    try {
      const res = await fetch(
        `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records?perPage=200`
      );
      if (!res.ok) return;
      const data = await res.json();
      contentMap = {};
      (data.items || []).forEach(r => {
        contentMap[r.content_key] = { pbId: r.id, value: r.content_value };
      });
    } catch (err) {
      console.warn('[admin] Could not load content:', err);
    }
  }

  function applyContentToDOM() {
    document.querySelectorAll('[data-content-key]').forEach(el => {
      const key = el.dataset.contentKey;
      if (!contentMap[key]) return;
      const val  = contentMap[key].value;
      const type = el.dataset.contentType || 'plain';
      applyToDOM(el, type, val);
    });
  }

  function applyToDOM(el, type, val) {
    if (type === 'html') {
      el.innerHTML = val;
    } else if (type === 'text-node') {
      // Find first non-empty text node, preserve other nodes (e.g. SVG icon)
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
  }

  function getCurrentValue(el, type) {
    if (type === 'html') {
      return el.innerHTML.trim();
    } else if (type === 'text-node') {
      let text = '';
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          text = node.textContent.trim();
        }
      });
      return text;
    } else {
      return el.textContent.trim();
    }
  }

  // ── PENCIL ICONS ──
  function injectPencilIcons() {
    document.querySelectorAll('[data-content-key]').forEach(el => {
      // Skip if already wrapped
      if (el.parentElement && el.parentElement.classList.contains('admin-editable-wrap')) return;

      const key  = el.dataset.contentKey;
      const type = el.dataset.contentType || 'plain';

      // Determine if block-level
      const computedDisplay = window.getComputedStyle(el).display;
      const isBlock = ['block', 'flex', 'grid', 'table', 'list-item'].includes(computedDisplay);

      // Create wrapper
      const wrapper = document.createElement('span');
      wrapper.className = 'admin-editable-wrap' + (isBlock ? ' block' : '');

      // Insert wrapper before the element
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);

      // Create pencil button
      const btn = document.createElement('button');
      btn.className = 'admin-pencil-btn';
      btn.setAttribute('aria-label', `Edit: ${key}`);
      btn.setAttribute('type', 'button');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      btn.dataset.targetKey  = key;
      btn.dataset.targetType = type;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePencilClick(btn, el, key, type);
      });

      wrapper.appendChild(btn);
    });
  }

  // ── HERO PHRASE GROUP EDITING ──
  function groupHeroPhrases() {
    const keys = ['hero_phrase_0', 'hero_phrase_1', 'hero_phrase_2'];
    heroGroupEls = [];

    keys.forEach(key => {
      const el = document.querySelector(`[data-content-key="${key}"]`);
      if (!el) return;
      heroGroupEls.push(el);
      // Remove the individual pencil button injected by injectPencilIcons
      const wrap = el.parentElement;
      if (wrap && wrap.classList.contains('admin-editable-wrap')) {
        const pencil = wrap.querySelector('.admin-pencil-btn');
        if (pencil) pencil.remove();
      }
    });

    if (!heroGroupEls.length) return;

    // Wrap h1.hero-headline in a hoverable block wrapper with one pencil
    const headline = document.querySelector('.hero-headline');
    if (!headline) return;

    const wrap = document.createElement('div');
    wrap.className = 'admin-editable-wrap block admin-hero-group-wrap';
    headline.parentNode.insertBefore(wrap, headline);
    wrap.appendChild(headline);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-pencil-btn';
    btn.setAttribute('aria-label', 'Edit Hero Phrases');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    wrap.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openHeroGroupPopover(btn);
    });
  }

  function openHeroGroupPopover(anchorBtn) {
    // Close any single-field popover
    closePopover();

    // Populate textareas with current values
    const keys = ['hero_phrase_0', 'hero_phrase_1', 'hero_phrase_2'];
    heroGroupTextareas.forEach((ta, i) => {
      const key = keys[i];
      ta.value = contentMap[key] ? contentMap[key].value : heroGroupEls[i].innerHTML.trim();
    });

    heroGroupStatus.textContent = '';
    heroGroupStatus.className = 'admin-edit-status';
    heroGroupSaveBtn.disabled = false;
    heroGroupSaveBtn.textContent = 'Save All';

    heroGroupPopover.classList.remove('hidden', 'popover-above');
    positionPopover(anchorBtn, heroGroupPopover);

    setTimeout(() => heroGroupTextareas[0].focus(), 50);
  }

  async function saveHeroGroup() {
    heroGroupSaveBtn.disabled = true;
    heroGroupSaveBtn.textContent = 'Saving…';
    heroGroupStatus.textContent = '';

    const keys = ['hero_phrase_0', 'hero_phrase_1', 'hero_phrase_2'];

    try {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const newValue = heroGroupTextareas[i].value;

        // Apply to DOM immediately
        applyToDOM(heroGroupEls[i], 'html', newValue);

        // Save to PocketBase
        const existing = contentMap[key];
        let savedRecord;

        if (existing && existing.pbId) {
          const res = await fetch(
            `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records/${existing.pbId}`,
            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_value: newValue }) }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          savedRecord = await res.json();
        } else {
          const res = await fetch(
            `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_key: key, content_value: newValue, section: 'hero' }) }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          savedRecord = await res.json();
        }

        contentMap[key] = { pbId: savedRecord.id, value: newValue };
      }

      heroGroupStatus.textContent = 'Saved!';
      heroGroupStatus.className = 'admin-edit-status success';
      setTimeout(() => closeHeroGroupPopover(), 800);

    } catch (err) {
      console.error('[admin] Hero group save failed:', err);
      heroGroupStatus.textContent = 'Save failed. Check your connection.';
      heroGroupStatus.className = 'admin-edit-status error';
      heroGroupSaveBtn.disabled = false;
      heroGroupSaveBtn.textContent = 'Save All';
    }
  }

  function closeHeroGroupPopover() {
    heroGroupPopover.classList.add('hidden');
    heroGroupSaveBtn.disabled = false;
    heroGroupSaveBtn.textContent = 'Save All';
  }

  function bindHeroGroupEvents() {
    heroGroupSaveBtn.addEventListener('click', saveHeroGroup);
    document.getElementById('adminHeroGroupCancel').addEventListener('click', closeHeroGroupPopover);

    heroGroupTextareas.forEach(ta => {
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeHeroGroupPopover();
        else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveHeroGroup();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!heroGroupPopover.classList.contains('hidden')) {
        if (!heroGroupPopover.contains(e.target) && !e.target.closest('.admin-hero-group-wrap > .admin-pencil-btn')) {
          closeHeroGroupPopover();
        }
      }
    });
  }

  // ── FAQ ACCORDION ──
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(other => other.classList.remove('active'));
        item.classList.toggle('active', !isActive);
      });
    });
  }

  // ── EDIT POPOVER ──
  function handlePencilClick(btn, el, key, type) {
    // If already editing this key, close it
    if (currentEditKey === key) {
      closePopover();
      return;
    }

    // Close any open popover first
    closePopover();

    currentEditKey  = key;
    currentEditEl   = el;
    currentEditType = type;
    activePencilBtn = btn;

    // Get current value from contentMap or live DOM
    const currentVal = contentMap[key] ? contentMap[key].value : getCurrentValue(el, type);

    openPopover(btn, key, type, currentVal);
  }

  function openPopover(anchorBtn, key, type, value) {
    // Set labels
    popoverKeyLabel.textContent = key;
    popoverTextarea.value = value;
    popoverStatus.textContent = '';
    popoverStatus.className = 'admin-edit-status';
    popoverSaveBtn.disabled = false;
    popoverSaveBtn.textContent = 'Save';

    // Set hint based on type
    if (type === 'html') {
      popoverHint.textContent = 'HTML is preserved. You can use <strong>, <br>, <span class="highlight-yellow"> etc.';
      popoverHint.className = 'admin-edit-hint html-hint';
    } else if (type === 'text-node') {
      popoverHint.textContent = 'Plain text only — HTML tags will appear as literal text.';
      popoverHint.className = 'admin-edit-hint';
    } else {
      popoverHint.textContent = 'Plain text — no HTML tags.';
      popoverHint.className = 'admin-edit-hint';
    }

    // Position popover
    popover.classList.remove('hidden', 'popover-above');
    positionPopover(anchorBtn);

    // Focus textarea
    setTimeout(() => popoverTextarea.focus(), 50);
  }

  function positionPopover(anchorEl, targetPopover) {
    const pop       = targetPopover || popover;
    const rect      = anchorEl.getBoundingClientRect();
    const scrollY   = window.scrollY;
    const scrollX   = window.scrollX;
    const popW      = Math.min(460, window.innerWidth * 0.9);
    const popH      = pop.offsetHeight || 240;
    const margin    = 12;

    // Try below first
    let top  = rect.bottom + scrollY + margin;
    let left = rect.left + scrollX;

    // Clamp right edge
    if (left + popW > window.innerWidth - margin) {
      left = window.innerWidth - popW - margin;
    }
    if (left < margin) left = margin;

    // If it overflows the bottom of viewport, place above
    if (rect.bottom + popH + margin > window.innerHeight) {
      top = rect.top + scrollY - popH - margin;
      pop.classList.add('popover-above');
    }

    pop.style.top  = top + 'px';
    pop.style.left = left + 'px';
    pop.style.width = popW + 'px';
  }

  function bindPopoverEvents() {
    // Save on button click
    document.getElementById('adminEditSave').addEventListener('click', handleSave);

    // Cancel on button click
    document.getElementById('adminEditCancel').addEventListener('click', closePopover);

    // Keyboard shortcuts inside textarea
    document.getElementById('adminEditTextarea').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePopover();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (currentEditKey && popover && !popover.classList.contains('hidden')) {
        if (!popover.contains(e.target) && !e.target.classList.contains('admin-pencil-btn')) {
          closePopover();
        }
      }
    });
  }

  async function handleSave() {
    if (!currentEditKey || !currentEditEl) return;

    const newValue = popoverTextarea.value;

    // Disable save button immediately to prevent duplicate saves
    popoverSaveBtn.disabled = true;
    popoverSaveBtn.textContent = 'Saving…';
    popoverStatus.textContent = '';

    // Apply to DOM immediately
    applyToDOM(currentEditEl, currentEditType, newValue);

    // Save to PocketBase
    try {
      const existing = contentMap[currentEditKey];
      let savedRecord;

      if (existing && existing.pbId) {
        // Update existing record
        const res = await fetch(
          `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records/${existing.pbId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content_value: newValue }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        savedRecord = await res.json();
      } else {
        // Create new record
        const section = currentEditKey.split('_')[0];
        const res = await fetch(
          `${APP_CONFIG.POCKETBASE_URL}/api/collections/site_content/records`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content_key:   currentEditKey,
              content_value: newValue,
              section:       section,
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        savedRecord = await res.json();
      }

      // Update local map
      contentMap[currentEditKey] = { pbId: savedRecord.id, value: newValue };

      // Show success
      popoverStatus.textContent = 'Saved!';
      popoverStatus.className = 'admin-edit-status success';

      setTimeout(() => {
        closePopover();
      }, 800);

    } catch (err) {
      console.error('[admin] Save failed:', err);
      popoverStatus.textContent = 'Save failed. Check your connection.';
      popoverStatus.className = 'admin-edit-status error';
      popoverSaveBtn.disabled = false;
      popoverSaveBtn.textContent = 'Save';
    }
  }

  function closePopover() {
    if (popover) {
      popover.classList.add('hidden');
    }
    currentEditKey  = null;
    currentEditEl   = null;
    currentEditType = null;
    if (activePencilBtn) {
      activePencilBtn.focus();
      activePencilBtn = null;
    }
  }

  // ── LOGOUT ──
  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

})();
