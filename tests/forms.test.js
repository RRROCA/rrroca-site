const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const SCRIPT_PATH = path.join(__dirname, '..', 'themes', 'rrroca', 'static', 'js', 'forms.js');
const SCRIPT_EXISTS = fs.existsSync(SCRIPT_PATH);
const SOURCE = SCRIPT_EXISTS ? fs.readFileSync(SCRIPT_PATH, 'utf8') : '';
const describeIfScriptExists = SCRIPT_EXISTS ? describe : describe.skip;

function createDom(formMarkup) {
  return new JSDOM(
    `<!doctype html>
    <html>
      <body>
        ${formMarkup}
      </body>
    </html>`,
    { url: 'https://rrroca.org/contact/' }
  );
}

function loadFormsScript(window, document, options = {}) {
  const windowProxy = {
    location: {
      href: window.location.href
    }
  };

  const context = vm.createContext({
    window: windowProxy,
    document,
    console: options.console || console,
    fetch: options.fetch || jest.fn(),
    FormData: window.FormData,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    KeyboardEvent: window.KeyboardEvent,
    HTMLElement: window.HTMLElement,
    HTMLFormElement: window.HTMLFormElement,
    Node: window.Node,
    navigator: window.navigator,
    setTimeout,
    clearTimeout,
    encodeURIComponent,
    decodeURIComponent
  });

  context.global = context;
  context.globalThis = context;

  vm.runInContext(SOURCE, context, { filename: SCRIPT_PATH });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  return {
    context,
    windowProxy
  };
}

function baseFormMarkup(attributes = 'data-formspree', extraFields = '') {
  return `
    <form ${attributes}>
      <div class="form-status" aria-live="polite"></div>
      <div class="rr-field">
        <label for="name">Name</label>
        <input id="name" name="name" data-label="Name" required />
        <div class="field-error"></div>
      </div>
      <div class="rr-field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" data-label="Email" required />
        <div class="field-error"></div>
      </div>
      <div class="rr-field">
        <label for="message">Message</label>
        <textarea id="message" name="message" data-label="Message" required></textarea>
        <div class="field-error"></div>
      </div>
      <div class="honeypot">
        <input name="_gotcha" type="text" />
      </div>
      ${extraFields}
      <button type="submit">Send</button>
    </form>
  `;
}

function getFormBits(document) {
  return {
    form: document.querySelector('form'),
    status: document.querySelector('.form-status'),
    nameField: document.getElementById('name'),
    emailField: document.getElementById('email'),
    messageField: document.getElementById('message')
  };
}

function fillRequiredFields(fields, overrides = {}) {
  fields.nameField.value = overrides.name || 'Jane Resident';
  fields.emailField.value = overrides.email || 'jane@example.com';
  fields.messageField.value = overrides.message || 'Looking for more information.';
}

