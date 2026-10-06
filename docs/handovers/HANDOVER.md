# Infinite Box — E-Commerce Web — Handover

Last updated: 2026-09-16

## What this project is

A static (no backend, no build step) website for **Infinite Box**, a custom 3D printing
business for small businesses. Two independent deliverables live side by side in this
folder:

1. **`site/`** — the full multi-page e-commerce-style website (home, shop, product,
   cart, custom orders, about, contact, FAQ, materials).
2. **`coming-soon/`** — a standalone pre-launch page, intentionally decoupled from
   `site/` (own copy of logo assets, no shared CSS/JS, no nav links between the two).

Both were built from scratch based on:
- `Example/Infinite Box — Custom 3D Printed Parts for Small Businesses.html` — a saved
  single-page React/Tailwind export (an Airo-generated preview) that supplied the
  copy, dark/orange/yellow color theme, fonts, and home-page layout to replicate.
  It only had a home page — everything else (shop, product detail, cart, custom
  order form, about, contact, FAQ, materials) was designed to match, not copied.
- The brand logo files at
  `..\00.INFINITE-BOX - LOGO\Rev01-20260914T155407Z-1-001\Rev01\PNG\` (see "Logo
  assets" below for which exact files were used).

There is **no git repo initialized** in this folder as of this writing.

## Tech stack

Plain HTML + CSS + vanilla JS. No framework, no bundler, no npm dependencies at
runtime. Node/npm was only used transiently during this build to run `sharp` for
image cropping (see below) — `node_modules`/`package.json` were removed afterward and
should **not** reappear in the repo.

## `site/` — main website

### Structure
```
site/
  index.html          full markup inline (header/footer NOT injected via JS here)
  shop.html            filterable product grid
  product.html          detail view, reads ?id=<product-id> from products.js
  cart.html             localStorage-backed cart
  custom.html            custom-order quote request form (client-side only)
  about.html, contact.html, faq.html, materials.html
  assets/
    css/styles.css      single stylesheet, all pages share it
    js/
      products.js       PRODUCTS array (id, name, material, price, icon key, category, description, specs) + getProduct(id)
      icons.js           PRODUCT_ICONS map of inline SVG strings (line-art placeholders, no real product photos exist yet) + productIconSVG(key)
      main.js             cart helpers (IB.* on window), mobile nav toggle, active-nav highlighting — loaded by index.html
      partials.js         HEADER_HTML/FOOTER_HTML strings injected into `#header-placeholder`/`#footer-placeholder` — loaded by every OTHER page (shop/product/cart/custom/about/contact/faq/materials)
    img/
      icon-dark.png, icon-light.png   cropped icon-only mark (black / white), used as favicon + header/footer lockup
      logo-dark.png, logo-light.png   cropped FULL lockup (icon above wordmark), currently unused in site/ header (kept for reference / other uses)
```

**Important asymmetry to know about:** `index.html` has the header/footer written
inline (not via `partials.js`), because it was built first. All other pages use the
`#header-placeholder` / `#footer-placeholder` + `partials.js` injection pattern. If you
edit the header or footer markup, **you must update it in both places**:
`site/assets/js/partials.js` AND the inline copy in `site/index.html`. This is a known
duplication risk — worth refactoring index.html to use the placeholder pattern too if
you touch header/footer again.

### Design system (CSS custom properties in `styles.css`)
- Dark theme: `--background: 0 0% 4%`, `--foreground: 0 0% 96%`
- Primary (orange): `22 100% 50%` — used for CTAs, prices, accents
- Secondary (yellow): `52 100% 50%` — decorative only, rarely used directly
- Accent (blue): `202 100% 50%` — decorative only
- Fonts: **Space Grotesk** (headings, `--font-heading`, loaded from Google Fonts) and
  **IBM Plex Mono** (body, `--font-sans`/`--font-body`)
