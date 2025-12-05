export enum GestureType {
  NONE = 'NONE',
  IDLE = 'IDLE', // Hand detected but no specific action
  ROTATE = 'ROTATE', // Closed Fist
  ZOOM = 'ZOOM', // Pinch
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  type: GestureType;
  deltaX: number;
  deltaY: number;
  zoomFactor: number;
  isHandDetected: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
