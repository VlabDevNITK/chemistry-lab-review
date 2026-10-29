/**
 * simulation.js
 * Simulation State Machine and Physics Orchestration:
 * - Controls step-by-step experimental workflow
 * - Synchronizes Three.js apparatus models with chemistry reactions
 * - Drives continuous liquid delivery, meniscus movement, and color transition
 * - Generates high-precision 2D meniscus zoom view
 */

import * as THREE from "three";
import {
  createBuretteAssembly,
  createConicalFlask,
  createDropletSystem,
  createPipette,
  createFunnel,
  createReagentContainer
} from "./apparatus.js";

export class TitrationSimulation {
  constructor(sceneWorld, chemistryEngine, options = {}) {
    this.world = sceneWorld;
    this.chem = chemistryEngine;
    this.options = options;

    // Simulation Phase & Step State
    this.currentPhase = "phase1"; // 'phase1' | 'phase2'
    this.currentStep = 1;         // 1 to 8
    this.trialNumber = 1;

    // Liquid Readings
    this.initialReading = 0.0;
    this.currentReading = 0.0;
    this.titreVolume = 0.0;
    this.flaskBaseVolume = 0.0;

    // Stopcock and Titration Control
    this.isStopcockOpen = false;
    this.flowRate = 0.5; // mL per second
    this.isSwirling = false;
    this.swirlTimer = 0;

    // Chemical Reaction State
    this.hasBuffer = false;
    this.hasIndicator = false;
    this.hasSample = false;
    this.equivalenceVolume = 10.0;
    this.endpointReached = false;
    this.overshot = false;

    // Trial Records Storage
    this.trialsPhase1 = [];
    this.trialsPhase2 = [];

    // Notification callback to UI
    this.onStateChange = null;

    // Initialize 3D Apparatus in Scene
    this.initApparatus();

    // Register render loop update
    this.lastTime = performance.now();
    this.world.onUpdate((time) => this.update(time));
  }

  initApparatus() {
    const scene = this.world.scene;

    // 1. Burette Assembly
    this.burette = createBuretteAssembly();
    scene.add(this.burette.group);

    // 2. Conical Flask
    this.flask = createConicalFlask();
    scene.add(this.flask.group);

    // 3. Droplet System
    this.droplets = createDropletSystem(scene, this.burette.tipEmanationPoint);

    // 4. Pipette
    this.pipette = createPipette();
    scene.add(this.pipette.group);

    // 5. Funnel
    this.funnel = createFunnel();
    scene.add(this.funnel.group);
    this.funnel.group.visible = false;

    // 6. Reagent Containers on Bench
    this.reagents = {
      edta: createReagentContainer("0.01M EDTA", 0xdbeafe, 1.4, false),
      caco3: createReagentContainer("CaCO3 Std", 0xdbeafe, 2.3, false),
      waterSample: createReagentContainer("Water Sample", 0xe0f2fe, 3.2, false),
      buffer: createReagentContainer("Buffer pH 10", 0x38bdf8, 4.0, true),
      indicator: createReagentContainer("EBT Indicator", 0x1e3a8a, 4.7, true)
    };

    Object.values(this.reagents).forEach(container => scene.add(container));

    // Initialize Meniscus Zoom Canvas
    this.initMeniscusCanvas();

    // Setup initial phase
    this.preparePhase("phase1", 1);
  }

  initMeniscusCanvas() {
    this.meniscusCanvas = document.getElementById("meniscusCanvas");
    if (this.meniscusCanvas) {
      this.meniscusCtx = this.meniscusCanvas.getContext("2d");
      this.drawMeniscusZoom(0.0);
    }
  }

  /**
   * Draw Eye-Level Meniscus Magnifier
   */
  drawMeniscusZoom(readingML) {
    if (!this.meniscusCtx || !this.meniscusCanvas) return;
    const ctx = this.meniscusCtx;
    const w = this.meniscusCanvas.width;
    const h = this.meniscusCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background glass column
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#e2e8f0");
    grad.addColorStop(0.2, "#f8fafc");
    grad.addColorStop(0.5, "#ffffff");
    grad.addColorStop(0.8, "#f8fafc");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glass walls
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 0, w - 2, h);

