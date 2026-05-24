/**
 * RRROCA AI Community Assistant
 * Client-side knowledge-based chatbot — zero API cost.
 * Uses a curated knowledge base to answer community questions.
 */

const RRROCA_KNOWLEDGE = {
  safety: {
    keywords: ['safe', 'crime', 'dangerous', 'security', 'police', 'break in', 'theft', 'steal', 'robbery', 'assault', 'violent'],
    response: `🛡️ **Rocky Ridge & Royal Oak are among Calgary's safest communities!**

📊 **Latest Stats (Q1 2025 – Q1 2026):**
• Total incidents: ~22/year
• Monthly average: ~1.8 crimes/month
• Violent crime: near zero
• Most incidents: vehicle-related property crime

🔒 **Safety Tips:**
• Lock vehicles & garage doors nightly
• Keep exterior lights on
• Report suspicious activity: CPS Non-Emergency 403-266-1234
• Emergency: always call 911

📈 [View the full Safety Dashboard →](/safety/)`
  },
  membership: {
    keywords: ['join', 'member', 'membership', 'sign up', 'register', 'fee', 'cost', 'dues'],
    response: `🏔️ **Join RRROCA — Your Community Association!**

💰 **Membership Tiers:**
• Individual: $25/year
• Family: $35/year ⭐ Most popular
• Business: $100/year

✅ **Benefits:**
• Vote at the Annual General Meeting
• Community newsletter
• Event discounts & early access
• Sports program priority (Family)
• Business directory listing (Business)

👉 [Join or Renew →](/get-involved/)`
  },
  events: {
    keywords: ['event', 'happening', 'party', 'festival', 'gathering', 'bbq', 'block party', 'upcoming'],
    response: `🎉 **Community Events**

RRROCA hosts events throughout the year:
• 🏘️ Block parties (summer)
• 🎃 Halloween events
• 🎄 Holiday celebrations
• ⚽ Sports leagues & programs
• 🌻 Community garden events

📱 Join the **RRROCA Families Facebook Group** (5,000+ members) for the latest:
[Facebook Group →](https://www.facebook.com/groups/royaloakrockyridgefamilies)

📅 [View All Events →](/events/)`
  },
  parks: {
    keywords: ['park', 'playground', 'green space', 'path', 'trail', 'coulee', 'nature', 'walk', 'hike'],
    response: `🌳 **Parks & Green Spaces**

Rocky Ridge & Royal Oak are blessed with amazing natural spaces:
• 🏞️ Twelve Mile Coulee — major natural park
• 🌿 Community parks with playgrounds
• 🚶 Extensive pathway network
• 🌻 Community garden plots available
• 🐻 Wildlife corridors (deer, coyotes — please secure garbage!)

[Community & Parks Info →](/community/)`
  },
  schools: {
    keywords: ['school', 'education', 'daycare', 'childcare', 'kindergarten', 'elementary', 'junior high'],
    response: `🏫 **Schools in Our Community**

Our neighbourhoods are served by several schools:
• Public schools (CBE)
• Catholic schools (CCSD)
• Various daycare & preschool options

[Full Schools Directory →](/community/schools/)`
  },
  sports: {
    keywords: ['sport', 'soccer', 'hockey', 'baseball', 'basketball', 'swim', 'recreation', 'league', 'club', 'fitness'],
    response: `⚽ **Sports & Recreation**

Active community with many options:
• ⚾ Baseball leagues
• ⚽ Soccer programs
• 🏒 Hockey (various levels)
• 🏃 Running & fitness groups
• 🏊 Nearby recreation centres

[Sports & Clubs Info →](/sports/)`
  },
  second: {
    keywords: ['second', 'seconding', 'seconder', 'second a motion'],
    response: `✋ **Second a Motion**

After a motion is proposed, another board member must second it before voting can begin. Visit the Board Action Center to see pending motions and second them with one click.

👉 [Board Action Center →](/board/actions/)`
  },
  board: {
    keywords: ['board', 'board action center', 'board actions', 'directors', 'governance', 'motion', 'vote', 'voting'],
    response: `👥 **Board Governance**

Board members can manage motions, second pending items, and vote through the Board Action Center.

👉 [Board Action Center →](/board/actions/)
📘 [Board Governance →](/board/)`
  },
  volunteer: {
    keywords: ['volunteer', 'help', 'contribute', 'board', 'committee', 'give back'],
    response: `🤝 **Volunteer with RRROCA!**

We're a volunteer-run community association and we need YOU:
• 📋 Board of Directors positions
• 🛡️ Safety committee
• 🎉 Event planning
• 📰 Newsletter contributions
• 🌻 Community garden

👉 [Volunteer Opportunities →](/get-involved/volunteer/)`
  },
  business: {
    keywords: ['business', 'restaurant', 'store', 'shop', 'service', 'plumber', 'electrician', 'local'],
    response: `🏪 **Local Business Directory**

Support businesses in Rocky Ridge & Royal Oak!
Our directory features local services, restaurants, and shops.

💼 **List your business:** $100/year with RRROCA Business membership includes directory listing.

[Business Directory →](/business-directory/)`
  },
  about: {
    keywords: ['about', 'what is', 'rrroca', 'community association', 'who', 'board', 'bylaws', 'history'],
    response: `🏔️ **About RRROCA**

The Rocky Ridge Royal Oak Community Association represents ~25,000 residents in NW Calgary.

👥 **What we do:**
• Advocate for our communities with the City of Calgary
• Organize events & programs
• Maintain community safety initiatives
• Support sports & recreation
• Coordinate with CPS & emergency services

📋 Run entirely by volunteers!

[Learn More →](/about/)`
  },
  emergency: {
    keywords: ['emergency', '911', 'fire', 'ambulance', 'flood', 'gas leak', 'power out'],
    response: `🚨 **Emergency Contacts**

• **911** — Police, Fire, Ambulance (life-threatening)
• **403-266-1234** — CPS Non-Emergency (suspicious activity, noise, etc.)
• **311** — City of Calgary (roads, water, bylaws)
• **1-800-511-3447** — ATCO Gas Emergency
• **403-514-6100** — ENMAX Power Outages

⚠️ **If in doubt, call 911.**`
  },
  contentDrafting: {
    keywords: ['write', 'draft', 'news post', 'article', 'compose', 'create content', 'write a post', 'publish'],
    response: `✍️ **Content Drafting Assistant**

I can help you draft content for the RRROCA website! Here's how:

📝 **Tell me what to write about**, and I'll draft it in our community voice. For example:
• "Write a news post about the June 15 community cleanup"
• "Draft an event announcement for the summer BBQ"
• "Write a safety reminder about coyote season"

📋 **I'll format it with:**
• A clear, engaging title
• Date and description metadata
• Friendly, community-focused tone
• Relevant links and CTAs

🖥️ **Then publish it:**
1. Go to [Content Manager →](/admin/)
2. Sign in with your @rrroca.org account
3. Create a new News/Event post
4. Paste the draft and hit Save

💡 **Tip:** Just describe what happened or what's coming up, and I'll handle the formatting!`
  },
  cms: {
    keywords: ['cms', 'admin', 'content manager', 'edit website', 'update website', 'publish', 'add page', 'edit page', 'upload'],
    response: `🖥️ **Content Manager (CMS)**

Board members can update the website directly — no coding needed!

**How to use it:**
1. Go to [Content Manager →](/admin/)
2. Sign in with your **@rrroca.org Google account**
3. Choose a collection (News, Events, Board Members, etc.)
4. Click "New" to create or select an existing entry to edit
5. Write/edit using the visual editor
6. Hit **Save** → changes go live automatically

**What you can manage:**
• 📰 News posts & announcements
• 📅 Events
• 👥 Board member profiles
• 🏘️ Community pages
• 🛡️ Safety updates

**Tips:**
• Use "Draft" toggle to save without publishing
• Images can be uploaded directly in the editor
• Changes deploy within ~2 minutes of saving

Need help drafting content? Just ask me — e.g. "write a news post about the AGM results"!`
  },
  motionDrafting: {
    keywords: ['propose', 'propose a motion', 'draft a motion', 'new motion', 'resolution', 'motion about', 'motion for', 'motion to'],
    response: `📋 **Draft a Board Motion**

I'll help you write a formal motion. Here's the structure:

**Title:** Short, clear name (e.g., "Approve Playground Fence Repair")

**Motion Text:** Starts with "BE IT RESOLVED THAT the Board of Directors..."
• What exactly is being decided
• Keep it to one clear action

**Background:** Why this is needed — context for other directors

**Financial Impact:** "$0" or describe costs + funding source

**Example:**
> BE IT RESOLVED THAT the Board of Directors approve up to $500 from unrestricted funds for replacement of damaged fencing at the Tuscany Hills playground, with work to be coordinated by the Facilities Director.

📝 **Tell me what you want to propose** and I'll draft it in proper format!

👉 Submit via [Board Action Center →](/board/actions/) when ready.`
  },
  boardProcess: {
    keywords: ['quorum', 'how does voting work', 'board process', 'how many votes', 'majority', 'procedure', 'roberts rules', 'alberta societies act', 'seconding process', 'how motions work'],
    response: `⚖️ **Board Process & Procedures**

**Motion Lifecycle:**
1. **Propose** — any director fills out the motion form
2. **Second** — one other director seconds (confirms it's worth discussing)
3. **Vote** — all directors vote: 👍 For, 👎 Against, or 😐 Abstain
4. **Result** — simple majority of votes cast determines outcome

**Key Rules (Alberta Societies Act):**
• Quorum = majority of elected directors
• Each director gets one vote per motion
• Abstentions don't count toward the majority
• Votes are recorded and published for transparency
• Email/async voting is valid under our bylaws

**Governance Principle:**
Decisions requiring a board motion: budget >$500, bylaws changes, new partnerships, strategic direction. Day-to-day portfolio decisions stay with the responsible director.

👉 [Board Action Center →](/board/actions/)
📘 [Full Governance Info →](/board/)`
  },
  boardComms: {
    keywords: ['email residents', 'newsletter', 'communicate', 'announce', 'announcement', 'send email', 'draft email', 'notify members', 'board communication'],
    response: `📨 **Board Communications**

I'll help you draft communications! Tell me the topic and audience.

**Communication Channels:**
• 📰 **Website News Post** — for all residents ([use the CMS](/admin/))
• 📱 **Facebook Group** — quick announcements to 5,000+ members
• 📧 **Communal Email** — membership-wide notifications
• 🏘️ **Board-to-Board** — @rrroca.org email for internal coordination

**Tone Guidelines (RRROCA Voice):**
• Friendly neighbour, not corporate press release
• Warm, approachable, community-focused
• Action-oriented — always tell people what to DO
• Local flavour — reference our parks, streets, community

**Tell me what to draft:**
• "Draft an email about the community cleanup on June 15"
• "Write a Facebook post about the new playground equipment"
• "Help me announce the AGM results"

I'll format it in the right tone for whichever channel you pick!`
  },
  principles: {
    keywords: ['principle', 'architecture principle', 'decision framework', 'why did we', 'zero cost', 'volunteer turnover', 'bus factor', 'portability', 'graceful degradation', 'tech strategy', 'technology strategy'],
    response: `🏔️ **RRROCA Architecture Principles**

Our 9 principles guide every technology decision:

| # | Principle | One-Liner |
|---|-----------|-----------|
| **P0** | Community First | Every feature serves resident engagement |
| **P1** | Survive Turnover | No single departure breaks the site |
| **P2** | Zero Cost | Runs at $0 indefinitely |
| **P3** | Minimal Maintenance | Zero effort to keep lights on |
| **P4** | Progressive Skill | Content editors → power users → AI → devs |
| **P5** | Security by Elimination | No server = no attack surface |
| **P6** | Graceful Degradation | Broken service = reduced, never broken |
| **P7** | Portability | Standard formats, no lock-in |
| **P8** | Document Decisions | Next volunteer understands WHY |

**Decision Test:** "If the person who set this up disappeared tomorrow, could the next volunteer figure it out within 30 minutes?"

**Quick links:**
• 📄 [Full Principles Doc](https://github.com/RRROCA/rrroca-site/blob/master/docs/architecture-principles.md)
• 📋 [Technology Strategy Motion →](/board/motions/2026-05-integrated-technology-strategy/)`
  },
  meetingPrep: {
    keywords: ['meeting', 'agenda', 'prepare for meeting', 'board meeting', 'what do i need', 'pending items', 'my actions', 'what needs my attention'],
    response: `📅 **Board Meeting Prep**

Here's how to get ready:

**Before the meeting:**
1. Check the [Board Action Center →](/board/actions/) for pending items
2. Review any motions awaiting your second or vote
3. Check your @rrroca.org email for motion notifications

**During the meeting:**
• Propose new motions live from your phone/laptop
• Second and vote in real-time as items come up
• The AI bot (me!) can help draft motion text on the spot

**After the meeting:**
• All votes are recorded automatically
• Approved motions publish to the website immediately
• No meeting minutes needed for formal decisions — they're on-chain!

**Quick check:** Ask me "what motions are pending?" to see what needs attention right now.

💡 **Tip:** Board members receive email notifications for all motion activity. Check your @rrroca.org inbox!`
  }
};

