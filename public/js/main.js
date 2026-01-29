/**
 * Claude Office - Main entry point
 * Three.js scene setup and render loop
 */

import * as THREE from 'three';
import { createOffice, KITCHEN_SPOTS, createSkySystem, getTimeBasedColors } from './office.js';
import { Character, CharacterState } from './character.js';
import { SocketClient } from './socket.js';
import { ConnectionRenderer } from './connections.js';
import { SessionModal } from './modal.js';

// Kitchen idle threshold (ms)
const KITCHEN_IDLE_THRESHOLD = 10000;  // 10 seconds

// Day/night update interval (ms) - check every minute
const TIME_CHECK_INTERVAL = 60000;

// Panel update interval (ms) - update every 5 seconds to keep times fresh
const PANEL_UPDATE_INTERVAL = 5000;

// Scene setup
let scene, camera, renderer;
let office;
let characters = new Map();
let sessions = [];
let connectionRenderer;
let clock;
let raycaster, mouse;
let hoveredCharacter = null;

// Kitchen spot management
const kitchenOccupants = new Map();  // sessionId -> spotIndex

// Panel hover tracking
let panelHoveredSessionId = null;
let highlightRing = null;

// Session modal
let sessionModal = null;

// Sky system for day/night
let skySystem;
let lastTimeCheck = 0;
let lastPanelUpdate = 0;

// DOM elements
let tooltip, sessionPanel, connectionStatus, sessionCount;

/**
 * Initialize the Three.js scene
 */
function init() {
  // Get DOM elements
  tooltip = document.getElementById('tooltip');
  sessionPanel = document.getElementById('session-panel');
  connectionStatus = document.getElementById('connection-status');
  sessionCount = document.getElementById('session-count');

  // Create scene with time-based background
  scene = new THREE.Scene();
  const timeColors = getTimeBasedColors();
  scene.background = new THREE.Color(timeColors.background);

  // Create isometric camera
  const aspect = window.innerWidth / window.innerHeight;
  const d = 10;
  camera = new THREE.OrthographicCamera(
    -d * aspect, d * aspect,
    d, -d,
    1, 1000
  );
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Create office environment
  office = createOffice(scene);

  // Create sky system (sun/moon)
  skySystem = createSkySystem(scene);
  updateDayNightCycle();

  // Create connection renderer for visualizing session relationships
  connectionRenderer = new ConnectionRenderer(scene);

  // Setup raycaster for mouse interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Clock for animation
  clock = new THREE.Clock();

  // Create highlight ring for panel hover
  highlightRing = createHighlightRing();
  scene.add(highlightRing);

  // Initialize session modal
  sessionModal = new SessionModal();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onCanvasClick);

  // Panel hover events
  sessionPanel.addEventListener('mouseover', onPanelMouseOver);
  sessionPanel.addEventListener('mouseout', onPanelMouseOut);

  // Panel card click - use mouseup + elementFromPoint to find actual clicked element
  sessionPanel.addEventListener('mouseup', (e) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const card = element?.closest('.avatar-card');
    if (card && card.dataset.sessionId) {
      sessionModal.open(card.dataset.sessionId);
    }
  });

  // Connect to WebSocket
  const socket = new SocketClient(onSessionUpdate, onConnectionChange);
  socket.connect();

  // Start render loop
  animate();
}

/**
 * Create a highlight ring for showing which avatar is hovered in the panel
 */
