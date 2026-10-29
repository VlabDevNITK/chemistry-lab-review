/**
 * experiment-bundle.js
 * Universal Standalone & Modular Chemistry Lab Engine:
 * Determination of Hardness of Water Using EDTA Titration
 * Strictly aligned with Professor Laboratory Manual (CHEM-01 VLAB Chemistry):
 * - Phase 1: Preparation of Standard EDTA Solution (Weighing EDTA salt, 250 mL Volumetric Flask, M = (W*4)/372.24)
 * - Phase 2: Determination of Total Hardness of Water Sample (25.0 mL sample, 3.0 mL buffer, pinch of EBT, wine red -> clear blue)
 * - No CaCO3 standardization titration. Realistic delicate burette graduations & clean floating label for flask.
 */

(function () {
  "use strict";

  // ============================================================================
  // 1. EXPERIMENT CONFIGURATION (PROFESSOR MANUAL)
  // ============================================================================
  const DEFAULT_CONFIG = {
    title: "Determination of Hardness of Water Using EDTA Titration",
    subtitle: "Complexometric Titration with Eriochrome Black T (EBT) Indicator",
    reference: "Professor Laboratory Manual / NITK Surathkal / IS 3025 (Part 21)",
    defaults: {
      edtaDisodiumSalt: {
        name: "Disodium EDTA Dihydrate (Na2H2Y·2H2O)",
        molarMass: 372.24,
        defaultMassG: 0.930,
        volumetricFlaskCapacityML: 250.0,
        nominalMolarity: 0.010
      },
      waterSample: {
        defaultVolumeML: 25.0,
        presetHardness: 240.0,
        presets: [
          { id: "soft", label: "Sample A (Soft ~75 ppm)", hardness: 75.0 },
          { id: "moderate", label: "Sample B (Moderate ~160 ppm)", hardness: 160.0 },
          { id: "hard", label: "Sample C (Hard Tap ~240 ppm)", hardness: 240.0 },
          { id: "veryHard", label: "Sample D (Borewell ~450 ppm)", hardness: 450.0 }
        ]
      },
      buffer: {
        name: "Ammonia Buffer (NH3-NH4Cl, pH 10)",
        pH: 10.0,
        defaultVolumeML: 3.0
      },
      indicator: {
        name: "Eriochrome Black T (EBT)",
        amount: "Pinch",
        colorInitial: "#990033", // Wine Red
        colorEndpoint: "#0284c7" // Clear Blue
      },
      titration: {
        concordanceToleranceML: 0.1,
        flowRates: {
          slow: 0.2,
          medium: 0.6,
          fast: 1.5,
          dropwise: 0.15
        }
      }
    }
  };

  // ============================================================================
  // 2. CHEMISTRY CALCULATION ENGINE
  // ============================================================================
  class ChemistryEngine {
    constructor(config) {
      this.config = config || DEFAULT_CONFIG;

      // Phase 1: EDTA Preparation
      this.edtaBottlePlusSaltW1 = 12.435; // g
      this.edtaEmptyBottleW2 = 11.505; // g
      this.edtaMassTransferred = Number((this.edtaBottlePlusSaltW1 - this.edtaEmptyBottleW2).toFixed(3)); // 0.930 g
      this.edtaMolarMass = 372.24; // g/mol
      this.volumetricFlaskCapacity = 250.0; // mL
      this.actualEdtaMolarity = this.calculateEdtaMolarity();

      // Phase 2: Water Sample Total Hardness
      this.sampleVolume = 25.0; // mL (Strictly 25.0 mL per Professor Manual)
      this.samplePresetHardness = 240.0; // ppm as CaCO3
      this.bufferVolume = 3.0; // mL (Strictly 3.0 mL per Professor Manual)
      this.caco3MolarMass = 100.087; // g/mol
      this.concordanceTolerance = 0.1;

      // Repeated trials variation (Trial 1, 2, 3...)
      this.variations = [0.0, 0.0, -0.05, 0.05];
    }

    calculateEdtaMolarity(massG = null) {
      const mass = (massG !== null && !isNaN(massG) && massG > 0) ? massG : this.edtaMassTransferred;
      // Formula from Professor Manual: Molarity of EDTA = (Weight of EDTA salt * 4) / Molecular weight of EDTA salt
      const molarity = (mass * 4.0) / this.edtaMolarMass;
      this.actualEdtaMolarity = Number(molarity.toFixed(6));
      return this.actualEdtaMolarity;
    }

    setEdtaMass(val) {
      const m = Math.max(0.5, Math.min(2.0, Number(val) || 0.930));
      this.edtaMassTransferred = Number(m.toFixed(3));
      this.calculateEdtaMolarity(this.edtaMassTransferred);
    }

    setSampleHardness(val) {
      this.samplePresetHardness = Math.max(10, Math.min(1000, Number(val) || 240));
    }

    setBufferVolume(val) {
      this.bufferVolume = Math.max(1.0, Math.min(10.0, Number(val) || 3.0));
    }

    getSampleEquivalenceVolume(trialIndex = 0) {
      // (MV)Hard Water = (MV)EDTA
      // Hardness (ppm) = M_HardWater * 100.087 * 1000
      // M_HardWater = Hardness / (100.087 * 1000)
      // V_EDTA = (M_HardWater * 25.0) / M_EDTA
      const mHardWater = this.samplePresetHardness / (this.caco3MolarMass * 1000.0);
      const theoVolume = (mHardWater * this.sampleVolume) / this.actualEdtaMolarity;
      const v = this.variations[trialIndex % this.variations.length] || 0.0;
      return Number(Math.max(1.0, theoVolume + v).toFixed(2));
    }

    calculateTotalHardness(edtaTitreML) {
      // Formula from Professor Manual:
      // (MV)Hard Water = (MV)EDTA
      // M_HardWater = (M_EDTA * V_EDTA) / V_HardWater
      // Total Hardness = M_HardWater * 100.087 * 1000 ppm of CaCO3 (or mg/L)
      const titre = Math.max(0.01, Number(edtaTitreML) || 0.01);
      const mHardWater = (this.actualEdtaMolarity * titre) / this.sampleVolume;
      const hardnessPpm = mHardWater * this.caco3MolarMass * 1000.0;
      const finalHardness = Number(hardnessPpm.toFixed(1));

      let category = "Soft";
      let desc = "Readily lathers with soap.";
      if (finalHardness >= 75 && finalHardness < 150) {
        category = "Moderately Hard";
        desc = "Acceptable drinking water, slight scaling.";
      } else if (finalHardness >= 150 && finalHardness <= 300) {
        category = "Hard";
        desc = "Noticeable scale deposits, high soap consumption.";
      } else if (finalHardness > 300) {
        category = "Very Hard";
        desc = "Severe scaling; water softening recommended.";
      }

      return {
        sampleVolume: this.sampleVolume,
        edtaTitre: titre,
        edtaMolarity: this.actualEdtaMolarity,
        mHardWater: Number(mHardWater.toFixed(6)),
        totalHardness: finalHardness,
        classification: { category, description: desc }
      };
    }

    findConcordantTitre(trials) {
      const valid = trials.filter(t => t.valid && t.status !== "Incomplete");
      if (valid.length < 2) {
        return { hasConcordance: false, concordantValue: null };
      }
      for (let i = 0; i < valid.length; i++) {
        for (let j = i + 1; j < valid.length; j++) {
          if (Math.abs(valid[i].titre - valid[j].titre) <= this.concordanceTolerance) {
            const avg = Number(((valid[i].titre + valid[j].titre) / 2.0).toFixed(2));
            return { hasConcordance: true, concordantValue: avg, trialsMatched: [valid[i].trialNum, valid[j].trialNum] };
          }
        }
      }
      return { hasConcordance: false, concordantValue: null };
    }

    getSolutionColor(fractionOfEquivalence, isSwirling) {
      if (fractionOfEquivalence <= 0.0) {
        return { hex: "#990033", name: "Wine Red", desc: "[M-EBT]+ complex" };
      }
      if (fractionOfEquivalence < 0.90) {
        return { hex: "#990033", name: "Wine Red", desc: "Predominantly wine red" };
      }
      if (fractionOfEquivalence < 0.98) {
        return {
          hex: isSwirling ? "#831843" : "#701a75",
          name: "Reddish Purple",
          desc: "Transient violet swirls"
        };
      }
      if (fractionOfEquivalence < 1.0) {
        return {
          hex: isSwirling ? "#4c1d95" : "#312e81",
          name: "Purple / Violet",
          desc: "Near equivalence point"
        };
      }
      if (fractionOfEquivalence <= 1.05) {
        return { hex: "#0284c7", name: "Clear Blue", desc: "Sharp Clear Blue endpoint! ([HIn]2-)" };
      }
      return { hex: "#0369a1", name: "Deep Blue", desc: "Overshot titration endpoint" };
    }
  }

  // ============================================================================
  // 3. LABORATORY 2D VECTOR GRAPHICS ENGINE
  // ============================================================================
  function createLaboratoryWorld(containerEl) {
    let canvas = document.getElementById("simCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "simCanvas";
      containerEl.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");

    let W = containerEl.clientWidth || 800;
    let H = containerEl.clientHeight || 500;
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
      W = containerEl.clientWidth || 800;
      H = containerEl.clientHeight || 500;
      dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const benchY = H - 65;

    function getLayout() {
      const buretteX = Math.round(Math.max(90, Math.min(135, W * 0.16)));
      const buretteTopY = 32;
      const buretteBotY = benchY - 155;
      const stopcockY = buretteBotY + 12;
      const jetTipY = stopcockY + 22;

      // Flask positions
      const prepX = Math.round(Math.max(buretteX + 115, Math.min(310, W * 0.38)));
      const idlePipetteX = Math.round(buretteX + (prepX - buretteX) * 0.52);

      // Reagent containers to the right of flask with guaranteed spacing
      const availRight = Math.max(0, (W - 35) - prepX);
      const minSpan = 270;
      const spreadFactor = availRight > minSpan ? Math.min(1.4, availRight / minSpan) : 1.0;

      const beakerGap = Math.round(92 * spreadFactor);
      const bufferGap = Math.round(62 * spreadFactor);
      const ebtGap = Math.round(56 * spreadFactor);
      const edtaGap = Math.round(60 * spreadFactor);

      const beakerSampleX = prepX + beakerGap;
      const bottleBufferX = beakerSampleX + bufferGap;
      const bottleEbtX = bottleBufferX + ebtGap;
      const bottleEdtaX = bottleEbtX + edtaGap;

      // Phase 1 Apparatus Positions
      const balanceX = Math.round(Math.max(80, Math.min(180, W * 0.22)));
      const volFlaskX = Math.round(Math.max(balanceX + 130, Math.min(370, W * 0.50)));
      const washBottleX = Math.round(Math.min(W - 60, volFlaskX + 120));

      return {
        buretteX,
        buretteTopY,
        buretteBotY,
        stopcockY,
        jetTipY,
        prepX,
        idlePipetteX,
        beakerSampleX,
        bottleBufferX,
        bottleEbtX,
        bottleEdtaX,
        balanceX,
        volFlaskX,
        washBottleX
      };
    }

    // Dynamic State
    let buretteReading = 0.0;
    let stopcockAngle = 0;
    let targetStopcockAngle = 0;
    let isStopcockOpen = false;
    let flaskPlaced = false;
    let flaskVolumeML = 25;
    let flaskColor = "#e2e8f0";
    let isSwirling = false;
    let swirlPhase = 0;
    let currentPhaseMode = "phase1"; // 'phase1' | 'phase2'

    // Phase 1 specific state
    let balanceWeightDisplay = "0.000 g";
    let isWeighingBottleOnBalance = false;
    let edtaCrystalsInFlask = false;
    let crystalDissolveProgress = 0.0; // 0.0 (solid) -> 1.0 (dissolved)
    let isVolFlaskSwirling = false;
    let volFlaskInvertAngle = 0; // Inversion angle in radians
    let volFlaskLiquidLevel = 0.0; // 0.0 (empty) to 1.0 (at 250 mL line)
    let isFunnelInFlask = true;
    let isStopperInFlask = false;
    let volFlaskStopperYOffset = 0;

    // Animated objects & Particle Systems
    let activeAnimation = null;
    let animatedFlaskX = null;
    let fallingDrops = [];
    let surfaceRipples = [];
    let ebtBlooms = [];
    let crystalParticles = [];
    let bubbleParticles = [];
    let transientColorSwirls = [];

    // ========================================================================
    // DRAWING PRIMITIVES
    // ========================================================================

    // 1. Realistic Laboratory Environment & Granite Countertop
    function drawBackground() {
      // Clean laboratory wall with soft overhead illumination gradient
      const wallGrad = ctx.createLinearGradient(0, 0, 0, benchY);
      wallGrad.addColorStop(0, "#f8fafc");
      wallGrad.addColorStop(0.5, "#f1f5f9");
      wallGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, benchY);

      // Ceramic Wall Tiles
      const tileW = 54;
      const tileH = 36;
      ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
      ctx.lineWidth = 0.75;
      for (let x = 0; x < W; x += tileW) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, benchY);
        ctx.stroke();
      }
      for (let y = 0; y < benchY; y += tileH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Overhead Fluorescent Soft Light Glow
      const glow = ctx.createRadialGradient(W / 2, 45, 20, W / 2, 45, W * 0.7);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      glow.addColorStop(0.4, "rgba(255, 255, 255, 0.2)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, benchY);

      // Laboratory Title Banner
      ctx.save();
      ctx.fillStyle = "rgba(15, 118, 110, 0.45)";
      ctx.font = "600 11px 'Poppins', -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NITK SURATHKAL  •  WATER QUALITY & COMPLEXOMETRIC TITRATION LABORATORY", W / 2, 70);
      ctx.restore();

      // Polished Black Granite Countertop
      const benchGrad = ctx.createLinearGradient(0, benchY, 0, H);
      benchGrad.addColorStop(0, "#1e293b");
      benchGrad.addColorStop(0.06, "#0f172a");
      benchGrad.addColorStop(0.4, "#020617");
      benchGrad.addColorStop(1, "#000000");
      ctx.fillStyle = benchGrad;
      ctx.fillRect(0, benchY, W, H - benchY);

      // Granite Beveled Edge Bullnose
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, benchY);
      ctx.lineTo(W, benchY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, benchY + 1.5);
      ctx.lineTo(W, benchY + 1.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, benchY + 3.5);
      ctx.lineTo(W, benchY + 3.5);
      ctx.stroke();
    }

    // 2. Glazed Porcelain Contrast Tile with Ceramic Depth
    function drawWhiteTile(bx) {
      const tileW = 120;
      const tileH = 9;
      const tileX = bx - tileW / 2;
      const tileY = benchY - 4;

      // Ambient drop shadow onto granite countertop
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(bx, tileY + tileH + 1, tileW * 0.52, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glazed ceramic body
      const tileGrad = ctx.createLinearGradient(0, tileY, 0, tileY + tileH);
      tileGrad.addColorStop(0, "#ffffff");
      tileGrad.addColorStop(0.4, "#f8fafc");
      tileGrad.addColorStop(0.85, "#e2e8f0");
      tileGrad.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = tileGrad;
      ctx.beginPath();
      ctx.roundRect(tileX, tileY, tileW, tileH, [3, 3, 1, 1]);
      ctx.fill();

      // Beveled rim highlights
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tileX + 2, tileY + 1);
      ctx.lineTo(tileX + tileW - 2, tileY + 1);
      ctx.stroke();

      // Tile Brand Stamp
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 7.5px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PORCELAIN CONTRAST TILE", bx, tileY + 6.5);
    }

    // 3. Heavy Retort Stand with Cast-Iron Crackle Base & Mirror-Chrome Rod
    function drawRetortStand(bx) {
      const rodX = bx - 88;
      const baseY = benchY - 12;
      const baseW = 54;
      const baseH = 12;

      // Heavy drop shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(rodX, benchY + 1, baseW * 0.6, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cast-Iron Base Block
      const baseGrad = ctx.createLinearGradient(rodX - baseW / 2, 0, rodX + baseW / 2, 0);
      baseGrad.addColorStop(0, "#1e293b");
      baseGrad.addColorStop(0.3, "#334155");
      baseGrad.addColorStop(0.7, "#1e293b");
      baseGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.roundRect(rodX - baseW / 2, baseY, baseW, baseH, [4, 4, 1, 1]);
      ctx.fill();

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Recessed Central Plate & Stamped Branding
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(rodX - 18, baseY + 3, 36, 6);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(rodX - 18, baseY + 3, 36, 6);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 6px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NITK LAB", rodX, baseY + 7.5);

      // Knurled leveling feet at corners
      ctx.fillStyle = "#64748b";
      ctx.fillRect(rodX - baseW / 2 + 2, benchY - 2, 6, 3);
      ctx.fillRect(rodX + baseW / 2 - 8, benchY - 2, 6, 3);

      // Polished Vertical Chrome Rod (multi-stop mirror sheen)
      const rodW = 7.5;
      const rodGrad = ctx.createLinearGradient(rodX - rodW / 2, 0, rodX + rodW / 2, 0);
      rodGrad.addColorStop(0, "#334155");
      rodGrad.addColorStop(0.2, "#64748b");
      rodGrad.addColorStop(0.45, "#ffffff"); // Gleaming specular reflection
      rodGrad.addColorStop(0.75, "#cbd5e1");
      rodGrad.addColorStop(1, "#1e293b");

      ctx.fillStyle = rodGrad;
      ctx.fillRect(rodX - rodW / 2, 28, rodW, baseY - 28);

      // Polished spherical chrome finial cap
      const capGrad = ctx.createRadialGradient(rodX - 1.5, 26, 1, rodX, 28, 5);
      capGrad.addColorStop(0, "#ffffff");
      capGrad.addColorStop(0.6, "#94a3b8");
      capGrad.addColorStop(1, "#334155");
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.arc(rodX, 28, 4.5, Math.PI, 0);
      ctx.fill();

      // Dual Bosshead Clamps (Top clamp & Bottom clamp)
      const clampYs = [85, benchY - 190];
      clampYs.forEach(cy => {
        // Cast aluminum bosshead body
        const bhGrad = ctx.createLinearGradient(rodX - 8, cy - 7, rodX + 8, cy + 7);
        bhGrad.addColorStop(0, "#334155");
        bhGrad.addColorStop(0.5, "#1e293b");
        bhGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = bhGrad;
        ctx.beginPath();
        ctx.roundRect(rodX - 8, cy - 7, 16, 14, 2);
        ctx.fill();

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Brass knurled T-screw on rod
        const screwGrad = ctx.createLinearGradient(rodX - 14, cy - 3, rodX - 8, cy + 3);
        screwGrad.addColorStop(0, "#f59e0b");
        screwGrad.addColorStop(0.5, "#fbbf24");
        screwGrad.addColorStop(1, "#b45309");
        ctx.fillStyle = screwGrad;
        ctx.beginPath();
        ctx.roundRect(rodX - 14, cy - 3, 6, 6, 1.5);
        ctx.fill();

        // Extension Arm to burette
        const armGrad = ctx.createLinearGradient(0, cy - 3, 0, cy + 3);
        armGrad.addColorStop(0, "#94a3b8");
        armGrad.addColorStop(0.4, "#f8fafc");
        armGrad.addColorStop(1, "#475569");
        ctx.fillStyle = armGrad;
        ctx.fillRect(rodX + 8, cy - 3, (bx - rodX) - 18, 6);

        // Clamp jaw bracket & red cork/rubber grips holding burette
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(bx - 16, cy - 7, 6, 14, 2);
        ctx.roundRect(bx + 10, cy - 7, 6, 14, 2);
        ctx.fill();

        // Protective red cork lining
        ctx.fillStyle = "#b91c1c";
        ctx.fillRect(bx - 12, cy - 5, 2, 10);
        ctx.fillRect(bx + 10, cy - 5, 2, 10);
      });
    }

    // 4. Photorealistic 50 mL Glass Burette with Delicate Fine Graduations
    function drawBurette(bx, topY, botY, readingML) {
      const tubeW = 20;
      const leftX = bx - tubeW / 2;
      const rightX = bx + tubeW / 2;
      const tubeH = botY - topY;

      // Flared top mouth with beaded rim
      const rimGrad = ctx.createLinearGradient(leftX - 4, 0, rightX + 4, 0);
      rimGrad.addColorStop(0, "rgba(224, 242, 254, 0.5)");
      rimGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.9)");
      rimGrad.addColorStop(0.7, "rgba(224, 242, 254, 0.6)");
      rimGrad.addColorStop(1, "rgba(186, 230, 253, 0.7)");

      ctx.fillStyle = rimGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftX - 3.5, topY);
      ctx.lineTo(leftX, topY + 7);
      ctx.lineTo(rightX, topY + 7);
      ctx.lineTo(rightX + 3.5, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Optical Borosilicate Glass Cylinder Body
      const glassGrad = ctx.createLinearGradient(leftX, 0, rightX, 0);
      glassGrad.addColorStop(0, "rgba(224, 242, 254, 0.5)");
      glassGrad.addColorStop(0.15, "rgba(240, 249, 255, 0.3)");
      glassGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.18)");
      glassGrad.addColorStop(0.85, "rgba(224, 242, 254, 0.35)");
      glassGrad.addColorStop(1, "rgba(186, 230, 253, 0.5)");

      ctx.fillStyle = glassGrad;
      ctx.fillRect(leftX, topY + 7, tubeW, tubeH - 7);

      // Liquid Column inside Burette
      const zeroY = topY + 16;
      const fiftyY = botY - 8;
      const clampedReading = Math.max(0, Math.min(50, readingML));
      const meniscusY = zeroY + (clampedReading / 50.0) * (fiftyY - zeroY);

      if (meniscusY < botY) {
        const liqGrad = ctx.createLinearGradient(leftX, 0, rightX, 0);
        liqGrad.addColorStop(0, "rgba(186, 230, 253, 0.7)");
        liqGrad.addColorStop(0.3, "rgba(224, 242, 254, 0.85)");
        liqGrad.addColorStop(0.7, "rgba(224, 242, 254, 0.85)");
        liqGrad.addColorStop(1, "rgba(147, 197, 253, 0.75)");
        ctx.fillStyle = liqGrad;
        ctx.fillRect(leftX + 1, meniscusY, tubeW - 2, botY - meniscusY);

        // Realistic Capillary Curved Liquid Meniscus
        ctx.beginPath();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.6;
        ctx.moveTo(leftX + 1, meniscusY - 1);
        ctx.quadraticCurveTo(bx, meniscusY + 3.2, rightX - 1, meniscusY - 1);
        ctx.stroke();

        // Meniscus surface highlight crescent
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.0;
        ctx.moveTo(leftX + 2.5, meniscusY);
        ctx.quadraticCurveTo(bx, meniscusY + 2.5, rightX - 2.5, meniscusY);
        ctx.stroke();
      }

      // Outer Glass Wall Contours
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftX, topY + 7);
      ctx.lineTo(leftX, botY);
      ctx.moveTo(rightX, topY + 7);
      ctx.lineTo(rightX, botY);
      ctx.stroke();

      // Sharp Specular Reflection Highlight (Left)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftX + 2.5, topY + 8);
      ctx.lineTo(leftX + 2.5, botY - 3);
      ctx.stroke();

      // Soft Specular Reflection (Right)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(rightX - 2.5, topY + 8);
      ctx.lineTo(rightX - 2.5, botY - 3);
      ctx.stroke();

      // DELICATE, CRISP, ULTRA-FINE GRADUATION TICKS & NUMBERS
      ctx.textAlign = "right";
      ctx.font = "5.5px 'Segoe UI', system-ui, Arial, sans-serif";

      for (let ml = 0; ml <= 50; ml += 1) {
        const y = zeroY + (ml / 50.0) * (fiftyY - zeroY);
        const isMajor = (ml % 5 === 0);

        ctx.beginPath();
        if (isMajor) {
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 0.85;
          ctx.moveTo(rightX, y);
          ctx.lineTo(rightX - 5.5, y);
          ctx.stroke();

          // Delicate numeral cleanly to the left of the major tick
          ctx.fillStyle = "#1e293b";
          ctx.fillText(ml.toString(), rightX - 7, y + 2);
        } else {
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 0.5;
          ctx.moveTo(rightX, y);
          ctx.lineTo(rightX - 2.8, y);
          ctx.stroke();
        }
      }

      // Class A Laboratory Specification Stamp
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 6px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("50 mL : 0.1", bx, topY + 13);

      // Stopcock Valve Housing Barrel
      const stopGrad = ctx.createLinearGradient(bx - 7, botY, bx + 7, botY + 18);
      stopGrad.addColorStop(0, "rgba(224, 242, 254, 0.8)");
      stopGrad.addColorStop(0.5, "rgba(240, 249, 255, 0.95)");
      stopGrad.addColorStop(1, "rgba(186, 230, 253, 0.75)");
      ctx.fillStyle = stopGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(bx - 6.5, botY, 13, 18, 2);
      ctx.fill();
      ctx.stroke();

      // Precision Teflon Stopcock Handle Key (Rotatable)
      const stopcockY = botY + 9;
      ctx.save();
      ctx.translate(bx, stopcockY);
      ctx.rotate(stopcockAngle);

      // Ergonomic Stopcock Key Handle
      const keyGrad = ctx.createLinearGradient(-15, -4, 15, 4);
      if (isStopcockOpen) {
        keyGrad.addColorStop(0, "#10b981");
        keyGrad.addColorStop(0.5, "#34d399");
        keyGrad.addColorStop(1, "#059669");
      } else {
        keyGrad.addColorStop(0, "#ef4444");
        keyGrad.addColorStop(0.5, "#f87171");
        keyGrad.addColorStop(1, "#dc2626");
      }
      ctx.fillStyle = keyGrad;
      ctx.strokeStyle = isStopcockOpen ? "#047857" : "#b91c1c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-15, -4, 30, 8, 3.5);
      ctx.fill();
      ctx.stroke();

      // Finger grip indents on handle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-8.5, 0, 1.8, 0, Math.PI * 2);
      ctx.arc(8.5, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Capillary Jet Tip
      const jetStartY = botY + 18;
      const jetTipY = jetStartY + 15;
      const jetGrad = ctx.createLinearGradient(bx - 3, 0, bx + 3, 0);
      jetGrad.addColorStop(0, "rgba(224, 242, 254, 0.85)");
      jetGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      jetGrad.addColorStop(1, "rgba(186, 230, 253, 0.8)");

      ctx.fillStyle = jetGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - 3.2, jetStartY);
      ctx.lineTo(bx - 1.2, jetTipY);
      ctx.lineTo(bx + 1.2, jetTipY);
      ctx.lineTo(bx + 3.2, jetStartY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dynamic Pendant Droplet at Tip (elongating with surface tension when open)
      if (isStopcockOpen) {
        const dropCycle = (performance.now() % 400) / 400; // 0 to 1
        const dropH = 2.0 + dropCycle * 2.2;
        const dropW = 1.8 + dropCycle * 0.8;
        const dropY = jetTipY + dropH;

        ctx.fillStyle = "rgba(186, 230, 253, 0.92)";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(bx - dropW / 2, jetTipY);
        ctx.quadraticCurveTo(bx - dropW, dropY - dropH * 0.3, bx, dropY);
        ctx.quadraticCurveTo(bx + dropW, dropY - dropH * 0.3, bx + dropW / 2, jetTipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5. 250 mL Conical (Erlenmeyer) Flask with Orbital Swirling & Watercolor Blooms
    function drawConicalFlask(fx, fy, volumeML, liquidColorHex, swirling) {
      ctx.save();

      // Authentic Orbital Rocking Motion with Centrifugal Slosh
      let angle = 0;
      let swayX = 0;
      if (swirling) {
        angle = Math.sin(swirlPhase) * 0.055;
        swayX = Math.cos(swirlPhase) * 3.0;
        ctx.translate(fx + swayX, fy);
        ctx.rotate(angle);
        ctx.translate(-(fx + swayX), -fy);
      }

      const curFx = fx + swayX;
      const flaskH = 94;
      const baseW = 98;
      const neckW = 24;
      const neckH = 27;
      const rimW = 32;

      const baseY = fy;
      const shoulderY = baseY - (flaskH - neckH);
      const rimY = baseY - flaskH;

      // Bench drop shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(curFx, baseY + 1.5, baseW * 0.48, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mirror reflection on polished countertop
      ctx.save();
      ctx.beginPath();
      ctx.rect(curFx - baseW / 2 - 10, benchY, baseW + 20, 25);
      ctx.clip();
      ctx.translate(curFx, benchY * 2);
      ctx.scale(1, -0.25);
      ctx.translate(-curFx, 0);

      ctx.fillStyle = "rgba(224, 242, 254, 0.12)";
      ctx.beginPath();
      ctx.moveTo(curFx - rimW / 2, rimY);
      ctx.lineTo(curFx + rimW / 2, rimY);
      ctx.lineTo(curFx + baseW / 2, baseY);
      ctx.lineTo(curFx - baseW / 2, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Glass Body Silhouette Path
      ctx.beginPath();
      ctx.moveTo(curFx - rimW / 2, rimY);
      ctx.lineTo(curFx + rimW / 2, rimY);
      ctx.lineTo(curFx + neckW / 2, rimY + 4);
      ctx.lineTo(curFx + neckW / 2, shoulderY);
      ctx.lineTo(curFx + baseW / 2, baseY - 5);
      ctx.quadraticCurveTo(curFx + baseW / 2, baseY, curFx + baseW / 2 - 8, baseY);
      ctx.lineTo(curFx - baseW / 2 + 8, baseY);
      ctx.quadraticCurveTo(curFx - baseW / 2, baseY, curFx - baseW / 2, baseY - 5);
      ctx.lineTo(curFx - neckW / 2, shoulderY);
      ctx.lineTo(curFx - neckW / 2, rimY + 4);
      ctx.closePath();

      // Optical Glass Translucency
      const bodyGlassGrad = ctx.createLinearGradient(curFx - baseW / 2, 0, curFx + baseW / 2, 0);
      bodyGlassGrad.addColorStop(0, "rgba(224, 242, 254, 0.42)");
      bodyGlassGrad.addColorStop(0.2, "rgba(240, 249, 255, 0.22)");
      bodyGlassGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
      bodyGlassGrad.addColorStop(0.8, "rgba(240, 249, 255, 0.25)");
      bodyGlassGrad.addColorStop(1, "rgba(186, 230, 253, 0.45)");

      ctx.fillStyle = bodyGlassGrad;
      ctx.fill();

      // Volumetric Liquid Rendering
      if (volumeML > 0) {
        ctx.save();
        ctx.clip(); // Restrict liquid within glass silhouette

        const bodyH = flaskH - neckH;
        const maxVol = 200;
        const fillFraction = Math.min(1.0, Math.max(0.12, volumeML / maxVol));
        const liqH = fillFraction * (bodyH - 8);
        const curLiqY = baseY - liqH;

        const hFromBase = baseY - curLiqY;
        const topLiqW = baseW - (hFromBase / bodyH) * (baseW - neckW);

        // Fluid Slosh Dynamic Meniscus Angle when swirling
        const sloshDeltaY = swirling ? Math.sin(swirlPhase) * 4.5 : 0;

        // Multi-Tone 3D Volumetric Fluid Gradient
        const liqGrad = ctx.createLinearGradient(curFx - topLiqW / 2, curLiqY, curFx + topLiqW / 2, baseY);
        liqGrad.addColorStop(0, liquidColorHex);
        liqGrad.addColorStop(0.5, liquidColorHex);
        liqGrad.addColorStop(1, liquidColorHex);

        ctx.fillStyle = liqGrad;
        ctx.beginPath();
        ctx.moveTo(curFx - topLiqW / 2 - 2, curLiqY + sloshDeltaY);
        ctx.quadraticCurveTo(curFx, curLiqY + 2, curFx + topLiqW / 2 + 2, curLiqY - sloshDeltaY);
        ctx.lineTo(curFx + baseW / 2 + 6, baseY + 4);
        ctx.lineTo(curFx - baseW / 2 - 6, baseY + 4);
        ctx.closePath();
        ctx.fill();

        // Curved 3D Meniscus Surface
        ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
        ctx.beginPath();
        ctx.ellipse(curFx, curLiqY + 1, topLiqW * 0.46, 3.0, swirling ? angle * 1.5 : 0, 0, Math.PI * 2);
        ctx.fill();

        // EBT Watercolor Blooming Smoke Plumes (Smooth Fractal Radial Diffusion)
        ebtBlooms.forEach(b => {
          const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
          bg.addColorStop(0, `rgba(153, 0, 51, ${b.alpha * 0.95})`);
          bg.addColorStop(0.35, `rgba(136, 19, 55, ${b.alpha * 0.85})`);
          bg.addColorStop(0.7, `rgba(136, 19, 55, ${b.alpha * 0.45})`);
          bg.addColorStop(1, "rgba(136, 19, 55, 0)");
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          // Fractal billow clusters
          for (let k = 0; k < 4; k++) {
            const offAngle = (k * Math.PI) / 2 + b.radius * 0.05;
            const dist = b.radius * 0.45;
            const cx = b.x + Math.cos(offAngle) * dist;
            const cy = b.y + Math.sin(offAngle) * dist * 0.7;
            const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.radius * 0.5);
            cGrad.addColorStop(0, `rgba(136, 19, 55, ${b.alpha * 0.65})`);
            cGrad.addColorStop(1, "rgba(136, 19, 55, 0)");
            ctx.fillStyle = cGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, b.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Transient Violet / Blue Swirl Streamers during Titration
        transientColorSwirls.forEach(s => {
          const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
          sg.addColorStop(0, `rgba(2, 132, 199, ${s.alpha * 0.9})`);
          sg.addColorStop(0.6, `rgba(76, 29, 149, ${s.alpha * 0.55})`);
          sg.addColorStop(1, "rgba(76, 29, 149, 0)");
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Surface Ripples from Falling Drops
        surfaceRipples.forEach(r => {
          ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(r.x, curLiqY + 1, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Fluid Vortex & Centrifugal Wall Creep during Swirling
        if (swirling) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(curFx, curLiqY + 2, topLiqW * 0.35, 2.0, angle, 0, Math.PI * 2);
          ctx.stroke();

          // Micro bubbles
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          for (let m = 0; m < 5; m++) {
            const bx = curFx + Math.sin(swirlPhase * 2 + m) * (topLiqW * 0.3);
            const by = curLiqY + 3 + (m % 3) * 2;
            ctx.beginPath();
            ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // SUBTLE CERAMIC WHITE LABWARE GRADUATIONS
      ctx.save();
      const marks = [
        { ml: 200, my: shoulderY + 28 },
        { ml: 150, my: shoulderY + 41 },
        { ml: 100, my: shoulderY + 54 },
        { ml: 50,  my: shoulderY + 67 }
      ];

      marks.forEach(m => {
        const hFromBase = baseY - m.my;
        const curW = baseW - (hFromBase / (flaskH - neckH)) * (baseW - neckW);
        const leftWallX = curFx - curW / 2;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(leftWallX + 4, m.my);
        ctx.lineTo(leftWallX + 13, m.my);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "6.5px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(m.ml.toString(), leftWallX + 16, m.my + 2.5);
      });
      ctx.restore();

      // Glass Wall Outline
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Specular Glass Reflection Streaks on Shoulder
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(curFx - baseW / 2 + 10, baseY - 8);
      ctx.lineTo(curFx - neckW / 2 + 2, shoulderY + 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(curFx + baseW / 2 - 10, baseY - 8);
      ctx.lineTo(curFx + neckW / 2 - 2, shoulderY + 2);
      ctx.stroke();

      // Flared Reinforced Glass Rim
      const rimGrad = ctx.createLinearGradient(curFx - rimW / 2, 0, curFx + rimW / 2, 0);
      rimGrad.addColorStop(0, "rgba(224, 242, 254, 0.9)");
      rimGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      rimGrad.addColorStop(1, "rgba(186, 230, 253, 0.85)");
      ctx.fillStyle = rimGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(curFx - rimW / 2, rimY - 1.5, rimW, 4.5, 1.8);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // FLOATING PILL LABEL ABOVE CONICAL FLASK (CLEAN & PROFESSIONAL)
      ctx.save();
      const badgeW = 106;
      const badgeH = 18;
      const badgeY = rimY - 18;

      ctx.fillStyle = "rgba(15, 118, 110, 0.92)";
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(curFx - badgeW / 2, badgeY, badgeW, badgeH, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("250 mL Conical Flask", curFx, badgeY + 12);
      ctx.restore();
    }

    // 6. Volumetric Pipette on Lab Rack (Resting Position)
    function drawIdlePipette(x, y) {
      ctx.save();
      ctx.translate(x, y);

      // Acrylic rack base
      ctx.fillStyle = "#334155";
      ctx.fillRect(-16, 0, 32, 4);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-2.5, -34, 5, 34);

      // Slender Glass Pipette
      ctx.rotate(-0.24);
      ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1;
      ctx.fillRect(-2, -54, 4, 54);
      ctx.strokeRect(-2, -54, 4, 54);

      // Central expanded bulb
      ctx.beginPath();
      ctx.ellipse(0, -28, 5.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red Rubber Safety Pipette Filler Bulb
      const bulbGrad = ctx.createRadialGradient(-1, -60, 1, 0, -58, 6);
      bulbGrad.addColorStop(0, "#f87171");
      bulbGrad.addColorStop(0.7, "#dc2626");
      bulbGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = bulbGrad;
      ctx.beginPath();
      ctx.arc(0, -58, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 7. Phase 2 Bench Reagents (Water Sample Beaker, Buffer Bottle, Amber EBT Jar, Std EDTA Stock)
    function drawPhase2Reagents(layout) {
      // --- Water Sample Beaker (25.0 mL) ---
      const bkX = layout.beakerSampleX;
      const bkY = benchY;
      const bkW = 48;
      const bkH = 54;

      // Drop shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(bkX, bkY + 1, bkW * 0.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass Beaker Body
      ctx.fillStyle = "rgba(224, 242, 254, 0.35)";
      ctx.fillRect(bkX - bkW / 2, bkY - bkH, bkW, bkH);

      // Blue Liquid inside
      const bkLiqGrad = ctx.createLinearGradient(bkX - bkW / 2, 0, bkX + bkW / 2, 0);
      bkLiqGrad.addColorStop(0, "rgba(186, 230, 253, 0.65)");
      bkLiqGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.8)");
      bkLiqGrad.addColorStop(1, "rgba(147, 197, 253, 0.7)");
      ctx.fillStyle = bkLiqGrad;
      ctx.fillRect(bkX - bkW / 2 + 2, bkY - bkH + 14, bkW - 4, bkH - 16);

      // Glass Beaker Outline & Pouring Spout
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bkX - bkW / 2, bkY - bkH, bkW, bkH);
      ctx.beginPath();
      ctx.moveTo(bkX - bkW / 2, bkY - bkH);
      ctx.lineTo(bkX - bkW / 2 - 4.5, bkY - bkH - 2.5);
      ctx.stroke();

      // Beaker Label
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#089b93";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(bkX - 22, bkY - 37, 44, 23, 3);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#0a363c";
      ctx.font = "bold 8.5px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Water", bkX, bkY - 26);
      ctx.font = "bold 7.5px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#089b93";
      ctx.fillText("Sample (25 mL)", bkX, bkY - 16);

      // --- Ammonia Buffer Bottle (pH 10) ---
      const bufX = layout.bottleBufferX;
      const bufY = benchY;
      const bufW = 34;
      const bufH = 54;

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(bufX, bufY + 1, bufW * 0.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(240, 249, 255, 0.75)";
      ctx.fillRect(bufX - bufW / 2, bufY - bufH, bufW, bufH);
      ctx.fillStyle = "rgba(191, 219, 254, 0.65)";
      ctx.fillRect(bufX - bufW / 2 + 2, bufY - bufH + 14, bufW - 4, bufH - 16);
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bufX - bufW / 2, bufY - bufH, bufW, bufH);

      // Dropper Pipette Top Assembly
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(bufX - 8, bufY - bufH - 8, 16, 8);
      ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
      ctx.fillRect(bufX - 2, bufY - bufH - 18, 4, 10);
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(bufX, bufY - bufH - 20, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Buffer Label
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.roundRect(bufX - 16, bufY - 36, 32, 21, 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Buffer", bufX, bufY - 26);
      ctx.fillText("pH 10 (3 mL)", bufX, bufY - 17);

      // --- Amber Glass EBT Indicator Jar (Pinch of Powder) ---
      const ebtX = layout.bottleEbtX;
      const ebtY = benchY;
      const ebtW = 34;
      const ebtH = 52;

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(ebtX, ebtY + 1, ebtW * 0.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Amber UV-protective Glass
      const amberGrad = ctx.createLinearGradient(ebtX - ebtW / 2, 0, ebtX + ebtW / 2, 0);
      amberGrad.addColorStop(0, "#451a03");
      amberGrad.addColorStop(0.3, "#78350f");
      amberGrad.addColorStop(0.7, "#92400e");
      amberGrad.addColorStop(1, "#451a03");
      ctx.fillStyle = amberGrad;
      ctx.fillRect(ebtX - ebtW / 2, ebtY - ebtH, ebtW, ebtH);
      ctx.strokeStyle = "#271003";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(ebtX - ebtW / 2, ebtY - ebtH, ebtW, ebtH);

      // Phenolic Black Screw Cap
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(ebtX - 8, ebtY - ebtH - 7, 16, 7);
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(ebtX, ebtY - ebtH - 14, 6, 0, Math.PI * 2);
      ctx.fill();

      // EBT Label
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.roundRect(ebtX - 15, ebtY - 35, 30, 20, 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      ctx.font = "bold 8px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EBT", ebtX, ebtY - 25);
      ctx.fillText("Pinch", ebtX, ebtY - 16);

      // --- Standard EDTA Solution Stock Flask ---
      const edtaX = layout.bottleEdtaX;
      const edtaY = benchY;
      const edtaW = 38;
      const edtaH = 64;

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(edtaX, edtaY + 1, edtaW * 0.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(240, 249, 255, 0.75)";
      ctx.fillRect(edtaX - edtaW / 2, edtaY - edtaH, edtaW, edtaH);
      ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
      ctx.fillRect(edtaX - edtaW / 2 + 2, edtaY - edtaH + 16, edtaW - 4, edtaH - 18);
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(edtaX - edtaW / 2, edtaY - edtaH, edtaW, edtaH);

      // Glass Stopper
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(edtaX - 9, edtaY - edtaH - 7, 18, 7);

      // Std EDTA Label
      ctx.fillStyle = "#0f766e";
      ctx.beginPath();
      ctx.roundRect(edtaX - 18, edtaY - 43, 36, 25, 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8.5px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Std EDTA", edtaX, edtaY - 32);
      ctx.fillText("0.010 M", edtaX, edtaY - 23);
      ctx.font = "bold 7px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Prepared", edtaX, edtaY - 14);
    }

    // 8. Phase 1 Apparatus: Digital Precision Balance, Weighing Bottle, 250 mL Volumetric Flask & Wash Bottle
    function drawPhase1Apparatus(layout) {
      const balX = layout.balanceX;
      const balY = benchY;

      // --- Digital Analytical Balance (Mettler Toledo / Sartorius Style) ---
      const balW = 104;
      const balH = 36;
      const panW = 62;
      const shieldH = 58;

      // Bench shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(balX, balY + 1.5, balW * 0.55, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leveling feet with adjustable knurled metal collars
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(balX - balW / 2 + 6, balY - 4, 10, 4);
      ctx.fillRect(balX + balW / 2 - 16, balY - 4, 10, 4);

      // Main Balance Chassis (Platinum-silver brushed casing)
      const balGrad = ctx.createLinearGradient(0, balY - balH, 0, balY);
      balGrad.addColorStop(0, "#f8fafc");
      balGrad.addColorStop(0.35, "#e2e8f0");
      balGrad.addColorStop(0.8, "#cbd5e1");
      balGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = balGrad;
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(balX - balW / 2, balY - balH, balW, balH - 4, 4);
      ctx.fill();
      ctx.stroke();

      // Miniature Circular Spirit Level Bubble
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(balX - balW / 2 + 14, balY - balH + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(balX - balW / 2 + 14, balY - balH + 8, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Glass Draft Shield Chamber (3-Sided Crystal-Clear Enclosure)
      const shieldY = balY - balH - shieldH;
      const shieldW = balW - 14;
      const shieldX = balX - shieldW / 2;

      ctx.fillStyle = "rgba(224, 242, 254, 0.15)";
      ctx.fillRect(shieldX, shieldY, shieldW, shieldH);

      // Aluminum corner posts
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(shieldX - 1.5, shieldY, 3, shieldH);
      ctx.fillRect(shieldX + shieldW - 1.5, shieldY, 3, shieldH);

      // Glass panels specular highlights
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shieldX + 4, shieldY + 4);
      ctx.lineTo(shieldX + 4, shieldY + shieldH - 4);
      ctx.moveTo(shieldX + shieldW - 4, shieldY + 4);
      ctx.lineTo(shieldX + shieldW - 4, shieldY + shieldH - 4);
      ctx.stroke();

      // Top sliding pane handle
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(balX - 10, shieldY - 3, 20, 3);

      // Circular Stainless Steel Weighing Pan (Lathe concentric texture)
      const panY = balY - balH - 4;
      const panGrad = ctx.createLinearGradient(balX - panW / 2, 0, balX + panW / 2, 0);
      panGrad.addColorStop(0, "#64748b");
      panGrad.addColorStop(0.2, "#cbd5e1");
      panGrad.addColorStop(0.5, "#ffffff");
      panGrad.addColorStop(0.8, "#cbd5e1");
      panGrad.addColorStop(1, "#64748b");

      ctx.fillStyle = panGrad;
      ctx.fillRect(balX - panW / 2, panY, panW, 4.5);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.strokeRect(balX - panW / 2, panY, panW, 4.5);

      // Sub-pan collar
      ctx.fillStyle = "#334155";
      ctx.fillRect(balX - 8, panY + 4.5, 16, 2.5);

      // Recessed High-Contrast Digital LCD Matrix Screen
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.roundRect(balX - 36, balY - 27, 72, 17, 2.5);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Digital Matrix Fluorescent Cyan Readout
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9.5px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(balanceWeightDisplay, balX, balY - 15);

      // Auxiliary LCD Indicators: [STABLE], [ZERO], g
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 5.5px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("STABLE", balX - 32, balY - 21);
      ctx.textAlign = "right";
      ctx.fillText("NET", balX + 32, balY - 21);

      // Tactile front panel buttons
      const btnW = 12;
      const btnH = 5;
      const btnYs = balY - 8;
      const btnXs = [balX - 22, balX - 6, balX + 10];
      btnXs.forEach(bx => {
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.roundRect(bx, btnYs, btnW, btnH, 1);
        ctx.fill();
      });

      // Label below balance
      ctx.fillStyle = "#0f766e";
      ctx.font = "bold 8px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Electronic Balance (±0.001 g)", balX, balY + 12);

      // --- Weighing Bottle on Pan or Resting ---
      if (isWeighingBottleOnBalance) {
        drawWeighingBottle(balX, panY - 1, true);
      }

      // --- 250 mL Volumetric Flask ---
      drawVolumetricFlask(
        layout.volFlaskX,
        benchY,
        volFlaskLiquidLevel,
        edtaCrystalsInFlask,
        isFunnelInFlask,
        isStopperInFlask,
        isVolFlaskSwirling,
        volFlaskInvertAngle,
        volFlaskStopperYOffset
      );

      // --- Ion-Exchange Wash Bottle ---
      drawWashBottle(layout.washBottleX, benchY);
    }

    // Helper: Draw Glass Weighing Bottle with Ground Glass Joint & Sparkling Crystals
    function drawWeighingBottle(x, y, hasSalt) {
      const wbW = 30;
      const wbH = 34;
      const wbX = x - wbW / 2;
      const wbY = y - wbH;

      // Optical borosilicate cylinder
      const bottleGrad = ctx.createLinearGradient(wbX, 0, wbX + wbW, 0);
      bottleGrad.addColorStop(0, "rgba(224, 242, 254, 0.45)");
      bottleGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.35)");
      bottleGrad.addColorStop(0.7, "rgba(240, 249, 255, 0.25)");
      bottleGrad.addColorStop(1, "rgba(186, 230, 253, 0.5)");

      ctx.fillStyle = bottleGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(wbX, wbY, wbW, wbH, 3);
      ctx.fill();
      ctx.stroke();

      // Specular highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(wbX + 2.5, wbY + 3);
      ctx.lineTo(wbX + 2.5, wbY + wbH - 3);
      ctx.stroke();

      // Ground-Glass Frosted Joint Neck
      const jointGrad = ctx.createLinearGradient(wbX + 6, 0, wbX + wbW - 6, 0);
      jointGrad.addColorStop(0, "rgba(203, 213, 225, 0.75)");
      jointGrad.addColorStop(0.5, "rgba(241, 245, 249, 0.9)");
      jointGrad.addColorStop(1, "rgba(203, 213, 225, 0.75)");
      ctx.fillStyle = jointGrad;
      ctx.fillRect(wbX + 6, wbY - 7, wbW - 12, 7);
      ctx.strokeStyle = "#0284c7";
      ctx.strokeRect(wbX + 6, wbY - 7, wbW - 12, 7);

      // Glass Pennyhead Stopper
      ctx.fillStyle = "rgba(186, 230, 253, 0.85)";
      ctx.beginPath();
      ctx.roundRect(wbX + 4, wbY - 11, wbW - 8, 4, 1.5);
      ctx.fill();
      ctx.stroke();

      // Faceted Crystalline EDTA Powder Bed
      if (hasSalt) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(wbX + 3, wbY + wbH - 2);
        ctx.lineTo(wbX + 3, wbY + wbH - 12);
        ctx.quadraticCurveTo(wbX + wbW / 2, wbY + wbH - 18, wbX + wbW - 3, wbY + wbH - 12);
        ctx.lineTo(wbX + wbW - 3, wbY + wbH - 2);
        ctx.closePath();
        ctx.fill();

        // Shimmering micro-crystals
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(wbX + 8, wbY + wbH - 7, 1.5, 0, Math.PI * 2);
        ctx.arc(wbX + 15, wbY + wbH - 11, 1.8, 0, Math.PI * 2);
        ctx.arc(wbX + 22, wbY + wbH - 6, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 6.5px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("EDTA", x, wbY + wbH - 4);
      }
    }

    // Helper: Draw 250 mL Volumetric Flask with Neck Calibration Ring & Inversion Mixing
    function drawVolumetricFlask(
      fx,
      fy,
      fillProgress,
      hasCrystals,
      showFunnel,
      showStopper,
      swirling,
      invertAngle = 0,
      stopperYOffset = 0
    ) {
      ctx.save();

      const totalH = 124;
      const baseW = 82;
      const neckW = 15;
      const neckH = 68;
      const rimW = 22;

      const baseY = fy;
      const pearBottomY = baseY - 8;
      const neckBottomY = baseY - (totalH - neckH);
      const rimY = baseY - totalH;
      const markY = rimY + 36; // Exact 250 mL Calibration Mark

      // 180° Inversion or Orbital Swirling
      const rotationCenterY = baseY - totalH * 0.45;
      ctx.translate(fx, rotationCenterY);
      if (invertAngle !== 0) {
        ctx.rotate(invertAngle);
      } else if (swirling) {
        const angle = Math.sin(swirlPhase) * 0.055;
        ctx.rotate(angle);
      }
      ctx.translate(-fx, -rotationCenterY);

      // Bench drop shadow (when not inverted)
      if (Math.abs(invertAngle) < 0.2) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.beginPath();
        ctx.ellipse(fx, baseY + 1.5, baseW * 0.46, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Volumetric Flask Pear Silhouette Path
      ctx.beginPath();
      ctx.moveTo(fx - rimW / 2, rimY);
      ctx.lineTo(fx + rimW / 2, rimY);
      ctx.lineTo(fx + neckW / 2, rimY + 4);
      ctx.lineTo(fx + neckW / 2, neckBottomY);
      ctx.quadraticCurveTo(fx + baseW / 2, pearBottomY - 16, fx + baseW / 2, pearBottomY);
      ctx.quadraticCurveTo(fx + baseW / 2, baseY, fx + baseW / 2 - 12, baseY);
      ctx.lineTo(fx - baseW / 2 + 12, baseY);
      ctx.quadraticCurveTo(fx - baseW / 2, baseY, fx - baseW / 2, pearBottomY);
      ctx.quadraticCurveTo(fx - baseW / 2, pearBottomY - 16, fx - neckW / 2, neckBottomY);
      ctx.lineTo(fx - neckW / 2, rimY + 4);
      ctx.closePath();

      // Translucent Optical Borosilicate Fill
      const flaskGlassGrad = ctx.createLinearGradient(fx - baseW / 2, 0, fx + baseW / 2, 0);
      flaskGlassGrad.addColorStop(0, "rgba(224, 242, 254, 0.45)");
      flaskGlassGrad.addColorStop(0.2, "rgba(240, 249, 255, 0.22)");
      flaskGlassGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
      flaskGlassGrad.addColorStop(0.8, "rgba(240, 249, 255, 0.25)");
      flaskGlassGrad.addColorStop(1, "rgba(186, 230, 253, 0.45)");
      ctx.fillStyle = flaskGlassGrad;
      ctx.fill();

      // Liquid Fill inside Volumetric Flask
      if (fillProgress > 0) {
        ctx.save();
        ctx.clip(); // Restrict fluid inside pear silhouette

        const currentLiquidY = baseY - fillProgress * (baseY - markY);
        const liqGrad = ctx.createLinearGradient(fx - baseW / 2, 0, fx + baseW / 2, 0);
        liqGrad.addColorStop(0, "rgba(186, 230, 253, 0.72)");
        liqGrad.addColorStop(0.3, "rgba(224, 242, 254, 0.88)");
        liqGrad.addColorStop(0.7, "rgba(224, 242, 254, 0.88)");
        liqGrad.addColorStop(1, "rgba(186, 230, 253, 0.72)");

        ctx.fillStyle = liqGrad;
        ctx.fillRect(fx - baseW, currentLiquidY, baseW * 2, baseY - currentLiquidY + 15);

        // Realistic Concave Meniscus
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const curW = currentLiquidY < neckBottomY ? neckW : baseW * 0.75;
        ctx.moveTo(fx - curW / 2, currentLiquidY);
        ctx.quadraticCurveTo(fx, currentLiquidY + 2.5, fx + curW / 2, currentLiquidY);
        ctx.stroke();

        // Effervescent rising air bubbles during inversion mixing
        bubbleParticles.forEach(b => {
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // Sparkling Crystalline EDTA Mound at Bottom
      if (hasCrystals && crystalDissolveProgress < 1.0) {
        const crystalAlpha = 1.0 - crystalDissolveProgress;
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${crystalAlpha})`;
        ctx.beginPath();
        ctx.ellipse(fx, baseY - 4, baseW * 0.35, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shimmering salt facets
        ctx.fillStyle = `rgba(203, 213, 225, ${crystalAlpha})`;
        ctx.beginPath();
        ctx.arc(fx - 12, baseY - 5, 2.0, 0, Math.PI * 2);
        ctx.arc(fx + 10, baseY - 4, 1.8, 0, Math.PI * 2);
        ctx.arc(fx - 2, baseY - 6, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Dissolving sparkling vortices when swirling
        if (isVolFlaskSwirling && crystalAlpha > 0.1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${crystalAlpha * 0.6})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(fx, baseY - 12, 18, 5, swirlPhase, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Outer Glass Wall Contours
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Specular Glass Reflections
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fx - neckW / 2 + 2, rimY + 8);
      ctx.lineTo(fx - neckW / 2 + 2, neckBottomY);
      ctx.quadraticCurveTo(fx - baseW / 2 + 8, pearBottomY - 12, fx - baseW / 2 + 8, pearBottomY);
      ctx.stroke();

      // DEEP COBALT BLUE CALIBRATION RING MARK (250 mL LINE)
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(fx - neckW / 2 + 0.8, markY);
      ctx.lineTo(fx + neckW / 2 - 0.8, markY);
      ctx.stroke();

      // Class A Laboratory Enamel Markings on Neck
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 5.5px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("250 mL", fx, markY - 6);
      ctx.font = "4.5px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("±0.15 mL 20°C", fx, markY + 8);

      // Flared Mouth Rim
      ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(fx - rimW / 2, rimY - 2, rimW, 4, 1.5);
      ctx.fill();
      ctx.stroke();

      // Glass Powder Funnel in Neck
      if (showFunnel) {
        ctx.fillStyle = "rgba(224, 242, 254, 0.75)";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx - 19, rimY - 22);
        ctx.lineTo(fx + 19, rimY - 22);
        ctx.lineTo(fx + 3.5, rimY);
        ctx.lineTo(fx + 3.5, rimY + 20);
        ctx.lineTo(fx - 3.5, rimY + 20);
        ctx.lineTo(fx - 3.5, rimY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Funnel reflection
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx - 16, rimY - 20);
        ctx.lineTo(fx - 3, rimY);
        ctx.stroke();
      }

      // Ground Glass Pennyhead Stopper
      if (showStopper) {
        const sY = rimY - 14 + stopperYOffset;
        ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(fx - 8, sY, 16, 14, 2);
        ctx.fill();
        ctx.stroke();

        // Hexagonal pennyhead handle
        ctx.beginPath();
        ctx.arc(fx, sY - 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      // Floating Pill Label above Volumetric Flask
      if (Math.abs(invertAngle) < 0.2) {
        ctx.save();
        const badgeW = 124;
        const badgeH = 18;
        const badgeY = rimY - (showFunnel ? 38 : 24);

        ctx.fillStyle = "rgba(15, 118, 110, 0.92)";
        ctx.strokeStyle = "#2dd4bf";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(fx - badgeW / 2, badgeY, badgeW, badgeH, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("250 mL Volumetric Flask", fx, badgeY + 12);
        ctx.restore();
      }
    }

    // Helper: Draw Translucent LDPE Polymer Wash Bottle
    function drawWashBottle(x, y) {
      const wbW = 34;
      const wbH = 68;
      const wbX = x - wbW / 2;
      const wbY = y - wbH;

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(x, y + 1, wbW * 0.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flexible LDPE semi-translucent plastic body
      const bottleGrad = ctx.createLinearGradient(wbX, 0, wbX + wbW, 0);
      bottleGrad.addColorStop(0, "rgba(240, 249, 255, 0.9)");
      bottleGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.85)");
      bottleGrad.addColorStop(0.8, "rgba(224, 242, 254, 0.85)");
      bottleGrad.addColorStop(1, "rgba(186, 230, 253, 0.8)");

      ctx.fillStyle = bottleGrad;
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(wbX, wbY, wbW, wbH, 5);
      ctx.fill();
      ctx.stroke();

      // Water Level inside Wash Bottle
      ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
      ctx.fillRect(wbX + 2, wbY + 16, wbW - 4, wbH - 18);

      // Ribbed Screw Cap
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(wbX + 4, wbY - 8, wbW - 8, 8);

      // Swan-Neck Delivery Tube & Nozzle
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(x, wbY - 8);
      ctx.lineTo(x - 12, wbY - 26);
      ctx.lineTo(x - 24, wbY - 15);
      ctx.stroke();

      // Chemical Label
      ctx.fillStyle = "#0f766e";
      ctx.beginPath();
      ctx.roundRect(wbX + 2, wbY + 22, wbW - 4, 26, 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Deionized", x, wbY + 34);
      ctx.fillText("Water (H₂O)", x, wbY + 44);
    }

    // ========================================================================
    // BEAUTIFIED PROCEDURAL ANIMATIONS (PHASE 1 & PHASE 2)
    // ========================================================================

    // PHASE 1 ANIMATIONS:
    function playWeighBottle(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2000;

      activeAnimation = {
        name: "weighBottle",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          if (p < 0.45) {
            isWeighingBottleOnBalance = false;
            // Smooth cubic ease descent onto pan
            const t = p / 0.45;
            const easeY = t * t * (3 - 2 * t);
            const curY = benchY - 85 + easeY * 50;
            drawWeighingBottle(layout.balanceX, curY, true);

            // Flickering digital LCD readout
            const flicker = (Math.random() * 0.4).toFixed(3);
            balanceWeightDisplay = `${flicker} g`;
          } else {
            isWeighingBottleOnBalance = true;
            // Realistic digital count-up to target weight (12.435 g)
            const countP = (p - 0.45) / 0.55;
            const liveW = (12.435 * Math.min(1.0, countP * 1.2)).toFixed(3);
            balanceWeightDisplay = `${liveW} g`;
          }
        },
        skip: () => {
          isWeighingBottleOnBalance = true;
          balanceWeightDisplay = "12.435 g";
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "weighBottle") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playTransferEdta(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2800;

      // Initialize sparkling crystal particles
      crystalParticles = [];
      for (let i = 0; i < 40; i++) {
        crystalParticles.push({
          relX: (Math.random() - 0.5) * 6,
          relY: -Math.random() * 50,
          vy: 2.2 + Math.random() * 2.8,
          size: 1.2 + Math.random() * 1.4,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.2
        });
      }

      activeAnimation = {
        name: "transferEdta",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          isWeighingBottleOnBalance = false;
          balanceWeightDisplay = "0.000 g";

          // Parabolic arc path from balance to volumetric flask funnel
          const startX = layout.balanceX;
          const targetX = layout.volFlaskX - 16;
          let curX = startX;
          let curY = benchY - 80;
          let tilt = 0;

          if (p < 0.35) {
            // Lifting & traversing
            const t = p / 0.35;
            curX = startX + t * (targetX - startX);
            curY = benchY - 80 - Math.sin(t * Math.PI) * 55;
          } else if (p < 0.8) {
            // Tilting and discharging crystals
            curX = targetX;
            curY = benchY - 138;
            const tiltP = Math.sin(((p - 0.35) / 0.45) * Math.PI);
            tilt = -0.85 * tiltP;
          } else {
            // Returning to balance
            const t = (p - 0.8) / 0.2;
            curX = targetX + t * (startX - targetX);
            curY = benchY - 138 + t * 58;
          }

          ctx.save();
          ctx.translate(curX, curY);
          ctx.rotate(tilt);
          drawWeighingBottle(0, 0, p < 0.65);
          ctx.restore();

          // Cascading shower of sparkling faceted crystals into funnel
          if (p >= 0.38 && p <= 0.8) {
            const funnelX = layout.volFlaskX;
            const funnelY = benchY - 124;

            crystalParticles.forEach(cp => {
              cp.relY += cp.vy;
              cp.rot += cp.vrot;

              const px = funnelX + cp.relX;
              const py = funnelY + cp.relY;

              if (py < benchY - 10) {
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(cp.rot);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(-cp.size / 2, -cp.size / 2, cp.size, cp.size);
                // Specular glint
                ctx.fillStyle = "rgba(186, 230, 253, 0.8)";
                ctx.fillRect(-cp.size / 4, -cp.size / 4, cp.size / 2, cp.size / 2);
                ctx.restore();
              }
            });
          }

          if (p > 0.55) {
            edtaCrystalsInFlask = true;
          }
        },
        skip: () => {
          edtaCrystalsInFlask = true;
          crystalParticles = [];
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "transferEdta") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playReweighBottle(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2000;

      activeAnimation = {
        name: "reweighBottle",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          if (p < 0.45) {
            isWeighingBottleOnBalance = false;
            const t = p / 0.45;
            const easeY = t * t * (3 - 2 * t);
            const curY = benchY - 80 + easeY * 46;
            drawWeighingBottle(layout.balanceX, curY, false);

            const flicker = (11.0 + Math.random() * 0.6).toFixed(3);
            balanceWeightDisplay = `${flicker} g`;
          } else {
            isWeighingBottleOnBalance = true;
            // Settles smoothly on tare difference weight 11.505 g
            const countP = (p - 0.45) / 0.55;
            const liveW = (11.505 * Math.min(1.0, countP * 1.2)).toFixed(3);
            balanceWeightDisplay = `${liveW} g`;
          }
        },
        skip: () => {
          isWeighingBottleOnBalance = true;
          balanceWeightDisplay = "11.505 g";
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "reweighBottle") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playWashFunnel(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2600;

      activeAnimation = {
        name: "washFunnel",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);

          // Wash bottle lifts, tilts gracefully over funnel
          const wbX = layout.volFlaskX + 38;
          const wbY = benchY - 126;
          ctx.save();
          ctx.translate(wbX, wbY);
          ctx.rotate(-0.42);
          drawWashBottle(0, 0);
          ctx.restore();

          // Pressurized arched water jet stream into funnel cone
          if (p > 0.22 && p < 0.75) {
            const streamGrad = ctx.createLinearGradient(wbX - 35, wbY - 22, layout.volFlaskX, benchY - 100);
            streamGrad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
            streamGrad.addColorStop(0.5, "rgba(186, 230, 253, 0.85)");
            streamGrad.addColorStop(1, "rgba(147, 197, 253, 0.9)");

            ctx.strokeStyle = streamGrad;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(wbX - 36, wbY - 22);
            ctx.quadraticCurveTo(layout.volFlaskX + 6, wbY - 10, layout.volFlaskX, benchY - 96);
            ctx.stroke();

            // Fine mist droplets around funnel
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            for (let k = 0; k < 4; k++) {
              ctx.beginPath();
              ctx.arc(
                layout.volFlaskX + (Math.random() - 0.5) * 12,
                benchY - 96 + Math.random() * 12,
                1.0,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }

            volFlaskLiquidLevel = Math.min(0.25, (p - 0.22) * 0.5);
          }

          // Funnel lifts out of the neck smoothly
          if (p >= 0.75) {
            isFunnelInFlask = false;
          }
        },
        skip: () => {
          isFunnelInFlask = false;
          volFlaskLiquidLevel = 0.25;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "washFunnel") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playDissolveEdta(callback) {
      const startT = performance.now();
      const duration = 2400;
      isVolFlaskSwirling = true;

      activeAnimation = {
        name: "dissolveEdta",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          crystalDissolveProgress = p;
          if (p >= 0.9) {
            edtaCrystalsInFlask = false;
          }
        },
        skip: () => {
          isVolFlaskSwirling = false;
          edtaCrystalsInFlask = false;
          crystalDissolveProgress = 1.0;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "dissolveEdta") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playMakeUpToMark(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2800;

      activeAnimation = {
        name: "makeUpMark",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);

          // Wash bottle dispenses deionized water
          const wbX = layout.volFlaskX + 40;
          const wbY = benchY - 114;
          ctx.save();
          ctx.translate(wbX, wbY);
          ctx.rotate(-0.36);
          drawWashBottle(0, 0);
          ctx.restore();

          if (p > 0.12 && p < 0.9) {
            ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(wbX - 34, wbY - 20);
            ctx.lineTo(layout.volFlaskX, benchY - 110);
            ctx.stroke();

            // Smooth fluid rise, slowing down precisely as it reaches the blue calibration line
            const t = (p - 0.12) / 0.78;
            const easeP = t < 0.7 ? t / 0.7 * 0.75 : 0.75 + Math.sin((t - 0.7) / 0.3 * (Math.PI / 2)) * 0.25;
            volFlaskLiquidLevel = 0.25 + easeP * 0.75;
          }
        },
        skip: () => {
          volFlaskLiquidLevel = 1.0;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "makeUpMark") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playStopperAndMix(callback) {
      const startT = performance.now();
      const duration = 2800;
      isStopperInFlask = true;

      // Spawn effervescent rising bubbles
      bubbleParticles = [];
      for (let i = 0; i < 15; i++) {
        bubbleParticles.push({
          x: 0,
          y: 0,
          r: 1.0 + Math.random() * 1.8,
          speed: 1.5 + Math.random() * 2.0
        });
      }

      activeAnimation = {
        name: "stopperAndMix",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          if (p < 0.2) {
            // Stopper lowering into neck
            volFlaskStopperYOffset = (1.0 - p / 0.2) * -18;
            volFlaskInvertAngle = 0;
          } else if (p < 0.85) {
            volFlaskStopperYOffset = 0;
            // Complete 180° inversion cycle (0 -> PI -> 0)
            const invertT = (p - 0.2) / 0.65;
            volFlaskInvertAngle = Math.sin(invertT * Math.PI) * Math.PI;

            // Animate tumbling bubbles
            const layout = getLayout();
            bubbleParticles.forEach((b, idx) => {
              b.x = layout.volFlaskX + Math.sin(now * 0.01 + idx) * 12;
              b.y = benchY - 40 - ((now * 0.05 * b.speed + idx * 8) % 65);
            });
          } else {
            volFlaskInvertAngle = 0;
            bubbleParticles = [];
          }
        },
        skip: () => {
          volFlaskInvertAngle = 0;
          volFlaskStopperYOffset = 0;
          bubbleParticles = [];
          isStopperInFlask = true;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "stopperAndMix") {
          activeAnimation.skip();
        }
      }, duration);
    }

    // PHASE 2 ANIMATIONS:
    function playFillBurette(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2400;

      activeAnimation = {
        name: "fillBurette",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          const funnelY = layout.buretteTopY - 2;

          // Glass Funnel in Burette Mouth
          ctx.fillStyle = "rgba(224, 242, 254, 0.8)";
          ctx.strokeStyle = "#0284c7";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(layout.buretteX - 15, funnelY - 15);
          ctx.lineTo(layout.buretteX + 15, funnelY - 15);
          ctx.lineTo(layout.buretteX + 3.5, funnelY);
          ctx.lineTo(layout.buretteX + 3.5, funnelY + 9);
          ctx.lineTo(layout.buretteX - 3.5, funnelY + 9);
          ctx.lineTo(layout.buretteX - 3.5, funnelY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Standard EDTA Stock Bottle Tilts & Pours
          if (p > 0.2 && p < 0.85) {
            ctx.save();
            ctx.translate(layout.buretteX + 26, layout.buretteTopY - 14);
            ctx.rotate(-0.55);
            ctx.fillStyle = "rgba(240, 249, 255, 0.85)";
            ctx.fillRect(-16, -32, 32, 52);
            ctx.strokeStyle = "#0f766e";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-16, -32, 32, 52);
            ctx.restore();

            // Smooth Pouring Stream
            ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(layout.buretteX + 16, layout.buretteTopY - 20);
            ctx.lineTo(layout.buretteX, layout.buretteTopY - 6);
            ctx.stroke();

            // Burette liquid column rises smoothly to exact 0.00 mL
            const pourP = (p - 0.2) / 0.65;
            buretteReading = 50.0 * (1.0 - pourP);
            buretteReading = Math.max(0.0, Math.min(50.0, buretteReading));
          }
        },
        skip: () => {
          buretteReading = 0.0;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "fillBurette") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playPipette(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2600;

      activeAnimation = {
        name: "pipette",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          let px = layout.beakerSampleX;
          let py = benchY - 48;

          if (p > 0.32 && p < 0.68) {
            const t = (p - 0.32) / 0.36;
            px = layout.beakerSampleX + t * (layout.prepX - layout.beakerSampleX);
            py = benchY - 90;
          } else if (p >= 0.68) {
            px = layout.prepX;
            py = benchY - 72;
          }

          // Class A 25 mL Bulb Pipette
          ctx.save();
          ctx.translate(px, py);
          ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
          ctx.strokeStyle = "#0284c7";
          ctx.lineWidth = 1.1;
          ctx.fillRect(-2, -64, 4, 64);
          ctx.strokeRect(-2, -64, 4, 64);

          // Central expanded suction bulb
          ctx.beginPath();
          ctx.ellipse(0, -32, 5.5, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Amber calibration line
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-2, -48);
          ctx.lineTo(2, -48);
          ctx.stroke();

          // Red Pipette Safety Filler
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(0, -68, 5.5, 0, Math.PI * 2);
          ctx.fill();

          // Gravity draining stream into conical flask
          if (p >= 0.7) {
            ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, benchY - py - 20);
            ctx.stroke();

            const t = (p - 0.7) / 0.3;
            flaskVolumeML = t * 25.0;
          }
          ctx.restore();
        },
        skip: () => {
          flaskVolumeML = 25.0;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "pipette") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playBuffer(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2200;

      activeAnimation = {
        name: "buffer",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          const dx = layout.prepX;
          const dy = benchY - 92;

          // Buffer Dropper Pipette
          ctx.save();
          ctx.translate(dx, dy);
          ctx.fillStyle = "rgba(224, 242, 254, 0.88)";
          ctx.strokeStyle = "#0284c7";
          ctx.lineWidth = 1.1;
          ctx.fillRect(-2, -38, 4, 38);
          ctx.strokeRect(-2, -38, 4, 38);

          // Blue rubber bulb
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(0, -42, 5.5, 0, Math.PI * 2);
          ctx.fill();

          // 3 mL Measured Liquid Stream
          if (p > 0.32 && p < 0.85) {
            ctx.strokeStyle = "rgba(191, 219, 254, 0.95)";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, benchY - dy - 22);
            ctx.stroke();

            flaskVolumeML = 25.0 + ((p - 0.32) / 0.53) * 3.0;
          }
          ctx.restore();
        },
        skip: () => {
          flaskVolumeML = 28.0;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "buffer") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playIndicator(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 2400;

      activeAnimation = {
        name: "indicator",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          const dx = layout.prepX;
          const dy = benchY - 94;

          // Polished Stainless Steel Micro-Spatula
          ctx.save();
          ctx.translate(dx, dy);
          const spatGrad = ctx.createLinearGradient(-20, -2, 20, 2);
          spatGrad.addColorStop(0, "#64748b");
          spatGrad.addColorStop(0.5, "#cbd5e1");
          spatGrad.addColorStop(1, "#f8fafc");
          ctx.fillStyle = spatGrad;
          ctx.fillRect(-20, -2, 40, 4);

          // Dark charcoal-black EBT powder pinch on spatula
          if (p < 0.5) {
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.ellipse(0, -3, 3.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Cascading dark powder granules
          if (p > 0.32 && p < 0.65) {
            ctx.fillStyle = "#0f172a";
            for (let i = 0; i < 6; i++) {
              ctx.beginPath();
              ctx.arc((Math.random() - 0.5) * 8, (p - 0.32) * 130 + Math.random() * 8, 1.3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();

          // Stunning Watercolor-like Blooming Plumes of Rich Wine Red
          if (p > 0.48 && ebtBlooms.length === 0) {
            ebtBlooms.push({
              x: layout.prepX,
              y: benchY - 20,
              radius: 3,
              maxRadius: 42,
              alpha: 1.0
            });
          }
        },
        skip: () => {
          activeAnimation = null;
          ebtBlooms = [];
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "indicator") {
          activeAnimation.skip();
        }
      }, duration);
    }

    function playPlaceFlask(callback) {
      const layout = getLayout();
      const startT = performance.now();
      const duration = 1600;

      activeAnimation = {
        name: "placeFlask",
        render: (now) => {
          const p = Math.min(1.0, (now - startT) / duration);
          const easeP = p * p * (3 - 2 * p); // Smooth cubic ease-in-out
          const startX = layout.prepX;
          const targetX = layout.buretteX;
          animatedFlaskX = startX + easeP * (targetX - startX);
        },
        skip: () => {
          flaskPlaced = true;
          animatedFlaskX = null;
          activeAnimation = null;
          if (callback) callback();
        }
      };

      setTimeout(() => {
        if (activeAnimation && activeAnimation.name === "placeFlask") {
          activeAnimation.skip();
        }
      }, duration);
    }

    // ========================================================================
    // MAIN RENDER LOOP & REAL-TIME PHYSICS
    // ========================================================================
    let animId = null;
    let lastDropTime = 0;

    function renderFrame(now) {
      const layout = getLayout();
      ctx.clearRect(0, 0, W, H);

      // 1. Background Wall, Overhead Glow & Polished Countertop
      drawBackground();

      if (currentPhaseMode === "phase1") {
        // --- PHASE 1 VIEW ---
        drawPhase1Apparatus(layout);
      } else {
        // --- PHASE 2 VIEW ---
        // 2. White Porcelain Contrast Tile
        drawWhiteTile(layout.buretteX);

        // 3. Retort Stand & Chrome Rod
        drawRetortStand(layout.buretteX);

        // 4. Burette
        drawBurette(layout.buretteX, layout.buretteTopY, layout.buretteBotY, buretteReading);

        // 5. Idle Pipette on rack
        drawIdlePipette(layout.idlePipetteX, benchY - 4);

        // 6. Bench Reagent Containers (Sample, Buffer, EBT, Std EDTA)
        drawPhase2Reagents(layout);

        // 7. Conical Flask
        let curFlaskX = layout.prepX;
        if (animatedFlaskX !== null) {
          curFlaskX = animatedFlaskX;
        } else if (flaskPlaced) {
          curFlaskX = layout.buretteX;
        }
        drawConicalFlask(curFlaskX, benchY - 4, flaskVolumeML, flaskColor, isSwirling);

        // 8. Titration Falling Droplets & Fluid Acceleration
        if (isStopcockOpen && flaskPlaced && now - lastDropTime > 85) {
          lastDropTime = now;
          fallingDrops.push({
            x: layout.buretteX,
            y: layout.jetTipY + 3,
            vy: 4.5,
            ay: 0.2
          });
        }

        // Update Droplets
        for (let i = fallingDrops.length - 1; i >= 0; i--) {
          const d = fallingDrops[i];
          d.vy += d.ay;
          d.y += d.vy;

          // Teardrop droplet geometry
          ctx.fillStyle = "rgba(186, 230, 253, 0.95)";
          ctx.beginPath();
          ctx.arc(d.x, d.y, 2.0, 0, Math.PI * 2);
          ctx.fill();

          if (d.y >= benchY - 24) {
            surfaceRipples.push({
              x: curFlaskX + (Math.random() - 0.5) * 4,
              r: 2,
              alpha: 1.0
            });

            // Transient blue swirl if near equivalence
            if (flaskColor.includes("701a75") || flaskColor.includes("312e81") || flaskColor.includes("4c1d95")) {
              transientColorSwirls.push({
                x: curFlaskX + (Math.random() - 0.5) * 6,
                y: benchY - 22,
                r: 3,
                alpha: 0.85
              });
            }

            fallingDrops.splice(i, 1);
          }
        }

        // Update Surface Ripples
        for (let i = surfaceRipples.length - 1; i >= 0; i--) {
          const r = surfaceRipples[i];
          r.r += 0.85;
          r.alpha -= 0.035;
          if (r.alpha <= 0) {
            surfaceRipples.splice(i, 1);
          }
        }

        // Update Transient Blue Swirls
        for (let i = transientColorSwirls.length - 1; i >= 0; i--) {
          const s = transientColorSwirls[i];
          s.r += 0.65;
          s.alpha -= 0.025;
          if (s.alpha <= 0) {
            transientColorSwirls.splice(i, 1);
          }
        }

        // Update EBT Watercolor Blooms
        for (let i = ebtBlooms.length - 1; i >= 0; i--) {
          const b = ebtBlooms[i];
          b.radius += 0.55;
          b.alpha -= 0.014;
          if (b.alpha <= 0 || b.radius >= b.maxRadius) {
            ebtBlooms.splice(i, 1);
          }
        }
      }

      // Smooth Stopcock Angle Transition
      targetStopcockAngle = isStopcockOpen ? Math.PI / 2 : 0;
      stopcockAngle += (targetStopcockAngle - stopcockAngle) * 0.2;

      // Swirl phase oscillation
      if (isSwirling || isVolFlaskSwirling) {
        swirlPhase += 0.22;
      }

      // Active Procedural Animation Frame
      if (activeAnimation && activeAnimation.render) {
        activeAnimation.render(now);
      }

      animId = requestAnimationFrame(renderFrame);
    }
    animId = requestAnimationFrame(renderFrame);

    return {
      setBuretteLevel: (readingML) => {
        buretteReading = readingML;
      },
      setStopcock: (isOpen) => {
        isStopcockOpen = isOpen;
      },
      setFlaskColor: (colHex) => {
        flaskColor = colHex;
      },
      setFlaskVolume: (volML) => {
        flaskVolumeML = volML;
      },
      setFlaskPlaced: (isPlaced) => {
        flaskPlaced = isPlaced;
        animatedFlaskX = null;
      },
      setSwirling: (swirl) => {
        isSwirling = swirl;
      },
      setPhaseMode: (mode) => {
        currentPhaseMode = mode;
      },
      playWeighBottle,
      playTransferEdta,
      playReweighBottle,
      playWashFunnel,
      playDissolveEdta,
      playMakeUpToMark,
      playStopperAndMix,
      playFillBurette,
      playPipette,
      playBuffer,
      playIndicator,
      playPlaceFlask,
      skipActiveAnimation: () => {
        if (activeAnimation && activeAnimation.skip) {
          activeAnimation.skip();
        }
      },
      reset: (phase) => {
        currentPhaseMode = phase || "phase1";
        buretteReading = 0.0;
        isStopcockOpen = false;
        stopcockAngle = 0;
        targetStopcockAngle = 0;
        flaskPlaced = false;
        animatedFlaskX = null;
        flaskVolumeML = 25;
        flaskColor = "#e2e8f0";
        isSwirling = false;
        isVolFlaskSwirling = false;
        volFlaskInvertAngle = 0;
        volFlaskStopperYOffset = 0;
        crystalDissolveProgress = 0.0;
        activeAnimation = null;
        fallingDrops = [];
        surfaceRipples = [];
        ebtBlooms = [];
        crystalParticles = [];
        bubbleParticles = [];
        transientColorSwirls = [];
        if (currentPhaseMode === "phase1") {
          balanceWeightDisplay = "0.000 g";
          isWeighingBottleOnBalance = false;
          edtaCrystalsInFlask = false;
          volFlaskLiquidLevel = 0.0;
          isFunnelInFlask = true;
          isStopperInFlask = false;
        }
      },
      stop: () => cancelAnimationFrame(animId)
    };
  }

  // ============================================================================
  // 4. MAIN TITRATION ORCHESTRATOR & UI BINDINGS
  // ============================================================================
  function initSimulationApp() {
    const simBox = document.getElementById("simscreen-container");
    if (!simBox) return;

    const chem = new ChemistryEngine(DEFAULT_CONFIG);
    const labWorld = createLaboratoryWorld(simBox);

    // Eye-Level Meniscus Zoom Canvas
    const meniscusCanvas = document.getElementById("meniscusCanvas");
    const meniscusCtx = meniscusCanvas ? meniscusCanvas.getContext("2d") : null;

    function renderMeniscusZoom(readingML) {
      if (!meniscusCtx || !meniscusCanvas) return;
      const ctx = meniscusCtx;
      const w = meniscusCanvas.width;
      const h = meniscusCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, w, h);

      const centerY = h / 2;
      const pxPerML = h / 2.0;
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#1e293b";
      ctx.font = "bold 11px monospace";

      for (let ml = Math.floor((readingML - 1.0) * 10) / 10; ml <= readingML + 1.2; ml += 0.1) {
        const rml = Number(ml.toFixed(1));
        if (rml < 0 || rml > 50) continue;
        const y = centerY + (rml - readingML) * pxPerML;
        const isMajor = Math.abs(rml % 1.0) < 0.01;
        ctx.beginPath();
        if (isMajor) {
          ctx.lineWidth = 1.5;
          ctx.moveTo(w - 28, y);
          ctx.lineTo(w - 4, y);
          ctx.stroke();
          ctx.fillText(rml.toFixed(0), 8, y + 4);
        } else {
          ctx.lineWidth = 0.8;
          ctx.moveTo(w - 16, y);
          ctx.lineTo(w - 4, y);
          ctx.stroke();
        }
      }

      // Liquid column & curved meniscus
      ctx.fillStyle = "rgba(186, 230, 253, 0.65)";
      ctx.fillRect(2, centerY, w - 4, h - centerY);

      ctx.beginPath();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2.0;
      ctx.moveTo(4, centerY - 4);
      ctx.quadraticCurveTo(w / 2, centerY + 4, w - 4, centerY - 4);
      ctx.stroke();

      // Red Sightline
      ctx.beginPath();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // State Variables
    let currentPhase = "phase1"; // 'phase1' | 'phase2'
    let currentStep = 1;
    let trialNumber = 1;
    let currentReading = 0.0;
    let initialReading = 0.0;
    let titreVolume = 0.0;
    let isStopcockOpen = false;
    let flowRate = 0.6;
    let isSwirling = false;
    let hasBuffer = false;
    let hasIndicator = false;
    let hasSample = false;
    let equivalenceVolume = 6.0;
    let endpointReached = false;
    let currentColorHex = "#e2e8f0";
    let isAnimating = false;

    // Recorded Trials
    const trialsTotalHardness = [];
    let acceptedConcordantHardness = null;

    // DOM Caching
    const dom = {
      stepBadge: document.getElementById("simStepBadge"),
      phaseBadge: document.getElementById("simPhaseBadge"),
      stepInstruction: document.getElementById("simStepInstruction"),
      stepFeedback: document.getElementById("simStepFeedback"),
      hudBuretteReading: document.getElementById("hudBuretteReading"),
      hudTitreVolume: document.getElementById("hudTitreVolume"),
      hudStopcockBadge: document.getElementById("hudStopcockBadge"),
      hudColorBadge: document.getElementById("hudColorBadge"),
      meniscusReadingLabel: document.getElementById("meniscusReadingLabel"),

      btnAction1: document.getElementById("btnAction1"),
      btnAction2: document.getElementById("btnAction2"),
      btnAction3: document.getElementById("btnAction3"),
      btnAction4: document.getElementById("btnAction4"),
      btnAction5: document.getElementById("btnAction5"),
      btnAction6: document.getElementById("btnAction6"),
      btnAction7: document.getElementById("btnAction7"),
      btnAction8: document.getElementById("btnAction8"),
      btnAction1Label: document.getElementById("btnAction1Label"),
      btnAction2Label: document.getElementById("btnAction2Label"),
      btnAction3Label: document.getElementById("btnAction3Label"),
      btnAction4Label: document.getElementById("btnAction4Label"),
      btnAction5Label: document.getElementById("btnAction5Label"),
      btnAction6Label: document.getElementById("btnAction6Label"),
      btnAction7Label: document.getElementById("btnAction7Label"),
      btnAction8Label: document.getElementById("btnAction8Label"),
      btnNextTrial: document.getElementById("btnNextTrial"),
      btnSwitchPhase: document.getElementById("btnSwitchPhase"),
      btnResetTrial: document.getElementById("btnResetTrial"),

      varEdtaMass: document.getElementById("varEdtaMass"),
      varEdtaMassVal: document.getElementById("varEdtaMassVal"),
      varSampleVolume: document.getElementById("varSampleVolume"),
      varSampleVolumeVal: document.getElementById("varSampleVolumeVal"),
      varBufferVolume: document.getElementById("varBufferVolume"),
      varBufferVolumeVal: document.getElementById("varBufferVolumeVal"),
      varFlowRate: document.getElementById("varFlowRate"),
      varFlowRateVal: document.getElementById("varFlowRateVal"),
      varSamplePreset: document.getElementById("varSamplePreset"),

      obsTablePhase1: document.getElementById("obsTablePhase1"),
      obsTablePhase2: document.getElementById("obsTablePhase2"),

      inputFactorCheck: document.getElementById("inputFactorCheck"),
      btnCheckFactor: document.getElementById("btnCheckFactor"),
      btnStepsFactor: document.getElementById("btnStepsFactor"),
      stepsFactorContent: document.getElementById("stepsFactorContent"),

      inputHardnessCheck: document.getElementById("inputHardnessCheck"),
      btnCheckHardness: document.getElementById("btnCheckHardness"),
      btnStepsHardness: document.getElementById("btnStepsHardness"),
      stepsHardnessContent: document.getElementById("stepsHardnessContent"),

      resEdtaFactor: document.getElementById("resEdtaFactor"),
      resConcordantTitre: document.getElementById("resConcordantTitre"),
      resTotalHardness: document.getElementById("resTotalHardness"),
      resHardnessCategory: document.getElementById("resHardnessCategory"),
      btnSubmitInference: document.getElementById("btnSubmitInference"),
      inferenceFeedback: document.getElementById("inferenceFeedback")
    };

    function showFeedback(text, type = "info") {
      if (!dom.stepFeedback) return;
      dom.stepFeedback.textContent = text;
      dom.stepFeedback.className = `sim-step-feedback show ${type}`;
      setTimeout(() => {
        if (dom.stepFeedback) dom.stepFeedback.classList.remove("show");
      }, 5000);
    }

    function updateGuidance() {
      const msgsPhase1 = [
        "",
        "Step 1: Weigh the weighing bottle containing EDTA disodium salt on the electronic balance and record W₁.",
        "Step 2: Transfer the EDTA crystals carefully through the funnel into the 250 mL volumetric flask.",
        "Step 3: Reweigh the empty bottle to determine W₂ and calculate mass transferred: W = W₁ - W₂.",
        "Step 4: Pour ion-exchange water through the funnel to wash adhering crystals into flask, then remove funnel.",
        "Step 5: Swirl the volumetric flask gently to dissolve the EDTA crystals completely.",
        "Step 6: Add ion-exchange water until the lower meniscus reaches the 250 mL graduation mark on the neck.",
        "Step 7: Stopper the flask and invert several times to thoroughly mix the standard solution.",
        "Step 8: Calculate standard EDTA molarity: M = (Weight of EDTA × 4) / 372.24. Proceed to Phase 2."
      ];

      const alreadyRecorded = trialsTotalHardness.some(t => t.trialNum === trialNumber);
      const msgsPhase2 = [
        "",
        "Step 1: Fill the burette with prepared standard EDTA solution up to the 0.00 mL mark.",
        "Step 2: Pipette exactly 25.0 mL of the water sample into a clean 250 mL conical flask.",
        "Step 3: Add 3.0 mL of Ammonia Buffer (pH 10) to maintain alkaline pH for complexation.",
        "Step 4: Add a pinch of Eriochrome Black T (EBT) indicator. Observe the wine-red [M-EBT]+ complex.",
        "Step 5: Place the conical flask on the white porcelain contrast tile beneath the burette tip.",
        "Step 6: Open burette stopcock. Titrate with continuous swirling until wine-red turns to clear blue.",
        alreadyRecorded ? `Trial ${trialNumber} recorded in table. Click 'Start Next Trial' to obtain concordant readings.` : "Step 7: Endpoint reached! Close stopcock and record reading in the observation table.",
        "Step 8: Hardness titration complete. Repeat trials to establish concordant readings and calculate total hardness."
      ];

      const list = (currentPhase === "phase1") ? msgsPhase1 : msgsPhase2;
      if (dom.stepInstruction) dom.stepInstruction.textContent = list[currentStep] || "";
      if (dom.stepBadge) dom.stepBadge.textContent = `Step ${currentStep} of 8`;
      if (dom.phaseBadge) {
        dom.phaseBadge.textContent = (currentPhase === "phase1")
          ? "Phase 1: EDTA Preparation"
          : "Phase 2: Total Hardness";
      }
    }

    function updateHUD() {
      if (dom.hudBuretteReading) dom.hudBuretteReading.textContent = `${currentReading.toFixed(2)} mL`;
      if (dom.hudTitreVolume) dom.hudTitreVolume.textContent = `${titreVolume.toFixed(2)} mL`;
      if (dom.meniscusReadingLabel) dom.meniscusReadingLabel.textContent = `${currentReading.toFixed(2)} mL`;

      if (dom.hudStopcockBadge) {
        if (isStopcockOpen) {
          dom.hudStopcockBadge.textContent = "OPEN (Titrating)";
          dom.hudStopcockBadge.className = "stopcock-status-badge open";
        } else {
          dom.hudStopcockBadge.textContent = "CLOSED";
          dom.hudStopcockBadge.className = "stopcock-status-badge closed";
        }
      }

      if (dom.hudColorBadge) {
        let cName = "Clear / Colorless";
        if (currentPhase === "phase1") {
          cName = "Clear Solution";
        } else if (hasIndicator) {
          const f = equivalenceVolume > 0 ? titreVolume / equivalenceVolume : 0;
          if (f < 0.95) cName = "Wine Red";
          else if (f < 1.0) cName = "Purple Swirls";
          else if (f <= 1.05) cName = "Clear Blue (Endpoint)";
          else cName = "Deep Blue (Overshot)";
        }
        dom.hudColorBadge.textContent = cName;
      }

      renderMeniscusZoom(currentReading);
      if (labWorld) {
        labWorld.setBuretteLevel(currentReading);
      }
    }

    function updateControls() {
      const setBtn = (btn, allowed, active) => {
        if (!btn) return;
        btn.disabled = !allowed;
        if (allowed && active) btn.classList.add("active-action");
        else btn.classList.remove("active-action");
      };

      if (currentPhase === "phase1") {
        if (dom.btnAction1Label) dom.btnAction1Label.textContent = "1. Weigh Bottle + Salt";
        if (dom.btnAction2Label) dom.btnAction2Label.textContent = "2. Transfer to Flask";
        if (dom.btnAction3Label) dom.btnAction3Label.textContent = "3. Reweigh Empty Bottle";
        if (dom.btnAction4Label) dom.btnAction4Label.textContent = "4. Wash Funnel (Water)";
        if (dom.btnAction5Label) dom.btnAction5Label.textContent = "5. Swirl to Dissolve";
        if (dom.btnAction6Label) dom.btnAction6Label.textContent = "6. Make Up to 250 mL";
        if (dom.btnAction7Label) dom.btnAction7Label.textContent = "7. Stopper & Mix";
        if (dom.btnAction8Label) dom.btnAction8Label.textContent = "8. Calculate Molarity";

        setBtn(dom.btnAction1, currentStep === 1, currentStep === 1);
        setBtn(dom.btnAction2, currentStep === 2, currentStep === 2);
        setBtn(dom.btnAction3, currentStep === 3, currentStep === 3);
        setBtn(dom.btnAction4, currentStep === 4, currentStep === 4);
        setBtn(dom.btnAction5, currentStep === 5, currentStep === 5);
        setBtn(dom.btnAction6, currentStep === 6, currentStep === 6);
        setBtn(dom.btnAction7, currentStep === 7, currentStep === 7);
        setBtn(dom.btnAction8, currentStep === 8, currentStep === 8);

        if (dom.btnNextTrial) dom.btnNextTrial.style.display = "none";
        if (dom.btnSwitchPhase) {
          dom.btnSwitchPhase.textContent = "Proceed to Phase 2 (Water Hardness) ➜";
          dom.btnSwitchPhase.disabled = false;
        }
      } else {
        if (dom.btnAction1Label) dom.btnAction1Label.textContent = "1. Fill Burette (EDTA)";
        if (dom.btnAction2Label) dom.btnAction2Label.textContent = "2. Pipette 25 mL Sample";
        if (dom.btnAction3Label) dom.btnAction3Label.textContent = "3. Add 3 mL Buffer";
        if (dom.btnAction4Label) dom.btnAction4Label.textContent = "4. Add Pinch of EBT";
        if (dom.btnAction5Label) dom.btnAction5Label.textContent = "5. Place Flask";
        if (dom.btnAction6Label) {
          dom.btnAction6Label.textContent = isStopcockOpen ? "🛑 Close Stopcock" : "💧 Open Stopcock";
        }
        if (dom.btnAction7Label) dom.btnAction7Label.textContent = "🌀 Swirl Flask";
        if (dom.btnAction8Label) dom.btnAction8Label.textContent = "📝 Record Reading";

        setBtn(dom.btnAction1, currentStep === 1, currentStep === 1);
        setBtn(dom.btnAction2, currentStep === 2, currentStep === 2);
        setBtn(dom.btnAction3, currentStep === 3, currentStep === 3);
        setBtn(dom.btnAction4, currentStep === 4, currentStep === 4);
        setBtn(dom.btnAction5, currentStep === 5, currentStep === 5);

        const canTitrate = (currentStep >= 6 && hasIndicator);
        setBtn(dom.btnAction6, canTitrate, canTitrate && !isStopcockOpen);

        const alreadyRecorded = trialsTotalHardness.some(t => t.trialNum === trialNumber);
        setBtn(dom.btnAction7, currentStep >= 5, isStopcockOpen);
        setBtn(dom.btnAction8, currentStep === 6 && titreVolume > 0 && !alreadyRecorded, currentStep === 6 && endpointReached && !alreadyRecorded);

        if (dom.btnNextTrial) {
          dom.btnNextTrial.style.display = "block";
          setBtn(dom.btnNextTrial, currentStep >= 7 || alreadyRecorded, currentStep >= 7 || alreadyRecorded);
        }
        if (dom.btnSwitchPhase) {
          dom.btnSwitchPhase.textContent = "↶ Back to Phase 1 (EDTA Prep)";
          dom.btnSwitchPhase.disabled = false;
        }
      }
    }

    function renderTables() {
      // Phase 1 Observation Card
      if (dom.obsTablePhase1) {
        const w1 = chem.edtaBottlePlusSaltW1.toFixed(3);
        const w2 = chem.edtaEmptyBottleW2.toFixed(3);
        const w = chem.edtaMassTransferred.toFixed(3);
        const molWt = chem.edtaMolarMass.toFixed(2);
        const molarity = chem.actualEdtaMolarity.toFixed(4);

        dom.obsTablePhase1.innerHTML = `
          <div class="obs-table-container">
            <h4 style="margin:0 0 0.5rem 0; font-size:1.3rem; color:#0a363c;">Phase 1: Preparation of Standard EDTA Solution</h4>
            <table class="exp-data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Formula / Source</th>
                  <th>Observed Value</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Weight of bottle + EDTA salt (W₁)</td>
                  <td>Electronic Balance</td>
                  <td><strong>${w1}</strong></td>
                  <td>g</td>
                </tr>
                <tr>
                  <td>Weight of empty bottle (W₂)</td>
                  <td>Electronic Balance</td>
                  <td><strong>${w2}</strong></td>
                  <td>g</td>
                </tr>
                <tr>
                  <td>Weight of EDTA salt transferred (W)</td>
                  <td>W = W₁ - W₂</td>
                  <td><strong>${w}</strong></td>
                  <td>g</td>
                </tr>
                <tr>
                  <td>Volumetric Flask Capacity</td>
                  <td>Class A Volumetric Flask</td>
                  <td>250.0</td>
                  <td>mL</td>
                </tr>
                <tr>
                  <td>Molecular Weight of EDTA disodium salt</td>
                  <td>Na₂H₂Y·2H₂O</td>
                  <td>${molWt}</td>
                  <td>g/mol</td>
                </tr>
                <tr class="concordant-row">
                  <td><strong>Standard Molarity of EDTA</strong></td>
                  <td><strong>(W × 4) / 372.24</strong></td>
                  <td><strong>${molarity}</strong></td>
                  <td><strong>M</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }

      // Phase 2 Total Hardness Table
      if (dom.obsTablePhase2) {
        let rows = "";
        if (trialsTotalHardness.length === 0) {
          rows = `<tr><td colspan="7" style="color:#64748b; font-style:italic;">No recorded trials yet. Perform titration steps above.</td></tr>`;
        } else {
          trialsTotalHardness.forEach(t => {
            const isConc = acceptedConcordantHardness && Math.abs(t.titre - acceptedConcordantHardness) <= 0.1;
            let bClass = "accurate";
            if (t.status === "Rough") bClass = "rough";
            else if (t.status === "Overshot") bClass = "overshot";
            else if (isConc) bClass = "concordant";
            rows += `
              <tr class="${isConc ? "concordant-row" : ""}">
                <td><strong>Trial ${t.trialNum}</strong></td>
                <td>${t.sampleVolume.toFixed(1)}</td>
                <td>${t.initial.toFixed(2)}</td>
                <td>${t.final.toFixed(2)}</td>
                <td><strong>${t.titre.toFixed(2)}</strong></td>
                <td>${t.observation}</td>
                <td><span class="trial-badge ${bClass}">${isConc ? "Concordant" : t.status}</span></td>
              </tr>
            `;
          });
        }

        dom.obsTablePhase2.innerHTML = `
          <div class="obs-table-container">
            <h4 style="margin:0 0 0.5rem 0; font-size:1.3rem; color:#0a363c;">Phase 2: Total Hardness Determination (Sample = 25.0 mL)</h4>
            <table class="exp-data-table">
              <thead>
                <tr>
                  <th>Trial No.</th>
                  <th>Sample Vol (mL)</th>
                  <th>Initial Reading (mL)</th>
                  <th>Final Reading (mL)</th>
                  <th>EDTA Consumed (mL)</th>
                  <th>Endpoint Observation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            ${acceptedConcordantHardness ? `<p style="margin-top:0.5rem; font-size:1.2rem; color:#065f46; font-weight:600;">✓ Accepted Concordant EDTA Titre = ${acceptedConcordantHardness.toFixed(2)} mL</p>` : ""}
          </div>
        `;
      }
    }

    function renderCalculations() {
      // Phase 1: EDTA Molarity Steps
      if (dom.stepsFactorContent) {
        const w1 = chem.edtaBottlePlusSaltW1.toFixed(3);
        const w2 = chem.edtaEmptyBottleW2.toFixed(3);
        const w = chem.edtaMassTransferred.toFixed(3);
        const mol = chem.actualEdtaMolarity.toFixed(4);
        dom.stepsFactorContent.innerHTML = `
          <strong>Detailed Step-by-Step Calculation:</strong><br>
          1. Mass of weighing bottle + EDTA salt ($W_1$) = <strong>${w1} g</strong><br>
          2. Mass of empty weighing bottle ($W_2$) = <strong>${w2} g</strong><br>
          3. Mass of EDTA salt transferred ($W = W_1 - W_2$) = <strong>${w} g</strong><br>
          4. Molecular weight of EDTA disodium salt = <strong>372.24 g/mol</strong><br>
          5. Volume of solution in volumetric flask = <strong>250 mL</strong><br>
          6. $\\text{Molarity of EDTA} = \\frac{\\text{Weight of EDTA} \\times 4}{\\text{Molecular Weight of EDTA}}$<br>
          &nbsp;&nbsp;&nbsp;&nbsp;$= \\frac{${w} \\times 4}{372.24} = \\mathbf{${mol}\\text{ M}}$
        `;
      }

      // Phase 2: Total Hardness Steps
      if (acceptedConcordantHardness && dom.stepsHardnessContent) {
        const vEdta = acceptedConcordantHardness.toFixed(2);
        const mEdta = chem.actualEdtaMolarity.toFixed(4);
        const vSample = chem.sampleVolume.toFixed(1);
        const mHw = ((chem.actualEdtaMolarity * acceptedConcordantHardness) / chem.sampleVolume).toFixed(6);
        const hardness = chem.calculateTotalHardness(acceptedConcordantHardness).totalHardness;

        dom.stepsHardnessContent.innerHTML = `
          <strong>Detailed Total Hardness Calculation:</strong><br>
          1. Volume of Water Sample titrated ($V_{\\text{Hard Water}}$) = <strong>${vSample} mL</strong><br>
          2. Concordant volume of EDTA ($V_{\\text{EDTA}}$) = <strong>${vEdta} mL</strong><br>
          3. Molarity of Standard EDTA ($M_{\\text{EDTA}}$) = <strong>${mEdta} M</strong><br>
          4. By Law of Equivalence: $(MV)_{\\text{Hard Water}} = (MV)_{\\text{EDTA}}$<br>
          &nbsp;&nbsp;&nbsp;&nbsp;$M_{\\text{Hard Water}} = \\frac{${mEdta} \\times ${vEdta}}{${vSample}} = \\mathbf{${mHw}\\text{ M}}$<br>
          5. Total Hardness (expressed in ppm of $\\text{CaCO}_3$ / mg/L):<br>
          &nbsp;&nbsp;&nbsp;&nbsp;$= M_{\\text{Hard Water}} \\times 100.087 \\times 1000$<br>
          &nbsp;&nbsp;&nbsp;&nbsp;$= ${mHw} \\times 100087 = \\mathbf{${hardness}\\text{ ppm of CaCO}_3}$
        `;
      }
    }

    function renderResults() {
      if (dom.resEdtaFactor) {
        dom.resEdtaFactor.textContent = `${chem.actualEdtaMolarity.toFixed(4)} M`;
      }
      if (acceptedConcordantHardness) {
        if (dom.resConcordantTitre) dom.resConcordantTitre.textContent = `${acceptedConcordantHardness.toFixed(2)} mL`;
        const res = chem.calculateTotalHardness(acceptedConcordantHardness);
        if (dom.resTotalHardness) dom.resTotalHardness.textContent = `${res.totalHardness} ppm of CaCO3`;
        if (dom.resHardnessCategory) dom.resHardnessCategory.textContent = `${res.classification.category} (${res.classification.description})`;

        const compBox = document.getElementById("sampleComplianceBox");
        if (compBox) {
          const h = res.totalHardness;
          let compHTML = "";
          if (h <= 200) {
            compHTML = `<span style="color: #16a34a; font-weight: 700;">✓ BIS Compliance:</span> Tested Hardness (${h} ppm) is <strong>within the Acceptable Limit (≤ 200 ppm)</strong>. Safe for domestic drinking water.`;
          } else if (h <= 600) {
            compHTML = `<span style="color: #d97706; font-weight: 700;">⚠ BIS Compliance:</span> Tested Hardness (${h} ppm) exceeds Acceptable Limit (200 ppm) but is <strong>within Permissible Limit (≤ 600 ppm)</strong> in absence of alternate source.`;
          } else {
            compHTML = `<span style="color: #dc2626; font-weight: 700;">✕ BIS Compliance:</span> Tested Hardness (${h} ppm) <strong>exceeds Permissible Limit (600 ppm)</strong>. Unfit for drinking; water softening required.`;
          }
          compBox.innerHTML = compHTML;
          compBox.style.display = "block";
        }
      }
    }

    window.switchResultsTab = function (tabName) {
      const tabPhase1 = document.getElementById("tabBtnPhase1");
      const tabPhase2 = document.getElementById("tabBtnPhase2");
      const tabAll = document.getElementById("tabBtnAll");

      const obs1 = document.getElementById("obsTablePhase1");
      const obs2 = document.getElementById("obsTablePhase2");
      const calc1 = document.getElementById("calcCardPhase1");
      const calc2 = document.getElementById("calcCardPhase2");
      const infBox = document.getElementById("inferenceBox");

      [tabPhase1, tabPhase2, tabAll].forEach(t => t?.classList.remove("active"));

      if (tabName === "phase1") {
        tabPhase1?.classList.add("active");
        if (obs1) obs1.style.display = "block";
        if (obs2) obs2.style.display = "none";
        if (calc1) calc1.style.display = "block";
        if (calc2) calc2.style.display = "none";
        if (infBox) infBox.style.display = "none";
      } else if (tabName === "phase2") {
        tabPhase2?.classList.add("active");
        if (obs1) obs1.style.display = "none";
        if (obs2) obs2.style.display = "block";
        if (calc1) calc1.style.display = "none";
        if (calc2) calc2.style.display = "block";
        if (infBox) infBox.style.display = "block";
      } else {
        tabAll?.classList.add("active");
        if (obs1) obs1.style.display = "block";
        if (obs2) obs2.style.display = "block";
        if (calc1) calc1.style.display = "block";
        if (calc2) calc2.style.display = "block";
        if (infBox) infBox.style.display = "block";
      }

      const rs = document.querySelector(".results-section");
      if (rs) rs.scrollTop = 0;
    };

    function preparePhase(phase, trial) {
      currentPhase = phase;
      trialNumber = trial;
      currentStep = 1;
      initialReading = 0.0;
      currentReading = 0.0;
      titreVolume = 0.0;
      isStopcockOpen = false;
      isSwirling = false;
      hasBuffer = false;
      hasIndicator = false;
      hasSample = false;
      endpointReached = false;
      currentColorHex = "#e2e8f0";
      isAnimating = false;

      if (currentPhase === "phase2") {
        equivalenceVolume = chem.getSampleEquivalenceVolume(trialNumber - 1);
      }

      if (labWorld) {
        labWorld.reset(phase);
      }

      if (window.switchResultsTab) {
        window.switchResultsTab(phase);
      }

      updateGuidance();
      updateHUD();
      updateControls();
    }

    const triggerStep = (stepNum, actionFn) => {
      if (isAnimating) {
        if (labWorld && labWorld.skipActiveAnimation) {
          labWorld.skipActiveAnimation();
        }
        return;
      }
      if (currentStep !== stepNum) return;
      actionFn();
    };

    // ACTION BUTTON 1
    if (dom.btnAction1) {
      dom.btnAction1.onclick = () => {
        triggerStep(1, () => {
          isAnimating = true;
          updateControls();

          if (currentPhase === "phase1") {
            showFeedback("Weighing bottle containing EDTA salt on electronic balance...", "info");
            labWorld.playWeighBottle(() => {
              isAnimating = false;
              currentStep = 2;
              showFeedback(`Recorded Mass of bottle + EDTA salt (W₁) = ${chem.edtaBottlePlusSaltW1.toFixed(3)} g.`, "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          } else {
            showFeedback("Filling burette with prepared standard EDTA solution up to 0.00 mL mark...", "info");
            labWorld.playFillBurette(() => {
              isAnimating = false;
              currentReading = 0.0;
              initialReading = 0.0;
              currentStep = 2;
              showFeedback("Burette filled with standard EDTA up to 0.00 mL mark. Meniscus aligned.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          }
        });
      };
    }

    // ACTION BUTTON 2
    if (dom.btnAction2) {
      dom.btnAction2.onclick = () => {
        triggerStep(2, () => {
          isAnimating = true;
          updateControls();

          if (currentPhase === "phase1") {
            showFeedback("Transferring EDTA crystals through funnel into 250 mL volumetric flask...", "info");
            labWorld.playTransferEdta(() => {
              isAnimating = false;
              currentStep = 3;
              showFeedback("EDTA crystals transferred into volumetric flask. Ready to reweigh empty bottle.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          } else {
            showFeedback(`Pipetting exactly ${chem.sampleVolume.toFixed(1)} mL water sample into conical flask...`, "info");
            labWorld.playPipette(() => {
              isAnimating = false;
              hasSample = true;
              currentStep = 3;
              showFeedback(`Transferred ${chem.sampleVolume.toFixed(1)} mL water sample into 250 mL conical flask.`, "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          }
        });
      };
    }

    // ACTION BUTTON 3
    if (dom.btnAction3) {
      dom.btnAction3.onclick = () => {
        triggerStep(3, () => {
          isAnimating = true;
          updateControls();

          if (currentPhase === "phase1") {
            showFeedback("Reweighing empty bottle on balance to calculate transferred mass...", "info");
            labWorld.playReweighBottle(() => {
              isAnimating = false;
              currentStep = 4;
              const w = chem.edtaMassTransferred.toFixed(3);
              showFeedback(`Empty bottle (W₂) = ${chem.edtaEmptyBottleW2.toFixed(3)} g. Transferred mass W = ${w} g.`, "success");
              updateGuidance();
              updateHUD();
              updateControls();
              renderTables();
            });
          } else {
            showFeedback(`Adding ${chem.bufferVolume.toFixed(1)} mL Ammonia Buffer (pH 10) to maintain alkaline pH...`, "info");
            labWorld.playBuffer(() => {
              isAnimating = false;
              hasBuffer = true;
              currentStep = 4;
              showFeedback(`Added ${chem.bufferVolume.toFixed(1)} mL NH3-NH4Cl buffer. pH maintained at 10.0 for stable chelation.`, "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          }
        });
      };
    }

    // ACTION BUTTON 4
    if (dom.btnAction4) {
      dom.btnAction4.onclick = () => {
        triggerStep(4, () => {
          isAnimating = true;
          updateControls();

          if (currentPhase === "phase1") {
            showFeedback("Washing funnel with ion-exchange water and removing funnel...", "info");
            labWorld.playWashFunnel(() => {
              isAnimating = false;
              currentStep = 5;
              showFeedback("Funnel washed with ion-exchange water and removed cleanly.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          } else {
            showFeedback("Adding a pinch of Eriochrome Black-T (EBT) indicator powder...", "info");
            labWorld.playIndicator(() => {
              isAnimating = false;
              hasIndicator = true;
              currentStep = 5;
              currentColorHex = "#990033";
              if (labWorld) labWorld.setFlaskColor(currentColorHex);
              showFeedback("Added pinch of EBT. Wine-red [Ca-EBT]+ / [Mg-EBT]+ complex formed.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          }
        });
      };
    }

    // ACTION BUTTON 5
    if (dom.btnAction5) {
      dom.btnAction5.onclick = () => {
        triggerStep(5, () => {
          isAnimating = true;
          updateControls();

          if (currentPhase === "phase1") {
            showFeedback("Swirling volumetric flask gently to dissolve EDTA crystals completely...", "info");
            labWorld.playDissolveEdta(() => {
              isAnimating = false;
              currentStep = 6;
              showFeedback("EDTA crystals completely dissolved in ion-exchange water.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          } else {
            showFeedback("Placing conical flask beneath burette on white contrast porcelain tile...", "info");
            labWorld.playPlaceFlask(() => {
              isAnimating = false;
              currentStep = 6;
              if (labWorld) labWorld.setFlaskPlaced(true);
              showFeedback("Flask placed on white tile directly under burette tip. Ready to titrate.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          }
        });
      };
    }

    // ACTION BUTTON 6
    if (dom.btnAction6) {
      dom.btnAction6.onclick = () => {
        if (currentPhase === "phase1") {
          triggerStep(6, () => {
            isAnimating = true;
            updateControls();
            showFeedback("Making up solution to the 250 mL calibration mark with ion-exchange water...", "info");
            labWorld.playMakeUpToMark(() => {
              isAnimating = false;
              currentStep = 7;
              showFeedback("Liquid level accurately made up to the 250 mL graduation ring mark.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          });
        } else {
          // Phase 2: Toggle Stopcock
          const alreadyRecorded = trialsTotalHardness.some(t => t.trialNum === trialNumber);
          if (alreadyRecorded) {
            showFeedback(`Trial ${trialNumber} is already completed. Click 'Start Next Trial' for the next run.`, "info");
            return;
          }
          if (currentStep < 6 || !hasIndicator || isAnimating) return;
          isStopcockOpen = !isStopcockOpen;
          if (labWorld) labWorld.setStopcock(isStopcockOpen);
          showFeedback(isStopcockOpen ? "Stopcock opened. Titration in progress..." : "Stopcock closed.", "info");
          updateHUD();
          updateControls();
        }
      };
    }

    // ACTION BUTTON 7
    if (dom.btnAction7) {
      dom.btnAction7.onclick = () => {
        if (currentPhase === "phase1") {
          triggerStep(7, () => {
            isAnimating = true;
            updateControls();
            showFeedback("Stoppering flask and inverting several times for complete homogenization...", "info");
            labWorld.playStopperAndMix(() => {
              isAnimating = false;
              currentStep = 8;
              showFeedback("Flask stoppered and thoroughly mixed by inversion.", "success");
              updateGuidance();
              updateHUD();
              updateControls();
            });
          });
        } else {
          // Phase 2: Swirl Conical Flask
          isSwirling = true;
          if (labWorld) labWorld.setSwirling(true);
          setTimeout(() => {
            isSwirling = false;
            if (labWorld) labWorld.setSwirling(false);
          }, 1800);
        }
      };
    }

    // ACTION BUTTON 8
    if (dom.btnAction8) {
      dom.btnAction8.onclick = () => {
        if (currentPhase === "phase1") {
          triggerStep(8, () => {
            const molarity = chem.calculateEdtaMolarity();
            showFeedback(`Molarity of EDTA = (${chem.edtaMassTransferred} × 4) / 372.24 = ${molarity.toFixed(4)} M. Preparation complete!`, "success");
            renderTables();
            renderCalculations();
            renderResults();
          });
        } else {
          // Phase 2: Record Reading
          const alreadyRecorded = trialsTotalHardness.some(t => t.trialNum === trialNumber);
          if (alreadyRecorded) {
            showFeedback(`Trial ${trialNumber} reading is already recorded. Click 'Start Next Trial' to proceed.`, "info");
            return;
          }

          if (isStopcockOpen) {
            isStopcockOpen = false;
            if (labWorld) labWorld.setStopcock(false);
          }

          const initVal = Number(initialReading.toFixed(2));
          const finalVal = Number(currentReading.toFixed(2));
          const titre = Number((finalVal - initVal).toFixed(2));
          const f = equivalenceVolume > 0 ? titre / equivalenceVolume : 0;

          let status = "Accurate";
          let observation = "Wine Red → Clear Blue";
          if (f < 0.98) {
            status = "Incomplete";
            observation = "Wine Red / Incomplete";
          } else if (f > 1.05) {
            status = "Overshot";
            observation = "Deep Blue (Overshot)";
          } else if (trialNumber === 1) {
            status = "Rough";
            observation = "Clear Blue (Pilot)";
          }

          const record = {
            trialNum: trialNumber,
            sampleVolume: chem.sampleVolume,
            initial: initVal,
            final: finalVal,
            titre: titre,
            observation: observation,
            status: status,
            valid: (status !== "Incomplete")
          };

          trialsTotalHardness.push(record);

          const conc = chem.findConcordantTitre(trialsTotalHardness);
          if (conc.hasConcordance) {
            acceptedConcordantHardness = conc.concordantValue;
            chem.calculateTotalHardness(acceptedConcordantHardness);
          }

          currentStep = 7;
          showFeedback(`Trial ${trialNumber} recorded: Titre = ${titre} mL (${observation}).`, "success");
          updateGuidance();
          updateHUD();
          updateControls();
          renderTables();
          renderCalculations();
          renderResults();
        }
      };
    }

    if (dom.btnNextTrial) {
      dom.btnNextTrial.onclick = () => {
        preparePhase("phase2", trialNumber + 1);
      };
    }

    if (dom.btnResetTrial) {
      dom.btnResetTrial.onclick = () => {
        if (currentPhase === "phase1") {
          preparePhase("phase1", 1);
        } else {
          const idx = trialsTotalHardness.findIndex(t => t.trialNum === trialNumber);
          if (idx !== -1) {
            trialsTotalHardness.splice(idx, 1);
            renderTables();
            renderCalculations();
          }
          preparePhase("phase2", trialNumber);
        }
      };
    }

    if (dom.btnSwitchPhase) {
      dom.btnSwitchPhase.onclick = () => {
        const nextPhase = (currentPhase === "phase1") ? "phase2" : "phase1";
        preparePhase(nextPhase, 1);
      };
    }

    // Variables Spinners & Menus
    if (dom.varEdtaMass) {
      dom.varEdtaMass.oninput = (e) => {
        const val = Number(e.target.value);
        chem.setEdtaMass(val);
        if (dom.varEdtaMassVal) dom.varEdtaMassVal.textContent = "g";
        renderTables();
        renderCalculations();
        renderResults();
      };
    }

    if (dom.varBufferVolume) {
      dom.varBufferVolume.oninput = (e) => {
        const val = Number(e.target.value);
        chem.setBufferVolume(val);
        if (dom.varBufferVolumeVal) dom.varBufferVolumeVal.textContent = "mL";
      };
    }

    if (dom.varFlowRate) {
      dom.varFlowRate.oninput = (e) => {
        const r = Number(e.target.value);
        flowRate = r;
        let lbl = "mL/s";
        if (dom.varFlowRateVal) dom.varFlowRateVal.textContent = lbl;
      };
    }

    if (dom.varSamplePreset) {
      dom.varSamplePreset.onchange = (e) => {
        const h = Number(e.target.value);
        chem.setSampleHardness(h);
        if (currentPhase === "phase2") {
          equivalenceVolume = chem.getSampleEquivalenceVolume(trialNumber - 1);
        }
        showFeedback(`Water sample preset selected: ~ ${h} ppm of CaCO3.`, "info");
      };
    }

    // Calculation Checks
    if (dom.btnCheckFactor) {
      dom.btnCheckFactor.onclick = () => {
        const inputVal = parseFloat(dom.inputFactorCheck.value);
        if (isNaN(inputVal) || inputVal <= 0) {
          alert("Please enter a valid numeric value for EDTA molarity.");
          return;
        }
        const expected = chem.actualEdtaMolarity;
        if (Math.abs(inputVal - expected) <= 0.03 * expected) {
          dom.inputFactorCheck.className = "calc-input correct";
          showFeedback("✓ Correct! Standard EDTA molarity calculation is verified.", "success");
        } else {
          dom.inputFactorCheck.className = "calc-input incorrect";
          showFeedback(`Incorrect. Expected ~ ${expected.toFixed(4)} M. Click 'Steps'.`, "warn");
        }
      };
    }

    if (dom.btnStepsFactor) {
      dom.btnStepsFactor.onclick = () => {
        if (dom.stepsFactorContent) dom.stepsFactorContent.classList.toggle("show");
      };
    }

    if (dom.btnCheckHardness) {
      dom.btnCheckHardness.onclick = () => {
        const inputVal = parseFloat(dom.inputHardnessCheck.value);
        if (isNaN(inputVal) || inputVal <= 0) {
          alert("Please enter a valid numeric value for Total Hardness in ppm.");
          return;
        }
        if (!acceptedConcordantHardness) {
          alert("Please complete trials and obtain concordant readings first.");
          return;
        }
        const expected = chem.calculateTotalHardness(acceptedConcordantHardness).totalHardness;
        if (Math.abs(inputVal - expected) <= 0.05 * expected) {
          dom.inputHardnessCheck.className = "calc-input correct";
          showFeedback(`✓ Excellent! Total Hardness is accurate: ${expected} ppm CaCO3.`, "success");
        } else {
          dom.inputHardnessCheck.className = "calc-input incorrect";
          showFeedback(`Incorrect. Expected ~ ${expected} ppm. Review step-by-step formula.`, "warn");
        }
      };
    }

    if (dom.btnStepsHardness) {
      dom.btnStepsHardness.onclick = () => {
        if (dom.stepsHardnessContent) dom.stepsHardnessContent.classList.toggle("show");
      };
    }

    if (dom.btnSubmitInference) {
      dom.btnSubmitInference.onclick = () => {
        const sel = document.querySelector('input[name="bisInference"]:checked');
        if (!sel) {
          alert("Please select True or False for the BIS drinking water standard statement.");
          return;
        }
        const isT = (sel.value === "true");
        if (dom.inferenceFeedback) {
          dom.inferenceFeedback.innerHTML = isT
            ? `<div style="color: #15803d; font-weight: 700; background: #f0fdf4; padding: 0.4rem; border-radius: 4px; border-left: 3px solid #22c55e;">
                ✓ Correct! As per Indian Standard <strong>IS 10500:2012 / IS 3025 (Part 21)</strong>, the acceptable limit of total hardness in drinking water is <strong>200 mg/L (ppm)</strong>, and the maximum permissible limit is <strong>600 mg/L (ppm)</strong> in the absence of an alternate source.
              </div>`
            : `<div style="color: #b91c1c; font-weight: 700; background: #fef2f2; padding: 0.4rem; border-radius: 4px; border-left: 3px solid #ef4444;">
                ✗ Incorrect. The statement is <strong>True</strong>. BIS IS 10500:2012 specifies 200 ppm as the acceptable limit and 600 ppm as the maximum permissible limit.
              </div>`;
          dom.inferenceFeedback.style.display = "block";
        }
      };
    }

    // Animation & Physics Frame Loop
    let lastT = performance.now();
    function simFrame() {
      const now = performance.now();
      const delta = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      if (isStopcockOpen && currentPhase === "phase2") {
        const added = flowRate * delta;
        currentReading = Math.min(50.0, currentReading + added);
        titreVolume = Number((currentReading - initialReading).toFixed(2));

        if (labWorld) {
          labWorld.setBuretteLevel(currentReading);
          labWorld.setFlaskVolume(chem.sampleVolume + chem.bufferVolume + titreVolume);
        }

        const f = equivalenceVolume > 0 ? titreVolume / equivalenceVolume : 0;
        const cInfo = chem.getSolutionColor(f, isSwirling);
        currentColorHex = cInfo.hex;
        if (labWorld) labWorld.setFlaskColor(currentColorHex);

        if (f >= 1.0 && !endpointReached) {
          endpointReached = true;
        }

        updateHUD();
      }

      requestAnimationFrame(simFrame);
    }
    requestAnimationFrame(simFrame);

    // Initial setup
    preparePhase("phase1", 1);
    renderTables();
    renderCalculations();
    renderResults();
  }

  // Self-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSimulationApp);
  } else {
    initSimulationApp();
  }
})();
