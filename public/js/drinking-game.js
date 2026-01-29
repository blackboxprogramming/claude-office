/**
 * Drinking Game Orchestrator
 * Handles cliche detection events and triggers drinking animations
 */

import { CharacterState } from './character.js';

// Toast messages by severity
const TOAST_MESSAGES = {
    severe: [
        '🍺 TERRIBLE CLICHE! Everyone drinks!',
        '🎉 BUZZWORD BINGO! Group shot!',
        '💀 That\'s a classic... BOTTOMS UP!'
    ],
    medium: [
        '🥂 Cliche detected! Toast time!',
        '🍻 AI speak detected! Cheers!',
        '🔔 Ding ding! Drink up!'
    ],
    mild: [
        '🍷 Mild cliche... quick sip',
        '☕ That was a bit cliche...',
        '🥤 Light refreshment needed'
    ]
};

// Map severity to character drinking state
const SEVERITY_TO_STATE = {
    mild: CharacterState.DRINKING_DESK,
    medium: CharacterState.DRINKING_TOAST,
    severe: CharacterState.DRINKING_KITCHEN
};

export class DrinkingGame {
    constructor() {
        this.shotCount = 0;
        this.toastContainer = null;
        this.shotCounter = null;
        this.enabled = true;

        this.initUI();
        this.initDebugKeys();
    }

    /**
     * Initialize UI elements
     */
    initUI() {
        // Create toast container
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        document.body.appendChild(this.toastContainer);

        // Create shot counter
        this.shotCounter = document.createElement('div');
        this.shotCounter.id = 'shot-counter';
        this.shotCounter.innerHTML = `<span class="shot-icon">🥃</span> <span class="shot-count">0</span>`;
        document.body.appendChild(this.shotCounter);
    }

    /**
     * Initialize debug keyboard shortcuts
     */
    initDebugKeys() {
        document.addEventListener('keydown', (e) => {
            // Only trigger on number keys 1, 2, 3 (not numpad)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case '1':
                    this.triggerDrink('mild', 'Debug: mild cliche');
                    break;
                case '2':
                    this.triggerDrink('medium', 'Debug: medium cliche');
                    break;
                case '3':
                    this.triggerDrink('severe', 'Debug: severe cliche');
                    break;
            }
        });
    }

    /**
     * Handle cliche event from server
     * @param {string} sessionId - Session that triggered the cliche
     * @param {Object} clicheEvent - { severity, phrase, matchCount }
     * @param {Map} characters - Map of session ID to Character
     */
    handleClicheEvent(sessionId, clicheEvent, characters) {
        if (!this.enabled || !clicheEvent) return;

        const { severity, phrase } = clicheEvent;
        this.triggerDrink(severity, phrase, sessionId, characters);
    }

    /**
     * Trigger drinking animation and UI updates
     * @param {string} severity - 'mild', 'medium', or 'severe'
     * @param {string} phrase - The cliche phrase detected
     * @param {string} sessionId - Optional session ID that triggered
     * @param {Map} characters - Optional map of characters
     */
    triggerDrink(severity, phrase, sessionId = null, characters = null) {
        // Increment shot count
        this.shotCount++;
        this.updateShotCounter();

        // Show toast notification
        this.showToast(severity, phrase);

        // Trigger character animations
        if (characters) {
            this.animateCharacters(severity, sessionId, characters);
        }
    }

    /**
     * Update the shot counter display
     */
    updateShotCounter() {
        const countEl = this.shotCounter.querySelector('.shot-count');
        if (countEl) {
            countEl.textContent = this.shotCount;

            // Add pop animation
            this.shotCounter.classList.add('pop');
            setTimeout(() => this.shotCounter.classList.remove('pop'), 300);
        }
    }

    /**
     * Show toast notification
     */
    showToast(severity, phrase) {
        const messages = TOAST_MESSAGES[severity] || TOAST_MESSAGES.mild;
        const message = messages[Math.floor(Math.random() * messages.length)];

        const toast = document.createElement('div');
        toast.className = `toast toast-${severity}`;
        toast.innerHTML = `
      <div class="toast-message">${message}</div>
      <div class="toast-phrase">"${this.escapeHtml(phrase)}"</div>
    `;

        this.toastContainer.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Animate characters based on severity
     */
    animateCharacters(severity, triggerSessionId, characters) {
        const drinkState = SEVERITY_TO_STATE[severity];

        if (severity === 'severe') {
            // Everyone drinks!
            for (const character of characters.values()) {
                if (character.state !== CharacterState.EXITING) {
                    character.triggerDrinking(drinkState);
                }
            }
        } else if (severity === 'medium') {
            // Toast animation for triggering character and nearby
            for (const [id, character] of characters) {
                if (id === triggerSessionId) {
                    character.triggerDrinking(drinkState);
                } else if (character.state !== CharacterState.EXITING && Math.random() > 0.5) {
                    // 50% chance others join toast
                    character.triggerDrinking(drinkState);
                }
            }
        } else {
            // Mild - only the triggering character
            if (triggerSessionId && characters.has(triggerSessionId)) {
                characters.get(triggerSessionId).triggerDrinking(drinkState);
            }
        }
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get current shot count
     */
    getShotCount() {
        return this.shotCount;
    }

    /**
     * Reset shot count
     */
    resetShotCount() {
        this.shotCount = 0;
        this.updateShotCounter();
    }
}
