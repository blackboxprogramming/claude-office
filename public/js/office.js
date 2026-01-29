/**
 * Office layout and furniture rendering
 * Creates the isometric office environment
 */

import * as THREE from 'three';

// Office dimensions (in tiles)
const OFFICE_WIDTH = 18;
const OFFICE_HEIGHT = 14;
const TILE_SIZE = 1;

// Desk positions (8 desks) - all facing same direction (toward back wall)
export const DESK_POSITIONS = [
  { x: -4.5, z: -1, rotation: 0 },
  { x: -1.5, z: -1, rotation: 0 },
  { x: 1.5, z: -1, rotation: 0 },
  { x: 4.5, z: -1, rotation: 0 },
  { x: -4.5, z: 2, rotation: 0 },
  { x: -1.5, z: 2, rotation: 0 },
  { x: 1.5, z: 2, rotation: 0 },
  { x: 4.5, z: 2, rotation: 0 }
];

// Grid configuration for dynamic desk creation
const DESK_GRID = {
  startX: -4.5,
  startZ: -1,
  spacingX: 3,
  spacingZ: 3,
  maxPerRow: 4
};

// Coffee machine position (on back wall, next to refrigerator)
const COFFEE_POSITION = { x: 6.7, z: -6 };  // z is ignored, machine is placed on back wall

// Kitchen area (upper-right corner, near refrigerator)
const KITCHEN_POSITION = { x: 5, z: -5 };
export const KITCHEN_SPOTS = [
  // Spots along the front of the longer table (6 spots)
  { x: 3.5, z: -4.2 },    // front-left
  { x: 4.5, z: -4.2 },    // front-center-left
  { x: 5.5, z: -4.2 },    // front-center-right
  { x: 6.5, z: -4.2 },    // front-right
  { x: 3.8, z: -4.6 },    // back-left
  { x: 6.2, z: -4.6 }     // back-right
];

// Plant positions
const PLANT_POSITIONS = [
  { x: -8, z: -6 },
  { x: 8, z: 6 },
  { x: -8, z: 6 }
];

// Door position for character exits (upper-left wall)
export const DOOR_POSITION = { x: -9, z: -4 };

/**
 * DeskManager - handles dynamic desk creation based on session count
 */
export class DeskManager {
  constructor(scene) {
    this.scene = scene;
    this.desks = [];
    this.textures = {};
  }

  /**
   * Initialize textures (call after scene is ready)
   */
  init(deskTexture, chairTexture) {
    this.textures = {
      top: createDeskTopTexture(),
      front: createDeskFrontTexture(),
      side: createDeskSideTexture(),
      monitor: createDeskMonitorTexture(),
      chair: chairTexture
    };
  }

  /**
   * Compute desk position for a given index using grid layout
   */
  computeDeskPosition(index) {
    const row = Math.floor(index / DESK_GRID.maxPerRow);
    const col = index % DESK_GRID.maxPerRow;
    const rotation = 0;  // All desks face the same direction (toward back wall)

    return {
      x: DESK_GRID.startX + col * DESK_GRID.spacingX,
      z: DESK_GRID.startZ + row * DESK_GRID.spacingZ,
      rotation
    };
  }

  /**
   * Get an available desk or create a new one
   */
  getAvailableDesk() {
    // First, try to find an existing unoccupied desk
    for (const desk of this.desks) {
      if (!desk.occupied) {
        return desk;
      }
    }

    // No available desk, create a new one
    return this.createDesk(this.desks.length);
  }

  /**
   * Create a new 2.5D desk at the given index
   */
  createDesk(index) {
    const position = this.computeDeskPosition(index);
    const meshes = [];

    const deskWidth = 1.2;
    const deskDepth = 0.6;
    const deskHeight = 0.45;
    const deskY = 0.4;

    // Determine front direction based on rotation
    const facingBack = position.rotation === 0;  // rotation 0 = facing back wall
    const frontZ = facingBack ? position.z + deskDepth / 2 : position.z - deskDepth / 2;
    const sideX = position.x + deskWidth / 2;

    // Top face (horizontal surface)
    const topMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.top,
      transparent: true,
      side: THREE.DoubleSide
    });
    const topGeometry = new THREE.PlaneGeometry(deskWidth, deskDepth);
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.set(position.x, deskY, position.z);
    topMesh.userData = { type: 'desk', index };
    topMesh.renderOrder = 2;
    this.scene.add(topMesh);
    meshes.push(topMesh);

    // Front face
    const frontMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.front,
      transparent: true,
      side: THREE.DoubleSide
    });
    const frontGeometry = new THREE.PlaneGeometry(deskWidth, deskHeight);
    const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    frontMesh.position.set(position.x, deskY - deskHeight / 2, frontZ);
    if (!facingBack) frontMesh.rotation.y = Math.PI;
    frontMesh.renderOrder = 2;
    this.scene.add(frontMesh);
    meshes.push(frontMesh);

    // Side face (right side, visible from isometric)
    const sideMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.side,
      transparent: true,
      side: THREE.DoubleSide
    });
    const sideGeometry = new THREE.PlaneGeometry(deskDepth, deskHeight);
    const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
    sideMesh.rotation.y = Math.PI / 2;
    sideMesh.position.set(sideX, deskY - deskHeight / 2, position.z);
    sideMesh.renderOrder = 2;
    this.scene.add(sideMesh);
    meshes.push(sideMesh);

    // Monitor (vertical, on desk)
    const monitorMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.monitor,
      transparent: true,
      side: THREE.DoubleSide
    });
    const monitorGeometry = new THREE.PlaneGeometry(0.5, 0.45);
    const monitorMesh = new THREE.Mesh(monitorGeometry, monitorMaterial);
    const monitorZ = facingBack ? position.z - 0.15 : position.z + 0.15;
    monitorMesh.position.set(position.x, deskY + 0.25, monitorZ);
    if (!facingBack) monitorMesh.rotation.y = Math.PI;
    monitorMesh.renderOrder = 3;
    this.scene.add(monitorMesh);
    meshes.push(monitorMesh);

    // Chair sprite
    const chairOffset = facingBack ? 0.7 : -0.7;
    const chairMaterial = new THREE.SpriteMaterial({ map: this.textures.chair });
    const chairSprite = new THREE.Sprite(chairMaterial);
    chairSprite.scale.set(0.5, 0.7, 1);
    chairSprite.position.set(position.x, 0.35, position.z + chairOffset);
    chairSprite.renderOrder = 2;
    this.scene.add(chairSprite);
    meshes.push(chairSprite);

    const desk = {
      desk: topMesh,
      meshes,
      chair: chairSprite,
      position,
      occupied: false,
      index
    };

    this.desks.push(desk);
    return desk;
  }

  /**
   * Release a desk when a character leaves
   */
  releaseDesk(position) {
    for (const desk of this.desks) {
      if (desk.position === position) {
        desk.occupied = false;
        break;
      }
    }
  }

  /**
   * Get all desks
   */
  getDesks() {
    return this.desks;
  }
}

