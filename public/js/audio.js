/**
 * Ambient background music player for Claude Office
 * Wraps HTML5 <audio> with play/pause, volume, localStorage persistence,
 * and browser autoplay-policy handling.
 */

const STORAGE_KEY_VOLUME = 'claude-office-volume';
const STORAGE_KEY_PLAYING = 'claude-office-playing';

export class AmbientPlayer {
  constructor() {
    this.audio = new Audio('assets/audio/ambient.mp3');
    this.audio.loop = true;
    this.audio.preload = 'auto';

    // Restore persisted volume (default 0.5)
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    this.audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

    // Whether the user had been playing before last page unload
    this._wasPreviouslyPlaying = localStorage.getItem(STORAGE_KEY_PLAYING) === 'true';

    // Persist play state on page unload
    window.addEventListener('beforeunload', () => {
      localStorage.setItem(STORAGE_KEY_PLAYING, String(!this.audio.paused));
    });
  }

  /** Toggle play / pause. Returns true if now playing. */
  toggle() {
    if (this.audio.paused) {
      this.audio.play().catch(() => {
        // Autoplay blocked — user must interact again
      });
      return true;
    }
    this.audio.pause();
    return false;
  }

  /** Set volume (0–1). Persists to localStorage. */
  setVolume(value) {
    const v = Math.max(0, Math.min(1, value));
    this.audio.volume = v;
    localStorage.setItem(STORAGE_KEY_VOLUME, String(v));
  }

  /** Current volume (0–1). */
  getVolume() {
    return this.audio.volume;
  }

  /** Whether audio is currently playing. */
  isPlaying() {
    return !this.audio.paused;
  }

  /** Whether the player was playing before the last page unload. */
  wasPreviouslyPlaying() {
    return this._wasPreviouslyPlaying;
  }
}
