'use strict';

/**
 * CMS Auth Proxy for Sveltia CMS
 *
 * Replaces the Cloudflare Worker OAuth flow. Instead of requiring board members
 * to have GitHub accounts, this function:
 * 1. Verifies the user is authenticated via SWA Easy Auth (Google/@rrroca.org)
 * 2. Returns a shared GitHub token to the CMS via postMessage
 *
 * The shared token belongs to a service account (rrroca-bot or org PAT) with
 * write access to the repo. Commits are attributed to the authenticated user.
 *
 * Required app setting: GITHUB_CMS_TOKEN (GitHub PAT with repo scope)
 */

const ALLOWED_DOMAIN = 'rrroca.org';

function parseClientPrincipal(req) {
  const header = req.headers['x-ms-client-principal'];
  if (!header) return null;

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getUserEmail(principal) {
  if (!principal || !principal.claims) return null;
  const emailClaim = principal.claims.find(c =>
    c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' ||
    c.typ === 'emails' ||
    c.typ === 'email'
  );
  return emailClaim ? emailClaim.val : null;
}

module.exports = async function (context, req) {
  const principal = parseClientPrincipal(req);

  if (!principal) {
    // Not authenticated — redirect to Google login, then back here
    const loginUrl = '/.auth/login/google?post_login_redirect_uri=/api/cms-auth';
    context.res = { status: 302, headers: { Location: loginUrl }, body: '' };
    return;
  }

  const email = getUserEmail(principal);

  if (!email || !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
      body: authResultPage('error', `Access denied. Only @${ALLOWED_DOMAIN} accounts can use the CMS.`)
    };
    return;
  }

  const token = process.env.GITHUB_CMS_TOKEN;

  if (!token) {
    context.log.error('GITHUB_CMS_TOKEN app setting is not configured');
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
      body: authResultPage('error', 'CMS token not configured. Contact the site administrator.')
    };
    return;
  }

  // Return the token to Sveltia CMS via postMessage (same protocol as the Cloudflare Worker)
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
    body: authResultPage('success', token)
  };
};

/**
 * Returns an HTML page that sends the auth result back to the CMS opener window.
 * This matches the postMessage protocol that Sveltia/Decap CMS expects from OAuth endpoints.
 */
function authResultPage(status, content) {
  if (status === 'success') {
    return `<!DOCTYPE html>
<html>
<head><title>CMS Auth</title></head>
<body>
<script>
(function() {
  function sendMessage() {
    var msg = 'authorization:github:success:{"token":"${content}","provider":"github"}';
    window.opener.postMessage(msg, window.location.origin);
    window.close();
  }
  sendMessage();
})();
</script>
<p>Authenticating with CMS... This window should close automatically.</p>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head><title>CMS Auth Error</title></head>
<body>
<script>
(function() {
  var msg = 'authorization:github:error:${content.replace(/'/g, "\\'")}';
  if (window.opener) {
    window.opener.postMessage(msg, window.location.origin);
    window.close();
  }
})();
</script>
<h2>Authentication Error</h2>
<p>${content}</p>
<p><a href="/">Return to site</a></p>
</body>
</html>`;
}
