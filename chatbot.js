(function() {
  'use strict';

  // ─── CONFIG ───
  const API_URL = './api/chat';
  const LEAD_URL = './api/lead';
  const APPLY_URL = './apply.html';
  const PHONE = '(414) 309-6013';

  // ─── STATE ───
  let conversationId = null;
  let isOpen = false;
  let isTyping = false;
  let leadCaptured = false;
  let leadMode = null; // 'contact' | 'prequal'
  let leadData = {};
  let leadStep = 0;

  // ─── LEAD CAPTURE FLOWS ───
  const contactFlow = [
    { key: 'name', question: "Great — I'd love to have one of our advisors reach out to you. What's your full name?" },
    { key: 'email', question: "And your email address?" },
    { key: 'phone', question: "Last one — what's the best phone number to reach you?" }
  ];

  const prequalFlow = [
    { key: 'name', question: "Let's get you started. What's your full name?" },
    { key: 'email', question: "What's your email address?" },
    { key: 'phone', question: "Best phone number to reach you?" },
    { key: 'address', question: "What's the address or general area where you're looking to buy?" },
    { key: 'purchase_price', question: "Do you have an estimated purchase price in mind? (ballpark is fine)" },
    { key: 'down_payment', question: "How much are you looking to put down?" },
    { key: 'credit_range', question: "What's your approximate credit score range? (e.g., 620-680, 700-740, 740+)" },
    { key: 'income', question: "What's your approximate annual household income?" },
    { key: 'employment_type', question: "Are you W-2 employed, self-employed, or other?" },
    { key: 'loan_purpose', question: "Is this a purchase or refinance?" },
    { key: 'first_time_buyer', question: "Are you a first-time homebuyer?" },
    { key: 'veteran', question: "Are you a veteran or active-duty military? (This could qualify you for VA loan benefits)" }
  ];

  // ─── INJECT STYLES ───
  const style = document.createElement('style');
  style.textContent = `
    /* Chat Bubble */
    .vhl-chat-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--color-primary, #3ECFCF);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(62,207,207,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s;
    }
    .vhl-chat-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(62,207,207,0.5);
    }
    .vhl-chat-bubble svg { width: 28px; height: 28px; }

    /* Chat badge (unread indicator) */
    .vhl-chat-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: #e8764b;
      border-radius: 50%;
      border: 2px solid var(--color-bg, #fff);
      display: none;
    }
    .vhl-chat-badge.show { display: block; }

    /* Chat Panel */
    .vhl-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 140px);
      background: var(--color-bg, #fff);
      border: 1px solid var(--color-divider, #e2e5e5);
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.16,1,0.3,1),
                  transform 0.25s cubic-bezier(0.16,1,0.3,1);
      font-family: 'Montserrat', 'Poppins', 'Helvetica Neue', sans-serif;
      overflow: hidden;
    }
    .vhl-chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Header */
    .vhl-chat-header {
      background: var(--color-dark-charcoal, #2E3B3E);
      color: #fff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .vhl-chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-primary, #3ECFCF);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vhl-chat-avatar svg { width: 22px; height: 22px; color: #fff; }
    .vhl-chat-header-info h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .vhl-chat-header-info p {
      margin: 2px 0 0;
      font-size: 11px;
      opacity: 0.7;
      font-weight: 400;
    }
    .vhl-chat-close {
      margin-left: auto;
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .vhl-chat-close:hover { opacity: 1; }

    /* Messages area */
    .vhl-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .vhl-chat-messages::-webkit-scrollbar { width: 4px; }
    .vhl-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .vhl-chat-messages::-webkit-scrollbar-thumb {
      background: var(--color-border, #d0d4d4);
      border-radius: 2px;
    }

    /* Message bubbles */
    .vhl-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: vhlFadeIn 0.2s ease-out;
    }
    .vhl-msg a {
      color: var(--color-primary, #3ECFCF);
      text-decoration: underline;
    }
    @keyframes vhlFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .vhl-msg-bot {
      align-self: flex-start;
      background: var(--color-surface-2, #f7f8f8);
      color: var(--color-text, #2b2b2b);
      border-bottom-left-radius: 4px;
    }
    [data-theme="dark"] .vhl-msg-bot {
      background: var(--color-surface-offset, #1a2120);
    }
    [data-theme="dark"] .vhl-chat-panel {
      border-color: var(--color-border, #344240);
    }
    [data-theme="dark"] .vhl-chat-input {
      background: var(--color-surface-offset, #1a2120);
      border-color: var(--color-border, #344240);
    }
    .vhl-msg-user {
      align-self: flex-end;
      background: var(--color-primary, #3ECFCF);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Quick action chips */
    .vhl-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-self: flex-start;
      animation: vhlFadeIn 0.2s ease-out;
    }
    .vhl-chip {
      padding: 7px 14px;
      border-radius: 20px;
      border: 1px solid var(--color-primary, #3ECFCF);
      background: transparent;
      color: var(--color-primary, #3ECFCF);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .vhl-chip:hover {
      background: var(--color-primary, #3ECFCF);
      color: #fff;
    }

    /* Typing indicator */
    .vhl-typing {
      display: flex;
      gap: 4px;
      align-self: flex-start;
      padding: 12px 16px;
      background: var(--color-surface-2, #f7f8f8);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
    }
    .vhl-typing-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-text-muted, #5a6366);
      animation: vhlBounce 1.2s infinite;
    }
    .vhl-typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .vhl-typing-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes vhlBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Input area */
    .vhl-chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--color-divider, #e2e5e5);
      display: flex;
      gap: 8px;
      align-items: center;
      background: var(--color-bg, #fff);
      flex-shrink: 0;
    }
    .vhl-chat-input {
      flex: 1;
      border: 1px solid var(--color-border, #d0d4d4);
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 13px;
      font-family: inherit;
      background: var(--color-surface-2, #f7f8f8);
      color: var(--color-text, #2b2b2b);
      outline: none;
      transition: border-color 0.15s;
      resize: none;
    }
    .vhl-chat-input:focus {
      border-color: var(--color-primary, #3ECFCF);
    }
    .vhl-chat-input::placeholder {
      color: var(--color-text-faint, #94a0a0);
    }
    .vhl-chat-send {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: var(--color-primary, #3ECFCF);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, transform 0.15s;
      flex-shrink: 0;
    }
    .vhl-chat-send:hover {
      background: var(--color-primary-hover, #32b8b8);
      transform: scale(1.05);
    }
    .vhl-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Footer */
    .vhl-chat-footer {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: var(--color-text-faint, #94a0a0);
      background: var(--color-bg, #fff);
      flex-shrink: 0;
    }

    /* Mobile */
    @media (max-width: 480px) {
      .vhl-chat-panel {
        bottom: 0;
        right: 0;
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
      }
      .vhl-chat-bubble {
        bottom: 16px;
        right: 16px;
        width: 54px;
        height: 54px;
      }
    }
  `;
  document.head.appendChild(style);

  // ─── BUILD DOM ───
  // Bubble
  const bubble = document.createElement('button');
  bubble.className = 'vhl-chat-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="vhl-chat-badge"></span>
  `;
  document.body.appendChild(bubble);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'vhl-chat-panel';
  panel.innerHTML = `
    <div class="vhl-chat-header">
      <div class="vhl-chat-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="vhl-chat-header-info">
        <h3>Voyage Assistant</h3>
        <p>Mortgage help, anytime</p>
      </div>
      <button class="vhl-chat-close" aria-label="Close chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="vhl-chat-messages" id="vhl-messages"></div>
    <div class="vhl-chat-input-area">
      <input type="text" class="vhl-chat-input" id="vhl-input" placeholder="Type your message…" autocomplete="off">
      <button class="vhl-chat-send" id="vhl-send" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </div>
    <div class="vhl-chat-footer">
      LL Financial LLC DBA Voyage Home Loans · NMLS#2667229
    </div>
  `;
  document.body.appendChild(panel);

  // References
  const messagesEl = panel.querySelector('#vhl-messages');
  const inputEl = panel.querySelector('#vhl-input');
  const sendBtn = panel.querySelector('#vhl-send');
  const closeBtn = panel.querySelector('.vhl-chat-close');
  const badge = bubble.querySelector('.vhl-chat-badge');

  // ─── HELPERS ───
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `vhl-msg vhl-msg-${type}`;
    // Support basic markdown links
    div.innerHTML = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    ).replace(/\n/g, '<br>');
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function addChips(options) {
    const container = document.createElement('div');
    container.className = 'vhl-chips';
    options.forEach(opt => {
      const chip = document.createElement('button');
      chip.className = 'vhl-chip';
      chip.textContent = opt.label;
      chip.addEventListener('click', () => {
        container.remove();
        handleUserMessage(opt.value || opt.label);
      });
      container.appendChild(chip);
    });
    messagesEl.appendChild(container);
    scrollToBottom();
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'vhl-typing';
    div.id = 'vhl-typing';
    div.innerHTML = '<span class="vhl-typing-dot"></span><span class="vhl-typing-dot"></span><span class="vhl-typing-dot"></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('vhl-typing');
    if (el) el.remove();
  }

  // ─── LEAD CAPTURE LOGIC ───
  function startLeadFlow(mode) {
    leadMode = mode;
    leadStep = 0;
    leadData = {};
    const flow = mode === 'contact' ? contactFlow : prequalFlow;
    addMessage(flow[0].question, 'bot');
  }

  function handleLeadInput(text) {
    const flow = leadMode === 'contact' ? contactFlow : prequalFlow;
    const currentField = flow[leadStep];

    // Basic validation
    if (currentField.key === 'email' && !text.includes('@')) {
      addMessage("That doesn't look like a valid email. Could you double-check?", 'bot');
      return;
    }
    if (currentField.key === 'phone' && text.replace(/\D/g, '').length < 7) {
      addMessage("Could you provide a full phone number?", 'bot');
      return;
    }

    leadData[currentField.key] = text;
    leadStep++;

    if (leadStep < flow.length) {
      // Ask next question
      addMessage(flow[leadStep].question, 'bot');
    } else {
      // Flow complete
      leadCaptured = true;
      submitLead();
    }
  }

  async function submitLead() {
    try {
      await fetch(LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadData, conversationId, leadMode })
      });
    } catch (e) {
      console.error('Lead submission error:', e);
    }

    // Confirmation message
    if (leadMode === 'contact') {
      addMessage(
        `Thanks, ${leadData.name}! I've passed your info along to our team. Someone will reach out to you within 1 business day.\n\nIn the meantime, feel free to ask me any mortgage questions, or call us directly at ${PHONE}.`,
        'bot'
      );
    } else {
      addMessage(
        `Thanks, ${leadData.name}! I've got all your info. Here's what happens next:\n\n1. One of our advisors will review your details and reach out within 1 business day\n2. To get a head start, you can [complete your full application here](${APPLY_URL}) — it takes about 10 minutes\n\nFeel free to ask me anything else in the meantime!`,
        'bot'
      );
    }

    // Reset lead mode so normal chat resumes
    leadMode = null;
    leadStep = 0;
  }

  // ─── CHAT LOGIC ───
  async function handleUserMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    inputEl.value = '';
    sendBtn.disabled = true;

    // If in lead capture mode, handle lead flow
    if (leadMode) {
      handleLeadInput(text.trim());
      sendBtn.disabled = false;
      return;
    }

    // Check for intent to start lead capture
    const lower = text.toLowerCase();
    if (!leadCaptured && (
      lower.includes('contact me') ||
      lower.includes('call me') ||
      lower.includes('reach out') ||
      lower.includes('have someone call') ||
      lower.includes('talk to someone') ||
      lower.includes('speak to someone') ||
      lower.includes('speak with someone') ||
      lower.includes('get in touch')
    )) {
      startLeadFlow('contact');
      sendBtn.disabled = false;
      return;
    }

    if (!leadCaptured && (
      lower.includes('pre-qualify') ||
      lower.includes('prequalify') ||
      lower.includes('pre-approval') ||
      lower.includes('preapproval') ||
      lower.includes('pre qualify') ||
      lower.includes('pre approval') ||
      lower.includes('get started') ||
      lower.includes('start application') ||
      lower.includes('ready to apply') ||
      lower.includes('want to apply')
    )) {
      startLeadFlow('prequal');
      sendBtn.disabled = false;
      return;
    }

    // Normal AI chat
    showTyping();
    isTyping = true;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId })
      });

      hideTyping();
      isTyping = false;

      if (!res.ok) {
        const err = await res.json();
        addMessage(err.error || "I'm having trouble connecting. Please try again or call us at " + PHONE, 'bot');
        sendBtn.disabled = false;
        return;
      }

      const data = await res.json();
      conversationId = data.conversationId;
      addMessage(data.message, 'bot');
    } catch (e) {
      hideTyping();
      isTyping = false;
      addMessage("I'm having trouble connecting right now. Please call us at " + PHONE + " or email team@voyagefinancing.com.", 'bot');
    }

    sendBtn.disabled = false;
  }

  // ─── WELCOME MESSAGE ───
  function showWelcome() {
    addMessage(
      "Hi there! I'm the Voyage Home Loans assistant. I can help with mortgage questions, rates, loan options, or connect you with our team. What can I help you with?",
      'bot'
    );
    addChips([
      { label: '💰 Check rates', value: "What are today's mortgage rates?" },
      { label: '🏠 Pre-qualify', value: 'I want to pre-qualify for a mortgage' },
      { label: '📞 Contact us', value: 'I want someone to contact me' },
      { label: '❓ Ask a question', value: 'I have a general mortgage question' }
    ]);
  }

  // ─── EVENT LISTENERS ───
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    badge.classList.remove('show');
    if (isOpen) {
      if (messagesEl.children.length === 0) {
        showWelcome();
      }
      setTimeout(() => inputEl.focus(), 300);
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('open');
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleUserMessage(inputEl.value);
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) handleUserMessage(inputEl.value);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      panel.classList.remove('open');
    }
  });

  // Auto-prompt after 30s if not opened
  setTimeout(() => {
    if (!isOpen && messagesEl.children.length === 0) {
      badge.classList.add('show');
    }
  }, 30000);

})();