const VOLUNTEER_OPPORTUNITIES = {
  'events': {
    title: '🎉 Events & Social',
    description: `**Event planning** is one of our most fun volunteer roles!

Help organize:
• 🏘️ Block parties & BBQs
• 🎃 Halloween & holiday celebrations
• 🌻 Community garden socials
• 🏅 Sports awards & year-end events

**Time commitment:** A few hours per event, mostly spring–fall.`,
    cta: 'volunteer@rrroca.org',
    formLink: '/get-involved/volunteer/'
  },
  'safety': {
    title: '🛡️ Safety & Neighbourhood Watch',
    description: `**Help keep our community safe!**

Get involved with:
• 📊 Safety data tracking & reporting
• 👀 Neighbourhood watch coordination
• 🚗 Traffic & pedestrian safety initiatives
• 🤝 CPS liaison & community policing

**Perfect if you:** care about data, safety, or community policing relationships.`,
    cta: 'safety@rrroca.org',
    formLink: '/get-involved/volunteer/'
  },
  'parks': {
    title: '🌳 Parks & Environment',
    description: `**⭐ Board position VACANT — Parks Director needed!**

This is a real leadership opportunity:
• 🏞️ Twelve Mile Coulee stewardship
• 🌻 Community garden program oversight
• 🛝 Playground & green space advocacy with the City
• 🐻 Wildlife corridor coordination

**No experience required** — the board will support you. Just bring your passion for green spaces!`,
    cta: 'president@rrroca.org',
    formLink: '/get-involved/volunteer/',
    vacant: true
  },
  'sports': {
    title: '⚽ Sports & Youth',
    description: `**Help coordinate youth and adult sports!**

We need help with:
• ⚾ Baseball league coordination
• ⚽ Soccer program support
• 🏒 Hockey registration & scheduling
• 🏃 Fitness group organizing

**Time commitment:** Seasonal, mostly evenings/weekends during active seasons.`,
    cta: 'programs@rrroca.org',
    formLink: '/get-involved/volunteer/'
  },
  'communications': {
    title: '📢 Communications & Media',
    description: `**⭐ Board position VACANT — Communications Director needed!**

Own the community's voice:
• 📰 Newsletter creation & distribution
• 📱 Social media management (Facebook, Instagram)
• 🌐 Website content updates
• 📸 Event photography & community stories

**No experience required** — if you're good with words or social media, this is your spot!`,
    cta: 'president@rrroca.org',
    formLink: '/get-involved/volunteer/',
    vacant: true
  },
  'board': {
    title: '👥 Board Leadership',
    description: `**Make real decisions for 25,000 residents!**

Currently vacant board positions:
• 🏛️ **Vice President** — support the President, step in when needed
• 📢 **Communications** — own newsletters, social media, website content
• 🤝 **Membership** — grow our member base, coordinate renewals
• 🌳 **Parks** — green spaces, playgrounds, community garden
• 🚗 **Transportation** — roads, transit, pedestrian safety advocacy

**No experience required.** Monthly meetings (first Tuesday). The board will mentor you!`,
    cta: 'president@rrroca.org',
    formLink: '/get-involved/volunteer/',
    vacant: true
  }
};

