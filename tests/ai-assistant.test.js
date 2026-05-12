const { JSDOM } = require('jsdom');
const { loadScriptExports } = require('./helpers/load-script-exports');

const path = require('path');
const AI_SCRIPT = path.join('themes', 'rrroca', 'static', 'js', 'ai-assistant.js');
const EXPORTED_MEMBERS = [
  'RRROCA_KNOWLEDGE',
  'toggleAssistant',
  'askAI',
  'handleAISubmit',
  'findAnswer',
  'addMessage'
];

function createDom() {
  return new JSDOM(
    `<!doctype html>
    <body>
      <button id="ai-fab" class="ai-fab"></button>
      <div id="ai-panel" class="ai-panel"></div>
      <input id="ai-input-field" />
      <div id="ai-suggestions"></div>
      <div id="ai-messages"></div>
    </body>`,
    { url: 'https://rrroca.org/' }
  );
}

describe('ai-assistant.js', () => {
  let window;
  let document;
  let assistant;

  beforeEach(() => {
    const dom = createDom();
    window = dom.window;
    document = window.document;

    document.getElementById('ai-input-field').focus = jest.fn();

    const math = Object.create(Math);
    math.random = () => 0;

    assistant = loadScriptExports(AI_SCRIPT, EXPORTED_MEMBERS, {
      window,
      document,
      setTimeout: (callback) => {
        callback();
        return 1;
      },
      clearTimeout: jest.fn(),
      Math: math
    }).exports;
  });

  afterEach(() => {
    window.close();
  });

  it('defines all supported knowledge topics', () => {
    const expectedTopics = [
      'safety',
      'membership',
      'events',
      'parks',
      'schools',
      'sports',
      'volunteer',
      'business',
      'about',
      'emergency'
    ];

    expectedTopics.forEach((topic) => {
      expect(assistant.RRROCA_KNOWLEDGE).toHaveProperty(topic);
      expect(assistant.RRROCA_KNOWLEDGE[topic]).toEqual(
        expect.objectContaining({
          keywords: expect.any(Array),
          response: expect.any(String)
        })
      );
      expect(assistant.RRROCA_KNOWLEDGE[topic].keywords.length).toBeGreaterThan(0);
    });

    expect(Object.keys(assistant.RRROCA_KNOWLEDGE).length).toBeGreaterThanOrEqual(expectedTopics.length);
  });

  it('matches questions to the most relevant knowledge response', () => {
    expect(assistant.findAnswer('How much does membership cost?')).toMatch(/membership/i);
    expect(assistant.findAnswer('Is Rocky Ridge safe and what is the crime rate?')).toMatch(/safe/i);
    expect(assistant.findAnswer('Who do I call for a gas leak or power out?')).toMatch(/emergency|atco|gas/i);
    expect(assistant.findAnswer('Tell me about local businesses nearby')).toMatch(/business/i);
  });

  it('returns a fallback response for unknown questions', () => {
    const response = assistant.findAnswer('Can you recommend a knitting pattern?');

    expect(response).toMatch(/not sure|don't know|can't help/i);
    expect(response).toMatch(/@rrroca\.org/i);
    expect(response).toContain('site search');
  });

  it('toggles the assistant panel and focuses the input when opened', () => {
    const panel = document.getElementById('ai-panel');
    const fab = document.getElementById('ai-fab');
    const input = document.getElementById('ai-input-field');

    assistant.toggleAssistant();
    expect(panel).toHaveClass('open');
    expect(fab).toHaveClass('hidden');
    expect(input.focus).toHaveBeenCalledTimes(1);

    assistant.toggleAssistant();
    expect(panel).not.toHaveClass('open');
    expect(fab).not.toHaveClass('hidden');
  });

  it('renders markdown-like bot messages into the message list', () => {
    assistant.addMessage('**Hello** *neighbour*\n• [Safety Hub](/safety/)', 'bot');

    const message = document.querySelector('#ai-messages .ai-message.ai-bot');
    expect(message).toBeInTheDocument();
    expect(message.innerHTML).toContain('<strong>Hello</strong>');
    expect(message.innerHTML).toContain('<em>neighbour</em>');
    expect(message.innerHTML).toContain('<a href="/safety/">Safety Hub</a>');
    expect(message.innerHTML).toContain('•');
  });

  it('submits a question, hides suggestions, and appends user and bot messages', () => {
    const input = document.getElementById('ai-input-field');
    const suggestions = document.getElementById('ai-suggestions');

    input.value = 'What is the membership fee?';

    assistant.handleAISubmit({
      preventDefault: jest.fn()
    });

    const messages = document.querySelectorAll('#ai-messages .ai-message');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent('What is the membership fee?');
    expect(messages[0]).toHaveClass('ai-user');
    expect(messages[1]).toHaveClass('ai-bot');
    expect(messages[1].innerHTML).toMatch(/membership/i);
    expect(suggestions).toHaveStyle({ display: 'none' });
    expect(input.value).toBe('');
  });
});
