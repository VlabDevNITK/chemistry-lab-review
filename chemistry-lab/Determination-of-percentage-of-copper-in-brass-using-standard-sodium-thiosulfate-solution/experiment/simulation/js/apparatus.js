/**
 * apparatus.js
 * Procedural 2D-Style Laboratory Apparatus for Three.js:
 * - Burette (Stand, Retort Clamp, Graduated Scale, Meniscus, Rotatable Stopcock)
 * - Conical Flask (Erlenmeyer profile, White Tile Base, Dynamic Liquid & Color)
 * - Transfer Pipette with Suction Bulb
 * - Glass Funnel for burette filling
 * - Reagent Containers (EDTA, CaCO3 Standard, Water Sample, Buffer, EBT Indicator)
 * - Droplet Stream & Splash Effect
 */

import * as THREE from "three";

// ============================================================================
// Graduated Scale Texture Generator for Burette (0 to 50 mL)
// ============================================================================
export function createBuretteScaleTexture(totalVolume = 50) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background subtle guide
  ctx.strokeStyle = "#1e293b";
  ctx.fillStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "right";

  const topPadding = 60;
  const bottomPadding = 60;
  const usableHeight = canvas.height - topPadding - bottomPadding;
  const pxPerML = usableHeight / totalVolume;

  for (let ml = 0; ml <= totalVolume; ml++) {
    const y = topPadding + ml * pxPerML;

    // Major 5 mL and 10 mL ticks
    if (ml % 5 === 0) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, y);
      ctx.lineTo(240, y);
      ctx.stroke();

      ctx.fillText(ml.toString(), 125, y + 9);
    } else {
      // 1 mL ticks
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(170, y);
      ctx.lineTo(240, y);
      ctx.stroke();
    }

    // Sub-divisions (0.5 mL)
    if (ml < totalVolume) {
      const halfY = y + 0.5 * pxPerML;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(195, halfY);
      ctx.lineTo(240, halfY);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// ============================================================================
// Glass Material Factory
// ============================================================================
function createGlassMaterial(opacity = 0.4, color = 0xdff6ff) {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}

// ============================================================================
// Burette Assembly with Stand, Clamp, Liquid, Scale & Stopcock
// ============================================================================
export function createBuretteAssembly() {
  const group = new THREE.Group();
  group.name = "buretteAssembly";

  // Stand Base (Heavy cast iron retort base)
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.22, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  baseMesh.position.set(-1.8, 0.11, 0);
  group.add(baseMesh);

  // Chrome Stand Rod
  const rodMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 7.8, 32),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
  );
  rodMesh.position.set(-2.6, 4.0, 0);
  group.add(rodMesh);

  // Bosshead & Dual Clamp holding the burette at x = -0.8
  const clampArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 })
  );
  clampArm.rotation.z = Math.PI / 2;
  clampArm.position.set(-1.7, 4.8, 0);
  group.add(clampArm);

  const clampJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.35, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
  );
  clampJaw.position.set(-0.8, 4.8, 0);
  group.add(clampJaw);

  // Burette Glass Tube (0 to 50 mL graduated)
  // Tube center x = -0.8, total height ~ 5.5 units
  const tubeHeight = 5.5;
  const tubeOuterRadius = 0.12;
  const tubeInnerRadius = 0.095;
  const buretteCenterY = 4.2;

  const glassTubeGeo = new THREE.CylinderGeometry(tubeOuterRadius, tubeOuterRadius, tubeHeight, 32, 1, true);
  const glassTubeMesh = new THREE.Mesh(glassTubeGeo, createGlassMaterial(0.45));
  glassTubeMesh.position.set(-0.8, buretteCenterY, 0);
  group.add(glassTubeMesh);

  // Graduated Scale Label Cylinder overlay
  const scaleTexture = createBuretteScaleTexture(50);
  const scaleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(tubeOuterRadius + 0.002, tubeOuterRadius + 0.002, tubeHeight - 0.4, 32, 1, true),
    new THREE.MeshBasicMaterial({
      map: scaleTexture,
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  scaleMesh.position.set(-0.8, buretteCenterY + 0.1, 0);
  scaleMesh.rotation.y = -Math.PI / 2;
  group.add(scaleMesh);

  // Burette Liquid Column inside the tube
  // Max liquid height = tubeHeight - 0.5
  const maxLiquidHeight = tubeHeight - 0.5;
  const liquidGeo = new THREE.CylinderGeometry(tubeInnerRadius, tubeInnerRadius, maxLiquidHeight, 24);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd, // translucent clear EDTA aqueous solution
    transparent: true,
    opacity: 0.7,
    roughness: 0.1
  });
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidMesh.position.set(-0.8, buretteCenterY, 0);
  liquidMesh.name = "buretteLiquid";
  group.add(liquidMesh);

  // Curved Meniscus Disk at top of liquid
  const meniscusGeo = new THREE.CylinderGeometry(tubeInnerRadius, tubeInnerRadius, 0.04, 24);
  const meniscusMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.1
  });
  const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat);
  meniscusMesh.position.set(-0.8, buretteCenterY + maxLiquidHeight / 2, 0);
  meniscusMesh.name = "buretteMeniscus";
  group.add(meniscusMesh);

  // Stopcock Assembly (T-Bore Stopcock at bottom of burette)
  const stopcockY = buretteCenterY - tubeHeight / 2 - 0.2;
  const valveBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 })
  );
  valveBarrel.rotation.z = Math.PI / 2;
  valveBarrel.position.set(-0.8, stopcockY, 0);
  group.add(valveBarrel);

  // Rotatable Stopcock Plug / Handle
  const stopcockHandle = new THREE.Group();
  stopcockHandle.name = "stopcockHandle";
  stopcockHandle.position.set(-0.8, stopcockY, 0);

  const plugPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }) // red handle for high visibility
  );
  plugPin.rotation.x = Math.PI / 2;
  stopcockHandle.add(plugPin);

  const plugTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.25, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c })
  );
  plugTab.position.set(0, 0, 0.26);
  stopcockHandle.add(plugTab);

  group.add(stopcockHandle);

  // Tapered Delivery Tip
  const tipMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.02, 0.5, 16),
    createGlassMaterial(0.6)
  );
  tipMesh.position.set(-0.8, stopcockY - 0.35, 0);
  group.add(tipMesh);

  // Tip orifice coordinate (where droplets emanate)
  const tipEmanationPoint = new THREE.Vector3(-0.8, stopcockY - 0.6, 0);

  // Helper function to update burette liquid level from volume (0.0 to 50.0 mL)
  function setBuretteReading(readingML) {
    const clampedML = Math.max(0, Math.min(50, readingML));
    const fractionRemaining = (50 - clampedML) / 50;
    const currentHeight = maxLiquidHeight * fractionRemaining;

    if (currentHeight > 0.01) {
      liquidMesh.scale.y = fractionRemaining;
      const bottomY = buretteCenterY - maxLiquidHeight / 2;
      liquidMesh.position.y = bottomY + currentHeight / 2;
      liquidMesh.visible = true;

      meniscusMesh.position.y = bottomY + currentHeight;
      meniscusMesh.visible = true;
    } else {
      liquidMesh.visible = false;
      meniscusMesh.visible = false;
    }
  }

  // Set stopcock rotation: 0 = closed (horizontal), Math.PI / 2 = open (vertical)
  function setStopcockOpen(isOpen) {
    stopcockHandle.rotation.z = isOpen ? Math.PI / 2 : 0;
  }

  // Initialize full (0.00 mL reading)
  setBuretteReading(0.0);
  setStopcockOpen(false);

  return {
    group,
    setBuretteReading,
    setStopcockOpen,
    tipEmanationPoint,
    stopcockHandle
  };
}