/**
 * Create a procedural texture using canvas
 */
function createCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Create sun texture
 */
function createSunTexture() {
  return createCanvasTexture(64, 64, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    // Outer glow
    const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, 32);
    gradient.addColorStop(0, 'rgba(255, 236, 130, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Sun core
    ctx.fillStyle = '#fff7b0';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    // Sun inner
    ctx.fillStyle = '#ffec82';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Create moon texture
 */
function createMoonTexture() {
  return createCanvasTexture(64, 64, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    // Outer glow
    const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 32);
    gradient.addColorStop(0, 'rgba(230, 240, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(200, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(150, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Moon base
    ctx.fillStyle = '#e6f0ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Moon surface details (craters)
    ctx.fillStyle = '#c8d8f0';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, cy + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 6, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Create stars texture for night sky
 */
function createStarsTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    // Transparent background
    ctx.clearRect(0, 0, w, h);

    // Draw random stars
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 0.5 + 0.5;

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/**
 * Create the sky system (sun/moon based on time)
 */
export function createSkySystem(scene) {
  // Create sun sprite
  const sunTexture = createSunTexture();
  const sunMaterial = new THREE.SpriteMaterial({ map: sunTexture, transparent: true });
  const sunSprite = new THREE.Sprite(sunMaterial);
  sunSprite.scale.set(3, 3, 1);
  sunSprite.position.set(6, 4, -8);
  sunSprite.renderOrder = -1;
  sunSprite.visible = false;
  scene.add(sunSprite);

  // Create moon sprite
  const moonTexture = createMoonTexture();
  const moonMaterial = new THREE.SpriteMaterial({ map: moonTexture, transparent: true });
  const moonSprite = new THREE.Sprite(moonMaterial);
  moonSprite.scale.set(2.5, 2.5, 1);
  moonSprite.position.set(6, 4, -8);
  moonSprite.renderOrder = -1;
  moonSprite.visible = false;
  scene.add(moonSprite);

  // Create stars plane for night
  const starsTexture = createStarsTexture();
  starsTexture.wrapS = THREE.RepeatWrapping;
  starsTexture.wrapT = THREE.RepeatWrapping;
  starsTexture.repeat.set(3, 2);
  const starsMaterial = new THREE.SpriteMaterial({ map: starsTexture, transparent: true, opacity: 0.7 });
  const starsSprite = new THREE.Sprite(starsMaterial);
  starsSprite.scale.set(25, 15, 1);
  starsSprite.position.set(0, 3, -10);
  starsSprite.renderOrder = -2;
  starsSprite.visible = false;
  scene.add(starsSprite);

  return {
    sun: sunSprite,
    moon: moonSprite,
    stars: starsSprite
  };
}

/**
 * Check if it's daytime (6am - 6pm)
 */
export function isDaytime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

/**
 * Get day/night colors based on current time
 */
export function getTimeBasedColors() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 18) {
    // Daytime: 6am - 6pm
    return {
      background: 0x87ceeb,  // Sky blue
      isDay: true
    };
  } else {
    // Nighttime: 6pm - 6am
    return {
      background: 0x0a0a1a,  // Dark blue/black
      isDay: false
    };
  }
}

/**
 * Create floor tile texture
 */
function createFloorTexture() {
  return createCanvasTexture(32, 32, (ctx, w, h) => {
    // Base color
    ctx.fillStyle = '#3d5a80';
    ctx.fillRect(0, 0, w, h);

    // Tile pattern
    ctx.fillStyle = '#4a6fa5';
    ctx.fillRect(1, 1, w - 2, h - 2);

    // Highlight
    ctx.fillStyle = '#5c7faa';
    ctx.fillRect(2, 2, w - 6, 2);
    ctx.fillRect(2, 2, 2, h - 6);

    // Shadow
    ctx.fillStyle = '#2d4a6a';
    ctx.fillRect(w - 4, 4, 2, h - 6);
    ctx.fillRect(4, h - 4, w - 6, 2);
  });
}

/**
 * Create desk texture
 */
/**
 * Create desk top texture (horizontal surface with monitor, keyboard)
 */
function createDeskTopTexture() {
  return createCanvasTexture(64, 40, (ctx, w, h) => {
    // Desk surface
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, 0, w, h);

    // Wood grain
    ctx.fillStyle = '#7a5c12';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(0, 8 + i * 8, w, 1);
    }

    // Edge highlight
    ctx.fillStyle = '#a67c00';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, 0, 2, h);

    // Monitor base
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(w / 2 - 8, 4, 16, 10);

    // Keyboard
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(w / 2 - 12, 20, 24, 10);
    ctx.fillStyle = '#4a4a5a';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 6; j++) {
        ctx.fillRect(w / 2 - 10 + j * 4, 22 + i * 3, 3, 2);
      }
    }

    // Mouse
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(w - 14, 22, 8, 12);
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(w - 12, 24, 4, 4);

    // Coffee mug
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(8, 24, 8, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(10, 26, 4, 6);
  });
}

