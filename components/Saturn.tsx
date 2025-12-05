import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT_PLANET, PARTICLE_COUNT_RINGS, PLANET_RADIUS, RING_INNER_RADIUS, RING_OUTER_RADIUS, COLOR_PALETTE } from '../constants';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      mesh: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
    }
  }
}

const Saturn: React.FC = () => {
  const planetRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Points>(null);

  // Generate Planet Particles
  const planetParticles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT_PLANET * 3);
    const colors = new Float32Array(PARTICLE_COUNT_PLANET * 3);
    const sizes = new Float32Array(PARTICLE_COUNT_PLANET);

    const colorObj = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT_PLANET; i++) {
      // Uniform distribution on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      // Add slight noise to radius for fluffiness
      const r = PLANET_RADIUS + (Math.random() - 0.5) * 0.1;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y * 0.9; // Flatten slightly at poles (oblate spheroid)
      positions[i * 3 + 2] = z;

      // Color mapping based on latitude (y position) to create bands
      const normalizedY = (y + PLANET_RADIUS) / (PLANET_RADIUS * 2);
      
      const paletteIndex = Math.floor(normalizedY * COLOR_PALETTE.planet.length) % COLOR_PALETTE.planet.length;
      
      colorObj.set(COLOR_PALETTE.planet[paletteIndex]);
      // Vary brightness
      colorObj.multiplyScalar(0.8 + Math.random() * 0.4);

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      sizes[i] = Math.random() * 0.05 + 0.02;
    }

    return { positions, colors, sizes };
  }, []);

  // Generate Ring Particles
  const ringParticles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT_RINGS * 3);
    const colors = new Float32Array(PARTICLE_COUNT_RINGS * 3);
    const sizes = new Float32Array(PARTICLE_COUNT_RINGS);

    const colorObj = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT_RINGS; i++) {
      // Random angle
      const angle = Math.random() * Math.PI * 2;
      
      // Random radius within ring bounds (skewed slightly outwards for density variety)
      const r = RING_INNER_RADIUS + Math.random() * (RING_OUTER_RADIUS - RING_INNER_RADIUS);

      // Cassini Division logic (gap in rings)
      if (r > 4.8 && r < 5.2 && Math.random() > 0.1) {
         // Skip particle or push it out of gap
         continue; 
      }

      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const y = (Math.random() - 0.5) * 0.1; // Thin layer

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color based on radius (rings have distinct bands)
      const normalizedR = (r - RING_INNER_RADIUS) / (RING_OUTER_RADIUS - RING_INNER_RADIUS);
      const bandIndex = Math.floor(normalizedR * COLOR_PALETTE.rings.length);
      const safeIndex = Math.min(bandIndex, COLOR_PALETTE.rings.length - 1);

      colorObj.set(COLOR_PALETTE.rings[safeIndex]);
      
      // Add texture/noise to color
      const noise = Math.random() * 0.2;
      colorObj.offsetHSL(0, 0, noise);

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.05;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.02; // Rings rotate slower
      // Slight wobble
      ringsRef.current.rotation.x = Math.sin(t * 0.1) * 0.02; 
    }
  });

  return (
    <group rotation={[0.2, 0, 0.1]}> {/* Overall axial tilt of Saturn */}
      {/* Planet Body */}
      <points ref={planetRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT_PLANET}
            array={planetParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT_PLANET}
            array={planetParticles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Rings */}
      <points ref={ringsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT_RINGS}
            array={ringParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT_RINGS}
            array={ringParticles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false} // Helps with transparency ordering
        />
      </points>
      
      {/* Add a central glow */}
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS * 0.9, 32, 32]} />
        <meshBasicMaterial color="#C5A178" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

export default Saturn;