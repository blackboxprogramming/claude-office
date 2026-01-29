/**
 * Conversation Renderer - Renders conversation history in the modal
 */

export class ConversationRenderer {
  constructor() {
    this.toolResults = new Map();
  }

  /**
   * Render full conversation data
   * @param {Object} data - Conversation data from API
   * @param {HTMLElement} container - Container element to render into
   */
  render(data, container) {
    container.innerHTML = '';
    this.toolResults.clear();

    // Pre-process tool results for matching with tool_use
    for (const message of data.messages) {
      if (message.role === 'tool_result') {
        this.toolResults.set(message.toolUseId, message);
      }
    }

    // Render messages
    for (const message of data.messages) {
      if (message.role === 'tool_result') {
        // Tool results are rendered inline with tool_use blocks
        continue;
      }

      const messageEl = this.renderMessage(message);
      container.appendChild(messageEl);
    }

    // Apply syntax highlighting
    this.highlightCode(container);
  }

  /**
   * Render a single message
   * @param {Object} message - Message object
   * @returns {HTMLElement}
   */
  renderMessage(message) {
    const el = document.createElement('div');
    el.className = `message message-${message.role}`;

    // Header with role and timestamp
    const header = document.createElement('div');
    header.className = 'message-header';

    const roleIcon = message.role === 'user' ? '\u{1F464}' : '\u{1F916}';
    const roleName = message.role === 'user' ? 'User' : 'Assistant';

    header.innerHTML = `
      <span class="message-role">${roleIcon} ${roleName}</span>
      <span class="message-time">${this.formatTime(message.timestamp)}</span>
    `;
    el.appendChild(header);

    // Content blocks
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    for (const block of message.content) {
      const blockEl = this.renderContentBlock(block);
      contentEl.appendChild(blockEl);
    }

    el.appendChild(contentEl);
    return el;
  }

  /**
   * Render a content block
   * @param {Object} block - Content block
   * @returns {HTMLElement}
   */
  renderContentBlock(block) {
    const el = document.createElement('div');
    el.className = `content-block content-${block.type}`;

    switch (block.type) {
      case 'text':
        el.innerHTML = this.formatText(block.text);
        break;

      case 'thinking':
        el.innerHTML = `
          <div class="thinking-header">Thinking</div>
          <div class="thinking-content">${this.escapeHtml(block.text)}</div>
        `;
        break;

      case 'tool_use':
        const result = this.toolResults.get(block.id);
        el.innerHTML = this.renderToolUse(block, result);
        break;

      default:
        el.innerHTML = `<pre>${this.escapeHtml(JSON.stringify(block, null, 2))}</pre>`;
    }

    return el;
  }

  /**
   * Render a tool use block with optional result
   * @param {Object} block - Tool use block
   * @param {Object} result - Tool result (optional)
   * @returns {string} HTML string
   */
  renderToolUse(block, result) {
    const inputStr = this.formatToolInput(block.input);
    const resultHtml = result ? this.renderToolResult(result) : '';

    return `
      <div class="tool-use">
        <div class="tool-header">
          <span class="tool-icon">\u{1F527}</span>
          <span class="tool-name">${this.escapeHtml(block.name)}</span>
        </div>
        <div class="tool-input">
          <pre><code class="language-json">${this.escapeHtml(inputStr)}</code></pre>
        </div>
        ${resultHtml}
      </div>
    `;
  }

  /**
   * Render tool result
   * @param {Object} result - Tool result object
   * @returns {string} HTML string
   */
  renderToolResult(result) {
    const statusClass = result.isError ? 'tool-error' : 'tool-success';
    const statusIcon = result.isError ? '\u274C' : '\u2705';
    const content = this.truncateContent(result.content, 2000);

    return `
      <div class="tool-result ${statusClass}">
        <div class="tool-result-header">
          <span class="result-icon">${statusIcon}</span>
          <span class="result-label">Result</span>
        </div>
        <div class="tool-result-content">
          <pre><code>${this.escapeHtml(content)}</code></pre>
        </div>
      </div>
    `;
  }

  /**
   * Format tool input for display
   * @param {Object} input - Tool input object
   * @returns {string} Formatted string
   */
  formatToolInput(input) {
    if (!input) return '{}';
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  }

  /**
   * Format text content, detecting code blocks
   * @param {string} text - Raw text
   * @returns {string} HTML string
   */
  formatText(text) {
    if (!text) return '';

    // Escape HTML first
    let html = this.escapeHtml(text);

    // Convert markdown code blocks to HTML
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const langClass = lang ? `language-${lang}` : '';
      return `<pre><code class="${langClass}">${code}</code></pre>`;
    });

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert newlines to <br> (but not inside pre/code blocks)
    // Simple approach: convert remaining newlines
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /**
   * Truncate long content
   * @param {string} content - Content to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string}
   */
  truncateContent(content, maxLength) {
    if (!content || content.length <= maxLength) {
      return content || '';
    }
    return content.substring(0, maxLength) + '\n... (truncated)';
  }

  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string}
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Raw text
   * @returns {string} Escaped HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Apply syntax highlighting using highlight.js (if available)
   * @param {HTMLElement} container - Container with code blocks
   */
  highlightCode(container) {
    if (typeof hljs !== 'undefined') {
      container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }
}
