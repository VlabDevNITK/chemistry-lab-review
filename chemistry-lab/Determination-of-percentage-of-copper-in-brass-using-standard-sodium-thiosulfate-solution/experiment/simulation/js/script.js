// Percentage of Copper in Brass Estimation - Virtual Labs
// Uses Three.js, OrbitControls, and Tween.js

let scene, camera, renderer, controls;
let currentStep = 1;
let isPlaying = false;
let isRotating = false;
let currentTween = null;

// Reagents & Apparatus 3D meshes
let tableMesh, standBase, standRod, standClamp, buretteMesh, buretteLiquid, stopcockMesh;
let beakerMesh, beakerLiquid, heaterBody, heaterPlate;
let conicalFlaskMesh, flaskLiquid;
let volFlaskMesh, volLiquid;
let pipetteMesh, dropperMesh, spatulaMesh, washBottleMesh, testTubeRack;
let brassFoilContainer, brassFoilInBeaker = [], brassFoilInDish = [];
let liquidStream; // cylinder for pouring animation

// Particle systems
let gasParticlesGroup; // brown NO2 fumes
let dripParticles = []; // thiosulfate drips

// Materials
let glassMaterial, volLiquidMaterial, beakerLiquidMaterial, flaskLiquidMaterial, buretteLiquidMaterial;
let brassMaterial, tableMaterial, metalMaterial, standBaseMaterial, heaterPlateMaterial;

// Reagents Positions in 3D scene
const POSITIONS = {
  beaker: new THREE.Vector3(-1.8, -1.15, 0), // beaker bottom sitting on heater plate
  flask: new THREE.Vector3(0, -1.15, 0), // conical flask base sitting on top of burette stand platform
  volFlask: new THREE.Vector3(1.8, -1.4, 0),
  heater: new THREE.Vector3(-1.8, -1.3, 0), // heater base sitting on table
  burette: new THREE.Vector3(0, 0.4, 0),
  rack: new THREE.Vector3(-0.8, -1.4, -1.8),
  toolInactive: new THREE.Vector3(-2, -1.4, -1.0),
  spatulaRest: new THREE.Vector3(-2.4, -1.38, 0.4),
  dish: new THREE.Vector3(-3.0, -1.4, 0),
  hno3: new THREE.Vector3(-1.5, -1.4, -1.2),
  urea: new THREE.Vector3(-0.5, -1.4, -1.2),
  nh4oh: new THREE.Vector3(0.5, -1.4, -1.2),
  acetic: new THREE.Vector3(1.5, -1.4, -1.2),
  ki: new THREE.Vector3(2.5, -1.4, -1.2),
  starch: new THREE.Vector3(3.2, -1.4, -1.2),
  washBottle: new THREE.Vector3(2.8, -1.1, 0.5)
};

// Y-level values for liquid heights
const beakerLiquidBaseY = -1.4;
const volLiquidBaseY = -1.4;
const flaskLiquidBaseY = -1.15;
const buretteLiquidBaseY = 0.45;

// Chemical simulation variables
let variables = {
  weight: 1.5,      // g (range 1.0 - 2.0)
  hno3: 10.0,       // mL (range 5.0 - 15.0)
  urea: 1.0,        // g (range 0.5 - 1.5)
  nh4oh: 10.0,      // mL (range 5.0 - 15.0)
  acetic: 5.0,      // mL (range 2.0 - 10.0)
  ki: 10.0,         // mL (range 5.0 - 15.0)
  starch: 2.0,      // mL (range 1.0 - 5.0)
  thiosulfate: 0.0  // mL (range 0.0 - 25.0)
};

let trialVariations = [0.0, -0.05, 0.05];
let trialIndex = 1;
let completedTrials = [];

let experimentState = {
  brassAdded: false,
  nitricAcidAdded: false,
  boilingCompleted: false,
  nitrogenOxidesRemoved: false,
  ureaAdded: false,
  coolingCompleted: false,
  volumetricTransferCompleted: false,
  pipettingCompleted: false,
  ammoniumHydroxideAdded: false,
  aceticAcidAdded: false,
  potassiumIodideAdded: false,
  starchAdded: false,
  titrationStarted: false,
  endpointReached: false
};

let concordantValue = (1.5 * 70.0) / 6.354; // initial calculation for W = 1.5
let isEndpointReached = false;
let alertTimeout = null;
let labelsList = [];
let bubbleParticlesGroup;
let pipetteLiquidMaterial;

// ----------------------------------------------------
// GLB Model Loading and Integration
// ----------------------------------------------------
let glbBeakerModel, glbHotPlateModel, glbBuretteStandModel, glbConicalFlaskModel, glbVolFlaskModel, glbWashBottleModel;
let glbMeasuringCylinderModel, glbFunnelModel;
let isLoaded = false;

// 1. Helper to scale and center model
function alignModel(model, centerOption, targetHeight, targetWidth) {
  if (!model) return null;
  const wrapper = new THREE.Group();

  // Clean up background meshes
  model.traverse(child => {
    if (child.isLight || child.isCamera) {
      child.visible = false;
    }
    const name = child.name ? child.name.toLowerCase() : "";
    if (name.includes("plane") || name.includes("ground") || name.includes("floor") || name.includes("background") || name.includes("grid") || name.includes("sky")) {
      child.visible = false;
    }
    // Also hide built-in static liquid meshes inside flasks
    if (name.includes("liquid")) {
      child.visible = false;
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  let scaleFactor = 1;
  if (targetHeight) {
    scaleFactor = targetHeight / size.y;
  } else if (targetWidth) {
    scaleFactor = targetWidth / size.x;
  }

  model.scale.set(scaleFactor, scaleFactor, scaleFactor);

  // Recompute box after scaling
  box.setFromObject(model);
  box.getSize(size);
  box.getCenter(center);

  // Align origin of wrapper
  if (centerOption === 'bottom') {
    model.position.set(-center.x, -box.min.y, -center.z);
  } else {
    model.position.set(-center.x, -center.y, -center.z);
  }

  wrapper.add(model);
  return wrapper;
}

// 2. Adjust materials to look transparent/physical
function customizeModelMaterials(model, modelName) {
  if (!model) return;
  const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        if (child.material.map) {
          child.material.map.encoding = THREE.sRGBEncoding;
          child.material.map.anisotropy = maxAniso;
          child.material.map.needsUpdate = true;
        }

        if (modelName === 'beaker' || modelName === 'conical_flask' || modelName === 'volumetric_flask' || modelName === 'funnel') {
          // Replace with high-fidelity Physical glass material
          const oldMat = child.material;
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xe6f2ff,
            transparent: true,
            opacity: 1.0,
            roughness: 0.04,
            metalness: 0.0,
            transmission: 0.92,
            ior: 1.52,
            reflectivity: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            specularIntensity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true
          });

          // Preserve graduation lines / texture map if there is one
          if (oldMat.map) {
            glassMat.map = oldMat.map;
            glassMat.map.encoding = THREE.sRGBEncoding;
            glassMat.map.anisotropy = maxAniso;
          }
          child.material = glassMat;
        } else {
          // Non-glass models (metal stand, hot plate, plastic bottles)
          if (child.material) {
            child.material.envMapIntensity = 1.5;
            if (modelName === 'burette_stand') {
              child.material.metalness = 0.85;
              child.material.roughness = 0.15;
            } else if (modelName === 'hot_plate') {
              child.material.roughness = 0.25;
              child.material.metalness = 0.2;
            }
          }
        }
      }
    }
  });
}

const modelsToLoad = [
  { name: 'beaker', url: 'src/beaker.glb' },
  { name: 'hot_plate', url: 'src/hot_plate.glb' },
  { name: 'burette_stand', url: 'src/burette_stand.glb' },
  { name: 'conical_flask', url: 'src/conical_flask.glb' },
  { name: 'volumetric_flask', url: 'src/volumetric_flask.glb' },
  { name: 'wash_bottle', url: 'src/wash_bottle.glb' },
  { name: 'measuring_cylinder', url: 'src/measuring_cylinder.glb' },
  { name: 'funnel', url: 'src/a_funnel.glb' }
];

let hasLoadErrors = false;

function showCORSWarning() {
  const alertBox = document.getElementById('simulation_alert');
  if (alertBox) {
    alertBox.innerHTML = `<strong>Note:</strong> Browser blocked local 3D files (CORS policy under file:// protocol).<br/>` +
      `Fallen back to procedural models. To view high-quality 3D assets, run a local server (e.g. <code>python -m http.server</code>).`;
    alertBox.style.display = 'block';
    alertBox.style.backgroundColor = 'rgba(255, 243, 205, 0.95)';
    alertBox.style.border = '1.5px solid #ffc107';
    alertBox.style.color = '#856404';
  }
}

function loadAllModels(onComplete) {
  const totalModels = modelsToLoad.length;
  let loadedCount = 0;
  let progressMap = {};
  hasLoadErrors = false;

  modelsToLoad.forEach(m => progressMap[m.name] = 0);

  const loader = new THREE.GLTFLoader();

  modelsToLoad.forEach(modelInfo => {
    const loadUrl = (window.GLB_ASSETS && window.GLB_ASSETS[modelInfo.name])
      ? window.GLB_ASSETS[modelInfo.name]
      : modelInfo.url;

    loader.load(
      loadUrl,
      (gltf) => {
        if (modelInfo.name === 'beaker') glbBeakerModel = gltf.scene;
        else if (modelInfo.name === 'hot_plate') glbHotPlateModel = gltf.scene;
        else if (modelInfo.name === 'burette_stand') glbBuretteStandModel = gltf.scene;
        else if (modelInfo.name === 'conical_flask') glbConicalFlaskModel = gltf.scene;
        else if (modelInfo.name === 'volumetric_flask') glbVolFlaskModel = gltf.scene;
        else if (modelInfo.name === 'wash_bottle') glbWashBottleModel = gltf.scene;
        else if (modelInfo.name === 'measuring_cylinder') glbMeasuringCylinderModel = gltf.scene;
        else if (modelInfo.name === 'funnel') glbFunnelModel = gltf.scene;

        loadedCount++;
        progressMap[modelInfo.name] = 1.0;
        updateLoadingProgress();

        if (loadedCount === totalModels) {
          const loadingScreen = document.getElementById('loading_screen');
          if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
              loadingScreen.style.display = 'none';
            }, 400);
          }
          if (hasLoadErrors) {
            showCORSWarning();
          }
          onComplete();
        }
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          progressMap[modelInfo.name] = xhr.loaded / xhr.total;
        } else {
          progressMap[modelInfo.name] = 0.5;
        }
        updateLoadingProgress();
      },
      (error) => {
        console.error('Error loading ' + modelInfo.name, error);
        hasLoadErrors = true;
        loadedCount++;
        progressMap[modelInfo.name] = 1.0;
        updateLoadingProgress();
        if (loadedCount === totalModels) {
          const loadingScreen = document.getElementById('loading_screen');
          if (loadingScreen) loadingScreen.style.opacity = '0';
          setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
          }, 400);
          showCORSWarning();
          onComplete();
        }
      }
    );
  });

  function updateLoadingProgress() {
    let sumProgress = 0;
    Object.keys(progressMap).forEach(key => {
      sumProgress += progressMap[key];
    });
    let totalProgress = (sumProgress / totalModels) * 100;
    const percentEl = document.getElementById('loading_percentage');
    if (percentEl) {
      percentEl.innerText = Math.round(totalProgress) + '% loaded';
    }
  }
}

// ----------------------------------------------------
// Core Initialization
// ----------------------------------------------------

function startsim() {
  const container = document.querySelector('.section-canvas');
  const canvas = document.getElementById('simscreen');
  if (!canvas) return;

  // Scene setup - Dark slate lab studio background
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1.6, 5.2);

  // Renderer setup with ACES Filmic Tone Mapping & High-DPI support
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // PMREM Environment reflections for realistic glassware & metals
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x232d3f);

  const envLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
  envLight1.position.set(5, 10, 5);
  envScene.add(envLight1);

  const envLight2 = new THREE.DirectionalLight(0x8fa3bf, 0.8);
  envLight2.position.set(-5, 5, -5);
  envScene.add(envLight2);

  const envLight3 = new THREE.AmbientLight(0xffffff, 0.6);
  envScene.add(envLight3);

  const envMap = pmremGenerator.fromScene(envScene).texture;
  scene.environment = envMap;

  // OrbitControls setup
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below table
  controls.minDistance = 2.0;
  controls.maxDistance = 10.0;
  controls.target.set(0, -0.3, 0);

  // Balanced Studio Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.radius = 2;
  scene.add(dirLight);

  const dirLightLeft = new THREE.DirectionalLight(0xcde4f0, 0.4);
  dirLightLeft.position.set(-5, 5, 2);
  scene.add(dirLightLeft);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
  rimLight.position.set(0, 6, -5);
  scene.add(rimLight);

  const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
  frontLight.position.set(0, 2, 6);
  scene.add(frontLight);

  // Setup materials
  initMaterials();

  // Load models asynchronously, then create scene and set loaded flag
  loadAllModels(() => {
    createLabScene();
    isLoaded = true;
  });

  // Resize listener
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Start loop
  animate();
  updateStartButtonText();
}

