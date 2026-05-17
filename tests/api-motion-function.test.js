const path = require('path');
const { SITE_ORIGINS } = require('./helpers/site-config');

const MOTION_MODULE_PATH = path.join(__dirname, '..', 'api', 'motion', 'index.js');

function makeAuthHeader(email) {
  const principal = {
    identityProvider: 'google',
    userId: 'test-user-' + email.split('@')[0],
    userDetails: email,
    userRoles: ['authenticated', 'anonymous']
  };
  return Buffer.from(JSON.stringify(principal)).toString('base64');
}

describe('api/motion security hardening', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      GITHUB_TOKEN: 'ghs_test_token'
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    delete global.fetch;
  });

  async function invoke(reqOverrides = {}) {
    const handler = require(MOTION_MODULE_PATH);
    const context = { log: { error: jest.fn(), warn: jest.fn() } };
    const req = {
      method: 'POST',
      query: { action: 'propose' },
      headers: {
        origin: SITE_ORIGINS[0],
        'x-azure-clientip': '203.0.113.20',
        'x-ms-client-principal': makeAuthHeader('board.member@rrroca.org')
      },
      body: {
        motionText: 'Approve a new rink light timer.',
        background: 'The existing timer has failed repeatedly.'
      },
      ...reqOverrides
    };

    await handler(context, req);
    return { context, req };
  }

  test('rejects disallowed origins', async () => {
    const { context } = await invoke({ headers: { origin: 'https://evil.example', 'x-azure-clientip': '203.0.113.20', 'x-ms-client-principal': makeAuthHeader('board.member@rrroca.org') } });

    expect(context.res.status).toBe(403);
    expect(context.res.body.error).toMatch(/Origin not allowed/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects unauthenticated requests', async () => {
    const { context } = await invoke({ headers: { origin: SITE_ORIGINS[0], 'x-azure-clientip': '203.0.113.20' } });

    expect(context.res.status).toBe(401);
    expect(context.res.body.error).toMatch(/sign in/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects non-rrroca.org email accounts', async () => {
    const { context } = await invoke({ headers: { origin: SITE_ORIGINS[0], 'x-azure-clientip': '203.0.113.20', 'x-ms-client-principal': makeAuthHeader('someone@gmail.com') } });

    expect(context.res.status).toBe(403);
    expect(context.res.body.error).toMatch(/@rrroca\.org/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects malformed JSON bodies', async () => {
    const { context } = await invoke({ body: '{bad json' });

    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toMatch(/Malformed JSON body/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects overlong motion text', async () => {
    const { context } = await invoke({ body: { motionText: 'a'.repeat(5001), background: 'Test background' } });

    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toMatch(/motionText exceeds the 5000 character limit/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('sanitizes issue body content before creating GitHub issues', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ number: 77, html_url: 'https://github.com/RRROCA/rrroca-site/issues/77', created_at: '2026-01-01T00:00:00Z' }))
      })
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ number: 77 }))
      });

    const payload = {
      title: 'LED upgrade @rrroca/board',
      motionText: 'Approve <script>alert(1)</script> and notify @rrroca/board',
      background: 'Needed for <!-- comment --> winter operations',
      supportingDocs: '[budget](javascript:alert(1))'
    };

    const { context } = await invoke({
      body: payload,
      headers: {
        origin: SITE_ORIGINS[0],
        'x-azure-clientip': '203.0.113.20',
        'x-ms-client-principal': makeAuthHeader('alice@rrroca.org')
      }
    });
    expect(context.res.status).toBe(200);

    const firstCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(firstCall[1].body);
    expect(requestBody.body).toContain('&lt;script&gt;');
    expect(requestBody.body).toContain('@​rrroca/board');
    expect(requestBody.body).not.toContain('<script>alert(1)</script>');
    expect(requestBody.body).toContain('RRROCA_MOTION_META');
    // The trusted @RRROCA/board mention should be present (not sanitized)
    expect(requestBody.body).toContain('@RRROCA/board');
  });

  test('rate limits write requests by trusted client IP instead of x-forwarded-for', async () => {
    const handler = require(MOTION_MODULE_PATH);
    let issueNumber = 100;

    global.fetch.mockImplementation(() => Promise.resolve({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ number: issueNumber++, html_url: 'https://github.com/RRROCA/rrroca-site/issues/100', created_at: '2026-01-01T00:00:00Z' }))
    }));

    for (let index = 0; index < 10; index += 1) {
      const context = { log: { error: jest.fn(), warn: jest.fn() } };
      await handler(context, {
        method: 'POST',
        query: { action: 'propose' },
        headers: {
          origin: SITE_ORIGINS[0],
          'x-azure-clientip': '198.51.100.8',
          'x-forwarded-for': '10.0.0.' + index,
          'x-ms-client-principal': makeAuthHeader('member' + index + '@rrroca.org')
        },
        body: {
          motionText: 'Motion ' + index,
          background: 'Background text'
        }
      });

      expect(context.res.status).toBe(200);
    }

    const blockedContext = { log: { error: jest.fn(), warn: jest.fn() } };
    await handler(blockedContext, {
      method: 'POST',
      query: { action: 'propose' },
      headers: {
        origin: SITE_ORIGINS[0],
        'x-azure-clientip': '198.51.100.8',
        'x-forwarded-for': '203.0.113.99',
        'x-ms-client-principal': makeAuthHeader('member11@rrroca.org')
      },
      body: {
        motionText: 'Motion 11',
        background: 'Background text'
      }
    });

    expect(blockedContext.res.status).toBe(429);
  });
});