const VOLUNTEER_TRIGGERS = [
  'volunteer', 'volunteering', 'help the community', 'help out',
  'get involved', 'give back', 'how can i help', 'want to help',
  'make a difference', 'contribute', 'committee',
  'join the board', 'board position', 'vacant position',
  'open position', 'board vacancy', 'serve on the board'
];

function isVolunteerIntent(question) {
  const q = question.toLowerCase();
  return VOLUNTEER_TRIGGERS.some(trigger => q.includes(trigger));
}

function handleVolunteerMatchmaker(input) {
  const state = assistantState.volunteerMatchmaker;

  if (!state.active) {
    // Step 1: Show interest discovery
    state.active = true;
    state.step = 'interest';

    addMessage(`That's awesome! 🎉 RRROCA is volunteer-powered and we'd love your help.

**What are you most interested in?** Pick what excites you, or just tell me in your own words:`, 'bot');
    showVolunteerInterestChips();
    return;
  }

  if (state.step === 'interest') {
    // Step 2: Match interest to opportunity
    const match = matchVolunteerInterest(input);
    if (match) {
      showVolunteerOpportunity(match);
    } else {
      addMessage(`I didn't catch a specific area — no worries! Here's everything we need help with:`, 'bot');
      showVolunteerOpportunity(VOLUNTEER_OPPORTUNITIES['board']);
    }
    state.step = 'done';
    state.active = false;
  }
}

