import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import SphereAnimation from './SphereAnimation';
import WaveDistortionSphere from './WaveDistortionSphere';
import * as THREE from 'three';
import './EchoSphere.css';

interface EchoSphereProps {
  width?: string | number;
  height?: string | number;
  initialText?: string;
  showUI?: boolean;
  backgroundColor?: string;
  className?: string;
  onAnimationComplete?: () => void;
}

const EchoSphere: React.FC<EchoSphereProps> = ({
  width = '100%',
  height = '100%',
  initialText,
  showUI = false,
  backgroundColor = '#111',
  className = '',
  onAnimationComplete
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string>(initialText || '');
  const [canvasError, setCanvasError] = useState(false);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speaking effect when text changes
  useEffect(() => {
    if (currentText) {
      setIsSpeaking(true);
      
      // Auto-stop speaking after text would have been spoken (rough estimate)
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
      }
      
      const speakingDuration = Math.max(2000, currentText.length * 100); // Rough estimate
      speakingTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, speakingDuration);
    }
    
    return () => {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
      }
    };
  }, [currentText, onAnimationComplete]);

  // Handle canvas errors
  const handleCanvasError = (error: Error) => {
    console.error('Canvas error:', error);
    setCanvasError(true);
  };

  // Method to start sphere animation with new text
  const animateText = (text: string) => {
    setCurrentText(text);
  };

  // Stop the current animation
  const stopAnimation = () => {
    setIsSpeaking(false);
    setCurrentText('');
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
    }
  };

  // Expose methods to parent through window object
  useEffect(() => {
    // Make methods available globally
    window.echoSphereController = {
      animateText,
      stopAnimation
    };
    
    return () => {
      // Clean up when component unmounts
      delete window.echoSphereController;
    };
  }, []);

  // Sample sentences for UI demo
  const sampleSentences = [
    "Hello, how can I help you today?",
    "The quick brown fox jumps over the lazy dog.",
    "Artificial intelligence is transforming the world.",
    "Welcome to Neura, your digital companion.",
    "1234567890 !@#$%^&*() Special characters and numbers."
  ];

  // Render fallback if canvas errors
  if (canvasError) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        color: '#eee'
      }}>
        <div>
          <h2>3D Rendering Error</h2>
          <p>Unable to initialize the visualization.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`echo-sphere-container ${showUI ? 'with-ui' : ''} ${className}`}
      style={{
        width,
        height,
        backgroundColor: backgroundColor || 'var(--bg-color)'
      }}
    >
      <div className="echo-sphere-canvas">
        <ErrorBoundary onError={handleCanvasError}>
          <Canvas shadows>
            <color attach="background" args={[backgroundColor]} />
            
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls 
              enableZoom={true} 
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
            />
            
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize-width={1024} 
              shadow-mapSize-height={1024} 
            />
            
            {/* Main sphere with distortion effects */}
            <WaveDistortionSphere 
              position={[0, 0, 0]} 
              radius={1.5}
              isSpeaking={isSpeaking}
              color="#cccccc"
            />
            
            {/* Inner sphere with gradient pulse effects */}
            <SphereAnimation 
              position={[0, 0, 0]} 
              audioReactive={false} 
              touchInteractive={true} 
            />
            
            <Environment preset="city" />
            
            {/* Removed EffectComposer due to type compatibility issues */}
            {/* Added simple lighting instead */}
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <pointLight position={[-10, -10, -5]} color="#3366ff" intensity={0.2} />
          </Canvas>
        </ErrorBoundary>
      </div>
      
      {showUI && (
        <div className="echo-sphere-ui">
          <h1>Neura AI Interface</h1>
          <p>Glass sphere visualization with word-reactive wave distortions</p>
          
          <div className="echo-sphere-text-display">
            {currentText ? currentText.substring(0, 20) + (currentText.length > 20 ? '...' : '') : ''}
          </div>
          
          <div className="echo-sphere-controls">
            <button 
              onClick={stopAnimation}
              className="echo-sphere-button"
            >
              Stop Animation
            </button>
            
            <div className="echo-sphere-samples">
              <strong>Sample Sentences:</strong>
              {sampleSentences.map((sentence, index) => (
                <div 
                  key={index}
                  onClick={() => animateText(sentence)}
                  className="echo-sphere-sample-item"
                >
                  {sentence}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple error boundary for catching Canvas errors
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  
  render() {
    return this.props.children;
  }
}

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    echoSphereController: {
      animateText: (text: string) => void;
      stopAnimation: () => void;
    };
  }
}

export default EchoSphere;
