/**
 * ui.js
 * User Interface & Template Integration Controller:
 * - Manages interactive buttons in the existing Controls section
 * - Manages parameter sliders and selectors in the existing Variables section
 * - Renders dynamic observation tables with automatic concordance identification
 * - Implements interactive calculation verification cards with step-by-step formula substitutions
 * - Displays results metrics and BIS classification inference
 */

export class UIController {
  constructor(sim, chem) {
    this.sim = sim;
    this.chem = chem;

    // Cache DOM Elements
    this.dom = {
      // Step Guidance
      stepBadge: document.getElementById("simStepBadge"),
      phaseBadge: document.getElementById("simPhaseBadge"),
      stepInstruction: document.getElementById("simStepInstruction"),
      stepFeedback: document.getElementById("simStepFeedback"),

      // Live HUD
      hudBuretteReading: document.getElementById("hudBuretteReading"),
      hudTitreVolume: document.getElementById("hudTitreVolume"),
      hudStopcockBadge: document.getElementById("hudStopcockBadge"),
      hudColorBadge: document.getElementById("hudColorBadge"),
      meniscusReadingLabel: document.getElementById("meniscusReadingLabel"),

      // Controls Buttons
      btnFillBurette: document.getElementById("btnFillBurette"),
      btnPipette: document.getElementById("btnPipette"),
      btnAddBuffer: document.getElementById("btnAddBuffer"),
      btnAddIndicator: document.getElementById("btnAddIndicator"),
      btnPlaceFlask: document.getElementById("btnPlaceFlask"),
      btnStopcock: document.getElementById("btnStopcock"),
      btnSwirl: document.getElementById("btnSwirl"),
      btnRecord: document.getElementById("btnRecord"),
      btnNextTrial: document.getElementById("btnNextTrial"),
      btnSwitchPhase: document.getElementById("btnSwitchPhase"),
      btnResetTrial: document.getElementById("btnResetTrial"),

      // Variables Inputs
      varEdtaMolarity: document.getElementById("varEdtaMolarity"),
      varEdtaMolarityVal: document.getElementById("varEdtaMolarityVal"),
      varStdVolume: document.getElementById("varStdVolume"),
      varStdVolumeVal: document.getElementById("varStdVolumeVal"),
      varSampleVolume: document.getElementById("varSampleVolume"),
      varSampleVolumeVal: document.getElementById("varSampleVolumeVal"),
      varFlowRate: document.getElementById("varFlowRate"),
      varFlowRateVal: document.getElementById("varFlowRateVal"),
      varSamplePreset: document.getElementById("varSamplePreset"),

      // Tables Container
      obsTablePhase1: document.getElementById("obsTablePhase1"),
      obsTablePhase2: document.getElementById("obsTablePhase2"),

      // Calculations Container
      calcCardPhase1: document.getElementById("calcCardPhase1"),
      calcCardPhase2: document.getElementById("calcCardPhase2"),
      inputFactorCheck: document.getElementById("inputFactorCheck"),
      btnCheckFactor: document.getElementById("btnCheckFactor"),
      btnStepsFactor: document.getElementById("btnStepsFactor"),
      stepsFactorContent: document.getElementById("stepsFactorContent"),

      inputHardnessCheck: document.getElementById("inputHardnessCheck"),
      btnCheckHardness: document.getElementById("btnCheckHardness"),
      btnStepsHardness: document.getElementById("btnStepsHardness"),
      stepsHardnessContent: document.getElementById("stepsHardnessContent"),

      // Results
      resEdtaFactor: document.getElementById("resEdtaFactor"),
      resConcordantTitre: document.getElementById("resConcordantTitre"),
      resTotalHardness: document.getElementById("resTotalHardness"),
      resHardnessCategory: document.getElementById("resHardnessCategory"),
      inferenceBox: document.getElementById("inferenceBox"),
      btnSubmitInference: document.getElementById("btnSubmitInference"),
      inferenceFeedback: document.getElementById("inferenceFeedback")
    };

    // Attach Listeners
    this.bindEvents();

    // Register State Change Callback from Simulation
    this.sim.onStateChange = (state) => this.onSimulationUpdate(state);

    // Initial UI Render
    this.renderTables();
    this.updateControlsState();
  }