function matchVolunteerInterest(input) {
  const q = input.toLowerCase();
  const mappings = [
    { keys: ['event', 'social', 'party', 'bbq', 'block party', 'celebration'], id: 'events' },
    { keys: ['safe', 'security', 'watch', 'police', 'crime', 'neighbourhood'], id: 'safety' },
    { keys: ['park', 'garden', 'green', 'nature', 'tree', 'environment', 'coulee', 'playground'], id: 'parks' },
    { keys: ['sport', 'soccer', 'hockey', 'baseball', 'youth', 'kids', 'fitness', 'recreation'], id: 'sports' },
    { keys: ['communicat', 'media', 'newsletter', 'social media', 'writing', 'content', 'photo'], id: 'communications' },
    { keys: ['board', 'leadership', 'director', 'president', 'governance', 'decision'], id: 'board' }
  ];

  for (const mapping of mappings) {
    if (mapping.keys.some(key => q.includes(key))) {
      return VOLUNTEER_OPPORTUNITIES[mapping.id];
    }
  }
  return null;
}

function showVolunteerInterestChips() {
  const suggestions = document.getElementById('ai-suggestions');
  if (!suggestions) return;
  suggestions.style.display = 'flex';
  suggestions.innerHTML = '';

  const chips = [
    { label: '🎉 Events', value: 'events' },
    { label: '🛡️ Safety', value: 'safety' },
    { label: '🌳 Parks', value: 'parks' },
    { label: '⚽ Sports', value: 'sports' },
    { label: '📢 Comms', value: 'communications' },
    { label: '👥 Board', value: 'board' }
  ];

  chips.forEach(chip => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = chip.label;
    const opp = VOLUNTEER_OPPORTUNITIES[chip.value];
    if (opp && opp.vacant) {
      btn.classList.add('ai-chip-highlight');
    }
    btn.addEventListener('click', () => {
      // Show the chip text as a user message
      addMessage(chip.label, 'user');
      suggestions.style.display = 'none';
      handleVolunteerMatchmaker(chip.value);
    });
    suggestions.appendChild(btn);
  });
}

