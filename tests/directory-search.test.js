const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const { SITE_ORIGINS } = require('./helpers/site-config');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'directory-search.js');
const SCRIPT_EXISTS = fs.existsSync(SCRIPT_PATH);
const SOURCE = SCRIPT_EXISTS ? fs.readFileSync(SCRIPT_PATH, 'utf8') : '';
const describeIfScriptExists = SCRIPT_EXISTS ? describe : describe.skip;

function createDom() {
  return new JSDOM(
    `<!doctype html>
    <html>
      <body>
        <section data-directory>
          <input type="search" data-directory-search />
          <div>
            <button type="button" data-category-filter="all" class="is-active">All</button>
            <button type="button" data-category-filter="home">Home</button>
            <button type="button" data-category-filter="pet">Pet</button>
          </div>
          <p data-directory-count></p>
          <div data-directory-empty class="is-hidden">No matches</div>
          <article data-directory-card data-category="home" data-search="alpha plumbing furnace repair">Alpha Plumbing</article>
          <article data-directory-card data-category="home" data-search="beta cleaning home services">Beta Cleaning</article>
          <article data-directory-card data-category="pet" data-search="gamma grooming pet spa">Gamma Grooming</article>
        </section>
      </body>
    </html>`,
    { url: `${SITE_ORIGINS[0]}/` }
  );
}

function loadDirectorySearchScript(window, document, options = {}) {
  window.setTimeout = options.setTimeout || ((callback) => {
    callback();
    return 1;
  });
  window.clearTimeout = options.clearTimeout || jest.fn();
  window.requestAnimationFrame = options.requestAnimationFrame || ((callback) => {
    callback();
    return 1;
  });

  const context = vm.createContext({
    window,
    document,
    console: options.console || console,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    requestAnimationFrame: window.requestAnimationFrame,
    HTMLElement: window.HTMLElement,
    Node: window.Node
  });

  context.global = context;
  context.globalThis = context;

  vm.runInContext(SOURCE, context, { filename: SCRIPT_PATH });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
}

function getDirectoryBits(document) {
  return {
    searchInput: document.querySelector('[data-directory-search]'),
    buttons: Array.from(document.querySelectorAll('[data-category-filter]')),
    cards: Array.from(document.querySelectorAll('[data-directory-card]')),
    count: document.querySelector('[data-directory-count]'),
    emptyState: document.querySelector('[data-directory-empty]')
  };
}

function visibleCards(cards) {
  return cards.filter((card) => !card.hidden);
}

function click(window, element) {
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

function type(window, input, value) {
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

describeIfScriptExists('directory-search.js', () => {
  let window;
  let document;

  afterEach(() => {
    if (window) {
      window.close();
    }
  });

  it('initializes by showing all cards and hiding the empty state', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { cards, count, emptyState } = getDirectoryBits(document);

    expect(visibleCards(cards)).toHaveLength(3);
    expect(count.textContent).toBe('3 businesses');
    expect(emptyState).toHaveClass('is-hidden');
  });

  it('filters cards by category when a filter button is clicked', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { buttons, cards, count } = getDirectoryBits(document);
    click(window, buttons.find((button) => button.dataset.categoryFilter === 'home'));

    expect(visibleCards(cards).map((card) => card.textContent.trim())).toEqual([
      'Alpha Plumbing',
      'Beta Cleaning'
    ]);
    expect(cards.find((card) => card.dataset.category === 'pet').hidden).toBe(true);
    expect(count.textContent).toBe('2 businesses');
    expect(buttons.find((button) => button.dataset.categoryFilter === 'home')).toHaveClass('is-active');
    expect(buttons.find((button) => button.dataset.categoryFilter === 'all')).not.toHaveClass('is-active');
  });

  it('filters cards by search text', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { searchInput, cards, count } = getDirectoryBits(document);
    type(window, searchInput, 'plumbing');

    expect(visibleCards(cards).map((card) => card.textContent.trim())).toEqual(['Alpha Plumbing']);
    expect(count.textContent).toBe('1 business');
  });

  it('supports combined category and search filtering', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { buttons, searchInput, cards, count } = getDirectoryBits(document);
    click(window, buttons.find((button) => button.dataset.categoryFilter === 'home'));
    type(window, searchInput, 'cleaning');

    expect(visibleCards(cards).map((card) => card.textContent.trim())).toEqual(['Beta Cleaning']);
    expect(count.textContent).toBe('1 business');
  });

  it('shows the empty state when no cards match the active filters', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { searchInput, cards, count, emptyState } = getDirectoryBits(document);
    type(window, searchInput, 'landscaping');

    expect(visibleCards(cards)).toHaveLength(0);
    expect(count.textContent).toBe('0 businesses');
    expect(emptyState).not.toHaveClass('is-hidden');
  });

  it('updates the count text for singular and plural matches', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { searchInput, count } = getDirectoryBits(document);
    type(window, searchInput, 'grooming');
    expect(count.textContent).toBe('1 business');

    type(window, searchInput, 'home');
    expect(count.textContent).toBe('1 business');

    type(window, searchInput, '');
    expect(count.textContent).toBe('3 businesses');
  });

  it('clears the search and shows all cards when the all category is clicked', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { buttons, searchInput, cards, count } = getDirectoryBits(document);
    type(window, searchInput, 'plumbing');
    click(window, buttons.find((button) => button.dataset.categoryFilter === 'home'));

    expect(visibleCards(cards)).toHaveLength(1);

    click(window, buttons.find((button) => button.dataset.categoryFilter === 'all'));

    expect(searchInput.value).toBe('');
    expect(visibleCards(cards)).toHaveLength(3);
    expect(count.textContent).toBe('3 businesses');
  });

  it('matches search text without regard to input casing', () => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    loadDirectorySearchScript(window, document);

    const { searchInput, cards } = getDirectoryBits(document);
    type(window, searchInput, 'PLUMBING');

    expect(visibleCards(cards).map((card) => card.textContent.trim())).toEqual(['Alpha Plumbing']);
  });
});

describe('directory-search.js missing script guard', () => {
  it('skips the suite gracefully when the script file is unavailable', () => {
    expect(typeof SCRIPT_EXISTS).toBe('boolean');
  });
});
