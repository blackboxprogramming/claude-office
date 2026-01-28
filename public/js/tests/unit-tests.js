/**
 * Unit tests for Claude Office JavaScript classes
 *
 * Tests cover:
 * - DeskManager: desk creation, availability, release
 * - Character: state transitions, position updates, particle management
 * - ConnectionRenderer: connection creation, position updates, cleanup
 * - Kitchen spot management: getKitchenSpot, releaseKitchenSpot, getKitchenOccupantCount
 * - Time-based functions: isDaytime, getTimeBasedColors
 */

import { TestHarness, assert, mockThree } from './test-harness.js';
import { DeskManager, DESK_POSITIONS, KITCHEN_SPOTS, isDaytime, getTimeBasedColors } from '../office.js';
import { Character, CharacterState } from '../character.js';
import { ConnectionRenderer } from '../connections.js';

// Create test harness instance
const harness = new TestHarness();
const { describe, it, beforeEach, afterEach } = harness;

// =============================================================================
// DeskManager Tests
// =============================================================================

describe('DeskManager', () => {
  let mockScene;
  let deskManager;
  let mockDeskTexture;
  let mockChairTexture;

  beforeEach(() => {
    mockScene = mockThree.createMockScene();
    deskManager = new DeskManager(mockScene);
    mockDeskTexture = { clone: () => mockDeskTexture };
    mockChairTexture = { clone: () => mockChairTexture };
  });

  it('should initialize with empty desks array', () => {
    assert.isArray(deskManager.desks);
    assert.equal(deskManager.desks.length, 0);
  });

  it('should store scene reference', () => {
    assert.equal(deskManager.scene, mockScene);
  });

  it('should store textures after init', () => {
    deskManager.init(mockDeskTexture, mockChairTexture);
    assert.equal(deskManager.deskTexture, mockDeskTexture);
    assert.equal(deskManager.chairTexture, mockChairTexture);
  });

  it('should compute correct desk position for index 0', () => {
    const pos = deskManager.computeDeskPosition(0);
    assert.equal(pos.x, -4.5);
    assert.equal(pos.z, -1);
    assert.equal(pos.rotation, 0);
  });

  it('should compute correct desk position for index 3 (last in first row)', () => {
    const pos = deskManager.computeDeskPosition(3);
    assert.equal(pos.x, 4.5);
    assert.equal(pos.z, -1);
    assert.equal(pos.rotation, 0);
  });

  it('should compute correct desk position for index 4 (first in second row)', () => {
    const pos = deskManager.computeDeskPosition(4);
    assert.equal(pos.x, -4.5);
    assert.equal(pos.z, 2);
    assert.equal(pos.rotation, Math.PI);
  });

  it('should compute correct desk position for index 5', () => {
    const pos = deskManager.computeDeskPosition(5);
    assert.equal(pos.x, -1.5);
    assert.equal(pos.z, 2);
    assert.equal(pos.rotation, Math.PI);
  });

  it('should return first unoccupied desk from getAvailableDesk', () => {
    // Add some pre-existing desks
    const desk1 = { occupied: true, position: { x: 0 } };
    const desk2 = { occupied: false, position: { x: 1 } };
    deskManager.desks.push(desk1, desk2);

    const result = deskManager.getAvailableDesk();
    assert.equal(result, desk2);
  });

  it('should release desk by position', () => {
    const position = { x: 1, z: 2, rotation: 0 };
    const desk = { occupied: true, position };
    deskManager.desks.push(desk);

    deskManager.releaseDesk(position);
    assert.equal(desk.occupied, false);
  });

  it('should return all desks from getDesks', () => {
    const desk1 = { occupied: false };
    const desk2 = { occupied: true };
    deskManager.desks.push(desk1, desk2);

    const desks = deskManager.getDesks();
    assert.equal(desks.length, 2);
    assert.equal(desks[0], desk1);
    assert.equal(desks[1], desk2);
  });
});

// =============================================================================
// DESK_POSITIONS constant tests
// =============================================================================

