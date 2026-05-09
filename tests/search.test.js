const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'search.js');
const SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8');

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

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

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
      { url: 'https://rrroca.org/' }
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

    vm.runInContext(SOURCE, context, { filename: SCRIPT_PATH });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
  });

  afterEach(() => {
    window.close();
  });

  it('initializes search, opens the overlay, and loads the Fuse index', async () => {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-input');

    window.openSearch();
    await flushPromises();

    expect(overlay).toHaveClass('open');
    expect(input.focus).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    expect(fetchMock).toHaveBeenCalledWith('/index.json');
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
    await flushPromises();

    input.value = 'safety';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(results.innerHTML).toContain('Safety Hub');
    expect(results.innerHTML).toContain('/safety/');
    expect(results.innerHTML).toContain('crime stats');
  });

  it('shows helpful messages for short queries and empty result sets', async () => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    input.value = 's';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(results.innerHTML).toContain('Start typing to search across all community content');

    window.openSearch();
    await flushPromises();

    input.value = 'gardening';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(results.innerHTML).toContain('No results for "<strong>gardening</strong>"');
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
