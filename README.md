# Claude Office

A browser-based ambient monitor that visualizes Claude Code sessions as pixel art characters in an isometric office.

![Claude Office](https://img.shields.io/badge/status-ambient-blue)

## Overview

Claude Office watches your active Claude Code sessions and represents each one as a character in a cozy pixel art office. When you're actively prompting Claude, your character types at their desk. When idle, they fall asleep with floating "zzz" bubbles. When a session ends, they walk out the door.

## Installation

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Claude Code** - The Claude Code CLI which creates session files at `~/.claude/projects/`

### Step 1: Clone and Install

```bash
git clone https://github.com/awangdev/claude-office.git
cd claude-office
npm install
```

### Step 2: Start the Server

```bash
npm start
```

Open http://localhost:3000

## How It Works

### Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Browser        │◄──────────────────►│  Node Server    │
│  (Three.js)     │   session updates  │  (Express + WS) │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ file watch
                                                ▼
                                       ~/.claude/projects/
                                           *.jsonl
```

### Session Detection

The server watches `~/.claude/projects/` for `.jsonl` files that Claude Code creates for each session. It parses these files to extract:

- **Session ID** - from the filename
- **Project name** - from the directory path
- **Last activity** - from timestamps in the JSONL entries

Sessions are classified as:
- **Active** - activity within the last 30 seconds
- **Idle** - no activity for 30+ seconds

### Character Behavior

| Session State | Character Animation |
|---------------|---------------------|
| Active (working) | Typing at desk, sweat droplets flying off |
| Idle (sleeping) | Head down on desk, "zzz" bubbles floating up |
| Ended | Walking to exit, then disappears |

Characters only appear when sessions exist - an empty office means no active Claude Code sessions.

### Rendering

The office is rendered using Three.js with an orthographic camera for the isometric view. All sprites (floor tiles, furniture, characters) are procedurally generated using HTML canvas - no external image files needed.

The office supports up to 4 simultaneous sessions (one per desk).

## Project Structure

```
office/
├── server/
│   ├── index.js      # Express + WebSocket server
│   ├── watcher.js    # Chokidar file watcher
│   └── parser.js     # JSONL session parser
├── public/
│   ├── index.html    # Main page
│   └── js/
│       ├── main.js       # Three.js scene + render loop
│       ├── office.js     # Office environment sprites
│       ├── character.js  # Character animation system
│       └── socket.js     # WebSocket client
└── package.json
```

## Interaction

- **Hover** over a character to see:
  - Project name
  - Current status (active/sleeping)
  - Time since last activity

- **Status bar** (bottom-left) shows:
  - WebSocket connection status
  - Number of active sessions

## Configuration

The server runs on port 3000 by default. Set the `PORT` environment variable to change it:

```bash
PORT=8080 npm start
```

## Development

```bash
npm run dev    # Start with --watch for auto-reload
```

## Technical Details

- **Isometric projection**: OrthographicCamera at 45° angle
- **Sprite rendering**: THREE.Sprite with CanvasTexture
- **Texture filtering**: NearestFilter for crisp pixel art
- **Animation**: Frame-based with 200ms per frame
- **Sleep particles**: Floating "z" sprites that grow, drift upward, and fade
- **Sweat particles**: Teardrop sprites that pop up from head and fall with gravity
- **WebSocket**: Auto-reconnects with exponential backoff

## License

MIT