- `--product-img-bg: 220 10% 96%` — light gray background behind product thumbnails,
  mimicking "product photo on white" e-commerce convention against the dark theme
- Everything colors via `hsl(var(--xxx))` so a full palette swap only touches `:root`

### Header/footer nav (as currently wired)
- Nav: Shop, Custom Orders, About · Account link, Cart icon (badge via
  `[data-cart-badge]`), "Shop Now" button
- Footer columns: Shop (All Products / Custom Orders / Materials), Company (About /
  Contact / FAQ)
- Mobile: hamburger toggles `.mobile-nav`; handled in both `main.js` (index.html) and
  `partials.js` (other pages)

### Product data & placeholder imagery
- 8 products defined in `products.js` (prod-1..prod-8): Custom Enclosure, Mounting
  Bracket, Prototype Shell, Resin Detail Part, Cable Organiser, Gear Assembly, Desk
  Organizer, Phone Stand — with material, price, category, description, and a specs
  object (used to render the detail-page spec table).
- **No real product photography exists.** `icons.js` renders simple black-line SVG
  icons (enclosure/bracket/shell/detail/cable/gear/tray/stand) as stand-ins, sitting on
  the light `--product-img-bg` card. Swapping in real photos later just means adding
  an `image` field to each product and rendering `<img>` instead of
  `productIconSVG(...)` in `index.html`/`shop.html`/`product.html`.

### Cart
- Pure `localStorage`, key `infinitebox_cart`, shape `[{id, qty}, ...]`.
- API exposed as `window.IB`: `getCart`, `saveCart`, `addToCart(id, qty)`,
  `removeFromCart(id)`, `setQty(id, qty)` (clamped to min 1), `cartCount()`,
  `updateCartBadge()`.
- `cart.html` renders rows + a summary (`subtotal`, flat `$6.50` shipping if
  non-empty, `total`) and a "Checkout / Request Quote" button that links to
  `contact.html` — **there is no real checkout/payment flow.**

### Forms (custom.html, contact.html)
Both forms `preventDefault()` and just show a static success message — nothing is
sent anywhere. Needs a real backend or a form service (Formspree, Netlify Forms,
etc.) before launch.

## `coming-soon/` — standalone launch page

Single self-contained `index.html` (inline `<style>`/`<script>`, only external
dependency is the Google Fonts stylesheet link). Deliberately **not** linked from or
to `site/` — separate folder, separate copy of logo assets
(`coming-soon/assets/img/{icon-dark,icon-light,logo-light}.png`).

Current state after iteration with the user:
- **No countdown timer** — it was built first, then explicitly removed per user
  request. Do not re-add unless asked.
- Logo: uses the **real, unmodified full lockup image** (`logo-light.png`, icon
  above the "INFINITE BOX" wordmark) at `height: 64px` in `.brand img`. Earlier
  version tried to recreate the wordmark as HTML/CSS text next to a small icon
  crop — the user rejected that ("the text of my logo must not change") and it was
  reverted to the real logo asset. **Do not swap the logo back to an icon+HTML-text
  lockup on this page.**
- "LAUNCHING SOON" eyebrow is intentionally large/bold now (`.eyebrow`: 22px, 700
  weight, `font-family: var(--font-heading)`), per explicit user request to make it
  bigger than the original small tracked-caps label style used on `site/`.
- Footer previously had `© 2026 Infinite Box. All rights reserved. · hello@infinite-box.co`
  — the email/mailto link was explicitly removed per user request. Footer is now just
  the copyright line.
- Email capture form (`#notify-form`) validates with a regex and stores addresses in
  `localStorage` under key `infinitebox_notify_emails` — **this does not send email or
  reach any real mailing list.** Swap for Mailchimp/ConvertKit/etc. before real launch.
- Background: fixed `.glow` (radial gradients in primary/accent/secondary) + `.grid-lines`
  (subtle grid, masked to a radial fade) layered under the content.

## Logo assets — what was used, and why

