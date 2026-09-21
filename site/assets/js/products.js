// Product catalogue — loaded from Supabase at runtime (no longer hardcoded).
// PRODUCTS is populated by loadProducts(); pages should await it before rendering.
var PRODUCTS = [];
var _productsPromise = null;

function _mapProductRow(row) {
  return {
    id: row.slug,          // public identifier used in URLs and the cart
    slug: row.slug,
    name: row.name,
    material: row.material,
    price: (row.price_cents || 0) / 100,
    price_cents: row.price_cents || 0,
    icon: row.icon_key,
    category: row.category,
    description: row.description,
    specs: row.specs || {},
    image: row.image_url || null,
    // Gallery for product.html: image_url first, then the rest of products.images (no dupes).
    images: [row.image_url].concat(Array.isArray(row.images) ? row.images : []).filter(function (u, i, a) { return u && a.indexOf(u) === i; }),
    stock: typeof row.stock === "number" ? row.stock : 0,
    soldOut: !(row.stock > 0)
  };
}

function loadProducts() {
  if (_productsPromise) return _productsPromise;
  _productsPromise = (async function () {
    if (!window.IBDB) throw new Error("Supabase client not initialised");
    var res = await window.IBDB
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort", { ascending: true });
    if (res.error) throw res.error;
    PRODUCTS = (res.data || []).map(_mapProductRow);
    return PRODUCTS;
  })().catch(function (err) {
    _productsPromise = null; // let the page retry instead of caching the failure
    throw err;
  });
  return _productsPromise;
}

// Configured category list from store_settings.product_categories (migration 0012).
// Resolves to [] if the row is missing or the read fails, so callers can always fall back
// to the categories actually present on products.
function loadCategories() {
  if (!window.IBDB) return Promise.resolve([]);
  return window.IBDB.from("store_settings").select("value").eq("key", "product_categories").maybeSingle()
    .then(function (res) {
      var v = res && res.data && res.data.value;
      return Array.isArray(v) ? v.filter(function (c) { return typeof c === "string" && c; }) : [];
    }, function () { return []; });
}

// Error message with a Retry button. Pages listen for clicks on [data-retry]
// inside their container and re-run their loader (see ibOnRetry).
function loadErrorHTML(message) {
  return '<p class="grid-status">' + message +
    ' <button type="button" class="btn btn-outline btn-sm" data-retry>Retry</button></p>';
}

function ibOnRetry(container, fn) {
  container.addEventListener("click", function (e) {
    if (e.target.closest("[data-retry]")) fn();
  });
}

function getProduct(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}

// ---- Shared render helpers (used by index/shop/product/cart) ----
function ibEscape(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Store currency is Thai baht. price_cents holds satang (Stripe treats THB as 2-decimal);
// p.price is baht. Whole amounts print without decimals: ฿399, ฿1,299, ฿399.50.
function formatPrice(baht) {
  return "฿" + Number(baht || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function productThumbHTML(p) {
  if (p.image) {
    return '<img src="' + ibEscape(p.image) + '" alt="' + ibEscape(p.name) + '" loading="lazy">';
  }
  return typeof productIconSVG === "function" ? productIconSVG(p.icon) : "";
}

function productCardHTML(p) {
  return '<a class="product-card' + (p.soldOut ? " sold-out" : "") + '" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="product-thumb">' + productThumbHTML(p) + (p.soldOut ? '<span class="sold-out-badge">Sold out</span>' : "") + '</div>' +
    '<div class="product-body"><div class="product-row">' +
      '<div><p class="product-name">' + ibEscape(p.name) + '</p>' +
      '<span class="product-material">' + ibEscape(p.material) + '</span></div>' +
      '<p class="product-price">' + formatPrice(p.price) + '</p>' +
    '</div></div>' +
    '<div class="product-underline"></div>' +
  '</a>';
}
