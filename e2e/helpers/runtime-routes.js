/**
 * Shared runtime route detection for Playwright e2e tests.
 * Routes that only exist on Azure Static Web Apps at runtime (not in Hugo static build).
 * Add new prefixes here — all e2e link-checking tests use this list.
 */
const RUNTIME_ROUTE_PREFIXES = ['/.auth/'];

/**
 * CSS selector to exclude runtime-only nav links from link validation.
 * Use in Playwright locators: `.nav-main a[href]${NAV_LINK_EXCLUDE}`
 */
const NAV_LINK_EXCLUDE = ':not(.nav-cta):not(.nav-board-link)';

/**
 * Returns true if href points to a runtime-only route.
 */
function isRuntimeRoute(href) {
  if (!href) return false;
  const clean = href.split('?')[0].split('#')[0];
  return RUNTIME_ROUTE_PREFIXES.some(prefix => clean.startsWith(prefix));
}

/**
 * Filters an array of hrefs, removing runtime-only routes.
 */
function filterRuntimeRoutes(hrefs) {
  return hrefs.filter(href => !isRuntimeRoute(href));
}

module.exports = {
  RUNTIME_ROUTE_PREFIXES,
  NAV_LINK_EXCLUDE,
  isRuntimeRoute,
  filterRuntimeRoutes,
};