function resizeCanvas() {
  const canvas = document.getElementById('simscreen');
  if (!canvas) return;
  const container = canvas.parentElement;
  const width = container.clientWidth || 550;

  // Keep height at stable 380px on desktop to avoid vertical grid stretching, and compute aspect ratio on mobile
  const height = (window.innerWidth > 768) ? 380 : (width * 350 / 550);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  renderer.setSize(width, height, true);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// ----------------------------------------------------
// Materials Setup
// ----------------------------------------------------
function initMaterials() {
  glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.65,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide
  });

  beakerLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa,
    transparent: true,
    opacity: 0.6,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.333,
    clearcoat: 0.5
  });

  volLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x29b6f6,
    transparent: true,
    opacity: 0.7,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.333,
    clearcoat: 0.5
  });

  flaskLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x29b6f6,
    transparent: true,
    opacity: 0.7,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.333,
    clearcoat: 0.5
  });

  buretteLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa,
    transparent: true,
    opacity: 0.5,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.333,
    clearcoat: 0.5
  });

  pipetteLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa,
    transparent: true,
    opacity: 0.6,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.333,
    clearcoat: 0.5
  });

  brassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37, // natural bright brass golden color
    metalness: 0.95,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
  });

  tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x222c3c, // Rich dark slate laboratory workbench surface
    roughness: 0.35,
    metalness: 0.15
  });

  metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd, // clean silver-whitish steel spatula color
    metalness: 0.95,
    roughness: 0.1
  });

  standBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x37474f,
    roughness: 0.6,
    metalness: 0.2
  });

  heaterPlateMaterial = new THREE.MeshStandardMaterial({
    color: 0x37474f,
    emissive: 0x000000,
    roughness: 0.7
  });
}

// ----------------------------------------------------
// 3D Scene Assembly (Procedural)
// ----------------------------------------------------
function createLabScene() {
  // 1. Table
  const tableGeo = new THREE.BoxGeometry(10, 0.4, 6);
  tableMesh = new THREE.Mesh(tableGeo, tableMaterial);
  tableMesh.position.y = -1.6;
  tableMesh.receiveShadow = true;
  scene.add(tableMesh);

  // 2. Heater (GLB Hot Plate / Procedural Fallback)
  if (glbHotPlateModel) {
    const hotPlateGroup = alignModel(glbHotPlateModel, 'bottom', 0.25);
    if (hotPlateGroup) {
      hotPlateGroup.position.copy(POSITIONS.heater);
      hotPlateGroup.position.y = -1.4; // sitting on the table
      scene.add(hotPlateGroup);

      // Set the child mesh as heaterPlate for the red glow emissive tween
      hotPlateGroup.traverse(child => {
        if (child.isMesh) {
          heaterPlate = child;
          if (!heaterPlate.material.emissive) {
            heaterPlate.material.emissive = new THREE.Color(0x000000);
          }
        }
      });
    }
  } else {
    // Procedural Fallback
    const heaterGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    const heater = new THREE.Mesh(heaterGeo, standBaseMaterial);
    heater.position.copy(POSITIONS.heater);
    heater.position.y += 0.1;
    scene.add(heater);

    const plateGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
    heaterPlate = new THREE.Mesh(plateGeo, heaterPlateMaterial);
    heaterPlate.position.copy(POSITIONS.heater);
    heaterPlate.position.y += 0.125;
    scene.add(heaterPlate);
  }

  // 3. Beaker (GLB Beaker / Procedural Fallback)
  if (glbBeakerModel) {
    customizeModelMaterials(glbBeakerModel, 'beaker');
    beakerMesh = alignModel(glbBeakerModel, 'center', 0.9);
    if (beakerMesh) {
      beakerMesh.position.copy(POSITIONS.beaker);
      beakerMesh.position.y += 0.45;
      scene.add(beakerMesh);
    }
  } else {
    // Procedural Fallback
    const beakerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 32);
    beakerMesh = new THREE.Mesh(beakerGeo, glassMaterial);
    beakerMesh.position.copy(POSITIONS.beaker);
    beakerMesh.position.y += 0.45;
    scene.add(beakerMesh);
  }

  const beakerLiquidGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.8, 32);
  beakerLiquid = new THREE.Mesh(beakerLiquidGeo, beakerLiquidMaterial);
  beakerLiquid.position.copy(POSITIONS.beaker);
  beakerLiquid.position.y += 0.4;
  beakerLiquid.scale.y = 0.001; // hidden initially
  beakerLiquid.visible = false;
  scene.add(beakerLiquid);

  // Brass Foil inside beaker (as flat sheets)
  for (let i = 0; i < 4; i++) {
    const foilGeo = new THREE.BoxGeometry(0.12, 0.005, 0.12);
    const foil = new THREE.Mesh(foilGeo, brassMaterial);
    foil.position.copy(POSITIONS.beaker);
    foil.position.y += 0.03;
    foil.position.x += (Math.random() - 0.5) * 0.2;
    foil.position.z += (Math.random() - 0.5) * 0.2;
    foil.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
    foil.visible = false;
    scene.add(foil);
    brassFoilInBeaker.push(foil);
  }

  // 4. Burette Stand (GLB Burette Stand / Procedural Fallback)
  if (glbBuretteStandModel) {
    const standGroup = alignModel(glbBuretteStandModel, 'bottom', 3.2);
    if (standGroup) {
      // Shifted so the model's clamp ring (offset within the GLB) lines up with the
      // burette at (0, y, 0) instead of the model's nominal (0, -1.4, -0.4) anchor.
      standGroup.position.set(-0.066, -1.4, 0);
      scene.add(standGroup);
    }
  } else {
    // Procedural Fallback
    const baseGeo = new THREE.BoxGeometry(1.2, 0.25, 0.8);
    standBase = new THREE.Mesh(baseGeo, standBaseMaterial);
    standBase.position.set(0, -1.275, -0.4);
    scene.add(standBase);

    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 16);
    standRod = new THREE.Mesh(rodGeo, metalMaterial);
    standRod.position.set(0, 0.2, -0.4);
    scene.add(standRod);

    const clampGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    standClamp = new THREE.Mesh(clampGeo, metalMaterial);
    standClamp.position.set(0, 0.6, -0.1);
    scene.add(standClamp);
  }

  // 5. Burette (procedural burette tube remains as we don't have GLB for it, but it fits stand clamp)
  const buretteGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 32);
  buretteMesh = new THREE.Mesh(buretteGeo, glassMaterial);
  buretteMesh.position.copy(POSITIONS.burette);
  scene.add(buretteMesh);

  // Liquid inside burette
  const buretteLiqGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 32);
  buretteLiquid = new THREE.Mesh(buretteLiqGeo, buretteLiquidMaterial);
  buretteLiquid.position.set(POSITIONS.burette.x, buretteLiquidBaseY, POSITIONS.burette.z);
  scene.add(buretteLiquid);

  // Stopcock
  const stopcockGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16);
  stopcockMesh = new THREE.Mesh(stopcockGeo, standBaseMaterial);
  stopcockMesh.position.set(POSITIONS.burette.x, -0.45, POSITIONS.burette.z);
  stopcockMesh.rotation.z = Math.PI / 2;
  scene.add(stopcockMesh);

  // 6. Conical Flask (GLB Conical Flask / Procedural Fallback)
  if (glbConicalFlaskModel) {
    customizeModelMaterials(glbConicalFlaskModel, 'conical_flask');
    conicalFlaskMesh = alignModel(glbConicalFlaskModel, 'bottom', 1.175);
    if (conicalFlaskMesh) {
      conicalFlaskMesh.position.copy(POSITIONS.flask);
      scene.add(conicalFlaskMesh);
    }
  } else {
    // Procedural Fallback
    const flaskBodyGeo = new THREE.CylinderGeometry(0.12, 0.45, 0.9, 32);
    const flaskNeckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 32);

    conicalFlaskMesh = new THREE.Group();
    const bodyMesh = new THREE.Mesh(flaskBodyGeo, glassMaterial);
    bodyMesh.position.y = 0.45;
    conicalFlaskMesh.add(bodyMesh);

    const neckMesh = new THREE.Mesh(flaskNeckGeo, glassMaterial);
    neckMesh.position.y = 1.0;
    conicalFlaskMesh.add(neckMesh);

    conicalFlaskMesh.position.copy(POSITIONS.flask);
    scene.add(conicalFlaskMesh);
  }

  const flaskLiqGeo = new THREE.CylinderGeometry(0.12, 0.42, 0.65, 32);
  flaskLiquid = new THREE.Mesh(flaskLiqGeo, flaskLiquidMaterial);
  flaskLiquid.position.copy(POSITIONS.flask);
  flaskLiquid.position.y += 0.33;
  flaskLiquid.scale.y = 0.001; // hidden initially
  flaskLiquid.visible = false;
  scene.add(flaskLiquid);

  // 7. Volumetric Flask (GLB Volumetric Flask / Procedural Fallback)
  if (glbVolFlaskModel) {
    customizeModelMaterials(glbVolFlaskModel, 'volumetric_flask');
    volFlaskMesh = alignModel(glbVolFlaskModel, 'bottom', 1.125);
    if (volFlaskMesh) {
      volFlaskMesh.position.copy(POSITIONS.volFlask);
      scene.add(volFlaskMesh);
    }
  } else {
    // Procedural Fallback
    const volBodyGeo = new THREE.CylinderGeometry(0.1, 0.38, 0.8, 32);
    const volNeckGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 32);
    volFlaskMesh = new THREE.Group();

    const volBody = new THREE.Mesh(volBodyGeo, glassMaterial);
    volBody.position.y = 0.4;
    volFlaskMesh.add(volBody);

    const volNeck = new THREE.Mesh(volNeckGeo, glassMaterial);
    volNeck.position.y = 0.9;
    volFlaskMesh.add(volNeck);

    volFlaskMesh.position.copy(POSITIONS.volFlask);
    scene.add(volFlaskMesh);
  }

  const volLiquidGeo = new THREE.CylinderGeometry(0.1, 0.35, 0.7, 32);
  volLiquid = new THREE.Mesh(volLiquidGeo, volLiquidMaterial);
  volLiquid.position.copy(POSITIONS.volFlask);
  volLiquid.position.y += 0.35;
  volLiquid.scale.y = 0.001;
  scene.add(volLiquid);

  // 7.b Props (Measuring Cylinder & Funnel - Optional, only if loaded)
  if (glbMeasuringCylinderModel) {
    const cylinderProp = alignModel(glbMeasuringCylinderModel, 'bottom', 1.0);
    if (cylinderProp) {
      cylinderProp.position.set(-0.8, -1.4, 0.6); // place on table
      scene.add(cylinderProp);
    }
  }

  if (glbFunnelModel) {
    customizeModelMaterials(glbFunnelModel, 'funnel');
    const funnelProp = alignModel(glbFunnelModel, 'bottom', 0.45);
    if (funnelProp) {
      funnelProp.position.set(1.1, -1.4, 0.6); // place on table
      scene.add(funnelProp);
    }
  }

  // 8. Reagents Dishes & Bottles in background
  createReagents();

  // 9. Interactive Tools (Pipette, Dropper, Spatula, Wash bottle)
  createTools();

  // 10. Liquid pouring streams & particle systems
  createPouringAndGasSystems();

  // Enable shadow-casting and receiving on all scene meshes
  enableShadows(scene);
}

