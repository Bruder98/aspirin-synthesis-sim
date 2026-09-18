# E2E Test Infra: Acetylsalicylic Acid (Aspirin) Synthesis Simulation

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: The end-to-end (E2E) test suite is strictly derived from the requirements specified in `ORIGINAL_REQUEST.md` (2026-09-10T11:46:35Z) and the interface contracts defined in `PROJECT.md`.
- **Zero Coupling to Internal Implementation Details**: Tests evaluate observable state transitions, chemical thermodynamics, stoichiometry algorithms, failure branching logic, and pedagogical content without asserting on private internal functions or ephemeral component layouts.
- **Progressive Testability**: Structured to run seamlessly under Vitest (`npx vitest run tests/e2e` or `npm test`). The test runner includes an authoritative scientific oracle reflecting the physical chemistry formulas (Classical Nucleation Theory, Arrhenius kinetics, Jouyban-Acree co-solvent model, and stoichiometry balances) so tests remain verifiable across scaffolding and milestone completions.
- **Verification Methodology**:
  - **Tier 1**: Feature Coverage (>=5 test cases per feature for F01 through F20).
  - **Tier 2**: Boundary Value Analysis & Numerical Stress (zero inputs, negative inputs, extreme temperatures, overflow, stoichiometry edge cases, NaN handling).
  - **Tier 3**: Cross-Feature Combinations & State Persistence (state transitions, failure mode propagation, live recalculation across HUD/telemetry).
  - **Tier 4**: Real-World Pedagogical & Experimental Workloads (student lab journeys, failure diagnosis and recovery, advanced stoichiometry exploration).

---

## Feature Inventory & Test Distribution Matrix

| # | Feature Code | Feature Description | Milestone | Source Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Workload) |
|:--|:-------------|:--------------------|:---------:|:-------------------|:----------------:|:-----------------:|:--------------:|:-----------------:|
| 1 | **F01** | 6-Stage Reaction Lifecycle State Machine | M1 | ORIGINAL_REQUEST R1/R2 | 6 | 2 | 2 | 2 |
| 2 | **F02** | Esterification Kinetics & Intermediates | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 1 | 1 |
| 3 | **F03** | Co-Solvent Thermodynamics & Metastable Zone | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 2 | 1 |
| 4 | **F04** | Antisolvent Shock & Dielectric Surge | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 2 | 1 |
| 5 | **F05** | CNT Nucleation Barrier Collapse & Burst | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 1 | 1 |
| 6 | **F06** | Anhydride Exothermic Quenching | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 1 | 1 |
| 7 | **F07** | Early Water Contamination Failure | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 2 | 2 |
| 8 | **F08** | Thermal Overheating (>85°C) Failure | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 2 | 2 |
| 9 | **F09** | Lukewarm Wash Loss Failure | M1 | ORIGINAL_REQUEST R2 | 5 | 2 | 2 | 2 |
| 10 | **F10** | Stoichiometry & Limiting Reagent Engine | M1 | ORIGINAL_REQUEST R4 | 5 | 3 | 2 | 2 |
| 11 | **F11** | Theoretical & Actual Yield Calculations | M1 | ORIGINAL_REQUEST R4 | 5 | 3 | 2 | 2 |
| 12 | **F12** | 8-Tier Diagnostic Feedback Rubric | M1 | ORIGINAL_REQUEST R4 | 6 | 2 | 2 | 2 |
| 13 | **F13** | Macro Lab Apparatus 2D Canvas/SVG View | M2 | ORIGINAL_REQUEST R1 | 5 | 1 | 1 | 1 |
| 14 | **F14** | Micro 3D Molecular Three.js Viewport | M2 | ORIGINAL_REQUEST R1 | 5 | 1 | 1 | 1 |
| 15 | **F15** | Dual-View 1:1 Stage Synchronization Engine | M2 | ORIGINAL_REQUEST R1 | 5 | 1 | 2 | 1 |
| 16 | **F16** | Interactive 3D OrbitControls & Fallbacks | M2 | ORIGINAL_REQUEST R1 | 5 | 2 | 1 | 1 |
| 17 | **F17** | 6-Stage ELI5 Real-Life Metaphor Cards | M3 | ORIGINAL_REQUEST R3 | 5 | 1 | 1 | 1 |
| 18 | **F18** | 6-Stage Academic Deep-Dive LaTeX Cards | M3 | ORIGINAL_REQUEST R3 | 5 | 1 | 1 | 1 |
| 19 | **F19** | Interactive Yield Calculator Modal & Controls | M3 | ORIGINAL_REQUEST R4 | 5 | 2 | 2 | 2 |
| 20 | **F20** | Dark Laboratory HUD Layout & Stitch System | M4 | ORIGINAL_REQUEST R5 | 5 | 1 | 2 | 1 |
| **Total** | **20 Features** | | | | **104** | **37** | **32** | **28** |

