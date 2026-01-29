/**
 * Character sprite and animation system
 * High-detail pixel art with unique character designs
 */

import * as THREE from 'three';
import { DOOR_POSITION } from './office.js';

// Animation frame timing (ms)
const FRAME_DURATION = 200;
const ZZZ_SPAWN_INTERVAL = 800;
const SWEAT_SPAWN_INTERVAL = 600;
const MONITOR_FRAME_DURATION = 150;
const CHAT_BUBBLE_SPAWN_INTERVAL = 1200;

// Canvas size for high-detail pixel art (doubled from 48x64)
const CHAR_WIDTH = 96;
const CHAR_HEIGHT = 128;

// Character states
export const CharacterState = {
  WORKING: 'working',
  SLEEPING: 'sleeping',
  WALKING: 'walking',
  EXITING: 'exiting',
  SOCIALIZING: 'socializing',
  DRINKING_DESK: 'drinking_desk',
  DRINKING_TOAST: 'drinking_toast',
  DRINKING_KITCHEN: 'drinking_kitchen'
};

// Skin tone palettes (base, shadow, highlight, deep shadow)
const SKIN_TONES = [
  { base: '#ffcc99', shadow: '#e6b366', highlight: '#ffe6cc', deep: '#cc9966' },
  { base: '#f5d0a9', shadow: '#d4a574', highlight: '#fce5c9', deep: '#b8956a' },
  { base: '#c68642', shadow: '#8d5524', highlight: '#e0a060', deep: '#6b3d1a' },
  { base: '#8d5524', shadow: '#5c3310', highlight: '#a86b3d', deep: '#3d220a' },
  { base: '#4a3728', shadow: '#2d1f16', highlight: '#6b5344', deep: '#1a100a' },
];

// Hair styles and colors
const HAIR_STYLES = ['short', 'long', 'ponytail', 'curly', 'bald', 'mohawk', 'bob', 'spiky'];
const HAIR_COLORS = [
  { base: '#2a1a0a', shadow: '#1a0f05', highlight: '#4a3020', deep: '#0d0805' },
  { base: '#8b4513', shadow: '#5c2d0e', highlight: '#a0522d', deep: '#3d1f0a' },
  { base: '#daa520', shadow: '#b8860b', highlight: '#ffd700', deep: '#8b6914' },
  { base: '#b22222', shadow: '#8b0000', highlight: '#dc143c', deep: '#5c1111' },
  { base: '#708090', shadow: '#4a5568', highlight: '#a0aec0', deep: '#2d3748' },
  { base: '#4169e1', shadow: '#2d4ea0', highlight: '#6b8cff', deep: '#1a2d5c' },
  { base: '#9932cc', shadow: '#6b238e', highlight: '#ba55d3', deep: '#4a1a6b' },
  { base: '#ff69b4', shadow: '#db7093', highlight: '#ffb6c1', deep: '#c44d87' },
];

// Clothing styles with colors
const CLOTHING_STYLES = [
  { type: 'hoodie', colors: { base: '#4a5568', shadow: '#2d3748', highlight: '#718096', deep: '#1a202c' } },
  { type: 'suit', colors: { base: '#1a202c', shadow: '#0d1117', highlight: '#2d3748', deep: '#000000' } },
  { type: 'tshirt', colors: { base: '#e53e3e', shadow: '#c53030', highlight: '#fc8181', deep: '#9b2c2c' } },
  { type: 'tshirt', colors: { base: '#3182ce', shadow: '#2c5282', highlight: '#63b3ed', deep: '#1a365d' } },
  { type: 'tshirt', colors: { base: '#38a169', shadow: '#276749', highlight: '#68d391', deep: '#1c4532' } },
  { type: 'sweater', colors: { base: '#805ad5', shadow: '#553c9a', highlight: '#b794f4', deep: '#322659' } },
  { type: 'dress', colors: { base: '#d53f8c', shadow: '#97266d', highlight: '#ed64a6', deep: '#702459' } },
  { type: 'sweater', colors: { base: '#dd6b20', shadow: '#c05621', highlight: '#ed8936', deep: '#7b341e' } },
  { type: 'jacket', colors: { base: '#2d3748', shadow: '#1a202c', highlight: '#4a5568', deep: '#0d1117' } },
  { type: 'polo', colors: { base: '#2f855a', shadow: '#276749', highlight: '#48bb78', deep: '#1c4532' } },
];

// Accessories
const ACCESSORIES = ['none', 'glasses', 'headphones', 'beard', 'earrings', 'hat', 'bandana', 'scarf'];

// Pre-defined unique character profiles
const CHARACTER_PROFILES = [
  { skinTone: 0, hairStyle: 'short', hairColor: 0, clothing: 0, accessory: 'headphones' },
  { skinTone: 2, hairStyle: 'long', hairColor: 1, clothing: 6, accessory: 'earrings' },
  { skinTone: 1, hairStyle: 'curly', hairColor: 3, clothing: 3, accessory: 'glasses' },
  { skinTone: 3, hairStyle: 'ponytail', hairColor: 0, clothing: 4, accessory: 'none' },
  { skinTone: 4, hairStyle: 'bald', hairColor: 0, clothing: 1, accessory: 'beard' },
  { skinTone: 0, hairStyle: 'mohawk', hairColor: 5, clothing: 2, accessory: 'none' },
  { skinTone: 2, hairStyle: 'bob', hairColor: 4, clothing: 5, accessory: 'glasses' },
  { skinTone: 1, hairStyle: 'spiky', hairColor: 6, clothing: 7, accessory: 'headphones' },
  { skinTone: 3, hairStyle: 'short', hairColor: 7, clothing: 8, accessory: 'scarf' },
  { skinTone: 4, hairStyle: 'curly', hairColor: 2, clothing: 9, accessory: 'bandana' },
];

// Character names - one for each profile
const CHARACTER_NAMES = [
  'Alex',
  'Jordan',
  'Morgan',
  'Riley',
  'Casey',
  'Quinn',
  'Taylor',
  'Avery',
  'Sage',
  'River',
];

// Extended names pool for additional characters
const EXTRA_NAMES = [
  'Phoenix', 'Blake', 'Cameron', 'Drew', 'Emery',
  'Finley', 'Gray', 'Harper', 'Indigo', 'Jules',
  'Kai', 'Logan', 'Marley', 'Nova', 'Oakley',
  'Parker', 'Reese', 'Skyler', 'Tatum', 'Wren'
];

/**
 * Get character name by index
 */
function getCharacterName(index) {
  if (index < CHARACTER_NAMES.length) {
    return CHARACTER_NAMES[index];
  }
  // For additional characters, use from extended pool
  const extraIndex = (index - CHARACTER_NAMES.length) % EXTRA_NAMES.length;
  return EXTRA_NAMES[extraIndex];
}

// Cache for dynamically generated character profiles (for indices beyond predefined profiles)
const generatedProfiles = new Map();

/**
 * Get or generate a character profile
 */
function getCharacterProfile(index) {
  if (index < CHARACTER_PROFILES.length) {
    return CHARACTER_PROFILES[index];
  }

  // Check cache for previously generated profile
  if (generatedProfiles.has(index)) {
    return generatedProfiles.get(index);
  }

  // Generate and cache new profile
  const profile = {
    skinTone: Math.floor(Math.random() * SKIN_TONES.length),
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
    clothing: Math.floor(Math.random() * CLOTHING_STYLES.length),
    accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
  };
  generatedProfiles.set(index, profile);
  return profile;
}

/**
 * Draw a shaded rectangle with 4-color depth
 */
function drawShadedRect(ctx, x, y, w, h, colors, borderWidth = 2) {
  // Deep shadow (outer edge)
  ctx.fillStyle = colors.deep || colors.shadow;
  ctx.fillRect(x, y, w, h);

  // Main fill
  ctx.fillStyle = colors.base;
  ctx.fillRect(x + borderWidth, y + borderWidth, w - borderWidth * 2, h - borderWidth * 2);

  // Highlight (top and left inner edges)
  ctx.fillStyle = colors.highlight;
  ctx.fillRect(x + borderWidth, y + borderWidth, w - borderWidth * 3, borderWidth);
  ctx.fillRect(x + borderWidth, y + borderWidth, borderWidth, h - borderWidth * 3);

  // Shadow (bottom and right inner edges)
  ctx.fillStyle = colors.shadow;
  ctx.fillRect(x + borderWidth, y + h - borderWidth * 2, w - borderWidth * 2, borderWidth);
  ctx.fillRect(x + w - borderWidth * 2, y + borderWidth, borderWidth, h - borderWidth * 2);
}

/**
 * Draw detailed hair based on style
 */