    // Graduated scale around the current reading (+/- 1.0 mL window)
    const centerY = h / 2;
    const pxPerML = h / 2.0; // 2.0 mL total span displayed
    const startML = readingML - 1.0;

    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#1e293b";
    ctx.font = "bold 13px monospace";

    for (let ml = Math.floor(startML * 10) / 10; ml <= readingML + 1.2; ml += 0.1) {
      const roundedML = Number(ml.toFixed(1));
      if (roundedML < 0 || roundedML > 50) continue;

      const y = centerY + (roundedML - readingML) * pxPerML;
      const isMajor = Math.abs(roundedML % 1.0) < 0.01;
      const isHalf = Math.abs(roundedML % 0.5) < 0.01;

      ctx.beginPath();
      if (isMajor) {
        ctx.lineWidth = 2.5;
        ctx.moveTo(w - 35, y);
        ctx.lineTo(w - 5, y);
        ctx.stroke();
        ctx.fillText(roundedML.toFixed(0), 10, y + 4);
      } else if (isHalf) {
        ctx.lineWidth = 1.8;
        ctx.moveTo(w - 24, y);
        ctx.lineTo(w - 5, y);
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.0;
        ctx.moveTo(w - 15, y);
        ctx.lineTo(w - 5, y);
        ctx.stroke();
      }
    }

    // Liquid Fill in Zoom View (Lower half of the meniscus)
    ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
    ctx.fillRect(4, centerY, w - 8, h - centerY);

    // Concave Meniscus Curve (Eye-Level View)
    ctx.beginPath();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2.5;
    ctx.moveTo(6, centerY - 6);
    ctx.quadraticCurveTo(w / 2, centerY + 5, w - 6, centerY - 6);
    ctx.stroke();

    // Red Eye-Level Sightline indicator
    ctx.beginPath();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Reset or switch experimental phase
   */
  preparePhase(phaseName = "phase1", trialNum = 1) {
    this.currentPhase = phaseName;
    this.trialNumber = trialNum;
    this.currentStep = 1;

    // Reset liquid and chemical flags
    this.initialReading = 0.0;
    this.currentReading = 0.0;
    this.titreVolume = 0.0;
    this.isStopcockOpen = false;
    this.isSwirling = false;
    this.hasBuffer = false;
    this.hasIndicator = false;
    this.hasSample = false;
    this.endpointReached = false;
    this.overshot = false;

    // Compute expected equivalence point for current phase and trial
    if (this.currentPhase === "phase1") {
      this.equivalenceVolume = this.chem.getStandardizationEquivalenceVolume(this.trialNumber - 1);
      this.flaskBaseVolume = this.chem.stdCaco3Volume;
    } else {
      this.equivalenceVolume = this.chem.getSampleEquivalenceVolume(this.trialNumber - 1);
      this.flaskBaseVolume = this.chem.sampleVolume;
    }

    // Reset 3D apparatus visual state
    this.burette.setBuretteReading(0.0);
    this.burette.setStopcockOpen(false);
    this.flask.setVolume(10);
    this.flask.setColor("#e2e8f0"); // clean empty glassware
    this.droplets.reset();

    this.drawMeniscusZoom(0.0);
    this.notifyState();
  }

  // ============================================================================
  // Action 1: Fill Burette with EDTA using Funnel
  // ============================================================================
  actionFillBurette() {
    if (this.currentStep !== 1) return;

    // Animate funnel onto burette
    this.funnel.group.visible = true;
    this.funnel.group.position.set(-0.8, 7.2, 0);

    setTimeout(() => {
      // Liquid fills to 0.00 mL
      this.initialReading = 0.0;
      this.currentReading = 0.0;
      this.burette.setBuretteReading(0.0);
      this.drawMeniscusZoom(0.0);

      setTimeout(() => {
        // Remove funnel
        this.funnel.group.position.set(1.5, 0.8, 0);
        this.funnel.group.visible = false;
        this.advanceStep(2, "Burette filled with EDTA up to the 0.00 mL mark. Initial meniscus level set.");
      }, 700);
    }, 600);
  }

