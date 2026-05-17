/**
 * Live vote tally for RRROCA board motions.
 * Fetches reaction counts from GitHub Issues API (public, no auth needed)
 * and updates the vote display on motion pages.
 */
(function() {
  'use strict';

  // Only run on motion pages with a github_issue_url
  const voteBtn = document.querySelector('.motion-vote-cta a[href*="github.com"]');
  const votePanel = document.querySelector('.motion-vote-panel');
  if (!votePanel) return;

  // Extract issue number from the vote button URL or page metadata
  const issueUrl = voteBtn ? voteBtn.href : null;
  if (!issueUrl) return;

  const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (!match) return;

  const [, owner, repo, issueNumber] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;

  fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
    .then(res => {
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json();
    })
    .then(issue => {
      const reactions = issue.reactions || {};
      const votesFor = reactions['+1'] || 0;
      const votesAgainst = reactions['-1'] || 0;
      const votesAbstain = reactions.confused || 0; // GitHub's confused reaction maps to abstain
      const total = votesFor + votesAgainst + votesAbstain;

      // Update vote counts
      const counts = votePanel.querySelectorAll('.vote-count');
      if (counts.length >= 3) {
        counts[0].innerHTML = `<span class="vote-dot vote-dot--for"></span> ${votesFor} For`;
        counts[1].innerHTML = `<span class="vote-dot vote-dot--against"></span> ${votesAgainst} Against`;
        counts[2].innerHTML = `<span class="vote-dot vote-dot--abstain"></span> ${votesAbstain} Abstain`;
      }

      // Update progress bar
      const bar = votePanel.querySelector('.motion-vote-bar');
      if (bar && total > 0) {
        const pctFor = Math.round((votesFor / total) * 100);
        const pctAgainst = Math.round((votesAgainst / total) * 100);
        const pctAbstain = 100 - pctFor - pctAgainst;
        bar.innerHTML = `
          ${pctFor > 0 ? `<div class="motion-vote-bar-segment motion-vote-bar--for" style="width: ${pctFor}%"></div>` : ''}
          ${pctAgainst > 0 ? `<div class="motion-vote-bar-segment motion-vote-bar--against" style="width: ${pctAgainst}%"></div>` : ''}
          ${pctAbstain > 0 ? `<div class="motion-vote-bar-segment motion-vote-bar--abstain" style="width: ${pctAbstain}%"></div>` : ''}
        `;
      } else if (bar && total === 0) {
        bar.innerHTML = `<div class="motion-vote-bar-segment motion-vote-bar--empty" style="width: 100%"></div>`;
      }

      // Update quorum status
      const quorumEl = votePanel.querySelector('.motion-quorum-status');
      if (quorumEl) {
        const quorumMatch = quorumEl.textContent.match(/\/(\d+)/);
        const quorum = quorumMatch ? parseInt(quorumMatch[1]) : 5;
        if (total >= quorum) {
          quorumEl.innerHTML = `<span class="quorum-met">\u2705 Quorum reached (${total}/${quorum} votes)</span>`;
        } else {
          const needed = quorum - total;
          quorumEl.innerHTML = `<span class="quorum-pending">\u23f3 ${needed} more vote${needed > 1 ? 's' : ''} needed for quorum (${total}/${quorum})</span>`;
        }
      }

      // Update issue state (open/closed)
      if (issue.state === 'closed') {
        const statusEl = document.querySelector('.motion-status');
        if (statusEl && statusEl.classList.contains('motion-status--open')) {
          if (votesFor > votesAgainst) {
            statusEl.className = 'motion-status motion-status--approved';
            statusEl.textContent = '\u2705 Approved';
          } else {
            statusEl.className = 'motion-status motion-status--defeated';
            statusEl.textContent = '\u274c Defeated';
          }
        }
      }
    })
    .catch(err => {
      console.log('Vote tally fetch skipped:', err.message);
    });
})();