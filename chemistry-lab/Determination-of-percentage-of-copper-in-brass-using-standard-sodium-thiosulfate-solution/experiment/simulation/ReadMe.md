# Determination of Hardness of Water Using EDTA Titration
### Virtual Chemistry Laboratory Simulation (SOLVE - NITK)

---

## 1. Experiment Overview & Objective
This interactive simulation replicates the standard quantitative analytical chemistry procedure for determining the **Total Hardness of Water** via **Complexometric Titration with Disodium Ethylenediaminetetraacetate (EDTA)**, conforming to **IS 3025 (Part 21)** and evaluating compliance with Indian Drinking Water Quality Standards **IS 10500:2012**.

Students learn to:
1. Standardize a secondary standard EDTA solution against a primary standard Calcium Carbonate ($\text{CaCO}_3$) solution.
2. Titrate water samples containing dissolved Calcium ($\text{Ca}^{2+}$) and Magnesium ($\text{Mg}^{2+}$) hardness ions.
3. Detect the sharp chelation endpoint using Eriochrome Black T (EBT) indicator at $\text{pH } 10$.
4. Record experimental observations, compute concordant titres ($\Delta \le 0.10\text{ mL}$), calculate the $\text{CaCO}_3$ equivalent factor and Total Hardness in $\text{mg/L}$ ($\text{ppm}$), and assess drinking water suitability against Bureau of Indian Standards (BIS) limits.

---

## 2. Scientific Principles & Reaction Mechanisms (What is Happening)

### 2.1 Hardness of Water
Water hardness is primarily caused by multivalent metal cations—predominantly **$\text{Ca}^{2+}$** and **$\text{Mg}^{2+}$**—leached from sedimentary rock formations (limestone, dolomite, gypsum):
- **Temporary Hardness (Carbonate)**: Due to dissolved bicarbonates ($\text{Ca(HCO}_3)_2$, $\text{Mg(HCO}_3)_2$). Decomposes upon boiling.
- **Permanent Hardness (Non-carbonate)**: Due to chlorides and sulfates ($\text{CaCl}_2$, $\text{CaSO}_4$, $\text{MgCl}_2$, $\text{MgSO}_4$). Cannot be removed by simple boiling.
- **Total Hardness**: Sum of both temporary and permanent hardness, conventionally expressed in **$\text{mg/L as CaCO}_3$ equivalents** (or $\text{parts per million, ppm}$).

### 2.2 Complexometric EDTA Titration Principle
Disodium EDTA ($\text{Na}_2\text{H}_2\text{Y}\cdot 2\text{H}_2\text{O}$) is a hexadentate chelating ligand. In alkaline medium ($\text{pH } 10$), it ionizes into the tetravalent anion $\text{Y}^{4-}$, which forms strong, octahedral, 1:1 mole-ratio, water-soluble, colorless chelate rings with metal cations:

$$\text{Ca}^{2+} + [\text{EDTA}]^{4-} \rightleftharpoons [\text{Ca-EDTA}]^{2-} \quad (K_f = 10^{10.7})$$
$$\text{Mg}^{2+} + [\text{EDTA}]^{4-} \rightleftharpoons [\text{Mg-EDTA}]^{2-} \quad (K_f = 10^{8.7})$$

### 2.3 Role of Ammonia Buffer ($\text{pH } 10$)
- An **Ammonium chloride - Ammonium hydroxide ($\text{NH}_4\text{Cl} + \text{NH}_4\text{OH}$)** buffer maintains the reaction medium strictly at **$\text{pH } 10.0 \pm 0.1$**.
- **Why $\text{pH } 10$?**
  - If $\text{pH} < 8$: EDTA anions remain protonated ($\text{H}_2\text{Y}^{2-}$, $\text{HY}^{3-}$), drastically lowering effective stability constants and yielding an sluggish, inaccurate endpoint.
  - If $\text{pH} > 11$: Magnesium precipitates as insoluble magnesium hydroxide $\text{Mg(OH)}_2$, preventing complete chelation and causing premature end points.

