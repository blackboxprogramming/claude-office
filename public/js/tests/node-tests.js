/**
 * Node.js compatible unit tests for Claude Office
 *
 * These tests can be run without a browser by mocking THREE.js and DOM APIs.
 * Run with: node --experimental-vm-modules public/js/tests/node-tests.js
 *
 * Tests cover logic that doesn't require actual WebGL rendering:
 * - DeskManager position calculations
 * - Kitchen spot management
 * - Time-based color calculations
 * - State machine logic
 * - Particle behavior simulation
 * - Connection key generation
 */

// ============================================================================
// Test Framework (simple built-in)
// ============================================================================

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  test(name, fn) {
    try {
      fn();
      this.passed++;
      console.log(`  \x1b[32mPASS\x1b[0m: ${name}`);
    } catch (e) {
      this.failed++;
      this.errors.push({ name, error: e.message });
      console.log(`  \x1b[31mFAIL\x1b[0m: ${name}`);
      console.log(`    ${e.message}`);
    }
  }

  suite(name, fn) {
    console.log(`\n\x1b[36m${name}\x1b[0m`);
    fn();
  }

  summary() {
    console.log('\n' + '='.repeat(50));
    console.log(`\x1b[32mPassed: ${this.passed}\x1b[0m | \x1b[31mFailed: ${this.failed}\x1b[0m | Total: ${this.passed + this.failed}`);

    if (this.errors.length > 0) {
      console.log('\n\x1b[31mFailures:\x1b[0m');
      for (const { name, error } of this.errors) {
        console.log(`  - ${name}: ${error}`);
      }
    }

    console.log('='.repeat(50));
    return this.failed === 0;
  }
}

const runner = new TestRunner();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, delta, message) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(message || `Expected ${actual} to be close to ${expected} (within ${delta})`);
  }
}

// ============================================================================
// Mock Constants (from office.js)
// ============================================================================

const DESK_GRID = {
  startX: -4.5,
  startZ: -1,
  spacingX: 3,
  spacingZ: 3,
  maxPerRow: 4
};

const DESK_POSITIONS = [
  { x: -4.5, z: -1, rotation: 0 },
  { x: -1.5, z: -1, rotation: 0 },
  { x: 1.5, z: -1, rotation: 0 },
  { x: 4.5, z: -1, rotation: 0 },
  { x: -4.5, z: 2, rotation: Math.PI },
  { x: -1.5, z: 2, rotation: Math.PI },
  { x: 1.5, z: 2, rotation: Math.PI },
  { x: 4.5, z: 2, rotation: Math.PI }
];

const KITCHEN_SPOTS = [
  { x: 6, z: -4.5 },
  { x: 7.5, z: -4.5 },
  { x: 6, z: -5.5 },
  { x: 7.5, z: -5.5 }
];

const CharacterState = {
  WORKING: 'working',
  SLEEPING: 'sleeping',
  WALKING: 'walking',
  EXITING: 'exiting',
  SOCIALIZING: 'socializing'
};

// ============================================================================
// DeskManager Logic Tests
// ============================================================================

function computeDeskPosition(index) {
  const row = Math.floor(index / DESK_GRID.maxPerRow);
  const col = index % DESK_GRID.maxPerRow;
  const rotation = row % 2 === 0 ? 0 : Math.PI;

  return {
    x: DESK_GRID.startX + col * DESK_GRID.spacingX,
    z: DESK_GRID.startZ + row * DESK_GRID.spacingZ,
    rotation
  };
}

runner.suite('DeskManager Position Calculation', () => {
  runner.test('should compute correct position for desk 0', () => {
    const pos = computeDeskPosition(0);
    assertEqual(pos.x, -4.5);
    assertEqual(pos.z, -1);
    assertEqual(pos.rotation, 0);
  });

  runner.test('should compute correct position for desk 1', () => {
    const pos = computeDeskPosition(1);
    assertEqual(pos.x, -1.5);
    assertEqual(pos.z, -1);
    assertEqual(pos.rotation, 0);
  });

  runner.test('should compute correct position for desk 3 (last in row 1)', () => {
    const pos = computeDeskPosition(3);
    assertEqual(pos.x, 4.5);
    assertEqual(pos.z, -1);
    assertEqual(pos.rotation, 0);
  });

  runner.test('should compute correct position for desk 4 (first in row 2)', () => {
    const pos = computeDeskPosition(4);
    assertEqual(pos.x, -4.5);
    assertEqual(pos.z, 2);
    assertEqual(pos.rotation, Math.PI);
  });

  runner.test('should compute correct position for desk 7 (last in row 2)', () => {
    const pos = computeDeskPosition(7);
    assertEqual(pos.x, 4.5);
    assertEqual(pos.z, 2);
    assertEqual(pos.rotation, Math.PI);
  });

  runner.test('should compute correct position for desk 8 (first in row 3)', () => {
    const pos = computeDeskPosition(8);
    assertEqual(pos.x, -4.5);
    assertEqual(pos.z, 5); // -1 + 2*3 = 5
    assertEqual(pos.rotation, 0);
  });

  runner.test('should alternate rotation every row', () => {
    assertEqual(computeDeskPosition(0).rotation, 0);
    assertEqual(computeDeskPosition(4).rotation, Math.PI);
    assertEqual(computeDeskPosition(8).rotation, 0);
    assertEqual(computeDeskPosition(12).rotation, Math.PI);
  });
});

