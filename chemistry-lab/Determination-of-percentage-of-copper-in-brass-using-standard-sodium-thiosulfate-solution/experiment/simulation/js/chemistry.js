/**
 * chemistry.js
 * Chemistry calculations and analytical logic for EDTA Titration:
 * - Complexometric equilibria and equivalence volume derivation
 * - Dynamic color transitions based on fraction titrated
 * - Standardized EDTA concentration and CaCO3 equivalent factor
 * - Water sample total hardness calculation
 * - Concordance detection and BIS standards classification
 */

export class ChemistryEngine {
  constructor(config = {}) {
    this.config = config;
    
    // Default chemical parameters
    this.nominalEdtaMolarity = config.defaults?.edta?.nominalMolarity || 0.010;
    this.actualEdtaMolarity = this.nominalEdtaMolarity; // will be updated by standardization
    this.caco3EquivalentFactor = 1.0; // mg of CaCO3 per mL EDTA
    
    // Standard solution parameters
    this.stdCaco3Molarity = config.defaults?.standardSolution?.concentrationM || 0.010;
    this.stdCaco3Volume = config.defaults?.standardSolution?.defaultVolumeML || 10.0;
    this.caco3MolarMass = config.defaults?.standardSolution?.molarMass || 100.0869;
    
    // Sample parameters
    this.sampleVolume = config.defaults?.waterSample?.defaultVolumeML || 100.0;
    this.samplePresetHardness = config.defaults?.waterSample?.presetHardness || 220.0; // mg/L as CaCO3
    
    // Titration tolerance
    this.concordanceTolerance = config.defaults?.titration?.concordanceToleranceML || 0.1;
    
    // Controlled experimental variation (makes repeated trials realistic within +/- 0.08 mL)
    this.trialVariations = {
      phase1: [0.0, -0.05, +0.05, 0.0],
      phase2: [0.0, -0.05, +0.05, 0.0]
    };
  }

  /**
   * Set the water sample preset hardness
   */
  setSampleHardness(hardnessMgL) {
    this.samplePresetHardness = Math.max(10, Math.min(1000, Number(hardnessMgL) || 200));
  }

  /**
   * Set standard CaCO3 volume (mL)
   */
  setStdVolume(volumeML) {
    this.stdCaco3Volume = Math.max(1, Math.min(50, Number(volumeML) || 10));
  }

  /**
   * Set water sample volume (mL)
   */
  setSampleVolume(volumeML) {
    this.sampleVolume = Math.max(10, Math.min(250, Number(volumeML) || 100));
  }

  /**
   * Set nominal EDTA molarity
   */
  setNominalEdtaMolarity(molarity) {
    this.nominalEdtaMolarity = Math.max(0.001, Math.min(0.1, Number(molarity) || 0.01));
    this.actualEdtaMolarity = this.nominalEdtaMolarity;
  }

  /**
   * Calculate Theoretical Equivalence Volume for Phase 1 (Standardization)
   * V_eq = (M_std * V_std) / M_edta
   */
  getStandardizationEquivalenceVolume(trialIndex = 0) {
    const theoreticalVeq = (this.stdCaco3Molarity * this.stdCaco3Volume) / this.nominalEdtaMolarity;
    const variation = this.trialVariations.phase1[trialIndex % this.trialVariations.phase1.length] || 0.0;
    return Number((theoreticalVeq + variation).toFixed(2));
  }

  /**
   * Calculate Theoretical Equivalence Volume for Phase 2 (Sample Hardness)
   * mg of CaCO3 in sample = (Hardness * V_sample) / 1000
   * V_eq = mg of CaCO3 / caco3EquivalentFactor
   */
  getSampleEquivalenceVolume(trialIndex = 0) {
    const totalMgCaco3 = (this.samplePresetHardness * this.sampleVolume) / 1000.0;
    const factor = this.caco3EquivalentFactor > 0 ? this.caco3EquivalentFactor : 1.0;
    const theoreticalVeq = totalMgCaco3 / factor;
    const variation = this.trialVariations.phase2[trialIndex % this.trialVariations.phase2.length] || 0.0;
    return Number((theoreticalVeq + variation).toFixed(2));
  }

  /**
   * Calculate EDTA Standardization Results based on an accepted/concordant titre
   */
  calculateStandardization(edtaTitreML) {
    if (!edtaTitreML || edtaTitreML <= 0) {
      throw new Error("Invalid EDTA titre volume");
    }
    
    // mg of CaCO3 in standard aliquot:
    // 10 mL of 0.010 M CaCO3 = 0.1 mmol * 100.0869 mg/mmol = 10.0087 mg
    const massCaco3Mg = (this.stdCaco3Volume * this.stdCaco3Molarity * this.caco3MolarMass);
    
    // 1. CaCO3 equivalent of 1 mL EDTA (mg/mL):
    const factor = massCaco3Mg / edtaTitreML;
    
    // 2. Actual EDTA Molarity (M):
    // M_edta = (M_caco3 * V_caco3) / V_edta
    const molarity = (this.stdCaco3Molarity * this.stdCaco3Volume) / edtaTitreML;
    
    this.caco3EquivalentFactor = Number(factor.toFixed(4));
    this.actualEdtaMolarity = Number(molarity.toFixed(5));
    
    return {
      stdVolume: this.stdCaco3Volume,
      stdMolarity: this.stdCaco3Molarity,
      edtaTitre: edtaTitreML,
      massCaco3Mg: Number(massCaco3Mg.toFixed(2)),
      caco3EquivalentFactor: this.caco3EquivalentFactor,
      actualEdtaMolarity: this.actualEdtaMolarity
    };
  }

