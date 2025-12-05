import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { VISION_MODEL_ASSET_PATH, WASM_BINARY_PATH, PINCH_THRESHOLD } from '../constants';
import { GestureState, GestureType } from '../types';
import { Loader2, Camera, CameraOff } from 'lucide-react';

interface GestureControllerProps {
  onGestureUpdate: (state: GestureState) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  // Tracking previous positions for delta calculation
  const prevHandPos = useRef<{ x: number, y: number } | null>(null);
  const prevPinchDist = useRef<number | null>(null);

  const initializeMediaPipe = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_BINARY_PATH);
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: VISION_MODEL_ASSET_PATH,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setIsInitializing(false);
      startCamera();
    } catch (err) {
      setError("Failed to load gesture recognition module.");
      console.error(err);
      setIsInitializing(false);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } // Low res is fine for gesture
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setCameraActive(true);
      }
    } catch (err) {
      setError("Camera permission denied or unavailable.");
      console.error(err);
    }
  };

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    let startTimeMs = performance.now();
    
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      let gestureState: GestureState = {
        type: GestureType.NONE,
        deltaX: 0,
        deltaY: 0,
        zoomFactor: 0,
        isHandDetected: false
      };

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        gestureState.isHandDetected = true;

        // Key Points
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];

        // 1. Calculate Pinch (Thumb + Index)
        const pinchDist = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) + 
          Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // 2. Check for Fist (Fingers curled towards wrist)
        // Simplified check: Are tips below their lower joints (in Y)? 
        // Or just check if tips are close to wrist.
        const isFist = [indexTip, middleTip, ringTip, pinkyTip].every(tip => {
            const distToWrist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
            return distToWrist < 0.2; // Threshold for fist
        });

        const currentHandX = wrist.x;
        const currentHandY = wrist.y;

        if (pinchDist < PINCH_THRESHOLD) {
          // ZOOM MODE
          gestureState.type = GestureType.ZOOM;
          
          if (prevPinchDist.current !== null) {
            // Zoom based on how much pinch distance CHANGED? 
            // Better: Pinch + Vertical Move? 
            // Let's do: Hold Pinch + Move Up/Down to Zoom
             if (prevHandPos.current) {
                gestureState.zoomFactor = (prevHandPos.current.y - currentHandY) * 2; // Inverted Y
             }
          }
           prevPinchDist.current = pinchDist;
        } else if (isFist) {
           // ROTATE MODE
           gestureState.type = GestureType.ROTATE;
           if (prevHandPos.current) {
             gestureState.deltaX = currentHandX - prevHandPos.current.x;
             gestureState.deltaY = currentHandY - prevHandPos.current.y;
           }
        } else {
           gestureState.type = GestureType.IDLE;
        }

        prevHandPos.current = { x: currentHandX, y: currentHandY };

      } else {
        // Reset tracking if hand lost
        prevHandPos.current = null;
        prevPinchDist.current = null;
      }

      onGestureUpdate(gestureState);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    initializeMediaPipe();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-50 pointer-events-none">
       {/* Camera Preview Container */}
      <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-cyan-500/30 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraActive ? 'opacity-70' : 'opacity-0'}`} 
        />
        
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        )}
        
        {!cameraActive && !isInitializing && !error && (
             <div className="absolute inset-0 flex items-center justify-center text-cyan-500/50">
                <CameraOff className="w-6 h-6" />
             </div>
        )}

        {/* HUD Overlay on Video */}
        <div className="absolute top-1 left-1 text-[8px] text-cyan-400 font-sci-fi">
           SENSOR: {cameraActive ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded max-w-[200px]">
          {error}
        </div>
      )}
    </div>
  );
};

export default GestureController;