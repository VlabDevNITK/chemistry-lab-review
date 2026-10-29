/**
 * main.js
 * Application Entry Point:
 * - Bootstraps Experiment Data, Three.js Orthographic Lab Scene, Chemistry Engine,
 *   Simulation State Machine, and UI Controller.
 */

import { createLabScene } from "./scene.js";
import { ChemistryEngine } from "./chemistry.js";
import { TitrationSimulation } from "./simulation.js";
import { UIController } from "./ui.js";

async function initExperiment() {
  try {
    // 1. Fetch Experiment Configuration JSON
    let experimentConfig = {};
    try {
      const res = await fetch("./data/experiment.json");
      if (res.ok) {
        experimentConfig = await res.json();
      }
    } catch (e) {
      console.warn("Could not load experiment.json via fetch, using fallback defaults:", e);
    }

    // 2. Initialize Chemistry Engine
    const chemistryEngine = new ChemistryEngine(experimentConfig);

    // 3. Initialize Three.js Laboratory Scene
    const simContainer = document.getElementById("simscreen-container");
    if (!simContainer) {
      throw new Error("Missing #simscreen-container element in template.");
    }
    const labScene = createLabScene(simContainer);

    // 4. Initialize Titration Simulation Engine
    const simulation = new TitrationSimulation(labScene, chemistryEngine, experimentConfig);

    // 5. Initialize UI Controller
    const ui = new UIController(simulation, chemistryEngine);

    // 6. Start Three.js Animation Render Loop
    labScene.startRenderLoop();

    // Expose for inspection and debugging
    window.__chemLab = {
      scene: labScene,
      simulation: simulation,
      chemistry: chemistryEngine,
      ui: ui
    };

    console.log("EDTA Water Hardness Titration Experiment initialized successfully.");
  } catch (err) {
    console.error("Experiment initialization failed:", err);
    const feedback = document.getElementById("simStepFeedback");
    if (feedback) {
      feedback.textContent = `Initialization Error: ${err.message}`;
      feedback.className = "sim-step-feedback show warn";
    }
  }
}

// Start simulation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExperiment);
} else {
  initExperiment();
}
