// Particle System Constants
export const PARTICLE_COUNT_PLANET = 15000;
export const PARTICLE_COUNT_RINGS = 45000;
export const PLANET_RADIUS = 2.5;
export const RING_INNER_RADIUS = 3.2;
export const RING_OUTER_RADIUS = 7.0;

// Colors
export const COLOR_PALETTE = {
  planet: ['#C5A178', '#E3CAA3', '#A68A64', '#D4B88C'],
  rings: ['#918573', '#C7B69B', '#6E6457', '#EBE0CC', '#222222'] // Includes dark for gaps
};

// Gesture Thresholds
export const PINCH_THRESHOLD = 0.05; // Distance between thumb and index tip
export const MOVEMENT_SENSITIVITY_ROTATE = 2.5;
export const MOVEMENT_SENSITIVITY_ZOOM = 0.02;

// MediaPipe
export const VISION_MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
export const WASM_BINARY_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm";
