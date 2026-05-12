(function () {
  function initNewsletterForms() {
    document.querySelectorAll('.newsletter-form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailField = form.querySelector('input[type="email"]');
        const email = emailField ? emailField.value : '';
        alert(`Thanks for subscribing! We will send newsletter updates to ${email}`);
        form.reset();
      });
    });

    document.querySelectorAll('.footer-newsletter-form').forEach((form) => {
      form.addEventListener('submit', () => {
        const popupUrl = form.dataset.popupUrl;
        if (popupUrl) {
          window.open(popupUrl, form.target || 'popupwindow');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForms);
  } else {
    initNewsletterForms();
  }
})();