function createReagents() {
  // Brass foils container (a hollow glass petri dish)
  const dishBase = new THREE.Group();
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.015, 32), glassMaterial);
  bottom.position.y = 0.0075;
  dishBase.add(bottom);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 32, 1, true), glassMaterial);
  rim.position.y = 0.035;
  dishBase.add(rim);

  dishBase.position.copy(POSITIONS.dish);
  scene.add(dishBase);

  // Shiny brass foil scraps in the dish
  for (let i = 0; i < 8; i++) {
    const foil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.005, 0.12), brassMaterial);
    foil.position.copy(POSITIONS.dish);
    foil.position.y += 0.03;
    foil.position.x += (Math.random() - 0.5) * 0.3;
    foil.position.z += (Math.random() - 0.5) * 0.3;
    foil.rotation.set(0, Math.random() * Math.PI, 0);
    scene.add(foil);
    brassFoilInDish.push(foil);
  }

  // Helper to make reagent bottles with text labels
  const reagentsList = [
    { name: "HNO3", label: "HNO₃ (1:1)", pos: POSITIONS.hno3, color: 0xe0f7fa },
    { name: "Urea", label: "Urea", pos: POSITIONS.urea, color: 0xffffff, isPowder: true },
    { name: "NH4OH", label: "NH₄OH", pos: POSITIONS.nh4oh, color: 0xe0f7fa },
    { name: "Acetic", label: "CH₃COOH", pos: POSITIONS.acetic, color: 0xe0f7fa },
    { name: "KI", label: "10% KI", pos: POSITIONS.ki, color: 0xe0f7fa },
    { name: "Starch", label: "Starch", pos: POSITIONS.starch, color: 0xffffff, isCloudy: true }
  ];

  reagentsList.forEach(r => {
    // Glass Bottle
    const bGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 24);
    const bCapGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);

    const bottle = new THREE.Group();
    const glassBody = new THREE.Mesh(bGeo, glassMaterial);
    glassBody.position.y = 0.3;
    bottle.add(glassBody);

    const cap = new THREE.Mesh(bCapGeo, standBaseMaterial);
    cap.position.y = 0.65;
    bottle.add(cap);

    // Liquid/Solid content inside
    let fillMaterial;
    if (r.isPowder) {
      fillMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
    } else {
      fillMaterial = new THREE.MeshPhysicalMaterial({
        color: r.color,
        transparent: true,
        opacity: r.isCloudy ? 0.6 : 0.4,
        roughness: 0.1,
        transmission: r.isCloudy ? 0.2 : 0.9
      });
    }

    const fillGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 24);
    const fill = new THREE.Mesh(fillGeo, fillMaterial);
    fill.position.y = 0.2;
    bottle.add(fill);

    // Create a label tag (white board)
    const labelGeo = new THREE.BoxGeometry(0.22, 0.15, 0.005);
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tag = new THREE.Mesh(labelGeo, labelMat);
    tag.position.set(0, 0.3, 0.201);
    bottle.add(tag);

    // Dynamic 3D tag text can be complex, so we will use absolute positioning
    bottle.position.copy(r.pos);
    scene.add(bottle);
  });

  // Add billboard labels for reagents, brass dish and burette
  /*createLabelSprite("HNO₃ (1:1)", POSITIONS.hno3.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("Urea", POSITIONS.urea.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("NH₄OH", POSITIONS.nh4oh.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("CH₃COOH", POSITIONS.acetic.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("10% KI", POSITIONS.ki.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("Starch", POSITIONS.starch.clone().add(new THREE.Vector3(0, 0.75, 0)));*/
  createLabelSprite("HNO₃ (1:1)", POSITIONS.hno3.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("Urea", POSITIONS.urea.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("NH₄OH", POSITIONS.nh4oh.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("CH₃COOH", POSITIONS.acetic.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("10% KI", POSITIONS.ki.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("Starch", POSITIONS.starch.clone().add(new THREE.Vector3(0, 0.75, 0)));
  createLabelSprite("Brass Sample", POSITIONS.dish.clone().add(new THREE.Vector3(0, 0.35, 0)));
  createLabelSprite("Na₂S₂O₃", POSITIONS.burette.clone().add(new THREE.Vector3(0.45, 1.25, 0)));


}

function createTools() {
  // 1. Pipette / Dropper (shared tool mesh depending on scale/shape)
  const pipBodyGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 16);
  const bulbGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 16);

  pipetteMesh = new THREE.Group();
  const stem = new THREE.Mesh(pipBodyGeo, glassMaterial);
  pipetteMesh.add(stem);

  const bulb = new THREE.Mesh(bulbGeo, standBaseMaterial);
  bulb.position.y = 0.45;
  pipetteMesh.add(bulb);

  // Liquid inside pipette tip
  const pipLiqGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 16);
  const pipLiquid = new THREE.Mesh(pipLiqGeo, pipetteLiquidMaterial);
  pipLiquid.position.y = -0.2;
  pipLiquid.name = "pipetteLiquid";
  pipLiquid.visible = false;
  pipetteMesh.add(pipLiquid);

  pipetteMesh.position.copy(POSITIONS.toolInactive);
  scene.add(pipetteMesh);

  // 2. Spatula (for scoop animations)
  const rodGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8);
  const scoopGeo = new THREE.BoxGeometry(0.06, 0.005, 0.15);
  spatulaMesh = new THREE.Group();

  const spatulaRod = new THREE.Mesh(rodGeo, metalMaterial);
  spatulaMesh.add(spatulaRod);

  const scoop = new THREE.Mesh(scoopGeo, metalMaterial);
  scoop.position.y = -0.4;
  spatulaMesh.add(scoop);

  // Powder on spatula scoop (for Urea)
  const powderGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const powder = new THREE.Mesh(powderGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
  powder.position.set(0, -0.38, 0);
  powder.name = "powder";
  powder.visible = false;
  spatulaMesh.add(powder);

  // Brass foils on spatula scoop (for Brass sample)
  const scoopFoilGeo = new THREE.BoxGeometry(0.05, 0.005, 0.05);
  const scoopFoil = new THREE.Mesh(scoopFoilGeo, brassMaterial);
  scoopFoil.position.set(0, -0.39, 0);
  scoopFoil.name = "scoopFoil";
  scoopFoil.visible = false;
  spatulaMesh.add(scoopFoil);

  spatulaMesh.position.copy(POSITIONS.spatulaRest);
  spatulaMesh.rotation.set(0, 0.3, Math.PI / 2);
  scene.add(spatulaMesh);

  // 3. Wash Bottle (GLB Wash Bottle / Procedural Fallback)
  if (glbWashBottleModel) {
    customizeModelMaterials(glbWashBottleModel, 'wash_bottle');
    washBottleMesh = alignModel(glbWashBottleModel, 'center', 0.95);
    if (washBottleMesh) {
      washBottleMesh.position.copy(POSITIONS.washBottle);
      scene.add(washBottleMesh);
    }
  } else {
    // Procedural Fallback
    const bottleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16);
    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const strawGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);

    washBottleMesh = new THREE.Group();
    const b = new THREE.Mesh(bottleGeo, glassMaterial);
    washBottleMesh.add(b);
    const c = new THREE.Mesh(capGeo, standBaseMaterial);
    c.position.y = 0.32;
    washBottleMesh.add(c);
    const s = new THREE.Mesh(strawGeo, metalMaterial);
    s.position.set(0.08, 0.45, 0);
    s.rotation.z = -0.3;
    washBottleMesh.add(s);

    washBottleMesh.position.copy(POSITIONS.washBottle);
    scene.add(washBottleMesh);
  }
}

function createPouringAndGasSystems() {
  // Thin cylinder stream representing liquid being poured
  const streamGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8);
  const streamMat = new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.8 });
  liquidStream = new THREE.Mesh(streamGeo, streamMat);
  liquidStream.visible = false;
  scene.add(liquidStream);

  // Gas particles group (for NO2 gas fumes)
  gasParticlesGroup = new THREE.Group();
  const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0x8b5a2b, // Brown NO2 gas
    transparent: true,
    opacity: 0.25
  });

  for (let i = 0; i < 40; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.set(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.8,
      (Math.random() - 0.5) * 0.5
    );
    particle.userData = {
      speedY: 0.01 + Math.random() * 0.015,
      speedX: (Math.random() - 0.5) * 0.005,
      speedZ: (Math.random() - 0.5) * 0.005,
      initialY: Math.random() * 0.8
    };
    gasParticlesGroup.add(particle);
  }
  gasParticlesGroup.position.copy(POSITIONS.beaker);
  gasParticlesGroup.position.y += 0.5; // sit above beaker liquid
  gasParticlesGroup.visible = false;
  scene.add(gasParticlesGroup);

  // Falling thiosulfate drops from burette tip
  const dripGeo = new THREE.SphereGeometry(0.015, 6, 6);
  const dripMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });

  for (let i = 0; i < 3; i++) {
    const drip = new THREE.Mesh(dripGeo, dripMat);
    drip.position.set(0, -0.5, 0); // burette tip y is around -0.5
    drip.visible = false;
    drip.userData = {
      active: false,
      speedY: 0.05 + i * 0.01,
      yStart: -0.5,
      yEnd: -1.35
    };
    scene.add(drip);
    dripParticles.push(drip);
  }

  // Bubbles particles group (for reactions/boiling/titration)
  bubbleParticlesGroup = new THREE.Group();
  const bubbleGeo = new THREE.SphereGeometry(0.015, 6, 6);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.1
  });

  for (let i = 0; i < 20; i++) {
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubble.position.set(
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.4
    );
    bubble.userData = {
      speedY: 0.005 + Math.random() * 0.005,
      speedX: (Math.random() - 0.5) * 0.002,
      speedZ: (Math.random() - 0.5) * 0.002,
      initialY: (Math.random() - 0.5) * 0.3
    };
    bubbleParticlesGroup.add(bubble);
  }
  bubbleParticlesGroup.visible = false;
  scene.add(bubbleParticlesGroup);
}

// ----------------------------------------------------
// UI variables & Sliders Binding (jQuery UI)
// ----------------------------------------------------
function varinit() {
  initSliders();
  updateSliderState();
  calculateChemistryOutputs();
  updateSceneState();
}

function initSliders() {
  const varsConfig = {
    weight: { min: 1.0, max: 2.0, step: 0.1, val: 1.5 },
    hno3: { min: 5.0, max: 15.0, step: 0.5, val: 10.0 },
    urea: { min: 0.5, max: 1.5, step: 0.1, val: 1.0 },
    nh4oh: { min: 5.0, max: 15.0, step: 0.5, val: 10.0 },
    acetic: { min: 2.0, max: 10.0, step: 0.5, val: 5.0 },
    ki: { min: 5.0, max: 15.0, step: 0.5, val: 10.0 },
    starch: { min: 1.0, max: 5.0, step: 0.5, val: 2.0 },
    thiosulfate: { min: 0.0, max: 25.0, step: 0.05, val: 0.0 }
  };

  Object.keys(varsConfig).forEach(key => {
    const config = varsConfig[key];

    $(`#${key}_slider`).slider({
      max: config.max,
      min: config.min,
      step: config.step,
      value: config.val,
      slide: function (event, ui) {
        $(`#${key}_spinner`).spinner("value", ui.value);
        onVariableChange(key, ui.value);
      }
    });

    $(`#${key}_spinner`).spinner({
      max: config.max,
      min: config.min,
      step: config.step,
      value: config.val,
      spin: function (event, ui) {
        $(`#${key}_slider`).slider("value", ui.value);
        onVariableChange(key, ui.value);
      },
      change: function (event, ui) {
        let val = parseFloat($(`#${key}_spinner`).val());
        if (isNaN(val)) val = config.val;
        val = Math.max(config.min, Math.min(config.max, val));
        $(`#${key}_spinner`).spinner("value", val);
        $(`#${key}_slider`).slider("value", val);
        onVariableChange(key, val);
      }
    });
  });
}

function onVariableChange(key, value) {
  clearValidationHighlights();
  variables[key] = value;

  // Dynamic endpoint calculation: percentage of copper = 70.0%
  // N_thio = 0.1 N
  // V_thio = (W * P_Cu) / (N_thio * 63.54) = (W * 70.0) / 6.354 = 11.0167 * W
  let kiFactor = 1.0;
  if (variables.ki < 10.0) {
    kiFactor = variables.ki / 10.0; // Incomplete reduction if KI < 10 mL
  }
  const offset = trialVariations[(trialIndex - 1) % 3];
  concordantValue = (variables.weight * 70.0) / 6.354 * kiFactor + offset;

  // Reset FSM states if variables are altered after the step was completed
  if (key === 'weight') experimentState.brassAdded = false;
  if (key === 'hno3') experimentState.nitricAcidAdded = false;
  if (key === 'urea') experimentState.ureaAdded = false;
  if (key === 'nh4oh') experimentState.ammoniumHydroxideAdded = false;
  if (key === 'acetic') experimentState.aceticAcidAdded = false;
  if (key === 'ki') experimentState.potassiumIodideAdded = false;
  if (key === 'starch') experimentState.starchAdded = false;

  calculateChemistryOutputs();
  updateSceneState();
}