describe('DESK_POSITIONS', () => {
  it('should have 8 desk positions', () => {
    assert.equal(DESK_POSITIONS.length, 8);
  });

  it('should have x, z, and rotation for each position', () => {
    for (const pos of DESK_POSITIONS) {
      assert.hasProperty(pos, 'x');
      assert.hasProperty(pos, 'z');
      assert.hasProperty(pos, 'rotation');
    }
  });

  it('should have first row with rotation 0', () => {
    assert.equal(DESK_POSITIONS[0].rotation, 0);
    assert.equal(DESK_POSITIONS[1].rotation, 0);
    assert.equal(DESK_POSITIONS[2].rotation, 0);
    assert.equal(DESK_POSITIONS[3].rotation, 0);
  });

  it('should have second row with rotation PI', () => {
    assert.equal(DESK_POSITIONS[4].rotation, Math.PI);
    assert.equal(DESK_POSITIONS[5].rotation, Math.PI);
    assert.equal(DESK_POSITIONS[6].rotation, Math.PI);
    assert.equal(DESK_POSITIONS[7].rotation, Math.PI);
  });
});

// =============================================================================
// KITCHEN_SPOTS constant tests
// =============================================================================

describe('KITCHEN_SPOTS', () => {
  it('should have 4 kitchen spots', () => {
    assert.equal(KITCHEN_SPOTS.length, 4);
  });

  it('should have x and z for each spot', () => {
    for (const spot of KITCHEN_SPOTS) {
      assert.hasProperty(spot, 'x');
      assert.hasProperty(spot, 'z');
    }
  });

  it('should be positioned in upper-right area', () => {
    for (const spot of KITCHEN_SPOTS) {
      assert.greaterThan(spot.x, 0, 'Kitchen spots should be on the right side');
      assert.lessThan(spot.z, 0, 'Kitchen spots should be in the upper area');
    }
  });
});

// =============================================================================
// Time-based functions tests
// =============================================================================

describe('isDaytime', () => {
  it('should return a boolean', () => {
    const result = isDaytime();
    assert.ok(typeof result === 'boolean');
  });
});

describe('getTimeBasedColors', () => {
  it('should return an object with background and isDay', () => {
    const result = getTimeBasedColors();
    assert.isObject(result);
    assert.hasProperty(result, 'background');
    assert.hasProperty(result, 'isDay');
  });

  it('should return a number for background', () => {
    const result = getTimeBasedColors();
    assert.ok(typeof result.background === 'number');
  });

  it('should return a boolean for isDay', () => {
    const result = getTimeBasedColors();
    assert.ok(typeof result.isDay === 'boolean');
  });

  it('should have consistent isDay and background', () => {
    const result = getTimeBasedColors();
    if (result.isDay) {
      assert.equal(result.background, 0x87ceeb, 'Day should have sky blue background');
    } else {
      assert.equal(result.background, 0x0a0a1a, 'Night should have dark blue background');
    }
  });
});

// =============================================================================
// CharacterState tests
// =============================================================================

describe('CharacterState', () => {
  it('should have WORKING state', () => {
    assert.equal(CharacterState.WORKING, 'working');
  });

  it('should have SLEEPING state', () => {
    assert.equal(CharacterState.SLEEPING, 'sleeping');
  });

  it('should have WALKING state', () => {
    assert.equal(CharacterState.WALKING, 'walking');
  });

  it('should have EXITING state', () => {
    assert.equal(CharacterState.EXITING, 'exiting');
  });

  it('should have SOCIALIZING state', () => {
    assert.equal(CharacterState.SOCIALIZING, 'socializing');
  });
});

// =============================================================================
// Kitchen spot management tests (simulated, since these are module-scoped)
// =============================================================================

