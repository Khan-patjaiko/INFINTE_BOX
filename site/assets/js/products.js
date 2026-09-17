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
    image: row.image_url || null
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
  })();
  return _productsPromise;
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

function formatPrice(dollars) {
  return "$" + Number(dollars || 0).toFixed(2);
}

function productThumbHTML(p) {
  if (p.image) {
    return '<img src="' + ibEscape(p.image) + '" alt="' + ibEscape(p.name) + '" loading="lazy">';
  }
  return typeof productIconSVG === "function" ? productIconSVG(p.icon) : "";
}

function productCardHTML(p) {
  return '<a class="product-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="product-thumb">' + productThumbHTML(p) + '</div>' +
    '<div class="product-body"><div class="product-row">' +
      '<div><p class="product-name">' + ibEscape(p.name) + '</p>' +
      '<span class="product-material">' + ibEscape(p.material) + '</span></div>' +
      '<p class="product-price">' + formatPrice(p.price) + '</p>' +
    '</div></div>' +
    '<div class="product-underline"></div>' +
  '</a>';
}
