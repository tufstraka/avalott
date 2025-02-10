import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Vector3 } from 'three';
import './css/home.css';

// CryptoModel component for the morphing coins
const CryptoModel = ({ scrollProgress }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      
      // Morphing effect based on scroll
      const currentShape = scrollProgress < 0.33 ? 'bitcoin' :
                          scrollProgress < 0.66 ? 'ethereum' : 'avax';
                          
      // Add morphing logic here based on currentShape
      if (currentShape === 'bitcoin') {
        meshRef.current.scale.set(1, 1, 1);
      } else if (currentShape === 'ethereum') {
        meshRef.current.scale.set(1.2, 1.2, 0.8);
      } else {
        meshRef.current.scale.set(0.8, 1.3, 0.8);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[2, 0, 0]}>
      <cylinderGeometry args={[1, 1, 0.2, 32]} />
      <meshStandardMaterial 
        color="#FFD700"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1}
      />
    </mesh>
  );
};

// Blockchain visualization component
const BlockchainStructure = ({ scrollProgress }) => {
  const groupRef = useRef();
  const blocks = 8;
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
      groupRef.current.position.y = Math.sin(scrollProgress * Math.PI) * 2;
    }
  });

  return (
    <group ref={groupRef} position={[-2, 0, 0]}>
      {[...Array(blocks)].map((_, i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos((i / blocks) * Math.PI * 2) * 2,
            Math.sin((i / blocks) * Math.PI * 2) * 2,
            0
          ]}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial 
            color="#4169E1"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// Particle system component
const Particles = () => {
  const particlesRef = useRef();
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00ffff"
        transparent
        opacity={0.6}
      />
    </points>
  );
};

// Main Scene component
const Scene = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useFrame(() => {
    setScrollProgress((prev) => (prev + 0.001) % 1);
  });

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 75 }}
      style={{
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
        height: '100vh',
        width: '100%'
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <CryptoModel scrollProgress={scrollProgress} />
      <BlockchainStructure scrollProgress={scrollProgress} />
      <Particles />
    </Canvas>
  );
};

// Main component with feature cards and about section
const Home = () => {
  return (
    <div className="home-container">
      <div className="main-section">
        <div className="feature-sidebar">
          {/* Feature Cards */}
          <div className="feature-card">
            <h3 className="feature-title">Decentralized Network</h3>
            <p className="feature-text">Secure and transparent transactions across a distributed network</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Smart Contracts</h3>
            <p className="feature-text">Automated, trustless execution of agreements</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Cross-Chain Integration</h3>
            <p className="feature-text">Seamless interaction between different blockchain networks</p>
          </div>
        </div>
        
        <div className="scene-container">
          <Scene />
        </div>
      </div>

      <div className="about-section">
        <div className="about-content">
          <h2 className="about-title">About Our Platform</h2>
          <p className="about-text">
            Our cutting-edge blockchain platform enables secure, transparent, and 
            efficient transactions across multiple networks. With support for 
            Bitcoin, Ethereum, and Avalanche, we provide a comprehensive solution 
            for all your blockchain needs.
          </p>
        </div>
        
        <div className="video-container">
          <div className="video-placeholder">
            Video Player Placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;