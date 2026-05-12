(function () {
  function initGallery() {
    const filters = Array.from(document.querySelectorAll('.gallery-filter'));
    const cards = Array.from(document.querySelectorAll('.gallery-card'));
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('gallery-lightbox-image');
    const lightboxCaption = document.getElementById('gallery-lightbox-caption');
    const lightboxCategory = document.getElementById('gallery-lightbox-category');
    const triggers = Array.from(document.querySelectorAll('.gallery-card-button'));
    const closeControls = Array.from(document.querySelectorAll('[data-lightbox-close]'));

    if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxCategory) {
      return;
    }

    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        const selected = filter.dataset.filter;

        filters.forEach((button) => {
          const active = button === filter;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        cards.forEach((card) => {
          const matches = selected === 'All' || card.dataset.category === selected;
          card.classList.toggle('is-hidden', !matches);
        });
      });
    });

    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.classList.remove('gallery-lightbox-open');
      lightboxImage.src = '';
      lightboxImage.alt = '';
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        lightboxImage.src = trigger.dataset.lightboxSrc;
        lightboxImage.alt = trigger.dataset.lightboxCaption;
        lightboxCaption.textContent = trigger.dataset.lightboxCaption;
        lightboxCategory.textContent = trigger.dataset.lightboxCategory;
        lightbox.hidden = false;
        document.body.classList.add('gallery-lightbox-open');
      });
    });

    closeControls.forEach((control) => {
      control.addEventListener('click', closeLightbox);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !lightbox.hidden) {
        closeLightbox();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }
})();
