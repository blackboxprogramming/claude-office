/**
 * Session Modal - Displays full conversation history for a session
 */

import { ConversationRenderer } from './conversation-renderer.js';

export class SessionModal {
  constructor() {
    this.modal = null;
    this.currentSessionId = null;
    this.renderer = new ConversationRenderer();
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the modal DOM structure
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'session-modal';
    this.modal.className = 'session-modal hidden';
    this.modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-project"></span>
            <span class="modal-status"></span>
          </div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-metadata">
          <div class="meta-row">
            <span class="meta-item"><strong>Started:</strong> <span class="meta-start"></span></span>
            <span class="meta-item"><strong>Messages:</strong> <span class="meta-messages"></span></span>
          </div>
          <div class="meta-row">
            <span class="meta-item"><strong>Last:</strong> <span class="meta-last"></span></span>
            <span class="meta-item"><strong>Tools:</strong> <span class="meta-tools"></span></span>
          </div>
        </div>
        <div class="modal-body">
          <div class="modal-loading">Loading conversation...</div>
          <div class="modal-error hidden"></div>
          <div class="modal-conversation hidden"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
  }

  /**
   * Setup event listeners for closing the modal
   */
  setupEventListeners() {
    // Close on overlay click
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());

    // Close on X button click
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  /**
   * Open the modal and load session data
   * @param {string} sessionId - Session ID to load
   */
  async open(sessionId) {
    this.currentSessionId = sessionId;
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Show loading state
    this.modal.querySelector('.modal-loading').classList.remove('hidden');
    this.modal.querySelector('.modal-error').classList.add('hidden');
    this.modal.querySelector('.modal-conversation').classList.add('hidden');

    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const data = await response.json();
      this.renderSession(data);
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.currentSessionId = null;
  }

  /**
   * Render session data in the modal
   * @param {Object} data - Session conversation data
   */
  renderSession(data) {
    // Update header
    this.modal.querySelector('.modal-project').textContent = data.project;

    // Update metadata
    this.modal.querySelector('.meta-start').textContent = this.formatTime(data.startTime);
    this.modal.querySelector('.meta-last').textContent = this.formatTime(data.lastActivity);
    this.modal.querySelector('.meta-messages').textContent = data.messageCount;
    this.modal.querySelector('.meta-tools').textContent = data.toolCallCount;

    // Hide loading, show conversation
    this.modal.querySelector('.modal-loading').classList.add('hidden');
    const conversationEl = this.modal.querySelector('.modal-conversation');
    conversationEl.classList.remove('hidden');

    // Render conversation
    this.renderer.render(data, conversationEl);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.modal.querySelector('.modal-loading').classList.add('hidden');
    const errorEl = this.modal.querySelector('.modal-error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp in ms
   * @returns {string} Formatted time string
   */
  formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Check if modal is currently open for a specific session
   * @param {string} sessionId - Session ID to check
   * @returns {boolean}
   */
  isOpenFor(sessionId) {
    return this.currentSessionId === sessionId && !this.modal.classList.contains('hidden');
  }

  /**
   * Refresh the modal if it's currently open
   */
  async refresh() {
    if (this.currentSessionId && !this.modal.classList.contains('hidden')) {
      await this.open(this.currentSessionId);
    }
  }
}