function updateSceneState() {
  if (!scene) return;

  // 1. Update burette liquid height based on thiosulfate volume
  const buretteFraction = (25.0 - variables.thiosulfate) / 25.0;
  if (buretteLiquid) {
    buretteLiquid.scale.y = Math.max(0.001, buretteFraction);
    // initialTop is buretteLiquidBaseY + 2.2/2 = 0.45 + 1.1 = 1.55
    buretteLiquid.position.y = 1.55 - 1.1 * buretteFraction;
  }

  // 2. Update brass foils in dish and beaker visibility
  if (brassFoilInDish.length > 0) {
    brassFoilInDish.forEach(f => f.visible = (currentStep === 1));
  }
  if (brassFoilInBeaker.length > 0) {
    brassFoilInBeaker.forEach(f => {
      if (currentStep === 1) {
        f.visible = false;
        f.scale.setScalar(1.0);
      } else if (currentStep === 2) {
        f.visible = true;
        f.scale.setScalar(1.0);
      } else if (currentStep === 3) {
        f.visible = true;
        f.scale.setScalar(0.2); // dissolved partially
      } else {
        f.visible = false;
      }
    });
  }

  // 3. Update beaker liquid visibility, scale, and color
  if (beakerLiquid) {
    if (currentStep === 1) {
      beakerLiquid.visible = false;
      beakerLiquid.scale.y = 0.001;
    } else if (currentStep === 2 || currentStep === 3 || currentStep === 4) {
      beakerLiquid.visible = true;
      beakerLiquid.scale.y = variables.hno3 / 15.0;
    } else if (currentStep === 5) {
      beakerLiquid.visible = true;
      beakerLiquid.scale.y = (variables.hno3 + 2.0) / 15.0;
    } else if (currentStep === 6 || (currentStep === 7 && !experimentState.volumetricTransferCompleted)) {
      beakerLiquid.visible = true;
      beakerLiquid.scale.y = 0.95;
    } else {
      beakerLiquid.visible = false;
      beakerLiquid.scale.y = 0.001;
    }

    // Colors of beaker liquid
    if (beakerLiquidMaterial) {
      if (currentStep <= 2) {
        beakerLiquidMaterial.color.setHex(0xe0f7fa); // clear acidic
        beakerLiquidMaterial.opacity = 0.5;
        beakerLiquidMaterial.transmission = 0.85;
      } else if (currentStep === 3) {
        beakerLiquidMaterial.color.setRGB(0.05, 0.75, 0.55); // rich emerald green-teal
        beakerLiquidMaterial.opacity = 0.7;
        beakerLiquidMaterial.transmission = 0.75;
      } else if (currentStep >= 4) {
        beakerLiquidMaterial.color.setRGB(0.0, 0.65, 0.95); // rich copper nitrate blue-green
        beakerLiquidMaterial.opacity = 0.65;
        beakerLiquidMaterial.transmission = 0.8;
      }
    }
  }

  // 4. Update volumetric flask liquid visibility and scale
  if (volLiquid) {
    if (currentStep < 7 || (currentStep === 7 && !experimentState.volumetricTransferCompleted)) {
      volLiquid.visible = false;
      volLiquid.scale.y = 0.001;
    } else {
      volLiquid.visible = true;
      volLiquid.scale.y = 0.95;
    }
  }

  // 5. Update conical flask liquid visibility, scale, color, and materials
  if (flaskLiquid) {
    if (currentStep < 7 || (currentStep === 7 && !experimentState.pipettingCompleted)) {
      flaskLiquid.visible = false;
      flaskLiquid.scale.y = 0.001;
    } else if (currentStep === 7) {
      flaskLiquid.visible = true;
      flaskLiquid.scale.y = 0.35;
    } else if (currentStep === 8 || currentStep === 9) {
      flaskLiquid.visible = true;
      flaskLiquid.scale.y = 0.45;
    } else if (currentStep === 10 || currentStep === 11) {
      flaskLiquid.visible = true;
      flaskLiquid.scale.y = 0.55;
    } else if (currentStep === 12 || currentStep === 13) {
      flaskLiquid.visible = true;
      flaskLiquid.scale.y = 0.7;
    } else {
      // Steps 14 - 20 (Titration)
      flaskLiquid.visible = true;
      flaskLiquid.scale.y = 0.7 + (variables.thiosulfate / 25.0) * 0.25;
    }

    // Material updates for conical flask liquid based on step
    if (flaskLiquidMaterial) {
      if (currentStep <= 8) {
        // Sky blue clear solution
        flaskLiquidMaterial.color.setHex(0x4fc3f7);
        flaskLiquidMaterial.opacity = 0.65;
        flaskLiquidMaterial.roughness = 0.1;
        flaskLiquidMaterial.transmission = 0.85;
      } else if (currentStep === 9 || currentStep === 10) {
        // Bluish-white precipitate (milky suspension)
        flaskLiquidMaterial.color.setRGB(0.6, 0.88, 0.95);
        flaskLiquidMaterial.opacity = 0.92;
        flaskLiquidMaterial.roughness = 0.8;
        flaskLiquidMaterial.transmission = 0.1; // opaque suspension
      } else if (currentStep === 11 || currentStep === 12) {
        // Clear deep royal blue solution
        flaskLiquidMaterial.color.setRGB(0.0, 0.15, 0.6);
        flaskLiquidMaterial.opacity = 0.75;
        flaskLiquidMaterial.roughness = 0.1;
        flaskLiquidMaterial.transmission = 0.8;
      } else if (currentStep === 13) {
        // Liberated iodine (rich dark amber brown)
        flaskLiquidMaterial.color.setRGB(0.4, 0.22, 0.08);
        flaskLiquidMaterial.opacity = 0.95;
        flaskLiquidMaterial.roughness = 0.6;
        flaskLiquidMaterial.transmission = 0.3;
      } else if (currentStep === 14 || currentStep === 15 || currentStep === 16) {
        // Titration: dark brown fades to pale yellow
        const t = Math.min(1.0, variables.thiosulfate / concordantValue);
        const c = new THREE.Color(0.4, 0.22, 0.08).lerp(new THREE.Color(0.92, 0.92, 0.65), t);
        flaskLiquidMaterial.color.copy(c);
        flaskLiquidMaterial.opacity = 0.95 - t * 0.2;
        flaskLiquidMaterial.roughness = 0.6 - t * 0.1;
        flaskLiquidMaterial.transmission = 0.3 + t * 0.5;
      } else if (currentStep === 17) {
        // Starch indicator added: deep starch-iodine complex
        flaskLiquidMaterial.color.setHex(0x050e26); // deep dark blue-black
        flaskLiquidMaterial.opacity = 0.98;
        flaskLiquidMaterial.roughness = 0.6;
        flaskLiquidMaterial.transmission = 0.05;
      } else if (currentStep === 18 || currentStep === 19) {
        // Continue titration: dark blue-black fades to milky white
        const startThio = concordantValue - 2.5;
        const endThio = concordantValue;
        let t = 0;
        if (variables.thiosulfate > startThio) {
          t = Math.min(1.0, (variables.thiosulfate - startThio) / (endThio - startThio));
        }
        const c = new THREE.Color(0x050e26).lerp(new THREE.Color(0xf0f0eb), t);
        flaskLiquidMaterial.color.copy(c);
        flaskLiquidMaterial.opacity = 0.98;
        flaskLiquidMaterial.roughness = 0.6 + t * 0.2;
        flaskLiquidMaterial.transmission = 0.05 + t * 0.05;
      } else if (currentStep === 20) {
        // Milky white precipitate suspension
        flaskLiquidMaterial.color.setHex(0xf0f0eb);
        flaskLiquidMaterial.opacity = 0.95;
        flaskLiquidMaterial.roughness = 0.8;
        flaskLiquidMaterial.transmission = 0.1;
      }
    }
  }

  // 6. Update gas particles visibility
  if (gasParticlesGroup) {
    gasParticlesGroup.visible = (currentStep === 3);
  }

  // 7. Update heater plate color
  if (heaterPlateMaterial) {
    if (currentStep === 4) {
      heaterPlateMaterial.emissive.setRGB(1.0, 0.2, 0.0);
    } else {
      heaterPlateMaterial.emissive.setHex(0x000000);
    }
  }

  // 8. Reset tools position if not animating
  if (!isPlaying) {
    resetToolTransform();
  }
}

function showError(message) {
  const alertBox = document.getElementById('simulation_alert');
  if (!alertBox) {
    alert(message);
    return;
  }

  if (alertTimeout) {
    clearTimeout(alertTimeout);
  }

  alertBox.innerText = message;
  alertBox.style.display = 'block';
  alertBox.style.opacity = '1.0';

  alertTimeout = setTimeout(() => {
    alertBox.style.opacity = '0.0';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 300);
  }, 5000);
}

function canAdvanceStep() {
  switch (currentStep) {
    case 1:
      if (!experimentState.brassAdded) return "Please click 'Start' to add the brass foil to the beaker.";
      break;
    case 2:
      if (!experimentState.nitricAcidAdded) return "Please click 'Play' to add nitric acid.";
      break;
    case 3:
      if (!experimentState.boilingCompleted) return "Please wait for the dissolution reaction to finish.";
      break;
    case 4:
      if (!experimentState.nitrogenOxidesRemoved) return "Please wait for the solution to boil and expel nitrogen oxides.";
      break;
    case 5:
      if (!experimentState.ureaAdded) return "Please click 'Play' to add urea to decompose nitrous acid.";
      break;
    case 6:
      if (!experimentState.coolingCompleted) return "Please click 'Play' to cool the solution and add water.";
      break;
    case 7:
      if (!experimentState.volumetricTransferCompleted || !experimentState.pipettingCompleted) {
        return "Please click 'Play' to transfer the solution and pipette 25 mL into the conical flask.";
      }
      break;
    case 8:
      if (!experimentState.ammoniumHydroxideAdded) return "Please click 'Play' to add ammonium hydroxide.";
      break;
    case 9:
      // Automatic precipitate step
      break;
    case 10:
      if (!experimentState.aceticAcidAdded) return "Please click 'Play' to add acetic acid.";
      break;
    case 11:
      // Automatic dissolve step
      break;
    case 12:
      if (!experimentState.potassiumIodideAdded) return "Please click 'Play' to add Potassium Iodide (KI).";
      break;
    case 13:
      // Automatic iodine liberate step
      break;
    case 14:
      if (variables.thiosulfate < concordantValue - 2.0) {
        return "Please click 'Play' to perform titration until the solution turns pale yellow.";
      }
      break;
    case 15:
      // Near endpoint message
      break;
    case 16:
      if (!experimentState.starchAdded) return "Please click 'Play' to add the starch indicator.";
      break;
    case 17:
      // Starch blue color step
      break;
    case 18:
    case 19:
      if (!experimentState.endpointReached) {
        return "Please click 'Play' to continue titration until the endpoint is reached.";
      }
      break;
  }
  return true;
}

function getConcordantVolume(readings) {
  if (readings.length < 3) return 0;

  const [r1, r2, r3] = readings;
  const d12 = Math.abs(r1 - r2);
  const d23 = Math.abs(r2 - r3);
  const d13 = Math.abs(r1 - r3);

  const t = 0.1; // accepted tolerance is 0.1 mL
  const close12 = d12 <= t;
  const close23 = d23 <= t;
  const close13 = d13 <= t;

  // Case A: All three are close
  if (close12 && close23 && close13) {
    return (r1 + r2 + r3) / 3;
  }

  // Case B: Only two are close
  const pairs = [];
  if (close12) pairs.push({ val: (r1 + r2) / 2, diff: d12 });
  if (close23) pairs.push({ val: (r2 + r3) / 2, diff: d23 });
  if (close13) pairs.push({ val: (r1 + r3) / 2, diff: d13 });

  if (pairs.length > 0) {
    pairs.sort((a, b) => a.diff - b.diff);
    return pairs[0].val;
  }

  // Case C: Fallback to average of two closest readings
  const sorted = [...readings].sort((a, b) => a - b);
  const diffA = sorted[1] - sorted[0];
  const diffB = sorted[2] - sorted[1];
  if (diffA < diffB) {
    return (sorted[0] + sorted[1]) / 2;
  } else {
    return (sorted[1] + sorted[2]) / 2;
  }
}

function updateObservationTable() {
  for (let i = 1; i <= 3; i++) {
    const trial = completedTrials[i - 1];
    const initTd = document.getElementById(`trial_${i}_init`);
    const finalTd = document.getElementById(`trial_${i}_final`);
    const diffTd = document.getElementById(`trial_${i}_diff`);

    if (trial) {
      if (initTd) initTd.innerText = trial.initial.toFixed(2);
      if (finalTd) finalTd.innerText = trial.final.toFixed(2);
      if (diffTd) diffTd.innerText = trial.consumed.toFixed(2);
    } else {
      if (initTd) initTd.innerText = "-";
      if (finalTd) finalTd.innerText = "-";
      if (diffTd) diffTd.innerText = "-";
    }
  }
}

function updateCalculationsPanel() {
  const calcPanel = document.getElementById('calculation_steps');
  if (!calcPanel) return;

  if (completedTrials.length === 0) {
    calcPanel.innerHTML = `<em>Complete all 3 trials to see final chemical calculations.</em>`;
    return;
  }

  if (completedTrials.length < trialIndex) {
    calcPanel.innerHTML = `<em>Titrating Trial ${trialIndex}... Complete the titration to see calculations.</em>`;
    return;
  }

  let V_thio;
  let labelText = "";
  if (completedTrials.length === 3) {
    V_thio = getConcordantVolume(completedTrials.map(t => t.consumed));
    labelText = `Calculations for Concordant Volume: ${V_thio.toFixed(2)} mL`;
  } else {
    const latestTrial = completedTrials[completedTrials.length - 1];
    V_thio = latestTrial.consumed;
    labelText = `Calculations for Trial ${completedTrials.length} Volume: ${V_thio.toFixed(2)} mL`;
  }

  const W = variables.weight;

  // Calculate using intermediate rounded values as seen in the NITK formula
  const N_brass = parseFloat(((0.1 * V_thio) / 25.0).toFixed(4));
  const mass_copper = parseFloat(((N_brass * 63.54 * 250) / 1000).toFixed(4));
  const conc_copper = mass_copper * 4; // concentration in g/L
  const pct_copper = (mass_copper * 100) / W;

  calcPanel.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid #089B93; padding-bottom: 4px; color: #089B93; text-transform: uppercase; font-size: 0.9em;">
      ${labelText}
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Calculation 1 – Volume Consumed</strong><br>
      $$\\begin{align*}
      \\text{Consumed Volume} &= \\text{Final Reading} - \\text{Initial Reading} \\\\
      &= ${V_thio.toFixed(2)} - 0.00 \\\\
      &= ${V_thio.toFixed(2)}\\text{ mL}
      \\end{align*}$$
    </div>
    
    <hr style="border: none; border-top: 1px dashed #ddd; margin: 15px 0;">
    
    <div style="margin-bottom: 15px;">
      <strong>Calculation 2 – Copper Concentration</strong><br>
      $$\\begin{align*}
      \\text{Normality of Brass solution } (N_{\\text{brass}}) &= \\frac{N_{\\text{thio}} \\times V_{\\text{thio}}}{V_{\\text{brass}}} = \\frac{0.1 \\times ${V_thio.toFixed(2)}}{25.0} = ${N_brass.toFixed(4)}\\text{ N} \\\\
      \\text{Wt. of Cu present in 250 mL of solution } (m) &= \\frac{N_{\\text{brass}} \\times 63.54}{4} = \\frac{${N_brass.toFixed(4)} \\times 63.54}{4} = ${mass_copper.toFixed(4)}\\text{ g} \\\\
      \\text{Copper Concentration} &= \\frac{\\text{Mass of Copper}}{\\text{Volume of Solution (L)}} \\\\
      &= \\frac{${mass_copper.toFixed(4)}\\text{ g}}{0.250\\text{ L}} \\\\
      &= ${conc_copper.toFixed(2)}\\text{ g/L}
      \\end{align*}$$
    </div>
    
    <hr style="border: none; border-top: 1px dashed #ddd; margin: 15px 0;">
    
    <div style="margin-bottom: 15px;">
      <strong>Calculation 3 – Percentage of Copper</strong><br>
      $$\\begin{align*}
      \\text{Percentage of Copper} &= \\frac{\\text{Mass of Copper}}{\\text{Brass Weight}} \\times 100 \\\\
      &= \\left(\\frac{${mass_copper.toFixed(4)}}{${W.toFixed(2)}}\\right) \\times 100 \\\\
      &= ${pct_copper.toFixed(2)}\\%
      \\end{align*}$$
    </div>
  `;

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([calcPanel]).catch((err) => console.log(err));
  } else if (window.MathJax && window.MathJax.typeset) {
    window.MathJax.typeset([calcPanel]);
  }
}

function startNewTrial() {
  if (completedTrials.length >= 3) {
    showError("You have already completed 3 trials. The experiment is complete.");
    return;
  }

  trialIndex++;
  // Reset Part B specific variables and input elements for the new trial
  const varsToReset = ['nh4oh', 'acetic', 'ki', 'starch', 'thiosulfate'];
  varsToReset.forEach(k => {
    variables[k] = 0;
    $(`#${k}_slider`).slider("value", 0);
    $(`#${k}_spinner`).spinner("value", null);
    $(`#${k}_spinner`).val("");
  });

  currentStep = 7;
  experimentState.volumetricTransferCompleted = false;
  experimentState.pipettingCompleted = false;
  experimentState.ammoniumHydroxideAdded = false;
  experimentState.aceticAcidAdded = false;
  experimentState.potassiumIodideAdded = false;
  experimentState.starchAdded = false;
  experimentState.titrationStarted = false;
  experimentState.endpointReached = false;

  const offset = trialVariations[(trialIndex - 1) % 3];
  concordantValue = (variables.weight * 70.0) / 6.354 + offset;

  const trialBtn = document.getElementById('btn_new_trial');
  if (trialBtn) trialBtn.style.display = 'none';

  updateSliderState();
  calculateChemistryOutputs();
  updateSceneState();
  updateCalculationsPanel();
  updateStartButtonText();
}

