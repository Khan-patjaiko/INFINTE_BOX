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

  // Password reset: emails a recovery link that lands on reset-password.html
  // (the URL must be in Supabase → Auth → URL Configuration → Redirect URLs).
  function resetPassword(email) {
    var target = new URL("reset-password.html", window.location.href);
    return db().auth.resetPasswordForEmail(email, { redirectTo: target.href });
  }

  // Works for a recovery session (from the email link) and for a normal signed-in session.
  function updatePassword(newPassword) {
    return db().auth.updateUser({ password: newPassword });
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
    // Admins get an "Admin" link next to Account (storefront header only; admin pages
    // build their own header). RLS lets a user read only their own profile row.
    var isAdmin = false;
    if (user) {
      try {
        var res = await db().from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        isAdmin = !!(res && res.data && res.data.is_admin);
      } catch (e) {}
    }
    document.querySelectorAll(".admin-link").forEach(function (a) { a.remove(); });
    if (isAdmin) {
      document.querySelectorAll(".account-link").forEach(function (a) {
        var link = document.createElement("a");
        link.className = "admin-link";
        link.href = "admin/index.html";
        link.textContent = "Admin";
        a.parentNode.insertBefore(link, a);
      });
    }
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

  // ---- Password rules checklist (signup.html, reset-password.html) ----
  // Renders "Password conditions" under the password field, re-checks on every
  // keystroke, and keeps the submit button disabled until every rule passes
  // (and the confirm field matches, when there is one).
  var PASSWORD_RULES = [
    { id: "len",    label: "Between 8 and 50 characters", test: function (p) { return p.length >= 8 && p.length <= 50; } },
    { id: "upper",  label: "At least one uppercase letter (A–Z)", test: function (p) { return /[A-Z]/.test(p); } },
    { id: "lower",  label: "At least one lowercase letter (a–z)", test: function (p) { return /[a-z]/.test(p); } },
    { id: "number", label: "At least one number (0–9)", test: function (p) { return /[0-9]/.test(p); } },
    { id: "symbol", label: "At least one symbol (e.g. ! @ # $ %)", test: function (p) { return /[^A-Za-z0-9\s]/.test(p); } }
  ];

  function passwordIsValid(p) {
    return PASSWORD_RULES.every(function (r) { return r.test(p); });
  }

  // opts: { password, confirm (optional), list, submit, matchError (optional) } — element ids.
  function attachPasswordRules(opts) {
    var pw = document.getElementById(opts.password);
    var pw2 = opts.confirm ? document.getElementById(opts.confirm) : null;
    var list = document.getElementById(opts.list);
    var submit = document.getElementById(opts.submit);
    var matchEl = opts.matchError ? document.getElementById(opts.matchError) : null;
    if (!pw || !list || !submit) return;

    list.innerHTML = '<p class="pw-rules-title">Password conditions</p><ul>' +
      PASSWORD_RULES.map(function (r) {
        return '<li data-rule="' + r.id + '"><span class="pw-rule-mark" aria-hidden="true"></span>' + r.label + '</li>';
      }).join("") + "</ul>";
    var items = {};
    PASSWORD_RULES.forEach(function (r) { items[r.id] = list.querySelector('[data-rule="' + r.id + '"]'); });

    function update() {
      var p = pw.value;
      var allOk = true;
      PASSWORD_RULES.forEach(function (r) {
        var ok = r.test(p);
        items[r.id].classList.toggle("is-ok", ok);
        if (!ok) allOk = false;
      });
      var match = true;
      if (pw2) {
        match = pw2.value === p;
        var showMismatch = pw2.value.length > 0 && !match;
        pw2.classList.toggle("is-invalid", showMismatch);
        if (matchEl) matchEl.style.display = showMismatch ? "block" : "none";
      }
      submit.disabled = !(allOk && match);
    }
    pw.addEventListener("input", update);
    if (pw2) pw2.addEventListener("input", update);
    update();
  }

  window.IBAuth = {
    passwordRules: PASSWORD_RULES,
    passwordIsValid: passwordIsValid,
    attachPasswordRules: attachPasswordRules,
    getUser: getUser,
    signUp: signUp,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
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
