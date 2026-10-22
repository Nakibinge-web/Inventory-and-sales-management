import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * ThreeInventoryCanvas
 * High-performance, interactive 3D digital inventory sculpture rendered with Three.js.
 * Features a glowing central stock core, orbiting isometric stock crates,
 * dual cybernetic orbital rings, a live transaction particle constellation,
 * and mouse-drag / parallax interactivity.
 */
export default function ThreeInventoryCanvas({ className = '' }) {
  const mountRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.5);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.8);
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    const pointLightCyan = new THREE.PointLight(0x38bdf8, 3.5, 12);
    pointLightCyan.position.set(0, 0, 0);
    scene.add(pointLightCyan);

    const pointLightAmber = new THREE.PointLight(0xfbbf24, 2.0, 10);
    pointLightAmber.position.set(3, 2, 2);
    scene.add(pointLightAmber);

    // Master container for rotation
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 4. Central Inventory Vault (Holographic Cube & Inner Core)
    const centralGroup = new THREE.Group();
    masterGroup.add(centralGroup);

    // Translucent outer crystal box
    const outerBoxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const outerBoxMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
    });
    const outerBox = new THREE.Mesh(outerBoxGeo, outerBoxMat);
    centralGroup.add(outerBox);

    // Glowing edge wireframe for central box
    const outerEdgesGeo = new THREE.EdgesGeometry(outerBoxGeo);
    const outerEdgesMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      linewidth: 1.5,
    });
    const outerEdges = new THREE.LineSegments(outerEdgesGeo, outerEdgesMat);
    centralGroup.add(outerEdges);

    // Inner wireframe nucleus (Icosahedron)
    const innerNucleusGeo = new THREE.IcosahedronGeometry(0.65, 1);
    const innerNucleusMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const innerNucleus = new THREE.Mesh(innerNucleusGeo, innerNucleusMat);
    centralGroup.add(innerNucleus);

    // 5. Orbiting Satellite Stock Crates (Representing Inventory Units)
    const satelliteConfigs = [
      { color: 0x10b981, edgeColor: 0x6ee7b7, dist: 2.6, speed: 0.9, phase: 0, scale: 0.5 }, // Emerald / Restock
      { color: 0xf59e0b, edgeColor: 0xfcd34d, dist: 2.7, speed: 0.7, phase: (Math.PI * 2) / 5, scale: 0.46 }, // Amber / POS
      { color: 0x06b6d4, edgeColor: 0x67e8f9, dist: 2.8, speed: 0.85, phase: (Math.PI * 4) / 5, scale: 0.52 }, // Cyan / Cloud
      { color: 0xbe123c, edgeColor: 0xfb7185, dist: 2.5, speed: 1.1, phase: (Math.PI * 6) / 5, scale: 0.44 }, // Burgundy / Audit
      { color: 0x6366f1, edgeColor: 0xa5b4fc, dist: 2.9, speed: 0.75, phase: (Math.PI * 8) / 5, scale: 0.48 }, // Indigo / Multi-store
    ];

    const satellites = satelliteConfigs.map((cfg) => {
      const satGroup = new THREE.Group();
      masterGroup.add(satGroup);

      const geo = new THREE.BoxGeometry(cfg.scale, cfg.scale, cfg.scale);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.25,
        metalness: 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: cfg.edgeColor });
      const edge = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edge);

      satGroup.add(mesh);

      return {
        group: satGroup,
        mesh,
        dist: cfg.dist,
        speed: cfg.speed,
        phase: cfg.phase,
        tilt: (Math.random() - 0.5) * 0.8,
      };
    });

    // 6. Dual Cybernetic Orbital Rings (Supply Chain Trajectories)
    const ring1Geo = new THREE.TorusGeometry(2.8, 0.02, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.1, 0.016, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 3;
    masterGroup.add(ring2);

    // 7. Transaction Data Particle Cloud (Real-Time Ledger Constellation)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xfbbf24), // Gold
      new THREE.Color(0x34d399), // Emerald
      new THREE.Color(0xffffff), // White
      new THREE.Color(0xfb7185), // Rose
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const pColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // 8. Interactive Mouse Movement & Drag Interaction
    let targetRotationX = 0.2;
    let targetRotationY = 0.4;
    let currentRotationX = 0.2;
    let currentRotationY = 0.4;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      if (isDraggingRef.current) {
        const deltaX = (e.clientX - pointerPosRef.current.x) * 0.008;
        const deltaY = (e.clientY - pointerPosRef.current.y) * 0.008;
        targetRotationY += deltaX;
        targetRotationX += deltaY;
        rotationVelocityRef.current = { x: deltaY, y: deltaX };
        pointerPosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        targetRotationX = y * 0.7;
        targetRotationY = x * 0.9;
      }
    };

    const onPointerDown = (e) => {
      isDraggingRef.current = true;
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      rotationVelocityRef.current = { x: 0, y: 0 };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // 9. Resize Handling via ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Ambient self-rotation
      if (!isDraggingRef.current) {
        targetRotationY += 0.0035;
      }

      // Smooth interpolation (lerp)
      currentRotationX += (targetRotationX - currentRotationX) * 0.06;
      currentRotationY += (targetRotationY - currentRotationY) * 0.06;

      masterGroup.rotation.x = currentRotationX;
      masterGroup.rotation.y = currentRotationY;

      // Animate central core
      centralGroup.rotation.x = elapsed * 0.35;
      centralGroup.rotation.y = elapsed * 0.5;
      innerNucleus.rotation.x = -elapsed * 0.7;
      innerNucleus.rotation.z = elapsed * 0.45;

      // Dynamic light breathing
      pointLightCyan.intensity = 2.8 + Math.sin(elapsed * 2.2) * 1.0;
      pointLightAmber.intensity = 1.6 + Math.cos(elapsed * 1.8) * 0.8;

      // Animate orbiting satellites
      satellites.forEach((sat) => {
        const angle = elapsed * sat.speed + sat.phase;
        const x = Math.cos(angle) * sat.dist;
        const z = Math.sin(angle) * sat.dist;
        const y = Math.sin(angle * 1.5 + sat.phase) * 0.6 + sat.tilt;

        sat.group.position.set(x, y, z);
        sat.mesh.rotation.x += 0.015;
        sat.mesh.rotation.y += 0.02;
      });

      // Animate rings
      ring1.rotation.z = elapsed * 0.2;
      ring2.rotation.z = -elapsed * 0.25;

      // Animate particles swirl
      particles.rotation.y = -elapsed * 0.06;
      particles.rotation.x = Math.sin(elapsed * 0.08) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);

      // Recursive disposal of Three.js resources
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`sp-three-canvas-wrap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
      }}
      title="Interactive 3D Inventory Core — Drag or hover to inspect"
      aria-label="Interactive 3D StockPro Inventory and Real-Time Commerce Simulation"
    >
      {/* Floating HUD Badges Overlay */}
      <div className="sp-three-hud-pill sp-three-hud-top" aria-hidden="true">
        <span className="sp-three-hud-dot" />
        <span>Live Stock Sync Active</span>
      </div>

      <div className="sp-three-hud-pill sp-three-hud-bottom" aria-hidden="true">
        <span className="sp-three-hud-pulse" />
        <span>100% Audit Precision</span>
      </div>

      {/* Interaction Hint */}
      <div
        className={`sp-three-hint ${isHovered ? 'visible' : ''}`}
        aria-hidden="true"
      >
        <span>Drag to rotate 3D core</span>
      </div>
    </div>
  );
}