### 2.4 Role of Eriochrome Black T (EBT) Indicator & Color Transition
EBT is an azo-dye metallochromic indicator that acts as an acid-base indicator as well as a metal complexing agent:
1. **Initial Addition (Flask preparation)**:
   At $\text{pH } 10$, free uncomplexed EBT is blue ($H\text{In}^{2-}$). When added to water containing $\text{Ca}^{2+}$ and $\text{Mg}^{2+}$, a small fraction of metal ions binds with EBT to form a relatively weak, **wine-red chelate complex**:
   
   $$\text{M}^{2+} + H\text{In}^{2-} \text{ (Blue)} \rightleftharpoons [\text{M-In}]^+ \text{ (Wine-Red)} + \text{H}^+$$

2. **During Titration (Adding EDTA from Burette)**:
   Added EDTA first chelates all free, uncomplexed $\text{Ca}^{2+}$ and $\text{Mg}^{2+}$ ions in solution because $[\text{M-EDTA}]^{2-}$ is thermodynamically much more stable than $[\text{M-In}]^+$. The solution remains wine-red during this phase.

3. **Near the Equivalence Point**:
   Transient purple swirls appear as local concentrations of EDTA temporarily displace indicator molecules before flask swirling redistributes them.

4. **At the Sharp Stoichiometric Endpoint**:
   Once all free metal ions are chelated, the next tiny drop of EDTA extracts the metal ions directly from the weak wine-red $[\text{M-In}]^+$ complex:
   
   $$[\text{M-In}]^+ \text{ (Wine-Red)} + [\text{EDTA}]^{4-} \rightarrow [\text{M-EDTA}]^{2-} \text{ (Colorless)} + H\text{In}^{2-} \text{ (Pure Sky-Blue)}$$

   The liberation of free indicator causes an instantaneous, permanent color transition from **wine-red to pure sky-blue** without any residual reddish tint.

---

## 3. Apparatus & Interface Layout

The simulation strictly preserves the responsive layout of `updatedTemplateMechanical`:

