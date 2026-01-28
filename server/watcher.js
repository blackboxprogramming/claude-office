/**
 * File watcher for Claude session JSONL files
 * Uses chokidar to watch ~/.claude/projects/ for changes
 */

const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { parseSessionFile, SESSION_MAX_AGE_MS } = require('./parser');

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const HOOK_EVENTS_FILE = path.join(os.homedir(), '.claude-office', 'events.jsonl');

class SessionWatcher {
  constructor(onUpdate) {
    this.sessions = new Map();
    this.onUpdate = onUpdate;
    this.watcher = null;

    // Hook event tracking
    this.hookWatcher = null;
    this.lastEventPosition = 0;
    this.activeTasks = new Map();           // session_id -> Set<agent_id>

    // Relationship tracking
    this.sessionRelationships = new Map();  // child_id -> parent_id
    this.sessionChildren = new Map();       // parent_id -> Set<child_id>
  }

  /**
   * Start watching for session file changes
   */
  start() {
    // Ensure the directory exists
    if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
      console.log(`Creating Claude projects directory: ${CLAUDE_PROJECTS_DIR}`);
      fs.mkdirSync(CLAUDE_PROJECTS_DIR, { recursive: true });
    }

    const watchPattern = path.join(CLAUDE_PROJECTS_DIR, '**', '*.jsonl');
    console.log(`Watching for sessions in: ${watchPattern}`);

    this.watcher = chokidar.watch(watchPattern, {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      depth: 4,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'add'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'change'))
      .on('unlink', (filePath) => this.handleFileRemove(filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    // Periodically check for idle sessions
    this.idleCheckInterval = setInterval(() => this.checkIdleSessions(), 5000);

    // Start hook event watcher
    this.startHookWatcher();

    return this;
  }

  /**
   * Start watching hook events file
   */
  startHookWatcher() {
    // Ensure directory exists
    const hookDir = path.dirname(HOOK_EVENTS_FILE);
    if (!fs.existsSync(hookDir)) {
      fs.mkdirSync(hookDir, { recursive: true });
    }

    // Create events file if it doesn't exist
    if (!fs.existsSync(HOOK_EVENTS_FILE)) {
      fs.writeFileSync(HOOK_EVENTS_FILE, '');
    }

    // Get current file size to skip existing events
    const stats = fs.statSync(HOOK_EVENTS_FILE);
    this.lastEventPosition = stats.size;

    console.log(`Watching hook events: ${HOOK_EVENTS_FILE}`);

    this.hookWatcher = chokidar.watch(HOOK_EVENTS_FILE, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.hookWatcher.on('change', () => this.processHookEvents());
  }

  /**
   * Process new hook events from file
   */
  processHookEvents() {
    try {
      const stats = fs.statSync(HOOK_EVENTS_FILE);
      if (stats.size <= this.lastEventPosition) {
        return;
      }

      // Read new content
      const fd = fs.openSync(HOOK_EVENTS_FILE, 'r');
      const buffer = Buffer.alloc(stats.size - this.lastEventPosition);
      fs.readSync(fd, buffer, 0, buffer.length, this.lastEventPosition);
      fs.closeSync(fd);

      this.lastEventPosition = stats.size;

      // Parse and handle each new event
      const lines = buffer.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          this.handleHookEvent(event);
        } catch (parseError) {
          console.error('Error parsing hook event:', parseError.message);
        }
      }
    } catch (error) {
      console.error('Error processing hook events:', error.message);
    }
  }

