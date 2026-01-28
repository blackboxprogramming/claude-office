# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Office is a browser-based ambient monitor that visualizes Claude Code sessions as pixel art characters in an isometric office. Built with Node.js backend and Three.js frontend.

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run in development with auto-reload
npm run dev
```

The server runs at `http://localhost:3000`.

## Architecture

```
Backend (Node.js)          Frontend (Three.js)
     │                           │
     │◄── WebSocket ────────────►│
     │                           │
     ▼                           │
~/.claude/projects/*.jsonl       │
  (file watching via chokidar)   │
```

### Backend (`server/`)
- `index.js` - Express server + WebSocket setup
- `watcher.js` - Chokidar file watcher for `~/.claude/projects/`
- `parser.js` - JSONL parser extracting session state

### Frontend (`public/js/`)
- `main.js` - Three.js scene setup with OrthographicCamera for isometric view
- `office.js` - Office layout, floor tiles, furniture sprites
- `character.js` - Character sprite animations and state machine
- `socket.js` - WebSocket client for real-time updates

### Assets (`public/assets/`)
- Pixel art sprites for characters, furniture, floor tiles
- Use nearest-neighbor texture filtering for crisp pixel art

## Key Concepts

### Session State Detection
Sessions are "active" if activity within last 30 seconds, otherwise "idle". Detected by parsing JSONL timestamps.

### Isometric Rendering
Three.js OrthographicCamera positioned at 45° for isometric projection. Sprites rendered on PlaneGeometry.

### Character State Machine
`working` (typing at desk) → `idle` (walking/coffee) → `exiting` (walking to door)

## Design Document

See `docs/plans/2025-01-25-claude-office-design.md` for full design rationale and decisions.