  // ============================================================================
  // Action 2: Pipette Solution into Conical Flask
  // ============================================================================
  actionPipetteSolution() {
    if (this.currentStep !== 2) return;

    const isStd = (this.currentPhase === "phase1");
    const sourceX = isStd ? 2.3 : 3.2;

    // Pipette moves to source beaker
    this.pipette.group.position.set(sourceX, 1.8, 0);
    this.pipette.setFilled(true, 0xbae6fd);

    setTimeout(() => {
      // Pipette moves to conical flask
      this.pipette.group.position.set(-0.8, 2.5, 0);

      setTimeout(() => {
        // Dispense into flask
        this.pipette.setFilled(false);
        this.hasSample = true;
        this.flask.setVolume(isStd ? this.chem.stdCaco3Volume : this.chem.sampleVolume);
        this.flask.setColor("#dbeafe"); // clear aqueous solution

        // Pipette returns to rest
        this.pipette.group.position.set(2.8, 1.2, 0);

        const volText = isStd
          ? `${this.chem.stdCaco3Volume} mL of 0.01 M CaCO3 standard solution`
          : `${this.chem.sampleVolume} mL of water sample`;
        this.advanceStep(3, `Transferred ${volText} into the conical flask. Solution is clear.`);
      }, 700);
    }, 600);
  }

  // ============================================================================
  // Action 3: Add Ammonia Buffer (pH 10)
  // ============================================================================
  actionAddBuffer() {
    if (this.currentStep !== 3) return;

    this.hasBuffer = true;
    this.advanceStep(4, "Added 1.0 mL of Ammonia Buffer (pH 10). Alkaline medium established for EDTA-metal chelation.");
  }

  // ============================================================================
  // Action 4: Add Eriochrome Black T (EBT) Indicator
  // ============================================================================
  actionAddIndicator() {
    if (this.currentStep !== 4) return;

    this.hasIndicator = true;
    // Immediate coordination of indicator with metal ions: forms Wine-Red complex
    this.flask.setColor("#990033");
    this.advanceStep(5, "Added 3-4 drops of EBT indicator. Solution turned distinct Wine-Red due to [Ca-EBT]+ complex.");
  }

  // ============================================================================
  // Action 5: Position Flask beneath Burette
  // ============================================================================
  actionPlaceFlask() {
    if (this.currentStep !== 5) return;

    this.advanceStep(6, "Flask placed under the burette tip on the white contrast porcelain tile. Ready for titration.");
  }

  // ============================================================================
  // Action 6: Toggle Stopcock (Start / Pause Titration)
  // ============================================================================
  actionToggleStopcock() {
    if (this.currentStep < 6) return;

    this.isStopcockOpen = !this.isStopcockOpen;
    this.burette.setStopcockOpen(this.isStopcockOpen);

    if (this.isStopcockOpen) {
      this.notifyState("Titration in progress. Observe droplets and swirling color transitions.");
    } else {
      this.notifyState("Titration paused. Check current burette reading and solution color.");
    }
  }

  // ============================================================================
  // Action 7: Swirl Conical Flask
  // ============================================================================
  actionSwirlFlask() {
    this.isSwirling = true;
    this.swirlTimer = 1.5; // swirl for 1.5 seconds
    this.flask.setSwirling(true);
    this.notifyState("Swirling conical flask to ensure thorough mixing.");
  }

  // ============================================================================
  // Action 8: Record Reading
  // ============================================================================
  actionRecordReading() {
    const currentTrials = (this.currentPhase === "phase1") ? this.trialsPhase1 : this.trialsPhase2;
    if (currentTrials.some(t => t.trialNum === this.trialNumber)) {
      this.notifyState(`Reading for Trial ${this.trialNumber} has already been recorded.`);
      return;
    }
    // If stopcock is still open, close it first
    if (this.isStopcockOpen) {
      this.isStopcockOpen = false;
      this.burette.setStopcockOpen(false);
    }

    const initial = Number(this.initialReading.toFixed(2));
    const final = Number(this.currentReading.toFixed(2));
    const titre = Number((final - initial).toFixed(2));

    const f = this.equivalenceVolume > 0 ? titre / this.equivalenceVolume : 0;
    let status = "Accurate";
    let observation = "Persistent Blue Endpoint";

    if (f < 0.98) {
      status = "Incomplete";
      observation = "Wine Red / Incomplete Titration";
    } else if (f > 1.05) {
      status = "Overshot";
      observation = "Deep Blue (Overshot)";
    } else if (this.trialNumber === 1) {
      status = "Rough";
      observation = "Clear Blue Endpoint (Pilot Trial)";
    }

    const trialRecord = {
      trialNum: this.trialNumber,
      phase: this.currentPhase,
      sampleVolume: (this.currentPhase === "phase1") ? this.chem.stdCaco3Volume : this.chem.sampleVolume,
      initial: initial,
      final: final,
      titre: titre,
      observation: observation,
      status: status,
      valid: (status !== "Incomplete")
    };

    if (this.currentPhase === "phase1") {
      this.trialsPhase1.push(trialRecord);
    } else {
      this.trialsPhase2.push(trialRecord);
    }

    // Check for concordance across current phase trials
    const currentTrials = (this.currentPhase === "phase1") ? this.trialsPhase1 : this.trialsPhase2;
    const concordance = this.chem.findConcordantTitre(currentTrials);

    if (concordance.hasConcordance) {
      if (this.currentPhase === "phase1") {
        this.acceptedConcordantPhase1 = concordance.concordantValue;
        this.chem.calculateStandardization(this.acceptedConcordantPhase1);
      } else {
        this.acceptedConcordantPhase2 = concordance.concordantValue;
        this.chem.calculateTotalHardness(this.acceptedConcordantPhase2);
      }
    }

    this.advanceStep(7, `Trial ${this.trialNumber} recorded: Titre = ${titre} mL (${observation}).`);
  }