function showVolunteerOpportunity(opportunity) {
  let msg = opportunity.description;

  msg += `\n\n**Ready to jump in?**
• 📝 [Fill out the volunteer form →](${opportunity.formLink})
• 📧 Email: ${opportunity.cta}`;

  if (opportunity.vacant) {
    msg += `\n\n💡 *Vacant board roles just need someone who cares — no experience required. Email the President directly!*`;
  }

  addMessage(msg, 'bot');

  // Show follow-up chips
  const suggestions = document.getElementById('ai-suggestions');
  if (!suggestions) return;
  suggestions.style.display = 'flex';
  suggestions.innerHTML = '';

  const followUps = [
    { label: 'Tell me about other roles', action: () => { assistantState.volunteerMatchmaker = { active: true, step: 'interest' }; addMessage('What other areas interest you?', 'user'); showVolunteerInterestChips(); }},
    { label: 'What does RRROCA do?', action: () => askAI('What does RRROCA do?') },
    { label: 'Join as a member', action: () => askAI('How do I join RRROCA?') }
  ];

  followUps.forEach(chip => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = chip.label;
    btn.addEventListener('click', () => {
      suggestions.style.display = 'none';
      chip.action();
    });
    suggestions.appendChild(btn);
  });
}

const BOARD_EMAIL_DOMAIN = '@rrroca.org';
const BOARD_CONTEXT_TTL_MS = 60000;
const AUTH_LOGIN_URL = '/.auth/login/google';
const PENDING_INTENT_KEY = 'rrroca_pending_intent';
const assistantState = {
  boardUser: null,
  pendingMotions: [],
  boardGreetingShown: false,
  authInitialized: false,
  boardInitPromise: null,
  boardContextPromise: null,
  boardContextLoadedAt: 0,
  volunteerMatchmaker: { active: false, step: null }
};

function getApiBase() {
  const host = window.location.hostname.toLowerCase();
  if (host === 'rrroca.org' || host === 'www.rrroca.org' || host.endsWith('.azurestaticapps.net')) {
    return '';
  }

  // Local/CI: cross-origin auth won't work due to CORS, return empty
  // to let auth calls fail gracefully against localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return '';
  }

  return 'https://zealous-wave-07c275a0f.7.azurestaticapps.net';
}

function formatBoardMemberName(email) {
  return String(email || '')
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Board member';
}

function isBoardMember(user) {
  return Boolean(user && typeof user.email === 'string' && user.email.toLowerCase().endsWith(BOARD_EMAIL_DOMAIN));
}

function normalizePendingMotions(motions) {
  if (!Array.isArray(motions)) {
    return [];
  }

  return motions
    .filter((motion) => motion && (motion.status === 'awaiting_second' || motion.status === 'open'))
    .map((motion) => ({
      number: motion.number,
      motionNumber: motion.motionNumber,
      title: motion.title,
      status: motion.status,
      votesFor: Number(motion.votesFor) || 0,
      votesAgainst: Number(motion.votesAgainst) || 0,
      votesAbstain: Number(motion.votesAbstain) || 0,
      url: motion.url || ''
    }));
}