  bindEvents() {
    const s = this.sim;

    // Controls Action Buttons
    if (this.dom.btnFillBurette) this.dom.btnFillBurette.addEventListener("click", () => s.actionFillBurette());
    if (this.dom.btnPipette) this.dom.btnPipette.addEventListener("click", () => s.actionPipetteSolution());
    if (this.dom.btnAddBuffer) this.dom.btnAddBuffer.addEventListener("click", () => s.actionAddBuffer());
    if (this.dom.btnAddIndicator) this.dom.btnAddIndicator.addEventListener("click", () => s.actionAddIndicator());
    if (this.dom.btnPlaceFlask) this.dom.btnPlaceFlask.addEventListener("click", () => s.actionPlaceFlask());
    if (this.dom.btnStopcock) this.dom.btnStopcock.addEventListener("click", () => s.actionToggleStopcock());
    if (this.dom.btnSwirl) this.dom.btnSwirl.addEventListener("click", () => s.actionSwirlFlask());
    if (this.dom.btnRecord) this.dom.btnRecord.addEventListener("click", () => s.actionRecordReading());
    if (this.dom.btnNextTrial) this.dom.btnNextTrial.addEventListener("click", () => s.actionNextTrial());
    if (this.dom.btnResetTrial) this.dom.btnResetTrial.addEventListener("click", () => s.preparePhase(s.currentPhase, s.trialNumber));

    // Switch Phase Button
    if (this.dom.btnSwitchPhase) {
      this.dom.btnSwitchPhase.addEventListener("click", () => {
        const targetPhase = (s.currentPhase === "phase1") ? "phase2" : "phase1";
        s.preparePhase(targetPhase, 1);
        this.dom.btnSwitchPhase.textContent = (targetPhase === "phase1")
          ? "Proceed to Phase 2 (Water Hardness) ➜"
          : "↶ Back to Phase 1 (Standardization)";
      });
    }

    // Variables Inputs
    if (this.dom.varEdtaMolarity) {
      this.dom.varEdtaMolarity.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.chem.setNominalEdtaMolarity(val);
        if (this.dom.varEdtaMolarityVal) this.dom.varEdtaMolarityVal.textContent = `${val.toFixed(3)} M`;
        s.equivalenceVolume = (s.currentPhase === "phase1")
          ? this.chem.getStandardizationEquivalenceVolume(s.trialNumber - 1)
          : this.chem.getSampleEquivalenceVolume(s.trialNumber - 1);
      });
    }

    if (this.dom.varStdVolume) {
      this.dom.varStdVolume.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.chem.setStdVolume(val);
        if (this.dom.varStdVolumeVal) this.dom.varStdVolumeVal.textContent = `${val.toFixed(1)} mL`;
        if (s.currentPhase === "phase1") {
          s.equivalenceVolume = this.chem.getStandardizationEquivalenceVolume(s.trialNumber - 1);
        }
      });
    }

    if (this.dom.varSampleVolume) {
      this.dom.varSampleVolume.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.chem.setSampleVolume(val);
        if (this.dom.varSampleVolumeVal) this.dom.varSampleVolumeVal.textContent = `${val.toFixed(0)} mL`;
        if (s.currentPhase === "phase2") {
          s.equivalenceVolume = this.chem.getSampleEquivalenceVolume(s.trialNumber - 1);
        }
      });
    }

    if (this.dom.varFlowRate) {
      this.dom.varFlowRate.addEventListener("input", (e) => {
        const rate = Number(e.target.value);
        s.flowRate = rate;
        let speedLabel = "Medium (0.6 mL/s)";
        if (rate <= 0.2) speedLabel = "Dropwise (0.15 mL/s)";
        else if (rate >= 1.2) speedLabel = "Fast (1.5 mL/s)";
        if (this.dom.varFlowRateVal) this.dom.varFlowRateVal.textContent = speedLabel;
      });
    }

    if (this.dom.varSamplePreset) {
      this.dom.varSamplePreset.addEventListener("change", (e) => {
        const hardness = Number(e.target.value);
        this.chem.setSampleHardness(hardness);
        if (s.currentPhase === "phase2") {
          s.equivalenceVolume = this.chem.getSampleEquivalenceVolume(s.trialNumber - 1);
        }
        this.showFeedback(`Water sample preset updated: Expected hardness ~ ${hardness} mg/L as CaCO3.`, "info");
      });
    }

    // Interactive Student Calculation Check Buttons
    if (this.dom.btnCheckFactor) {
      this.dom.btnCheckFactor.addEventListener("click", () => this.checkFactorCalculation());
    }
    if (this.dom.btnStepsFactor) {
      this.dom.btnStepsFactor.addEventListener("click", () => {
        this.dom.stepsFactorContent.classList.toggle("show");
      });
    }

    if (this.dom.btnCheckHardness) {
      this.dom.btnCheckHardness.addEventListener("click", () => this.checkHardnessCalculation());
    }
    if (this.dom.btnStepsHardness) {
      this.dom.btnStepsHardness.addEventListener("click", () => {
        this.dom.stepsHardnessContent.classList.toggle("show");
      });
    }

    // BIS Inference Quiz Submit
    if (this.dom.btnSubmitInference) {
      this.dom.btnSubmitInference.addEventListener("click", () => this.checkInferenceAnswer());
    }
  }

  /**
   * Handle state changes emitted from TitrationSimulation
   */
  onSimulationUpdate(state) {
    // 1. Update live HUD readouts
    if (this.dom.hudBuretteReading) {
      this.dom.hudBuretteReading.textContent = `${state.currentReading.toFixed(2)} mL`;
    }
    if (this.dom.hudTitreVolume) {
      this.dom.hudTitreVolume.textContent = `${state.titreVolume.toFixed(2)} mL`;
    }
    if (this.dom.meniscusReadingLabel) {
      this.dom.meniscusReadingLabel.textContent = `${state.currentReading.toFixed(2)} mL`;
    }

    // Stopcock state badge
    if (this.dom.hudStopcockBadge) {
      if (state.isStopcockOpen) {
        this.dom.hudStopcockBadge.textContent = "OPEN (Titrating)";
        this.dom.hudStopcockBadge.className = "stopcock-status-badge open";
      } else {
        this.dom.hudStopcockBadge.textContent = "CLOSED";
        this.dom.hudStopcockBadge.className = "stopcock-status-badge closed";
      }
    }

    // Solution color badge
    if (this.dom.hudColorBadge) {
      const f = state.equivalenceVolume > 0 ? state.titreVolume / state.equivalenceVolume : 0;
      let colorName = "Clear / Colorless";
      if (state.hasIndicator) {
        if (f < 0.95) colorName = "Wine Red";
        else if (f < 1.0) colorName = "Purple Swirls";
        else if (f <= 1.03) colorName = "Clear Blue (Endpoint)";
        else colorName = "Deep Blue (Overshot)";
      }
      this.dom.hudColorBadge.textContent = colorName;
    }

    // 2. Update Step Guidance Bar
    if (this.dom.stepBadge) {
      this.dom.stepBadge.textContent = `Step ${state.step} of 8`;
    }
    if (this.dom.phaseBadge) {
      this.dom.phaseBadge.textContent = (state.phase === "phase1") ? "Phase 1: Standardization" : "Phase 2: Water Hardness";
    }

    // Guidance text
    this.updateGuidanceText(state);

    // 3. Update Action Buttons disabled/active states
    this.updateControlsState();

    // 4. Update Tables & Calculations
    this.renderTables();
    this.renderCalculations();
    this.renderResults();

    // Feedback message display
    if (state.message) {
      this.showFeedback(state.message, "success");
    }
  }

  updateGuidanceText(state) {
    if (!this.dom.stepInstruction) return;

    const instructions = {
      phase1: [
        "",
        "Step 1: Fill the burette with EDTA solution using the funnel up to the 0.00 mL mark.",
        "Step 2: Transfer 10.0 mL of 0.01 M standard CaCO3 solution into the conical flask using the pipette.",
        "Step 3: Add 1.0 mL of Ammonia Buffer (pH 10) to maintain alkaline pH for chelation.",
        "Step 4: Add 3-4 drops of Eriochrome Black T indicator. Observe the wine-red color [Ca-EBT]+ complex.",
        "Step 5: Place the conical flask on the white porcelain tile beneath the burette tip.",
        "Step 6: Open the burette stopcock to titrate with EDTA. Swirl the flask continuously. Titrate until the wine-red color transitions through purple to permanent pure blue.",
        "Step 7: Titration complete! Close the stopcock and record the final burette reading.",
        "Step 8: Standardization complete. Calculate the CaCO3 equivalent factor or proceed to additional trials."
      ],
      phase2: [
        "",
        "Step 1: Top up the burette with standardized EDTA solution to the 0.00 mL mark.",
        "Step 2: Transfer 100.0 mL of the water sample into the conical flask.",
        "Step 3: Add 1.0 mL Ammonia Buffer to maintain pH 10.",
        "Step 4: Add 3-4 drops of EBT indicator. The solution turns wine-red indicating presence of hardness ions.",
        "Step 5: Place the conical flask beneath the burette on the white contrast tile.",
        "Step 6: Titrate with EDTA while swirling until the sharp wine-red to blue endpoint is reached.",
        "Step 7: Close stopcock and record the final reading in the observation table.",
        "Step 8: Hardness titration complete. Repeat for concordant readings and calculate total hardness."
      ]
    };

    const currentList = (state.phase === "phase1") ? instructions.phase1 : instructions.phase2;
    this.dom.stepInstruction.textContent = currentList[state.step] || "Proceed with experimental steps.";
  }

  showFeedback(text, type = "info") {
    if (!this.dom.stepFeedback) return;
    this.dom.stepFeedback.textContent = text;
    this.dom.stepFeedback.className = `sim-step-feedback show ${type}`;
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.dom.stepFeedback.classList.remove("show");
    }, 4500);
  }

  updateControlsState() {
    const s = this.sim;
    const step = s.currentStep;

    const setBtn = (btn, isAllowed, isActiveAction) => {
      if (!btn) return;
      btn.disabled = !isAllowed;
      if (isActiveAction && isAllowed) {
        btn.classList.add("active-action");
      } else {
        btn.classList.remove("active-action");
      }
    };

    setBtn(this.dom.btnFillBurette, step === 1, step === 1);
    setBtn(this.dom.btnPipette, step === 2, step === 2);
    setBtn(this.dom.btnAddBuffer, step === 3, step === 3);
    setBtn(this.dom.btnAddIndicator, step === 4, step === 4);
    setBtn(this.dom.btnPlaceFlask, step === 5, step === 5);

    // Stopcock button (open/close)
    if (this.dom.btnStopcock) {
      const canTitrate = (step >= 6 && s.hasIndicator);
      setBtn(this.dom.btnStopcock, canTitrate, canTitrate && !s.isStopcockOpen);
      if (s.isStopcockOpen) {
        this.dom.btnStopcock.textContent = "🛑 Close Stopcock";
        this.dom.btnStopcock.classList.add("stopcock-open-btn");
      } else {
        this.dom.btnStopcock.textContent = "💧 Open Stopcock";
        this.dom.btnStopcock.classList.remove("stopcock-open-btn");
      }
    }

    const targetTrials = (s.currentPhase === "phase1") ? s.trialsPhase1 : s.trialsPhase2;
    const alreadyRecorded = targetTrials && targetTrials.some(t => t.trialNum === s.trialNumber);
    setBtn(this.dom.btnSwirl, step >= 5, s.isStopcockOpen);
    setBtn(this.dom.btnRecord, step === 6 && s.titreVolume > 0 && !alreadyRecorded, step === 6 && s.endpointReached && !alreadyRecorded);
    setBtn(this.dom.btnNextTrial, step >= 7 || alreadyRecorded, step >= 7 || alreadyRecorded);
  }

  renderTables() {
    // Render Phase 1 Table
    if (this.dom.obsTablePhase1) {
      this.renderPhaseTable(
        this.dom.obsTablePhase1,
        this.sim.trialsPhase1,
        this.sim.acceptedConcordantPhase1,
        "Phase 1: Standardization of EDTA"
      );
    }

    // Render Phase 2 Table
    if (this.dom.obsTablePhase2) {
      this.renderPhaseTable(
        this.dom.obsTablePhase2,
        this.sim.trialsPhase2,
        this.sim.acceptedConcordantPhase2,
        "Phase 2: Water Sample Titration"
      );
    }
  }

  renderPhaseTable(container, trials, concordantVal, title) {
    if (!container) return;

    let rowsHtml = "";
    if (trials.length === 0) {
      rowsHtml = `<tr><td colspan="7" style="color: #64748b; font-style: italic;">No recorded trials yet. Perform titration steps above.</td></tr>`;
    } else {
      trials.forEach((t) => {
        const isConcordant = concordantVal && Math.abs(t.titre - concordantVal) <= 0.1;
        const rowClass = isConcordant ? "concordant-row" : "";
        let badgeClass = "accurate";
        if (t.status === "Rough") badgeClass = "rough";
        else if (t.status === "Overshot") badgeClass = "overshot";
        else if (isConcordant) badgeClass = "concordant";

        rowsHtml += `
          <tr class="${rowClass}">
            <td><strong>Trial ${t.trialNum}</strong></td>
            <td>${t.sampleVolume.toFixed(1)}</td>
            <td>${t.initial.toFixed(2)}</td>
            <td>${t.final.toFixed(2)}</td>
            <td><strong>${t.titre.toFixed(2)}</strong></td>
            <td>${t.observation}</td>
            <td><span class="trial-badge ${badgeClass}">${isConcordant ? "Concordant" : t.status}</span></td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <div class="obs-table-container">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 1.3rem; color: #0a363c;">${title}</h4>
        <table class="exp-data-table">
          <thead>
            <tr>
              <th>Trial</th>
              <th>Sample Vol (mL)</th>
              <th>Initial Reading (mL)</th>
              <th>Final Reading (mL)</th>
              <th>EDTA Consumed (mL)</th>
              <th>Endpoint Observation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${concordantVal ? `<p style="margin-top: 0.5rem; font-size: 1.2rem; color: #065f46; font-weight: 600;">✓ Accepted Concordant Titre = ${concordantVal.toFixed(2)} mL</p>` : ""}
      </div>
    `;
  }

  renderCalculations() {
    // Phase 1 Card Update
    if (this.sim.acceptedConcordantPhase1 && this.dom.stepsFactorContent) {
      const v = this.sim.acceptedConcordantPhase1;
      const stdVol = this.chem.stdCaco3Volume;
      const factor = (stdVol / v).toFixed(4);
      const molarity = (0.01 * stdVol / v).toFixed(5);

      this.dom.stepsFactorContent.innerHTML = `
        <strong>Detailed Step-by-Step Calculation:</strong><br>
        1. Volume of Standard 0.01 M CaCO3 solution ($V_1$) = <strong>${stdVol.toFixed(1)} mL</strong><br>
        2. Mass of CaCO3 present in aliquot = 10 mL × 1 mg/mL = <strong>10.0 mg CaCO3</strong><br>
        3. Concordant volume of EDTA consumed ($V_2$) = <strong>${v.toFixed(2)} mL</strong><br>
        4. CaCO3 equivalent of 1 mL EDTA = Mass / $V_2$ = 10.0 / ${v.toFixed(2)} = <strong>${factor} mg/mL</strong><br>
        5. Actual Molarity of EDTA = ($M_1$ × $V_1$) / $V_2$ = (0.01 × ${stdVol}) / ${v.toFixed(2)} = <strong>${molarity} M</strong>
      `;
    }

    // Phase 2 Card Update
    if (this.sim.acceptedConcordantPhase2 && this.dom.stepsHardnessContent) {
      const vSampleTitre = this.sim.acceptedConcordantPhase2;
      const factor = this.chem.caco3EquivalentFactor;
      const sampleVol = this.chem.sampleVolume;
      const totalHardness = ((vSampleTitre * factor * 1000) / sampleVol).toFixed(1);

      this.dom.stepsHardnessContent.innerHTML = `
        <strong>Detailed Total Hardness Calculation:</strong><br>
        1. Volume of Water Sample titrated ($V_{sample}$) = <strong>${sampleVol.toFixed(0)} mL</strong><br>
        2. Concordant volume of EDTA consumed ($V_{EDTA}$) = <strong>${vSampleTitre.toFixed(2)} mL</strong><br>
        3. CaCO3 equivalent of 1 mL EDTA (from Phase 1) = <strong>${factor.toFixed(4)} mg/mL</strong><br>
        4. Total Hardness (mg/L as CaCO3):<br>
        &nbsp;&nbsp;&nbsp;&nbsp;= ($V_{EDTA}$ × CaCO3 equivalent × 1000) / $V_{sample}$<br>
        &nbsp;&nbsp;&nbsp;&nbsp;= (${vSampleTitre.toFixed(2)} × ${factor.toFixed(4)} × 1000) / ${sampleVol}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;= <strong>${totalHardness} mg/L as CaCO3</strong>
      `;
    }
  }

  renderResults() {
    if (this.dom.resEdtaFactor) {
      this.dom.resEdtaFactor.textContent = this.chem.caco3EquivalentFactor
        ? `${this.chem.caco3EquivalentFactor.toFixed(4)} mg/mL`
        : "--";
    }

    if (this.dom.resConcordantTitre) {
      this.dom.resConcordantTitre.textContent = this.sim.acceptedConcordantPhase2
        ? `${this.sim.acceptedConcordantPhase2.toFixed(2)} mL`
        : "--";
    }

    if (this.sim.acceptedConcordantPhase2 && this.dom.resTotalHardness) {
      const calc = this.chem.calculateTotalHardness(this.sim.acceptedConcordantPhase2);
      this.dom.resTotalHardness.textContent = `${calc.totalHardness} mg/L`;

      if (this.dom.resHardnessCategory) {
        this.dom.resHardnessCategory.textContent = `${calc.classification.category} (${calc.classification.description})`;
      }
    }
  }

  checkFactorCalculation() {
    const inputVal = parseFloat(this.dom.inputFactorCheck.value);
    if (isNaN(inputVal) || inputVal <= 0) {
      alert("Please enter a valid numeric value for CaCO3 equivalent.");
      return;
    }

    if (!this.sim.acceptedConcordantPhase1) {
      alert("Please complete Phase 1 trials and obtain concordant readings first.");
      return;
    }

    const expected = (this.chem.stdCaco3Volume / this.sim.acceptedConcordantPhase1);
    const tolerance = 0.05 * expected;

    if (Math.abs(inputVal - expected) <= tolerance) {
      this.dom.inputFactorCheck.className = "calc-input correct";
      this.showFeedback("✓ Correct! Your CaCO3 equivalent factor calculation is accurate.", "success");
    } else {
      this.dom.inputFactorCheck.className = "calc-input incorrect";
      this.showFeedback(`Incorrect. Expected ~ ${expected.toFixed(4)} mg/mL. Click 'Show Steps' for formula derivation.`, "warn");
    }
  }

  checkHardnessCalculation() {
    const inputVal = parseFloat(this.dom.inputHardnessCheck.value);
    if (isNaN(inputVal) || inputVal <= 0) {
      alert("Please enter a valid numeric value for Total Hardness.");
      return;
    }

    if (!this.sim.acceptedConcordantPhase2) {
      alert("Please complete Phase 2 trials and obtain concordant readings first.");
      return;
    }

    const calc = this.chem.calculateTotalHardness(this.sim.acceptedConcordantPhase2);
    const expected = calc.totalHardness;
    const tolerance = 0.05 * expected;

    if (Math.abs(inputVal - expected) <= tolerance) {
      this.dom.inputHardnessCheck.className = "calc-input correct";
      this.showFeedback(`✓ Excellent! Total Hardness is correct: ${expected} mg/L as CaCO3.`, "success");
    } else {
      this.dom.inputHardnessCheck.className = "calc-input incorrect";
      this.showFeedback(`Incorrect. Expected ~ ${expected} mg/L. Check formula substitution.`, "warn");
    }
  }

  checkInferenceAnswer() {
    const selected = document.querySelector('input[name="bisInference"]:checked');
    if (!selected) {
      alert("Please select True or False for the BIS standard statement.");
      return;
    }

    const isTrue = (selected.value === "true");
    // BIS IS 3025 Statement: "The acceptable limit of total hardness in drinking water is 200 mg/L as CaCO3, and the permissible limit is 600 mg/L in the absence of an alternate source."
    if (isTrue) {
      this.dom.inferenceFeedback.innerHTML = `
        <span style="color: #16a34a; font-weight: 700;">✓ Correct!</span> As per Indian Standard <strong>IS 10500:2012 / IS 3025 (Part 21)</strong>, the acceptable limit of total hardness is <strong>200 mg/L</strong>, and the permissible limit is <strong>600 mg/L</strong>.
      `;
    } else {
      this.dom.inferenceFeedback.innerHTML = `
        <span style="color: #dc2626; font-weight: 700;">✗ Incorrect.</span> The statement is <strong>True</strong>. BIS IS 10500:2012 prescribes 200 mg/L as the acceptable limit and 600 mg/L as the maximum permissible limit.
      `;
    }
    this.dom.inferenceFeedback.style.display = "block";
  }
}
