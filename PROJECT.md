# Project: Aspirin Synthesis Simulation Web Application

## Architecture
Decoupled 3-layer architecture for high maintainability, testability, and 60fps rendering:
1. **Pure Domain Engines (`src/engine/`)**:
   - `reactionKinetics.ts`: Esterification state machine, Arrhenius rate constants, intermediate transformations (Salicylic acid + Acetic anhydride + H3PO4 -> Oxonium ion -> Tetrahedral intermediate -> Acetylsalicylic acid + Acetic acid).
   - `thermodynamics.ts`: Jouyban-Acree co-solvent model, dielectric permittivity jump ($\epsilon_r \approx 6.2 \to 80$), Classical Nucleation Theory (CNT) barrier collapse ($\Delta G^* \propto \frac{\gamma^3}{(k_BT \ln S)^2}$), metastable zone in ice bath vs antisolvent crystal burst, exothermic quenching.
   - `stoichiometryEngine.ts`: Moles, limiting reagent, theoretical yield ($g$), percent yield ($\%$), and 8-tier diagnostic error feedback rubric.
   - `failureModes.ts`: Logic and state transitions for early water contamination, thermal overheating (>85°C), and lukewarm wash loss.
   - `molecularData.ts`: 3D atom coordinates (CPK color standard, covalent bonds, solvation shell, crystal lattice assembly).
2. **State Management (`src/store/`)**:
   - `useAspirinStore.ts`: Zustand store managing 6-stage lifecycle, active failure branch, stoichiometry parameters, animation play/pause, step progress, and camera/display settings.
3. **Presentation & Viewport Layer (`src/components/`)**:
   - `MacroApparatusView.tsx`: 2D Canvas/SVG lab equipment renderer running seamless looped animation for each stage (reagent addition, warm water bath heating, ice bath chilling, antisolvent water injection with rapid crystal burst, vacuum filtration).
   - `MicroMolecularView.tsx`: Three.js 3D viewport rendering molecular kinetics, intermediate bonds, solvation shell in acetic acid, and crystal lattice assembly with interactive mouse OrbitControls.
   - `DualViewportContainer.tsx`: Split-screen container coordinating 1:1 macro/micro animation timing.
   - `Eli5PedagogyCard.tsx`: Intuitive real-life visual analogies.
   - `AcademicDeepDiveCard.tsx`: Rigorous KaTeX LaTeX formulas and thermodynamic graphs.
   - `YieldCalculatorModal.tsx`: Stoichiometry calculator activity with interactive mass/volume sliders, actual yield input, and diagnostic feedback.
   - `FailureScenarioControl.tsx`: Interactive trigger buttons for the 3 failure branches with root-cause analysis modal.
   - `Header.tsx` & `StageTimeline.tsx`: Navigation bar and interactive 6-step progress stepper.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | 6-Stage Reaction Lifecycle State Machine | Reagents -> Water bath heating -> Ice bath cooling -> Water antisolvent -> Maturation -> Filtration | M1 | ORIGINAL_REQUEST R1/R2 |
