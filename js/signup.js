/* ================================================
   SIGNUP PAGE — Form logic & plan detection
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ===== PLAN DATA =====
  const plans = {
    regular: {
      name: 'Regular Monthly Car Wash',
      price: '$54.99/mo (Inc. Tax)'
    },
    ultimate: {
      name: 'Ultimate Monthly Car Wash',
      price: '$69.99/mo (Inc. Tax)'
    }
  };


  // ===== DETECT SELECTED PLAN FROM URL =====
  const params = new URLSearchParams(window.location.search);
  const planKey = params.get('plan');
  const planNameEl = document.getElementById('planName');
  const planPriceEl = document.getElementById('planPrice');

  if (planKey && plans[planKey]) {
    const plan = plans[planKey];
    planNameEl.textContent = plan.name;
    planPriceEl.textContent = plan.price;
  } else {
    // Default if no plan specified
    planNameEl.textContent = 'Unlimited Wash Club';
    planPriceEl.textContent = 'Select a plan to see pricing';
  }


  // ===== POPULATE YEAR DROPDOWN =====
  const yearSelect = document.getElementById('year');
  const currentYear = new Date().getFullYear();

  for (let y = currentYear + 1; y >= 2000; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }


  // ===== POPULATE MAKE DROPDOWN =====
  const makeSelect = document.getElementById('make');
  const makes = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
    'Dodge', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti',
    'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda',
    'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram',
    'Rivian', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Other'
  ];

  makes.forEach(make => {
    const opt = document.createElement('option');
    opt.value = make;
    opt.textContent = make;
    makeSelect.appendChild(opt);
  });


  // ===== FORM SUBMISSION =====
  const form = document.getElementById('signupForm');
  const successEl = document.getElementById('signupSuccess');
  const backLink = document.getElementById('backLink');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const areaCode   = document.getElementById('areaCode').value.trim();
      const phoneNum   = document.getElementById('phoneNumber').value.trim();
      const phone      = areaCode && phoneNum ? `${areaCode}-${phoneNum}` : '';

      const payload = {
        first_name:    document.getElementById('firstName').value.trim(),
        last_name:     document.getElementById('lastName').value.trim(),
        email:         document.getElementById('email').value.trim(),
        phone:         phone,
        address_line1: document.getElementById('street1').value.trim(),
        address_line2: (document.getElementById('street2').value || '').trim(),
        city:          document.getElementById('city').value.trim(),
        state:         document.getElementById('state').value.trim(),
        zip:           document.getElementById('zip').value.trim(),
        vehicle_year:  document.getElementById('year').value,
        vehicle_make:  document.getElementById('make').value,
        vehicle_model: document.getElementById('model').value.trim(),
        plan:          planKey || 'regular',
        status:        'pending',
      };

      if (APP_CONFIG.POCKETBASE_URL) {
        try {
          const res = await fetch(apiUrl(APP_CONFIG.COLLECTIONS.MEMBERSHIPS), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
          console.error('Membership submit error:', err);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          alert('Something went wrong. Please call us at (914) 693-2200.');
          return;
        }
      }

      form.style.display = 'none';
      if (backLink) backLink.style.display = 'none';
      successEl.classList.add('visible');
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});
