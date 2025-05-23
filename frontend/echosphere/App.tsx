import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import SphereAnimation from './components/SphereAnimation';
import WaveDistortionSphere from './components/WaveDistortionSphere';
import './App.css';

// Debug logging
console.log('App component loaded');

function App() {
  console.log('App component rendering');
  
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [audioError, setAudioError] = useState(false);
  const [canvasError, setCanvasError] = useState(false);

  // Initialize audio context when user enables audio
  const handleEnableAudio = () => {
    console.log('Audio enable requested');
    if (!audioEnabled) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioAnalyser = context.createAnalyser();
        audioAnalyser.fftSize = 64;
        
        if (audioRef.current) {
          try {
            const source = context.createMediaElementSource(audioRef.current);
            source.connect(audioAnalyser);
            audioAnalyser.connect(context.destination);
            audioRef.current.play().catch(err => {
              console.warn("Audio play error:", err);
              setIsSpeaking(true); // Fallback to simulation mode
            });
          } catch (err) {
            console.warn("Audio setup error:", err);
            setIsSpeaking(true); // Fallback to simulation mode
          }
        }
        
        setAudioContext(context);
        setAnalyser(audioAnalyser);
        setAudioEnabled(true);
        
        // Start audio analysis loop
        const dataArray = new Float32Array(audioAnalyser.frequencyBinCount);
        
        const analyzeAudio = () => {
          if (analyser) {
            try {
              analyser.getFloatTimeDomainData(dataArray);
              setAudioData(dataArray);
              
              // Detect if "speaking" based on audio energy
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += Math.abs(dataArray[i]);
              }
              const avgAudioLevel = sum / dataArray.length;
              setIsSpeaking(avgAudioLevel > 0.05);
            } catch (err) {
              console.warn("Audio analysis error:", err);
            }
            
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
          }
        };
        
        analyzeAudio();
      } catch (err) {
        console.error("Audio context creation error:", err);
        setIsSpeaking(true); // Fallback to simulation mode
      }
    } else {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (err) {
          console.warn("Audio pause error:", err);
        }
      }
      if (audioContext) {
        try {
          audioContext.suspend();
        } catch (err) {
          console.warn("Audio context suspend error:", err);
        }
      }
      cancelAnimationFrame(animationFrameRef.current);
      setAudioEnabled(false);
      setIsSpeaking(false);
    }
  };
  
  // Toggle speaking state manually for demonstration
  const toggleSpeaking = () => {
    console.log('Speaking toggle requested');
    if (!audioEnabled) {
      setIsSpeaking(!isSpeaking);
    }
  };
  
  // Handle audio load events
  useEffect(() => {
    console.log('Setting up audio event listeners');
    const handleAudioLoaded = () => {
      console.log("Audio file loaded successfully");
    };
    
    const handleAudioError = (e: ErrorEvent) => {
      console.warn("Audio file load error:", e);
      setAudioError(true);
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('canplaythrough', handleAudioLoaded);
      audioRef.current.addEventListener('error', handleAudioError as any);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplaythrough', handleAudioLoaded);
        audioRef.current.removeEventListener('error', handleAudioError as any);
      }
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    console.log('Setting up cleanup effect');
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContext) {
        audioContext.close().catch(err => console.warn("Audio context close error:", err));
      }
    };
  }, [audioContext]);

  // Fallback to simulation mode if audio fails to load
  useEffect(() => {
    if (audioError) {
      console.log("Audio failed to load, enabling simulation mode");
      setIsSpeaking(true);
    }
  }, [audioError]);

  // Handle canvas errors
  const handleCanvasError = (error: Error) => {
    console.error('Canvas error:', error);
    setCanvasError(true);
  };

  // Render a fallback if canvas fails
  if (canvasError) {
    return (
      <div className="error-container">
        <h1>Neura AI Interface</h1>
        <p>Unable to initialize 3D rendering. Please check if WebGL is enabled in your browser.</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  console.log('Rendering App component JSX');
  
  return (
    <div className="app-container">
      <div className="canvas-container">
        {/* Wrap Canvas in error boundary */}
        <ErrorBoundary onError={handleCanvasError}>
          <Canvas shadows onCreated={state => console.log('Canvas created:', state)}>
            <color attach="background" args={['#111']} />
            
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls enableZoom={true} enablePan={false} />
            
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
              audioData={audioData}
              isSpeaking={isSpeaking}
              color="#cccccc"
            />
            
            {/* Inner sphere with gradient pulse effects */}
            <SphereAnimation 
              position={[0, 0, 0]} 
              audioReactive={audioEnabled} 
              touchInteractive={true} 
            />
            
            <Environment preset="city" />
            
            <EffectComposer>
              <Bloom 
                intensity={1.5} 
                luminanceThreshold={0.2} 
                luminanceSmoothing={0.9} 
              />
              <ChromaticAberration offset={[0.0005, 0.0005]} />
            </EffectComposer>
          </Canvas>
        </ErrorBoundary>
      </div>
      
      <div className="controls">
        <h1>Neura AI Interface</h1>
        <p>3D sphere visualization with wave-like distortions, gradient pulse colors, and interactive effects</p>
        
        <div className="control-buttons">
          <button 
            onClick={handleEnableAudio}
            className={audioEnabled ? 'active' : ''}
            disabled={audioError}
          >
            {audioEnabled ? 'Disable Audio' : 'Enable Audio Reactivity'}
            {audioError && ' (Unavailable)'}
          </button>
          
          <button 
            onClick={toggleSpeaking}
            className={isSpeaking ? 'active' : ''}
            disabled={audioEnabled}
          >
            {isSpeaking ? 'Stop Speaking Effect' : 'Simulate Speaking'}
          </button>
          
          <p className="instructions">
            <strong>Interactions:</strong><br />
            • Click/tap the sphere to activate<br />
            • Hover to see subtle effects<br />
            • Drag to rotate the view<br />
            • Pinch/scroll to zoom<br />
            • Enable audio for reactive effects
          </p>
        </div>
        
        <audio 
          ref={audioRef} 
          src="/ambient-technology.mp3" 
          loop 
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> {
  componentDidCatch(error: Error) {
    console.error('Error boundary caught:', error);
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

export default App;