**Total Comprehensive Test Target:** **200+ Test Assertions across 4 Dedicated Suites**

---

## Test Architecture & Runner Specification

### Directory Layout
```
aspirin-synthesis-sim/
├── TEST_INFRA.md                          # Test philosophy & feature inventory mapping
├── TEST_READY.md                          # Test suite execution status & pass counts
└── tests/
    └── e2e/
        ├── testRunner.ts                  # Authoritative scientific oracle, types & store fixtures
        ├── tier1_feature.test.ts          # Tier 1: 104+ test cases for F01 to F20
        ├── tier2_boundary.test.ts         # Tier 2: Boundary conditions, NaN defense, zero/negatives
        ├── tier3_interaction.test.ts      # Tier 3: Cross-feature combinations & failure cascades
        └── tier4_workload.test.ts         # Tier 4: Real-world student & researcher E2E workloads
```

### Test Invocation Commands
- Primary Command: `npx vitest run tests/e2e`
- Project Script: `npm test`
- Single Suite Target: `npx vitest run tests/e2e/tier1_feature.test.ts`
- Type Verification: `npx tsc --noEmit`

---

## Tier Breakdown & Execution Strategy

### Tier 1: Feature Coverage (`tier1_feature.test.ts`)
- Focus: Verifies each of the 20 features (F01 to F20) in isolation.
- Requirements: At least 5 independent test cases per feature (104 tests total).
- Validation: Verifies state machine transitions, Arrhenius kinetics, co-solvent vs antisolvent parameters, Classical Nucleation Theory barrier collapse, exothermic quenching enthalpy, failure mode branches, stoichiometry equations, 8-tier diagnostic rubric, macro/micro apparatus contracts, pedagogy cards, and HUD styling tokens.

### Tier 2: Boundary & Corner Cases (`tier2_boundary.test.ts`)
- Focus: Mathematical extremes, zero/negative inputs, floating-point stability, and physical limits.
- Edge Conditions Tested:
  - Zero/negative mass of salicylic acid or volume of acetic anhydride.
  - Excess reagents inversion (SA limiting vs AA limiting).
  - Extreme supersaturation $S \le 1.0$ (avoiding $\ln(S) \le 0$ or division by zero in CNT equation).
  - Extreme temperature in Arrhenius rate ($T \to 0\text{ K}$, $T > 100^\circ\text{C}$).
  - Actual yield $> 100\%$ (wet cake moisture detection) and $> 500\%$ (anomalous data).
  - Division by zero protection and NaN resistance in stoichiometry and thermodynamic models.

### Tier 3: Cross-Feature Combinations (`tier3_interaction.test.ts`)
- Focus: Pairwise interactions between features and state transitions across lifecycle steps.
- Key Interaction Areas:
  - Stage transitions preserving user-configured stoichiometry parameters.
  - Failure branch activation (`EARLY_WATER`, `OVERHEATING`, `WARM_WASH`) altering thermodynamic parameters and visual state across subsequent stages.
  - Dynamic updates in Yield Calculator immediately synchronizing telemetry and diagnostic feedback.
  - Resetting simulation cleanly clearing failure modes, restoring Stage 1, and resetting thermodynamic states.
  - Play/pause state persistence during step navigation.

### Tier 4: Real-World Application Scenarios (`tier4_workload.test.ts`)
- Focus: Complete end-to-end user workflows matching classroom and research scenarios.
- Scenarios:
  - **Workload 1: Ideal Undergraduate Laboratory Journey (Golden Path)** — Student inputs $2.00\text{ g}$ SA and $5.00\text{ mL}$ AA, heats at 80°C, chills to 4°C, shocks with chilled water, filters and recovers $2.20\text{ g}$ dry crystals ($84.3\%$ yield with exemplary feedback).
  - **Workload 2: Early Water Blunder & Diagnostic Recovery** — Student contaminates glassware with water, observes 0% yield with positive purple $FeCl_3$ test, reviews diagnostic root-cause explanation, resets, and successfully synthesizes aspirin.
  - **Workload 3: Thermal Overheating Investigation** — Student heats water bath to 95°C, observes caramelization/tar formation, learns the self-condensation mechanism from the deep-dive card, and adjusts bath temperature to 80°C.
  - **Workload 4: Lukewarm Wash Deficit Analysis** — Student completes synthesis but washes crystals with 35°C water, experiences high dissolution loss ($<35\%$ yield), and analyzes the temperature-dependent solubility curve in the feedback report.
  - **Workload 5: Advanced Stoichiometric Optimization** — Student investigates the effect of varying acetic anhydride volume from deficit ($0.5\text{ mL}$) to large excess ($15.0\text{ mL}$), evaluating limiting reagent crossover and quenching heat release.
