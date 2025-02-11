import React, { useEffect } from 'react';
import * as THREE from 'three';

const GeometricBackground = () => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const lines = [];

    // Create a few lines
    for (let i = 0; i < 3; i++) {
      const points = [];
      points.push(new THREE.Vector3(-5, Math.random() * 10 - 5, 0));
      points.push(new THREE.Vector3(5, Math.random() * 10 - 5, 0));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      lines.push(line);
      scene.add(line);
    }

    camera.position.z = 10;

    const animate = () => {
      requestAnimationFrame(animate);
      lines.forEach((line, index) => {
        line.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01; // Subtle movement
      });
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
};

export default GeometricBackground; 