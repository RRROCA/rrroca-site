const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('safety dashboard partial', () => {
  it('includes a visible legend, axis labels, and tooltip container', () => {
    const partialPath = path.join(__dirname, '..', 'themes', 'rrroca', 'layouts', 'partials', 'safety-dashboard.html');
    const markup = fs.readFileSync(partialPath, 'utf8');
    const document = new JSDOM(markup).window.document;

    expect(document.querySelectorAll('.safety-chart-legend .safety-legend-item')).toHaveLength(3);
    expect(document.querySelector('.safety-axis-label-y')?.textContent).toMatch(/reported incidents/i);
    expect(document.querySelector('.safety-axis-label-x')?.textContent).toMatch(/time period/i);
    expect(document.querySelector('#safety-chart-tooltip')).not.toBeNull();
    expect(document.querySelector('#safety-chart')?.getAttribute('aria-describedby')).toBe('safety-chart-summary');
  });
});
