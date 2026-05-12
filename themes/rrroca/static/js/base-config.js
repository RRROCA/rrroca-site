(function () {
  function getBaseUrl() {
    const meta = document.querySelector('meta[name="base-url"]');
    const content = meta && meta.content ? meta.content.trim() : '';
    return content ? content.replace(/\/$/, '') : '';
  }

  window.RRROCA = window.RRROCA || {};
  window.RRROCA.getBaseUrl = getBaseUrl;
})();
