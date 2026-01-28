/**
 * Claude Office Server
 * Express + WebSocket server for real-time session visualization
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { SessionWatcher } = require('./watcher');
const { parseFullConversation } = require('./parser');

const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API endpoint to get full session conversation
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Find session in watcher
  const session = watcher.sessions.get(sessionId);
  if (!session || !session.filePath) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Parse full conversation
  const conversation = parseFullConversation(session.filePath);
  if (!conversation) {
    return res.status(500).json({ error: 'Failed to parse session' });
  }

  res.json(conversation);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Set();

// Broadcast message to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Create session watcher with broadcast callback
const watcher = new SessionWatcher(broadcast);

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  // Send current state to new client (trigger broadcastUpdate for consistent format)
  watcher.broadcastUpdate();

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Start session watcher
watcher.start();

// Start server
server.listen(PORT, () => {
  console.log(`Claude Office server running at http://localhost:${PORT}`);
  console.log('Watching for Claude sessions...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  watcher.stop();
  wss.close();
  server.close();
  process.exit(0);
});