  /**
   * Calculate Total Hardness of Water Sample based on an accepted/concordant titre
   * Total Hardness (mg/L as CaCO3) = (V_edta * Factor * 1000) / V_sample
   */
  calculateTotalHardness(sampleEdtaTitreML) {
    if (!sampleEdtaTitreML || sampleEdtaTitreML <= 0) {
      throw new Error("Invalid sample EDTA titre volume");
    }
    if (!this.sampleVolume || this.sampleVolume <= 0) {
      throw new Error("Invalid sample volume");
    }
    
    const factor = this.caco3EquivalentFactor || 1.0;
    
    // Method 1: Factor method (NITK formula)
    // Total Hardness = (V_edta * Factor * 1000) / V_sample
    const totalHardnessFactorMethod = (sampleEdtaTitreML * factor * 1000.0) / this.sampleVolume;
    
    // Method 2: Molarity method (Standard APHA/IS 3025 formula)
    // Total Hardness = (V_edta * M_edta * 100,090) / V_sample
    const totalHardnessMolarityMethod = (sampleEdtaTitreML * this.actualEdtaMolarity * 100086.9) / this.sampleVolume;
    
    const finalHardness = Number(totalHardnessFactorMethod.toFixed(1));
    const classification = this.classifyWaterHardness(finalHardness);
    
    return {
      sampleVolume: this.sampleVolume,
      sampleEdtaTitre: sampleEdtaTitreML,
      factor: factor,
      edtaMolarity: this.actualEdtaMolarity,
      totalHardness: finalHardness,
      totalHardnessMolarityMethod: Number(totalHardnessMolarityMethod.toFixed(1)),
      classification: classification,
      unit: "mg/L as CaCO3"
    };
  }

  /**
   * Classify water hardness according to BIS / international standards
   */
  classifyWaterHardness(hardnessMgL) {
    if (hardnessMgL < 75) {
      return { category: "Soft", description: "Readily forms lather with soap, low mineral deposit tendency." };
    } else if (hardnessMgL < 150) {
      return { category: "Moderately Hard", description: "Acceptable for drinking, slight soap precipitation." };
    } else if (hardnessMgL <= 300) {
      return { category: "Hard", description: "Noticeable mineral scaling in boilers and kettles, high soap consumption." };
    } else {
      return { category: "Very Hard", description: "Severe scaling, water softening is required for domestic and industrial use." };
    }
  }

  /**
   * Detect concordant readings within tolerance
   * Returns: { hasConcordance: boolean, concordantValue: number, concordantIndices: number[] }
   */
  findConcordantTitre(trials = []) {
    const validTrials = trials.filter(t => t.valid && t.titre > 0);
    if (validTrials.length < 2) {
      return { hasConcordance: false, concordantValue: null, concordantIndices: [] };
    }

    // Check all pairs for difference <= tolerance
    for (let i = 0; i < validTrials.length; i++) {
      for (let j = i + 1; j < validTrials.length; j++) {
        const diff = Math.abs(validTrials[i].titre - validTrials[j].titre);
        if (diff <= this.concordanceTolerance) {
          const avg = Number(((validTrials[i].titre + validTrials[j].titre) / 2).toFixed(2));
          return {
            hasConcordance: true,
            concordantValue: avg,
            concordantIndices: [validTrials[i].trialNum, validTrials[j].trialNum],
            difference: Number(diff.toFixed(2))
          };
        }
      }
    }

    return { hasConcordance: false, concordantValue: null, concordantIndices: [] };
  }

  /**
   * Get dynamic color based on titration progress
   * Returns: { hex: string, rgb: [r, g, b], name: string, phase: string }
   */
  getSolutionColor(fractionTitrated, isSwirling = false) {
    // Clamped fraction
    const f = Math.max(0, fractionTitrated);

    // Initial wine red: rgb(153, 0, 51) -> #990033
    // Transitional violet: rgb(110, 30, 130) -> #6E1E82
    // Endpoint sky blue: rgb(16, 96, 208) -> #1060D0
    
    if (f < 0.85) {
      return {
        hex: "#990033",
        rgb: [153, 0, 51],
        name: "Wine Red",
        description: "Metal-EBT complex ([Ca-In]+, [Mg-In]+) dominates at pH 10"
      };
    } else if (f < 0.96) {
      // Wine red with slight purple swirling
      const localR = isSwirling ? 135 : 145;
      const localG = isSwirling ? 15 : 5;
      const localB = isSwirling ? 85 : 65;
      return {
        hex: `rgb(${localR}, ${localG}, ${localB})`,
        rgb: [localR, localG, localB],
        name: "Wine Red with Purple Swirls",
        description: "EDTA chelates free metal ions, indicator displacement begins locally"
      };
    } else if (f < 1.00) {
      // Violet / Purple transitional state
      const t = (f - 0.96) / 0.04;
      const r = Math.round(140 * (1 - t) + 80 * t);
      const g = Math.round(10 * (1 - t) + 40 * t);
      const b = Math.round(75 * (1 - t) + 160 * t);
      return {
        hex: `rgb(${r}, ${g}, ${b})`,
        rgb: [r, g, b],
        name: "Transitional Violet / Purple",
        description: "Near equivalence point: slow dropwise addition is strongly recommended"
      };
    } else if (f <= 1.02) {
      // Sharp, distinct sky blue
      return {
        hex: "#1060D0",
        rgb: [16, 96, 208],
        name: "Distinct Clear Blue (Endpoint reached!)",
        description: "All hardness ions complexed by EDTA; free indicator HIn2- restored"
      };
    } else {
      // Deep blue / overshot
      return {
        hex: "#0040AA",
        rgb: [0, 64, 170],
        name: "Deep Blue (Overshot)",
        description: "Excess EDTA titrant added past the equivalence point"
      };
    }
  }
}