function retryTrial() {
  variables.thiosulfate = 0.0;
  $(`#thiosulfate_slider`).slider("value", 0.0);
  $(`#thiosulfate_spinner`).spinner("value", 0.0);

  currentStep = 7;
  experimentState.volumetricTransferCompleted = false;
  experimentState.pipettingCompleted = false;
  experimentState.ammoniumHydroxideAdded = false;
  experimentState.aceticAcidAdded = false;
  experimentState.potassiumIodideAdded = false;
  experimentState.starchAdded = false;
  experimentState.titrationStarted = false;
  experimentState.endpointReached = false;

  const trialBtn = document.getElementById('btn_new_trial');
  if (trialBtn) trialBtn.style.display = 'none';

  updateSliderState();
  calculateChemistryOutputs();
  updateSceneState();
  updateCalculationsPanel();
}

function updateSliderState() {
  // Map steps to enabled variables. Disable all others.
  const activeVarMap = {
    1: ['weight'],
    2: ['hno3'],
    5: ['urea'],
    8: ['nh4oh'],
    10: ['acetic'],
    12: ['ki'],
    14: ['thiosulfate'],
    15: ['thiosulfate'],
    16: ['starch'],
    18: ['thiosulfate'],
    19: ['thiosulfate']
  };

  const activeVars = activeVarMap[currentStep] || [];

  const allVars = ['weight', 'hno3', 'urea', 'nh4oh', 'acetic', 'ki', 'starch', 'thiosulfate'];

  allVars.forEach(v => {
    if (activeVars.includes(v)) {
      $(`#${v}_slider`).slider("enable");
      $(`#${v}_spinner`).spinner("enable");
    } else {
      $(`#${v}_slider`).slider("disable");
      $(`#${v}_spinner`).spinner("disable");
    }
  });
}

// ----------------------------------------------------
// Chemistry Logic Engine
// ----------------------------------------------------
function calculateChemistryOutputs() {
  const v = variables.thiosulfate;
  const isEndpointReached = experimentState.endpointReached;

  let concordantValStr = "-";
  let concCu = "-";
  let pctCu = "-";

  if (completedTrials.length === 3) {
    const readings = completedTrials.map(t => t.consumed);
    const concordantVal = getConcordantVolume(readings);
    concordantValStr = concordantVal.toFixed(2);

    const N_brass = parseFloat(((0.1 * concordantVal) / 25.0).toFixed(4));
    const mass_copper = parseFloat(((N_brass * 63.54 * 250) / 1000).toFixed(4));
    const conc_copper = mass_copper * 4;
    const pct_copper = (mass_copper * 100) / variables.weight;

    concCu = conc_copper.toFixed(2);
    pctCu = pct_copper.toFixed(2);
  }

  // Update Results panel DOM
  document.getElementById('res_step').innerText = `Step ${currentStep}`;
  document.getElementById('res_status').innerText = getStepStatusText();
  document.getElementById('res_burette').innerText = v.toFixed(2);
  document.getElementById('res_concordant').innerText = concordantValStr;
  document.getElementById('res_concentration').innerText = concCu;
  document.getElementById('res_percentage').innerText = pctCu;
  document.getElementById('res_endpoint').innerText = isEndpointReached ? "Reached" : "Not reached";
}

function getStepStatusText() {
  const statusTexts = {
    1: "Adding brass foil to beaker",
    2: "Pouring 1:1 Nitric Acid to dissolve brass",
    3: "Reacting: Nitric acid dissolving brass (generating brown nitrogen oxides)",
    4: "Heating beaker to expel nitrogen oxide fumes",
    5: "Adding urea to decompose nitrous acids",
    6: "Cooling the beaker and adding water",
    7: "Transferring solution to 250mL flask and pipetting 25mL into conical flask",
    8: "Adding Ammonium Hydroxide dropwise",
    9: "Bluish-white Cu(OH)₂ precipitate formed",
    10: "Adding Acetic Acid to dissolve precipitate",
    11: "Precipitate dissolved: clear royal blue Cu²⁺ solution",
    12: "Adding Potassium Iodide (10% KI)",
    13: "Iodine liberated: dark brown suspension",
    14: "Titration started: adding Na₂S₂O₃ from burette",
    15: "Mixture turned pale yellow (near endpoint)",
    16: "Adding Starch indicator",
    17: "Deep purplish-blue starch-iodine complex formed",
    18: "Continuing titration with thiosulfate",
    19: "Blue colour fading",
    20: "Titration complete: Milky white suspension (CuI precipitate)"
  };
  return statusTexts[currentStep] || "Ready";
}

// ----------------------------------------------------
// Animation loop & particles update
// ----------------------------------------------------
function enableShadows(obj) {
  obj.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function createLabelSprite(text, pos) {
  // Create high-resolution canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // Ultra high-density 6x scale for razor-sharp vector text rendering
  const scale = 6;
  const fontSize = 32 * scale;
  const padding = 24 * scale;

  context.font = `700 ${fontSize}px "Inter", "Poppins", "Segoe UI", Arial, sans-serif`;

  const metrics = context.measureText(text);

  canvas.width = Math.ceil(metrics.width + padding * 2);
  canvas.height = 54 * scale;

  // Re-apply context font after canvas size change
  context.font = `700 ${fontSize}px "Inter", "Poppins", "Segoe UI", Arial, sans-serif`;
  context.textBaseline = "middle";

  // Crisp Dark Slate Badge Container with NITK Teal accent border
  context.fillStyle = "rgba(15, 23, 42, 0.94)";
  context.beginPath();
  if (context.roundRect) {
    context.roundRect(0, 0, canvas.width, canvas.height, 10 * scale);
  } else {
    context.rect(0, 0, canvas.width, canvas.height);
  }
  context.fill();

  // Vibrant Nitk Teal Accent Border
  context.lineWidth = 2.5 * scale;
  context.strokeStyle = "#089b93";
  context.stroke();

  // Crisp White Text with contrast drop shadow
  context.shadowColor = "rgba(0, 0, 0, 0.6)";
  context.shadowBlur = 4 * scale;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1.5 * scale;

  context.fillStyle = "#FFFFFF";
  context.textAlign = "center";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Ultra-crisp texture with anisotropic filtering and no mipmap blur
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });

  const sprite = new THREE.Sprite(material);

  const aspect = canvas.width / canvas.height;
  sprite.scale.set(aspect * 0.18, 0.18, 1);
  sprite.position.copy(pos);

  scene.add(sprite);
  labelsList.push(sprite);
}

function changeCameraView(viewName) {
  if (!camera || !controls) return;
  isRotating = false; // stop auto-rotation

  let targetPos;
  let targetLookAt = new THREE.Vector3(0, -0.3, 0);

  switch (viewName) {
    case 'front':
      targetPos = new THREE.Vector3(0, 1.6, 5.2);
      break;
    case 'top':
      targetPos = new THREE.Vector3(0, 4.5, 0.01);
      targetLookAt = new THREE.Vector3(0, -1.4, 0);
      break;
    case 'left':
      targetPos = new THREE.Vector3(-4.5, 1.2, 0);
      break;
    case 'right':
      targetPos = new THREE.Vector3(4.5, 1.2, 0);
      break;
    default:
      return;
  }

  new TWEEN.Tween(camera.position)
    .to(targetPos, 1200)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  new TWEEN.Tween(controls.target)
    .to(targetLookAt, 1200)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      controls.update();
    })
    .start();
}

function playMixingAnimation(mesh, onCompleteCallback) {
  const startRot = mesh.rotation.clone();
  new TWEEN.Tween(mesh.rotation)
    .to({ z: 0.05 }, 120)
    .yoyo(true)
    .repeat(5)
    .onComplete(() => {
      mesh.rotation.copy(startRot);
      if (onCompleteCallback) onCompleteCallback();
    })
    .start();
}