function createHighlightRing() {
  const geometry = new THREE.RingGeometry(0.4, 0.5, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2; // Lay flat on ground
  ring.visible = false;
  ring.renderOrder = 5;
  return ring;
}

/**
 * Handle panel card mouse over
 */
function onPanelMouseOver(event) {
  const card = event.target.closest('.avatar-card');
  if (card) {
    panelHoveredSessionId = card.dataset.sessionId;
    updatePanelHighlight();
  }
}

/**
 * Handle panel card mouse out
 */
function onPanelMouseOut(event) {
  const card = event.target.closest('.avatar-card');
  const relatedCard = event.relatedTarget?.closest?.('.avatar-card');

  // Clear if leaving a card and not entering another, or leaving panel entirely
  if (card && card !== relatedCard) {
    panelHoveredSessionId = null;
    updatePanelHighlight();
    updatePanel();
  }

  // Also clear if leaving the panel entirely
  if (!sessionPanel.contains(event.relatedTarget)) {
    panelHoveredSessionId = null;
    highlightRing.visible = false;
    updatePanel();
  }
}

/**
 * Update highlight ring visibility and position
 */
function updatePanelHighlight() {
  if (panelHoveredSessionId && characters.has(panelHoveredSessionId)) {
    const character = characters.get(panelHoveredSessionId);
    const pos = character.sprite.position;
    highlightRing.position.set(pos.x, 0.05, pos.z);
    highlightRing.visible = true;

    // Also highlight the card in the panel
    updatePanel();
  } else {
    highlightRing.visible = false;
  }
}

/**
 * Handle window resize
 */
function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 10;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Handle mouse movement for hover detection
 */
function onMouseMove(event) {
  // Skip 3D hover detection when over UI elements
  if (event.target.closest('#session-panel') || event.target.closest('#session-modal')) {
    if (hoveredCharacter) {
      hoveredCharacter = null;
      updatePanel();
    }
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycast to find hovered character
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let foundCharacter = null;
  for (const intersect of intersects) {
    if (intersect.object.userData?.type === 'character') {
      foundCharacter = intersect.object.userData.character;
      break;
    }
  }

  if (foundCharacter !== hoveredCharacter) {
    hoveredCharacter = foundCharacter;
    updatePanel();
  }

  // Update cursor style
  document.body.style.cursor = foundCharacter ? 'pointer' : 'default';
}

/**
 * Handle click to open session modal (for 3D characters)
 */
function onCanvasClick(event) {
  // Ignore clicks on UI elements
  if (event.target.closest('#session-panel') || event.target.closest('#session-modal')) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycast to find clicked character
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const intersect of intersects) {
    if (intersect.object.userData?.type === 'character') {
      const character = intersect.object.userData.character;
      if (character.sessionInfo?.id) {
        sessionModal.open(character.sessionInfo.id);
      }
      break;
    }
  }
}

/**
 * Update session panel display with all avatar cards
 */
function updatePanel() {
  const cardsContainer = sessionPanel.querySelector('.panel-cards');

  if (characters.size === 0) {
    cardsContainer.innerHTML = '<div class="panel-empty">No active sessions</div>';
    return;
  }

  // Build cards for all characters
  let cardsHtml = '';
  for (const [sessionId, character] of characters) {
    const info = character.getTooltipInfo();
    const session = character.sessionInfo;
    // Highlight if hovering avatar in scene OR hovering card in panel
    const isHighlighted = hoveredCharacter === character || panelHoveredSessionId === sessionId;

    let taskText = '';
    if (session?.taskDescription) {
      taskText = session.taskDescription;
    }

    cardsHtml += `
      <div class="avatar-card${isHighlighted ? ' highlighted' : ''}" data-session-id="${sessionId}">
        <div class="card-project">${escapeHtml(info.project)}</div>
        <div class="card-status ${info.state}">${info.state}</div>
        ${taskText ? `<div class="card-task">${escapeHtml(taskText)}</div>` : ''}
        <div class="card-time">${info.timeInState} ago</div>
      </div>
    `;
  }

  cardsContainer.innerHTML = cardsHtml;
  tooltip.style.display = 'none';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Handle WebSocket connection change
 */
function onConnectionChange(connected) {
  connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
  connectionStatus.className = connected ? 'connected' : 'disconnected';
}

/**
 * Handle session updates from server
 */
function onSessionUpdate(newSessions) {
  sessions = newSessions;
  const currentIds = new Set(characters.keys());
  const newIds = new Set(sessions.map(s => s.id));

  // Update session count
  sessionCount.textContent = sessions.length > 0 ? ` | ${sessions.length} session${sessions.length > 1 ? 's' : ''}` : '';

  // Remove characters for ended sessions
  for (const id of currentIds) {
    if (!newIds.has(id)) {
      const character = characters.get(id);
      if (character.state !== CharacterState.EXITING) {
        character.setState(CharacterState.EXITING);
        // Remove after exit animation
        setTimeout(() => {
          scene.remove(character.sprite);
          character.dispose();
          characters.delete(id);
          releaseDesk(character.deskPosition);
        }, 3000);
      }
    }
  }

  // Add or update characters
  for (const session of sessions) {
    if (characters.has(session.id)) {
      // Update existing character
      const character = characters.get(session.id);
      character.sessionInfo = session;

      if (session.state === 'active') {
        // Session became active - return to desk if in kitchen
        if (character.isAtKitchen) {
          releaseKitchenSpot(session.id);
          character.isAtKitchen = false;
          character.kitchenSpot = null;
        }
        character.idleTime = 0;
        if (character.state !== CharacterState.WORKING && character.state !== CharacterState.WALKING) {
          character.setState(CharacterState.WORKING);
        }
      } else if (session.state === 'idle') {
        // Track idle time for kitchen transition
        const idleElapsed = Date.now() - session.lastActivity;

        if (idleElapsed >= KITCHEN_IDLE_THRESHOLD && !character.isAtKitchen && character.state !== CharacterState.WALKING) {
          // Move to kitchen
          const spot = getKitchenSpot(session.id);
          character.kitchenSpot = spot;
          // Slightly higher y (0.9) to ensure avatar head is visible above kitchen table
          character.targetPosition = new THREE.Vector3(spot.x, 0.9, spot.z);
          character.isAtKitchen = true;
          character.setState(CharacterState.WALKING);
        }
      } else if (session.state === 'exiting') {
        if (character.isAtKitchen) {
          releaseKitchenSpot(session.id);
          character.isAtKitchen = false;
        }
        character.setState(CharacterState.EXITING);
      }
    } else {
      // Create new character
      const desk = getAvailableDesk();
      if (desk) {
        const colorIndex = characters.size;
        const character = new Character(session, colorIndex, desk.position, scene);
        desk.occupied = true;
        characters.set(session.id, character);
        scene.add(character.sprite);

        // Set initial state based on session
        if (session.state === 'idle') {
          const idleElapsed = Date.now() - session.lastActivity;
          if (idleElapsed >= KITCHEN_IDLE_THRESHOLD) {
            // Already idle long enough - go straight to kitchen
            const spot = getKitchenSpot(session.id);
            character.kitchenSpot = spot;
            // Slightly higher y (0.9) to ensure avatar head is visible above kitchen table
            character.targetPosition = new THREE.Vector3(spot.x, 0.9, spot.z);
            character.isAtKitchen = true;
            character.setState(CharacterState.WALKING);
          } else {
            character.setState(CharacterState.SLEEPING);
          }
        }
      }
    }
  }

  // Update connection lines between parent and child sessions
  connectionRenderer.updateConnections(sessions, characters);

  // Update the bottom panel with all sessions
  updatePanel();
}

/**
 * Get an available kitchen spot for a character
 */
function getKitchenSpot(sessionId) {
  // Check if already assigned
  if (kitchenOccupants.has(sessionId)) {
    return KITCHEN_SPOTS[kitchenOccupants.get(sessionId)];
  }

  // Find an available spot
  const occupiedSpots = new Set(kitchenOccupants.values());
  for (let i = 0; i < KITCHEN_SPOTS.length; i++) {
    if (!occupiedSpots.has(i)) {
      kitchenOccupants.set(sessionId, i);
      return KITCHEN_SPOTS[i];
    }
  }

  // All spots full, return first spot (overlap is acceptable)
  kitchenOccupants.set(sessionId, 0);
  return KITCHEN_SPOTS[0];
}

/**
 * Release a kitchen spot when character leaves kitchen
 */
function releaseKitchenSpot(sessionId) {
  kitchenOccupants.delete(sessionId);
}

/**
 * Get number of characters currently in kitchen
 */
function getKitchenOccupantCount() {
  return kitchenOccupants.size;
}

/**
 * Get an available desk for a new character (uses DeskManager for dynamic creation)
 */
function getAvailableDesk() {
  return office.deskManager.getAvailableDesk();
}

/**
 * Release a desk when character leaves
 */
function releaseDesk(deskPosition) {
  office.deskManager.releaseDesk(deskPosition);
}

/**
 * Update day/night cycle based on current time
 */
function updateDayNightCycle() {
  const timeColors = getTimeBasedColors();

  // Update background color
  scene.background.setHex(timeColors.background);

  // Update sun/moon visibility
  if (timeColors.isDay) {
    skySystem.sun.visible = true;
    skySystem.moon.visible = false;
    skySystem.stars.visible = false;
  } else {
    skySystem.sun.visible = false;
    skySystem.moon.visible = true;
    skySystem.stars.visible = true;
  }
}

/**
 * Animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Check for day/night update periodically
  const now = Date.now();
  if (now - lastTimeCheck >= TIME_CHECK_INTERVAL) {
    lastTimeCheck = now;
    updateDayNightCycle();
  }

  // Update panel periodically to keep times fresh
  if (now - lastPanelUpdate >= PANEL_UPDATE_INTERVAL) {
    lastPanelUpdate = now;
    updatePanel();
  }

  // Update all characters
  for (const character of characters.values()) {
    character.update(deltaTime);

    // Update kitchen state based on occupant count
    if (character.isAtKitchen && !character.targetPosition) {
      const occupantCount = getKitchenOccupantCount();
      if (occupantCount === 1) {
        // Alone in kitchen - sleep
        if (character.state !== CharacterState.SLEEPING) {
          character.setState(CharacterState.SLEEPING);
        }
      } else {
        // Multiple in kitchen - socialize
        if (character.state !== CharacterState.SOCIALIZING) {
          character.setState(CharacterState.SOCIALIZING);
        }
      }
    }
  }

  // Update connection positions dynamically as characters move
  connectionRenderer.updateConnections(sessions, characters);

  // Update connection line animations (opacity pulse)
  connectionRenderer.update(deltaTime);

  // Update highlight ring position if following a character
  if (highlightRing.visible && panelHoveredSessionId && characters.has(panelHoveredSessionId)) {
    const character = characters.get(panelHoveredSessionId);
    const pos = character.sprite.position;
    highlightRing.position.set(pos.x, 0.05, pos.z);
  }

  renderer.render(scene, camera);
}

// Start the application
init();
