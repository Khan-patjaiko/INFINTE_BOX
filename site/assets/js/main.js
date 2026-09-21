// Shared behaviour: mobile nav, cart (localStorage), active nav link.
(function () {
  var CART_KEY = "infinitebox_cart";

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    updateCartBadge();
  }

  // Cart lines are {id, qty, options?}. A product with a different set of chosen
  // options is a separate line; lineKey() is the identity used by the cart page.
  function normOptions(options) {
    var out = {};
    Object.keys(options || {}).sort().forEach(function (k) { if (options[k] != null && options[k] !== "") out[k] = String(options[k]); });
    return out;
  }
  function lineKey(item) {
    return item.id + "|" + JSON.stringify(normOptions(item.options));
  }
  function findLine(cart, key) {
    return cart.find(function (i) { return lineKey(i) === key; });
  }

  function addToCart(id, qty, options) {
    qty = qty || 1;
    var cart = getCart();
    var line = { id: id, qty: qty, options: normOptions(options) };
    if (!Object.keys(line.options).length) delete line.options;
    var existing = findLine(cart, lineKey(line));
    if (existing) { existing.qty += qty; } else { cart.push(line); }
    saveCart(cart);
  }

  function removeFromCart(key) {
    var cart = getCart().filter(function (i) { return lineKey(i) !== key; });
    saveCart(cart);
  }

  function setQty(key, qty) {
    var cart = getCart();
    var item = findLine(cart, key);
    if (item) { item.qty = Math.max(1, qty); }
    saveCart(cart);
  }

  function cartCount() {
    return getCart().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function updateCartBadge() {
    var count = cartCount();
    document.querySelectorAll("[data-cart-badge]").forEach(function (el) {
      if (count > 0) {
        el.textContent = count;
        el.style.display = "flex";
      } else {
        el.style.display = "none";
      }
    });
  }

  function toggleMobileNav() {
    var nav = document.querySelector(".mobile-nav");
    var btn = document.querySelector(".menu-toggle");
    if (!nav) return;
    var open = nav.classList.toggle("open");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function markActiveNav() {
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a, .mobile-nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    markActiveNav();
    var toggle = document.querySelector(".menu-toggle");
    if (toggle) toggle.addEventListener("click", toggleMobileNav);
  });

  window.IB = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    lineKey: lineKey,
    normOptions: normOptions,
    setQty: setQty,
    cartCount: cartCount,
    updateCartBadge: updateCartBadge
  };
})();
