import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface SphereAnimationProps {
  position?: [number, number, number];
  audioReactive?: boolean;
  touchInteractive?: boolean;
}

const SphereAnimation: React.FC<SphereAnimationProps> = ({
  position = [0, 0, 0],
  audioReactive = false,
  touchInteractive = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [distortionFactor, setDistortionFactor] = useState(0.4);
  const [audioData, setAudioData] = useState<number[]>(Array(32).fill(0));
  const [colorPhase, setColorPhase] = useState(0);
  
  // Animation springs
  const { scale, color, emissive } = useSpring({
    scale: clicked ? 1.2 : hovered ? 1.1 : 1,
    color: hovered ? '#ffffff' : '#cccccc',
    emissive: clicked ? '#333333' : '#222222',
    config: { mass: 1, tension: 170, friction: 26 }
  });

  // Hover animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle floating motion
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;
    
    // Gradual color phase change for pulse effect
    setColorPhase((prev) => (prev + 0.005) % (Math.PI * 2));
    
    // Simulate audio reactivity if enabled
    if (audioReactive) {
      // This would be replaced with actual audio analysis in a production version
      const newAudioData = [...audioData];
      for (let i = 0; i < newAudioData.length; i++) {
        newAudioData[i] = 0.2 + 0.8 * Math.sin(time * 2 + i * 0.2) * Math.sin(time * 1.5);
      }
      setAudioData(newAudioData);
      
      // Use audio data to influence distortion
      const avgAudioLevel = newAudioData.reduce((sum, val) => sum + Math.abs(val), 0) / newAudioData.length;
      setDistortionFactor(0.3 + avgAudioLevel * 0.3);
    }
  });

  // Calculate gradient colors based on phase
  const getGradientColor = () => {
    const r = 0.5 + 0.5 * Math.sin(colorPhase);
    const g = 0.5 + 0.5 * Math.sin(colorPhase + Math.PI * 0.5);
    const b = 0.5 + 0.5 * Math.sin(colorPhase + Math.PI);
    
    // Convert to grayscale for the neutral theme
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return new THREE.Color(luminance, luminance, luminance);
  };

  return (
    <animated.mesh
      ref={meshRef}
      position={new THREE.Vector3(...position)}
      scale={scale}
      onClick={() => touchInteractive && setClicked(!clicked)}
      onPointerOver={() => touchInteractive && setHovered(true)}
      onPointerOut={() => touchInteractive && setHovered(false)}
      castShadow
      receiveShadow
    >
      <Sphere args={[1, 64, 64]}>
        <animated.meshPhysicalMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          envMapIntensity={1}
        />
      </Sphere>
      
      <Sphere args={[1.02, 64, 64]}>
        <MeshDistortMaterial
          color={getGradientColor()}
          transparent
          opacity={0.3}
          distort={distortionFactor}
          speed={2}
          roughness={0}
          metalness={0.8}
        />
      </Sphere>
    </animated.mesh>
  );
};

export default SphereAnimation;
