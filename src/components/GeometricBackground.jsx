import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const GeometricBackground = () => {
  const mountRef = useRef(null);
  const horizontalLines = useRef([]);
  const verticalLines = useRef([]);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Line creation functions
    const createWaveLine = (type, color) => {
      const points = [];
      const originalPositions = [];
      const range = type === 'horizontal' ? 40 : 30;

      for (let p = -range; p <= range; p += 0.5) {
        if (type === 'horizontal') {
          points.push(new THREE.Vector3(p, 0, 0));
          originalPositions.push(p);
        } else {
          points.push(new THREE.Vector3(0, p, 0));
          originalPositions.push(p);
        }
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      
      return {
        line: new THREE.Line(geometry, material),
        geometry,
        originalPositions,
        type
      };
    };

    // Create groups and lines
    const horizontalGroup = new THREE.Group();
    const verticalGroup = new THREE.Group();

    // Horizontal lines
    for (let i = -3; i <= 3; i++) {
      const lineData = createWaveLine('horizontal', 0x1976d2);
      lineData.line.position.y = i * 3;
      horizontalGroup.add(lineData.line);
      horizontalLines.current.push(lineData);
    }

    // Vertical lines
    for (let j = -3; j <= 3; j++) {
      const lineData = createWaveLine('vertical', 0x4fc3f7);
      lineData.line.position.x = j * 3;
      verticalGroup.add(lineData.line);
      verticalLines.current.push(lineData);
    }

    scene.add(horizontalGroup, verticalGroup);

    // Animation logic
    let time = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.02;
      targetScrollY = window.scrollY;
      scrollY += (targetScrollY - scrollY) * 0.05;

      // Update horizontal lines
      horizontalLines.current.forEach(lineData => {
        const positions = lineData.geometry.attributes.position.array;
        lineData.originalPositions.forEach((origX, i) => {
          positions[i * 3 + 1] = Math.sin(origX * 0.8 + time * 1.2) * 1.5 +
            Math.cos(origX * 0.56 + time * 1.44) * 0.75 +
            scrollY * 0.03;
        });
        lineData.geometry.attributes.position.needsUpdate = true;
      });

      // Update vertical lines
      verticalLines.current.forEach(lineData => {
        const positions = lineData.geometry.attributes.position.array;
        lineData.originalPositions.forEach((origY, i) => {
          positions[i * 3] = Math.cos(origY * 1.2 + time * 1.5) * 1.2 +
            Math.sin(origY * 0.84 + time * 1.8) * 0.6 +
            scrollY * 0.03;
        });
        lineData.geometry.attributes.position.needsUpdate = true;
      });

      // Group rotation
      horizontalGroup.rotation.z = Math.sin(time * 0.1) * 0.02;
      verticalGroup.rotation.z = Math.cos(time * 0.1) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      renderer.dispose();
      scene.remove(horizontalGroup, verticalGroup);
      window.removeEventListener("resize", onResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none"
      }}
    />
  );
};

export default GeometricBackground;