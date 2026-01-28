/**
 * Simple browser-based test harness for ES modules
 * No dependencies required - runs directly in browser
 */

class TestHarness {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Create a test suite
   */
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEach: null,
      afterEach: null
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  }

  /**
   * Register a before each hook
   */
  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach = fn;
    }
  }

  /**
   * Register an after each hook
   */
  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEach = fn;
    }
  }

  /**
   * Register a test
   */
  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  /**
   * Run all tests
   */
  async run() {
    console.log('Starting tests...\n');

    for (const suite of this.suites) {
      console.log(`Suite: ${suite.name}`);

      for (const test of suite.tests) {
        try {
          if (suite.beforeEach) {
            await suite.beforeEach();
          }

          await test.fn();

          if (suite.afterEach) {
            await suite.afterEach();
          }

          this.results.passed++;
          console.log(`  PASS: ${test.name}`);
        } catch (error) {
          this.results.failed++;
          this.results.errors.push({
            suite: suite.name,
            test: test.name,
            error: error.message,
            stack: error.stack
          });
          console.error(`  FAIL: ${test.name}`);
          console.error(`    ${error.message}`);
        }
      }
      console.log('');
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('='.repeat(50));
    console.log(`Tests: ${this.results.passed} passed, ${this.results.failed} failed`);
    console.log(`Total: ${this.results.passed + this.results.failed}`);

    if (this.results.errors.length > 0) {
      console.log('\nFailures:');
      for (const err of this.results.errors) {
        console.log(`  ${err.suite} > ${err.test}`);
        console.log(`    ${err.error}`);
      }
    }
    console.log('='.repeat(50));
  }
}

/**
 * Assertion helpers
 */
const assert = {
  equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },

  notEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(message || `Expected value to not equal ${expected}`);
    }
  },

  deepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
    }
  },

  ok(value, message = '') {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },

  notOk(value, message = '') {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${value}`);
    }
  },

  throws(fn, message = '') {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected function to throw');
    }
  },

  instanceOf(obj, type, message = '') {
    if (!(obj instanceof type)) {
      throw new Error(message || `Expected instance of ${type.name}`);
    }
  },

  isArray(value, message = '') {
    if (!Array.isArray(value)) {
      throw new Error(message || `Expected array, got ${typeof value}`);
    }
  },

  isFunction(value, message = '') {
    if (typeof value !== 'function') {
      throw new Error(message || `Expected function, got ${typeof value}`);
    }
  },

  isObject(value, message = '') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(message || `Expected object, got ${typeof value}`);
    }
  },

  isNull(value, message = '') {
    if (value !== null) {
      throw new Error(message || `Expected null, got ${value}`);
    }
  },

  isUndefined(value, message = '') {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, got ${value}`);
    }
  },

  isDefined(value, message = '') {
    if (value === undefined) {
      throw new Error(message || 'Expected value to be defined');
    }
  },

  closeTo(actual, expected, delta, message = '') {
    if (Math.abs(actual - expected) > delta) {
      throw new Error(message || `Expected ${actual} to be close to ${expected} (within ${delta})`);
    }
  },

  greaterThan(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  },

  lessThan(actual, expected, message = '') {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  },

  contains(array, value, message = '') {
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to contain ${value}`);
    }
  },

  hasProperty(obj, prop, message = '') {
    if (!(prop in obj)) {
      throw new Error(message || `Expected object to have property ${prop}`);
    }
  }
};

/**
 * Create mock THREE.js objects for testing without WebGL
 */
const mockThree = {
  createMockScene() {
    return {
      children: [],
      add(obj) {
        this.children.push(obj);
      },
      remove(obj) {
        const idx = this.children.indexOf(obj);
        if (idx >= 0) this.children.splice(idx, 1);
      }
    };
  },

  createMockSprite() {
    return {
      position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      scale: { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      material: {
        map: { dispose: () => {} },
        dispose: () => {},
        opacity: 1,
        needsUpdate: false
      },
      userData: {},
      renderOrder: 0,
      visible: true
    };
  },

  createMockVector3(x = 0, y = 0, z = 0) {
    return {
      x, y, z,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
      copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; },
      clone() { return mockThree.createMockVector3(this.x, this.y, this.z); },
      add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; },
      sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; },
      subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; },
      multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; },
      normalize() {
        const len = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
        if (len > 0) { this.x /= len; this.y /= len; this.z /= len; }
        return this;
      }
    };
  },

  createMockGeometry() {
    return {
      setFromPoints: () => {},
      computeBoundingSphere: () => {},
      dispose: () => {}
    };
  },

  createMockMaterial() {
    return {
      opacity: 1,
      dispose: () => {}
    };
  }
};

export { TestHarness, assert, mockThree };