| F02 | Esterification Kinetics & Intermediates | Protonated oxonium ion, tetrahedral intermediate, Arrhenius rate modeling | M1 | ORIGINAL_REQUEST R2 |
| F03 | Co-Solvent Thermodynamics & Metastable Zone | Acetic acid co-solvent ($\epsilon_r \approx 6.2$), high solubility $C^*$, clear liquid at 0-4°C, no crystals | M1 | ORIGINAL_REQUEST R2 |
| F04 | Antisolvent Shock & Dielectric Surge | Water addition ($\epsilon_r \approx 80$), exponential drop in $C^*$, supersaturation $S \gg 1$ spike | M1 | ORIGINAL_REQUEST R2 |
| F05 | CNT Nucleation Barrier Collapse & Burst | $\Delta G^* \propto \frac{\gamma^3}{(k_BT \ln S)^2}$ 460-fold collapse, spinodal decomposition needle burst | M1 | ORIGINAL_REQUEST R2 |
| F06 | Anhydride Exothermic Quenching | Hydrolysis of residual anhydride ($+ H_2O \to 2\text{ AcOH}$, $\Delta H = -56.5\text{ kJ/mol}$) | M1 | ORIGINAL_REQUEST R2 |
| F07 | Early Water Contamination Failure | Pre-hydrolysis of anhydride to acetic acid, 0% aspirin yield, $FeCl_3$ violet positive | M1 | ORIGINAL_REQUEST R2 |
| F08 | Thermal Overheating (>85°C) Failure | Self-condensation of salicylic acid, decarboxylation, dark tar formation | M1 | ORIGINAL_REQUEST R2 |
| F09 | Lukewarm Wash Loss Failure | Temperature-dependent dissolution loss of aspirin cake during filtration wash | M1 | ORIGINAL_REQUEST R2 |
| F10 | Stoichiometry & Limiting Reagent Engine | Accurate molar masses (SA: 138.12, AA: 102.09, $\rho=1.082$, ASA: 180.16), limiting reagent determination | M1 | ORIGINAL_REQUEST R4 |
| F11 | Theoretical & Actual Yield Calculations | Exact theoretical yield in grams and percent yield based on measured dry mass | M1 | ORIGINAL_REQUEST R4 |
| F12 | 8-Tier Diagnostic Feedback Rubric | Context-aware pedagogical feedback on moisture, incomplete reaction, wash loss, etc. | M1 | ORIGINAL_REQUEST R4 |
| F13 | Macro Lab Apparatus 2D Canvas/SVG View | Animated glassware, heater, ice bath, water injection burst, and Buchner filter loop | M2 | ORIGINAL_REQUEST R1 |
| F14 | Micro 3D Molecular Three.js Viewport | Procedural 3D atoms/bonds, intermediate formation, solvation shell, crystal lattice | M2 | ORIGINAL_REQUEST R1 |
| F15 | Dual-View 1:1 Stage Synchronization Engine | Seamless infinite loop synchronized across macro and micro viewports per stage | M2 | ORIGINAL_REQUEST R1 |
| F16 | Interactive 3D OrbitControls & Fallbacks | Mouse rotation, zoom, pan, and graceful resizing without WebGL crashes | M2 | ORIGINAL_REQUEST R1 |
| F17 | 6-Stage ELI5 Real-Life Metaphor Cards | Intuitive analogies (e.g. aspirin hiding with acetic acid friends until water guard arrives) | M3 | ORIGINAL_REQUEST R3 |
| F18 | 6-Stage Academic Deep-Dive LaTeX Cards | Rigorous KaTeX formulas (oxonium, tetrahedral, dielectric jump, CNT $\Delta G^*$) | M3 | ORIGINAL_REQUEST R3 |
| F19 | Interactive Yield Calculator Modal & Controls | Sliders/inputs for mass & volume, live calculations, error analysis feedback display | M3 | ORIGINAL_REQUEST R4 |
| F20 | Dark Laboratory HUD Layout & Stitch System | Stitch-compatible dark slate palette, stage stepper, failure controls, responsive layout | M4 | ORIGINAL_REQUEST R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Scaffolding & Core Engine | Vite + React + TS + Tailwind setup, Vitest config, pure kinetics/thermodynamics/stoichiometry engines (F01–F12) | none | DONE (Passed Gate Iteration 2: 81/81 unit/stress tests, 143/143 E2E tests, clean build, auditor clean) |
| M2 | Synchronized Dual-View Viewports | Macro Canvas lab apparatus and Micro Three.js 3D molecular simulation running synchronized infinite loops (F13–F16) | M1 | DONE (Passed Gate Iteration 2: 115/115 unit/stress tests, 143/143 E2E tests, clean build, auditor CLEAN, 2 Reviewer APPROVE, 2 Challenger APPROVE) |
| M3 | Educational Pedagogy & Yield Calculator | ELI5 visual analogy cards, Academic KaTeX deep-dive cards, Interactive yield calculator modal (F17–F19) | M1 | DONE (Passed Gate: 180 unit/stress tests, 143/143 E2E tests, clean build, auditor CLEAN, 2 Reviewer APPROVE, 2 Challenger APPROVE) |
| M4 | Failure Branching, HUD Integration & Polish | Failure scenario controls & visual branches (F07–F09), Stitch dark lab theme, audio-visual feedback, full integration (F20) | M2, M3 | DONE (Passed Gate: 249 unit/stress tests, 143/143 E2E tests, clean build, auditor CLEAN, 2 Reviewer APPROVE, 2 Challenger APPROVE) |
| Final | 100% E2E Test Suite & Adversarial Hardening | Phase 1: Pass 100% E2E tests (Tiers 1-4). Phase 2: Adversarial coverage hardening (Tier 5) | M4, TEST_READY | IN_PROGRESS |

