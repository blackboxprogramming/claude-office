/**
 * Connection renderer for visualizing parent-child session relationships
 * Draws red lines from parent head to child head with arrow pointing to child
 */

import * as THREE from 'three';

// Connection line style
const CONNECTION_COLOR = 0xff4444;  // Red color
const LINE_OPACITY = 0.5;  // 50% opacity
const ARROW_SIZE = 0.25;  // Size of the arrow head
const HEAD_OFFSET_Y = 1.6;  // Height above sprite position (above character's head)

export class ConnectionRenderer {
  constructor(scene) {
    this.scene = scene;
    this.connections = new Map();  // `${parentId}-${childId}` -> { line, arrow, materials, geometries }
    this.time = 0;
  }

  /**
   * Update connections based on current session relationships
   */
  updateConnections(sessions, characters) {
    const activeKeys = new Set();

    // Create or update connections for each parent-child relationship
    for (const session of sessions) {
      if (session.parentSessionId) {
        const parentCharacter = characters.get(session.parentSessionId);
        const childCharacter = characters.get(session.id);

        if (parentCharacter && childCharacter) {
          const key = `${session.parentSessionId}-${session.id}`;
          activeKeys.add(key);

          if (!this.connections.has(key)) {
            // Create new connection line with arrow
            this.createConnection(key, parentCharacter, childCharacter);
          } else {
            // Update existing connection line positions
            this.updateConnectionPosition(key, parentCharacter, childCharacter);
          }
        }
      }
    }

    // Remove stale connections
    for (const [key, connection] of this.connections) {
      if (!activeKeys.has(key)) {
        this.removeConnection(connection);
        this.connections.delete(key);
      }
    }
  }

  /**
   * Create a new connection line with arrow between parent and child
   */
  createConnection(key, parentCharacter, childCharacter) {
    const parentPos = this.getHeadPosition(parentCharacter);
    const childPos = this.getHeadPosition(childCharacter);

    // Create main line
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([parentPos, childPos]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: CONNECTION_COLOR,
      transparent: true,
      opacity: LINE_OPACITY,
      linewidth: 2
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.renderOrder = 15;  // Render above characters
    this.scene.add(line);

    // Create arrow head pointing to child
    const arrowGroup = this.createArrowHead(parentPos, childPos);
    this.scene.add(arrowGroup);

    this.connections.set(key, {
      line,
      arrow: arrowGroup,
      lineGeometry,
      lineMaterial
    });
  }

  /**
   * Create arrow head cone pointing toward child
   */
  createArrowHead(fromPos, toPos) {
    // Calculate direction from parent to child
    const direction = new THREE.Vector3().subVectors(toPos, fromPos).normalize();

    // Position arrow slightly before the child's head
    const arrowPos = new THREE.Vector3().copy(toPos).sub(direction.clone().multiplyScalar(0.3));

    // Create cone geometry for arrow
    const coneGeometry = new THREE.ConeGeometry(ARROW_SIZE * 0.5, ARROW_SIZE, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: CONNECTION_COLOR,
      transparent: true,
      opacity: LINE_OPACITY
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);

    // Orient cone to point along the direction
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    cone.position.copy(arrowPos);
    cone.renderOrder = 15;

    // Group to hold arrow components
    const group = new THREE.Group();
    group.add(cone);
    group.userData = { coneGeometry, coneMaterial };

    return group;
  }

  /**
   * Get the head position of a character (above their sprite)
   */
  getHeadPosition(character) {
    const pos = character.sprite.position;
    return new THREE.Vector3(pos.x, pos.y + HEAD_OFFSET_Y - 0.8, pos.z);
  }

  /**
   * Update the position of an existing connection line and arrow
   */
  updateConnectionPosition(key, parentCharacter, childCharacter) {
    const connection = this.connections.get(key);
    if (!connection) return;

    const parentPos = this.getHeadPosition(parentCharacter);
    const childPos = this.getHeadPosition(childCharacter);

    // Update line geometry
    connection.lineGeometry.setFromPoints([parentPos, childPos]);
    connection.lineGeometry.computeBoundingSphere();

    // Update arrow position and orientation
    const direction = new THREE.Vector3().subVectors(childPos, parentPos).normalize();
    const arrowPos = new THREE.Vector3().copy(childPos).sub(direction.clone().multiplyScalar(0.3));

    const cone = connection.arrow.children[0];
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    cone.position.copy(arrowPos);
  }

  /**
   * Remove a connection and clean up resources
   */
  removeConnection(connection) {
    this.scene.remove(connection.line);
    this.scene.remove(connection.arrow);

    connection.lineGeometry.dispose();
    connection.lineMaterial.dispose();

    const arrowData = connection.arrow.userData;
    if (arrowData.coneGeometry) arrowData.coneGeometry.dispose();
    if (arrowData.coneMaterial) arrowData.coneMaterial.dispose();
  }

  /**
   * Animate connection lines (subtle pulse effect)
   */
  update(deltaTime) {
    this.time += deltaTime * 1000;

    // Subtle opacity pulse
    const opacity = LINE_OPACITY + Math.sin(this.time * 0.002) * 0.1;

    for (const connection of this.connections.values()) {
      connection.lineMaterial.opacity = opacity;
      const cone = connection.arrow.children[0];
      if (cone && cone.material) {
        cone.material.opacity = opacity;
      }
    }
  }

  /**
   * Clean up all connections
   */
  dispose() {
    for (const connection of this.connections.values()) {
      this.removeConnection(connection);
    }
    this.connections.clear();
  }
}
