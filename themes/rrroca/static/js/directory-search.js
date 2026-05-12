document.addEventListener('DOMContentLoaded', function () {
  const directory = document.querySelector('[data-directory]');
  if (!directory) return;

  const searchInput = directory.querySelector('[data-directory-search]');
  const filterButtons = Array.from(directory.querySelectorAll('[data-category-filter]'));
  const cards = Array.from(directory.querySelectorAll('[data-directory-card]'));
  const count = directory.querySelector('[data-directory-count]');
  const emptyState = directory.querySelector('[data-directory-empty]');

  let activeCategory = 'all';

  function hideCard(card) {
    if (card.hidden || card.classList.contains('is-hiding')) return;

    card.classList.add('is-hiding');

    window.setTimeout(function () {
      card.hidden = true;
      card.classList.remove('is-hiding');
      card.classList.add('is-hidden');
    }, 180);
  }

  function showCard(card) {
    if (!card.hidden && !card.classList.contains('is-hidden')) return;

    card.hidden = false;
    card.classList.add('is-hidden');

    window.requestAnimationFrame(function () {
      card.classList.remove('is-hidden');
    });
  }

  function updateDirectory() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(function (card) {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesQuery = !query || (card.dataset.search || '').includes(query);
      const isVisible = matchesCategory && matchesQuery;

      if (isVisible) {
        showCard(card);
        visibleCount += 1;
      } else {
        hideCard(card);
      }
    });

    if (count) {
      count.textContent = visibleCount === 1 ? '1 business' : visibleCount + ' businesses';
    }

    if (emptyState) {
      emptyState.classList.toggle('is-hidden', visibleCount > 0);
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeCategory = button.dataset.categoryFilter || 'all';

      if (activeCategory === 'all' && searchInput) {
        searchInput.value = '';
      }

      filterButtons.forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });

      updateDirectory();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', updateDirectory);
  }

  updateDirectory();
});
