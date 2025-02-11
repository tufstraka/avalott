import React, { useEffect } from 'react';
import * as THREE from 'three';

const FeatureCard = ({ title, description, type }) => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(300, 300);
    document.getElementById(`feature-${type}`).appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 0.1, 0.5); // Example for a ticket
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 2;

    const animate = () => {
      requestAnimationFrame(animate);
      mesh.rotation.y += 0.01; // Rotate for effect
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      const element = document.getElementById(`feature-${type}`);
      if (element) {
        element.removeChild(renderer.domElement);
      }
    };
  }, [type]);

  return (
    <div id={`feature-${type}`} style={{ width: '300px', height: '300px' }}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default FeatureCard; 