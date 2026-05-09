const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'safety-dashboard.js');
const SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8');

function extractCrimeData() {
  const match = SOURCE.match(/const crimeData = (\{[\s\S]*?\n\s*\});/);
  if (!match) {
    throw new Error('Unable to locate crimeData in safety-dashboard.js');
  }

  return Function(`"use strict"; return (${match[1]});`)();
}

describe('safety-dashboard.js', () => {
  let window;
  let document;
  let canvas;
  let ctx;

  beforeEach(() => {
    jest.useFakeTimers();

    const dom = new JSDOM(
      `<!doctype html>
      <body>
        <div id="chart-parent">
          <canvas id="safety-chart"></canvas>
        </div>
      </body>`,
      { url: 'https://rrroca.org/' }
    );

    window = dom.window;
    document = window.document;
    canvas = document.getElementById('safety-chart');

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading'
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2
    });

    canvas.parentElement.getBoundingClientRect = () => ({
      width: 720,
      height: 300,
      top: 0,
      left: 0,
      right: 720,
      bottom: 300
    });

    ctx = {
      scale: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      setLineDash: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn((text) => ({ width: text.length * 6 }))
    };

    canvas.getContext = jest.fn(() => ctx);

    const context = vm.createContext({
      window,
      document,
      console,
      setTimeout,
      clearTimeout
    });

    vm.runInContext(SOURCE, context, { filename: SCRIPT_PATH });
  });

  afterEach(() => {
    jest.useRealTimers();
    window.close();
  });

  it('defines quarterly datasets with aligned labels and series lengths', () => {
    const crimeData = extractCrimeData();

    expect(crimeData.labels).toHaveLength(8);
    expect(crimeData.rockyRidge).toHaveLength(8);
    expect(crimeData.royalOak).toHaveLength(8);
    expect(crimeData.calgaryAvg).toHaveLength(8);
    expect(crimeData.labels[0]).toBe('Q1 2023');
    expect(crimeData.labels[7]).toBe('Q4 2024');
  });

  it('renders the chart onto the canvas when the document is ready', () => {
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(canvas.width).toBe(1440);
    expect(canvas.height).toBe(500);
    expect(canvas.style.width).toBe('720px');
    expect(canvas.style.height).toBe('250px');
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 720, 250);
    expect(ctx.fillText).toHaveBeenCalledWith('Q1 2023', expect.any(Number), 242);
    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
    expect(ctx.arc.mock.calls.length).toBeGreaterThanOrEqual(24);
    expect(ctx.arc.mock.calls.length % 24).toBe(0);
  });

  it('redraws the chart after a debounced resize event', () => {
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    const drawCallsBeforeResize = ctx.clearRect.mock.calls.length;

    window.dispatchEvent(new window.Event('resize'));
    jest.advanceTimersByTime(199);
    expect(ctx.clearRect.mock.calls.length).toBe(drawCallsBeforeResize);

    jest.advanceTimersByTime(1);
    expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(drawCallsBeforeResize);
  });
});
