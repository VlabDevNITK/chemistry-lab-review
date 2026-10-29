/**
 * scene.js
 * Three.js Orthographic 2D-Style Laboratory Environment:
 * - Orthographic Camera with fixed front-facing perspective
 * - Lightweight procedural laboratory bench, background, and soft illumination
 * - Responsive canvas resizing and memory cleanup
 */

import * as THREE from "three";

export function createLabScene(containerElement) {
  if (!containerElement) {
    throw new Error("Container element for Three.js canvas not found.");
  }

  const width = containerElement.clientWidth || 600;
  const height = containerElement.clientHeight || 400;

  // 1. Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f1f5f9"); // clean laboratory bench backdrop

  // 2. Orthographic Camera (Fixed 2D-Style perspective)
  const frustumSize = 11.5; // vertical height in Three.js world units
  const aspect = width / height;

  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    100
  );
  // Positioned looking directly at the laboratory setup at eye level
  camera.position.set(0, 2.5, 10);
  camera.lookAt(0, 2.5, 0);

  // 3. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Insert canvas behind guidance bar and magnifier overlays
  renderer.domElement.id = "simCanvas";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.zIndex = "1";
  const oldCanvas = containerElement.querySelector("#simCanvas");
  if (oldCanvas) oldCanvas.remove();
  containerElement.insertBefore(renderer.domElement, containerElement.firstChild);

  // 4. Illumination (Even, glare-free laboratory lighting)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
  keyLight.position.set(5, 10, 8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.4);
  fillLight.position.set(-6, 4, 6);
  scene.add(fillLight);

  // 5. Laboratory Bench Base (Tile & Table)
  const tableGroup = new THREE.Group();
  tableGroup.name = "labBench";

  // Bench surface
  const benchGeo = new THREE.BoxGeometry(16, 0.3, 4);
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // dark slate modern lab bench
    roughness: 0.6
  });
  const benchMesh = new THREE.Mesh(benchGeo, benchMat);
  benchMesh.position.set(0, -0.15, 0);
  tableGroup.add(benchMesh);

  // White porcelain contrast tile beneath titration flask (analytical chemistry standard)
  const tileGeo = new THREE.BoxGeometry(2.4, 0.04, 2.0);
  const tileMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15
  });
  const tileMesh = new THREE.Mesh(tileGeo, tileMat);
  tileMesh.position.set(-0.8, 0.02, 0);
  tileMesh.name = "contrastTile";
  tableGroup.add(tileMesh);

  scene.add(tableGroup);

  // 6. Responsive Resize Handler
  function handleResize() {
    const newWidth = containerElement.clientWidth;
    const newHeight = containerElement.clientHeight;
    if (!newWidth || !newHeight) return;

    const newAspect = newWidth / newHeight;
    camera.left = (-frustumSize * newAspect) / 2;
    camera.right = (frustumSize * newAspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  }

  window.addEventListener("resize", handleResize);

  // 7. Render Loop Manager
  let animationFrameId = null;
  let isRunning = false;
  const updateCallbacks = [];

  function startRenderLoop() {
    if (isRunning) return;
    isRunning = true;

    function render(time) {
      if (!isRunning) return;

      // Execute registered simulation animation callbacks
      for (let i = 0; i < updateCallbacks.length; i++) {
        updateCallbacks[i](time);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);
  }

  function stopRenderLoop() {
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function onUpdate(fn) {
    if (typeof fn === "function") {
      updateCallbacks.push(fn);
    }
  }

  function dispose() {
    stopRenderLoop();
    window.removeEventListener("resize", handleResize);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  return {
    scene,
    camera,
    renderer,
    startRenderLoop,
    stopRenderLoop,
    onUpdate,
    handleResize,
    dispose
  };
}
