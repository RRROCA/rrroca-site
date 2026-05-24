const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');
const SITE_ORIGINS = ['https://rrroca.org', 'https://rrroca.github.io'];

function detectBasePrefix() {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) return '';

  const html = fs.readFileSync(indexPath, 'utf8');
  const canonical = html.match(/<link\s+rel=(?:"|')canonical(?:"|')\s+href=(?:"|')([^"'>\s]+)/i)?.[1];
  const ogUrl = html.match(/<meta\s+property=(?:"|')og:url(?:"|')\s+content=(?:"|')([^"'>\s]+)/i)?.[1];
  const source = canonical || ogUrl;
  if (!source) return '';

  try {
    const pathname = new URL(source, SITE_ORIGINS[0]).pathname;
    return pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

const BASE_PREFIX = detectBasePrefix();

function stripBasePrefix(pathname) {
  if (BASE_PREFIX && pathname.startsWith(`${BASE_PREFIX}/`)) {
    return pathname.slice(BASE_PREFIX.length);
  }

  return pathname === BASE_PREFIX ? '/' : pathname;
}

function isInternalUrl(href) {
  if (!href) return true;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(mailto:|tel:|data:|javascript:)/i.test(trimmed)) return true;

  try {
    const url = new URL(trimmed, SITE_ORIGINS[0]);
    if (!/^https?:$/i.test(url.protocol)) return true;
    if (SITE_ORIGINS.includes(url.origin)) return true;
    return url.hostname === 'rrroca.org' || url.hostname.endsWith('.rrroca.org');
  } catch {
    return false;
  }
}

function resolveAssetPath(src) {
  if (!src) return null;
  const cleanSrc = src.split('#')[0].split('?')[0].trim();
  if (!cleanSrc || /^(data:|mailto:|tel:|javascript:)/i.test(cleanSrc)) return null;

  let pathname = cleanSrc;
  if (/^https?:\/\//i.test(cleanSrc)) {
    if (!isInternalUrl(cleanSrc)) return null;
    pathname = new URL(cleanSrc).pathname;
  }

  pathname = stripBasePrefix(pathname);
  return path.join(PUBLIC_DIR, pathname.replace(/^\/+/, '').split('/').join(path.sep));
}

function resolveRoute(href) {
  if (!href) return path.join(PUBLIC_DIR, 'index.html');

  let cleanHref = href.split('#')[0].split('?')[0].trim();
  if (!cleanHref || cleanHref === '/' || cleanHref === `${BASE_PREFIX}/`) {
    const homepagePath = path.join(PUBLIC_DIR, 'index.html');
    return fs.existsSync(homepagePath) ? homepagePath : null;
  }

  if (/^https?:\/\//i.test(cleanHref)) {
    if (!isInternalUrl(cleanHref)) return null;
    cleanHref = new URL(cleanHref).pathname;
  }

  if (!cleanHref || cleanHref === '/' || cleanHref === `${BASE_PREFIX}/`) {
    const homepagePath = path.join(PUBLIC_DIR, 'index.html');
    return fs.existsSync(homepagePath) ? homepagePath : null;
  }

  const relativePath = stripBasePrefix(cleanHref).replace(/^\/+/, '').split('/').join(path.sep);
  const directPath = path.join(PUBLIC_DIR, relativePath);
  const directFilePath = fs.existsSync(directPath) && fs.statSync(directPath).isFile() ? directPath : null;
  return [directFilePath, `${directPath}.html`, path.join(directPath, 'index.html')].find(
    (candidate) => candidate && fs.existsSync(candidate)
  ) || null;
}

/**
 * Routes that only exist at runtime on Azure Static Web Apps.
 * These are not served by Hugo's static build and will 404 in tests.
 * Add new runtime-only route prefixes here — all link-checking tests
 * use this list, so new routes only need to be added once.
 */
const RUNTIME_ROUTE_PREFIXES = ['/.auth/'];

/**
 * Returns true if the href points to a runtime-only route (e.g. Azure SWA auth).
 * Use this in all link validation tests to skip routes that won't resolve locally.
 */
function isRuntimeRoute(href) {
  if (!href) return false;
  const clean = href.split('?')[0].split('#')[0];
  return RUNTIME_ROUTE_PREFIXES.some(prefix => clean.startsWith(prefix));
}

module.exports = {
  BASE_PREFIX,
  SITE_ORIGINS,
  PUBLIC_DIR,
  CONTENT_DIR,
  RUNTIME_ROUTE_PREFIXES,
  isRuntimeRoute,
  resolveAssetPath,
  isInternalUrl,
  resolveRoute,
};