/**
 * Create desk front texture (front panel with legs)
 */
function createDeskFrontTexture() {
  return createCanvasTexture(64, 28, (ctx, w, h) => {
    // Front panel
    ctx.fillStyle = '#725a12';
    ctx.fillRect(0, 0, w, h);

    // Shadow at top
    ctx.fillStyle = '#5a4810';
    ctx.fillRect(0, 0, w, 2);

    // Legs
    ctx.fillStyle = '#5a4810';
    ctx.fillRect(2, 0, 6, h);
    ctx.fillRect(w - 8, 0, 6, h);

    // Leg highlights
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(4, 0, 2, h);
    ctx.fillRect(w - 6, 0, 2, h);

    // Drawer panel
    ctx.fillStyle = '#5a4810';
    ctx.fillRect(12, 3, w - 24, h - 6);

    // Drawer handle
    ctx.fillStyle = '#a67c00';
    ctx.fillRect(w / 2 - 6, h / 2 - 1, 12, 3);
  });
}

/**
 * Create desk side texture
 */
function createDeskSideTexture() {
  return createCanvasTexture(24, 28, (ctx, w, h) => {
    // Side panel
    ctx.fillStyle = '#5a4810';
    ctx.fillRect(0, 0, w, h);

    // Shadow edge
    ctx.fillStyle = '#4a3a0e';
    ctx.fillRect(w - 2, 0, 2, h);

    // Leg
    ctx.fillStyle = '#4a3a0e';
    ctx.fillRect(w - 8, 0, 6, h);
    ctx.fillStyle = '#725a12';
    ctx.fillRect(w - 6, 0, 2, h);
  });
}

/**
 * Create desk monitor texture (vertical screen facing camera)
 */
function createDeskMonitorTexture() {
  return createCanvasTexture(32, 28, (ctx, w, h) => {
    // Monitor frame
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, w, h - 4);

    // Screen bezel
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(2, 2, w - 4, h - 8);

    // Screen
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(4, 4, w - 8, h - 12);

    // Screen content (code lines)
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(6, 6, 12, 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(6, 10, 18, 2);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(6, 14, 8, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(6, 18, 14, 2);

    // Stand
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(w / 2 - 4, h - 4, 8, 4);
  });
}

// Keep old texture for backward compatibility
function createDeskTexture() {
  return createDeskTopTexture();
}

/**
 * Create chair texture
 */
function createChairTexture() {
  return createCanvasTexture(24, 32, (ctx, w, h) => {
    // Chair back
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(4, 0, w - 8, h * 0.5);

    // Chair seat
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(2, h * 0.45, w - 4, h * 0.3);

    // Chair legs
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(4, h * 0.7, 4, h * 0.3);
    ctx.fillRect(w - 8, h * 0.7, 4, h * 0.3);
  });
}

/**
 * Create coffee machine texture
 */
function createCoffeeMachineTexture() {
  return createCanvasTexture(40, 64, (ctx, w, h) => {
    // Main body - dark metallic
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(2, 4, w - 4, h - 6);

    // Top section - slightly lighter
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(2, 4, w - 4, 12);

    // Chrome trim at top
    ctx.fillStyle = '#8a8a9a';
    ctx.fillRect(2, 4, w - 4, 2);

    // Display panel (green LCD)
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(6, 18, w - 12, 10);
    ctx.fillStyle = '#2a6a4a';
    ctx.fillRect(8, 20, w - 16, 6);

    // Buttons row
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(6, 32, 8, 6);
    ctx.fillRect(16, 32, 8, 6);
    ctx.fillRect(26, 32, 8, 6);

    // Cup dispensing area (recessed black area)
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(4, 42, w - 8, 18);

    // Drip tray
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(6, 54, w - 12, 6);

    // Drip tray grate lines
    ctx.fillStyle = '#3a3a4a';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(8 + i * 5, 55, 3, 4);
    }

    // Coffee spout
    ctx.fillStyle = '#6a6a7a';
    ctx.fillRect(w / 2 - 4, 42, 8, 8);
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(w / 2 - 2, 48, 4, 4);

    // Status lights
    ctx.fillStyle = '#4ade80';  // Green - ready
    ctx.fillRect(w - 8, 8, 4, 4);

    // Brand logo area
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(10, 10, 16, 4);
  });
}

/**
 * Create coffee machine side texture (for depth)
 */
function createCoffeeMachineSideTexture() {
  return createCanvasTexture(16, 64, (ctx, w, h) => {
    // Side body - slightly darker than front
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 4, w, h - 6);

    // Top edge
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(0, 4, w, 12);

    // Shadow edge
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(w - 2, 4, 2, h - 6);

    // Vent lines
    ctx.fillStyle = '#3a3a4a';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(3, 20 + i * 8, w - 6, 2);
    }
  });
}

