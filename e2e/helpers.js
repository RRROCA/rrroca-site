async function stubFuse(page) {
  const fuseBody = `
    class Fuse {
      constructor(items) {
        this.items = Array.isArray(items) ? items : [];
      }
      search(query) {
        const q = String(query || '').toLowerCase();
        return this.items
          .filter(item => [item.title, item.content, item.section, item.tags]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q))
          .slice(0, 10)
          .map(item => ({ item, score: 0 }));
      }
    }
    window.Fuse = Fuse;
  `;

  // Intercept both CDN and self-hosted Fuse.js paths
  await page.route('https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js', async route => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: fuseBody });
  });
  await page.route('**/js/vendor/fuse.min.js', async route => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: fuseBody });
  });
}

async function countUniqueColumnStarts(page, selector) {
  return page.locator(selector).evaluateAll(elements => {
    const lefts = elements
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0)
      .map(rect => Math.round(rect.left));

    return [...new Set(lefts)].length;
  });
}

async function hasHorizontalScroll(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > window.innerWidth + 1;
  });
}

async function contrastAudit(page, checks) {
  return page.evaluate(items => {
    const toRgb = color => {
      const match = color.match(/\d+(\.\d+)?/g) || [];
      return match.slice(0, 3).map(Number);
    };

    const toLinear = value => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };

    const luminance = rgb => {
      const [r, g, b] = rgb.map(toLinear);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const ratio = (foreground, background) => {
      const l1 = luminance(foreground);
      const l2 = luminance(background);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    return items.map(item => {
      const target = document.querySelector(item.selector);
      const background = document.querySelector(item.backgroundSelector);

      if (!target || !background) {
        return { ...item, ratio: 0, missing: true };
      }

      const foregroundRgb = toRgb(getComputedStyle(target).color);
      const backgroundRgb = toRgb(getComputedStyle(background).backgroundColor);

      return {
        ...item,
        ratio: ratio(foregroundRgb, backgroundRgb),
        missing: false,
      };
    });
  }, checks);
}

module.exports = {
  contrastAudit,
  countUniqueColumnStarts,
  hasHorizontalScroll,
  stubFuse,
};