// ============================================================================
// Conical Flask (Erlenmeyer Flask) with Liquid and Swirl Motion
// ============================================================================
export function createConicalFlask() {
  const flaskGroup = new THREE.Group();
  flaskGroup.name = "conicalFlask";

  // Erlenmeyer Profile Lathe
  const points = [
    new THREE.Vector2(0.0, 0.0),      // bottom center
    new THREE.Vector2(0.85, 0.0),     // flat base edge
    new THREE.Vector2(0.95, 0.1),     // bottom corner curve
    new THREE.Vector2(0.32, 1.5),     // conical waist
    new THREE.Vector2(0.28, 1.8),     // neck start
    new THREE.Vector2(0.28, 2.3),     // top neck
    new THREE.Vector2(0.32, 2.35)     // beaded rim
  ];

  const flaskGeo = new THREE.LatheGeometry(points, 48);
  const flaskMesh = new THREE.Mesh(flaskGeo, createGlassMaterial(0.4));
  flaskMesh.position.set(0, 0, 0);
  flaskGroup.add(flaskMesh);

  // Graduated white markings on flask wall (50, 100, 150, 200, 250 mL)
  const flaskMarkingGeo = new THREE.RingGeometry(0.3, 0.32, 32);
  const flaskMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const ring1 = new THREE.Mesh(flaskMarkingGeo, flaskMarkingMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.set(0, 0.8, 0);
  flaskGroup.add(ring1);

  // Dynamic Liquid inside the flask
  // Lathe liquid geometry matching conical base
  function createLiquidGeometry(fillHeight) {
    const h = Math.max(0.05, Math.min(1.6, fillHeight));
    // Conical radius interpolation
    // at y=0, r=0.85; at y=1.5, r=0.32
    const topRadius = 0.85 - (h / 1.5) * (0.85 - 0.32);
    const liqPoints = [
      new THREE.Vector2(0.0, 0.02),
      new THREE.Vector2(0.83, 0.02),
      new THREE.Vector2(topRadius, h),
      new THREE.Vector2(0.0, h)
    ];
    return new THREE.LatheGeometry(liqPoints, 36);
  }

  const initialHeight = 0.45;
  let currentLiquidGeo = createLiquidGeometry(initialHeight);
  const liquidMaterial = new THREE.MeshStandardMaterial({
    color: 0x990033, // Default Wine Red
    transparent: true,
    opacity: 0.85,
    roughness: 0.2
  });
  const liquidMesh = new THREE.Mesh(currentLiquidGeo, liquidMaterial);
  liquidMesh.name = "flaskLiquid";
  flaskGroup.add(liquidMesh);

  // Surface Meniscus Ring
  const surfaceDiscGeo = new THREE.CircleGeometry(0.65, 32);
  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x990033,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1
  });
  const surfaceMesh = new THREE.Mesh(surfaceDiscGeo, surfaceMat);
  surfaceMesh.rotation.x = -Math.PI / 2;
  surfaceMesh.position.y = initialHeight;
  flaskGroup.add(surfaceMesh);

  // Position flask centered beneath burette
  flaskGroup.position.set(-0.8, 0.05, 0);

  // Method to update solution liquid color
  function setColor(hexColor) {
    const c = new THREE.Color(hexColor);
    liquidMaterial.color.copy(c);
    surfaceMat.color.copy(c);
  }

  // Method to update solution liquid volume
  function setVolume(volumeML) {
    // 10 mL standard = ~0.35 height; 100 mL sample = ~0.95 height; + titre up to 1.45
    const baseHeight = 0.2 + (volumeML / 150) * 1.1;
    const clampedH = Math.max(0.1, Math.min(1.5, baseHeight));

    liquidMesh.geometry.dispose();
    currentLiquidGeo = createLiquidGeometry(clampedH);
    liquidMesh.geometry = currentLiquidGeo;

    const topRadius = 0.85 - (clampedH / 1.5) * (0.85 - 0.32);
    surfaceMesh.scale.set(topRadius / 0.65, topRadius / 0.65, 1);
    surfaceMesh.position.y = clampedH;
  }

  // Swirl Animation State
  let isSwirling = false;
  let swirlTime = 0;

  function updateSwirl(delta) {
    if (isSwirling) {
      swirlTime += delta * 12;
      flaskGroup.rotation.z = Math.sin(swirlTime) * 0.08;
      flaskGroup.position.x = -0.8 + Math.cos(swirlTime) * 0.1;
      surfaceMesh.rotation.z = swirlTime * 2;
    } else {
      flaskGroup.rotation.z = THREE.MathUtils.lerp(flaskGroup.rotation.z, 0, 0.1);
      flaskGroup.position.x = THREE.MathUtils.lerp(flaskGroup.position.x, -0.8, 0.1);
    }
  }

  function setSwirling(active) {
    isSwirling = active;
  }

  return {
    group: flaskGroup,
    setColor,
    setVolume,
    setSwirling,
    updateSwirl
  };
}