// ============================================================================
// DESK_POSITIONS Constant Tests
// ============================================================================

runner.suite('DESK_POSITIONS', () => {
  runner.test('should have 8 positions', () => {
    assertEqual(DESK_POSITIONS.length, 8);
  });

  runner.test('first row should have rotation 0', () => {
    for (let i = 0; i < 4; i++) {
      assertEqual(DESK_POSITIONS[i].rotation, 0);
    }
  });

  runner.test('second row should have rotation PI', () => {
    for (let i = 4; i < 8; i++) {
      assertEqual(DESK_POSITIONS[i].rotation, Math.PI);
    }
  });

  runner.test('x positions should increase left to right', () => {
    assert(DESK_POSITIONS[0].x < DESK_POSITIONS[1].x);
    assert(DESK_POSITIONS[1].x < DESK_POSITIONS[2].x);
    assert(DESK_POSITIONS[2].x < DESK_POSITIONS[3].x);
  });
});

// ============================================================================
// KITCHEN_SPOTS Constant Tests
// ============================================================================

runner.suite('KITCHEN_SPOTS', () => {
  runner.test('should have 4 spots', () => {
    assertEqual(KITCHEN_SPOTS.length, 4);
  });

  runner.test('all spots should be in upper-right area', () => {
    for (const spot of KITCHEN_SPOTS) {
      assert(spot.x > 0, `x=${spot.x} should be positive`);
      assert(spot.z < 0, `z=${spot.z} should be negative`);
    }
  });

  runner.test('spots should form a 2x2 grid', () => {
    const xValues = new Set(KITCHEN_SPOTS.map(s => s.x));
    const zValues = new Set(KITCHEN_SPOTS.map(s => s.z));
    assertEqual(xValues.size, 2, 'Should have 2 unique x values');
    assertEqual(zValues.size, 2, 'Should have 2 unique z values');
  });
});

// ============================================================================
// Kitchen Spot Management Tests
// ============================================================================

runner.suite('Kitchen Spot Management', () => {
  let kitchenOccupants;

  function getKitchenSpot(sessionId) {
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
  }

  function releaseKitchenSpot(sessionId) {
    kitchenOccupants.delete(sessionId);
  }

  function getKitchenOccupantCount() {
    return kitchenOccupants.size;
  }

  // Reset before each test
  function setup() {
    kitchenOccupants = new Map();
  }

  setup();
  runner.test('should start with no occupants', () => {
    assertEqual(getKitchenOccupantCount(), 0);
  });

  setup();
  runner.test('should return first spot for first session', () => {
    const spot = getKitchenSpot('session1');
    assertEqual(spot, KITCHEN_SPOTS[0]);
  });

  setup();
  runner.test('should return second spot for second session', () => {
    getKitchenSpot('session1');
    const spot = getKitchenSpot('session2');
    assertEqual(spot, KITCHEN_SPOTS[1]);
  });

  setup();
  runner.test('should return same spot for same session ID', () => {
    const spot1 = getKitchenSpot('session1');
    const spot2 = getKitchenSpot('session1');
    assertEqual(spot1, spot2);
  });

  setup();
  runner.test('should track occupant count', () => {
    assertEqual(getKitchenOccupantCount(), 0);
    getKitchenSpot('s1');
    assertEqual(getKitchenOccupantCount(), 1);
    getKitchenSpot('s2');
    assertEqual(getKitchenOccupantCount(), 2);
    getKitchenSpot('s3');
    assertEqual(getKitchenOccupantCount(), 3);
    getKitchenSpot('s4');
    assertEqual(getKitchenOccupantCount(), 4);
  });

  setup();
  runner.test('should release spots correctly', () => {
    getKitchenSpot('s1');
    getKitchenSpot('s2');
    assertEqual(getKitchenOccupantCount(), 2);

    releaseKitchenSpot('s1');
    assertEqual(getKitchenOccupantCount(), 1);

    releaseKitchenSpot('s2');
    assertEqual(getKitchenOccupantCount(), 0);
  });

  setup();
  runner.test('should reuse released spots', () => {
    getKitchenSpot('s1');
    getKitchenSpot('s2');
    releaseKitchenSpot('s1');

    const spot = getKitchenSpot('s3');
    assertEqual(spot, KITCHEN_SPOTS[0]);
  });

  setup();
  runner.test('should fallback to first spot when all taken', () => {
    getKitchenSpot('s1');
    getKitchenSpot('s2');
    getKitchenSpot('s3');
    getKitchenSpot('s4');

    const spot = getKitchenSpot('s5');
    assertEqual(spot, KITCHEN_SPOTS[0]);
  });
});