```
+----------------------------------------------------------------------------------------------------+
|                                    SOLVE HEADER (Logo & Title)                                     |
+----------------------------------------------------------------------+-----------------------------+
|                                SIMULATION-MAIN (80%)                  |         TABLE (20%)         |
| +--------------------------------------+---------------------------+ | +-------------------------+ |
| |        SIMULATION CANVAS (70%)       |    VAR-CONTROLS (30%)     | | |         RESULTS         | |
| |                                      | +-----------------------+ | | | +---------------------+ | |
| | - Burette assembly on stand with     | |      VARIABLES        | | | | | [P1:Std][P2:Hard][All]| | |
| |   calibrated 0-50 mL graduations     | | - Water Preset (A-D)  | | | | +---------------------+ | |
| | - Rotatable Stopcock & tip           | | - CaCO3 Vol (mL)      | | | | - Phase 1 Table (Std) | | |
| | - Conical Flask on contrast tile     | | - Sample Vol (mL)     | | | | - Phase 2 Table (Hard)| | |
| | - Reagent Beakers (Buffer/Ind/Sample)| | - EDTA Molarity (M)   | | | | - Phase 1 Calc Card   | | |
| | - Eye-level Meniscus Magnifier Lens  | | - Flow Rate (mL/s)    | | | | - Phase 2 Calc Card   | | |
| | - Real-time HUD (Reading/Titre/Color)| +-----------------------+ | | | - Results Summary Box | | |
| | - Top Guidance Banner (Active Step)  | |       CONTROLS        | | | | - BIS Drinking Limit  | | |
| |                                      | | - 1. Fill Burette     | | | |   Inference &         | | |
| |                                      | | - 2. Pipette Sol.     | | | |   Compliance Box      | | |
| |                                      | | - 3. Add Buffer       | | | | +---------------------+ | |
| |                                      | | - 4. Add Indicator    | | | +-------------------------+ |
| |                                      | | - 5. Place Flask      | |                               |
| |                                      | | - 💧 Open Stopcock    | |                               |
| |                                      | | - 🌀 Swirl Flask      | |                               |
| |                                      | | - 📝 Record Reading   | |                               |
| |                                      | | - 🔁 Start Next Trial | |                               |
| |                                      | | - ↺ Reset Trial       | |                               |
| |                                      | +-----------------------+ | |                             |
| +--------------------------------------+---------------------------+ |                             |
+----------------------------------------------------------------------+-----------------------------+
|                                FOOTER (Mobile Navigation & NITK Copy)                              |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. How to Test the Simulation (Step-by-Step Laboratory Walkthrough)

### Phase 1: Standardization of EDTA Solution
Because disodium EDTA is a secondary standard that may absorb atmospheric moisture, its exact concentration must first be verified against a primary standard $\text{CaCO}_3$ solution ($1.000\text{ mg/mL}$).

| Step | Control Button | Lab Action & Simulation Response | Expected Indicator/Apparatus State |
| :---: | :--- | :--- | :--- |
| **1** | `1. Fill Burette` | Fills the 50 mL burette with EDTA using the funnel up to the $0.00\text{ mL}$ line. | Burette liquid level rises to 0.00 mL. Meniscus magnifier reads `0.00 mL`. |
| **2** | `2. Pipette Sol.` | Pipettes $10.0\text{ mL}$ of standard $0.01\text{ M }\text{CaCO}_3$ solution into the conical flask. | Flask receives 10 mL colorless standard solution. |
| **3** | `3. Add Buffer` | Dispenses $1.0\text{ mL}$ Ammonia buffer ($\text{NH}_4\text{Cl} + \text{NH}_4\text{OH}$) into the flask to stabilize $\text{pH } 10$. | Alkaline medium established for chelation. |
| **4** | `4. Add Indicator`| Adds 3–4 drops of Eriochrome Black T (EBT) indicator. | Solution turns distinct **Wine-Red** ($[\text{Ca-EBT}]^+$ complex). |
| **5** | `5. Place Flask` | Transfers conical flask from bench onto the white porcelain tile beneath the burette tip. | Flask moves directly beneath the burette stopcock. |
| **6** | `💧 Open Stopcock` & `🌀 Swirl Flask` | Liquid titrant flows into the flask. Swirling ensures homogeneous reaction kinetics. As titre reaches $\sim 9.5\text{ mL}$, purple swirls emerge. At $\sim 10.00\text{ mL}$, solution instantly snaps to **Clear Sky-Blue**. Click `🛑 Close Stopcock`! | Meniscus shows $\sim 10.00\text{ mL}$. Flask solution is pure blue. Endpoint reached. |
| **7** | `📝 Record Reading` | Captures Initial, Final, and Consumed EDTA volume into the Phase 1 Observation Table. | Row added to table with status (Pilot/Accurate). |
| **8** | `🔁 Start Next Trial` | Resets apparatus for Trial 2 to obtain concordant readings ($\Delta \le 0.10\text{ mL}$). | After Trial 2, concordant titre ($10.00\text{ mL}$) is established and highlighted in green. |
| **Verify** | `Check` & `Steps` | In the Phase 1 Calculation card, enter the derived $\text{CaCO}_3$ equivalent (e.g. `1.000`) and click **Check**. Click **Steps** to review full mathematical steps. | Instant feedback confirms calculation accuracy. |

---

### Phase 2: Determination of Water Sample Total Hardness
Once the EDTA factor is established, proceed to test the unknown water sample:

| Step | Action | Description & Observations |
| :---: | :--- | :--- |
| **Switch** | Click `PROCEED TO PHASE 2 (WATER HARDNESS) ➜` | Shifts simulation to water sample analysis. Results panel automatically flips to the `Phase 2: Hardness` tab. |
| **Preset** | Choose Water Preset in Variables | Select Sample A, B, C, or D (defaults to Hard Tap Water $\sim 240\text{ mg/L}$). |
| **1** | Click `1. Fill Burette` | Refills burette to $0.00\text{ mL}$ with standardized EDTA. |
| **2** | Click `2. Pipette Sol.` | Pipettes $100.0\text{ mL}$ of the water sample into the flask. |
| **3** | Click `3. Add Buffer` | Adds $1.0\text{ mL}$ Ammonia Buffer ($\text{pH } 10$). |
| **4** | Click `4. Add Indicator` | Adds 3–4 drops EBT; turns wine-red due to dissolved $\text{Ca}^{2+}$ and $\text{Mg}^{2+}$ ions. |
| **5** | Click `5. Place Flask` | Positions flask under burette tip on contrast tile. |
| **6** | Click `💧 Open Stopcock` & `🌀 Swirl Flask` | Titrate carefully. For Sample C ($\sim 240\text{ mg/L}$), equivalence point is reached at **$24.00\text{ mL}$** where wine-red turns permanent pure blue. Close stopcock immediately! |
| **7** | Click `📝 Record Reading` | Logs Trial 1 into the Phase 2 Observation Table. |
| **8** | Click `🔁 Start Next Trial` | Perform Trial 2 to confirm concordancy ($\le 0.10\text{ mL}$). |
| **Results** | Observe Summary & BIS Box | Total Hardness ($240.0\text{ mg/L}$), water classification (**Hard Water**), and BIS Drinking Limit compliance are displayed. |

---

## 5. Variables & Controls Guide (What Values to Set)

### Variables Panel

| Variable Control | HTML Element ID | Default Value | Valid Range | Scientific Meaning & Impact |
| :--- | :--- | :---: | :---: | :--- |
| **Water Sample Preset** | `#varSamplePreset` | `Sample C (240 mg/L)` | Preset Options | Selects the water source: <br>• **Sample A**: Soft water ($\sim 75\text{ mg/L}$)<br>• **Sample B**: Moderately hard water ($\sim 160\text{ mg/L}$)<br>• **Sample C**: Hard municipal tap water ($\sim 240\text{ mg/L}$)<br>• **Sample D**: Borewell groundwater ($\sim 450\text{ mg/L}$) |
| **$\text{CaCO}_3$ Volume** | `#varStdVolume` | `10 mL` | $5 - 25\text{ mL}$ | Aliquot of primary standard $0.01\text{ M }\text{CaCO}_3$ solution taken in Phase 1. Determines expected standardization titre. |
| **Sample Volume** | `#varSampleVolume` | `100 mL` | $25 - 200\text{ mL}$ | Volume of water sample taken in Phase 2 ($V_{sample}$). Used in the denominator of hardness formula. |
| **EDTA Molarity** | `#varEdtaMolarity` | `0.010 M` | $0.005 - 0.050\text{ M}$ | Nominal concentration of EDTA titrant in burette. |
| **Flow Rate** | `#varFlowRate` | `0.6 mL/s` | $0.15 - 1.5\text{ mL/s}$ | Titration dispensing speed: <br>• `0.15 mL/s`: Dropwise (recommended near endpoint)<br>• `0.60 mL/s`: Medium (smooth continuous flow)<br>• `1.50 mL/s`: Fast (rapid initial addition) |