Source folder (outside this project, referenced read-only):
`...\00.INFINITE-BOX - LOGO\Rev01-20260914T155407Z-1-001\Rev01\PNG\`
- `A\...-01.png` — black **full lockup** (icon + wordmark stacked)
- `A\...-04.png` — white/light **full lockup** ← trimmed → `logo-light.png`
- `A\...-05.png` — appears blank at low contrast (not used)
- `B\...-02.png` — black **icon only** ← trimmed → `icon-dark.png` (favicon)
- `B\...-06.png` — white **icon only** ← trimmed → `icon-light.png` (header mark)
- `B\...-07.png` — appears blank/very light (not used)
- `C\...-03.png`, `-08.png`, `-09.png` — wordmark-only variants (not used)

All source PNGs are 3508×2481 RGBA with large transparent margins. They were
**trimmed** (transparent-padding removed) using the `sharp` npm package, installed
temporarily (`npm install sharp --no-save`) and then fully removed
(`node_modules`, `package.json`, `package-lock.json` deleted) — this project has
**no npm dependency**, so if you need to reprocess images again you'll need to
reinstall `sharp` (or equivalent) yourself and clean up afterward the same way.

Trimmed results:
- Full lockup (`logo-*.png`): 1752×1000 (~1.75:1) — still has a large internal gap
  between the icon and the wordmark by design (that's baked into the artwork, not
  something we can trim further without editing the source).
- Icon-only (`icon-*.png`): 782×784 (~1:1) — used for favicons and the compact
  header/footer lockup on `site/` (icon image + HTML `<span class="wordmark">INFINITE
  BOX</span>` text set in Space Grotesk).

**Key distinction between the two pages' header treatment** (don't conflate them):
- `site/` header/footer: small **icon** image + **HTML text** wordmark (because the
  full lockup's internal spacing makes it illegible at header height).
- `coming-soon/`: the **real full lockup image** at larger size (64px tall, room to
  breathe on a single hero page) — no HTML text recreation, per explicit user
  instruction not to alter the logo's text.

## Local preview setup

`.claude/launch.json` defines two dev-server configs (both run `npx http-server`,
no install needed beyond npx's own cache):

```json
{
  "configurations": [
    { "name": "infinite-box-site",         "runtimeArgs": ["--yes","http-server","site","-p","8790","-c-1"], "port": 8790 },
    { "name": "infinite-box-coming-soon",  "runtimeArgs": ["--yes","http-server","coming-soon","-p","8791","-c-1"], "port": 8791 }
  ]
}
```
Use the Browser-pane `preview_start` tool with `name: "infinite-box-site"` or
`name: "infinite-box-coming-soon"` to view either one — plain `file://` opening
does **not** work reliably for `site/` because of relative asset/script loading
inside the preview sandbox (confirmed during this build: raw file:// preview
renders unstyled/broken; the http-server route is the one that was verified working).

## Known gaps / explicit non-goals (told to the user, still true)

- No payment processing or real checkout — would need Stripe (or similar) + a
  server. Currently "Checkout" just routes to the contact page.
- No real product photography — SVG line-art placeholders in `icons.js`.
- Contact/custom-order forms don't submit anywhere real.
- Coming-soon email capture doesn't reach a real mailing list.
- No git repository initialized yet in this folder.

## Suggested next steps (not yet requested, just candidates)

- Decide on and wire up a real form backend (Formspree/Netlify Forms/custom API)
  for `custom.html` and `contact.html`.
- Decide on and wire up a real checkout (Stripe Checkout is the lowest-effort path
  for a static site like this).
- Replace SVG placeholder icons with real product photography when available.
- Consider refactoring `site/index.html` to use the `#header-placeholder`/
  `partials.js` pattern like every other page, to remove the header/footer
  duplication risk noted above.
- If the coming-soon page needs a real launch countdown again, re-add it fresh
  rather than assuming old code — it was deliberately deleted, not just hidden.
