import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMood } from '../contexts/MoodContext';
import * as THREE from 'three';

// Explicitly extend Three.js with R3F
extend({ THREE });

interface SphereProps {
  isProcessing: boolean;
}

// The actual 3D sphere component within the Canvas
const AnimatedSphere = ({ isProcessing }: SphereProps) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // Create animated gradients using shader materials
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    // Use a neutral base color (mid grey)
    baseColor: { value: new THREE.Color('#888888') },
    pulseIntensity: { value: isProcessing ? 1.0 : 0.5 },
    isDark: { value: true }
  }), [isProcessing]);
  
  // Custom vertex and fragment shaders for neutral gradient effects
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 baseColor;
    uniform float pulseIntensity;
    uniform bool isDark;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    // Simple noise function
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
    }
    
    void main() {
      vec3 normal = normalize(vNormal);
      float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 5.0);
      float specular = pow(max(dot(normal, normalize(vec3(1.0, 1.0, 1.0))), 0.0), 64.0);
      float noiseVal = noise(vNormal * 5.0 + time * 0.1) * 0.08;
      float yGradient = vPosition.y * 0.5 + 0.5;
      // Multi-stop neutral gradient (white -> light grey -> mid grey -> dark grey -> black)
      vec3 color1 = vec3(1.0);        // white
      vec3 color2 = vec3(0.85);       // light grey
      vec3 color3 = vec3(0.6);        // mid grey
      vec3 color4 = vec3(0.25);       // dark grey
      vec3 color5 = vec3(0.05);       // black
      vec3 gradColor;
      if (yGradient < 0.25) {
        gradColor = mix(color5, color4, yGradient / 0.25);
      } else if (yGradient < 0.5) {
        gradColor = mix(color4, color3, (yGradient - 0.25) / 0.25);
      } else if (yGradient < 0.75) {
        gradColor = mix(color3, color2, (yGradient - 0.5) / 0.25);
      } else {
        gradColor = mix(color2, color1, (yGradient - 0.75) / 0.25);
      }
      // Add fresnel and specular for glassy look
      gradColor = mix(gradColor, vec3(1.0), fresnel * 0.5);
      gradColor += vec3(specular) * 0.25;
      gradColor *= (1.0 - noiseVal);
      // Subtle edge glow
      float edge = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
      edge = smoothstep(0.3, 1.0, edge);
      gradColor += vec3(1.0) * edge * 0.08;
      // Final output
      gl_FragColor = vec4(gradColor, 0.92); // slightly transparent
    }
  `;

  // Update the time uniform on each frame
  useFrame(({ clock }) => {
    if (!sphereRef.current) return;
    
    // Base subtle rotation
    sphereRef.current.rotation.x = clock.getElapsedTime() * 0.1;
    sphereRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    
    // Update shader uniforms
    uniforms.time.value = clock.getElapsedTime();
    uniforms.pulseIntensity.value = isProcessing 
      ? 0.8 + Math.sin(clock.getElapsedTime() * 5) * 0.2 
      : 0.5 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    
    // If processing, add pulsing effect
    if (isProcessing) {
      const pulse = Math.sin(clock.getElapsedTime() * 5) * 0.05 + 1;
      sphereRef.current.scale.set(pulse, pulse, pulse);
    } else {
      // Subtle breathing animation when idle
      const breathe = Math.sin(clock.getElapsedTime() * 0.5) * 0.02 + 1;
      sphereRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
      
      {/* Additional outer glow sphere */}
      <mesh>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#cccccc"
          emissiveIntensity={0.18}
          transparent={true}
          opacity={0.09}
        />
      </mesh>
    </mesh>
  );
};

// Fallback component for when the 3D scene is loading
const Fallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center p-4">Loading 3D visualization...</div>
  </div>
);

// Simple error boundary for Three.js rendering issues
class ThreeErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center p-4 text-red-500">Failed to load 3D visualization</div>;
    }
    return this.props.children;
  }
}

// Main component that wraps the Canvas and the sphere
const Sphere3D: React.FC<SphereProps> = ({ isProcessing }) => {
  // Make sure THREE is accessible on window
  useEffect(() => {
    if (!window.THREE) {
      window.THREE = THREE;
      console.log("THREE initialized in component:", THREE.REVISION);
    }
  }, []);

  return (
    <div className="w-full h-full min-h-[300px]">
      <ThreeErrorBoundary>
        <Canvas 
          camera={{ position: [0, 0, 3.5], fov: 50 }}
          dpr={[1, 2]} 
          gl={{ 
            antialias: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            alpha: true
          }}
        >
          {/* Dark environment for reflection */}
          <color attach="background" args={['#000000']} />
          
          {/* Subtle lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <pointLight position={[-10, -10, -5]} intensity={0.2} color="#888888" />
          
          <AnimatedSphere isProcessing={isProcessing} />
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
};

export default Sphere3D;