function drawHair(ctx, profile, headY, frame, state) {
  const hairColors = HAIR_COLORS[profile.hairColor];
  const headBob = (state === CharacterState.WORKING && frame % 2 === 1) ? -2 : 0;
  const y = headY + headBob;

  ctx.fillStyle = hairColors.base;

  switch (profile.hairStyle) {
    case 'short':
      // Short neat hair with texture
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(26, y - 6, 44, 20);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(28, y - 4, 40, 16);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(32, y - 2, 12, 6);
      ctx.fillRect(50, y, 8, 4);
      // Hair strands
      ctx.fillStyle = hairColors.shadow;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(30 + i * 8, y + 8, 2, 4);
      }
      break;

    case 'long':
      // Long flowing hair with waves
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(22, y - 6, 52, 24);
      ctx.fillRect(18, y + 14, 12, 44);
      ctx.fillRect(66, y + 14, 12, 44);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(24, y - 4, 48, 20);
      ctx.fillRect(20, y + 16, 10, 40);
      ctx.fillRect(66, y + 16, 10, 40);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(28, y - 2, 16, 8);
      ctx.fillRect(22, y + 20, 4, 12);
      ctx.fillRect(70, y + 20, 4, 12);
      // Wave details
      ctx.fillStyle = hairColors.shadow;
      ctx.fillRect(20, y + 32, 8, 4);
      ctx.fillRect(68, y + 36, 8, 4);
      break;

    case 'ponytail':
      // Hair with detailed ponytail
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(26, y - 6, 44, 18);
      ctx.fillRect(62, y + 4, 18, 14);
      ctx.fillRect(70, y + 14, 14, 32);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(28, y - 4, 40, 14);
      ctx.fillRect(64, y + 6, 14, 10);
      ctx.fillRect(72, y + 16, 10, 28);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(32, y - 2, 12, 6);
      ctx.fillRect(74, y + 20, 4, 8);
      // Hair tie
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(66, y + 14, 8, 6);
      ctx.fillStyle = '#c53030';
      ctx.fillRect(68, y + 16, 4, 2);
      break;

    case 'curly':
      // Curly/afro style with volume
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(16, y - 10, 64, 32);
      ctx.fillRect(12, y - 2, 8, 24);
      ctx.fillRect(76, y - 2, 8, 24);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(18, y - 8, 60, 28);
      ctx.fillRect(14, y, 6, 20);
      ctx.fillRect(76, y, 6, 20);
      // Curl highlights
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(24, y - 6, 8, 8);
      ctx.fillRect(40, y - 8, 8, 8);
      ctx.fillRect(56, y - 6, 8, 8);
      ctx.fillRect(16, y + 4, 6, 6);
      ctx.fillRect(74, y + 4, 6, 6);
      break;

    case 'bald':
      // Shiny bald head
      ctx.fillStyle = SKIN_TONES[profile.skinTone].highlight;
      ctx.fillRect(36, y - 2, 16, 8);
      ctx.fillRect(42, y + 2, 8, 4);
      break;

    case 'mohawk':
      // Dramatic mohawk
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(38, y - 20, 20, 28);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(40, y - 18, 16, 24);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(44, y - 16, 8, 10);
      // Side shaved areas
      ctx.fillStyle = hairColors.shadow;
      ctx.fillRect(26, y + 4, 12, 8);
      ctx.fillRect(58, y + 4, 12, 8);
      break;

    case 'bob':
      // Bob cut
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(22, y - 6, 52, 22);
      ctx.fillRect(20, y + 12, 14, 20);
      ctx.fillRect(62, y + 12, 14, 20);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(24, y - 4, 48, 18);
      ctx.fillRect(22, y + 14, 12, 16);
      ctx.fillRect(62, y + 14, 12, 16);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(28, y - 2, 14, 6);
      // Curved ends
      ctx.fillStyle = hairColors.shadow;
      ctx.fillRect(22, y + 26, 10, 4);
      ctx.fillRect(64, y + 26, 10, 4);
      break;

    case 'spiky':
      // Spiky anime-style hair
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(26, y - 4, 44, 16);
      // Spikes
      ctx.fillRect(24, y - 14, 8, 14);
      ctx.fillRect(36, y - 18, 8, 18);
      ctx.fillRect(48, y - 16, 8, 16);
      ctx.fillRect(60, y - 12, 8, 12);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(26, y - 12, 6, 12);
      ctx.fillRect(38, y - 16, 6, 16);
      ctx.fillRect(50, y - 14, 6, 14);
      ctx.fillRect(62, y - 10, 6, 10);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(28, y - 10, 2, 4);
      ctx.fillRect(40, y - 14, 2, 4);
      ctx.fillRect(52, y - 12, 2, 4);
      break;
  }
}

/**
 * Draw detailed clothing based on style
 */
function drawClothing(ctx, profile, bodyY, frame, state) {
  const style = CLOTHING_STYLES[profile.clothing];
  const colors = style.colors;

  switch (style.type) {
    case 'hoodie':
      drawShadedRect(ctx, 22, bodyY, 52, 48, colors, 3);
      // Hood detail at neck
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(34, bodyY + 2, 28, 10);
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(36, bodyY + 4, 8, 4);
      // Hood strings
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(36, bodyY + 6, 4, 18);
      ctx.fillRect(56, bodyY + 6, 4, 18);
      // String ends
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, bodyY + 22, 4, 4);
      ctx.fillRect(56, bodyY + 22, 4, 4);
      // Front pocket
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(30, bodyY + 30, 36, 14);
      ctx.fillStyle = colors.deep;
      ctx.fillRect(32, bodyY + 32, 32, 2);
      break;

    case 'suit':
      drawShadedRect(ctx, 22, bodyY, 52, 48, colors, 3);
      // Lapels
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(26, bodyY + 2, 10, 26);
      ctx.fillRect(60, bodyY + 2, 10, 26);
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(28, bodyY + 4, 6, 22);
      ctx.fillRect(62, bodyY + 4, 6, 22);
      // Shirt and tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(38, bodyY, 20, 10);
      ctx.fillStyle = '#c53030';
      ctx.fillRect(44, bodyY + 4, 8, 36);
      ctx.fillStyle = '#9b2c2c';
      ctx.fillRect(46, bodyY + 6, 4, 32);
      // Tie knot
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(42, bodyY + 4, 12, 8);
      // Buttons
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(36, bodyY + 32, 4, 4);
      ctx.fillRect(56, bodyY + 32, 4, 4);
      break;

    case 'tshirt':
      drawShadedRect(ctx, 22, bodyY, 52, 44, colors, 3);
      // Collar
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(34, bodyY, 28, 8);
      ctx.fillStyle = colors.deep;
      ctx.fillRect(38, bodyY + 2, 20, 4);
      // Sleeve hems
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(22, bodyY + 36, 10, 4);
      ctx.fillRect(64, bodyY + 36, 10, 4);
      // Wrinkle details
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(40, bodyY + 20, 2, 8);
      ctx.fillRect(54, bodyY + 24, 2, 6);
      break;

    case 'sweater':
      drawShadedRect(ctx, 22, bodyY, 52, 48, colors, 3);
      // Ribbed collar
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(32, bodyY, 32, 10);
      ctx.fillStyle = colors.shadow;
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(34 + i * 4, bodyY + 2, 2, 6);
      }
      // Knit pattern
      ctx.fillStyle = colors.shadow;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
          const offset = row % 2 === 0 ? 0 : 4;
          ctx.fillRect(26 + col * 8 + offset, bodyY + 14 + row * 10, 6, 4);
        }
      }
      // Ribbed bottom
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(22, bodyY + 42, 52, 6);
      break;

    case 'dress':
      drawShadedRect(ctx, 22, bodyY, 52, 40, colors, 3);
      // V-neckline
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(36, bodyY, 24, 8);
      ctx.fillStyle = SKIN_TONES[profile.skinTone].base;
      ctx.fillRect(40, bodyY + 2, 16, 6);
      // Flared skirt
      ctx.fillStyle = colors.base;
      ctx.fillRect(18, bodyY + 36, 60, 20);
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(18, bodyY + 52, 60, 4);
      // Skirt pleats
      ctx.fillStyle = colors.deep;
      ctx.fillRect(28, bodyY + 38, 3, 16);
      ctx.fillRect(44, bodyY + 38, 3, 16);
      ctx.fillRect(60, bodyY + 38, 3, 16);
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(36, bodyY + 38, 3, 14);
      ctx.fillRect(52, bodyY + 38, 3, 14);
      break;

    case 'jacket':
      drawShadedRect(ctx, 22, bodyY, 52, 48, colors, 3);
      // Zipper
      ctx.fillStyle = '#a0aec0';
      ctx.fillRect(46, bodyY + 4, 4, 40);
      ctx.fillStyle = '#718096';
      ctx.fillRect(47, bodyY + 6, 2, 36);
      // Zipper pull
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(44, bodyY + 12, 8, 6);
      // Pockets
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(26, bodyY + 28, 16, 12);
      ctx.fillRect(54, bodyY + 28, 16, 12);
      // Collar
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(26, bodyY, 12, 12);
      ctx.fillRect(58, bodyY, 12, 12);
      break;

    case 'polo':
      drawShadedRect(ctx, 22, bodyY, 52, 44, colors, 3);
      // Collar
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(30, bodyY - 2, 36, 12);
      ctx.fillStyle = colors.base;
      ctx.fillRect(32, bodyY, 32, 8);
      // Button placket
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(44, bodyY + 8, 8, 20);
      // Buttons
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(46, bodyY + 12, 4, 4);
      ctx.fillRect(46, bodyY + 20, 4, 4);
      break;
  }
}

