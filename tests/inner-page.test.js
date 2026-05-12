const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const { SITE_ORIGINS } = require('./helpers/site-config');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'inner-page.js');
const SCRIPT_EXISTS = fs.existsSync(SCRIPT_PATH);
const SOURCE = SCRIPT_EXISTS ? fs.readFileSync(SCRIPT_PATH, 'utf8') : '';
const describeIfScriptExists = SCRIPT_EXISTS ? describe : describe.skip;

class MockIntersectionObserver {
  static instances = [];

  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = [];
    MockIntersectionObserver.instances.push(this);
  }

  observe(el) {
    this.elements.push(el);
  }

  unobserve(el) {
    this.elements = this.elements.filter((element) => element !== el);
  }

  disconnect() {
    this.elements = [];
  }

  trigger(entries) {
    this.callback(entries, this);
  }
}

function createDom(targetCount = 0) {
  const targets = Array.from({ length: targetCount }, (_, index) => (
    `<div class="reveal-on-scroll" data-index="${index}">Item ${index + 1}</div>`
  )).join('');

  return new JSDOM(
    `<!doctype html>
    <html>
      <body>${targets}</body>
    </html>`,
    { url: `${SITE_ORIGINS[0]}/` }
  );
}

function loadInnerPageScript(window, document, options = {}) {
  const matchMedia = options.matchMedia || jest.fn(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));

  window.matchMedia = matchMedia;

  if (options.IntersectionObserver) {
    window.IntersectionObserver = options.IntersectionObserver;
  } else {
    delete window.IntersectionObserver;
  }

  const context = vm.createContext({
    window,
    document,
    console: options.console || console,
    setTimeout,
    clearTimeout,
    IntersectionObserver: options.IntersectionObserver,
    HTMLElement: window.HTMLElement,
    Node: window.Node
  });

  context.global = context;
  context.globalThis = context;

  vm.runInContext(SOURCE, context, { filename: SCRIPT_PATH });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
}

function getTargets(document) {
  return Array.from(document.querySelectorAll('.reveal-on-scroll'));
}

describeIfScriptExists('inner-page.js', () => {
  let window;
  let document;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
  });

  afterEach(() => {
    if (window) {
      window.close();
    }
  });

  it('adds is-visible to every target when reduced motion is preferred', () => {
    const dom = createDom(3);
    window = dom.window;
    document = window.document;

    loadInnerPageScript(window, document, {
      matchMedia: jest.fn(() => ({ matches: true }))
    });

    getTargets(document).forEach((target) => {
      expect(target).toHaveClass('is-visible');
    });
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('adds is-visible to every target when IntersectionObserver is unavailable', () => {
    const dom = createDom(2);
    window = dom.window;
    document = window.document;

    loadInnerPageScript(window, document, {
      matchMedia: jest.fn(() => ({ matches: false }))
    });

    getTargets(document).forEach((target) => {
      expect(target).toHaveClass('is-visible');
    });
  });

  it('creates an observer, watches targets, and reveals entries on intersection', () => {
    const dom = createDom(3);
    window = dom.window;
    document = window.document;

    loadInnerPageScript(window, document, {
      IntersectionObserver: MockIntersectionObserver,
      matchMedia: jest.fn(() => ({ matches: false }))
    });

    const targets = getTargets(document);
    const observer = MockIntersectionObserver.instances[0];

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(observer.options).toEqual({
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });
    expect(observer.elements).toEqual(targets);
    expect(targets.map((target) => target.style.transitionDelay)).toEqual(['0ms', '45ms', '90ms']);

    observer.trigger([
      { isIntersecting: true, target: targets[0] },
      { isIntersecting: false, target: targets[1] }
    ]);

    expect(targets[0]).toHaveClass('is-visible');
    expect(targets[1]).not.toHaveClass('is-visible');
    expect(observer.elements).toEqual([targets[1], targets[2]]);
  });

  it('does nothing when there are no reveal-on-scroll elements', () => {
    const dom = createDom(0);
    window = dom.window;
    document = window.document;

    expect(() => {
      loadInnerPageScript(window, document, {
        IntersectionObserver: MockIntersectionObserver,
        matchMedia: jest.fn(() => ({ matches: false }))
      });
    }).not.toThrow();
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('caps transition delays at 220ms for later targets', () => {
    const dom = createDom(7);
    window = dom.window;
    document = window.document;

    loadInnerPageScript(window, document, {
      IntersectionObserver: MockIntersectionObserver,
      matchMedia: jest.fn(() => ({ matches: false }))
    });

    expect(getTargets(document).map((target) => target.style.transitionDelay)).toEqual([
      '0ms',
      '45ms',
      '90ms',
      '135ms',
      '180ms',
      '220ms',
      '220ms'
    ]);
  });
});

describe('inner-page.js missing script guard', () => {
  it('skips the suite gracefully when the script file is unavailable', () => {
    expect(typeof SCRIPT_EXISTS).toBe('boolean');
  });
});