/**
 * Create kitchen table top texture (horizontal surface with items)
 */
function createKitchenTableTopTexture() {
  return createCanvasTexture(160, 48, (ctx, w, h) => {
    // Table top surface
    ctx.fillStyle = '#a67c52';
    ctx.fillRect(0, 0, w, h);

    // Wood grain lines
    ctx.fillStyle = '#966d47';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(0, 8 + i * 8, w, 1);
    }

    // Table edge highlight
    ctx.fillStyle = '#c4956a';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, 0, 2, h);

    // Snack bowl (left side)
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(12, 10, 18, 16);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(14, 12, 14, 12);
    // Snacks
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(16, 14, 4, 4);
    ctx.fillRect(22, 15, 4, 4);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(18, 18, 4, 4);

    // Coffee mug 1 (red)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(50, 12, 12, 14);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(52, 14, 8, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(53, 15, 6, 7);

    // Napkin holder (center)
    ctx.fillStyle = '#78716c';
    ctx.fillRect(72, 16, 14, 12);
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(74, 18, 10, 8);

    // Coffee mug 2 (blue)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(95, 10, 12, 14);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(97, 12, 8, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(98, 13, 6, 7);

    // Plate with donuts (right side)
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(115, 12, 20, 18);
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(117, 14, 16, 14);
    // Donuts
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(119, 16, 6, 6);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(127, 17, 5, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(122, 22, 6, 5);

    // Coffee mug 3 (green)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(142, 12, 12, 14);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(144, 14, 8, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(145, 15, 6, 7);
  });
}

/**
 * Create kitchen table front texture (front panel)
 */
function createKitchenTableFrontTexture() {
  return createCanvasTexture(160, 32, (ctx, w, h) => {
    // Front panel
    ctx.fillStyle = '#8b6539';
    ctx.fillRect(0, 0, w, h);

    // Panel shadow at top
    ctx.fillStyle = '#7a5730';
    ctx.fillRect(0, 0, w, 3);

    // Legs (4 legs for longer table)
    ctx.fillStyle = '#6b4f2d';
    ctx.fillRect(4, 0, 8, h);
    ctx.fillRect(52, 0, 8, h);
    ctx.fillRect(100, 0, 8, h);
    ctx.fillRect(w - 12, 0, 8, h);

    // Leg highlights
    ctx.fillStyle = '#9a7348';
    ctx.fillRect(6, 0, 2, h);
    ctx.fillRect(54, 0, 2, h);
    ctx.fillRect(102, 0, 2, h);
    ctx.fillRect(w - 10, 0, 2, h);

    // Decorative panels between legs
    ctx.fillStyle = '#7a5730';
    ctx.fillRect(16, 4, 32, h - 8);
    ctx.fillRect(64, 4, 32, h - 8);
    ctx.fillRect(112, 4, 32, h - 8);

    // Panel highlights
    ctx.fillStyle = '#9a7348';
    ctx.fillRect(18, 6, 28, 2);
    ctx.fillRect(66, 6, 28, 2);
    ctx.fillRect(114, 6, 28, 2);
  });
}

/**
 * Create kitchen table side texture (right side)
 */
function createKitchenTableSideTexture() {
  return createCanvasTexture(32, 32, (ctx, w, h) => {
    // Side panel
    ctx.fillStyle = '#7a5730';
    ctx.fillRect(0, 0, w, h);

    // Shadow edge
    ctx.fillStyle = '#6b4f2d';
    ctx.fillRect(w - 3, 0, 3, h);

    // Leg
    ctx.fillStyle = '#6b4f2d';
    ctx.fillRect(w - 10, 0, 8, h);
    ctx.fillStyle = '#8b6539';
    ctx.fillRect(w - 8, 0, 2, h);
  });
}

/**
 * Create refrigerator texture
 */
function createRefrigeratorTexture() {
  return createCanvasTexture(32, 64, (ctx, w, h) => {
    // Main body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    // Body shadow
    ctx.fillStyle = '#cbd5e0';
    ctx.fillRect(w - 4, 0, 4, h);

    // Freezer door (top)
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(2, 2, w - 6, h * 0.3);
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(2, h * 0.3, w - 6, 2);

    // Fridge door (bottom)
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(2, h * 0.32 + 2, w - 6, h * 0.65);

    // Handle
    ctx.fillStyle = '#718096';
    ctx.fillRect(w - 8, h * 0.15, 3, 8);
    ctx.fillRect(w - 8, h * 0.5, 3, 12);

    // Ice/water dispenser
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(8, h * 0.08, 12, 10);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(10, h * 0.1, 8, 6);

    // Bottom vent
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(4, h - 8, w - 10, 4);
  });
}

/**
 * Create plant texture
 */