/**
 * Draw detailed accessories
 */
function drawAccessory(ctx, profile, headY, frame, state) {
  const headBob = (state === CharacterState.WORKING && frame % 2 === 1) ? -2 : 0;
  const y = headY + headBob;

  switch (profile.accessory) {
    case 'glasses':
      // Detailed rectangle glasses
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(26, y + 16, 22, 14);
      ctx.fillRect(52, y + 16, 22, 14);
      ctx.fillRect(48, y + 20, 4, 4);
      // Temples
      ctx.fillRect(22, y + 20, 6, 4);
      ctx.fillRect(72, y + 20, 6, 4);
      // Lens
      ctx.fillStyle = 'rgba(160, 216, 239, 0.5)';
      ctx.fillRect(28, y + 18, 18, 10);
      ctx.fillRect(54, y + 18, 18, 10);
      // Lens shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(30, y + 19, 6, 4);
      ctx.fillRect(56, y + 19, 6, 4);
      break;

    case 'headphones':
      // Over-ear headphones with detail
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(14, y + 8, 14, 28);
      ctx.fillRect(68, y + 8, 14, 28);
      // Headband
      ctx.fillRect(22, y - 10, 52, 10);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(24, y - 8, 48, 6);
      // Cushions
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(16, y + 12, 10, 20);
      ctx.fillRect(70, y + 12, 10, 20);
      // Inner cushion
      ctx.fillStyle = '#718096';
      ctx.fillRect(18, y + 14, 6, 16);
      ctx.fillRect(72, y + 14, 6, 16);
      // Logo/detail
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(18, y + 20, 4, 4);
      ctx.fillRect(74, y + 20, 4, 4);
      break;

    case 'beard':
      // Full detailed beard
      const hairColors = HAIR_COLORS[profile.hairColor];
      ctx.fillStyle = hairColors.deep;
      ctx.fillRect(30, y + 32, 36, 20);
      ctx.fillRect(26, y + 28, 8, 16);
      ctx.fillRect(62, y + 28, 8, 16);
      ctx.fillStyle = hairColors.base;
      ctx.fillRect(32, y + 34, 32, 16);
      ctx.fillRect(28, y + 30, 6, 12);
      ctx.fillRect(62, y + 30, 6, 12);
      ctx.fillStyle = hairColors.highlight;
      ctx.fillRect(36, y + 36, 8, 6);
      ctx.fillRect(52, y + 36, 8, 6);
      // Mustache
      ctx.fillStyle = hairColors.shadow;
      ctx.fillRect(36, y + 30, 24, 6);
      break;

    case 'earrings':
      // Detailed hoop earrings
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(18, y + 28, 6, 10);
      ctx.fillRect(72, y + 28, 6, 10);
      ctx.fillStyle = '#ffed4a';
      ctx.fillRect(20, y + 30, 2, 6);
      ctx.fillRect(74, y + 30, 2, 6);
      // Inner hoop
      ctx.fillStyle = SKIN_TONES[profile.skinTone].base;
      ctx.fillRect(20, y + 32, 2, 4);
      ctx.fillRect(74, y + 32, 2, 4);
      break;

    case 'hat':
      // Detailed beanie
      ctx.fillStyle = '#c53030';
      ctx.fillRect(22, y - 14, 52, 24);
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(24, y - 12, 48, 20);
      // Ribbing
      ctx.fillStyle = '#9b2c2c';
      ctx.fillRect(22, y + 6, 52, 8);
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(24 + i * 5, y + 8, 2, 4);
      }
      // Pom pom
      ctx.fillStyle = '#fc8181';
      ctx.fillRect(38, y - 24, 20, 14);
      ctx.fillStyle = '#feb2b2';
      ctx.fillRect(42, y - 22, 8, 6);
      break;

    case 'bandana':
      // Bandana headband
      ctx.fillStyle = '#2c5282';
      ctx.fillRect(24, y + 2, 48, 10);
      ctx.fillStyle = '#3182ce';
      ctx.fillRect(26, y + 4, 44, 6);
      // Knot at back
      ctx.fillRect(68, y + 4, 12, 8);
      ctx.fillRect(74, y + 8, 8, 12);
      // Pattern
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(32, y + 6, 4, 2);
      ctx.fillRect(44, y + 6, 4, 2);
      ctx.fillRect(56, y + 6, 4, 2);
      break;

    case 'scarf':
      // Winter scarf
      ctx.fillStyle = '#9b2c2c';
      ctx.fillRect(26, y + 36, 44, 14);
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(28, y + 38, 40, 10);
      // Scarf end hanging
      ctx.fillRect(60, y + 48, 12, 24);
      ctx.fillStyle = '#c53030';
      ctx.fillRect(62, y + 50, 8, 20);
      // Stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, y + 42, 40, 2);
      ctx.fillRect(62, y + 58, 8, 2);
      ctx.fillRect(62, y + 66, 8, 2);
      break;
  }
}

/**
 * Create a detailed character sprite frame
 */