async function fetchBoardAuthStatus() {
  if (typeof fetch !== 'function') {
    return null;
  }

  try {
    const response = await fetch(getApiBase() + '/.auth/me', { credentials: 'include' });
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const principal = data && data.clientPrincipal;
    if (!principal || !principal.userDetails) {
      return null;
    }

    const email = String(principal.userDetails || '').toLowerCase();
    return {
      id: principal.userId,
      email,
      name: formatBoardMemberName(email),
      provider: principal.identityProvider,
      roles: Array.isArray(principal.userRoles) ? principal.userRoles : []
    };
  } catch (error) {
    return null;
  }
}

async function fetchPendingMotions() {
  if (typeof fetch !== 'function' || !isBoardMember(assistantState.boardUser)) {
    return [];
  }

  try {
    const response = await fetch(getApiBase() + '/api/motion?action=list', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      return assistantState.pendingMotions;
    }

    const data = await response.json();
    const pendingMotions = normalizePendingMotions(data && data.motions);
    assistantState.pendingMotions = pendingMotions;
    assistantState.boardContextLoadedAt = Date.now();
    return pendingMotions;
  } catch (error) {
    return assistantState.pendingMotions;
  }
}

function ensureBoardContext(forceRefresh = false) {
  if (!isBoardMember(assistantState.boardUser)) {
    return Promise.resolve([]);
  }

  const isFresh = assistantState.boardContextLoadedAt && (Date.now() - assistantState.boardContextLoadedAt) < BOARD_CONTEXT_TTL_MS;
  if (!forceRefresh && isFresh) {
    return Promise.resolve(assistantState.pendingMotions);
  }

  if (assistantState.boardContextPromise) {
    return assistantState.boardContextPromise;
  }

  assistantState.boardContextPromise = fetchPendingMotions().finally(() => {
    assistantState.boardContextPromise = null;
  });

  return assistantState.boardContextPromise;
}

function initializeBoardAwareness() {
  if (assistantState.authInitialized) {
    return Promise.resolve(assistantState.boardUser);
  }

  if (assistantState.boardInitPromise) {
    return assistantState.boardInitPromise;
  }

  assistantState.boardInitPromise = (async () => {
    const boardUser = await fetchBoardAuthStatus();
    assistantState.boardUser = isBoardMember(boardUser) ? boardUser : null;
    assistantState.authInitialized = true;

    if (assistantState.boardUser) {
      await ensureBoardContext(true);
    }

    return assistantState.boardUser;
  })().catch(() => {
    assistantState.boardUser = null;
    assistantState.pendingMotions = [];
    assistantState.boardContextLoadedAt = 0;
    assistantState.authInitialized = true;
    return null;
  }).finally(() => {
    assistantState.boardInitPromise = null;
  });

  return assistantState.boardInitPromise;
}

async function maybeShowBoardGreeting() {
  const panel = document.getElementById('ai-panel');
  if (!panel || !panel.classList.contains('open')) {
    return;
  }

  await initializeBoardAwareness();

  // Update UI based on auth state
  updateAuthUI();

  if (!isBoardMember(assistantState.boardUser) || assistantState.boardGreetingShown) {
    return;
  }

  const pendingMotions = await ensureBoardContext();
  if (!panel.classList.contains('open') || assistantState.boardGreetingShown) {
    return;
  }

  const name = assistantState.boardUser.name;
  let greeting = `Welcome back, ${name}. **Board mode active.**`;

  if (pendingMotions.length > 0) {
    greeting += ` You have ${pendingMotions.length} motion(s) pending your attention.`;
  }

  greeting += '\n\nI can help you submit motions, draft content, or report issues. Just ask!';

  addMessage(greeting, 'bot');
  showBoardActionChips();
  assistantState.boardGreetingShown = true;

  // Check for restored intent from pre-login redirect
  restorePendingIntent();
}

function showBoardActionChips() {
  const suggestions = document.getElementById('ai-suggestions');
  if (!suggestions) return;
  suggestions.style.display = 'flex';
  suggestions.innerHTML = '';

  const chips = [
    { label: 'Submit a motion', question: 'I want to submit a motion' },
    { label: 'Draft a post', question: 'I want to draft a news article' },
    { label: 'Open motions', question: 'What motions are open?' },
    { label: 'Report an issue', question: 'I want to report a site issue' }
  ];

  chips.forEach(chip => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = chip.label;
    btn.setAttribute('data-ai-question', chip.question);
    btn.addEventListener('click', () => askAI(chip.question));
    suggestions.appendChild(btn);
  });
}