function createPlantTexture() {
  return createCanvasTexture(24, 32, (ctx, w, h) => {
    // Pot
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(4, h * 0.6, w - 8, h * 0.4);

    // Pot rim
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(2, h * 0.58, w - 4, 4);

    // Leaves
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.35, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#32cd32';
    ctx.beginPath();
    ctx.arc(w / 2 - 4, h * 0.3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w / 2 + 4, h * 0.25, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Create the office floor
 */
function createFloor(scene) {
  const texture = createFloorTexture();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(OFFICE_WIDTH, OFFICE_HEIGHT);

  const geometry = new THREE.PlaneGeometry(OFFICE_WIDTH * TILE_SIZE, OFFICE_HEIGHT * TILE_SIZE);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    depthWrite: false  // Don't write to depth buffer so sprites render on top
  });
  const floor = new THREE.Mesh(geometry, material);

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.renderOrder = -10;  // Render floor behind everything
  scene.add(floor);

  return floor;
}

/**
 * Create window texture
 */
function createWindowTexture(isDay) {
  return createCanvasTexture(48, 64, (ctx, w, h) => {
    // Window frame (dark gray)
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, w, h);

    // Window glass area
    const glassColor = isDay ? 'rgba(135, 206, 235, 0.6)' : 'rgba(26, 42, 58, 0.6)';
    ctx.fillStyle = glassColor;
    ctx.fillRect(4, 4, w - 8, h - 8);

    // Cross dividers for multi-pane look
    ctx.fillStyle = '#4a5568';
    // Vertical divider
    ctx.fillRect(w / 2 - 2, 4, 4, h - 8);
    // Horizontal divider
    ctx.fillRect(4, h / 2 - 2, w - 8, 4);

    // Frame highlight (top and left inner edges)
    ctx.fillStyle = '#5a6a7a';
    ctx.fillRect(2, 2, w - 4, 2);
    ctx.fillRect(2, 2, 2, h - 4);

    // Glass reflection/shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(6, 6, 14, 8);
    ctx.fillRect(w / 2 + 4, 6, 10, 6);
  });
}

/**
 * Create door texture
 */
function createDoorTexture() {
  return createCanvasTexture(40, 80, (ctx, w, h) => {
    // Door frame (wood border)
    ctx.fillStyle = '#5d4e37';
    ctx.fillRect(0, 0, w, h);

    // Door main area (lighter wood)
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(4, 4, w - 8, h - 4);

    // Door panel highlights
    ctx.fillStyle = '#a67c00';
    ctx.fillRect(6, 6, w - 12, 4);
    ctx.fillRect(6, 6, 4, h - 10);

    // Door panel shadows
    ctx.fillStyle = '#725a12';
    ctx.fillRect(w - 10, 6, 4, h - 10);
    ctx.fillRect(6, h - 8, w - 12, 4);

    // Upper panel
    ctx.fillStyle = '#6b5410';
    ctx.fillRect(8, 10, w - 16, 28);
    ctx.fillStyle = '#7a6212';
    ctx.fillRect(10, 12, w - 20, 24);

    // Lower panel
    ctx.fillStyle = '#6b5410';
    ctx.fillRect(8, 44, w - 16, 32);
    ctx.fillStyle = '#7a6212';
    ctx.fillRect(10, 46, w - 20, 28);

    // Door handle (metallic)
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(w - 14, h / 2 - 6, 6, 12);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w - 13, h / 2 - 5, 3, 4);
    ctx.fillStyle = '#909090';
    ctx.fillRect(w - 13, h / 2 + 2, 4, 4);
  });
}

/**
 * Create walls with windows (back wall and left wall only)
 */
function createWalls(scene) {
  const wallColor = '#2a3a4a';
  const wallHighlight = '#3a4a5a';
  const wallMaterial = new THREE.MeshBasicMaterial({ color: wallColor, side: THREE.DoubleSide });

  // Back wall
  const backWallGeometry = new THREE.PlaneGeometry(OFFICE_WIDTH * TILE_SIZE, 3);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, 1.5, -OFFICE_HEIGHT * TILE_SIZE / 2);
  backWall.renderOrder = 0;  // Base layer for walls
  scene.add(backWall);

  // Back wall highlight strip
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: wallHighlight });
  const highlightGeometry = new THREE.PlaneGeometry(OFFICE_WIDTH * TILE_SIZE, 0.15);
  const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
  highlight.position.set(0, 2.85, -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.01);
  highlight.renderOrder = 0;
  scene.add(highlight);

  // Add windows to back wall (using PlaneGeometry, flat against wall)
  const isDay = isDaytime();
  const windowTexture = createWindowTexture(isDay);
  const windowPositions = [-4, 0, 4];  // x positions for 3 windows

  windowPositions.forEach(xPos => {
    const windowMaterial = new THREE.MeshBasicMaterial({
      map: windowTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    // Use PlaneGeometry instead of Sprite so it stays flat on the wall
    const windowGeometry = new THREE.PlaneGeometry(1.2, 1.6);
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    // Position flat against back wall (no rotation needed, same as wall)
    windowMesh.position.set(xPos, 1.8, -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.02);
    windowMesh.userData = { type: 'window' };
    windowMesh.renderOrder = 1;  // Render above wall
    scene.add(windowMesh);
  });

  // Left wall
  const leftWallGeometry = new THREE.PlaneGeometry(OFFICE_HEIGHT * TILE_SIZE, 3);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-OFFICE_WIDTH * TILE_SIZE / 2, 1.5, 0);
  leftWall.renderOrder = 0;  // Base layer for walls
  scene.add(leftWall);

  // Left wall highlight
  const leftHighlightGeometry = new THREE.PlaneGeometry(OFFICE_HEIGHT * TILE_SIZE, 0.15);
  const leftHighlight = new THREE.Mesh(leftHighlightGeometry, highlightMaterial);
  leftHighlight.rotation.y = Math.PI / 2;
  leftHighlight.position.set(-OFFICE_WIDTH * TILE_SIZE / 2 + 0.01, 2.85, 0);
  scene.add(leftHighlight);

  // Add door to left wall (upper area) using PlaneGeometry, flat against wall
  const doorTexture = createDoorTexture();
  const doorMaterial = new THREE.MeshBasicMaterial({
    map: doorTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true
  });
  const doorGeometry = new THREE.PlaneGeometry(1.0, 2.0);
  const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
  // Rotate to match left wall orientation
  doorMesh.rotation.y = Math.PI / 2;
  // Position on left wall, upper area (z = -4), slightly in front of wall
  doorMesh.position.set(-OFFICE_WIDTH * TILE_SIZE / 2 + 0.05, 1.0, DOOR_POSITION.z);
  doorMesh.userData = { type: 'door' };
  doorMesh.renderOrder = 1;  // Render above wall
  scene.add(doorMesh);

  // Add baseboard to back wall
  const baseboardColor = '#1a2a3a';
  const baseboardMaterial = new THREE.MeshBasicMaterial({ color: baseboardColor });
  const baseboardGeometry = new THREE.PlaneGeometry(OFFICE_WIDTH * TILE_SIZE, 0.2);
  const baseboard = new THREE.Mesh(baseboardGeometry, baseboardMaterial);
  baseboard.position.set(0, 0.1, -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.01);
  scene.add(baseboard);

  // Add baseboard to left wall
  const leftBaseboardGeometry = new THREE.PlaneGeometry(OFFICE_HEIGHT * TILE_SIZE, 0.2);
  const leftBaseboard = new THREE.Mesh(leftBaseboardGeometry, baseboardMaterial);
  leftBaseboard.rotation.y = Math.PI / 2;
  leftBaseboard.position.set(-OFFICE_WIDTH * TILE_SIZE / 2 + 0.01, 0.1, 0);
  scene.add(leftBaseboard);
}

