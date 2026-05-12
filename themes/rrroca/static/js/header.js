(function () {
  function initHeader() {
    const header = document.querySelector('.site-header');
    const nav = document.querySelector('.nav-main');
    const menuToggle = document.querySelector('.menu-toggle');
    const searchTrigger = document.querySelector('.search-trigger');

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('open');
      });
    }

    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => {
        if (typeof window.openSearch === 'function') {
          window.openSearch();
        }
      });
    }

    if (!header) {
      return;
    }

    let last = 0;
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y !== last) {
        header.classList.toggle('scrolled', y > 20);
        last = y;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