### Controls Panel (Sequential State Management)
All buttons follow strict sequential laboratory logic. Steps cannot be skipped out of order:
- **`1. Fill Burette`**: Active only in Step 1.
- **`2. Pipette Sol.`**: Active only in Step 2.
- **`3. Add Buffer`**: Active only in Step 3.
- **`4. Add Indicator`**: Active only in Step 4.
- **`5. Place Flask`**: Active only in Step 5.
- **`💧 Open Stopcock`**: Toggles between Open and Closed during Step 6.
- **`🌀 Swirl Flask`**: Active during Step 6 to blend titrant.
- **`📝 Record Reading`**: Active once endpoint color change is observed or titrant has been dispensed.
- **`🔁 Start Next Trial`**: Active after recording a reading to repeat the trial for concordancy.
- **`↺ Reset Trial`**: Resets the current trial if an error occurs.
- **`PROCEED TO PHASE 2`**: Switches between Phase 1 (Standardization) and Phase 2 (Water Sample).

---

## 6. What Appears in Observation Tables & Calculations

### Observation Tables
Each recorded trial creates an entry in the respective observation table:

#### Phase 1: Standardization of EDTA (10 mL Standard $\text{CaCO}_3$)
| Trial | Sample Vol ($V_1$, mL) | Initial Reading ($R_1$, mL) | Final Reading ($R_2$, mL) | EDTA Consumed ($V_2$, mL) | Endpoint Observation | Status |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | 10.0 | 0.00 | 10.00 | 10.00 | Clear Blue Endpoint (Pilot) | `Rough` |
| 2 | 10.0 | 0.00 | 10.00 | 10.00 | Sharp Wine-Red to Blue | `Concordant` |

*Note: When two consecutive trials agree within $\le 0.10\text{ mL}$, the concordant row is highlighted in green with a `Concordant` badge.*

#### Phase 2: Water Sample Titration (100 mL Sample)
| Water Preset | Sample Vol ($V_{sample}$, mL) | Initial Reading ($R_1$, mL) | Final Reading ($R_2$, mL) | EDTA Consumed ($V_{EDTA}$, mL) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sample A (Soft)** | 100.0 | 0.00 | 7.50 | 7.50 | `Concordant` |
| **Sample B (Moderate)** | 100.0 | 0.00 | 16.00 | 16.00 | `Concordant` |
| **Sample C (Hard Tap)** | 100.0 | 0.00 | 24.00 | 24.00 | `Concordant` |
| **Sample D (Borewell)** | 100.0 | 0.00 | 45.00 | 45.00 | `Concordant` |

