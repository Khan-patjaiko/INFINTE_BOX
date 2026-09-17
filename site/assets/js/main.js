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

  function addToCart(id, qty) {
    qty = qty || 1;
    var cart = getCart();
    var existing = cart.find(function (i) { return i.id === id; });
    if (existing) { existing.qty += qty; } else { cart.push({ id: id, qty: qty }); }
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (i) { return i.id !== id; });
    saveCart(cart);
  }

  function setQty(id, qty) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
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
    setQty: setQty,
    cartCount: cartCount,
    updateCartBadge: updateCartBadge
  };
})();
