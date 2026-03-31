/* ================================================
   ARDSLEY CARWASH — API Configuration
   Replace POCKETBASE_URL with your deployed
   PocketBase instance URL once it is live.
   e.g. https://ardsley-carwash.onrender.com
   Admin dashboard: https://ardsley-carwash.onrender.com/_/
   ================================================ */

const APP_CONFIG = {
  // Set this to your PocketBase URL after deployment
  // Leave as empty string during local dev to use mock mode
  POCKETBASE_URL: 'https://ardsley-carwash.onrender.com',

  // Collections
  COLLECTIONS: {
    BOOKINGS:   'bookings',
    NEWSLETTER: 'newsletter',
    MEMBERSHIPS: 'memberships',
    EVENTS:     'events',
    TEAMS:      'teams',
    PARTNERS:   'partners',
    GALLERY:    'gallery',
  },

  // Maximum gallery photos to display (latest uploaded first)
  GALLERY_MAX: 25,

  // EmailJS — booking notification emails
  // Get these from your EmailJS dashboard (emailjs.com)
  EMAILJS: {
    PUBLIC_KEY:  '38NHnKduh6oN324o9',
    SERVICE_ID:  'service_4jaqgvr',
    TEMPLATE_ID: 'template_enzr9dm',
  },
};

// Convenience helper — builds the full records endpoint URL
function apiUrl(collection) {
  return `${APP_CONFIG.POCKETBASE_URL}/api/collections/${collection}/records`;
}