// ============================================================================
// Droplet Particle Generator
// ============================================================================
export function createDropletSystem(scene, tipOrigin) {
  const droplets = [];
  const dropletGeo = new THREE.SphereGeometry(0.035, 12, 12);
  const dropletMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.8
  });

  const pool = [];
  const maxDroplets = 20;
  for (let i = 0; i < maxDroplets; i++) {
    const d = new THREE.Mesh(dropletGeo, dropletMat);
    d.visible = false;
    scene.add(d);
    pool.push(d);
  }

  let spawnTimer = 0;

  function spawnDroplet() {
    const d = pool.find(item => !item.visible);
    if (!d) return;

    d.position.copy(tipOrigin);
    d.visible = true;
    droplets.push({
      mesh: d,
      vy: -0.05
    });
  }

  function update(delta, isOpen, flowRateMultiplier = 1.0) {
    if (isOpen) {
      spawnTimer += delta * 6 * flowRateMultiplier;
      if (spawnTimer >= 1.0) {
        spawnDroplet();
        spawnTimer = 0;
      }
    }

    // Target y position inside the flask
    const flaskSurfaceY = 0.9;

    for (let i = droplets.length - 1; i >= 0; i--) {
      const drop = droplets[i];
      drop.vy -= 9.8 * delta * 0.15; // downward gravity acceleration
      drop.mesh.position.y += drop.vy;

      // When droplet reaches liquid in flask
      if (drop.mesh.position.y <= flaskSurfaceY) {
        drop.mesh.visible = false;
        droplets.splice(i, 1);
      }
    }
  }

  function reset() {
    droplets.forEach(d => { d.mesh.visible = false; });
    droplets.length = 0;
    spawnTimer = 0;
  }

  return { update, reset };
}