## Interface Contracts

### Domain Engine Contracts (`src/engine/types.ts`)
```typescript
export type SynthesisStageId = 1 | 2 | 3 | 4 | 5 | 6;

export type FailureMode = 'NONE' | 'EARLY_WATER' | 'OVERHEATING' | 'WARM_WASH';

export interface StoichiometryInputs {
  salicylicAcidMassG: number;     // e.g. 2.00 g
  aceticAnhydrideVolMl: number;   // e.g. 5.00 mL
  actualYieldG?: number;          // user measured dry aspirin mass
}

export interface StoichiometryResult {
  salicylicAcidMoles: number;
  aceticAnhydrideMoles: number;
  limitingReagent: 'SALICYLIC_ACID' | 'ACETIC_ANHYDRIDE';
  limitingReagentMoles: number;
  theoreticalYieldG: number;
  actualYieldG?: number;
  percentYield?: number;
  diagnosticFeedback?: string;
  feedbackCategory?: 'EXCELLENT' | 'HIGH_MOISTURE' | 'PARTIAL_CONVERSION' | 'WASH_LOSS' | 'CRITICAL_ERROR';
}

export interface ThermodynamicState {
  stageId: SynthesisStageId;
  temperatureC: number;
  dielectricConstant: number;     // ~6.2 in AcOH -> ~80 in H2O
  solubilityGPer100Ml: number;    // C*
  supersaturation: number;        // S = C / C*
  cntBarrierJoules: number;       // Delta G*
  relativeBarrierRatio: number;   // normalized to stage 3
  isMetastable: boolean;          // true in stage 3 (ice bath before water)
  isPrecipitating: boolean;       // true in stage 4-5
}
```

### Zustand Store Contract (`src/store/useAspirinStore.ts`)
```typescript
export interface AspirinStoreState {
  currentStage: SynthesisStageId;
  failureMode: FailureMode;
  isPlaying: boolean;
  stageProgress: number;          // 0.0 to 1.0 within active loop
  stoichiometryInputs: StoichiometryInputs;
  stoichiometryResult: StoichiometryResult;
  thermodynamics: ThermodynamicState;
  
  // Actions
  setStage: (stage: SynthesisStageId) => void;
  nextStage: () => void;
  prevStage: () => void;
  setFailureMode: (mode: FailureMode) => void;
  resetSimulation: () => void;
  setPlaying: (playing: boolean) => void;
  updateStoichiometry: (inputs: Partial<StoichiometryInputs>) => void;
}
```

## Code Layout
```
aspirin-synthesis-sim/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── engine/
│   │   ├── types.ts
│   │   ├── reactionKinetics.ts
│   │   ├── thermodynamics.ts
│   │   ├── stoichiometryEngine.ts
│   │   ├── failureModes.ts
│   │   └── molecularData.ts
│   ├── store/
│   │   └── useAspirinStore.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── StageTimeline.tsx
│   │   │   └── Footer.tsx
│   │   ├── viewport/
│   │   │   ├── DualViewportContainer.tsx
│   │   │   ├── MacroApparatusView.tsx
│   │   │   └── MicroMolecularView.tsx
│   │   ├── pedagogy/
│   │   │   ├── Eli5PedagogyCard.tsx
│   │   │   └── AcademicDeepDiveCard.tsx
│   │   ├── calculator/
│   │   │   └── YieldCalculatorModal.tsx
│   │   └── controls/
│   │       └── FailureScenarioControl.tsx
│   └── test/
│       ├── stoichiometryEngine.test.ts
│       ├── reactionKinetics.test.ts
│       ├── thermodynamics.test.ts
│       └── failureModes.test.ts
└── tests/
    └── e2e/
        ├── testRunner.ts
        ├── tier1_feature.test.ts
        ├── tier2_boundary.test.ts
        ├── tier3_interaction.test.ts
        └── tier4_workload.test.ts
```
