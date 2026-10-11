// Builds the Thai site from the English pages: site/<page>.html → site/th/<page>.html.
//
//   node scripts/build-th.mjs            build (fails if any text has no translation)
//   node scripts/build-th.mjs --missing  only list untranslated text, write nothing
//
// The English pages stay the only hand-edited source. i18n/th.json holds the translations,
// keyed by the English text itself:
//   "html": text and attributes found in the pages (titles, headings, labels, alt, …)
//   "js":   strings the scripts pass to ibT("…"); written to site/assets/js/i18n-th.js
// Run it after every change to an English page or to th.json, and commit site/th/ with it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(SITE, "th");
const ORIGIN = "https://infinite-box.co";
const MISSING_ONLY = process.argv.includes("--missing");

// Pages with a Thai copy. Indexed pages also get hreflang links (English + Thai versions).
// Legal pages (privacy, terms) and admin stay English only.
const INDEXED = ["index", "shop", "product", "custom", "about", "faq", "contact", "materials"];
const PRIVATE = ["cart", "login", "signup", "forgot-password", "reset-password", "account", "order", "success", "cancel"];
const PAGES = [...INDEXED, ...PRIVATE];
// product.html?id=… sets its own canonical and hreflang links in JavaScript (one URL per product).
const HREFLANG = INDEXED.filter((p) => p !== "product");

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "i18n", "th.json"), "utf8"));
const html = { ...dict.js, ...dict.html };   // page text may reuse a JS string's translation
const missing = new Map();                  // English text → pages it appears on
const note = (text, where) => { if (!missing.has(text)) missing.set(text, new Set()); missing.get(text).add(where); };

