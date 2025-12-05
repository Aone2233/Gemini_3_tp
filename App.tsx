import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

import Saturn from './components/Saturn';
import GestureController from './components/GestureController';
import Interface from './components/Interface';
import { GestureState, GestureType } from './types';
import { MOVEMENT_SENSITIVITY_ROTATE, MOVEMENT_SENSITIVITY_ZOOM } from './constants';

// Component to handle camera movement based on gestures
const CameraController: React.FC<{ gestureState: GestureState }> = ({ gestureState }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (gestureState.type === GestureType.ROTATE) {
      // Rotate OrbitControls based on hand movement
      // We invert X because dragging left usually means rotating camera right around target
      controlsRef.current.azimuthAngle -= gestureState.deltaX * MOVEMENT_SENSITIVITY_ROTATE * 0.001; 
      controlsRef.current.polarAngle -= gestureState.deltaY * MOVEMENT_SENSITIVITY_ROTATE * 0.001;
      controlsRef.current.update();
    } else if (gestureState.type === GestureType.ZOOM) {
      // Zoom logic
      // gestureState.zoomFactor is derived from vertical movement while pinching
      // Positive zoomFactor (moving up) -> Zoom In -> camera moves closer
      
      const zoomSpeed = MOVEMENT_SENSITIVITY_ZOOM;
      
      // Move camera along its lookAt vector
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      const distance = camera.position.length(); // Assuming looking at 0,0,0
      
      // Limit zoom
      if ((distance > 5 || gestureState.zoomFactor < 0) && (distance < 25 || gestureState.zoomFactor > 0)) {
         camera.position.addScaledVector(direction, gestureState.zoomFactor * zoomSpeed);
      }
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      enableZoom={true} // Allow mouse zoom fallback
      enableRotate={true} // Allow mouse rotate fallback
      minDistance={4}
      maxDistance={30}
      autoRotate={gestureState.type === GestureType.NONE} // Auto rotate when idle
      autoRotateSpeed={0.5}
      dampingFactor={0.1}
    />
  );
};

const App: React.FC = () => {
  const [gestureState, setGestureState] = useState<GestureState>({
    type: GestureType.NONE,
    deltaX: 0,
    deltaY: 0,
    zoomFactor: 0,
    isHandDetected: false
  });

  // Smooth out gesture state updates to prevent jitter
  const handleGestureUpdate = (newState: GestureState) => {
    setGestureState(prevState => ({
      ...newState,
      // Apply simple low-pass filter for deltas if needed, or take raw
      // Taking raw here, damping handled in CameraController via OrbitControls damping or factors
      deltaX: (newState.deltaX + prevState.deltaX) / 2, 
      deltaY: (newState.deltaY + prevState.deltaY) / 2
    }));
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: false }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[10, 6, 10]} fov={45} />
          
          <color attach="background" args={['#050508']} />
          
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[50, 20, 30]} intensity={1.5} color="#fff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#406080" />

          {/* Environment */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Main Model */}
          <Saturn />
          
          {/* Logic Bridge */}
          <CameraController gestureState={gestureState} />
        
          {/* Post Processing (Simple fog for depth) */}
          <fog attach="fog" args={['#050508', 10, 50]} />
        </Suspense>
      </Canvas>

      {/* Inputs & UI */}
      <GestureController onGestureUpdate={handleGestureUpdate} />
      <Interface gestureState={gestureState} />
      
    </div>
  );
};

export default App;
