(function() {
  'use strict';
  
  // ============================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ============================================
  const CONFIG = {
    GROQ_API_KEY: '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',  // ← Replace with real API key
    QUESTIONS_URL: 'https://raw.githubusercontent.com/SwanandM19/chatbotinternship/main/questions.json',
    THEME_COLOR: {
      primary: '#009C82',
      primaryHover: '#00816D',
    },
    COMPANY_NAME: 'Wilo Support',
    TAGLINE: 'Ask about our pumps'
  };

  // ============================================
  // CHATBOT LOGIC
  // ============================================
  let questionBank = [];
  
  async function loadQuestions() {
    try {
      const response = await fetch(CONFIG.QUESTIONS_URL);
      const data = await response.json();
      questionBank = data.questions;
      console.log('✅ Wilo Chatbot loaded:', questionBank.length, 'questions');
    } catch (error) {
      console.error('❌ Error loading chatbot questions:', error);
    }
  }

  function findBestMatch(userQuery) {
    const query = userQuery.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    questionBank.forEach((item) => {
      let score = 0;
      item.keywords.forEach((keyword) => {
        if (query.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
      const questionWords = item.question.toLowerCase().split(' ');
      questionWords.forEach((word) => {
        if (word.length > 3 && query.includes(word)) {
          score += 1;
        }
      });
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    });

    return highestScore > 0 ? bestMatch : null;
  }

  async function enhanceWithGroq(userQuery, matchedAnswer) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant for Wilo Mather & Platt pumps company. Answer questions ONLY based on the provided information. Keep responses concise and professional.'
            },
            {
              role: 'user',
              content: `Question: ${userQuery}\n\nRelevant Information: ${matchedAnswer}\n\nProvide a natural, helpful response based on this information.`
            }
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error);
      return matchedAnswer;
    }
  }

  // ============================================
  // UI CREATION
  // ============================================
  function createChatbot() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      #wilo-chatbot-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${CONFIG.THEME_COLOR.primary};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #wilo-chatbot-button:hover {
        background-color: ${CONFIG.THEME_COLOR.primaryHover};
        transform: scale(1.1);
      }
      #wilo-chatbot-window {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 384px;
        height: 600px;
        max-width: calc(100vw - 48px);
        max-height: calc(100vh - 48px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      #wilo-chatbot-window.open {
        display: flex;
      }
      #wilo-chat-header {
        background-color: ${CONFIG.THEME_COLOR.primary};
        color: white;
        padding: 16px;
        border-radius: 12px 12px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #wilo-chat-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      #wilo-chat-close:hover {
        background-color: ${CONFIG.THEME_COLOR.primaryHover};
      }
      #wilo-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9fafb;
      }
      .wilo-message {
        margin-bottom: 16px;
        display: flex;
      }
      .wilo-message.bot {
        justify-content: flex-start;
      }
      .wilo-message.user {
        justify-content: flex-end;
      }
      .wilo-message-content {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .wilo-message.bot .wilo-message-content {
        background: #e5e7eb;
        color: #1f2937;
      }
      .wilo-message.user .wilo-message-content {
        background: ${CONFIG.THEME_COLOR.primary};
        color: white;
      }
      #wilo-chat-input-container {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        background: white;
        border-radius: 0 0 12px 12px;
      }
      #wilo-chat-input {
        flex: 1;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
      }
      #wilo-chat-input:focus {
        border-color: ${CONFIG.THEME_COLOR.primary};
        box-shadow: 0 0 0 3px ${CONFIG.THEME_COLOR.primary}20;
      }
      #wilo-chat-send {
        background: ${CONFIG.THEME_COLOR.primary};
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: background 0.2s;
      }
      #wilo-chat-send:hover:not(:disabled) {
        background: ${CONFIG.THEME_COLOR.primaryHover};
      }
      #wilo-chat-send:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }
      .wilo-loading {
        display: flex;
        gap: 6px;
        padding: 4px;
      }
      .wilo-loading-dot {
        width: 8px;
        height: 8px;
        background: ${CONFIG.THEME_COLOR.primary};
        border-radius: 50%;
        animation: wilo-bounce 1.4s infinite ease-in-out both;
      }
      .wilo-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .wilo-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes wilo-bounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      @media (max-width: 480px) {
        #wilo-chatbot-window {
          width: calc(100vw - 32px);
          height: calc(100vh - 32px);
          bottom: 16px;
          right: 16px;
        }
        #wilo-chatbot-button {
          bottom: 16px;
          right: 16px;
        }
      }
    `;
    document.head.appendChild(style);

    // Create HTML structure
    const chatbotHTML = `
      <button id="wilo-chatbot-button" aria-label="Open chat">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <div id="wilo-chatbot-window">
        <div id="wilo-chat-header">
          <div>
            <div style="font-weight: 600; font-size: 18px;">${CONFIG.COMPANY_NAME}</div>
            <div style="font-size: 12px; opacity: 0.9;">${CONFIG.TAGLINE}</div>
          </div>
          <button id="wilo-chat-close" aria-label="Close chat">×</button>
        </div>
        <div id="wilo-chat-messages"></div>
        <div id="wilo-chat-input-container">
          <input id="wilo-chat-input" type="text" placeholder="Type your question..." autocomplete="off" />
          <button id="wilo-chat-send">Send</button>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = chatbotHTML;
    document.body.appendChild(container);

    // Initialize event handlers
    setupEventHandlers();
  }

  function setupEventHandlers() {
    const button = document.getElementById('wilo-chatbot-button');
    const window = document.getElementById('wilo-chatbot-window');
    const closeBtn = document.getElementById('wilo-chat-close');
    const input = document.getElementById('wilo-chat-input');
    const sendBtn = document.getElementById('wilo-chat-send');
    const messagesDiv = document.getElementById('wilo-chat-messages');

    let isLoading = false;

    function addMessage(text, isBot) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `wilo-message ${isBot ? 'bot' : 'user'}`;
      const contentDiv = document.createElement('div');
      contentDiv.className = 'wilo-message-content';
      contentDiv.textContent = text;
      msgDiv.appendChild(contentDiv);
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function showLoading() {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'wilo-message bot';
      loadingDiv.id = 'wilo-loading-msg';
      loadingDiv.innerHTML = `
        <div class="wilo-message-content">
          <div class="wilo-loading">
            <div class="wilo-loading-dot"></div>
            <div class="wilo-loading-dot"></div>
            <div class="wilo-loading-dot"></div>
          </div>
        </div>
      `;
      messagesDiv.appendChild(loadingDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function hideLoading() {
      const loadingMsg = document.getElementById('wilo-loading-msg');
      if (loadingMsg) loadingMsg.remove();
    }

    async function handleSend() {
      const message = input.value.trim();
      if (!message || isLoading || questionBank.length === 0) return;

      addMessage(message, false);
      input.value = '';
      isLoading = true;
      sendBtn.disabled = true;
      input.disabled = true;
      showLoading();

      try {
        const match = findBestMatch(message);
        if (match) {
          const answer = await enhanceWithGroq(message, match.answer);
          hideLoading();
          addMessage(answer, true);
        } else {
          hideLoading();
          addMessage("I can only answer questions about Wilo pumps, their products, services, and facilities. Please ask me something related to our pump solutions!", true);
        }
      } catch (error) {
        hideLoading();
        addMessage("Sorry, I encountered an error. Please try again.", true);
      }

      isLoading = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }

    button.addEventListener('click', () => {
      window.classList.add('open');
      button.style.display = 'none';
      if (messagesDiv.children.length === 0) {
        addMessage("Hi! I'm here to help you with questions about Wilo pumps. How can I assist you today?", true);
      }
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      window.classList.remove('open');
      button.style.display = 'flex';
    });

    sendBtn.addEventListener('click', handleSend);
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    loadQuestions().then(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbot);
      } else {
        createChatbot();
      }
    });
  }

  init();
})();