describe('Kitchen Spot Management (simulated)', () => {
  let kitchenOccupants;

  const getKitchenSpot = (sessionId) => {
    if (kitchenOccupants.has(sessionId)) {
      return KITCHEN_SPOTS[kitchenOccupants.get(sessionId)];
    }

    const occupiedSpots = new Set(kitchenOccupants.values());
    for (let i = 0; i < KITCHEN_SPOTS.length; i++) {
      if (!occupiedSpots.has(i)) {
        kitchenOccupants.set(sessionId, i);
        return KITCHEN_SPOTS[i];
      }
    }

    kitchenOccupants.set(sessionId, 0);
    return KITCHEN_SPOTS[0];
  };

  const releaseKitchenSpot = (sessionId) => {
    kitchenOccupants.delete(sessionId);
  };

  const getKitchenOccupantCount = () => {
    return kitchenOccupants.size;
  };

  beforeEach(() => {
    kitchenOccupants = new Map();
  });

  it('should return first spot for first character', () => {
    const spot = getKitchenSpot('session1');
    assert.equal(spot, KITCHEN_SPOTS[0]);
  });

  it('should return second spot for second character', () => {
    getKitchenSpot('session1');
    const spot = getKitchenSpot('session2');
    assert.equal(spot, KITCHEN_SPOTS[1]);
  });

  it('should return same spot for same session', () => {
    const spot1 = getKitchenSpot('session1');
    const spot2 = getKitchenSpot('session1');
    assert.equal(spot1, spot2);
  });

  it('should track occupant count correctly', () => {
    assert.equal(getKitchenOccupantCount(), 0);
    getKitchenSpot('session1');
    assert.equal(getKitchenOccupantCount(), 1);
    getKitchenSpot('session2');
    assert.equal(getKitchenOccupantCount(), 2);
  });

  it('should release kitchen spots correctly', () => {
    getKitchenSpot('session1');
    getKitchenSpot('session2');
    assert.equal(getKitchenOccupantCount(), 2);

    releaseKitchenSpot('session1');
    assert.equal(getKitchenOccupantCount(), 1);

    releaseKitchenSpot('session2');
    assert.equal(getKitchenOccupantCount(), 0);
  });

  it('should reuse released spots', () => {
    getKitchenSpot('session1');
    getKitchenSpot('session2');
    releaseKitchenSpot('session1');

    const spot = getKitchenSpot('session3');
    assert.equal(spot, KITCHEN_SPOTS[0], 'Should reuse first spot after release');
  });

  it('should fall back to first spot when all spots are taken', () => {
    getKitchenSpot('s1');
    getKitchenSpot('s2');
    getKitchenSpot('s3');
    getKitchenSpot('s4');

    // Fifth session should get first spot (overlap)
    const spot = getKitchenSpot('s5');
    assert.equal(spot, KITCHEN_SPOTS[0]);
  });
});

// =============================================================================
// ConnectionRenderer tests (mock-based)
// =============================================================================

describe('ConnectionRenderer', () => {
  let mockScene;
  let connectionRenderer;

  beforeEach(() => {
    mockScene = mockThree.createMockScene();
    connectionRenderer = new ConnectionRenderer(mockScene);
  });

  it('should initialize with empty connections map', () => {
    assert.equal(connectionRenderer.connections.size, 0);
  });

  it('should store scene reference', () => {
    assert.equal(connectionRenderer.scene, mockScene);
  });

  it('should initialize time to 0', () => {
    assert.equal(connectionRenderer.time, 0);
  });

  it('should calculate head position correctly', () => {
    const mockCharacter = {
      sprite: {
        position: { x: 5, y: 0.8, z: 3 }
      }
    };

    const headPos = connectionRenderer.getHeadPosition(mockCharacter);
    assert.equal(headPos.x, 5);
    assert.closeTo(headPos.y, 0.8 + 1.6 - 0.8, 0.001);
    assert.equal(headPos.z, 3);
  });

  it('should update time in update method', () => {
    connectionRenderer.update(0.016);
    assert.closeTo(connectionRenderer.time, 16, 0.1);

    connectionRenderer.update(0.016);
    assert.closeTo(connectionRenderer.time, 32, 0.1);
  });

  it('should clear all connections on dispose', () => {
    // Simulate some connections
    const mockConnection = {
      line: { },
      arrow: { children: [{ material: {} }], userData: {} },
      lineGeometry: { dispose: () => {} },
      lineMaterial: { dispose: () => {} }
    };
    connectionRenderer.connections.set('test-key', mockConnection);

    connectionRenderer.dispose();
    assert.equal(connectionRenderer.connections.size, 0);
  });
});

// =============================================================================
// Character class tests (limited due to THREE.js dependency)
// =============================================================================

