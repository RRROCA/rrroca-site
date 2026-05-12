const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const { SITE_ORIGINS } = require('./helpers/site-config');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'search.js');
const SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8');
const INSTRUMENTED_SOURCE = SOURCE.replace(
  'window.closeSearch = closeSearch;',
  `window.closeSearch = closeSearch;
  window.__searchTestHooks = {
    loadIndex,
    handleSearch,
    getFuse: () => fuse,
    getSearchIndex: () => searchIndex
  };`
);

const SEARCH_INDEX = [
  {
    title: 'Safety Hub',
    content: 'Crime stats, alerts, and community safety resources.',
    section: 'safety',
    tags: 'crime alerts police',
    permalink: '/safety/'
  },
  {
    title: 'Community Events',
    content: 'Block parties, festivals, and year-round events.',
    section: 'events',
    tags: 'events parties',
    permalink: '/events/'
  }
];

describe('search.js', () => {
  let window;
  let document;
  let fetchMock;
  let FuseMock;

  beforeEach(() => {
    const dom = new JSDOM(
      `<!doctype html>
      <html>
        <head></head>
        <body>
          <div id="search-overlay">
            <div class="search-panel">
              <input id="search-input" />
              <div id="search-results"></div>
            </div>
          </div>
        </body>
      </html>`,
      { url: `${SITE_ORIGINS[0]}/` }
    );

    window = dom.window;
    document = window.document;

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading'
    });

    document.getElementById('search-input').focus = jest.fn();

    fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(SEARCH_INDEX)
    });

    FuseMock = jest.fn(function(index, options) {
      this.index = index;
      this.options = options;
      this.search = jest.fn((query) => {
        if (query.toLowerCase().includes('safety')) {
          return [{ item: index[0] }];
        }

        return [];
      });
    });

    window.Fuse = FuseMock;

    const context = vm.createContext({
      window,
      document,
      console,
      fetch: fetchMock,
      Fuse: FuseMock,
      setTimeout,
      clearTimeout
    });

    vm.runInContext(INSTRUMENTED_SOURCE, context, { filename: SCRIPT_PATH });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
  });

  afterEach(() => {
    window.close();
  });

  it('initializes search, opens the overlay, and loads the Fuse index', async () => {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-input');

    window.openSearch();
    await window.__searchTestHooks.loadIndex();

    expect(overlay).toHaveClass('open');
    expect(input.focus).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    expect(fetchMock).toHaveBeenCalledWith('/index.json');
    expect(window.__searchTestHooks.getSearchIndex()).toEqual(SEARCH_INDEX);
    expect(FuseMock).toHaveBeenCalledWith(
      SEARCH_INDEX,
      expect.objectContaining({
        threshold: 0.3,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        limit: 10
      })
    );
  });

  it('renders matching results into the search results panel', async () => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    window.openSearch();
    await window.__searchTestHooks.loadIndex();

    input.value = 'safety';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(results.innerHTML).toContain('Safety Hub');
    expect(results.innerHTML).toContain('/safety/');
    expect(results.innerHTML).toContain('Crime stats');
  });

  it('shows helpful messages for short queries and empty result sets', async () => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    input.value = 's';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(results.innerHTML).toContain('Start typing to search across all community content');

    window.openSearch();
    await window.__searchTestHooks.loadIndex();

    input.value = 'gardening';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(results.innerHTML).toContain('No results for "<strong>gardening</strong>"');
  });

  it('escapes result content and blocks unsafe permalinks', async () => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    window.openSearch();
    await window.__searchTestHooks.loadIndex();

    window.__searchTestHooks.getFuse().search.mockReturnValue([
      {
        item: {
          title: '<img src=x onerror=alert(1)>',
          content: 'Unsafe <script>alert(1)</script> preview',
          section: 'news & updates',
          permalink: 'javascript:alert(1)'
        }
      }
    ]);

    input.value = '<svg onload=alert(1)>';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(results.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(results.innerHTML).toContain('Unsafe &lt;script&gt;alert(1)&lt;/script&gt; preview');
    expect(results.innerHTML).toContain('news &amp; updates');
    expect(results.innerHTML).toContain('href="#"');
    expect(results.innerHTML).not.toContain('<script>alert(1)</script>');
    expect(results.innerHTML).not.toContain('javascript:alert(1)');
  });

  it('closes the search overlay and restores page scrolling', () => {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    window.closeSearch();

    expect(overlay).not.toHaveClass('open');
    expect(document.body.style.overflow).toBe('');
  });
});