function updateAuthUI() {
  const badge = document.getElementById('ai-fab-badge');
  const subtitle = document.getElementById('ai-panel-subtitle');
  const hint = document.querySelector('.ai-board-hint');

  if (isBoardMember(assistantState.boardUser)) {
    // Show board mode badge on FAB
    if (badge) badge.classList.add('active');
    // Update subtitle
    if (subtitle) subtitle.textContent = `Board mode · ${assistantState.boardUser.name}`;
    // Hide the hint since they're already signed in
    if (hint) hint.style.display = 'none';
  } else {
    if (badge) badge.classList.remove('active');
    if (subtitle) subtitle.textContent = 'Your community AI helper';
  }
}

function promptSignIn(intent) {
  // Store intent for after login
  if (intent) {
    try {
      sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify({
        message: intent,
        timestamp: Date.now(),
        returnUrl: window.location.pathname
      }));
    } catch (e) { /* sessionStorage unavailable */ }
  }

  const redirectUri = encodeURIComponent(window.location.pathname + '?chatopen=1');
  const loginUrl = AUTH_LOGIN_URL + '?post_login_redirect_uri=' + redirectUri;

  const signInHtml = `To do that, I need to verify you're a board member. Please sign in with your RRROCA Google account:

<a href="${loginUrl}" class="ai-signin-btn">Sign in with Google →</a>

Your request will be remembered — I'll pick up right where we left off.`;

  addMessage(signInHtml, 'bot');
}

function restorePendingIntent() {
  try {
    const stored = sessionStorage.getItem(PENDING_INTENT_KEY);
    if (!stored) return;

    const intent = JSON.parse(stored);
    sessionStorage.removeItem(PENDING_INTENT_KEY);

    // Only restore if less than 5 minutes old
    if (Date.now() - intent.timestamp > 300000) return;

    if (intent.message && isBoardMember(assistantState.boardUser)) {
      addMessage(`I remember you wanted to: "${intent.message}" — let me help with that now.`, 'bot');
      // Auto-submit the intent
      setTimeout(() => askAI(intent.message), 500);
    }
  } catch (e) { /* ignore parse errors */ }
}

function shouldPromptSignIn(question) {
  if (isBoardMember(assistantState.boardUser)) return false;
  if (isVolunteerIntent(question)) return false;
  const q = question.toLowerCase();
  const boardTriggers = [
    'submit a motion', 'propose a motion', 'new motion', 'create a motion',
    'draft a post', 'draft an article', 'create content', 'write a post',
    'update the site', 'edit the site', 'publish',
    'report an issue', 'report a bug', 'site issue',
    'i\'m on the board', 'board member', 'board mode'
  ];
  return boardTriggers.some(trigger => q.includes(trigger));
}

function toggleAssistant() {
  const panel = document.getElementById('ai-panel');
  const fab = document.getElementById('ai-fab');
  panel.classList.toggle('open');
  fab.classList.toggle('hidden');
  if (panel.classList.contains('open')) {
    document.getElementById('ai-input-field').focus();
    maybeShowBoardGreeting();
  }
}

function askAI(question) {
  const input = document.getElementById('ai-input-field');
  input.value = question;
  handleAISubmit(new Event('submit'));
}

// Conversation history for multi-turn context
const conversationHistory = [];

function handleAISubmit(e) {
  e.preventDefault();
  const input = document.getElementById('ai-input-field');
  const question = input.value.trim();
  if (!question) return;

  addMessage(question, 'user');
  input.value = '';

  // Check if this is part of the volunteer matchmaker flow
  if (assistantState.volunteerMatchmaker.active || isVolunteerIntent(question)) {
    handleVolunteerMatchmaker(question);
    return;
  }

  // Check if this is a board action from an unauthenticated user
  if (shouldPromptSignIn(question)) {
    promptSignIn(question);
    return;
  }

  input.disabled = true;

  // Hide suggestion buttons after first question
  const suggestions = document.getElementById('ai-suggestions');
  if (suggestions) suggestions.style.display = 'none';

  // Show typing indicator
  const typingId = showTypingIndicator();

  // Try API first, fall back to keyword matching
  askAIAPI(question)
    .then((reply) => {
      removeTypingIndicator(typingId);
      addMessage(reply, 'bot');
      conversationHistory.push({ role: 'user', content: question });
      conversationHistory.push({ role: 'assistant', content: reply });
      input.disabled = false;
      input.focus();
    })
    .catch(() => {
      removeTypingIndicator(typingId);
      const fallbackReply = findAnswer(question);
      addMessage(fallbackReply, 'bot');
      input.disabled = false;
      input.focus();
    });
}