/**
 * Create a sprite from texture
 */
function createSprite(texture, width, height) {
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 1;  // Render above floor
  return sprite;
}

/**
 * Create 2.5D desks and chairs
 */
function createDesks(scene) {
  const textures = {
    top: createDeskTopTexture(),
    front: createDeskFrontTexture(),
    side: createDeskSideTexture(),
    monitor: createDeskMonitorTexture(),
    chair: createChairTexture()
  };
  const desks = [];

  const deskWidth = 1.2;
  const deskDepth = 0.6;
  const deskHeight = 0.45;
  const deskY = 0.4;

  DESK_POSITIONS.forEach((pos, index) => {
    const meshes = [];
    const facingBack = pos.rotation === 0;
    const frontZ = facingBack ? pos.z + deskDepth / 2 : pos.z - deskDepth / 2;
    const sideX = pos.x + deskWidth / 2;

    // Top face
    const topMaterial = new THREE.MeshBasicMaterial({
      map: textures.top,
      transparent: true,
      side: THREE.DoubleSide
    });
    const topGeometry = new THREE.PlaneGeometry(deskWidth, deskDepth);
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.set(pos.x, deskY, pos.z);
    topMesh.userData = { type: 'desk', index };
    topMesh.renderOrder = 2;
    scene.add(topMesh);
    meshes.push(topMesh);

    // Front face
    const frontMaterial = new THREE.MeshBasicMaterial({
      map: textures.front,
      transparent: true,
      side: THREE.DoubleSide
    });
    const frontGeometry = new THREE.PlaneGeometry(deskWidth, deskHeight);
    const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    frontMesh.position.set(pos.x, deskY - deskHeight / 2, frontZ);
    if (!facingBack) frontMesh.rotation.y = Math.PI;
    frontMesh.renderOrder = 2;
    scene.add(frontMesh);
    meshes.push(frontMesh);

    // Side face
    const sideMaterial = new THREE.MeshBasicMaterial({
      map: textures.side,
      transparent: true,
      side: THREE.DoubleSide
    });
    const sideGeometry = new THREE.PlaneGeometry(deskDepth, deskHeight);
    const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
    sideMesh.rotation.y = Math.PI / 2;
    sideMesh.position.set(sideX, deskY - deskHeight / 2, pos.z);
    sideMesh.renderOrder = 2;
    scene.add(sideMesh);
    meshes.push(sideMesh);

    // Monitor
    const monitorMaterial = new THREE.MeshBasicMaterial({
      map: textures.monitor,
      transparent: true,
      side: THREE.DoubleSide
    });
    const monitorGeometry = new THREE.PlaneGeometry(0.5, 0.45);
    const monitorMesh = new THREE.Mesh(monitorGeometry, monitorMaterial);
    const monitorZ = facingBack ? pos.z - 0.15 : pos.z + 0.15;
    monitorMesh.position.set(pos.x, deskY + 0.25, monitorZ);
    if (!facingBack) monitorMesh.rotation.y = Math.PI;
    monitorMesh.renderOrder = 3;
    scene.add(monitorMesh);
    meshes.push(monitorMesh);

    // Chair
    const chairOffset = facingBack ? 0.7 : -0.7;
    const chair = createSprite(textures.chair, 0.5, 0.7);
    chair.position.set(pos.x, 0.35, pos.z + chairOffset);
    chair.renderOrder = 2;
    scene.add(chair);
    meshes.push(chair);

    desks.push({ desk: topMesh, meshes, chair, position: pos, occupied: false, index });
  });

  return { desks, deskTexture: textures.top, chairTexture: textures.chair };
}

/**
 * Create coffee machine (attached to back wall, 2.5D style with depth)
 */