---

## 7. Mathematical Calculations & Formulas

### Formula 1: Standardization & $\text{CaCO}_3$ Equivalent Factor (Phase 1)
$1.0\text{ g}$ of pure $\text{CaCO}_3$ dissolved and made up to $1000\text{ mL}$ yields a standard solution where $1.0\text{ mL} = 1.0\text{ mg of CaCO}_3$.
When an aliquot ($V_{std} = 10.0\text{ mL}$) containing $10.0\text{ mg of CaCO}_3$ is titrated with EDTA:

$$\text{CaCO}_3\text{ Equivalent of 1 mL EDTA (mg/mL)} = \frac{\text{Mass of CaCO}_3\text{ present (mg)}}{V_{titre}\text{ (mL)}} = \frac{10.0\text{ mg}}{10.00\text{ mL}} = \mathbf{1.0000\text{ mg/mL}}$$

$$\text{Actual Molarity of EDTA } (M_2) = \frac{M_1 \times V_1}{V_2} = \frac{0.01\text{ M} \times 10.0\text{ mL}}{10.00\text{ mL}} = \mathbf{0.01000\text{ M}}$$

---

### Formula 2: Total Hardness of Water Sample (Phase 2)
Given:
- $V_{EDTA}$ = Concordant volume of standardized EDTA consumed by water sample ($\text{mL}$)
- $\text{Factor}$ = $\text{CaCO}_3$ equivalent of $1\text{ mL}$ EDTA ($1.0000\text{ mg/mL}$)
- $V_{sample}$ = Volume of water sample taken ($100.0\text{ mL}$)
- Multiplier $1000$ = Conversion from $\text{mL}$ to $\text{L}$ ($1000\text{ mL/L}$)

$$\text{Total Hardness (mg/L as CaCO}_3) = \frac{V_{EDTA}\text{ (mL)} \times \text{Factor (mg/mL)} \times 1000\text{ mL/L}}{V_{sample}\text{ (mL)}}$$

#### Worked Examples for Presets:
1. **Sample A (Soft Water)**:
   $$\text{Hardness} = \frac{7.50\text{ mL} \times 1.0000\text{ mg/mL} \times 1000}{100.0\text{ mL}} = \mathbf{75.0\text{ mg/L as CaCO}_3}$$

2. **Sample B (Moderately Hard Water)**:
   $$\text{Hardness} = \frac{16.00\text{ mL} \times 1.0000\text{ mg/mL} \times 1000}{100.0\text{ mL}} = \mathbf{160.0\text{ mg/L as CaCO}_3}$$

3. **Sample C (Hard Tap Water)**:
   $$\text{Hardness} = \frac{24.00\text{ mL} \times 1.0000\text{ mg/mL} \times 1000}{100.0\text{ mL}} = \mathbf{240.0\text{ mg/L as CaCO}_3}$$

4. **Sample D (Borewell Groundwater)**:
   $$\text{Hardness} = \frac{45.00\text{ mL} \times 1.0000\text{ mg/mL} \times 1000}{100.0\text{ mL}} = \mathbf{450.0\text{ mg/L as CaCO}_3}$$

---

## 8. Water Quality Standards & Bureau of Indian Standards (BIS)

### 8.1 Hardness Classification Scale (USGS / WHO / IS 3025)
| Hardness Range ($\text{mg/L as CaCO}_3$) | Classification | Characteristics & Effects |
| :---: | :---: | :--- |
| **$0 - 75$** | **Soft** | Readily lathers with soap; non-scaling. Extremely soft water may be slightly corrosive to metal pipes. |
| **$75 - 150$** | **Moderately Hard** | Good domestic water; moderate soap lathering; minimal pipe scaling. |
| **$150 - 300$** | **Hard** | Requires extra soap; forms white curds (calcium stearate); mild scaling in geysers, boilers, and kettles. |
| **$> 300$** | **Very Hard** | Severe boiler scaling, encrustation of water supply lines; unpleasant taste; softening recommended. |

---

