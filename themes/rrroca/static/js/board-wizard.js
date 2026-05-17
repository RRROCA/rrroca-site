(function () {
  const EMAIL_SUFFIX = '@rrroca.org';
  const REFRESH_INTERVAL_MS = 60000;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) {
      return 'No deadline set';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatMoney(value) {
    if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
      return 'No spending requested';
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2
    }).format(Number(value));
  }

  function truncate(text, length) {
    const value = String(text || '').trim();
    if (!value) {
      return '';
    }

    return value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
  }

  function deriveTitle(text) {
    const cleaned = String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/^be it resolved that\s*/i, '')
      .trim();

    return truncate(cleaned || 'Board motion', 90);
  }

  function isValidBoardEmail(value) {
    return String(value || '').trim().toLowerCase().endsWith(EMAIL_SUFFIX);
  }

  function getApiBase(root) {
    const configuredOrigin = (root.dataset.swaOrigin || 'https://zealous-wave-07c275a0f.7.azurestaticapps.net').replace(/\/$/, '');
    const host = window.location.hostname.toLowerCase();

    if (host === 'rrroca.github.io') {
      return configuredOrigin;
    }

    if (host === 'rrroca.org' || host === 'www.rrroca.org' || host.endsWith('.azurestaticapps.net')) {
      return window.location.origin.replace(/\/$/, '');
    }

    return configuredOrigin;
  }

  async function requestJson(root, action, payload) {
    const endpoint = `${getApiBase(root)}/api/motion?action=${encodeURIComponent(action)}`;
    const options = {
      method: payload ? 'POST' : 'GET'
    };

    if (payload) {
      options.headers = {
        'Content-Type': 'text/plain;charset=UTF-8'
      };
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Sorry, there was a problem completing that action.');
    }

    return data;
  }

  function setStatus(target, type, message) {
    if (!target) {
      return;
    }

    target.className = 'form-status';
    target.textContent = message || '';

    if (type) {
      target.classList.add(`form-status--${type}`);
    }
  }

  function clearFieldError(input) {
    if (!input) {
      return;
    }

    const field = input.closest('.rr-field');
    if (field) {
      field.classList.remove('has-error');
      const error = field.querySelector('.field-error');
      if (error) {
        error.textContent = '';
      }
    }

    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  }

  function showFieldError(input, message) {
    if (!input) {
      return;
    }

    const field = input.closest('.rr-field');
    if (field) {
      field.classList.add('has-error');
      const error = field.querySelector('.field-error');
      if (error) {
        error.textContent = message;
      }
    }

    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
  }

  function validateIdentity(root, action) {
    const nameInput = root.querySelector(`[data-actor-name="${action}"]`);
    const emailInput = root.querySelector(`[data-actor-email="${action}"]`);
    let isValid = true;

    [nameInput, emailInput].forEach(clearFieldError);

    if (!nameInput.value.trim()) {
      showFieldError(nameInput, 'Please enter your name.');
      isValid = false;
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, `Please enter your ${EMAIL_SUFFIX} email.`);
      isValid = false;
    } else if (!isValidBoardEmail(emailInput.value)) {
      showFieldError(emailInput, `Email must end with ${EMAIL_SUFFIX}.`);
      isValid = false;
    }

    return isValid
      ? {
          name: nameInput.value.trim(),
          email: emailInput.value.trim()
        }
      : null;
  }

  function buildPreview(root) {
    const motionText = root.querySelector('[name="motionText"]').value.trim();
    const background = root.querySelector('[name="background"]').value.trim();
    const category = root.querySelector('[name="category"]').value;
    const amount = root.querySelector('[name="amount"]').value;
    const portfolio = root.querySelector('[name="portfolio"]').value.trim();
    const deadline = root.querySelector('[name="deadline"]').value;
    const preview = root.querySelector('[data-motion-preview]');

    if (!preview) {
      return;
    }

    if (!motionText && !background) {
      preview.innerHTML = '<p>Your formal motion preview updates as you type.</p>';
      return;
    }

    preview.innerHTML = `
      <p class="board-preview-kicker">${escapeHtml(deriveTitle(motionText))}</p>
      <p><strong>BE IT RESOLVED THAT</strong> the RRROCA Board approve the following:</p>
      <p>${escapeHtml(motionText || 'Describe the approval being requested.').replace(/\n/g, '<br>')}</p>
      <p><strong>Background:</strong> ${escapeHtml(background || 'Explain why this is needed.').replace(/\n/g, '<br>')}</p>
      <ul>
        <li><strong>Category:</strong> ${escapeHtml(category || 'Not selected yet')}</li>
        <li><strong>Amount:</strong> ${escapeHtml(formatMoney(amount))}</li>
        <li><strong>Portfolio:</strong> ${escapeHtml(portfolio || 'To be assigned')}</li>
        <li><strong>Decision by:</strong> ${escapeHtml(formatDate(deadline))}</li>
      </ul>
    `;
  }

  function setSubmitting(button, isSubmitting, label) {
    if (!button) {
      return;
    }

    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Working…' : label;
  }

  function renderSecondList(root, motions) {
    const target = root.querySelector('[data-motion-list="second"]');
    if (!target) {
      return;
    }

    if (!motions.length) {
      target.innerHTML = '<p class="board-wizard-empty">No motions are waiting for a second right now.</p>';
      return;
    }

    target.innerHTML = motions.map((motion) => `
      <article class="board-motion-card" data-issue-number="${motion.number}">
        <div class="board-motion-card-header">
          <div>
            <p class="board-motion-card-meta">Motion ${escapeHtml(motion.motionNumber || motion.number)} · Proposed by ${escapeHtml(motion.proposer || 'Board member')}</p>
            <h3>${escapeHtml(motion.title)}</h3>
          </div>
          <span class="motion-status motion-status--tabled">Awaiting second</span>
        </div>
        <p class="board-motion-card-summary">${escapeHtml(motion.summary || 'No summary available yet.')}</p>
        <div class="board-motion-card-details">
          <span>Submitted ${escapeHtml(formatDate(motion.created))}</span>
          <span>${escapeHtml(motion.category || 'Other')}</span>
          ${motion.deadline ? `<span>Need decision by ${escapeHtml(formatDate(motion.deadline))}</span>` : ''}
        </div>
        <div class="board-motion-card-actions">
          <button type="button" class="btn btn-primary" data-second-motion="${motion.number}">Second this motion</button>
          <a class="btn btn-secondary" href="${escapeHtml(motion.url)}" target="_blank" rel="noopener">View issue</a>
        </div>
      </article>
    `).join('');
  }

  function renderVoteList(root, motions) {
    const target = root.querySelector('[data-motion-list="vote"]');
    if (!target) {
      return;
    }

    if (!motions.length) {
      target.innerHTML = '<p class="board-wizard-empty">No motions are open for voting right now.</p>';
      return;
    }

    target.innerHTML = motions.map((motion) => `
      <article class="board-motion-card" data-issue-number="${motion.number}">
        <div class="board-motion-card-header">
          <div>
            <p class="board-motion-card-meta">Motion ${escapeHtml(motion.motionNumber || motion.number)} · Proposed by ${escapeHtml(motion.proposer || 'Board member')}</p>
            <h3>${escapeHtml(motion.title)}</h3>
          </div>
          <span class="motion-status motion-status--open">Open for voting</span>
        </div>
        <p class="board-motion-card-summary">${escapeHtml(motion.summary || 'No summary available yet.')}</p>
        <div class="board-motion-card-details">
          <span>Seconder: ${escapeHtml(motion.seconder || 'Recorded in GitHub')}</span>
          <span>For ${escapeHtml(motion.votesFor)} · Against ${escapeHtml(motion.votesAgainst)} · Abstain ${escapeHtml(motion.votesAbstain)}</span>
        </div>
        <div class="board-vote-actions" role="group" aria-label="Vote options for ${escapeHtml(motion.title)}">
          <button type="button" class="btn board-vote-button board-vote-button--for" data-cast-vote="for" data-issue-number="${motion.number}">✅ For</button>
          <button type="button" class="btn board-vote-button board-vote-button--against" data-cast-vote="against" data-issue-number="${motion.number}">❌ Against</button>
          <button type="button" class="btn board-vote-button board-vote-button--abstain" data-cast-vote="abstain" data-issue-number="${motion.number}">⏸️ Abstain</button>
        </div>
      </article>
    `).join('');
  }

  async function refreshMotions(root) {
    const secondTarget = root.querySelector('[data-motion-list="second"]');
    const voteTarget = root.querySelector('[data-motion-list="vote"]');

    if (secondTarget) {
      secondTarget.innerHTML = '<p class="board-wizard-empty">Loading pending motions…</p>';
    }

    if (voteTarget) {
      voteTarget.innerHTML = '<p class="board-wizard-empty">Loading motions open for voting…</p>';
    }

    try {
      const data = await requestJson(root, 'list');
      const motions = Array.isArray(data.motions) ? data.motions : [];
      renderSecondList(root, motions.filter((motion) => motion.status === 'awaiting_second'));
      renderVoteList(root, motions.filter((motion) => motion.status === 'open'));
    } catch (error) {
      const message = `<p class="board-wizard-empty">${escapeHtml(error.message || 'Unable to load motions right now.')}</p>`;
      if (secondTarget) {
        secondTarget.innerHTML = message;
      }
      if (voteTarget) {
        voteTarget.innerHTML = message;
      }
    }
  }

  function switchTab(root, key) {
    root.querySelectorAll('[data-tab-trigger]').forEach((button) => {
      const active = button.dataset.tabTrigger === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    root.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const active = panel.dataset.tabPanel === key;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  function validateProposeForm(form) {
    let valid = true;
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      clearFieldError(input);
      if (input.type === 'hidden' || input.disabled) {
        return;
      }

      if (!input.checkValidity()) {
        showFieldError(input, input.validationMessage || 'Please review this field.');
        valid = false;
      }
    });

    const emailInput = form.querySelector('[name="proposerEmail"]');
    if (emailInput.value && !isValidBoardEmail(emailInput.value)) {
      showFieldError(emailInput, `Email must end with ${EMAIL_SUFFIX}.`);
      valid = false;
    }

    const amountInput = form.querySelector('[name="amount"]');
    const spending = form.querySelector('[name="spending"]').value;
    if (spending === 'yes' && !amountInput.value) {
      showFieldError(amountInput, 'Please enter the spending amount.');
      valid = false;
    }

    return valid;
  }

  async function handleProposeSubmit(root, form) {
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('[type="submit"]');
    setStatus(status, '', '');

    if (!validateProposeForm(form)) {
      setStatus(status, 'error', 'Please fix the highlighted fields and try again.');
      return;
    }

    const formData = new FormData(form);
    const motionText = String(formData.get('motionText') || '').trim();
    const payload = {
      title: deriveTitle(motionText),
      motionText,
      background: String(formData.get('background') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      amount: formData.get('spending') === 'yes' ? String(formData.get('amount') || '').trim() : '',
      portfolio: String(formData.get('portfolio') || '').trim() || String(formData.get('category') || '').trim(),
      deadline: String(formData.get('deadline') || '').trim(),
      supportingDocs: String(formData.get('supportingDocs') || '').trim(),
      proposerName: String(formData.get('proposerName') || '').trim(),
      proposerEmail: String(formData.get('proposerEmail') || '').trim()
    };

    setSubmitting(button, true, button.dataset.submitLabel || 'Publish motion');
    setStatus(status, '', 'Publishing your motion…');

    try {
      const result = await requestJson(root, 'propose', payload);
      form.reset();
      form.querySelector('[name="spending"]').value = 'no';
      const amountWrapper = form.querySelector('[data-amount-wrapper]');
      if (amountWrapper) {
        amountWrapper.classList.add('board-wizard-hidden');
      }
      form.querySelectorAll('[data-spending-option]').forEach((buttonElement) => {
        const active = buttonElement.dataset.spendingOption === 'no';
        buttonElement.classList.toggle('is-active', active);
        buttonElement.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      buildPreview(form);
      setStatus(status, 'success', `Your motion has been published! Motion ${result.motionNumber} is now live on GitHub issue #${result.issueNumber}. The board will see it on the Governance page.`);
      setStatus(root.querySelector('[data-global-status]'), 'success', 'Your motion has been published! The board will see it on the Governance page.');
      switchTab(root, 'second');
      await refreshMotions(root);
    } catch (error) {
      setStatus(status, 'error', error.message || 'Unable to publish your motion.');
    } finally {
      setSubmitting(button, false, button.dataset.submitLabel || 'Publish motion');
    }
  }

  async function handleSecond(root, button) {
    const identity = validateIdentity(root, 'second');
    if (!identity) {
      setStatus(root.querySelector('[data-global-status]'), 'error', `Please enter your name and ${EMAIL_SUFFIX} email to second a motion.`);
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Recording second…';

    try {
      await requestJson(root, 'second', {
        issueNumber: Number(button.dataset.secondMotion),
        seconderName: identity.name,
        seconderEmail: identity.email
      });
      setStatus(root.querySelector('[data-global-status]'), 'success', 'Motion seconded! Voting is now open.');
      switchTab(root, 'vote');
      await refreshMotions(root);
    } catch (error) {
      setStatus(root.querySelector('[data-global-status]'), 'error', error.message || 'Unable to record the second.');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  async function handleVote(root, button) {
    const identity = validateIdentity(root, 'vote');
    if (!identity) {
      setStatus(root.querySelector('[data-global-status]'), 'error', `Please enter your name and ${EMAIL_SUFFIX} email to vote.`);
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Recording vote…';

    try {
      await requestJson(root, 'vote', {
        issueNumber: Number(button.dataset.issueNumber),
        voterName: identity.name,
        voterEmail: identity.email,
        vote: button.dataset.castVote
      });
      setStatus(root.querySelector('[data-global-status]'), 'success', 'Vote recorded! Results update in real-time on the motion page.');
      await refreshMotions(root);
    } catch (error) {
      setStatus(root.querySelector('[data-global-status]'), 'error', error.message || 'Unable to record your vote.');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function bindSpendingToggle(form) {
    const hiddenInput = form.querySelector('[name="spending"]');
    const amountWrapper = form.querySelector('[data-amount-wrapper]');
    const amountInput = form.querySelector('[name="amount"]');

    form.querySelectorAll('[data-spending-option]').forEach((button) => {
      button.addEventListener('click', () => {
        const selected = button.dataset.spendingOption;
        hiddenInput.value = selected;
        form.querySelectorAll('[data-spending-option]').forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle('is-active', active);
          candidate.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (selected === 'yes') {
          amountWrapper.classList.remove('board-wizard-hidden');
          amountInput.required = true;
        } else {
          amountWrapper.classList.add('board-wizard-hidden');
          amountInput.required = false;
          amountInput.value = '';
          clearFieldError(amountInput);
        }

        buildPreview(form);
      });
    });
  }

  function bindRoot(root) {
    const proposeForm = root.querySelector('[data-motion-form="propose"]');
    if (!proposeForm) {
      return;
    }

    bindSpendingToggle(proposeForm);
    buildPreview(proposeForm);

    proposeForm.addEventListener('input', (event) => {
      if (event.target.matches('input, textarea, select')) {
        clearFieldError(event.target);
        buildPreview(proposeForm);
      }
    });

    proposeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleProposeSubmit(root, proposeForm);
    });

    root.querySelectorAll('[data-tab-trigger]').forEach((button) => {
      button.addEventListener('click', () => switchTab(root, button.dataset.tabTrigger));
    });

    root.addEventListener('click', async (event) => {
      const secondButton = event.target.closest('[data-second-motion]');
      if (secondButton) {
        await handleSecond(root, secondButton);
        return;
      }

      const voteButton = event.target.closest('[data-cast-vote]');
      if (voteButton) {
        await handleVote(root, voteButton);
      }
    });

    root.querySelectorAll('[data-actor-name], [data-actor-email]').forEach((input) => {
      input.addEventListener('input', () => clearFieldError(input));
    });

    refreshMotions(root);
    window.setInterval(() => {
      refreshMotions(root);
    }, REFRESH_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-board-wizard]').forEach(bindRoot);
    });
  } else {
    document.querySelectorAll('[data-board-wizard]').forEach(bindRoot);
  }
})();