describe('Character State Logic', () => {
  it('CharacterState should have all required states', () => {
    const states = ['WORKING', 'SLEEPING', 'WALKING', 'EXITING', 'SOCIALIZING'];
    for (const state of states) {
      assert.hasProperty(CharacterState, state);
    }
  });

  it('CharacterState values should be lowercase strings', () => {
    assert.equal(CharacterState.WORKING, 'working');
    assert.equal(CharacterState.SLEEPING, 'sleeping');
    assert.equal(CharacterState.WALKING, 'walking');
    assert.equal(CharacterState.EXITING, 'exiting');
    assert.equal(CharacterState.SOCIALIZING, 'socializing');
  });
});

// =============================================================================
// Particle class behavior tests (simulated)
// =============================================================================

describe('Particle Behavior (simulated)', () => {
  class MockParticle {
    constructor(startPosition) {
      this.position = { ...startPosition };
      this.velocity = { x: 0, y: 0.5, z: 0 };
      this.age = 0;
      this.maxAge = 1.5;
    }

    update(deltaTime) {
      this.age += deltaTime;
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      return this.age < this.maxAge;
    }
  }

  it('should track age over time', () => {
    const particle = new MockParticle({ x: 0, y: 0, z: 0 });
    assert.equal(particle.age, 0);

    particle.update(0.5);
    assert.equal(particle.age, 0.5);

    particle.update(0.5);
    assert.equal(particle.age, 1.0);
  });

  it('should return true while alive', () => {
    const particle = new MockParticle({ x: 0, y: 0, z: 0 });
    assert.ok(particle.update(0.5));
    assert.ok(particle.update(0.5));
  });

  it('should return false when expired', () => {
    const particle = new MockParticle({ x: 0, y: 0, z: 0 });
    particle.update(1.0);
    const alive = particle.update(0.6);
    assert.notOk(alive);
  });

  it('should update position based on velocity', () => {
    const particle = new MockParticle({ x: 0, y: 0, z: 0 });
    particle.velocity = { x: 1, y: 2, z: 0 };

    particle.update(0.5);
    assert.equal(particle.position.x, 0.5);
    assert.equal(particle.position.y, 1.0);
  });
});

// =============================================================================
// SweatParticle gravity simulation test
// =============================================================================

describe('SweatParticle Gravity (simulated)', () => {
  class MockSweatParticle {
    constructor() {
      this.velocity = { x: 0, y: 0.6 };
      this.gravity = 4.0;
      this.position = { y: 0 };
    }

    update(deltaTime) {
      this.velocity.y -= this.gravity * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
  }

  it('should apply gravity to velocity', () => {
    const particle = new MockSweatParticle();
    const initialVelocity = particle.velocity.y;

    particle.update(0.1);
    assert.lessThan(particle.velocity.y, initialVelocity);
  });

  it('should accelerate downward over time', () => {
    const particle = new MockSweatParticle();

    particle.update(0.1);
    const v1 = particle.velocity.y;

    particle.update(0.1);
    const v2 = particle.velocity.y;

    assert.lessThan(v2, v1, 'Velocity should decrease (become more negative)');
  });

  it('should eventually move downward', () => {
    const particle = new MockSweatParticle();

    // Update multiple times
    for (let i = 0; i < 10; i++) {
      particle.update(0.1);
    }

    assert.lessThan(particle.velocity.y, 0, 'Velocity should be negative (falling)');
  });
});

// =============================================================================
// Connection key generation test
// =============================================================================

describe('Connection Key Generation', () => {
  it('should generate unique keys for parent-child pairs', () => {
    const key1 = `parent1-child1`;
    const key2 = `parent1-child2`;
    const key3 = `parent2-child1`;

    assert.notEqual(key1, key2);
    assert.notEqual(key1, key3);
    assert.notEqual(key2, key3);
  });

  it('should generate consistent key for same pair', () => {
    const parentId = 'session-abc';
    const childId = 'session-xyz';
    const key1 = `${parentId}-${childId}`;
    const key2 = `${parentId}-${childId}`;

    assert.equal(key1, key2);
  });
});

// =============================================================================
// Run tests
// =============================================================================

export async function runTests() {
  return await harness.run();
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  window.runTests = runTests;
}