function createCoffeeMachine(scene) {
  const coffeeX = COFFEE_POSITION.x;
  const coffeeY = 0.7;
  const coffeeZ = -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.03;  // On back wall
  const depth = 0.25;  // How far the machine sticks out from wall

  // Front face
  const frontTexture = createCoffeeMachineTexture();
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const frontGeometry = new THREE.PlaneGeometry(0.6, 1.0);
  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(coffeeX, coffeeY, coffeeZ + depth);
  frontMesh.userData = { type: 'coffee' };
  frontMesh.renderOrder = 1;
  scene.add(frontMesh);

  // Side face (right side, visible from isometric view)
  const sideTexture = createCoffeeMachineSideTexture();
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: sideTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const sideGeometry = new THREE.PlaneGeometry(depth, 1.0);
  const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
  sideMesh.rotation.y = Math.PI / 2;
  sideMesh.position.set(coffeeX + 0.3, coffeeY, coffeeZ + depth / 2);
  sideMesh.renderOrder = 1;
  scene.add(sideMesh);

  // Top face
  const topMaterial = new THREE.MeshBasicMaterial({
    color: '#4a4a5a',
    side: THREE.DoubleSide
  });
  const topGeometry = new THREE.PlaneGeometry(0.6, depth);
  const topMesh = new THREE.Mesh(topGeometry, topMaterial);
  topMesh.rotation.x = -Math.PI / 2;
  topMesh.position.set(coffeeX, coffeeY + 0.5, coffeeZ + depth / 2);
  topMesh.renderOrder = 1;
  scene.add(topMesh);

  return frontMesh;
}

/**
 * Create decorative plants
 */
function createPlants(scene) {
  const texture = createPlantTexture();
  const plants = [];

  PLANT_POSITIONS.forEach(pos => {
    const plant = createSprite(texture, 0.5, 0.7);
    plant.position.set(pos.x, 0.35, pos.z);
    plant.userData = { type: 'plant' };
    scene.add(plant);
    plants.push(plant);
  });

  return plants;
}

/**
 * Create kitchen table (freestanding 2.5D style with depth)
 */