function createCharacterFrame(profileIndex, frame, state) {
  const profile = getCharacterProfile(profileIndex);
  const skinColors = SKIN_TONES[profile.skinTone];

  const canvas = document.createElement('canvas');
  canvas.width = CHAR_WIDTH;
  canvas.height = CHAR_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (state === CharacterState.SLEEPING) {
    drawSleepingCharacter(ctx, profile, frame);
  } else if (state === CharacterState.SOCIALIZING) {
    drawSocializingCharacter(ctx, profile, frame);
  } else if (state === CharacterState.DRINKING_DESK) {
    drawDrinkingDeskCharacter(ctx, profile, frame);
  } else if (state === CharacterState.DRINKING_TOAST) {
    drawDrinkingToastCharacter(ctx, profile, frame);
  } else if (state === CharacterState.DRINKING_KITCHEN) {
    drawDrinkingKitchenCharacter(ctx, profile, frame);
  } else {
    drawStandingCharacter(ctx, profile, frame, state);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Draw detailed sleeping character
 */
function drawSleepingCharacter(ctx, profile, frame) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const clothingStyle = CLOTHING_STYLES[profile.clothing];
  const breathOffset = frame % 2 === 0 ? 0 : 2;

  // Body hunched over
  drawShadedRect(ctx, 26, 56 + breathOffset, 44, 36, clothingStyle.colors, 3);

  // Arms as pillow
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(10, 44, 76, 16);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(14, 46, 24, 6);
  ctx.fillRect(58, 46, 20, 6);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(10, 56, 76, 4);

  // Head resting with detail
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(30, 18 + breathOffset, 36, 30);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(34, 20 + breathOffset, 14, 10);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(30, 44 + breathOffset, 36, 4);

  // Hair (simplified for sleeping)
  const hairColors = HAIR_COLORS[profile.hairColor];
  if (profile.hairStyle !== 'bald') {
    ctx.fillStyle = hairColors.deep;
    ctx.fillRect(30, 10 + breathOffset, 36, 14);
    ctx.fillStyle = hairColors.base;
    ctx.fillRect(32, 12 + breathOffset, 32, 10);
    ctx.fillStyle = hairColors.highlight;
    ctx.fillRect(36, 14 + breathOffset, 10, 6);
  }

  // Closed eyes (cute sleeping expression)
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(36, 32 + breathOffset, 8, 3);
  ctx.fillRect(52, 32 + breathOffset, 8, 3);
  // Eyelashes
  ctx.fillRect(34, 31 + breathOffset, 2, 2);
  ctx.fillRect(44, 31 + breathOffset, 2, 2);
  ctx.fillRect(50, 31 + breathOffset, 2, 2);
  ctx.fillRect(60, 31 + breathOffset, 2, 2);

  // Slight blush
  ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
  ctx.fillRect(34, 36 + breathOffset, 8, 4);
  ctx.fillRect(54, 36 + breathOffset, 8, 4);

  // Legs
  ctx.fillStyle = '#3d4852';
  ctx.fillRect(30, 92, 14, 32);
  ctx.fillRect(52, 92, 14, 32);
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(30, 118, 14, 4);
  ctx.fillRect(52, 118, 14, 4);

  // Shoes
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(26, 118, 22, 10);
  ctx.fillRect(48, 118, 22, 10);
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(28, 122, 8, 4);
  ctx.fillRect(50, 122, 8, 4);
}

/**
 * Draw detailed standing/walking/working character
 */
function drawStandingCharacter(ctx, profile, frame, state) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const headBob = (state === CharacterState.WORKING && frame % 2 === 1) ? -2 : 0;
  const armOffset = (state === CharacterState.WORKING && frame % 2 === 1) ? 4 : 0;

  const headY = 6;
  const bodyY = 48;

  // Draw hair first (behind head for some styles)
  if (['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, state);
  }

  // Detailed head with shading
  ctx.fillStyle = skinColors.deep;
  ctx.fillRect(26, headY + headBob, 44, 40);
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(28, headY + 2 + headBob, 40, 36);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(32, headY + 4 + headBob, 18, 14);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(28, headY + 34 + headBob, 40, 4);

  // Draw hair on top (for styles that go over)
  if (!['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, state);
  }

  // Detailed eyes with animation
  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(32, headY + 16 + headBob, 12, 10);
  ctx.fillRect(52, headY + 16 + headBob, 12, 10);
  // Iris
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(36, headY + 18 + headBob, 8, 8);
  ctx.fillRect(56, headY + 18 + headBob, 8, 8);
  // Pupil
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(38, headY + 20 + headBob, 4, 4);
  ctx.fillRect(58, headY + 20 + headBob, 4, 4);
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(38, headY + 19 + headBob, 2, 2);
  ctx.fillRect(58, headY + 19 + headBob, 2, 2);
  // Lower eyelid shadow
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(32, headY + 24 + headBob, 12, 2);
  ctx.fillRect(52, headY + 24 + headBob, 12, 2);

  // Eyebrows with expression
  ctx.fillStyle = HAIR_COLORS[profile.hairColor].shadow;
  ctx.fillRect(32, headY + 12 + headBob, 12, 4);
  ctx.fillRect(52, headY + 12 + headBob, 12, 4);

  // Nose with detail
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(44, headY + 24 + headBob, 8, 8);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(44, headY + 24 + headBob, 4, 4);

  // Mouth
  ctx.fillStyle = '#c53030';
  ctx.fillRect(40, headY + 34 + headBob, 16, 4);
  ctx.fillStyle = '#9b2c2c';
  ctx.fillRect(42, headY + 36 + headBob, 12, 2);

  // Ears with detail
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(22, headY + 20 + headBob, 8, 12);
  ctx.fillRect(66, headY + 20 + headBob, 8, 12);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(24, headY + 22 + headBob, 4, 8);
  ctx.fillRect(68, headY + 22 + headBob, 4, 8);

  // Draw clothing
  drawClothing(ctx, profile, bodyY, frame, state);

  // Arms with detail
  ctx.fillStyle = skinColors.base;
  if (state === CharacterState.WORKING) {
    // Arms forward typing
    ctx.fillRect(10, bodyY + 8, 16, 14);
    ctx.fillRect(70, bodyY + 8, 16, 14);
    // Hands
    ctx.fillStyle = skinColors.base;
    ctx.fillRect(6 + armOffset, bodyY + 18, 14, 14);
    ctx.fillRect(74 - armOffset, bodyY + 18, 14, 14);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(8 + armOffset, bodyY + 20, 6, 6);
    ctx.fillRect(76 - armOffset, bodyY + 20, 6, 6);
    // Fingers
    ctx.fillStyle = skinColors.shadow;
    ctx.fillRect(8 + armOffset, bodyY + 28, 3, 4);
    ctx.fillRect(13 + armOffset, bodyY + 28, 3, 4);
    ctx.fillRect(78 - armOffset, bodyY + 28, 3, 4);
    ctx.fillRect(83 - armOffset, bodyY + 28, 3, 4);
  } else {
    // Arms at sides
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillRect(72, bodyY + 4, 14, 32);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(12, bodyY + 6, 6, 10);
    ctx.fillRect(74, bodyY + 6, 6, 10);
    ctx.fillStyle = skinColors.shadow;
    ctx.fillRect(10, bodyY + 30, 14, 6);
    ctx.fillRect(72, bodyY + 30, 14, 6);
  }

  // Detailed legs with pants
  ctx.fillStyle = '#3d4852';
  if (state === CharacterState.WALKING || state === CharacterState.EXITING) {
    const legOffset = frame % 2 === 0 ? 6 : -6;
    ctx.fillRect(30 + legOffset, 92, 16, 30);
    ctx.fillRect(50 - legOffset, 92, 16, 30);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(30 + legOffset, 116, 16, 4);
    ctx.fillRect(50 - legOffset, 116, 16, 4);
    // Knee detail
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(32 + legOffset, 100, 12, 4);
    ctx.fillRect(52 - legOffset, 100, 12, 4);
  } else {
    ctx.fillRect(30, 92, 16, 30);
    ctx.fillRect(50, 92, 16, 30);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(30, 116, 16, 4);
    ctx.fillRect(50, 116, 16, 4);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(32, 100, 12, 4);
    ctx.fillRect(52, 100, 12, 4);
  }

  // Detailed shoes
  ctx.fillStyle = '#1a202c';
  if (state === CharacterState.WALKING || state === CharacterState.EXITING) {
    const legOffset = frame % 2 === 0 ? 6 : -6;
    ctx.fillRect(26 + legOffset, 118, 24, 10);
    ctx.fillRect(46 - legOffset, 118, 24, 10);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(28 + legOffset, 122, 10, 4);
    ctx.fillRect(48 - legOffset, 122, 10, 4);
    // Shoe laces
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32 + legOffset, 120, 4, 2);
    ctx.fillRect(52 - legOffset, 120, 4, 2);
  } else {
    ctx.fillRect(26, 118, 24, 10);
    ctx.fillRect(46, 118, 24, 10);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(28, 122, 10, 4);
    ctx.fillRect(48, 122, 10, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, 120, 4, 2);
    ctx.fillRect(52, 120, 4, 2);
  }

  // Draw accessories last (on top)
  drawAccessory(ctx, profile, headY, frame, state);
}

/**
 * Draw socializing character (standing, occasional arm gestures)
 */
function drawSocializingCharacter(ctx, profile, frame) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const gestureFrame = frame % 4;  // 4 frames of animation

  const headY = 6;
  const bodyY = 48;

  // Draw hair first (behind head for some styles)
  if (['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
  }

  // Detailed head with shading
  ctx.fillStyle = skinColors.deep;
  ctx.fillRect(26, headY, 44, 40);
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(28, headY + 2, 40, 36);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(32, headY + 4, 18, 14);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(28, headY + 34, 40, 4);

  // Draw hair on top (for styles that go over)
  if (!['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
  }

  // Eyes with happy expression
  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(32, headY + 16, 12, 10);
  ctx.fillRect(52, headY + 16, 12, 10);
  // Iris
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(36, headY + 18, 8, 8);
  ctx.fillRect(56, headY + 18, 8, 8);
  // Pupil
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(38, headY + 20, 4, 4);
  ctx.fillRect(58, headY + 20, 4, 4);
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(38, headY + 19, 2, 2);
  ctx.fillRect(58, headY + 19, 2, 2);

  // Happy eyebrows (slightly raised)
  ctx.fillStyle = HAIR_COLORS[profile.hairColor].shadow;
  ctx.fillRect(32, headY + 11, 12, 3);
  ctx.fillRect(52, headY + 11, 12, 3);

  // Nose
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(44, headY + 24, 8, 8);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(44, headY + 24, 4, 4);

  // Happy mouth (smile)
  ctx.fillStyle = '#c53030';
  ctx.fillRect(38, headY + 34, 20, 4);
  ctx.fillStyle = '#9b2c2c';
  ctx.fillRect(40, headY + 36, 16, 2);
  // Smile curve (teeth showing slightly)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(42, headY + 34, 12, 2);

  // Ears
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(22, headY + 20, 8, 12);
  ctx.fillRect(66, headY + 20, 8, 12);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(24, headY + 22, 4, 8);
  ctx.fillRect(68, headY + 22, 4, 8);

  // Draw clothing
  drawClothing(ctx, profile, bodyY, frame, CharacterState.SOCIALIZING);

  // Arms with gesture animation
  ctx.fillStyle = skinColors.base;
  if (gestureFrame === 1) {
    // Left arm raised, right at side
    ctx.fillRect(10, bodyY - 4, 14, 28);
    ctx.fillRect(72, bodyY + 4, 14, 32);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(12, bodyY - 2, 6, 10);
    ctx.fillRect(74, bodyY + 6, 6, 10);
    // Hands
    ctx.fillStyle = skinColors.base;
    ctx.fillRect(8, bodyY + 20, 12, 12);
    ctx.fillRect(74, bodyY + 30, 12, 12);
  } else if (gestureFrame === 3) {
    // Right arm raised, left at side
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillRect(72, bodyY - 4, 14, 28);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(12, bodyY + 6, 6, 10);
    ctx.fillRect(74, bodyY - 2, 6, 10);
    // Hands
    ctx.fillStyle = skinColors.base;
    ctx.fillRect(10, bodyY + 30, 12, 12);
    ctx.fillRect(76, bodyY + 20, 12, 12);
  } else {
    // Both arms at sides (relaxed)
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillRect(72, bodyY + 4, 14, 32);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(12, bodyY + 6, 6, 10);
    ctx.fillRect(74, bodyY + 6, 6, 10);
    ctx.fillStyle = skinColors.shadow;
    ctx.fillRect(10, bodyY + 30, 14, 6);
    ctx.fillRect(72, bodyY + 30, 14, 6);
  }

  // Legs (standing)
  ctx.fillStyle = '#3d4852';
  ctx.fillRect(30, 92, 16, 30);
  ctx.fillRect(50, 92, 16, 30);
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(30, 116, 16, 4);
  ctx.fillRect(50, 116, 16, 4);
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(32, 100, 12, 4);
  ctx.fillRect(52, 100, 12, 4);

  // Shoes
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(26, 118, 24, 10);
  ctx.fillRect(46, 118, 24, 10);
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(28, 122, 10, 4);
  ctx.fillRect(48, 122, 10, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(32, 120, 4, 2);
  ctx.fillRect(52, 120, 4, 2);

  // Draw accessories last
  drawAccessory(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
}

/**
 * Draw character taking a shot at desk (mild cliche)
 * 4 frames: reach under desk, pull bottle up, tilt head back + drink, set down
 */
function drawDrinkingDeskCharacter(ctx, profile, frame) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const clothingStyle = CLOTHING_STYLES[profile.clothing];
  const drinkFrame = frame % 4;
  const headY = 6;
  const bodyY = 48;

  // Draw hair behind
  if (['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.WORKING);
  }

  // Head with tilt on frame 2
  const headTilt = drinkFrame === 2 ? -4 : 0;
  ctx.fillStyle = skinColors.deep;
  ctx.fillRect(26, headY + headTilt, 44, 40);
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(28, headY + 2 + headTilt, 40, 36);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(32, headY + 4 + headTilt, 18, 14);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(28, headY + 34 + headTilt, 40, 4);

  // Hair on top
  if (!['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY + headTilt, frame, CharacterState.WORKING);
  }

  // Eyes - squinting on frame 2 (drinking)
  if (drinkFrame === 2) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(34, headY + 20 + headTilt, 10, 3);
    ctx.fillRect(54, headY + 20 + headTilt, 10, 3);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, headY + 16 + headTilt, 12, 10);
    ctx.fillRect(52, headY + 16 + headTilt, 12, 10);
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(38, headY + 20 + headTilt, 4, 4);
    ctx.fillRect(58, headY + 20 + headTilt, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, headY + 19 + headTilt, 2, 2);
    ctx.fillRect(58, headY + 19 + headTilt, 2, 2);
  }

  // Mouth
  if (drinkFrame === 2) {
    // Open mouth drinking
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(42, headY + 32 + headTilt, 12, 6);
  } else {
    ctx.fillStyle = '#c53030';
    ctx.fillRect(40, headY + 34 + headTilt, 16, 4);
  }

  // Ears
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(22, headY + 20 + headTilt, 8, 12);
  ctx.fillRect(66, headY + 20 + headTilt, 8, 12);

  // Body
  drawClothing(ctx, profile, bodyY, frame, CharacterState.WORKING);

  // Arms with bottle animation
  ctx.fillStyle = skinColors.base;
  if (drinkFrame === 0) {
    // Reaching under desk
    ctx.fillRect(10, bodyY + 20, 16, 24);
    ctx.fillRect(70, bodyY + 8, 16, 14);
    ctx.fillRect(74, bodyY + 18, 14, 14);
  } else if (drinkFrame === 1) {
    // Pulling bottle up
    ctx.fillRect(10, bodyY + 4, 16, 24);
    ctx.fillRect(70, bodyY + 8, 16, 14);
    // Bottle in left hand
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(4, bodyY - 4, 10, 20);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(6, bodyY - 2, 6, 16);
    // Bottle cap
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(6, bodyY - 6, 6, 4);
  } else if (drinkFrame === 2) {
    // Tilting bottle to drink
    ctx.fillRect(10, bodyY - 4, 16, 24);
    ctx.fillRect(70, bodyY + 8, 16, 14);
    // Bottle tilted near mouth
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(16, bodyY - 16, 10, 20);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(18, bodyY - 14, 6, 16);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(18, bodyY - 18, 6, 4);
  } else {
    // Setting down
    ctx.fillRect(10, bodyY + 12, 16, 20);
    ctx.fillRect(70, bodyY + 8, 16, 14);
    // Bottle going down
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(4, bodyY + 6, 10, 20);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(6, bodyY + 8, 6, 16);
  }

  // Legs
  ctx.fillStyle = '#3d4852';
  ctx.fillRect(30, 92, 16, 30);
  ctx.fillRect(50, 92, 16, 30);
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(26, 118, 24, 10);
  ctx.fillRect(46, 118, 24, 10);

  drawAccessory(ctx, profile, headY + headTilt, frame, CharacterState.WORKING);
}

/**
 * Draw character doing a toast in place (medium cliche)
 * 4 frames: raise glass, hold high ("cheers"), drink, slam down
 */
function drawDrinkingToastCharacter(ctx, profile, frame) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const clothingStyle = CLOTHING_STYLES[profile.clothing];
  const toastFrame = frame % 4;
  const headY = 6;
  const bodyY = 48;

  // Draw hair behind
  if (['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
  }

  // Head
  ctx.fillStyle = skinColors.deep;
  ctx.fillRect(26, headY, 44, 40);
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(28, headY + 2, 40, 36);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(32, headY + 4, 18, 14);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(28, headY + 34, 40, 4);

  // Hair on top
  if (!['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
  }

  // Happy eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(32, headY + 16, 12, 10);
  ctx.fillRect(52, headY + 16, 12, 10);
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(38, headY + 20, 4, 4);
  ctx.fillRect(58, headY + 20, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(38, headY + 19, 2, 2);
  ctx.fillRect(58, headY + 19, 2, 2);

  // Happy mouth
  ctx.fillStyle = '#c53030';
  ctx.fillRect(38, headY + 34, 20, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(42, headY + 34, 12, 2);

  // Ears
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(22, headY + 20, 8, 12);
  ctx.fillRect(66, headY + 20, 8, 12);

  // Body
  drawClothing(ctx, profile, bodyY, frame, CharacterState.SOCIALIZING);

  // Arms with glass animation
  ctx.fillStyle = skinColors.base;
  const glassColor = '#b8860b';
  const glassHighlight = '#ffd700';

  if (toastFrame === 0) {
    // Raising glass - right arm going up
    ctx.fillRect(72, bodyY - 4, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    // Glass in right hand
    ctx.fillStyle = glassColor;
    ctx.fillRect(78, bodyY - 12, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(80, bodyY - 10, 6, 8);
  } else if (toastFrame === 1) {
    // Glass held high - cheers!
    ctx.fillRect(72, bodyY - 14, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    // Glass above head
    ctx.fillStyle = glassColor;
    ctx.fillRect(78, bodyY - 24, 10, 14);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(80, bodyY - 22, 6, 10);
  } else if (toastFrame === 2) {
    // Drinking - arm bent to face
    ctx.fillRect(60, bodyY - 8, 14, 24);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    // Glass near mouth
    ctx.fillStyle = glassColor;
    ctx.fillRect(56, bodyY - 12, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(58, bodyY - 10, 6, 8);
  } else {
    // Slam down
    ctx.fillRect(72, bodyY + 8, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    // Glass at waist
    ctx.fillStyle = glassColor;
    ctx.fillRect(80, bodyY + 32, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(82, bodyY + 34, 6, 8);
  }

  // Legs
  ctx.fillStyle = '#3d4852';
  ctx.fillRect(30, 92, 16, 30);
  ctx.fillRect(50, 92, 16, 30);
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(26, 118, 24, 10);
  ctx.fillRect(46, 118, 24, 10);

  drawAccessory(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
}

/**
 * Draw character at kitchen group toast (severe cliche)
 * 6 frames: raise glass, hold, clink, drink, set down, cheer
 */
function drawDrinkingKitchenCharacter(ctx, profile, frame) {
  const skinColors = SKIN_TONES[profile.skinTone];
  const kitchenFrame = frame % 6;
  const headY = 6;
  const bodyY = 48;

  // Draw hair behind
  if (['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY, frame, CharacterState.SOCIALIZING);
  }

  // Head with cheer bounce on frame 5
  const cheerBounce = kitchenFrame === 5 ? -4 : 0;
  ctx.fillStyle = skinColors.deep;
  ctx.fillRect(26, headY + cheerBounce, 44, 40);
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(28, headY + 2 + cheerBounce, 40, 36);
  ctx.fillStyle = skinColors.highlight;
  ctx.fillRect(32, headY + 4 + cheerBounce, 18, 14);
  ctx.fillStyle = skinColors.shadow;
  ctx.fillRect(28, headY + 34 + cheerBounce, 40, 4);

  if (!['long', 'ponytail', 'bob'].includes(profile.hairStyle)) {
    drawHair(ctx, profile, headY + cheerBounce, frame, CharacterState.SOCIALIZING);
  }

  // Eyes
  if (kitchenFrame === 3) {
    // Squinting while drinking
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(34, headY + 20 + cheerBounce, 10, 3);
    ctx.fillRect(54, headY + 20 + cheerBounce, 10, 3);
  } else if (kitchenFrame === 5) {
    // Excited eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(31, headY + 15 + cheerBounce, 14, 12);
    ctx.fillRect(51, headY + 15 + cheerBounce, 14, 12);
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(37, headY + 19 + cheerBounce, 5, 5);
    ctx.fillRect(57, headY + 19 + cheerBounce, 5, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, headY + 18 + cheerBounce, 2, 2);
    ctx.fillRect(58, headY + 18 + cheerBounce, 2, 2);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, headY + 16 + cheerBounce, 12, 10);
    ctx.fillRect(52, headY + 16 + cheerBounce, 12, 10);
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(38, headY + 20 + cheerBounce, 4, 4);
    ctx.fillRect(58, headY + 20 + cheerBounce, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, headY + 19 + cheerBounce, 2, 2);
    ctx.fillRect(58, headY + 19 + cheerBounce, 2, 2);
  }

  // Mouth
  if (kitchenFrame === 3) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(42, headY + 32 + cheerBounce, 12, 6);
  } else if (kitchenFrame === 5) {
    // Big smile
    ctx.fillStyle = '#c53030';
    ctx.fillRect(36, headY + 33 + cheerBounce, 24, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, headY + 33 + cheerBounce, 16, 3);
  } else {
    ctx.fillStyle = '#c53030';
    ctx.fillRect(38, headY + 34 + cheerBounce, 20, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(42, headY + 34 + cheerBounce, 12, 2);
  }

  // Ears
  ctx.fillStyle = skinColors.base;
  ctx.fillRect(22, headY + 20 + cheerBounce, 8, 12);
  ctx.fillRect(66, headY + 20 + cheerBounce, 8, 12);

  // Body
  drawClothing(ctx, profile, bodyY, frame, CharacterState.SOCIALIZING);

  // Arms with glass
  ctx.fillStyle = skinColors.base;
  const glassColor = '#b8860b';
  const glassHighlight = '#ffd700';

  if (kitchenFrame === 0) {
    // Raise glass
    ctx.fillRect(72, bodyY - 4, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillStyle = glassColor;
    ctx.fillRect(78, bodyY - 12, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(80, bodyY - 10, 6, 8);
  } else if (kitchenFrame === 1) {
    // Hold high
    ctx.fillRect(72, bodyY - 14, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillStyle = glassColor;
    ctx.fillRect(78, bodyY - 24, 10, 14);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(80, bodyY - 22, 6, 10);
  } else if (kitchenFrame === 2) {
    // Clink - glass extended forward
    ctx.fillRect(72, bodyY - 10, 14, 24);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillStyle = glassColor;
    ctx.fillRect(84, bodyY - 16, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(86, bodyY - 14, 6, 8);
  } else if (kitchenFrame === 3) {
    // Drink
    ctx.fillRect(60, bodyY - 8, 14, 24);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillStyle = glassColor;
    ctx.fillRect(56, bodyY - 12, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(58, bodyY - 10, 6, 8);
  } else if (kitchenFrame === 4) {
    // Set down
    ctx.fillRect(72, bodyY + 8, 14, 28);
    ctx.fillRect(10, bodyY + 4, 14, 32);
    ctx.fillStyle = glassColor;
    ctx.fillRect(80, bodyY + 32, 10, 12);
    ctx.fillStyle = glassHighlight;
    ctx.fillRect(82, bodyY + 34, 6, 8);
  } else {
    // Cheer - both arms up
    ctx.fillRect(8, bodyY - 14, 14, 28);
    ctx.fillRect(74, bodyY - 14, 14, 28);
    ctx.fillStyle = skinColors.highlight;
    ctx.fillRect(10, bodyY - 12, 6, 10);
    ctx.fillRect(76, bodyY - 12, 6, 10);
  }

  // Legs
  ctx.fillStyle = '#3d4852';
  ctx.fillRect(30, 92, 16, 30);
  ctx.fillRect(50, 92, 16, 30);
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(26, 118, 24, 10);
  ctx.fillRect(46, 118, 24, 10);

  drawAccessory(ctx, profile, headY + cheerBounce, frame, CharacterState.SOCIALIZING);
}

/**
 * Create a shot glass sparkle texture
 */
function createShotGlassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  // Golden sparkle
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(6, 2, 4, 12);
  ctx.fillRect(2, 6, 12, 4);
  // Bright center
  ctx.fillStyle = '#fff8dc';
  ctx.fillRect(7, 6, 2, 4);
  ctx.fillRect(6, 7, 4, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Create a clink star/sparkle texture
 */
function createClinkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');

  // Star shape
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(8, 0, 4, 20);
  ctx.fillRect(0, 8, 20, 4);
  // Diagonals
  ctx.fillRect(2, 2, 4, 4);
  ctx.fillRect(14, 2, 4, 4);
  ctx.fillRect(2, 14, 4, 4);
  ctx.fillRect(14, 14, 4, 4);
  // Bright center
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 8, 4, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Shot glass sparkle particle (for desk drinking)
 */
class ShotGlassParticle {
  constructor(startPosition) {
    const texture = createShotGlassTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.2, 0.2, 1);
    this.sprite.renderOrder = 12;

    this.sprite.position.set(
      startPosition.x + (Math.random() - 0.5) * 0.4,
      startPosition.y + 0.6 + Math.random() * 0.3,
      startPosition.z + (Math.random() - 0.5) * 0.3
    );

    this.velocity = {
      x: (Math.random() - 0.5) * 0.6,
      y: 1.2 + Math.random() * 0.6,
      z: 0
    };

    this.age = 0;
    this.maxAge = 0.8 + Math.random() * 0.2;
    this.startScale = 0.15 + Math.random() * 0.1;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.sprite.position.x += this.velocity.x * deltaTime;
    this.sprite.position.y += this.velocity.y * deltaTime;
    this.velocity.y -= 2.0 * deltaTime;

    const lifeRatio = this.age / this.maxAge;
    const scale = this.startScale * (1 - lifeRatio);
    this.sprite.scale.set(scale, scale, 1);
    this.sprite.material.opacity = 1 - lifeRatio;

    return this.age < this.maxAge;
  }

  dispose() {
    this.sprite.material.map.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Clink sparkle particle (for kitchen group toast)
 */
class ClinkParticle {
  constructor(startPosition) {
    const texture = createClinkTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.3, 0.3, 1);
    this.sprite.renderOrder = 12;

    this.sprite.position.set(
      startPosition.x + (Math.random() - 0.5) * 0.6,
      startPosition.y + 0.8 + Math.random() * 0.4,
      startPosition.z + (Math.random() - 0.5) * 0.4
    );

    this.velocity = {
      x: (Math.random() - 0.5) * 1.2,
      y: 1.0 + Math.random() * 0.8,
      z: (Math.random() - 0.5) * 0.4
    };

    this.age = 0;
    this.maxAge = 1.2 + Math.random() * 0.3;
    this.startScale = 0.2 + Math.random() * 0.15;
    this.rotationSpeed = (Math.random() - 0.5) * 4;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.sprite.position.x += this.velocity.x * deltaTime;
    this.sprite.position.y += this.velocity.y * deltaTime;
    this.sprite.position.z += this.velocity.z * deltaTime;
    this.velocity.y -= 1.5 * deltaTime;

    const lifeRatio = this.age / this.maxAge;
    let scale;
    if (lifeRatio < 0.2) {
      scale = this.startScale * (lifeRatio / 0.2);
    } else {
      scale = this.startScale * (1 - (lifeRatio - 0.2) / 0.8);
    }
    this.sprite.scale.set(scale, scale, 1);
    this.sprite.material.opacity = lifeRatio > 0.6 ? (1 - (lifeRatio - 0.6) / 0.4) : 1;

    return this.age < this.maxAge;
  }

  dispose() {
    this.sprite.material.map.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Create monitor screen texture with animated code/activity
 */
function createMonitorTexture(frame) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');

  // Monitor background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 64, 48);

  // Code lines animation
  const lineColors = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa'];
  const scrollOffset = (frame * 3) % 60;

  for (let i = 0; i < 8; i++) {
    const y = (i * 6 - scrollOffset + 60) % 60 - 6;
    if (y >= 0 && y < 48) {
      // Indentation
      const indent = (i % 3) * 6;
      // Line length varies
      const lineLength = 20 + ((i * 7) % 30);

      ctx.fillStyle = lineColors[i % lineColors.length];
      ctx.fillRect(4 + indent, y, lineLength, 3);

      // Cursor blink on active line
      if (i === (frame % 8) && frame % 4 < 2) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6 + indent + lineLength, y, 2, 3);
      }
    }
  }

  // Status bar at bottom
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, 42, 64, 6);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(2, 44, 8, 2);
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(12, 44, 12, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Create name plate texture with project name
 */
function createNamePlateTexture(projectName) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Semi-transparent background
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.fillRect(0, 0, 128, 32);

  // Border
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 30);

  // Project name text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Truncate if too long
  let displayName = projectName;
  if (displayName.length > 14) {
    displayName = displayName.substring(0, 12) + '..';
  }
  ctx.fillText(displayName, 64, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Create a "z" sprite texture for sleeping
 */
function createZTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.font = `bold ${size + 2}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('z', 13, 13);

  // Main z
  ctx.fillStyle = '#a5b4fc';
  ctx.font = `bold ${size}px monospace`;
  ctx.fillText('z', 12, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Create a sweat droplet texture
 */
function createSweatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 18;
  const ctx = canvas.getContext('2d');

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(7, 2);
  ctx.quadraticCurveTo(12, 10, 7, 17);
  ctx.quadraticCurveTo(2, 10, 7, 2);
  ctx.fill();

  // Main droplet
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(6, 1);
  ctx.quadraticCurveTo(11, 9, 6, 16);
  ctx.quadraticCurveTo(1, 9, 6, 1);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(4, 6, 2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Floating "z" particle for sleep animation
 */
class ZParticle {
  constructor(startPosition) {
    const size = 14 + Math.random() * 6;
    const texture = createZTexture(size);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.35, 0.35, 1);
    this.sprite.renderOrder = 12;  // Render on top of characters

    this.sprite.position.set(
      startPosition.x + (Math.random() - 0.5) * 0.3,
      startPosition.y + 0.9,
      startPosition.z + (Math.random() - 0.5) * 0.3
    );

    this.velocity = {
      x: (Math.random() - 0.5) * 0.4,
      y: 0.9 + Math.random() * 0.5,
      z: 0
    };

    this.age = 0;
    this.maxAge = 1.8 + Math.random() * 0.6;
    this.startScale = 0.25 + Math.random() * 0.15;
  }

  update(deltaTime) {
    this.age += deltaTime;

    this.sprite.position.x += this.velocity.x * deltaTime;
    this.sprite.position.y += this.velocity.y * deltaTime;

    const lifeRatio = this.age / this.maxAge;
    let scale;
    if (lifeRatio < 0.3) {
      scale = this.startScale * (lifeRatio / 0.3);
    } else {
      scale = this.startScale * (1 - (lifeRatio - 0.3) / 0.7);
    }
    this.sprite.scale.set(scale, scale, 1);
    this.sprite.material.opacity = 1 - lifeRatio;

    return this.age < this.maxAge;
  }

  dispose() {
    this.sprite.material.map.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Falling sweat droplet particle
 */
class SweatParticle {
  constructor(startPosition) {
    const texture = createSweatTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.18, 0.25, 1);
    this.sprite.renderOrder = 12;  // Render on top of characters

    const side = Math.random() > 0.5 ? 1 : -1;
    this.sprite.position.set(
      startPosition.x + side * (0.3 + Math.random() * 0.15),
      startPosition.y + 0.8 + Math.random() * 0.25,
      startPosition.z + (Math.random() - 0.5) * 0.15
    );

    this.velocity = {
      x: side * (0.25 + Math.random() * 0.35),
      y: 0.6,
      z: 0
    };

    this.gravity = 4.0;
    this.age = 0;
    this.maxAge = 0.9 + Math.random() * 0.4;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.velocity.y -= this.gravity * deltaTime;
    this.sprite.position.x += this.velocity.x * deltaTime;
    this.sprite.position.y += this.velocity.y * deltaTime;

    const lifeRatio = this.age / this.maxAge;
    if (lifeRatio > 0.7) {
      this.sprite.material.opacity = 1 - ((lifeRatio - 0.7) / 0.3);
    }

    const scale = 0.18 * (1 - lifeRatio * 0.3);
    this.sprite.scale.set(scale, scale * 1.4, 1);

    return this.age < this.maxAge;
  }

  dispose() {
    this.sprite.material.map.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Create a chat bubble texture for socializing
 */
function createChatBubbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');

  // Bubble background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 16, 4);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bubble tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(8, 18);
  ctx.lineTo(12, 22);
  ctx.lineTo(16, 18);
  ctx.fill();

  // Dots (...)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(8, 9, 3, 3);
  ctx.fillRect(14, 9, 3, 3);
  ctx.fillRect(20, 9, 3, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

/**
 * Chat bubble particle for socializing animation
 */
class ChatBubbleParticle {
  constructor(startPosition) {
    const texture = createChatBubbleTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.5, 0.4, 1);
    this.sprite.renderOrder = 12;  // Render on top of characters

    // Position above character's head, slightly randomized
    this.sprite.position.set(
      startPosition.x + (Math.random() - 0.5) * 0.3,
      startPosition.y + 1.0,
      startPosition.z + (Math.random() - 0.5) * 0.2
    );

    this.velocity = {
      x: (Math.random() - 0.5) * 0.2,
      y: 0.5 + Math.random() * 0.3,
      z: 0
    };

    this.age = 0;
    this.maxAge = 1.5 + Math.random() * 0.5;
    this.startScale = 0.4 + Math.random() * 0.1;
  }

  update(deltaTime) {
    this.age += deltaTime;

    this.sprite.position.x += this.velocity.x * deltaTime;
    this.sprite.position.y += this.velocity.y * deltaTime;

    const lifeRatio = this.age / this.maxAge;
    let scale;
    if (lifeRatio < 0.2) {
      // Pop in
      scale = this.startScale * (lifeRatio / 0.2);
    } else if (lifeRatio < 0.7) {
      // Stay visible
      scale = this.startScale;
    } else {
      // Fade out
      scale = this.startScale * (1 - (lifeRatio - 0.7) / 0.3);
    }
    this.sprite.scale.set(scale * 1.25, scale, 1);
    this.sprite.material.opacity = lifeRatio > 0.7 ? (1 - (lifeRatio - 0.7) / 0.3) : 1;

    return this.age < this.maxAge;
  }

  dispose() {
    this.sprite.material.map.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Character class with monitor and name plate
 */
export class Character {
  constructor(sessionInfo, colorIndex, deskPosition, scene) {
    this.sessionInfo = sessionInfo;
    this.profileIndex = colorIndex;
    this.deskPosition = deskPosition;
    this.scene = scene;
    this.state = CharacterState.WORKING;
    this.frame = 0;
    this.frameTime = 0;
    this.monitorFrame = 0;
    this.monitorFrameTime = 0;
    this.targetPosition = null;
    this.walkSpeed = 2;

    this.zParticles = [];
    this.zSpawnTimer = 0;
    this.sweatParticles = [];
    this.sweatSpawnTimer = 0;
    this.chatBubbleParticles = [];
    this.chatBubbleSpawnTimer = 0;

    // Kitchen/idle tracking
    this.idleTime = 0;
    this.isAtKitchen = false;
    this.kitchenSpot = null;

    // Drinking animation tracking
    this.drinkingParticles = [];
    this.drinkingParticleTimer = 0;
    this.drinkingTimer = 0;
    this.drinkingDuration = 0;
    this.previousState = null;
    this.onDrinkingComplete = null;

    // Create character sprite
    this.sprite = this.createSprite();

    // Create monitor sprite
    this.monitorSprite = this.createMonitorSprite();

    // Create name plate sprite
    this.namePlateSprite = this.createNamePlateSprite();

    this.updatePosition();
  }

  createSprite() {
    const texture = createCharacterFrame(this.profileIndex, 0, this.state);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.2, 1.6, 1);
    sprite.renderOrder = 10;  // Render on top of furniture
    sprite.userData = { type: 'character', character: this };
    return sprite;
  }

  createMonitorSprite() {
    const texture = createMonitorTexture(0);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.6, 1);
    sprite.renderOrder = 9;  // Render below character but above furniture
    sprite.visible = false;
    this.scene.add(sprite);
    return sprite;
  }

  createNamePlateSprite() {
    const characterName = getCharacterName(this.profileIndex);
    const texture = createNamePlateTexture(characterName);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.0, 0.25, 1);
    sprite.renderOrder = 11;  // Render on top of character
    this.scene.add(sprite);
    return sprite;
  }

  updatePosition() {
    if (this.isAtKitchen && this.kitchenSpot) {
      // Position in kitchen
      this.sprite.position.set(
        this.kitchenSpot.x,
        0.8,
        this.kitchenSpot.z
      );
    } else if (this.state === CharacterState.WORKING || this.state === CharacterState.SLEEPING) {
      const chairOffset = this.deskPosition.rotation === 0 ? 0.9 : -0.9;
      this.sprite.position.set(
        this.deskPosition.x,
        0.8,
        this.deskPosition.z + chairOffset
      );

      // Position monitor on desk
      const monitorOffset = this.deskPosition.rotation === 0 ? -0.3 : 0.3;
      this.monitorSprite.position.set(
        this.deskPosition.x,
        1.0,
        this.deskPosition.z + monitorOffset
      );
    }

    // Name plate always above character
    this.namePlateSprite.position.set(
      this.sprite.position.x,
      this.sprite.position.y + 1.1,
      this.sprite.position.z
    );
  }

  setState(newState) {
    if (this.state === newState) return;

    this.state = newState;
    this.frame = 0;

    if (newState === CharacterState.SLEEPING) {
      this.targetPosition = null;
      this.clearSweatParticles();
      this.clearChatBubbleParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.SOCIALIZING) {
      this.targetPosition = null;
      this.clearSweatParticles();
      this.clearZParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.DRINKING_DESK) {
      this.previousState = this.state !== newState ? this.state : CharacterState.WORKING;
      this.targetPosition = null;
      this.drinkingTimer = 0;
      this.drinkingDuration = 0.8;
      this.clearZParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.DRINKING_TOAST) {
      this.previousState = this.state !== newState ? this.state : CharacterState.WORKING;
      this.targetPosition = null;
      this.drinkingTimer = 0;
      this.drinkingDuration = 0.8;
      this.clearZParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.DRINKING_KITCHEN) {
      this.previousState = this.state !== newState ? this.state : CharacterState.WORKING;
      this.targetPosition = null;
      this.drinkingTimer = 0;
      this.drinkingDuration = 1.5;
      this.clearZParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.EXITING) {
      // Walk toward the door on the right wall
      this.targetPosition = new THREE.Vector3(DOOR_POSITION.x, 0.8, DOOR_POSITION.z);
      this.clearSweatParticles();
      this.clearZParticles();
      this.clearChatBubbleParticles();
      this.monitorSprite.visible = false;
    } else if (newState === CharacterState.WORKING) {
      const chairOffset = this.deskPosition.rotation === 0 ? 0.9 : -0.9;
      this.targetPosition = new THREE.Vector3(
        this.deskPosition.x,
        0.8,
        this.deskPosition.z + chairOffset
      );
      this.clearZParticles();
      this.clearChatBubbleParticles();
    }

    this.updateTexture();
  }

  updateTexture() {
    const texture = createCharacterFrame(this.profileIndex, this.frame, this.state);
    this.sprite.material.map.dispose();
    this.sprite.material.map = texture;
    this.sprite.material.needsUpdate = true;
  }

  updateMonitorTexture() {
    const texture = createMonitorTexture(this.monitorFrame);
    this.monitorSprite.material.map.dispose();
    this.monitorSprite.material.map = texture;
    this.monitorSprite.material.needsUpdate = true;
  }

  update(deltaTime) {
    // Update character animation
    this.frameTime += deltaTime * 1000;
    if (this.frameTime >= FRAME_DURATION) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % 4;
      this.updateTexture();
    }

    // Update monitor animation when working
    if (this.state === CharacterState.WORKING && !this.targetPosition) {
      this.monitorSprite.visible = true;
      this.monitorFrameTime += deltaTime * 1000;
      if (this.monitorFrameTime >= MONITOR_FRAME_DURATION) {
        this.monitorFrameTime = 0;
        this.monitorFrame = (this.monitorFrame + 1) % 60;
        this.updateMonitorTexture();
      }
    }

    // Update name plate position
    this.namePlateSprite.position.set(
      this.sprite.position.x,
      this.sprite.position.y + 1.1,
      this.sprite.position.z
    );

    // Handle sleeping zzz particles
    if (this.state === CharacterState.SLEEPING) {
      this.updateZParticles(deltaTime);
    }

    // Handle working sweat particles
    if (this.state === CharacterState.WORKING && !this.targetPosition) {
      this.updateSweatParticles(deltaTime);
    }

    // Handle socializing chat bubbles
    if (this.state === CharacterState.SOCIALIZING) {
      this.updateChatBubbleParticles(deltaTime);
    }

    // Handle drinking animations
    if (this.state === CharacterState.DRINKING_DESK ||
      this.state === CharacterState.DRINKING_TOAST ||
      this.state === CharacterState.DRINKING_KITCHEN) {
      this.updateDrinkingAnimation(deltaTime);
    }

    // Handle movement
    if (this.targetPosition &&
      (this.state === CharacterState.EXITING ||
        this.state === CharacterState.WALKING ||
        this.state === CharacterState.WORKING)) {

      const pos = this.sprite.position;
      const target = this.targetPosition;
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const speed = this.walkSpeed * deltaTime;
        const moveX = (dx / dist) * Math.min(speed, dist);
        const moveZ = (dz / dist) * Math.min(speed, dist);
        pos.x += moveX;
        pos.z += moveZ;

        if (this.state !== CharacterState.EXITING) {
          this.state = CharacterState.WALKING;
        }

        // Hide monitor while moving
        this.monitorSprite.visible = false;
      } else {
        if (this.state === CharacterState.WALKING) {
          this.state = CharacterState.WORKING;
          this.updateTexture();
        }
        this.targetPosition = null;
        this.updatePosition();
      }
    }
  }

  updateZParticles(deltaTime) {
    this.zSpawnTimer += deltaTime * 1000;
    if (this.zSpawnTimer >= ZZZ_SPAWN_INTERVAL) {
      this.zSpawnTimer = 0;
      const particle = new ZParticle(this.sprite.position);
      this.zParticles.push(particle);
      this.scene.add(particle.sprite);
    }

    this.zParticles = this.zParticles.filter(particle => {
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.scene.remove(particle.sprite);
        particle.dispose();
      }
      return alive;
    });
  }

  updateSweatParticles(deltaTime) {
    this.sweatSpawnTimer += deltaTime * 1000;
    if (this.sweatSpawnTimer >= SWEAT_SPAWN_INTERVAL) {
      this.sweatSpawnTimer = 0;
      const particle = new SweatParticle(this.sprite.position);
      this.sweatParticles.push(particle);
      this.scene.add(particle.sprite);
    }

    this.sweatParticles = this.sweatParticles.filter(particle => {
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.scene.remove(particle.sprite);
        particle.dispose();
      }
      return alive;
    });
  }

  clearZParticles() {
    for (const particle of this.zParticles) {
      this.scene.remove(particle.sprite);
      particle.dispose();
    }
    this.zParticles = [];
  }

  clearSweatParticles() {
    for (const particle of this.sweatParticles) {
      this.scene.remove(particle.sprite);
      particle.dispose();
    }
    this.sweatParticles = [];
  }

  updateChatBubbleParticles(deltaTime) {
    this.chatBubbleSpawnTimer += deltaTime * 1000;
    if (this.chatBubbleSpawnTimer >= CHAT_BUBBLE_SPAWN_INTERVAL) {
      this.chatBubbleSpawnTimer = 0;
      const particle = new ChatBubbleParticle(this.sprite.position);
      this.chatBubbleParticles.push(particle);
      this.scene.add(particle.sprite);
    }

    this.chatBubbleParticles = this.chatBubbleParticles.filter(particle => {
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.scene.remove(particle.sprite);
        particle.dispose();
      }
      return alive;
    });
  }

  clearChatBubbleParticles() {
    for (const particle of this.chatBubbleParticles) {
      this.scene.remove(particle.sprite);
      particle.dispose();
    }
    this.chatBubbleParticles = [];
  }

  updateDrinkingAnimation(deltaTime) {
    this.drinkingTimer += deltaTime;

    // Spawn drinking particles
    this.drinkingParticleTimer += deltaTime * 1000;
    const spawnInterval = this.state === CharacterState.DRINKING_KITCHEN ? 200 : 300;
    if (this.drinkingParticleTimer >= spawnInterval) {
      this.drinkingParticleTimer = 0;
      const ParticleClass = this.state === CharacterState.DRINKING_KITCHEN
        ? ClinkParticle : ShotGlassParticle;
      const particle = new ParticleClass(this.sprite.position);
      this.drinkingParticles.push(particle);
      this.scene.add(particle.sprite);
    }

    // Update particles
    this.drinkingParticles = this.drinkingParticles.filter(particle => {
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.scene.remove(particle.sprite);
        particle.dispose();
      }
      return alive;
    });

    // Auto-return to previous state when drinking animation completes
    if (this.drinkingTimer >= this.drinkingDuration) {
      const callback = this.onDrinkingComplete;
      this.onDrinkingComplete = null;
      // Restore previous state
      const restoreState = this.previousState || CharacterState.WORKING;
      this.previousState = null;
      this.state = restoreState;
      this.frame = 0;
      this.updateTexture();
      if (callback) callback();
    }
  }

  clearDrinkingParticles() {
    for (const particle of this.drinkingParticles) {
      this.scene.remove(particle.sprite);
      particle.dispose();
    }
    this.drinkingParticles = [];
  }

  getTooltipInfo() {
    const elapsed = Date.now() - this.sessionInfo.lastActivity;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    let timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    let displayState = this.sessionInfo.state;
    if (this.state === CharacterState.SLEEPING) {
      displayState = 'sleeping';
    } else if (this.state === CharacterState.SOCIALIZING) {
      displayState = 'socializing';
    }

    return {
      project: this.sessionInfo.project,
      state: displayState,
      timeInState: timeStr
    };
  }

  dispose() {
    this.clearZParticles();
    this.clearSweatParticles();
    this.clearDrinkingParticles();

    // Dispose character sprite
    if (this.sprite.material.map) {
      this.sprite.material.map.dispose();
    }
    this.sprite.material.dispose();

    // Dispose monitor sprite
    this.scene.remove(this.monitorSprite);
    if (this.monitorSprite.material.map) {
      this.monitorSprite.material.map.dispose();
    }
    this.monitorSprite.material.dispose();

    // Dispose name plate sprite
    this.scene.remove(this.namePlateSprite);
    if (this.namePlateSprite.material.map) {
      this.namePlateSprite.material.map.dispose();
    }
    this.namePlateSprite.material.dispose();
  }

  /**
   * Trigger drinking animation
   * @param {string} drinkState - CharacterState.DRINKING_DESK, DRINKING_TOAST, or DRINKING_KITCHEN
   */
  triggerDrinking(drinkState) {
    // Don't interrupt if already drinking or exiting
    if (this.state === CharacterState.EXITING ||
      this.state === CharacterState.DRINKING_DESK ||
      this.state === CharacterState.DRINKING_TOAST ||
      this.state === CharacterState.DRINKING_KITCHEN) {
      return;
    }

    this.setState(drinkState);
  }
}
