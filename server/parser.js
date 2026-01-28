/**
 * JSONL parser for Claude session files
 * Extracts session state from ~/.claude/projects/*.jsonl
 */

const fs = require('fs');
const path = require('path');

const ACTIVE_THRESHOLD_MS = 30000; // 30 seconds
const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_TASK_DESCRIPTION_LENGTH = 200;

/**
 * Parse a JSONL file and extract session information
 * @param {string} filePath - Path to the .jsonl file
 * @returns {Object|null} Session info or null if parsing fails
 */
function parseSessionFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return null;
    }

    let lastActivity = 0;
    let sessionId = path.basename(filePath, '.jsonl');
    let projectName = extractProjectName(filePath);
    let taskDescription = null;

    // Parse each line to find the most recent activity and latest user message
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const timestamp = extractTimestamp(entry);
        if (timestamp > lastActivity) {
          lastActivity = timestamp;
        }

        // Extract latest user message as task description (overwrites previous)
        if (entry.type === 'user' && entry.message?.content) {
          let content = entry.message.content;
          // Handle array content (multi-part messages)
          if (Array.isArray(content)) {
            const textPart = content.find(p => p.type === 'text');
            content = textPart?.text || '';
          }
          if (typeof content === 'string' && content.trim()) {
            taskDescription = content.trim();
            if (taskDescription.length > MAX_TASK_DESCRIPTION_LENGTH) {
              taskDescription = taskDescription.slice(0, MAX_TASK_DESCRIPTION_LENGTH) + '...';
            }
          }
        }
      } catch (e) {
        // Skip malformed JSON lines
        continue;
      }
    }

    if (lastActivity === 0) {
      // No valid timestamps found, use file mtime
      const stats = fs.statSync(filePath);
      lastActivity = stats.mtimeMs;
    }

    const state = determineState(lastActivity);

    return {
      id: sessionId,
      project: projectName,
      state: state,
      lastActivity: lastActivity,
      taskDescription: taskDescription
    };
  } catch (error) {
    console.error(`Error parsing session file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract project name from file path
 * Path format: ~/.claude/projects/-Users-name-path-to-project/session.jsonl
 */
function extractProjectName(filePath) {
  const parts = filePath.split(path.sep);
  const projectsIndex = parts.indexOf('projects');

  if (projectsIndex >= 0 && projectsIndex < parts.length - 2) {
    // Get the directory name after 'projects'
    const encodedPath = parts[projectsIndex + 1];
    // Convert -Users-name-Workspace-project to just 'project'
    const segments = encodedPath.split('-').filter(s => s);
    return segments[segments.length - 1] || 'unknown';
  }

  return 'unknown';
}

/**
 * Extract timestamp from a JSONL entry
 */
function extractTimestamp(entry) {
  // Try common timestamp fields
  if (entry.timestamp) {
    return new Date(entry.timestamp).getTime();
  }
  if (entry.ts) {
    return typeof entry.ts === 'number' ? entry.ts : new Date(entry.ts).getTime();
  }
  if (entry.time) {
    return typeof entry.time === 'number' ? entry.time : new Date(entry.time).getTime();
  }
  if (entry.createdAt) {
    return new Date(entry.createdAt).getTime();
  }
  return 0;
}

/**
 * Determine session state based on last activity
 */
function determineState(lastActivityTimestamp) {
  const elapsed = Date.now() - lastActivityTimestamp;
  return elapsed < ACTIVE_THRESHOLD_MS ? 'active' : 'idle';
}

module.exports = {
  parseSessionFile,
  extractProjectName,
  determineState,
  ACTIVE_THRESHOLD_MS,
  SESSION_MAX_AGE_MS
};