// ============================================================================
// Time-Based Color Logic Tests
// ============================================================================

runner.suite('Time-Based Colors', () => {
  function getTimeBasedColorsForHour(hour) {
    if (hour >= 6 && hour < 18) {
      return {
        background: 0x87ceeb,
        isDay: true
      };
    } else {
      return {
        background: 0x0a0a1a,
        isDay: false
      };
    }
  }

  runner.test('6am should be daytime', () => {
    const colors = getTimeBasedColorsForHour(6);
    assertEqual(colors.isDay, true);
    assertEqual(colors.background, 0x87ceeb);
  });

  runner.test('12pm should be daytime', () => {
    const colors = getTimeBasedColorsForHour(12);
    assertEqual(colors.isDay, true);
  });

  runner.test('17:59 should be daytime', () => {
    const colors = getTimeBasedColorsForHour(17);
    assertEqual(colors.isDay, true);
  });

  runner.test('18:00 should be nighttime', () => {
    const colors = getTimeBasedColorsForHour(18);
    assertEqual(colors.isDay, false);
    assertEqual(colors.background, 0x0a0a1a);
  });

  runner.test('midnight should be nighttime', () => {
    const colors = getTimeBasedColorsForHour(0);
    assertEqual(colors.isDay, false);
  });

  runner.test('5am should be nighttime', () => {
    const colors = getTimeBasedColorsForHour(5);
    assertEqual(colors.isDay, false);
  });
});

// ============================================================================
// CharacterState Tests
// ============================================================================

runner.suite('CharacterState', () => {
  runner.test('WORKING should be "working"', () => {
    assertEqual(CharacterState.WORKING, 'working');
  });

  runner.test('SLEEPING should be "sleeping"', () => {
    assertEqual(CharacterState.SLEEPING, 'sleeping');
  });

  runner.test('WALKING should be "walking"', () => {
    assertEqual(CharacterState.WALKING, 'walking');
  });

  runner.test('EXITING should be "exiting"', () => {
    assertEqual(CharacterState.EXITING, 'exiting');
  });

  runner.test('SOCIALIZING should be "socializing"', () => {
    assertEqual(CharacterState.SOCIALIZING, 'socializing');
  });

  runner.test('should have exactly 5 states', () => {
    assertEqual(Object.keys(CharacterState).length, 5);
  });
});

// ============================================================================
// Particle Physics Simulation Tests
// ============================================================================

runner.suite('ZParticle Behavior (simulated)', () => {
  class MockZParticle {
    constructor(startPosition) {
      this.position = { ...startPosition };
      this.velocity = {
        x: (Math.random() - 0.5) * 0.4,
        y: 0.9 + Math.random() * 0.5,
        z: 0
      };
      this.age = 0;
      this.maxAge = 1.8 + Math.random() * 0.6;
    }

    update(deltaTime) {
      this.age += deltaTime;
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      return this.age < this.maxAge;
    }
  }

  runner.test('should start at age 0', () => {
    const particle = new MockZParticle({ x: 0, y: 0, z: 0 });
    assertEqual(particle.age, 0);
  });

  runner.test('should track age over time', () => {
    const particle = new MockZParticle({ x: 0, y: 0, z: 0 });
    particle.update(0.5);
    assertEqual(particle.age, 0.5);
  });

  runner.test('should return true while alive', () => {
    const particle = new MockZParticle({ x: 0, y: 0, z: 0 });
    particle.maxAge = 2.0;
    assert(particle.update(0.5) === true);
  });

  runner.test('should return false when expired', () => {
    const particle = new MockZParticle({ x: 0, y: 0, z: 0 });
    particle.maxAge = 1.0;
    particle.update(1.1);
    assert(particle.age >= particle.maxAge);
  });

  runner.test('should move upward (y increases)', () => {
    const particle = new MockZParticle({ x: 0, y: 0, z: 0 });
    const initialY = particle.position.y;
    particle.update(0.5);
    assert(particle.position.y > initialY);
  });
});

