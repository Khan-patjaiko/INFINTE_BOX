// Initialise the Supabase browser client from window.IB_CONFIG.
// Exposes window.IBDB for the rest of the site to use.
(function () {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("supabase-js library failed to load (CDN blocked?).");
    return;
  }
  if (!window.IB_CONFIG || !window.IB_CONFIG.SUPABASE_URL || !window.IB_CONFIG.SUPABASE_ANON_KEY) {
    console.error("Missing IB_CONFIG — check assets/js/config.js.");
    return;
  }
  window.IBDB = window.supabase.createClient(
    window.IB_CONFIG.SUPABASE_URL,
    window.IB_CONFIG.SUPABASE_ANON_KEY
  );
})();
