(function () {
  const REFRESH_INTERVAL_MS = 60000;

  // --- Utilities ---

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

  // --- Auth ---

  let currentUser = null;

  async function fetchAuthStatus() {
    try {
      const response = await fetch('/.auth/me', { credentials: 'include' });
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const principal = data && data.clientPrincipal;
      if (!principal || !principal.userDetails) {
        return null;
      }

      return {
        id: principal.userId,
        email: principal.userDetails,
        name: principal.userDetails.split('@')[0],
        provider: principal.identityProvider
      };
    } catch (error) {
      return null;
    }
  }

  function updateAuthUI(root) {
    const signedOut = root.querySelector('[data-auth-signed-out]');
    const signedIn = root.querySelector('[data-auth-signed-in]');
    const username = root.querySelector('[data-auth-username]');
    const authButtons = root.querySelectorAll('[data-requires-auth]');

    if (currentUser) {
      if (signedOut) signedOut.classList.add('board-wizard-hidden');
      if (signedIn) signedIn.classList.remove('board-wizard-hidden');
      if (username) username.textContent = currentUser.email;
      authButtons.forEach(function (btn) { btn.disabled = false; });
    } else {
      if (signedOut) signedOut.classList.remove('board-wizard-hidden');
      if (signedIn) signedIn.classList.add('board-wizard-hidden');
      authButtons.forEach(function (btn) { btn.disabled = true; });
    }
  }

  // --- API ---

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
      method: payload ? 'POST' : 'GET',
      credentials: 'include'
    };

    if (payload) {
      options.headers = {
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(endpoint, options);
    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
      throw new Error(data.error || 'Sorry, there was a problem completing that action.');
    }

    return data;
  }

  // --- UI Helpers ---

  function setStatus(target, type, message) {
    if (!target) {
      return;
    }

    target.className = 'form-status';
    target.textContent = message || '';

    if (type) {
      target.classList.add('form-status--' + type);
    }
  }

  function clearFieldError(input) {
    if (!input) {
      return;
    }

    var field = input.closest('.rr-field');
    if (field) {
      field.classList.remove('has-error');
      var error = field.querySelector('.field-error');
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

    var field = input.closest('.rr-field');
    if (field) {
      field.classList.add('has-error');
      var error = field.querySelector('.field-error');
      if (error) {
        error.textContent = message;
      }
    }

    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
  }

  function buildPreview(root) {
    var motionText = root.querySelector('[name="motionText"]').value.trim();
    var background = root.querySelector('[name="background"]').value.trim();
    var category = root.querySelector('[name="category"]').value;
    var amount = root.querySelector('[name="amount"]').value;
    var portfolio = root.querySelector('[name="portfolio"]').value.trim();
    var deadline = root.querySelector('[name="deadline"]').value;
    var preview = root.querySelector('[data-motion-preview]');

    if (!preview) {
      return;
    }

    if (!motionText && !background) {
      preview.innerHTML = '<p>Your formal motion preview updates as you type.</p>';
      return;
    }

    preview.innerHTML = '\n' +
      '<p class="board-preview-kicker">' + escapeHtml(deriveTitle(motionText)) + '</p>\n' +
      '<p><strong>BE IT RESOLVED THAT</strong> the RRROCA Board approve the following:</p>\n' +
      '<p>' + escapeHtml(motionText || 'Describe the approval being requested.').replace(/\n/g, '<br>') + '</p>\n' +
      '<p><strong>Background:</strong> ' + escapeHtml(background || 'Explain why this is needed.').replace(/\n/g, '<br>') + '</p>\n' +
      '<ul>\n' +
      '<li><strong>Category:</strong> ' + escapeHtml(category || 'Not selected yet') + '</li>\n' +
      '<li><strong>Amount:</strong> ' + escapeHtml(formatMoney(amount)) + '</li>\n' +
      '<li><strong>Portfolio:</strong> ' + escapeHtml(portfolio || 'To be assigned') + '</li>\n' +
      '<li><strong>Decision by:</strong> ' + escapeHtml(formatDate(deadline)) + '</li>\n' +
      '</ul>';
  }

  function setSubmitting(button, isSubmitting, label) {
    if (!button) {
      return;
    }

    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Working…' : label;
  }

  // --- Motion Lists ---

  function renderSecondList(root, motions) {
    var target = root.querySelector('[data-motion-list="second"]');
    if (!target) {
      return;
    }

    if (!motions.length) {
      target.innerHTML = '<p class="board-wizard-empty">No motions are waiting for a second right now.</p>';
      return;
    }

    var isAuthed = !!currentUser;
    target.innerHTML = motions.map(function (motion) {
      return '<article class="board-motion-card" data-issue-number="' + motion.number + '">' +
        '<div class="board-motion-card-header">' +
        '<div>' +
        '<p class="board-motion-card-meta">Motion ' + escapeHtml(motion.motionNumber || motion.number) + ' · Proposed by ' + escapeHtml(motion.proposer || 'Board member') + '</p>' +
        '<h3>' + escapeHtml(motion.title) + '</h3>' +
        '</div>' +
        '<span class="motion-status motion-status--tabled">Awaiting second</span>' +
        '</div>' +
        '<p class="board-motion-card-summary">' + escapeHtml(motion.summary || 'No summary available yet.') + '</p>' +
        '<div class="board-motion-card-details">' +
        '<span>Submitted ' + escapeHtml(formatDate(motion.created)) + '</span>' +
        '<span>' + escapeHtml(motion.category || 'Other') + '</span>' +
        (motion.deadline ? '<span>Need decision by ' + escapeHtml(formatDate(motion.deadline)) + '</span>' : '') +
        '</div>' +
        '<div class="board-motion-card-actions">' +
        (isAuthed ? '<button type="button" class="btn btn-primary" data-second-motion="' + motion.number + '">Second this motion</button>' : '') +
        '<a class="btn btn-secondary" href="' + escapeHtml(motion.url) + '" target="_blank" rel="noopener">View on GitHub</a>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  function renderVoteList(root, motions) {
    var target = root.querySelector('[data-motion-list="vote"]');
    if (!target) {
      return;
    }

    if (!motions.length) {
      target.innerHTML = '<p class="board-wizard-empty">No motions are open for voting right now.</p>';
      return;
    }

    var isAuthed = !!currentUser;
    target.innerHTML = motions.map(function (motion) {
      return '<article class="board-motion-card" data-issue-number="' + motion.number + '">' +
        '<div class="board-motion-card-header">' +
        '<div>' +
        '<p class="board-motion-card-meta">Motion ' + escapeHtml(motion.motionNumber || motion.number) + ' · Proposed by ' + escapeHtml(motion.proposer || 'Board member') + '</p>' +
        '<h3>' + escapeHtml(motion.title) + '</h3>' +
        '</div>' +
        '<span class="motion-status motion-status--open">Open for voting</span>' +
        '</div>' +
        '<p class="board-motion-card-summary">' + escapeHtml(motion.summary || 'No summary available yet.') + '</p>' +
        '<div class="board-motion-card-details">' +
        '<span>Seconder: ' + escapeHtml(motion.seconder || 'Recorded in GitHub') + '</span>' +
        '<span>For ' + escapeHtml(motion.votesFor) + ' · Against ' + escapeHtml(motion.votesAgainst) + ' · Abstain ' + escapeHtml(motion.votesAbstain) + '</span>' +
        '</div>' +
        (isAuthed ? '<div class="board-vote-actions" role="group" aria-label="Vote options for ' + escapeHtml(motion.title) + '">' +
          '<button type="button" class="btn board-vote-button board-vote-button--for" data-cast-vote="for" data-issue-number="' + motion.number + '">✅ For</button>' +
          '<button type="button" class="btn board-vote-button board-vote-button--against" data-cast-vote="against" data-issue-number="' + motion.number + '">❌ Against</button>' +
          '<button type="button" class="btn board-vote-button board-vote-button--abstain" data-cast-vote="abstain" data-issue-number="' + motion.number + '">⏸️ Abstain</button>' +
          '</div>' : '<div class="board-motion-card-actions"><a href="' + escapeHtml(motion.url) + '" class="btn btn-secondary" target="_blank" rel="noopener">View on GitHub</a></div>') +
        '</article>';
    }).join('');
  }

  async function refreshMotions(root) {
    var secondTarget = root.querySelector('[data-motion-list="second"]');
    var voteTarget = root.querySelector('[data-motion-list="vote"]');

    if (secondTarget) {
      secondTarget.innerHTML = '<p class="board-wizard-empty">Loading pending motions…</p>';
    }

    if (voteTarget) {
      voteTarget.innerHTML = '<p class="board-wizard-empty">Loading motions open for voting…</p>';
    }

    try {
      var data = await requestJson(root, 'list');
      var motions = Array.isArray(data.motions) ? data.motions : [];
      renderSecondList(root, motions.filter(function (m) { return m.status === 'awaiting_second'; }));
      renderVoteList(root, motions.filter(function (m) { return m.status === 'open'; }));
    } catch (error) {
      var message = '<p class="board-wizard-empty">' + escapeHtml(error.message || 'Unable to load motions right now.') + '</p>';
      if (secondTarget) {
        secondTarget.innerHTML = message;
      }
      if (voteTarget) {
        voteTarget.innerHTML = message;
      }
    }
  }

  // --- Tab Navigation ---

  function switchTab(root, key) {
    root.querySelectorAll('[data-tab-trigger]').forEach(function (button) {
      var active = button.dataset.tabTrigger === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    root.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
      var active = panel.dataset.tabPanel === key;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  // --- Form Handlers ---

  function requireAuth(root) {
    if (!currentUser) {
      setStatus(root.querySelector('[data-global-status]'), 'error', 'Please sign in with your @rrroca.org Google account to perform this action.');
      return false;
    }

    return true;
  }

  function validateProposeForm(form) {
    var valid = true;
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      clearFieldError(input);
      if (input.type === 'hidden' || input.disabled) {
        return;
      }

      if (!input.checkValidity()) {
        showFieldError(input, input.validationMessage || 'Please review this field.');
        valid = false;
      }
    });

    var amountInput = form.querySelector('[name="amount"]');
    var spending = form.querySelector('[name="spending"]').value;
    if (spending === 'yes' && !amountInput.value) {
      showFieldError(amountInput, 'Please enter the spending amount.');
      valid = false;
    }

    return valid;
  }

  async function handleProposeSubmit(root, form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('[type="submit"]');
    setStatus(status, '', '');

    if (!requireAuth(root)) {
      return;
    }

    if (!validateProposeForm(form)) {
      setStatus(status, 'error', 'Please fix the highlighted fields and try again.');
      return;
    }

    var formData = new FormData(form);
    var motionText = String(formData.get('motionText') || '').trim();
    var payload = {
      title: deriveTitle(motionText),
      motionText: motionText,
      background: String(formData.get('background') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      amount: formData.get('spending') === 'yes' ? String(formData.get('amount') || '').trim() : '',
      portfolio: String(formData.get('portfolio') || '').trim() || String(formData.get('category') || '').trim(),
      deadline: String(formData.get('deadline') || '').trim(),
      supportingDocs: String(formData.get('supportingDocs') || '').trim()
    };

    setSubmitting(button, true, button.dataset.submitLabel || 'Publish motion');
    setStatus(status, '', 'Publishing your motion…');

    try {
      var result = await requestJson(root, 'propose', payload);
      form.reset();
      form.querySelector('[name="spending"]').value = 'no';
      var amountWrapper = form.querySelector('[data-amount-wrapper]');
      if (amountWrapper) {
        amountWrapper.classList.add('board-wizard-hidden');
      }
      form.querySelectorAll('[data-spending-option]').forEach(function (buttonElement) {
        var active = buttonElement.dataset.spendingOption === 'no';
        buttonElement.classList.toggle('is-active', active);
        buttonElement.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      buildPreview(form);
      setStatus(status, 'success', 'Your motion has been published! Motion ' + result.motionNumber + ' is now live. Board members have been notified.');
      setStatus(root.querySelector('[data-global-status]'), 'success', 'Motion published! Board members have been notified to second it.');
      switchTab(root, 'second');
      await refreshMotions(root);
    } catch (error) {
      setStatus(status, 'error', error.message || 'Unable to publish your motion.');
    } finally {
      setSubmitting(button, false, button.dataset.submitLabel || 'Publish motion');
    }
  }

  async function handleSecond(root, button) {
    if (!requireAuth(root)) {
      return;
    }

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Recording second…';

    try {
      await requestJson(root, 'second', {
        issueNumber: Number(button.dataset.secondMotion)
      });
      setStatus(root.querySelector('[data-global-status]'), 'success', 'Motion seconded! Voting is now open. Board members have been notified.');
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
    if (!requireAuth(root)) {
      return;
    }

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Recording vote…';

    try {
      await requestJson(root, 'vote', {
        issueNumber: Number(button.dataset.issueNumber),
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

  // --- Spending Toggle ---

  function bindSpendingToggle(form) {
    var hiddenInput = form.querySelector('[name="spending"]');
    var amountWrapper = form.querySelector('[data-amount-wrapper]');
    var amountInput = form.querySelector('[name="amount"]');

    form.querySelectorAll('[data-spending-option]').forEach(function (button) {
      button.addEventListener('click', function () {
        var selected = button.dataset.spendingOption;
        hiddenInput.value = selected;
        form.querySelectorAll('[data-spending-option]').forEach(function (candidate) {
          var active = candidate === button;
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

  // --- Init ---

  function bindRoot(root) {
    var proposeForm = root.querySelector('[data-motion-form="propose"]');
    if (!proposeForm) {
      return;
    }

    bindSpendingToggle(proposeForm);
    buildPreview(proposeForm);

    proposeForm.addEventListener('input', function (event) {
      if (event.target.matches('input, textarea, select')) {
        clearFieldError(event.target);
        buildPreview(proposeForm);
      }
    });

    proposeForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      await handleProposeSubmit(root, proposeForm);
    });

    root.querySelectorAll('[data-tab-trigger]').forEach(function (button) {
      button.addEventListener('click', function () { switchTab(root, button.dataset.tabTrigger); });
    });

    root.addEventListener('click', async function (event) {
      var secondButton = event.target.closest('[data-second-motion]');
      if (secondButton) {
        await handleSecond(root, secondButton);
        return;
      }

      var voteButton = event.target.closest('[data-cast-vote]');
      if (voteButton) {
        await handleVote(root, voteButton);
      }
    });

    // Check auth status then load motions
    fetchAuthStatus().then(function (user) {
      currentUser = user;
      updateAuthUI(root);
      refreshMotions(root);
    });

    window.setInterval(function () {
      refreshMotions(root);
    }, REFRESH_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('[data-board-wizard]').forEach(bindRoot);
    });
  } else {
    document.querySelectorAll('[data-board-wizard]').forEach(bindRoot);
  }
})();