### 8.2 BIS Drinking Water Specification (IS 10500:2012)
Under Indian Standard **IS 10500:2012 (Drinking Water - Specification)**:
- **Acceptable Limit**: **$200\text{ mg/L}$**
  - Desirable for domestic consumption. Does not impair taste or produce excessive soap curds.
- **Permissible Limit in the Absence of Alternate Source**: **$600\text{ mg/L}$**
  - Water with hardness up to $600\text{ mg/L}$ may be consumed without acute health risk only when no cleaner source is available. Hardness beyond $600\text{ mg/L}$ causes gastrointestinal distress, encrustation of domestic plumbing, and is legally rejected for drinking.

#### The BIS Inference Box in the Simulation
The interactive card asks:
> **Statement:** The acceptable limit of total hardness in drinking water is **200 mg/L**, and the permissible limit in the absence of an alternate source is **600 mg/L**.  
> **Is this statement: [ True ] / [ False ]**

- Select **True** and click **Submit**.
- The system confirms with verified regulatory citations from **IS 10500:2012 / IS 3025 (Part 21)**.
- Once Phase 2 titration concludes, the card automatically generates a live **Sample Compliance Summary**:
  - *Sample A ($75\text{ mg/L}$)*: Within Acceptable Limit ($\le 200\text{ mg/L}$) — Safe for drinking.
  - *Sample B ($160\text{ mg/L}$)*: Within Acceptable Limit ($\le 200\text{ mg/L}$) — Safe for drinking.
  - *Sample C ($240\text{ mg/L}$)*: Exceeds Acceptable Limit ($200\text{ mg/L}$), but within Permissible Limit ($\le 600\text{ mg/L}$) — Permissible only if alternative source is unavailable.
  - *Sample D ($450\text{ mg/L}$)*: Exceeds Acceptable Limit ($200\text{ mg/L}$), but within Permissible Limit ($\le 600\text{ mg/L}$) — Causes severe scaling; softening recommended.

---

## 9. Responsiveness & Cross-Device Compatibility

The simulation adapts smoothly across all viewport resolutions:

### 1. Desktop Displays ($\ge 1550\text{px}$ & $1050\text{px} - 1550\text{px}$)
- Two-column master grid (`80%` left for simulation and controls, `20%` right for results table).
- The `.table` container is pinned to a clean viewport height (`max-height: 85vh`) with `overflow: hidden`.
- The inner `.results-section` has its own smooth scrollbar (`overflow-y: auto`) with zero protrusion or clipping.
- The tab bar (`Phase 1: Std`, `Phase 2: Hardness`, `All Results`) allows immediate toggle between views without visual clutter.

### 2. Tablet Displays ($768\text{px} - 1050\text{px}$)
- Main grid smoothly stacks vertically.
- Action buttons in `.controls` remain **100% visible and interactive** (overriding the template's mechanical `display: none` rule).
- Canvas scales dynamically to maintain calibrated 2D orthographic perspective.

### 3. Mobile Displays ($< 768\text{px}$)
- Apparatus viewport adjusts to $300\text{px}$ height with auto-aspect ratio camera recalculation.
- Eye-level Meniscus Magnifier lens compacts to $100\text{px} \times 95\text{px}$ in the top right.
- Sticky footer provides one-tap smooth scrolling:
  - `Simulation` $\rightarrow$ Scrolls to canvas.
  - `Variables` $\rightarrow$ Scrolls to variables and action buttons.
  - `Result` $\rightarrow$ Scrolls to observation table and calculations.

---

## 10. Summary Checklist for Students
1. [x] Standardize EDTA against $10\text{ mL}$ of $0.01\text{ M }\text{CaCO}_3$ standard solution at $\text{pH } 10$ using EBT indicator.
2. [x] Swirl until wine-red turns sharp sky-blue at $10.00\text{ mL}$.
3. [x] Verify that $\text{CaCO}_3\text{ Equivalent Factor} = 1.0000\text{ mg/mL}$.
4. [x] Proceed to Phase 2 and titrate $100\text{ mL}$ water sample.
5. [x] Record readings and obtain concordant results ($\le 0.10\text{ mL}$).
6. [x] Calculate Total Hardness: $\text{Hardness} = \frac{V_{EDTA} \times \text{Factor} \times 1000}{V_{sample}}$.
7. [x] Check calculated value using the in-app interactive step checker.
8. [x] Answer the BIS Drinking Limit statement and review water compliance according to **IS 10500:2012**.
