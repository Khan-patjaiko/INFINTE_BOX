// Shared header/footer markup, injected into every non-home page to avoid duplication.
var HEADER_HTML = [
'<header class="site-header">',
  '<div class="header-inner">',
    '<a class="brand" href="index.html"><img src="assets/img/icon-light.png" alt=""><span class="wordmark">INFINITE BOX</span></a>',
    '<nav class="main-nav" aria-label="Main navigation">',
      '<a href="shop.html">Shop</a>',
      '<a href="custom.html">Custom Orders</a>',
      '<a href="about.html">About</a>',
    '</nav>',
    '<div class="header-actions">',
      '<a class="account-link" href="login.html">Log in</a>',
      '<a class="cart-link" href="cart.html" aria-label="Shopping cart">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>',
        '<span class="cart-badge" data-cart-badge style="display:none;"></span>',
      '</a>',
      '<a class="btn-shop-now" href="shop.html">Shop Now</a>',
    '</div>',
    '<div class="mobile-actions">',
      '<a class="cart-link" href="cart.html" aria-label="Shopping cart">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>',
        '<span class="cart-badge" data-cart-badge style="display:none;"></span>',
      '</a>',
      '<button class="menu-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>',
    '</div>',
  '</div>',
  '<nav class="mobile-nav" aria-label="Mobile navigation">',
    '<a href="shop.html">Shop</a>',
    '<a href="custom.html">Custom Orders</a>',
    '<a href="about.html">About</a>',
    '<a class="account-link" href="login.html">Log in</a>',
  '</nav>',
'</header>'
].join("");

var FOOTER_HTML = [
'<footer class="site-footer">',
  '<div class="footer-inner">',
    '<div class="footer-grid">',
      '<div class="footer-brand">',
        '<a class="logo-lockup" href="index.html"><img src="assets/img/icon-light.png" alt=""><span class="wordmark">INFINITE BOX</span></a>',
        '<p>Custom 3D printed parts for small businesses. FDM &amp; resin printing. Fast turnaround. Built to your spec.</p>',
        '<p class="tag">infinite-box.co</p>',
      '</div>',
      '<div class="footer-col">',
        '<p class="head">Shop</p>',
        '<nav><a href="shop.html">All Products</a><a href="custom.html">Custom Orders</a><a href="materials.html">Materials</a></nav>',
      '</div>',
      '<div class="footer-col">',
        '<p class="head">Company</p>',
        '<nav><a href="about.html">About</a><a href="contact.html">Contact</a><a href="faq.html">FAQ</a></nav>',
      '</div>',
    '</div>',
    '<div class="footer-bottom">',
      '<p>© 2026 Infinite Box. All rights reserved.</p>',
      '<div class="footer-legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>',
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
      nav.classList.toggle("open");
    });
  }
});