async function askAIAPI(question) {
  if (typeof fetch !== 'function') {
    throw new Error('API unavailable');
  }

  await initializeBoardAwareness();

  let boardContext;
  if (isBoardMember(assistantState.boardUser)) {
    const pendingMotions = await ensureBoardContext();
    boardContext = {
      pendingMotions: pendingMotions.map((motion) => ({
        number: motion.number,
        motionNumber: motion.motionNumber,
        title: motion.title,
        status: motion.status,
        votesFor: motion.votesFor,
        votesAgainst: motion.votesAgainst,
        votesAbstain: motion.votesAbstain,
        url: motion.url
      }))
    };
  }

  const response = await fetch(getApiBase() + '/api/chat', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: question,
      history: conversationHistory.slice(-6),
      boardContext
    })
  });

  const data = await response.json();

  if (!response.ok || data.fallback) {
    throw new Error(data.error || 'API unavailable');
  }

  return data.reply;
}

function showTypingIndicator() {
  const messages = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = 'ai-message ai-bot ai-typing';
  div.id = 'ai-typing-' + Date.now();
  div.innerHTML = '<p><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></p>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div.id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function findAnswer(question) {
  const q = question.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [topic, data] of Object.entries(RRROCA_KNOWLEDGE)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (q.includes(keyword)) {
        score += keyword.length; // Longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = data;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  return `🤔 I'm not sure about that, but here are some ways to get help:

• 📧 **Email:** info@rrroca.org
• 👨‍👩‍👧‍👦 **Facebook Group:** [RRROCA Families](https://www.facebook.com/groups/royaloakrockyridgefamilies) (5,000+ members)
• 📘 **Facebook Page:** [RRROCA Official](https://www.facebook.com/rrroca.org)
• 🔍 Try the **site search** (Ctrl+K) to find what you need

Or try asking about: safety, events, membership, parks, sports, volunteering, or local businesses!`;
}

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBaseUrl() {
  if (window.RRROCA && typeof window.RRROCA.getBaseUrl === 'function') {
    return window.RRROCA.getBaseUrl();
  }

  const meta = document.querySelector('meta[name="base-url"]');
  const content = meta && meta.content ? meta.content.trim() : '';
  return content ? content.replace(/\/$/, '') : '';
}

function addMessage(text, type) {
  const messages = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = `ai-message ai-${type}`;

  // Simple markdown-like rendering
  const base = getBaseUrl();
  const html = escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, (_, label, href) => {
      const url = href.startsWith('/') && !href.startsWith('//') ? base + href : href;
      return `<a href="${url}">${label}</a>`;
    })
    .replace(/^• /gm, '&bull; ')
    .replace(/\n/g, '<br>');

  div.innerHTML = `<p>${html}</p>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function bindAssistantControls() {
  document.querySelectorAll('[data-toggle-assistant]').forEach((button) => {
    button.addEventListener('click', toggleAssistant);
  });

  document.querySelectorAll('[data-ai-question]').forEach((button) => {
    button.addEventListener('click', () => {
      askAI(button.dataset.aiQuestion || '');
    });
  });

  const form = document.querySelector('.ai-input');
  if (form) {
    form.addEventListener('submit', handleAISubmit);
  }
}

function initializeAssistant() {
  bindAssistantControls();
  initializeBoardAwareness().then(() => {
    updateAuthUI();
    // Auto-open chatbot if returning from auth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.has('chatopen')) {
      // Clean URL without reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      // Open chatbot
      const panel = document.getElementById('ai-panel');
      if (panel && !panel.classList.contains('open')) {
        toggleAssistant();
      }
    }
  }).catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAssistant);
} else {
  initializeAssistant();
}

// Keyboard shortcut: Escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const panel = document.getElementById('ai-panel');
    if (panel && panel.classList.contains('open')) {
      toggleAssistant();
    }
  }
});

// Public API for programmatic access (e.g., "Share an Idea" links)
window.RRROCAChatbot = {
  open: function (prefillMessage) {
    const panel = document.getElementById('ai-panel');
    if (!panel) return;
    if (!panel.classList.contains('open')) {
      toggleAssistant();
    }
    if (prefillMessage) {
      const input = document.getElementById('ai-input-field');
      if (input) {
        input.value = prefillMessage;
        input.focus();
      }
    }
  },
  close: function () {
    const panel = document.getElementById('ai-panel');
    if (panel && panel.classList.contains('open')) {
      toggleAssistant();
    }
  }
};