// ---- text helpers ----
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e] ?? m));
const encText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const encAttr = (s) => encText(s).replace(/"/g, "&quot;");
const norm = (s) => s.replace(/\s+/g, " ").trim();
const needsTranslation = (s) => /[A-Za-z]/.test(s);

function translate(text, where) {
  const key = norm(decode(text));
  if (!key || !needsTranslation(key)) return null;
  if (Object.prototype.hasOwnProperty.call(html, key)) return html[key];
  note(key, where);
  return null;
}

// ---- ibT("…") strings used by scripts: every one needs a "js" translation ----
function ibTKeys(source) {
  const keys = [];
  for (const m of source.matchAll(/ibT\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.push(JSON.parse(`"${m[1]}"`));
  return keys;
}
const jsFiles = fs.readdirSync(path.join(SITE, "assets", "js")).filter((f) => f.endsWith(".js") && f !== "i18n-th.js");
for (const f of jsFiles) {
  for (const k of ibTKeys(fs.readFileSync(path.join(SITE, "assets", "js", f), "utf8"))) {
    if (!Object.prototype.hasOwnProperty.call(dict.js, k)) note(k, `assets/js/${f} (js)`);
  }
}

// ---- hreflang: identical block on both language versions of an indexed page ----
function pageUrl(page, lang) {
  const file = page === "index" ? "" : `${page}.html`;
  return `${ORIGIN}/${lang === "th" ? "th/" : ""}${file}`;
}
function hreflangBlock(page) {
  return `<link rel="alternate" hreflang="en" href="${pageUrl(page, "en")}">\n` +
    `<link rel="alternate" hreflang="th" href="${pageUrl(page, "th")}">\n` +
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(page, "en")}">`;
}

// ---- one page ----
const TRANSLATED_ATTRS = ["alt", "placeholder", "aria-label", "title"];
const TOKEN = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<svg\b[\s\S]*?<\/svg>|<[^>]+>/gi;

function rewriteUrls(tag) {
  // Relative asset paths move one level up; page links (shop.html) stay inside /th/.
  return tag.replace(/\b(src|href)="assets\//g, '$1="../assets/');
}

function transformTag(tag, page) {
  if (/^<html\b/i.test(tag)) return tag.replace(/lang="en"/, 'lang="th"');
  let out = rewriteUrls(tag);
  if (/^<link\b[^>]*rel="canonical"/i.test(out) || /^<meta\b[^>]*property="og:url"/i.test(out)) {
    out = out.replace(/(href|content)="https:\/\/infinite-box\.co\/([^"]*)"/, (m, a, rest) => `${a}="${ORIGIN}/th/${rest}"`);
  }
  const isTextMeta = /^<meta\b[^>]*(name="description"|property="og:(title|description)")/i.test(out);
  const attrs = isTextMeta ? [...TRANSLATED_ATTRS, "content"] : TRANSLATED_ATTRS;
  for (const a of attrs) {
    out = out.replace(new RegExp(`(\\s${a}=")([^"]*)(")`), (m, pre, val, post) => {
      const th = translate(val, page);
      return th == null ? m : pre + encAttr(th) + post;
    });
  }
  return out;
}

function buildPage(page) {
  const src = fs.readFileSync(path.join(SITE, `${page}.html`), "utf8");
  let out = "";
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += transformText(src.slice(last, m.index), page);
    const tok = m[0];
    if (/^<script\b/i.test(tok)) {
      const open = tok.match(/^<script\b[^>]*>/i)[0];
      let rewritten = rewriteUrls(open) + tok.slice(open.length);
      for (const k of ibTKeys(tok)) if (!Object.prototype.hasOwnProperty.call(dict.js, k)) note(k, `${page}.html (js)`);
      // The Thai dictionary loads right before i18n.js.
      if (/assets\/js\/i18n\.js/.test(open)) rewritten = `<script src="../assets/js/i18n-th.js?v=${assetVersion(open)}"></script>\n` + rewritten;
      out += rewritten;
    } else if (/^<(!--|style|svg)/i.test(tok)) {
      out += tok;
    } else {
      out += transformTag(tok, page);
    }
    last = m.index + tok.length;
  }
  out += transformText(src.slice(last), page);
  return out;
}

function transformText(text, page) {
  if (!text.trim()) return text;
  const th = translate(text, page);
  if (th == null) return text;
  const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
  return lead + encText(th) + trail;
}

function assetVersion(tag) {
  const m = tag.match(/\?v=([\w.-]+)/);
  return m ? m[1] : "1";
}

// English pages carry the same hreflang block; add it after the canonical if it is missing.
function ensureEnglishHreflang(page) {
  const file = path.join(SITE, `${page}.html`);
  const src = fs.readFileSync(file, "utf8");
  if (src.includes('hreflang="th"')) return;
  const block = hreflangBlock(page);
  let next;
  if (/<link rel="canonical"[^>]*>\n/.test(src)) next = src.replace(/(<link rel="canonical"[^>]*>\n)/, `$1${block}\n`);
  else next = src.replace(/(<meta name="description"[^>]*>\n)/, `$1${block}\n`);
  if (next === src) throw new Error(`${page}.html: no place for hreflang links`);
  fs.writeFileSync(file, next);
}

// ---- run ----
const built = {};
for (const page of PAGES) built[page] = buildPage(page);

if (missing.size) {
  console.error(`${missing.size} untranslated strings:`);
  for (const [k, where] of missing) console.error(`  ${JSON.stringify(k)}  ← ${[...where].join(", ")}`);
  if (!MISSING_ONLY) { console.error("\nAdd them to i18n/th.json and run again. Nothing was written."); process.exit(1); }
  process.exit(0);
}
if (MISSING_ONLY) { console.log("Every string has a translation."); process.exit(0); }

for (const page of HREFLANG) ensureEnglishHreflang(page);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".html")) fs.unlinkSync(path.join(OUT, f));
for (const page of PAGES) {
  let out = built[page];
  if (HREFLANG.includes(page) && !out.includes('hreflang="th"')) {
    out = out.replace(/(<link rel="canonical"[^>]*>\n|<meta name="description"[^>]*>\n)/, `$1${hreflangBlock(page)}\n`);
  }
  fs.writeFileSync(path.join(OUT, `${page}.html`), out);
}
const jsOut = "// Generated by scripts/build-th.mjs from i18n/th.json — do not edit by hand.\n" +
  "window.IB_TH = {\n" + Object.entries(dict.js).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n") + "\n};\n";
fs.writeFileSync(path.join(SITE, "assets", "js", "i18n-th.js"), jsOut);
console.log(`Built ${PAGES.length} Thai pages in site/th/ and assets/js/i18n-th.js (${Object.keys(dict.js).length} script strings).`);
