// Simple line-art SVG icons standing in for product photography.
const PRODUCT_ICONS = {
  enclosure: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="30" width="64" height="46" rx="4"/><path d="M18 42h64"/><circle cx="72" cy="36" r="2.2" fill="#ff5a1f" stroke="none"/><path d="M30 30V22a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v8"/></svg>',
  bracket: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M28 20v46a4 4 0 0 0 4 4h40"/><circle cx="28" cy="30" r="3" fill="#ff5a1f" stroke="none"/><circle cx="28" cy="60" r="3" fill="#ff5a1f" stroke="none"/><circle cx="62" cy="70" r="3" fill="#ff5a1f" stroke="none"/><rect x="20" y="14" width="16" height="12" rx="2"/><rect x="64" y="64" width="16" height="12" rx="2"/></svg>',
  shell: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 60c0-22 13-38 30-38s30 16 30 38"/><path d="M20 60h60"/><path d="M20 60v6a4 4 0 0 0 4 4h52a4 4 0 0 0 4-4v-6"/><circle cx="50" cy="46" r="5" stroke="#ff5a1f"/></svg>',
  detail: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M50 16l30 17v34l-30 17-30-17V33z"/><path d="M50 16v34M20 33l30 17 30-17M50 50v34" stroke-opacity="0.6"/><circle cx="50" cy="50" r="4" fill="#ff5a1f" stroke="none"/></svg>',
  cable: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 50c0-12 10-20 22-20h12c12 0 22 8 22 20s-10 20-22 20H44c-12 0-22-8-22-20z"/><path d="M30 50h40" stroke="#ff5a1f"/><circle cx="30" cy="50" r="2.5" fill="#ff5a1f" stroke="none"/><circle cx="70" cy="50" r="2.5" fill="#ff5a1f" stroke="none"/></svg>',
  gear: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="14"/><circle cx="50" cy="50" r="5" fill="#ff5a1f" stroke="none"/><g><path d="M50 22v10M50 68v10M78 50h-10M32 50h-10M69.6 30.4l-7 7M37.4 62.6l-7 7M69.6 69.6l-7-7M37.4 37.4l-7-7"/></g></svg>',
  tray: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 40h68l-8 34H24z"/><path d="M30 40V28a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v12"/><path d="M40 50v14M50 50v14M60 50v14" stroke="#ff5a1f" stroke-opacity="0.8"/></svg>',
  stand: '<svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 78h56"/><path d="M30 78V60l40-18v18"/><rect x="30" y="42" width="12" height="18" rx="2" transform="rotate(-24 30 42)"/><circle cx="70" cy="60" r="2.5" fill="#ff5a1f" stroke="none"/></svg>'
};

function productIconSVG(key) {
  return PRODUCT_ICONS[key] || PRODUCT_ICONS.enclosure;
}