function createKitchenTable(scene) {
  const tableX = KITCHEN_POSITION.x;
  const tableY = 0.5;  // Height of table surface
  const tableZ = KITCHEN_POSITION.z;
  const tableWidth = 3.6;  // Double length (2 more tiles)
  const tableDepth = 0.9;
  const tableHeight = 0.6;

  // Top face (horizontal surface with items)
  const topTexture = createKitchenTableTopTexture();
  const topMaterial = new THREE.MeshBasicMaterial({
    map: topTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const topGeometry = new THREE.PlaneGeometry(tableWidth, tableDepth);
  const topMesh = new THREE.Mesh(topGeometry, topMaterial);
  topMesh.rotation.x = -Math.PI / 2;  // Lay flat
  topMesh.position.set(tableX, tableY, tableZ);
  topMesh.userData = { type: 'kitchenTable' };
  topMesh.renderOrder = 2;
  scene.add(topMesh);

  // Front face (visible from camera, higher z)
  const frontTexture = createKitchenTableFrontTexture();
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const frontGeometry = new THREE.PlaneGeometry(tableWidth, tableHeight);
  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(tableX, tableY - tableHeight / 2, tableZ + tableDepth / 2);
  frontMesh.renderOrder = 2;
  scene.add(frontMesh);

  // Right side face (visible from isometric angle)
  const sideTexture = createKitchenTableSideTexture();
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: sideTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const sideGeometry = new THREE.PlaneGeometry(tableDepth, tableHeight);
  const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
  sideMesh.rotation.y = Math.PI / 2;  // Rotate to face right
  sideMesh.position.set(tableX + tableWidth / 2, tableY - tableHeight / 2, tableZ);
  sideMesh.renderOrder = 2;
  scene.add(sideMesh);

  return topMesh;
}

/**
 * Create refrigerator side texture (for depth)
 */
function createRefrigeratorSideTexture() {
  return createCanvasTexture(16, 64, (ctx, w, h) => {
    // Side body - slightly darker than front
    ctx.fillStyle = '#cbd5e0';
    ctx.fillRect(0, 0, w, h);

    // Shadow edge
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(w - 3, 0, 3, h);

    // Freezer section line
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, h * 0.3, w, 2);

    // Subtle depth lines
    ctx.fillStyle = '#b8c5d1';
    ctx.fillRect(2, 4, 2, h * 0.25);
    ctx.fillRect(2, h * 0.35, 2, h * 0.6);
  });
}

/**
 * Create refrigerator (attached to back wall, 2.5D style with depth)
 */
function createRefrigerator(scene) {
  const fridgeX = 7.5;  // Top-right corner
  const fridgeY = 0.9;
  const fridgeZ = -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.03;
  const depth = 0.35;  // How far the fridge sticks out from wall

  // Front face
  const frontTexture = createRefrigeratorTexture();
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const frontGeometry = new THREE.PlaneGeometry(0.9, 1.8);
  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(fridgeX, fridgeY, fridgeZ + depth);
  frontMesh.userData = { type: 'refrigerator' };
  frontMesh.renderOrder = 1;  // Render above floor
  scene.add(frontMesh);

  // Side face (right side, visible from isometric view)
  const sideTexture = createRefrigeratorSideTexture();
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: sideTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const sideGeometry = new THREE.PlaneGeometry(depth, 1.8);
  const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
  sideMesh.rotation.y = Math.PI / 2;  // Rotate to face sideways
  sideMesh.position.set(fridgeX + 0.45, fridgeY, fridgeZ + depth / 2);
  sideMesh.renderOrder = 1;  // Render above floor
  scene.add(sideMesh);

  // Top face (small visible top)
  const topMaterial = new THREE.MeshBasicMaterial({
    color: '#e8eef4',
    side: THREE.DoubleSide
  });
  const topGeometry = new THREE.PlaneGeometry(0.9, depth);
  const topMesh = new THREE.Mesh(topGeometry, topMaterial);
  topMesh.rotation.x = -Math.PI / 2;  // Rotate to be horizontal
  topMesh.position.set(fridgeX, fridgeY + 0.9, fridgeZ + depth / 2);
  topMesh.renderOrder = 1;  // Render above floor
  scene.add(topMesh);

  return frontMesh;
}

/**
 * Create wall speaker texture (pixel art boombox)
 */
function createWallSpeakerTexture(isPlaying) {
  return createCanvasTexture(48, 40, (ctx, w, h) => {
    // Body
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(2, 4, w - 4, h - 6);

    // Body highlight (top edge)
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(2, 4, w - 4, 3);

    // Left speaker cone
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.arc(14, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(14, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.arc(14, 22, 2, 0, Math.PI * 2);
    ctx.fill();

    // Right speaker cone
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.arc(34, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(34, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.arc(34, 22, 2, 0, Math.PI * 2);
    ctx.fill();

    // Center display
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(18, 14, 12, 8);

    if (isPlaying) {
      // Music notes on display when playing - two eighth notes connected
      ctx.fillStyle = '#4ade80';
      // Left note: head (oval) + stem
      ctx.beginPath();
      ctx.ellipse(21, 20, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(22, 14, 1, 6);  // stem
      // Right note: head (oval) + stem  
      ctx.beginPath();
      ctx.ellipse(27, 19, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(28, 14, 1, 5);  // stem
      // Beam connecting the two notes
      ctx.fillRect(22, 14, 7, 2);

      // LED indicator - green
      ctx.fillStyle = '#4ade80';
    } else {
      // Dashes on display when paused
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(20, 18, 3, 1);
      ctx.fillRect(25, 18, 3, 1);

      // LED indicator - dim red
      ctx.fillStyle = '#6b2020';
    }
    ctx.fillRect(23, 8, 3, 3);

    // Bottom shadow
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(4, h - 4, w - 8, 2);
  });
}

/**
 * Create wall speaker side texture (for depth)
 */
function createWallSpeakerSideTexture() {
  return createCanvasTexture(16, 40, (ctx, w, h) => {
    // Side body - slightly darker than front
    ctx.fillStyle = '#222230';
    ctx.fillRect(0, 4, w, h - 6);

    // Top edge highlight
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 4, w, 3);

    // Bottom shadow
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, h - 4, w, 2);

    // Vent/grill lines
    ctx.fillStyle = '#1a1a2a';
    for (let i = 10; i < h - 10; i += 4) {
      ctx.fillRect(2, i, w - 4, 1);
    }
  });
}

/**
 * Create wall-mounted speaker on the back wall (2.5D with depth)
 */
function createWallSpeaker(scene) {
  const speakerX = 5.75;  // Between right window (x=4) and refrigerator (x=7.5)
  const speakerY = 1.8;   // Same height as windows
  const speakerZ = -OFFICE_HEIGHT * TILE_SIZE / 2 + 0.03; // On back wall
  const depth = 0.25;     // How far the speaker sticks out from wall

  const texture = createWallSpeakerTexture(false);
  const playingTexture = createWallSpeakerTexture(true);
  const sideTexture = createWallSpeakerSideTexture();

  // Front face
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const frontGeometry = new THREE.PlaneGeometry(1.0, 0.85);
  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(speakerX, speakerY, speakerZ + depth);
  frontMesh.userData = { type: 'wallSpeaker' };
  frontMesh.renderOrder = 2;
  scene.add(frontMesh);

  // Side face (right side, visible from isometric view)
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: sideTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const sideGeometry = new THREE.PlaneGeometry(depth, 0.85);
  const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
  sideMesh.rotation.y = Math.PI / 2;
  sideMesh.position.set(speakerX + 0.5, speakerY, speakerZ + depth / 2);
  sideMesh.renderOrder = 2;
  scene.add(sideMesh);

  // Top face (small visible top)
  const topMaterial = new THREE.MeshBasicMaterial({
    color: '#2a2a3a',
    side: THREE.DoubleSide
  });
  const topGeometry = new THREE.PlaneGeometry(1.0, depth);
  const topMesh = new THREE.Mesh(topGeometry, topMaterial);
  topMesh.rotation.x = -Math.PI / 2;
  topMesh.position.set(speakerX, speakerY + 0.425, speakerZ + depth / 2);
  topMesh.renderOrder = 2;
  scene.add(topMesh);

  return { mesh: frontMesh, texture, playingTexture };
}

/**
 * Create the complete office environment
 */
export function createOffice(scene) {
  createFloor(scene);
  createWalls(scene);
  const { desks, deskTexture, chairTexture } = createDesks(scene);
  const coffeeMachine = createCoffeeMachine(scene);
  const plants = createPlants(scene);

  // Create kitchen area
  const kitchenTable = createKitchenTable(scene);
  const refrigerator = createRefrigerator(scene);

  // Create wall speaker
  const wallSpeaker = createWallSpeaker(scene);

  // Create and initialize DeskManager for dynamic desk creation
  const deskManager = new DeskManager(scene);
  deskManager.init(deskTexture, chairTexture);
  // Pre-populate with existing desks
  for (const desk of desks) {
    deskManager.desks.push(desk);
  }

  return {
    desks,
    deskManager,
    coffeeMachine,
    plants,
    kitchenTable,
    refrigerator,
    wallSpeaker,
    OFFICE_WIDTH,
    OFFICE_HEIGHT
  };
}
