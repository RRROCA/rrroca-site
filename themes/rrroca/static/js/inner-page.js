document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = [...document.querySelectorAll('.reveal-on-scroll')];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!revealTargets.length) {
    return;
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.15
  });

  revealTargets.forEach((target, index) => {
    target.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(target);
  });
});