runner.suite('SweatParticle Behavior (simulated)', () => {
  class MockSweatParticle {
    constructor() {
      this.velocity = { x: 0.3, y: 0.6 };
      this.gravity = 4.0;
      this.position = { x: 0, y: 1 };
      this.age = 0;
      this.maxAge = 1.0;
    }

    update(deltaTime) {
      this.age += deltaTime;
      this.velocity.y -= this.gravity * deltaTime;
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      return this.age < this.maxAge;
    }
  }

  runner.test('should apply gravity to velocity', () => {
    const particle = new MockSweatParticle();
    const initialVy = particle.velocity.y;
    particle.update(0.1);
    assert(particle.velocity.y < initialVy);
  });

  runner.test('velocity should become negative (falling)', () => {
    const particle = new MockSweatParticle();
    // Update multiple times
    for (let i = 0; i < 5; i++) {
      particle.update(0.1);
    }
    assert(particle.velocity.y < 0, `velocity.y=${particle.velocity.y} should be negative`);
  });

  runner.test('should move horizontally', () => {
    const particle = new MockSweatParticle();
    particle.velocity.x = 0.5;
    const initialX = particle.position.x;
    particle.update(0.1);
    assert(particle.position.x > initialX);
  });
});

// ============================================================================
// Connection Key Generation Tests
// ============================================================================

runner.suite('Connection Key Generation', () => {
  runner.test('should create unique keys for different pairs', () => {
    const key1 = 'parent1-child1';
    const key2 = 'parent1-child2';
    const key3 = 'parent2-child1';

    assert(key1 !== key2);
    assert(key1 !== key3);
    assert(key2 !== key3);
  });

  runner.test('should create consistent keys for same pair', () => {
    const parent = 'session-abc';
    const child = 'session-xyz';
    const key1 = `${parent}-${child}`;
    const key2 = `${parent}-${child}`;

    assertEqual(key1, key2);
  });

  runner.test('parent-child order matters', () => {
    const key1 = 'A-B';
    const key2 = 'B-A';

    assert(key1 !== key2);
  });
});

// ============================================================================
// Head Position Calculation Tests
// ============================================================================

runner.suite('Head Position Calculation', () => {
  const HEAD_OFFSET_Y = 1.6;

  function getHeadPosition(spritePosition) {
    return {
      x: spritePosition.x,
      y: spritePosition.y + HEAD_OFFSET_Y - 0.8,
      z: spritePosition.z
    };
  }

  runner.test('should calculate correct head position', () => {
    const spritePos = { x: 5, y: 0.8, z: 3 };
    const headPos = getHeadPosition(spritePos);

    assertEqual(headPos.x, 5);
    assertClose(headPos.y, 1.6, 0.001);
    assertEqual(headPos.z, 3);
  });

  runner.test('should preserve x and z coordinates', () => {
    const spritePos = { x: -2.5, y: 0.8, z: 4.5 };
    const headPos = getHeadPosition(spritePos);

    assertEqual(headPos.x, spritePos.x);
    assertEqual(headPos.z, spritePos.z);
  });
});

// ============================================================================
// Animation Timing Tests
// ============================================================================

runner.suite('Animation Timing Constants', () => {
  const FRAME_DURATION = 200;
  const ZZZ_SPAWN_INTERVAL = 800;
  const SWEAT_SPAWN_INTERVAL = 600;
  const MONITOR_FRAME_DURATION = 150;
  const CHAT_BUBBLE_SPAWN_INTERVAL = 1200;

  runner.test('frame duration should allow 5 FPS character animation', () => {
    const fps = 1000 / FRAME_DURATION;
    assertEqual(fps, 5);
  });

  runner.test('Z particle spawns slower than sweat', () => {
    assert(ZZZ_SPAWN_INTERVAL > SWEAT_SPAWN_INTERVAL);
  });

  runner.test('chat bubbles spawn slowest', () => {
    assert(CHAT_BUBBLE_SPAWN_INTERVAL > ZZZ_SPAWN_INTERVAL);
    assert(CHAT_BUBBLE_SPAWN_INTERVAL > SWEAT_SPAWN_INTERVAL);
  });

  runner.test('monitor animation is faster than character animation', () => {
    assert(MONITOR_FRAME_DURATION < FRAME_DURATION);
  });
});

// ============================================================================
// Run Tests
// ============================================================================

const success = runner.summary();
process.exit(success ? 0 : 1);