// ============================================================================
// Transfer Pipette with Bulb
// ============================================================================
export function createPipette() {
  const pipetteGroup = new THREE.Group();
  pipetteGroup.name = "pipette";

  // Suction Bulb at top
  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }) // blue rubber bulb
  );
  bulbMesh.scale.set(1, 1.3, 1);
  bulbMesh.position.y = 2.6;
  pipetteGroup.add(bulbMesh);

  // Glass Pipette Shaft
  const tubeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.4, 16),
    createGlassMaterial(0.4)
  );
  tubeMesh.position.y = 1.3;
  pipetteGroup.add(tubeMesh);

  // Internal aspirating liquid
  const pipLiquidMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 1.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7 })
  );
  pipLiquidMesh.position.y = 1.2;
  pipLiquidMesh.name = "pipetteLiquid";
  pipLiquidMesh.visible = false;
  pipetteGroup.add(pipLiquidMesh);

  // Tapered Tip
  const tipMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.015, 0.4, 16),
    createGlassMaterial(0.6)
  );
  tipMesh.position.y = -0.05;
  pipetteGroup.add(tipMesh);

  // Resting position (off to the side)
  pipetteGroup.position.set(2.8, 1.2, 0);

  function setFilled(filled, colorHex = 0x93c5fd) {
    pipLiquidMesh.visible = filled;
    pipLiquidMesh.material.color.set(colorHex);
  }

  return {
    group: pipetteGroup,
    setFilled
  };
}

// ============================================================================
// Glass Funnel
// ============================================================================
export function createFunnel() {
  const funnelGroup = new THREE.Group();
  funnelGroup.name = "funnel";

  // Funnel Cone
  const coneMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.06, 0.6, 24, 1, true),
    createGlassMaterial(0.4)
  );
  coneMesh.position.y = 0.5;
  funnelGroup.add(coneMesh);

  // Funnel Stem
  const stemMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16, 1, true),
    createGlassMaterial(0.4)
  );
  stemMesh.position.y = -0.05;
  funnelGroup.add(stemMesh);

  // Resting position
  funnelGroup.position.set(1.5, 0.8, 0);

  return { group: funnelGroup };
}

// ============================================================================
// Labeled Reagent Beakers & Dropper Bottles
// ============================================================================
export function createReagentContainer(label, colorHex, xPos, isBottle = false) {
  const container = new THREE.Group();
  container.position.set(xPos, 0, 0);

  if (isBottle) {
    // Dropper Bottle (for Indicator / Buffer)
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 }) // amber/brown laboratory reagent bottle
    );
    bottleBody.position.y = 0.4;
    container.add(bottleBody);

    // Dropper Cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    cap.position.y = 0.95;
    container.add(cap);
  } else {
    // Glass Beaker
    const beakerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.3, 0.85, 24),
      createGlassMaterial(0.45)
    );
    beakerBody.position.y = 0.42;
    container.add(beakerBody);

    // Liquid in beaker
    const beLiq = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.28, 0.55, 24),
      new THREE.MeshStandardMaterial({ color: colorHex, transparent: true, opacity: 0.75 })
    );
    beLiq.position.y = 0.3;
    container.add(beLiq);
  }

  // Label Texture on Container
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#089b93";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, 128, 72);

  const labelTex = new THREE.CanvasTexture(canvas);
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.25),
    new THREE.MeshBasicMaterial({ map: labelTex })
  );
  labelMesh.position.set(0, 0.4, 0.3);
  container.add(labelMesh);

  return container;
}