  /**
   * Handle a single hook event
   */
  handleHookEvent(event) {
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'subagent_start': {
        const { session_id, agent_id } = data || {};
        if (session_id && agent_id) {
          // The subagent's session ID will be "agent-{agent_id}" based on file naming
          const subagentSessionId = `agent-${agent_id}`;

          // Track active task
          if (!this.activeTasks.has(session_id)) {
            this.activeTasks.set(session_id, new Set());
          }
          this.activeTasks.get(session_id).add(subagentSessionId);

          // Track parent-child relationship using full session ID
          this.sessionRelationships.set(subagentSessionId, session_id);
          if (!this.sessionChildren.has(session_id)) {
            this.sessionChildren.set(session_id, new Set());
          }
          this.sessionChildren.get(session_id).add(subagentSessionId);

          // Mark parent session as active
          const session = this.sessions.get(session_id);
          if (session) {
            session.state = 'active';
            session.lastActivity = Date.now();
          }

          console.log(`Subagent started: ${subagentSessionId} (parent: ${session_id})`);
          this.broadcastUpdate();
        }
        break;
      }

      case 'subagent_stop': {
        const { session_id, agent_id } = data || {};
        if (session_id && agent_id) {
          // The subagent's session ID will be "agent-{agent_id}" based on file naming
          const subagentSessionId = `agent-${agent_id}`;

          // Remove from active tasks
          const tasks = this.activeTasks.get(session_id);
          if (tasks) {
            tasks.delete(subagentSessionId);
            if (tasks.size === 0) {
              this.activeTasks.delete(session_id);
            }
          }

          // Remove relationship
          this.sessionRelationships.delete(subagentSessionId);
          const children = this.sessionChildren.get(session_id);
          if (children) {
            children.delete(subagentSessionId);
            if (children.size === 0) {
              this.sessionChildren.delete(session_id);
            }
          }

          // Update lastActivity
          const session = this.sessions.get(session_id);
          if (session) {
            session.lastActivity = Date.now();
          }

          console.log(`Subagent stopped: ${subagentSessionId} (parent: ${session_id})`);
          this.broadcastUpdate();
        }
        break;
      }

      case 'stop': {
        const { session_id } = data || {};
        if (session_id) {
          const session = this.sessions.get(session_id);
          if (session) {
            session.lastActivity = Date.now();
          }
          console.log(`Session stop: ${session_id}`);
          this.broadcastUpdate();
        }
        break;
      }
    }
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.hookWatcher) {
      this.hookWatcher.close();
      this.hookWatcher = null;
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  /**
   * Handle file add or change
   */
  handleFileChange(filePath, eventType) {
    console.log(`Session file ${eventType}: ${path.basename(filePath)}`);

    const session = parseSessionFile(filePath);
    if (session) {
      // Only track sessions active within last 4 hours
      const age = Date.now() - session.lastActivity;
      if (age > SESSION_MAX_AGE_MS) {
        // Skip old sessions, remove if already tracked
        if (this.sessions.has(session.id)) {
          this.sessions.delete(session.id);
          this.broadcastUpdate();
        }
        return;
      }

      session.filePath = filePath;
      this.sessions.set(session.id, session);
      this.broadcastUpdate();
    }
  }

  /**
   * Handle file removal (session ended)
   */
  handleFileRemove(filePath) {
    const sessionId = path.basename(filePath, '.jsonl');
    console.log(`Session file removed: ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (session) {
      // Mark as exiting before removing
      session.state = 'exiting';
      this.broadcastUpdate();

      // Remove after delay to allow exit animation
      setTimeout(() => {
        this.sessions.delete(sessionId);
        this.broadcastUpdate();
      }, 2000);
    }
  }

  /**
   * Check for sessions that have become idle or aged out
   */
  checkIdleSessions() {
    let changed = false;
    const now = Date.now();

    for (const [id, session] of this.sessions) {
      const age = now - session.lastActivity;

      // Remove sessions older than 4 hours
      if (age > SESSION_MAX_AGE_MS) {
        this.sessions.delete(id);
        changed = true;
        continue;
      }

      if (session.state === 'active') {
        // Skip idle check if session has active subagents
        if (this.activeTasks.has(id) && this.activeTasks.get(id).size > 0) {
          continue;
        }

        if (age >= 30000) {
          session.state = 'idle';
          changed = true;
        }
      }
    }

    if (changed) {
      this.broadcastUpdate();
    }
  }

  /**
   * Broadcast current sessions to callback
   */
  broadcastUpdate() {
    const sessionsArray = Array.from(this.sessions.values()).map(s => {
      const activeTasks = this.activeTasks.get(s.id);
      const children = this.sessionChildren.get(s.id);
      const parentId = this.sessionRelationships.get(s.id);

      return {
        id: s.id,
        project: s.project,
        state: s.state,
        lastActivity: s.lastActivity,
        taskDescription: s.taskDescription || null,
        activeAgents: activeTasks ? activeTasks.size : 0,
        parentSessionId: parentId || null,
        childSessionIds: children ? Array.from(children) : []
      };
    });

    this.onUpdate({
      type: 'session_update',
      sessions: sessionsArray
    });
  }

  /**
   * Get current sessions
   */
  getSessions() {
    return Array.from(this.sessions.values());
  }
}

module.exports = { SessionWatcher, CLAUDE_PROJECTS_DIR };