  // ============================================================================
  // Action 9: Start Next Trial
  // ============================================================================
  actionNextTrial() {
    const nextTrialNum = this.trialNumber + 1;
    this.preparePhase(this.currentPhase, nextTrialNum);
  }

  // ============================================================================
  // Frame Update Loop (Physics, Meniscus, Droplets, Color Kinetics)
  // ============================================================================
  update(time) {
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Handle Swirling countdown
    if (this.isSwirling) {
      this.swirlTimer -= delta;
      this.flask.updateSwirl(delta);
      if (this.swirlTimer <= 0) {
        this.isSwirling = false;
        this.flask.setSwirling(false);
      }
    }

    // Handle Active Titration Delivery
    if (this.isStopcockOpen) {
      // Flow delivery rate: flowRate * delta (mL delivered this frame)
      const deliveredThisFrame = this.flowRate * delta;
      this.currentReading = Math.min(50.0, this.currentReading + deliveredThisFrame);
      this.titreVolume = Number((this.currentReading - this.initialReading).toFixed(2));

      // Update Burette liquid mesh & reading
      this.burette.setBuretteReading(this.currentReading);
      this.drawMeniscusZoom(this.currentReading);

      // Droplets physics
      this.droplets.update(delta, true, this.flowRate);

      // Update Conical flask liquid volume
      const currentFlaskTotalML = this.flaskBaseVolume + this.titreVolume;
      this.flask.setVolume(currentFlaskTotalML);

      // Compute Chemical Fraction Titrated
      const f = this.equivalenceVolume > 0 ? this.titreVolume / this.equivalenceVolume : 0;
      const colorInfo = this.chem.getSolutionColor(f, this.isSwirling);
      this.flask.setColor(colorInfo.hex);

      if (f >= 1.0 && !this.endpointReached) {
        this.endpointReached = true;
      }
      if (f > 1.03 && !this.overshot) {
        this.overshot = true;
      }

      this.notifyState();
    } else {
      this.droplets.update(delta, false);
    }
  }

  advanceStep(nextStepNumber, message) {
    this.currentStep = nextStepNumber;
    this.notifyState(message);
  }

  notifyState(message = null) {
    if (typeof this.onStateChange === "function") {
      this.onStateChange({
        phase: this.currentPhase,
        step: this.currentStep,
        trialNumber: this.trialNumber,
        initialReading: this.initialReading,
        currentReading: this.currentReading,
        titreVolume: this.titreVolume,
        isStopcockOpen: this.isStopcockOpen,
        isSwirling: this.isSwirling,
        hasBuffer: this.hasBuffer,
        hasIndicator: this.hasIndicator,
        hasSample: this.hasSample,
        endpointReached: this.endpointReached,
        overshot: this.overshot,
        equivalenceVolume: this.equivalenceVolume,
        trialsPhase1: this.trialsPhase1,
        trialsPhase2: this.trialsPhase2,
        acceptedConcordantPhase1: this.acceptedConcordantPhase1,
        acceptedConcordantPhase2: this.acceptedConcordantPhase2,
        message: message
      });
    }
  }
}