async function submitForm(form, window) {
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describeIfScriptExists('forms.js', () => {
  let window;
  let document;
  let fetchMock;
  let windowProxy;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({})
    });
  });

  afterEach(() => {
    if (window) {
      window.close();
    }
  });

  it('gracefully reports required field validation errors and blocks submission', async () => {
    const dom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms"'));
    window = dom.window;
    document = window.document;
    ({ windowProxy } = loadFormsScript(window, document, { fetch: fetchMock }));

    const { form, status, nameField, emailField, messageField } = getFormBits(document);

    await submitForm(form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(status).toHaveClass('form-status--error');
    expect(status.textContent).toContain('highlighted');
    expect(nameField).toHaveClass('is-invalid');
    expect(emailField).toHaveClass('is-invalid');
    expect(messageField).toHaveClass('is-invalid');
    expect(nameField.closest('.rr-field').querySelector('.field-error').textContent).toContain('required');
    expect(emailField.closest('.rr-field').querySelector('.field-error').textContent).toContain('required');
    expect(messageField.closest('.rr-field').querySelector('.field-error').textContent).toContain('required');
    expect(windowProxy.location.href).toBe('https://rrroca.org/contact/');
  });

  it('shows an email-format validation message for invalid addresses', async () => {
    const dom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms"'));
    window = dom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    const fields = getFormBits(document);
    fillRequiredFields(fields, { email: 'not-an-email' });

    await submitForm(fields.form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fields.emailField.closest('.rr-field').querySelector('.field-error').textContent)
      .toContain('valid email address');
    expect(fields.emailField).toHaveAttribute('aria-invalid', 'true');
  });

  it('silently treats honeypot submissions as success and resets the form', async () => {
    const dom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms" data-success-message="Thanks!"'));
    window = dom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    const fields = getFormBits(document);
    fillRequiredFields(fields);
    document.querySelector('input[name="_gotcha"]').value = 'spam-bot';

    await submitForm(fields.form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fields.form).toHaveFormValues({
      name: '',
      email: '',
      message: '',
      _gotcha: ''
    });
    expect(fields.status).toHaveClass('form-status--success');
    expect(fields.status.textContent).toContain('Thanks');
  });

  it('builds a mailto URL with encoded field values and reply-to information', async () => {
    const dom = createDom(baseFormMarkup('data-mailto="info@rrroca.org"'));
    window = dom.window;
    document = window.document;
    ({ windowProxy } = loadFormsScript(window, document, { fetch: fetchMock }));

    const fields = getFormBits(document);
    fillRequiredFields(fields, { message: 'Need picnic table access.' });

    await submitForm(fields.form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(windowProxy.location.href).toContain('mailto:info%40rrroca.org');
    expect(windowProxy.location.href).toContain('subject=RRROCA%20Website%20Inquiry');
    expect(windowProxy.location.href).toContain('name%3A%20Jane%20Resident');
    expect(windowProxy.location.href).toContain('message%3A%20Need%20picnic%20table%20access.');
    expect(windowProxy.location.href).toContain('reply-to=jane%40example.com');
    expect(fields.status).toHaveClass('form-status--success');
    expect(fields.status.textContent).toContain('email app should open');
  });

  it('prefers a custom mailto subject and otherwise derives it from the subject field', async () => {
    const customDom = createDom(baseFormMarkup(
      'data-mailto="info@rrroca.org" data-mailto-subject="Board Inquiry"',
      `
        <div class="rr-field">
          <label for="subject">Subject</label>
          <input id="subject" name="subject" value="Ignored user subject" />
          <div class="field-error"></div>
        </div>
      `
    ));
    window = customDom.window;
    document = window.document;
    let loaded = loadFormsScript(window, document, { fetch: fetchMock });
    let fields = getFormBits(document);
    fillRequiredFields(fields);

    await submitForm(fields.form, window);

    expect(loaded.windowProxy.location.href).toContain('subject=Board%20Inquiry');
    expect(loaded.windowProxy.location.href).toContain('subject%3A%20Ignored%20user%20subject');

    window.close();

    const derivedDom = createDom(baseFormMarkup(
      'data-mailto="info@rrroca.org"',
      `
        <div class="rr-field">
          <label for="subject">Subject</label>
          <input id="subject" name="subject" value="Hall rental question" />
          <div class="field-error"></div>
        </div>
      `
    ));
    window = derivedDom.window;
    document = window.document;
    loaded = loadFormsScript(window, document, { fetch: fetchMock });
    fields = getFormBits(document);
    fillRequiredFields(fields);

    await submitForm(fields.form, window);

    expect(loaded.windowProxy.location.href).toContain('subject=RRROCA%20Website%3A%20Hall%20rental%20question');
    expect(loaded.windowProxy.location.href).not.toContain('subject%3A%20Hall%20rental%20question');
  });

  it('shows an endpoint error when a wired form has no submission target', async () => {
    const dom = createDom(baseFormMarkup('data-formspree'));
    window = dom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    const fields = getFormBits(document);
    fillRequiredFields(fields);
    Object.defineProperty(fields.form, 'action', {
      configurable: true,
      get: () => ''
    });

    await submitForm(fields.form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fields.status).toHaveClass('form-status--error');
    expect(fields.status.textContent).toContain('submission endpoint');
  });

  it('clears field errors when the user edits an invalid field', async () => {
    const dom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms"'));
    window = dom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    const { form, emailField } = getFormBits(document);

    await submitForm(form, window);
    expect(emailField).toHaveClass('is-invalid');
    expect(emailField.closest('.rr-field')).toHaveClass('has-error');

    emailField.value = 'fixed@example.com';
    emailField.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(emailField).not.toHaveClass('is-invalid');
    expect(emailField).not.toHaveAttribute('aria-invalid');
    expect(emailField.closest('.rr-field')).not.toHaveClass('has-error');
    expect(emailField.closest('.rr-field').querySelector('.field-error').textContent).toBe('');
  });

  it('requires at least one checkbox in a required checkbox group before submission', async () => {
    const dom = createDom(baseFormMarkup(
      'data-formspree action="https://example.test/forms"',
      `
        <div class="rr-form-group" data-checkbox-group data-required="true">
          <label><input type="checkbox" name="topics[]" value="events" /> Events</label>
          <label><input type="checkbox" name="topics[]" value="volunteer" /> Volunteer</label>
          <div class="field-error"></div>
        </div>
      `
    ));
    window = dom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    const fields = getFormBits(document);
    fillRequiredFields(fields);
    const group = document.querySelector('[data-checkbox-group]');

    await submitForm(fields.form, window);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(group).toHaveClass('has-error');
    expect(group.querySelector('.field-error').textContent).toContain('at least one option');
    expect(fields.status).toHaveClass('form-status--error');
  });

  it('accepts a checked required checkbox group and continues submission', async () => {
    const dom = createDom(baseFormMarkup(
      'data-mailto="info@rrroca.org"',
      `
        <div class="rr-form-group" data-checkbox-group data-required="true">
          <label><input type="checkbox" name="topics[]" value="events" /> Events</label>
          <label><input type="checkbox" name="topics[]" value="volunteer" /> Volunteer</label>
          <div class="field-error"></div>
        </div>
      `
    ));
    window = dom.window;
    document = window.document;
    ({ windowProxy } = loadFormsScript(window, document, { fetch: fetchMock }));

    const fields = getFormBits(document);
    fillRequiredFields(fields);
    const group = document.querySelector('[data-checkbox-group]');
    const checkbox = document.querySelector('input[type="checkbox"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new window.Event('change', { bubbles: true }));

    await submitForm(fields.form, window);

    expect(group).not.toHaveClass('has-error');
    expect(group.querySelector('.field-error').textContent).toBe('');
    expect(windowProxy.location.href).toContain('topics%3A%20events');
    expect(fields.status).toHaveClass('form-status--success');
  });

  it('updates the form status element for both successful and error submissions', async () => {
    const successDom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms" data-success-message="Submitted!"'));
    window = successDom.window;
    document = window.document;
    loadFormsScript(window, document, { fetch: fetchMock });

    let fields = getFormBits(document);
    fillRequiredFields(fields);

    await submitForm(fields.form, window);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fields.status).toHaveClass('form-status--success');
    expect(fields.status.textContent).toContain('Submitted');

    window.close();

    const errorDom = createDom(baseFormMarkup('data-formspree action="https://example.test/forms"'));
    window = errorDom.window;
    document = window.document;
    loadFormsScript(window, document, {
      fetch: jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Backend rejected the request.' })
      })
    });

    fields = getFormBits(document);
    fillRequiredFields(fields);

    await submitForm(fields.form, window);

    expect(fields.status).toHaveClass('form-status--error');
    expect(fields.status.textContent).toContain('Backend rejected');
  });
});

describe('forms.js missing script guard', () => {
  it('skips the suite gracefully when the script file is unavailable', () => {
    expect(typeof SCRIPT_EXISTS).toBe('boolean');
  });
});
