import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';

interface WaveDistortionSphereProps {
  position?: [number, number, number];
  radius?: number;
  audioData?: Float32Array | null;
  isSpeaking?: boolean;
  color?: string;
}

const WaveDistortionSphere: React.FC<WaveDistortionSphereProps> = ({
  position = [0, 0, 0],
  radius = 1,
  audioData = null,
  isSpeaking = false,
  color = '#ffffff'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const time = useRef(0);

  // Update animation on each frame
  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;
    
    // Update time reference for animations
    time.current += delta;
    
    // Apply audio data to distortion if available
    if (audioData && audioData.length > 0) {
      // Calculate average audio level for this frame
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += Math.abs(audioData[i]);
      }
      const avgAudioLevel = sum / audioData.length;
      
      // Apply to distortion
      materialRef.current.distort = 0.3 + avgAudioLevel * 0.7;
      materialRef.current.speed = 2 + avgAudioLevel * 3;
    }
    
    // Rotate the sphere slowly
    meshRef.current.rotation.y += delta * 0.1;
  });

  return (
    <mesh 
      ref={meshRef} 
      position={new THREE.Vector3(...position)}
    >
      <sphereGeometry args={[radius, 128, 128]} />
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        distort={isSpeaking ? 0.6 : 0.3}
        speed={isSpeaking ? 4 : 2}
        roughness={0.2}
        metalness={0.8}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
        envMapIntensity={1}
      />
    </mesh>
  );
};

export default WaveDistortionSphere;
