(function () {
  function setStatus(form, type, message) {
    const status = form.querySelector('.form-status');
    if (!status) {
      return;
    }

    status.className = 'form-status';
    status.textContent = message || '';

    if (type) {
      status.classList.add(`form-status--${type}`);
    }
  }

  function fieldWrapper(element) {
    return element.closest('.rr-field') || element.closest('.rr-form-group');
  }

  function clearError(element) {
    const wrapper = fieldWrapper(element);
    if (wrapper) {
      wrapper.classList.remove('has-error');
      const message = wrapper.querySelector('.field-error');
      if (message) {
        message.textContent = '';
      }
    }

    element.classList.remove('is-invalid');
    element.removeAttribute('aria-invalid');
  }

  function showError(element, message) {
    const wrapper = fieldWrapper(element);
    if (wrapper) {
      wrapper.classList.add('has-error');
      const error = wrapper.querySelector('.field-error');
      if (error) {
        error.textContent = message;
      }
    }

    element.classList.add('is-invalid');
    element.setAttribute('aria-invalid', 'true');
  }

  function labelFor(element) {
    return element.dataset.label || element.getAttribute('aria-label') || 'This field';
  }

  function validationMessage(element) {
    if (element.validity.valueMissing) {
      return `${labelFor(element)} is required.`;
    }

    if (element.validity.typeMismatch && element.type === 'email') {
      return 'Please enter a valid email address.';
    }

    return element.validationMessage || 'Please review this field.';
  }

  function validateCheckboxGroups(form) {
    let isValid = true;

    form.querySelectorAll('[data-checkbox-group]').forEach((group) => {
      const checkboxes = group.querySelectorAll('input[type="checkbox"]');
      const checked = Array.from(checkboxes).some((checkbox) => checkbox.checked);

      group.classList.remove('has-error');
      const error = group.querySelector('.field-error');
      if (error) {
        error.textContent = '';
      }

      if (group.dataset.required === 'true' && !checked) {
        group.classList.add('has-error');
        if (error) {
          error.textContent = 'Please select at least one option.';
        }
        isValid = false;
      }
    });

    return isValid;
  }

  function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach((field) => {
      if (field.type === 'hidden' || field.disabled || field.closest('.honeypot')) {
        return;
      }

      clearError(field);

      if (!field.checkValidity()) {
        showError(field, validationMessage(field));
        isValid = false;
      }
    });

    if (!validateCheckboxGroups(form)) {
      isValid = false;
    }

    return isValid;
  }

  async function submitForm(form) {
    const mailtoAddr = form.dataset.mailto;
    if (mailtoAddr) {
      // Mailto fallback: build email from form fields
      var fields = new FormData(form);
      var subject = form.dataset.mailtoSubject || '';
      var bodyParts = [];

      fields.forEach(function(value, key) {
        if (key === '_gotcha' || !value) return;
        // Use subject field value if no data-mailto-subject set
        if (key === 'subject' && !form.dataset.mailtoSubject) {
          subject = 'RRROCA Website: ' + value;
          return;
        }
        bodyParts.push(key.replace(/_/g, ' ').replace(/\[\]/g, '') + ': ' + value);
      });

      if (!subject) subject = 'RRROCA Website Inquiry';
      var replyTo = fields.get('email');
      var mailto = 'mailto:' + encodeURIComponent(mailtoAddr)
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(bodyParts.join('\n\n'));
      if (replyTo) {
        mailto += '&reply-to=' + encodeURIComponent(replyTo);
      }

      window.location.href = mailto;
      setStatus(form, 'success', 'Your email app should open now. If it doesn\u2019t, email us directly at ' + mailtoAddr);
      return;
    }

    if (!form.action) {
      setStatus(form, 'error', 'This form is missing a submission endpoint. Please update the form action before publishing.');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    form.classList.add('is-submitting');

    try {
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json'
        }
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(payload.errors)
          ? payload.errors.map((error) => error.message).join(' ')
          : (payload.error || 'Sorry, there was a problem sending your form. Please try again later.');
        throw new Error(message);
      }

      form.reset();
      form.querySelectorAll('.has-error').forEach((element) => element.classList.remove('has-error'));
      form.querySelectorAll('.is-invalid').forEach((element) => {
        element.classList.remove('is-invalid');
        element.removeAttribute('aria-invalid');
      });
      setStatus(form, 'success', form.dataset.successMessage || 'Thanks! Your form was submitted successfully.');
    } catch (error) {
      setStatus(form, 'error', error.message || 'Sorry, there was a network problem. Please try again later.');
    } finally {
      form.classList.remove('is-submitting');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  function wireForm(form) {
    form.addEventListener('input', (event) => {
      const target = event.target;
      if (target.matches('input, select, textarea')) {
        clearError(target);
      }
    });

    form.addEventListener('change', (event) => {
      const target = event.target;
      if (target.matches('[data-checkbox-group] input[type="checkbox"], .rr-form-group input[type="checkbox"]')) {
        const group = target.closest('[data-checkbox-group]');
        if (group && group.querySelector('input[type="checkbox"]:checked')) {
          group.classList.remove('has-error');
          const error = group.querySelector('.field-error');
          if (error) {
            error.textContent = '';
          }
        }
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus(form, '', '');

      const honeypot = form.querySelector('input[name="_gotcha"]');
      if (honeypot && honeypot.value) {
        form.reset();
        setStatus(form, 'success', form.dataset.successMessage || 'Thanks! Your form was submitted successfully.');
        return;
      }

      if (!validateForm(form)) {
        setStatus(form, 'error', 'Please fix the highlighted fields and try again.');
        return;
      }

      await submitForm(form);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-formspree], form[data-mailto]').forEach(wireForm);
  });
})();
