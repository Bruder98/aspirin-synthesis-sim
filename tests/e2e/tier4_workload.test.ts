import { describe, it, expect, beforeEach } from 'vitest';
import {
  createReferenceStore,
  calculateReferenceStoichiometry,
  calculateReferenceThermodynamics,
  calculateReferenceArrheniusRate,
  calculateReferenceCntBarrier,
  PHYSICAL_CONSTANTS,
  AspirinStoreState,
} from './testRunner';

describe('Tier 4: Real-World Pedagogical & Experimental Workloads', () => {
  let store: AspirinStoreState;

  beforeEach(() => {
    store = createReferenceStore();
  });

  // =========================================================================
  // Workload 1: Ideal Undergraduate Laboratory Journey (Golden Path)
  // =========================================================================
  it('Workload 1: completes end-to-end undergraduate golden path with 84.3% yield and exemplary feedback', () => {
    // 1. Stage 1: Reagents Dispensing
    expect(store.currentStage).toBe(1);
    store.updateStoichiometry({
      salicylicAcidMassG: 2.00,
      aceticAnhydrideVolMl: 5.00,
    });
    expect(store.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
    expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(2.6087, 2);

    // 2. Stage 2: Water Bath Heating at 80°C
    store.nextStage();
    expect(store.currentStage).toBe(2);
    expect(store.thermodynamics.temperatureC).toBe(80);
    const k80 = calculateReferenceArrheniusRate(80);
    expect(k80).toBeGreaterThan(0.075); // Fast esterification kinetics

    // 3. Stage 3: Ice Bath 1st Cooling (Metastable Zone)
    store.nextStage();
    expect(store.currentStage).toBe(3);
    expect(store.thermodynamics.temperatureC).toBe(4);
    expect(store.thermodynamics.dielectricConstant).toBeCloseTo(11.28, 1);
    expect(store.thermodynamics.isMetastable).toBe(true); // Liquid is 100% transparent!
    expect(store.thermodynamics.isPrecipitating).toBe(false);

    // 4. Stage 4: Antisolvent Distilled Water Addition
    store.nextStage();
    expect(store.currentStage).toBe(4);
    expect(store.thermodynamics.dielectricConstant).toBeGreaterThan(65); // Dielectric jump
    expect(store.thermodynamics.solubilityGPer100Ml).toBeLessThan(1.0); // Solubility collapse
    expect(store.thermodynamics.supersaturation).toBeGreaterThan(20); // Supersaturation spike
    expect(store.thermodynamics.isPrecipitating).toBe(true); // Explosive needle crystal burst!
    expect(store.thermodynamics.isMetastable).toBe(false);

    // 5. Stage 5: Crystal Maturation in Ice Bath
    store.nextStage();
    expect(store.currentStage).toBe(5);
    expect(store.thermodynamics.temperatureC).toBe(2);
    expect(store.thermodynamics.isPrecipitating).toBe(true);

    // 6. Stage 6: Vacuum Filtration & Dry Cake Measurement
    store.nextStage();
    expect(store.currentStage).toBe(6);
    store.updateStoichiometry({ actualYieldG: 2.20 });

    // Verify Final Outcome
    expect(store.stoichiometryResult.actualYieldG).toBe(2.20);
    expect(store.stoichiometryResult.percentYield).toBeCloseTo(84.33, 1);
    expect(store.stoichiometryResult.feedbackCategory).toBe('EXCELLENT');
    expect(store.stoichiometryResult.diagnosticFeedback).toContain('Exemplary');
  });

  // =========================================================================
  // Workload 2: Early Water Contamination & Diagnostic Recovery
  // =========================================================================
  it('Workload 2: student commits early water blunder, diagnoses 0% yield, resets, and recovers', () => {
    // 1. Student accidentally contaminates flask with early water
    store.setStage(1);
    store.setFailureMode('EARLY_WATER');
    expect(store.failureMode).toBe('EARLY_WATER');

    // 2. Student proceeds with water bath and cooling
    store.nextStage(); // Stage 2
    store.nextStage(); // Stage 3
    store.nextStage(); // Stage 4: Expects crystal burst, but none happens!
    expect(store.currentStage).toBe(4);
    expect(store.thermodynamics.isPrecipitating).toBe(false);
    expect(store.thermodynamics.supersaturation).toBe(0.0);

    // 3. Student filters in Stage 6 and measures 0.0 g product
    store.setStage(6);
    expect(store.stoichiometryResult.actualYieldG).toBe(0.0);
    expect(store.stoichiometryResult.percentYield).toBe(0.0);
    expect(store.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');

    // 4. Student reads diagnostic feedback explaining premature anhydride hydrolysis
    expect(store.stoichiometryResult.diagnosticFeedback).toContain('early water contamination');

    // 5. Student clicks Reset Simulation to start fresh with clean, dry glassware
    store.resetSimulation();
    expect(store.currentStage).toBe(1);
    expect(store.failureMode).toBe('NONE');
    expect(store.thermodynamics.stageId).toBe(1);

    // 6. Student completes correct synthesis and recovers 2.15 g pure crystals
    store.setStage(6);
    store.updateStoichiometry({ actualYieldG: 2.15 });
    expect(store.stoichiometryResult.percentYield).toBeCloseTo(82.42, 1);
    expect(store.stoichiometryResult.feedbackCategory).toBe('EXCELLENT');
  });

  // =========================================================================
  // Workload 3: Thermal Overheating (>85°C) & Parameter Correction
  // =========================================================================
  it('Workload 3: student discovers tarring from overheating, reads academic deep-dive, and remedies', () => {
    // 1. Student sets bath temperature to 95°C (overheating)
    store.setStage(2);
    store.setFailureMode('OVERHEATING');
    expect(store.thermodynamics.temperatureC).toBe(95);

    // 2. Side reactions occur: self-condensation into dark resinous tar
    store.setStage(4);
    expect(store.thermodynamics.isPrecipitating).toBe(false); // Discolored tar instead of needle crystals

    // 3. In Stage 6, user records poor recovery (0.45 g discolored clump)
    store.setStage(6);
    store.updateStoichiometry({ actualYieldG: 0.45 });
    expect(store.stoichiometryResult.percentYield).toBeCloseTo(17.25, 1);
    expect(store.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
    expect(store.stoichiometryResult.diagnosticFeedback).toContain('thermal degradation');

    // 4. Student adjusts temperature back to standard 80°C water bath
    store.setFailureMode('NONE');
    expect(store.failureMode).toBe('NONE');

    // 5. Re-running synthesis under controlled temperature yields standard white crystals
    store.updateStoichiometry({ actualYieldG: 2.25 });
    expect(store.stoichiometryResult.percentYield).toBeCloseTo(86.25, 1);
    expect(store.stoichiometryResult.feedbackCategory).toBe('EXCELLENT');
  });

  // =========================================================================
  // Workload 4: Lukewarm Wash Deficit Analysis
  // =========================================================================
  it('Workload 4: student experiences lukewarm wash loss and identifies temperature-dependent solubility', () => {
    // 1. Student executes Stages 1-5 flawlessly
    store.setStage(5);
    expect(store.thermodynamics.isPrecipitating).toBe(true);

    // 2. In Stage 6, student carelessly washes filter cake with warm water (25°C)
    store.setStage(6);
    store.setFailureMode('WARM_WASH');
    expect(store.thermodynamics.temperatureC).toBe(25);
    expect(store.thermodynamics.solubilityGPer100Ml).toBeGreaterThan(3.0);

    // 3. Observed yield plummets to ~32%
    expect(store.stoichiometryResult.percentYield).toBeLessThan(35.0);
    expect(store.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');
    expect(store.stoichiometryResult.diagnosticFeedback).toContain('lukewarm water');

    // 4. Student reads feedback: 0°C solubility is 2.2 mg/mL vs 25°C solubility 3.3 mg/mL
    // Correcting wash water back to ice-cold preserves yield
    store.setFailureMode('NONE');
    store.updateStoichiometry({ actualYieldG: 2.18 });
    expect(store.stoichiometryResult.percentYield).toBeCloseTo(83.57, 1);
    expect(store.stoichiometryResult.feedbackCategory).toBe('EXCELLENT');
  });

  // =========================================================================
  // Workload 5: Advanced Stoichiometric Optimization & Quenching Heat Analysis
  // =========================================================================
  it('Workload 5: researcher tests varying anhydride volumes, limiting reagent crossover, and quenching heat', () => {
    // Case A: Deficit anhydride (1.00 mL)
    store.updateStoichiometry({
      salicylicAcidMassG: 2.00,
      aceticAnhydrideVolMl: 1.00,
    });
    expect(store.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
    expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(1.909, 2);

    // Case B: Moderate excess (5.00 mL)
    store.updateStoichiometry({
      salicylicAcidMassG: 2.00,
      aceticAnhydrideVolMl: 5.00,
    });
    expect(store.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
    expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(2.6087, 2);

    // Calculate quenching heat for 5.00 mL AA:
    // Moles AA initially = (5.0 * 1.082) / 102.089 = 0.05299 mol
    // Moles SA = 2.00 / 138.121 = 0.01448 mol
    // Unreacted AA excess = 0.05299 - 0.01448 = 0.03851 mol
    const excessMolesB = 0.05299 - 0.01448;
    const quenchingHeatB = excessMolesB * Math.abs(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING); // kJ
    expect(quenchingHeatB).toBeCloseTo(2.176, 1);

    // Case C: Massive industrial excess (15.00 mL)
    store.updateStoichiometry({
      salicylicAcidMassG: 2.00,
      aceticAnhydrideVolMl: 15.00,
    });
    const molesAAC = (15.0 * 1.082) / 102.089;
    const excessMolesC = molesAAC - 0.01448;
    const quenchingHeatC = excessMolesC * Math.abs(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING); // kJ
    expect(quenchingHeatC).toBeGreaterThan(8.0); // Over 8 kJ released

    // Proves why ice bath is critical: in 35 mL liquid, 8 kJ would cause > 50°C adiabatic temperature spike!
    const solutionMassG = 35.0;
    const deltaT = (quenchingHeatC * 1000) / (solutionMassG * 4.184);
    expect(deltaT).toBeGreaterThan(50.0);
  });
});