function updateBubbles() {
  if (!bubbleParticlesGroup) return;

  const showBeakerBubbles = (currentStep === 3 || currentStep === 4) && isPlaying;
  const showFlaskBubbles = (currentStep === 14 || currentStep === 18 || currentStep === 19) && isPlaying;

  if (showBeakerBubbles) {
    bubbleParticlesGroup.position.copy(POSITIONS.beaker).add(new THREE.Vector3(0, 0.2, 0));
    bubbleParticlesGroup.visible = true;
  } else if (showFlaskBubbles) {
    bubbleParticlesGroup.position.copy(POSITIONS.flask).add(new THREE.Vector3(0, 0.2, 0));
    bubbleParticlesGroup.visible = true;
  } else {
    bubbleParticlesGroup.visible = false;
    return;
  }

  bubbleParticlesGroup.children.forEach(b => {
    b.position.y += b.userData.speedY;
    b.position.x += b.userData.speedX;
    b.position.z += b.userData.speedZ;

    const maxRise = (currentStep === 3 || currentStep === 4) ? 0.4 : 0.3;

    if (b.position.y > maxRise) {
      b.position.y = -0.2;
      b.position.x = (Math.random() - 0.5) * 0.3;
      b.position.z = (Math.random() - 0.5) * 0.3;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (!isLoaded) return;
  TWEEN.update();

  if (isRotating && controls) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
  } else if (controls) {
    controls.autoRotate = false;
  }

  if (controls) {
    controls.update();
  }

  // Rotate stopcock if dripping
  if (isPlaying && (currentStep === 14 || currentStep === 18)) {
    stopcockMesh.rotation.y += 0.05;
  }

  updateGasParticles();
  updateBubbles();
  updateDrips();

  renderer.render(scene, camera);
}

function updateGasParticles() {
  if (!gasParticlesGroup.visible) return;

  gasParticlesGroup.children.forEach(p => {
    p.position.y += p.userData.speedY;
    p.position.x += p.userData.speedX;
    p.position.z += p.userData.speedZ;

    // Fading effect
    const lifeRatio = 1.0 - (p.position.y - p.userData.initialY) / 1.5;
    p.material.opacity = Math.max(0, lifeRatio * 0.25);
    p.scale.setScalar(Math.max(0.1, lifeRatio));

    // Reset particle
    if (p.position.y > p.userData.initialY + 1.2) {
      p.position.y = 0;
      p.position.x = (Math.random() - 0.5) * 0.4;
      p.position.z = (Math.random() - 0.5) * 0.4;
    }
  });
}

function updateDrips() {
  const shouldDrip = isPlaying && (currentStep === 14 || currentStep === 15 || currentStep === 18 || currentStep === 19);

  dripParticles.forEach(d => {
    if (shouldDrip) {
      d.visible = true;
      d.position.y -= d.userData.speedY;

      // Hit conical flask liquid level
      if (d.position.y < d.userData.yEnd) {
        d.position.y = d.userData.yStart;

        // Titrate: increase sodium thiosulfate volume
        if (currentStep === 14) {
          const limitVal = concordantValue - 2.0;
          if (variables.thiosulfate < limitVal) {
            let stepVal = 0.08;
            // slow down near transition points to let user pause
            if (variables.thiosulfate >= concordantValue - 2.5) stepVal = 0.02;

            const newVal = Math.min(25.0, variables.thiosulfate + stepVal);

            // update UI controls
            $(`#thiosulfate_slider`).slider("value", newVal);
            $(`#thiosulfate_spinner`).spinner("value", newVal);
            onVariableChange('thiosulfate', newVal);
          } else {
            // Reached pale yellow, auto-pause to add starch in step 16
            currentStep = 15;
            isPlaying = false;
            calculateChemistryOutputs();
            updateSceneState();
          }
        } else if (currentStep === 18 || currentStep === 19) {
          // Allow over-titration up to 25 mL
          let stepVal = 0.08;
          if (variables.thiosulfate >= concordantValue - 0.5) stepVal = 0.005; // slow dropwise near endpoint

          const newVal = Math.min(25.0, variables.thiosulfate + stepVal);

          // update UI controls
          $(`#thiosulfate_slider`).slider("value", newVal);
          $(`#thiosulfate_spinner`).spinner("value", newVal);
          onVariableChange('thiosulfate', newVal);

          // Auto-pause titration when concordant value is reached to prevent overshoot
          if (newVal >= concordantValue) {
            isPlaying = false;
            calculateChemistryOutputs();
            updateSceneState();
          }
        }
      }
    } else {
      d.visible = false;
    }
  });
}

// Helper to reset tools geometry and hidden statuses
function resetToolTransform() {
  if (!isLoaded || !pipetteMesh || !spatulaMesh || !washBottleMesh || !liquidStream) return;
  if (currentTween) currentTween.stop();
  currentTween = null;

  pipetteMesh.position.copy(POSITIONS.toolInactive);
  pipetteMesh.rotation.set(0, 0, 0);
  pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

  spatulaMesh.position.copy(POSITIONS.spatulaRest);
  spatulaMesh.rotation.set(0, 0.3, Math.PI / 2);
  spatulaMesh.getObjectByName("powder").visible = false;
  spatulaMesh.getObjectByName("scoopFoil").visible = false;

  washBottleMesh.position.copy(POSITIONS.washBottle);
  washBottleMesh.rotation.set(0, 0, 0);

  liquidStream.visible = false;
  beakerMesh.position.copy(POSITIONS.beaker);
  beakerMesh.position.y += 0.45;
  beakerMesh.rotation.set(0, 0, 0);
}

// ----------------------------------------------------
// Controls Click Handlers & State Machine
// ----------------------------------------------------

function startSim() {
  if (!isLoaded) {
    showError("Please wait for all 3D assets to load.");
    return;
  }
  if (currentStep === 1 || currentStep === 7) {
    if (!validateStepInput(currentStep)) {
      isPlaying = false;
      return;
    }
    isPlaying = true;
    triggerStepAnimation(currentStep);
  }
}

function nextStep() {
  if (isPlaying) {
    showError("Please wait for the current animation to finish before proceeding.");
    return;
  }

  if (currentTween) {
    currentTween.stop();
  }
  currentTween = null;

  // Check endpoint if trying to advance from titration steps (18/19)
  if (currentStep === 18 || currentStep === 19) {
    const dev = Math.abs(variables.thiosulfate - concordantValue);
    if (dev > 0.1) {
      if (variables.thiosulfate < concordantValue - 0.1) {
        showError("Endpoint not reached! The solution is still blue. Continue adding thiosulfate dropwise.");
        return;
      } else {
        showError(`Over-titration detected! You added ${variables.thiosulfate.toFixed(2)} mL, but the endpoint was at ${concordantValue.toFixed(2)} mL. Please retry this trial.`);

        // Show retry button
        const trialBtn = document.getElementById('btn_new_trial');
        if (trialBtn) {
          trialBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7" />
            </svg>
            <span>Retry Trial (Phase B)</span>
          `;
          trialBtn.onclick = retryTrial;
          trialBtn.style.backgroundColor = "#c9184a";
          trialBtn.style.display = "flex";
        }
        return;
      }
    } else {
      // SUCCESS!
      experimentState.endpointReached = true;
      if (completedTrials.length < trialIndex && completedTrials.length < 3) {
        completedTrials.push({
          initial: 0.00,
          final: variables.thiosulfate,
          consumed: variables.thiosulfate
        });
        updateObservationTable();
        updateCalculationsPanel();
      }

      const trialBtn = document.getElementById('btn_new_trial');
      if (trialBtn) {
        if (completedTrials.length === 1) {
          trialBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Start Trial 2</span>
          `;
          trialBtn.onclick = startNewTrial;
          trialBtn.style.backgroundColor = "#089B93";
          trialBtn.style.display = "flex";
        } else if (completedTrials.length === 2) {
          trialBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Start Trial 3</span>
          `;
          trialBtn.onclick = startNewTrial;
          trialBtn.style.backgroundColor = "#089B93";
          trialBtn.style.display = "flex";
        } else if (completedTrials.length === 3) {
          trialBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Final Report</span>
          `;
          trialBtn.onclick = showFinalReport;
          trialBtn.style.backgroundColor = "#1b4d3e";
          trialBtn.style.display = "flex";
          showError("All 3 trials successfully completed! Click 'Generate Final Report' to view the laboratory report.");
        }
      }
    }
  }

  if (!validateStepInput(currentStep)) {
    return;
  }

  const check = canAdvanceStep();
  if (check !== true) {
    showError(check);
    return;
  }

  if (currentStep < 20) {
    currentStep++;
    updateSliderState();
    calculateChemistryOutputs();
    updateSceneState();

    // Auto-play the steps that are purely automatic reactions / animations
    const autoPlaySteps = [3, 4, 9, 11, 13, 15, 17, 20];
    if (autoPlaySteps.includes(currentStep)) {
      isPlaying = true;
      triggerStepAnimation(currentStep);
    } else {
      isPlaying = false;
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;

    if (currentTween) {
      currentTween.stop();
    }
    currentTween = null;

    // reset thiosulfate if returning from titration
    if (currentStep < 14) {
      variables.thiosulfate = 0.0;
      $(`#thiosulfate_slider`).slider("value", 0.0);
      $(`#thiosulfate_spinner`).spinner("value", 0.0);
    }

    updateSliderState();
    calculateChemistryOutputs();
    updateSceneState();

    if (isPlaying) {
      triggerStepAnimation(currentStep);
    }
  }
}

function resetSim() {
  isPlaying = false;
  currentStep = 1;

  if (currentTween) {
    currentTween.stop();
  }
  currentTween = null;

  // Reset sliders to default values
  const defaults = {
    weight: 1.5, hno3: 10.0, urea: 1.0, nh4oh: 10.0, acetic: 5.0, ki: 10.0, starch: 2.0, thiosulfate: 0.0
  };

  Object.keys(defaults).forEach(k => {
    variables[k] = defaults[k];
    $(`#${k}_slider`).slider("value", defaults[k]);
    $(`#${k}_spinner`).spinner("value", defaults[k]);
  });

  // Reset FSM states
  Object.keys(experimentState).forEach(k => {
    experimentState[k] = false;
  });

  trialIndex = 1;
  completedTrials = [];
  updateObservationTable();
  updateCalculationsPanel();
  updateStartButtonText();

  // Hide the next trial button
  const trialBtn = document.getElementById('btn_new_trial');
  if (trialBtn) {
    trialBtn.style.display = 'none';
  }

  // Hide the report modal
  const reportModal = document.getElementById('lab-report-modal');
  if (reportModal) {
    reportModal.style.display = 'none';
  }

  // Recalculate concordant value
  const offset = trialVariations[0];
  concordantValue = (variables.weight * 70.0) / 6.354 + offset;

  // Reset brass dissolved states
  brassFoilInBeaker.forEach(mesh => {
    mesh.visible = false;
    mesh.scale.setScalar(1.0);
  });

  brassFoilInDish.forEach(mesh => mesh.visible = true);

  updateSliderState();
  calculateChemistryOutputs();
  updateSceneState();

  // Camera reset
  camera.position.set(0, 1.6, 5.2);
  controls.target.set(0, -0.3, 0);
  if (controls) controls.update();

  // Reset tools and bubbles visual states
  if (spatulaMesh) {
    spatulaMesh.getObjectByName("powder").visible = false;
    spatulaMesh.getObjectByName("scoopFoil").visible = false;
  }
  if (pipetteMesh) {
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
  }
  if (bubbleParticlesGroup) {
    bubbleParticlesGroup.visible = false;
  }
}

function showFinalReport() {
  if (completedTrials.length < 3) {
    showError("Please complete all 3 trials before generating the final report.");
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString();

  document.getElementById('rep_date').innerText = dateStr;
  document.getElementById('rep_weight').innerText = variables.weight.toFixed(2);

  // Trials data
  document.getElementById('rep_t1_init').innerText = "0.00";
  document.getElementById('rep_t1_final').innerText = completedTrials[0].final.toFixed(2);
  document.getElementById('rep_t1_diff').innerText = completedTrials[0].consumed.toFixed(2);

  document.getElementById('rep_t2_init').innerText = "0.00";
  document.getElementById('rep_t2_final').innerText = completedTrials[1].final.toFixed(2);
  document.getElementById('rep_t2_diff').innerText = completedTrials[1].consumed.toFixed(2);

  document.getElementById('rep_t3_init').innerText = "0.00";
  document.getElementById('rep_t3_final').innerText = completedTrials[2].final.toFixed(2);
  document.getElementById('rep_t3_diff').innerText = completedTrials[2].consumed.toFixed(2);

  // Estimation outputs
  const readings = completedTrials.map(t => t.consumed);
  const concordantVal = getConcordantVolume(readings);

  const N_brass = parseFloat(((0.1 * concordantVal) / 25.0).toFixed(4));
  const mass_copper = parseFloat(((N_brass * 63.54 * 250) / 1000).toFixed(4));
  const conc_copper = mass_copper * 4;
  const pct_copper = (mass_copper * 100) / variables.weight;

  document.getElementById('rep_concordant').innerText = concordantVal.toFixed(2);
  document.getElementById('rep_normality').innerText = N_brass.toFixed(4);
  document.getElementById('rep_concentration').innerText = conc_copper.toFixed(2);
  document.getElementById('rep_percentage').innerText = pct_copper.toFixed(2);

  document.getElementById('lab-report-modal').style.display = 'flex';
}

function closeReportModal() {
  document.getElementById('lab-report-modal').style.display = 'none';
}

function pauseSim() {
  isPlaying = false;
  if (currentTween) currentTween.pause();
}

function playSim() {
  if (!validateStepInput(currentStep)) {
    isPlaying = false;
    return;
  }
  isPlaying = true;
  if (currentTween) {
    currentTween.resume();
  } else {
    triggerStepAnimation(currentStep);
  }
}

function toggleRotate() {
  isRotating = !isRotating;
}

function setPipetteColor(hexColor, opacity = 0.6) {
  if (pipetteLiquidMaterial) {
    pipetteLiquidMaterial.color.setHex(hexColor);
    pipetteLiquidMaterial.opacity = opacity;
  }
}

// ----------------------------------------------------
// Procedural Step Animations (TWEEN)
// ----------------------------------------------------
function triggerStepAnimation(step) {
  resetToolTransform();

  // Validate reagent quantities before starting step animations
  if (step === 2) {
    if (variables.hno3 < 8.0) {
      showError("Incorrect reagent quantity: Using less than 8 mL of Nitric Acid is insufficient to completely dissolve the brass sample (range 8 - 12 mL). Please adjust the HNO₃ vol slider.");
      isPlaying = false;
      return;
    }
    if (variables.hno3 > 12.0) {
      showError("Incorrect reagent quantity: Using more than 12 mL of Nitric Acid is excessive and wasteful (range 8 - 12 mL). Please adjust the HNO₃ vol slider.");
      isPlaying = false;
      return;
    }
  } else if (step === 5) {
    if (variables.urea < 0.8) {
      showError("Incorrect reagent quantity: Adding less than 0.8 g of urea is insufficient to decompose all nitrous acid (range 0.8 - 1.2 g). Please adjust the Urea wt slider.");
      isPlaying = false;
      return;
    }
    if (variables.urea > 1.2) {
      showError("Incorrect reagent quantity: Adding more than 1.2 g of urea is unnecessary (range 0.8 - 1.2 g). Please adjust the Urea wt slider.");
      isPlaying = false;
      return;
    }
  } else if (step === 8) {
    if (variables.nh4oh < 8.0) {
      showError("Incorrect reagent quantity: Adding less than 8 mL of Ammonium Hydroxide is insufficient to neutralize the acid and precipitate the copper (range 8 - 12 mL). Please adjust the NH₄OH vol slider.");
      isPlaying = false;
      return;
    }
    if (variables.nh4oh > 12.0) {
      showError("Incorrect reagent quantity: Adding more than 12 mL of Ammonium Hydroxide will form an excess basic environment (range 8 - 12 mL). Please adjust the NH₄OH vol slider.");
      isPlaying = false;
      return;
    }
  } else if (step === 10) {
    if (variables.acetic < 4.0) {
      showError("Incorrect reagent quantity: Adding less than 4 mL of Acetic Acid is insufficient to dissolve the Cu(OH)₂ precipitate and make the solution mildly acidic (range 4 - 6 mL). Please adjust the CH₃COOH vol slider.");
      isPlaying = false;
      return;
    }
    if (variables.acetic > 6.0) {
      showError("Incorrect reagent quantity: Adding more than 6 mL of Acetic Acid will make the solution excessively acidic (range 4 - 6 mL). Please adjust the CH₃COOH vol slider.");
      isPlaying = false;
      return;
    }
  } else if (step === 12) {
    if (variables.ki < 8.0) {
      showError("Incorrect reagent quantity: Adding less than 8 mL of KI will not liberate all iodine, leading to incorrect titration results (range 8 - 12 mL). Please adjust the KI vol slider.");
      isPlaying = false;
      return;
    }
    if (variables.ki > 12.0) {
      showError("Incorrect reagent quantity: Adding more than 12 mL of KI is excessive (range 8 - 12 mL). Please adjust the KI vol slider.");
      isPlaying = false;
      return;
    }
  } else if (step === 16) {
    if (variables.starch < 1.5) {
      showError("Incorrect reagent quantity: Adding less than 1.5 mL of starch indicator is insufficient to form the blue complex clearly (range 1.5 - 2.5 mL). Please adjust the Starch vol slider.");
      isPlaying = false;
      return;
    }
    if (variables.starch > 2.5) {
      showError("Incorrect reagent quantity: Adding more than 2.5 mL of starch indicator is excessive (range 1.5 - 2.5 mL). Please adjust the Starch vol slider.");
      isPlaying = false;
      return;
    }
  }

  if (step === 1) {
    // 1. Spatula adds brass foil
    spatulaMesh.position.copy(POSITIONS.spatulaRest);
    spatulaMesh.rotation.set(0, 0.3, Math.PI / 2);
    spatulaMesh.visible = true;
    spatulaMesh.getObjectByName("powder").visible = false;
    spatulaMesh.getObjectByName("scoopFoil").visible = false;

    // Scoop from dish
    const scoopPos = POSITIONS.dish.clone().add(new THREE.Vector3(0, 0.4, 0));
    const beakerMouthPos = POSITIONS.beaker.clone().add(new THREE.Vector3(0, 0.9, 0));

    new TWEEN.Tween(spatulaMesh.rotation)
      .to({ x: 0, y: 0, z: 0 }, 500)
      .start();

    currentTween = new TWEEN.Tween(spatulaMesh.position)
      .to(scoopPos, 1200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        // Collect brass foils on spoon
        spatulaMesh.getObjectByName("scoopFoil").visible = true;
        // Hide dish foils
        brassFoilInDish.forEach(f => f.visible = false);
      })
      .chain(
        new TWEEN.Tween(spatulaMesh.position)
          .to(beakerMouthPos, 1200)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .chain(
            new TWEEN.Tween(spatulaMesh.rotation)
              .to({ z: Math.PI / 3 }, 600)
              .onComplete(() => {
                // Drop foils into beaker
                spatulaMesh.getObjectByName("scoopFoil").visible = false;
                brassFoilInBeaker.forEach(f => f.visible = true);
              })
              .chain(
                new TWEEN.Tween(spatulaMesh.rotation)
                  .to({ z: 0 }, 400)
                  .chain(
                    new TWEEN.Tween(spatulaMesh.position)
                      .to(POSITIONS.spatulaRest, 1000)
                      .onStart(() => {
                        new TWEEN.Tween(spatulaMesh.rotation)
                          .to({ x: 0, y: 0.3, z: Math.PI / 2 }, 600)
                          .start();
                        // Shake beaker (mixing)
                        playMixingAnimation(beakerMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.brassAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 2) {
    // 2. Pipette adds nitric acid
    pipetteMesh.position.copy(POSITIONS.toolInactive);
    pipetteMesh.visible = true;

    setPipetteColor(0xe0f7fa, 0.5);
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

    const acidMouth = POSITIONS.hno3.clone().add(new THREE.Vector3(0, 0.8, 0));
    const beakerMouth = POSITIONS.beaker.clone().add(new THREE.Vector3(0, 0.9, 0));

    currentTween = new TWEEN.Tween(pipetteMesh.position)
      .to(acidMouth, 1200)
      .chain(
        new TWEEN.Tween(pipetteMesh.position)
          .to(acidMouth.clone().add(new THREE.Vector3(0, -0.25, 0)), 600)
          .onComplete(() => {
            // Draw clear liquid into pipette
            pipetteMesh.getObjectByName("pipetteLiquid").visible = true;
          })
          .chain(
            new TWEEN.Tween(pipetteMesh.position)
              .to(beakerMouth, 1200)
              .chain(
                new TWEEN.Tween(pipetteMesh.position)
                  .to(beakerMouth, 2000) // dispense pause
                  .onStart(() => {
                    liquidStream.material.color.setHex(0xe0f7fa);
                    liquidStream.position.copy(beakerMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                    liquidStream.visible = true;
                    beakerLiquid.visible = true;
                    new TWEEN.Tween(beakerLiquid.scale)
                      .to({ y: variables.hno3 / 15.0 }, 1800)
                      .start();
                  })
                  .onComplete(() => {
                    liquidStream.visible = false;
                    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                  })
                  .chain(
                    new TWEEN.Tween(pipetteMesh.position)
                      .to(POSITIONS.toolInactive, 1000)
                      .onStart(() => {
                        // Shake/mix beaker
                        playMixingAnimation(beakerMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.nitricAcidAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 3) {
    // 3. Reacting (dissolving + brown gas NO2)
    // Runs automatically for 3.5s
    gasParticlesGroup.visible = true;
    beakerLiquid.visible = true;

    new TWEEN.Tween(beakerLiquidMaterial.color)
      .to({ r: 0.05, g: 0.75, b: 0.55 }, 2500) // turn green
      .start();

    // shrink foils in beaker (dissolving)
    brassFoilInBeaker.forEach(f => {
      new TWEEN.Tween(f.scale)
        .to({ x: 0.2, y: 0.2, z: 0.2 }, 3000)
        .start();
    });

    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 3500)
      .onComplete(() => {
        isPlaying = false;
        currentTween = null;
        experimentState.boilingCompleted = true;
      });
    currentTween.start();

  } else if (step === 4) {
    // 4. Heat beaker to expel brown oxides
    const heaterPlatePlateEmissive = heaterPlate.material.emissive;
    new TWEEN.Tween(heaterPlatePlateEmissive)
      .to({ r: 1.0, g: 0.2, b: 0.0 }, 1500) // glows red
      .start();

    // change liquid to blue-green
    new TWEEN.Tween(beakerLiquidMaterial.color)
      .to({ r: 0.0, g: 0.65, b: 0.95 }, 3000)
      .start();

    // dissolve foils completely
    brassFoilInBeaker.forEach(f => f.visible = false);

    // fade gas particles
    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 4000)
      .onComplete(() => {
        gasParticlesGroup.visible = false;
        heaterPlate.material.emissive.setHex(0x000000); // cool heater
        isPlaying = false;
        currentTween = null;
        experimentState.nitrogenOxidesRemoved = true;
      });
    currentTween.start();

  } else if (step === 5) {
    // 5. Add urea
    spatulaMesh.position.copy(POSITIONS.spatulaRest);
    spatulaMesh.rotation.set(0, 0.3, Math.PI / 2);
    spatulaMesh.visible = true;
    spatulaMesh.getObjectByName("powder").visible = false;
    spatulaMesh.getObjectByName("scoopFoil").visible = false;

    const scoopPos = POSITIONS.urea.clone().add(new THREE.Vector3(0, 0.5, 0));
    const beakerMouth = POSITIONS.beaker.clone().add(new THREE.Vector3(0, 0.9, 0));

    new TWEEN.Tween(spatulaMesh.rotation)
      .to({ x: 0, y: 0, z: 0 }, 500)
      .start();

    currentTween = new TWEEN.Tween(spatulaMesh.position)
      .to(scoopPos, 1200)
      .onComplete(() => {
        // Pick up white urea powder from container
        spatulaMesh.getObjectByName("powder").visible = true;
      })
      .chain(
        new TWEEN.Tween(spatulaMesh.position)
          .to(beakerMouth, 1200)
          .chain(
            new TWEEN.Tween(spatulaMesh.rotation)
              .to({ z: Math.PI / 3 }, 600)
              .onComplete(() => {
                spatulaMesh.getObjectByName("powder").visible = false;
                beakerLiquid.scale.y = (variables.hno3 + 2.0) / 15.0;
              })
              .chain(
                new TWEEN.Tween(spatulaMesh.rotation)
                  .to({ z: 0 }, 400)
                  .chain(
                    new TWEEN.Tween(spatulaMesh.position)
                      .to(POSITIONS.spatulaRest, 1000)
                      .onStart(() => {
                        new TWEEN.Tween(spatulaMesh.rotation)
                          .to({ x: 0, y: 0.3, z: Math.PI / 2 }, 600)
                          .start();
                        // Shake/mix beaker
                        playMixingAnimation(beakerMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.ureaAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 6) {
    // 6. Cool and add water from wash bottle
    washBottleMesh.position.copy(POSITIONS.washBottle);
    const beakerMouth = POSITIONS.beaker.clone().add(new THREE.Vector3(0, 0.9, 0));

    currentTween = new TWEEN.Tween(washBottleMesh.position)
      .to(beakerMouth.clone().add(new THREE.Vector3(0.5, 0.4, 0)), 1500)
      .chain(
        new TWEEN.Tween(washBottleMesh.rotation)
          .to({ z: -0.5 }, 800) // tilt
          .onComplete(() => {
            // pour water stream
            liquidStream.position.copy(beakerMouth.clone().add(new THREE.Vector3(0.1, -0.35, 0)));
            liquidStream.material.color.setHex(0xa5f3fc); // clear blue-white water color
            liquidStream.visible = true;
            // dilute scale
            new TWEEN.Tween(beakerLiquid.scale)
              .to({ y: 0.95 }, 2000)
              .start();
          })
          .chain(
            new TWEEN.Tween({ t: 0 })
              .to({ t: 1 }, 2200)
              .onComplete(() => {
                liquidStream.visible = false;
              })
              .chain(
                new TWEEN.Tween(washBottleMesh.rotation)
                  .to({ z: 0 }, 800)
                  .chain(
                    new TWEEN.Tween(washBottleMesh.position)
                      .to(POSITIONS.washBottle, 1200)
                      .onComplete(() => {
                        isPlaying = false;
                        currentTween = null;
                        experimentState.coolingCompleted = true;
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 7) {
    // 7. Transfer to volumetric flask & pipette to conical flask
    // A: Pour beaker into Volumetric Flask
    const volMouth = POSITIONS.volFlask.clone().add(new THREE.Vector3(0, 1.3, 0));

    currentTween = new TWEEN.Tween(beakerMesh.position)
      .to(volMouth.clone().add(new THREE.Vector3(-0.6, 0.4, 0)), 1500)
      .onStart(() => {
        // align beaker liquid
        beakerLiquid.visible = false;
      })
      .chain(
        new TWEEN.Tween(beakerMesh.rotation)
          .to({ z: -Math.PI / 2.2 }, 1000) // tilt pour
          .onStart(() => {
            liquidStream.position.copy(volMouth.clone().add(new THREE.Vector3(0, -0.6, 0)));
            liquidStream.visible = true;

            // Fill volumetric flask
            volLiquid.scale.y = 0.001;
            new TWEEN.Tween(volLiquid.scale)
              .to({ y: 0.95 }, 2000)
              .start();
          })
          .chain(
            new TWEEN.Tween({ t: 0 })
              .to({ t: 1 }, 2200)
              .onComplete(() => {
                liquidStream.visible = false;
              })
              .chain(
                new TWEEN.Tween(beakerMesh.rotation)
                  .to({ z: 0 }, 1000)
                  .chain(
                    new TWEEN.Tween(beakerMesh.position)
                      .to(POSITIONS.beaker.clone().add(new THREE.Vector3(0, 0.45, 0)), 1200)
                      .onComplete(() => {
                        // Part B: Pipette transfers 25mL to conical flask
                        pipetteTransferAnimation();
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 8) {
    // 8. Add Ammonium hydroxide
    pipetteMesh.position.copy(POSITIONS.toolInactive);
    pipetteMesh.visible = true;

    setPipetteColor(0xe0f7fa, 0.5);
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

    const nh4Mouth = POSITIONS.nh4oh.clone().add(new THREE.Vector3(0, 0.8, 0));
    const flaskMouth = POSITIONS.flask.clone().add(new THREE.Vector3(0, 1.2, 0));

    currentTween = new TWEEN.Tween(pipetteMesh.position)
      .to(nh4Mouth, 1200)
      .chain(
        new TWEEN.Tween(pipetteMesh.position)
          .to(nh4Mouth.clone().add(new THREE.Vector3(0, -0.25, 0)), 600)
          .onComplete(() => {
            pipetteMesh.getObjectByName("pipetteLiquid").visible = true;
          })
          .chain(
            new TWEEN.Tween(pipetteMesh.position)
              .to(flaskMouth, 1200)
              .chain(
                new TWEEN.Tween(pipetteMesh.position)
                  .to(flaskMouth, 2000)
                  .onStart(() => {
                    liquidStream.material.color.setHex(0xe0f7fa);
                    liquidStream.position.copy(flaskMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                    liquidStream.visible = true;
                  })
                  .onComplete(() => {
                    liquidStream.visible = false;
                    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                    flaskLiquid.scale.y = 0.45;
                  })
                  .chain(
                    new TWEEN.Tween(pipetteMesh.position)
                      .to(POSITIONS.toolInactive, 1000)
                      .onStart(() => {
                        playMixingAnimation(conicalFlaskMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.ammoniumHydroxideAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 9) {
    // 9. Show bluish precipitate (happens automatically)
    new TWEEN.Tween(flaskLiquidMaterial.color)
      .to({ r: 0.6, g: 0.88, b: 0.95 }, 1500) // pale blue-white
      .onStart(() => {
        flaskLiquidMaterial.opacity = 0.92; // cloudy
        flaskLiquidMaterial.roughness = 0.85; // matte
      })
      .start();

    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 2000)
      .onComplete(() => {
        isPlaying = false;
        currentTween = null;
      });
    currentTween.start();

  } else if (step === 10) {
    // 10. Add acetic acid
    pipetteMesh.position.copy(POSITIONS.toolInactive);
    pipetteMesh.visible = true;

    setPipetteColor(0xe0f7fa, 0.5);
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

    const acidMouth = POSITIONS.acetic.clone().add(new THREE.Vector3(0, 0.8, 0));
    const flaskMouth = POSITIONS.flask.clone().add(new THREE.Vector3(0, 1.2, 0));

    currentTween = new TWEEN.Tween(pipetteMesh.position)
      .to(acidMouth, 1200)
      .chain(
        new TWEEN.Tween(pipetteMesh.position)
          .to(acidMouth.clone().add(new THREE.Vector3(0, -0.25, 0)), 600)
          .onComplete(() => {
            pipetteMesh.getObjectByName("pipetteLiquid").visible = true;
          })
          .chain(
            new TWEEN.Tween(pipetteMesh.position)
              .to(flaskMouth, 1200)
              .chain(
                new TWEEN.Tween(pipetteMesh.position)
                  .to(flaskMouth, 2000)
                  .onStart(() => {
                    liquidStream.material.color.setHex(0xe0f7fa);
                    liquidStream.position.copy(flaskMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                    liquidStream.visible = true;
                  })
                  .onComplete(() => {
                    liquidStream.visible = false;
                    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                    flaskLiquid.scale.y = 0.55;
                  })
                  .chain(
                    new TWEEN.Tween(pipetteMesh.position)
                      .to(POSITIONS.toolInactive, 1000)
                      .onStart(() => {
                        playMixingAnimation(conicalFlaskMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.aceticAcidAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 11) {
    // 11. Dissolve precipitate to clear deep royal blue
    new TWEEN.Tween(flaskLiquidMaterial.color)
      .to({ r: 0.0, g: 0.15, b: 0.6 }, 1500) // royal blue
      .onStart(() => {
        flaskLiquidMaterial.opacity = 0.75; // clear
        flaskLiquidMaterial.roughness = 0.15;
      })
      .start();

    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 2000)
      .onComplete(() => {
        isPlaying = false;
        currentTween = null;
      });
    currentTween.start();

  } else if (step === 12) {
    // 12. Add KI solution
    pipetteMesh.position.copy(POSITIONS.toolInactive);
    pipetteMesh.visible = true;

    setPipetteColor(0xe0f7fa, 0.5);
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

    const kiMouth = POSITIONS.ki.clone().add(new THREE.Vector3(0, 0.8, 0));
    const flaskMouth = POSITIONS.flask.clone().add(new THREE.Vector3(0, 1.2, 0));

    currentTween = new TWEEN.Tween(pipetteMesh.position)
      .to(kiMouth, 1200)
      .chain(
        new TWEEN.Tween(pipetteMesh.position)
          .to(kiMouth.clone().add(new THREE.Vector3(0, -0.25, 0)), 600)
          .onComplete(() => {
            pipetteMesh.getObjectByName("pipetteLiquid").visible = true;
          })
          .chain(
            new TWEEN.Tween(pipetteMesh.position)
              .to(flaskMouth, 1200)
              .chain(
                new TWEEN.Tween(pipetteMesh.position)
                  .to(flaskMouth, 2000)
                  .onStart(() => {
                    liquidStream.material.color.setHex(0xe0f7fa);
                    liquidStream.position.copy(flaskMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                    liquidStream.visible = true;
                  })
                  .onComplete(() => {
                    liquidStream.visible = false;
                    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                    flaskLiquid.scale.y = 0.7;
                  })
                  .chain(
                    new TWEEN.Tween(pipetteMesh.position)
                      .to(POSITIONS.toolInactive, 1000)
                      .onStart(() => {
                        // Shake/mix beaker
                        playMixingAnimation(conicalFlaskMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.potassiumIodideAdded = true;
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 13) {
    // 13. Liberate Iodine -> turns dark brown suspension
    new TWEEN.Tween(flaskLiquidMaterial.color)
      .to({ r: 0.36, g: 0.25, b: 0.22 }, 1500) // dark brown iodine
      .onStart(() => {
        flaskLiquidMaterial.opacity = 0.95; // cloudy
        flaskLiquidMaterial.roughness = 0.7;
      })
      .start();

    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 2000)
      .onComplete(() => {
        isPlaying = false;
        currentTween = null;
      });
    currentTween.start();

  } else if (step === 14) {
    // 14. Start titration -> drips fall (handled by drips loop)
    isPlaying = true;

  } else if (step === 15) {
    // 15. Show pale yellow color
    isPlaying = true;

  } else if (step === 16) {
    // 16. Add starch indicator
    pipetteMesh.position.copy(POSITIONS.toolInactive);
    pipetteMesh.visible = true;

    setPipetteColor(0xffffff, 0.8);
    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;

    const starchMouth = POSITIONS.starch.clone().add(new THREE.Vector3(0, 0.8, 0));
    const flaskMouth = POSITIONS.flask.clone().add(new THREE.Vector3(0, 1.2, 0));

    currentTween = new TWEEN.Tween(pipetteMesh.position)
      .to(starchMouth, 1200)
      .chain(
        new TWEEN.Tween(pipetteMesh.position)
          .to(starchMouth.clone().add(new THREE.Vector3(0, -0.25, 0)), 600)
          .onComplete(() => {
            pipetteMesh.getObjectByName("pipetteLiquid").visible = true;
          })
          .chain(
            new TWEEN.Tween(pipetteMesh.position)
              .to(flaskMouth, 1200)
              .chain(
                new TWEEN.Tween(pipetteMesh.position)
                  .to(flaskMouth, 2000)
                  .onStart(() => {
                    liquidStream.material.color.setHex(0xffffff);
                    liquidStream.position.copy(flaskMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                    liquidStream.visible = true;
                  })
                  .onComplete(() => {
                    liquidStream.visible = false;
                    pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                    flaskLiquid.scale.y += 0.05;
                  })
                  .chain(
                    new TWEEN.Tween(pipetteMesh.position)
                      .to(POSITIONS.toolInactive, 1000)
                      .onStart(() => {
                        playMixingAnimation(conicalFlaskMesh, () => {
                          isPlaying = false;
                          currentTween = null;
                          experimentState.starchAdded = true;
                          nextStep();
                        });
                      })
                  )
              )
          )
      );
    currentTween.start();

  } else if (step === 17) {
    // 17. Show blue starch-iodine color (turns deep dark blue instantly)
    flaskLiquidMaterial.color.setHex(0x050e26); // deep dark blue-black
    flaskLiquidMaterial.opacity = 0.98;
    flaskLiquidMaterial.roughness = 0.7;

    currentTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 1500)
      .onComplete(() => {
        isPlaying = false;
        currentTween = null;
      });
    currentTween.start();

  } else if (step === 18) {
    // 18. Continue titration
    isPlaying = true;

  } else if (step === 19) {
    // 19. Remove blue colour
    isPlaying = true;

  } else if (step === 20) {
    // 20. Endpoint reached: Milky white precipitate
    isPlaying = false;
    flaskLiquidMaterial.color.setHex(0xf0f0eb); // clean creamy white
    flaskLiquidMaterial.opacity = 0.95;
    flaskLiquidMaterial.roughness = 0.8;
  }
}

function pipetteTransferAnimation() {
  const volMouth = POSITIONS.volFlask.clone().add(new THREE.Vector3(0, 1.3, 0));
  const flaskMouth = POSITIONS.flask.clone().add(new THREE.Vector3(0, 1.2, 0));

  currentTween = new TWEEN.Tween(pipetteMesh.position)
    .to(volMouth, 1500)
    .chain(
      new TWEEN.Tween(pipetteMesh.position)
        .to(volMouth.clone().add(new THREE.Vector3(0, -0.3, 0)), 800)
        .onComplete(() => {
          pipetteMesh.getObjectByName("pipetteLiquid").visible = true; // filled
        })
        .chain(
          new TWEEN.Tween(pipetteMesh.position)
            .to(flaskMouth, 1200)
            .chain(
              new TWEEN.Tween(pipetteMesh.position)
                .to(flaskMouth, 2000)
                .onStart(() => {
                  liquidStream.position.copy(flaskMouth.clone().add(new THREE.Vector3(0, -0.4, 0)));
                  liquidStream.visible = true;

                  // Fill conical flask with 25mL
                  flaskLiquid.scale.y = 0.001;
                  flaskLiquid.visible = true;
                  new TWEEN.Tween(flaskLiquid.scale)
                    .to({ y: 0.35 }, 1800)
                    .start();
                })
                .onComplete(() => {
                  liquidStream.visible = false;
                  pipetteMesh.getObjectByName("pipetteLiquid").visible = false;
                })
                .chain(
                  new TWEEN.Tween(pipetteMesh.position)
                    .to(POSITIONS.toolInactive, 1200)
                    .onComplete(() => {
                      isPlaying = false;
                      currentTween = null;
                      experimentState.volumetricTransferCompleted = true;
                      experimentState.pipettingCompleted = true;
                    })
                )
            )
        )
    );
  currentTween.start();
}

// Layout scroll helper functions
function scrollToSimulation() {
  document.querySelector(".simulation")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
function scrollToTable() {
  document.querySelector(".table")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
function scrollToVariables() {
  document.querySelector(".var-controls")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobile-controls-drawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

function updateStartButtonText() {
  const spans = document.querySelectorAll('.start-btn span');
  spans.forEach(span => {
    span.innerText = `Start Trial ${trialIndex}`;
  });
}

function validateStepInput(step) {
  // Clear any existing validation highlights first
  clearValidationHighlights();

  let isValid = true;
  let errorMsg = "";
  let fieldId = "";

  if (step === 1) {
    const val = parseFloat(document.getElementById('weight_spinner').value);
    if (isNaN(val) || val < 1.0 || val > 2.0) {
      isValid = false;
      errorMsg = "Please enter a valid weight for the brass sample (range: 1.00 - 2.00 g).";
      fieldId = "weight_spinner";
    }
  } else if (step === 2) {
    const val = parseFloat(document.getElementById('hno3_spinner').value);
    if (isNaN(val) || val < 8.0 || val > 12.0) {
      isValid = false;
      errorMsg = "Please enter a valid volume for Nitric Acid (range: 8.00 - 12.00 mL).";
      fieldId = "hno3_spinner";
    }
  } else if (step === 5) {
    const val = parseFloat(document.getElementById('urea_spinner').value);
    if (isNaN(val) || val < 0.8 || val > 1.2) {
      isValid = false;
      errorMsg = "Please enter a valid weight for Urea (range: 0.80 - 1.20 g).";
      fieldId = "urea_spinner";
    }
  } else if (step === 8) {
    const val = parseFloat(document.getElementById('nh4oh_spinner').value);
    if (isNaN(val) || val < 8.0 || val > 12.0) {
      isValid = false;
      errorMsg = "Please enter a valid volume for Ammonium Hydroxide (range: 8.00 - 12.00 mL).";
      fieldId = "nh4oh_spinner";
    }
  } else if (step === 10) {
    const val = parseFloat(document.getElementById('acetic_spinner').value);
    if (isNaN(val) || val < 4.0 || val > 6.0) {
      isValid = false;
      errorMsg = "Please enter a valid volume for Acetic Acid (range: 4.00 - 6.00 mL).";
      fieldId = "acetic_spinner";
    }
  } else if (step === 12) {
    const val = parseFloat(document.getElementById('ki_spinner').value);
    if (isNaN(val) || val < 8.0 || val > 12.0) {
      isValid = false;
      errorMsg = "Please enter a valid volume for KI Solution (range: 8.00 - 12.00 mL).";
      fieldId = "ki_spinner";
    }
  } else if (step === 16) {
    const val = parseFloat(document.getElementById('starch_spinner').value);
    if (isNaN(val) || val < 1.0 || val > 3.0) {
      isValid = false;
      errorMsg = "Please enter a valid volume for Starch indicator (range: 1.00 - 3.00 mL).";
      fieldId = "starch_spinner";
    }
  }

  if (!isValid) {
    highlightField(fieldId);
    showError(errorMsg);
    // Scroll the variables section into view so they see the highlighted field
    scrollToVariables();
  }

  return isValid;
}

function highlightField(fieldId) {
  const inputEl = document.getElementById(fieldId);
  if (inputEl) {
    inputEl.classList.add("validation-error-glow");
    // Also highlight the spinner parent/wrapper to show error clearly
    const parent = inputEl.parentElement;
    if (parent) {
      parent.style.border = "1.5px solid #ff4d6d";
      parent.style.borderRadius = "4px";
      parent.style.padding = "2px";
    }
  }
}

function clearValidationHighlights() {
  const inputs = document.querySelectorAll(".var-spinner");
  inputs.forEach(el => {
    el.classList.remove("validation-error-glow");
    const parent = el.parentElement;
    if (parent) {
      parent.style.border = "";
      parent.style.borderRadius = "";
      parent.style.padding = "";
    }
  });
}