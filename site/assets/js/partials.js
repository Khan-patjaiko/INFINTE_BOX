// Shared header/footer markup, injected into every page to avoid duplication.

// Social links shown in the footer "Follow" column. Real profile URLs (set 2026-09-21);
// an entry with an empty url is skipped so unfinished channels never show a dead link.
var SOCIAL_LINKS = [
  { name: "Facebook",  url: "https://www.facebook.com/profile.php?id=61573015261066",
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z"/></svg>' },
  { name: "Instagram", url: "https://www.instagram.com/infinite_box_2024",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>' },
  { name: "Line",      url: "https://line.me/ti/p/ejUu2UnLOG",
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 3.8 3.3 6.9 7.8 7.5.3.1.7.2.8.5.1.3 0 .7 0 1l-.1.8c0 .2-.2.9.8.5s5.2-3.1 7.1-5.2c1.3-1.4 1.9-2.9 1.9-4.6C21.2 6.4 17.1 3 12 3zM8.2 13.1H6.4c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3h1.3c.3 0 .5.2.5.5s-.2.5-.5.5zm1.9-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.5zm4.3 0c0 .2-.1.4-.3.5h-.2c-.2 0-.3-.1-.4-.2l-1.8-2.5v2.2c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.2.1-.4.3-.5h.2c.2 0 .3.1.4.2l1.8 2.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.5zm2.9-2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-1.3v.8h1.3c.3 0 .5.2.5.5s-.2.5-.5.5h-1.8c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5h1.8c.3 0 .5.2.5.5s-.2.5-.5.5h-1.3v.8h1.3z"/></svg>' }
];

function socialLinksHTML() {
  return SOCIAL_LINKS.filter(function (s) { return s.url; }).map(function (s) {
    return '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.icon + '<span>' + ibT(s.name) + '</span></a>';
  }).join("");
}
// EN | TH switch: links to this same page in the other language (query string kept).
function langSwitchHTML() {
  return '<div class="lang-switch" role="group" aria-label="' + ibT("Language") + '">' +
    [["en", "EN", "English"], ["th", "TH", "ภาษาไทย"]].map(function (l) {
      return l[0] === IBI18n.lang
        ? '<span aria-current="true" lang="' + l[0] + '" title="' + l[2] + '">' + l[1] + '</span>'
        : '<a href="' + IBI18n.urlFor(l[0]) + '" hreflang="' + l[0] + '" lang="' + l[0] + '" title="' + l[2] + '">' + l[1] + '</a>';
    }).join("") + '</div>';
}

// Privacy and Terms are English only for now, so Thai pages link to the English copies.
function legalHref(page) { return IBI18n.lang === "th" ? IBI18n.root + page : page; }

var HEADER_HTML = [
'<header class="site-header">',
  '<div class="header-inner">',
    '<a class="brand" href="index.html"><img src="' + IBI18n.asset("assets/img/icon-light.png") + '" alt="" width="782" height="784"><span class="wordmark">INFINITE BOX</span></a>',
    '<nav class="main-nav" aria-label="' + ibT("Main navigation") + '">',
      '<a href="shop.html">' + ibT("Shop") + '</a>',
      '<a href="custom.html">' + ibT("Custom Orders") + '</a>',
      '<a href="about.html">' + ibT("About") + '</a>',
    '</nav>',
    '<div class="header-actions">',
      '<a class="account-link" href="login.html">' + ibT("Log in") + '</a>',
      '<a class="cart-link" href="cart.html" aria-label="' + ibT("Shopping cart") + '">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>',
        '<span class="cart-badge" data-cart-badge style="display:none;"></span>',
      '</a>',
      langSwitchHTML(),
      '<a class="btn-shop-now" href="shop.html">' + ibT("Shop Now") + '</a>',
    '</div>',
    '<div class="mobile-actions">',
      langSwitchHTML(),
      '<a class="cart-link" href="cart.html" aria-label="' + ibT("Shopping cart") + '">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>',
        '<span class="cart-badge" data-cart-badge style="display:none;"></span>',
      '</a>',
      '<button class="menu-toggle" aria-label="' + ibT("Open menu") + '" aria-expanded="false"><span></span><span></span><span></span></button>',
    '</div>',
  '</div>',
  '<nav class="mobile-nav" aria-label="' + ibT("Mobile navigation") + '">',
    '<a href="shop.html">' + ibT("Shop") + '</a>',
    '<a href="custom.html">' + ibT("Custom Orders") + '</a>',
    '<a href="about.html">' + ibT("About") + '</a>',
    '<a class="account-link" href="login.html">' + ibT("Log in") + '</a>',
  '</nav>',
'</header>'
].join("");

var FOOTER_HTML = [
'<footer class="site-footer">',
  '<div class="footer-inner">',
    '<div class="footer-grid">',
      '<div class="footer-brand">',
        '<a class="logo-lockup" href="index.html"><img src="' + IBI18n.asset("assets/img/icon-light.png") + '" alt="" width="782" height="784"><span class="wordmark">INFINITE BOX</span></a>',
        // Brand lines stay English on the Thai site too (owner, 2026-10-12).
        '<p>Design • Development • Fabrication</p>',
        '<p>INFINITE BOX - 3D Printing Studio est. 2024, Based in Thailand</p>',
        '<p class="tag">infinite-box.co</p>',
      '</div>',
      '<div class="footer-col">',
        '<p class="head">' + ibT("Shop") + '</p>',
        '<nav><a href="shop.html">' + ibT("All Products") + '</a><a href="custom.html">' + ibT("Custom Orders") + '</a><a href="materials.html">' + ibT("Materials") + '</a></nav>',
      '</div>',
      '<div class="footer-col">',
        '<p class="head">' + ibT("Company") + '</p>',
        '<nav><a href="about.html">' + ibT("About") + '</a><a href="contact.html">' + ibT("Contact") + '</a><a href="faq.html">' + ibT("FAQ") + '</a></nav>',
      '</div>',
      '<div class="footer-col">',
        '<p class="head">' + ibT("Follow") + '</p>',
        '<nav class="footer-social">' + socialLinksHTML() + '</nav>',
      '</div>',
    '</div>',
    '<div class="footer-bottom">',
      '<p>' + ibT("© 2026 Infinite Box. All rights reserved.") + '</p>',
      '<div class="footer-legal"><a href="' + legalHref("privacy.html") + '">' + ibT("Privacy Policy") + '</a><a href="' + legalHref("terms.html") + '">' + ibT("Terms of Service") + '</a></div>',
    '</div>',
  '</div>',
'</footer>'
].join("");

document.addEventListener("DOMContentLoaded", function () {
  var h = document.getElementById("header-placeholder");
  var f = document.getElementById("footer-placeholder");
  if (h) h.outerHTML = HEADER_HTML;
  if (f) f.outerHTML = FOOTER_HTML;
  if (window.IB) { window.IB.updateCartBadge(); }
  if (window.IBAuth) { window.IBAuth.refreshHeader(); }
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a, .mobile-nav a").forEach(function (a) {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var nav = document.querySelector(".mobile-nav");
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? ibT("Close menu") : ibT("Open menu"));
    });
  }
});
