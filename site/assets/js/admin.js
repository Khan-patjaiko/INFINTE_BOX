// Admin dashboard shared code (site/admin/*.html).
// Injects the admin header, guards the page behind profiles.is_admin, and exposes
// small helpers on window.IBAdmin. RLS enforces admin access server-side; the
// client-side guard is only for UX (redirect / friendly message).
(function () {
  var PAGES = [
    { href: "index.html", label: "Overview" },
    { href: "orders.html", label: "Orders" },
    { href: "quotes.html", label: "Quotes" },
    { href: "messages.html", label: "Messages" },
    { href: "products.html", label: "Products" }
  ];

  function db() { return window.IBDB; }

  function headerHTML() {
    var path = location.pathname.split("/").pop() || "index.html";
    var links = PAGES.map(function (p) {
      return '<a href="' + p.href + '"' + (p.href === path ? ' class="active"' : "") + ">" + p.label + "</a>";
    }).join("");
    return '<header class="site-header admin-header">' +
      '<div class="header-inner">' +
        '<a class="brand" href="index.html"><img src="../assets/img/icon-light.png" alt=""><span class="wordmark">INFINITE BOX</span><span class="admin-tag">Admin</span></a>' +
        '<nav class="admin-nav" aria-label="Admin navigation">' + links + "</nav>" +
        '<div class="header-actions">' +
          '<a class="store-link" href="../index.html">View store</a>' +
          '<button type="button" class="btn btn-outline btn-sm" id="admin-logout">Log out</button>' +
        "</div>" +
      "</div>" +
    "</header>";
  }

  function injectHeader() {
    var h = document.getElementById("header-placeholder");
    if (h) h.outerHTML = headerHTML();
    var out = document.getElementById("admin-logout");
    if (out) out.addEventListener("click", async function () {
      if (db()) { try { await db().auth.signOut(); } catch (e) {} }
      window.location.href = "../index.html";
    });
  }

  // Resolves with the user if they are an admin; otherwise redirects (signed out)
  // or replaces <main> with a "not authorised" message (signed in, not admin).
  async function requireAdmin() {
    var user = await window.IBAuth.getUser();
    var page = location.pathname.split("/").pop() || "index.html";
    if (!user) {
      window.location.href = "../login.html?next=" + encodeURIComponent("admin/" + page);
      return null;
    }
    var res = await db().from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (res.error || !res.data || !res.data.is_admin) {
      var main = document.querySelector("main");
      if (main) {
        main.innerHTML = '<section class="section"><div class="container"><div class="empty-state">' +
          (res.error
            ? "<p>Couldn't verify admin access (" + ibEscape(res.error.message || "network error") + ").</p>" +
              '<button type="button" class="btn btn-primary" onclick="location.reload()">Try again</button>'
            : '<p>This account (' + ibEscape(user.email) + ") isn't an admin.</p>" +
              '<a class="btn btn-primary" href="../index.html">Back to store</a>') +
          '</div></div></section>';
      }
      if (res.error) console.error("Admin check failed", res.error);
      return null;
    }
    return user;
  }

  function money(cents) { return "$" + ((cents || 0) / 100).toFixed(2); }

  function date(iso, withTime) {
    var d = new Date(iso);
    var opts = { year: "numeric", month: "short", day: "numeric" };
    if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
    return d.toLocaleDateString(undefined, opts);
  }

  function statusBadge(status) {
    var s = String(status || "").toLowerCase();
    return '<span class="order-status ' + ibEscape(s) + '">' + ibEscape(s) + "</span>";
  }

  // Brief bottom-corner notice for save results.
  var toastTimer = null;
  function toast(msg, isError) {
    var el = document.getElementById("admin-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "admin-toast";
      el.className = "admin-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2500);
  }

  // Short-lived download link for a file in the private custom-uploads bucket.
  async function signedUrl(path) {
    var res = await db().storage.from("custom-uploads").createSignedUrl(path, 60 * 10);
    if (res.error) throw res.error;
    return res.data.signedUrl;
  }

  window.IBAdmin = {
    requireAdmin: requireAdmin,
    money: money,
    date: date,
    statusBadge: statusBadge,
    toast: toast,
    signedUrl: signedUrl
  };

  document.addEventListener("DOMContentLoaded", injectHeader);
})();
