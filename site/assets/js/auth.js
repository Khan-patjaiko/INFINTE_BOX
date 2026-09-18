// Auth helpers (Supabase Auth) + header login/account state.
// Exposes window.IBAuth.
(function () {
  function db() { return window.IBDB; }

  async function getUser() {
    if (!db()) return null;
    try {
      var res = await db().auth.getUser();
      return res && res.data ? res.data.user : null;
    } catch (e) { return null; }
  }

  function signUp(email, password, fullName) {
    return db().auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: fullName || "" } }
    });
  }

  function signIn(email, password) {
    return db().auth.signInWithPassword({ email: email, password: password });
  }

  function signInWithGoogle(redirectPage) {
    var target = new URL(redirectPage || "account.html", window.location.href);
    return db().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: target.href }
    });
  }

  async function signOut() {
    if (db()) { try { await db().auth.signOut(); } catch (e) {} }
    window.location.href = "index.html";
  }

  // Swap the header "Account" link between logged-in and logged-out states.
  async function refreshHeader() {
    var user = await getUser();
    document.querySelectorAll(".account-link").forEach(function (a) {
      if (user) {
        a.textContent = "Account";
        a.setAttribute("href", "account.html");
      } else {
        a.textContent = "Log in";
        a.setAttribute("href", "login.html");
      }
    });
  }

  // Guard for pages that require a signed-in user; redirects if absent.
  async function requireUser() {
    var user = await getUser();
    if (!user) {
      var next = encodeURIComponent(location.pathname.split("/").pop() || "account.html");
      window.location.href = "login.html?next=" + next;
      return null;
    }
    return user;
  }

  window.IBAuth = {
    getUser: getUser,
    signUp: signUp,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    refreshHeader: refreshHeader,
    requireUser: requireUser
  };

  // Keep the header in sync when auth state changes (login/logout in this tab).
  document.addEventListener("DOMContentLoaded", function () {
    if (db() && db().auth && db().auth.onAuthStateChange) {
      db().auth.onAuthStateChange(function () { refreshHeader(); });
    }
  });
})();
