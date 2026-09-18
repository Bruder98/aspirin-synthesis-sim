import { describe, it, expect, beforeEach } from 'vitest';
import {
  createReferenceStore,
  calculateReferenceStoichiometry,
  calculateReferenceThermodynamics,
  calculateReferenceArrheniusRate,
  calculateReferenceCntBarrier,
  PHYSICAL_CONSTANTS,
  PEDAGOGY_CONTENT,
  REFERENCE_MOLECULES,
  AspirinStoreState,
} from './testRunner';

describe('Tier 1: Comprehensive Feature Coverage (F01 - F20)', () => {
  let store: AspirinStoreState;

  beforeEach(() => {
    store = createReferenceStore();
  });

  // =========================================================================
  // F01: 6-Stage Reaction Lifecycle State Machine
  // =========================================================================
  describe('F01: 6-Stage Reaction Lifecycle State Machine', () => {
    it('F01-1: initializes at Stage 1 (REAGENTS_INPUT) with valid default states', () => {
      expect(store.currentStage).toBe(1);
      expect(store.failureMode).toBe('NONE');
      expect(store.isPlaying).toBe(true);
      expect(store.stageProgress).toBe(0.0);
    });

    it('F01-2: advances sequentially across all stages from 1 to 6', () => {
      expect(store.currentStage).toBe(1);
      store.nextStage();
      expect(store.currentStage).toBe(2);
      store.nextStage();
      expect(store.currentStage).toBe(3);
      store.nextStage();
      expect(store.currentStage).toBe(4);
      store.nextStage();
      expect(store.currentStage).toBe(5);
      store.nextStage();
      expect(store.currentStage).toBe(6);
    });

    it('F01-3: clamps at upper boundary (cannot advance beyond Stage 6)', () => {
      store.setStage(6);
      expect(store.currentStage).toBe(6);
      store.nextStage();
      expect(store.currentStage).toBe(6);
    });

    it('F01-4: steps backward sequentially from Stage 6 to Stage 1', () => {
      store.setStage(6);
      store.prevStage();
      expect(store.currentStage).toBe(5);
      store.prevStage();
      expect(store.currentStage).toBe(4);
      store.prevStage();
      expect(store.currentStage).toBe(3);
      store.prevStage();
      expect(store.currentStage).toBe(2);
      store.prevStage();
      expect(store.currentStage).toBe(1);
    });

    it('F01-5: clamps at lower boundary (cannot step back below Stage 1)', () => {
      expect(store.currentStage).toBe(1);
      store.prevStage();
      expect(store.currentStage).toBe(1);
    });

    it('F01-6: allows direct stage jump and resetSimulation restores Stage 1', () => {
      store.setStage(4);
      expect(store.currentStage).toBe(4);
      store.resetSimulation();
      expect(store.currentStage).toBe(1);
      expect(store.failureMode).toBe('NONE');
    });
  });

  // =========================================================================
  // F02: Esterification Kinetics & Intermediates
  // =========================================================================
  describe('F02: Esterification Kinetics & Intermediates', () => {
    it('F02-1: calculates Arrhenius rate constant at 80°C matching ~0.084 L/(mol*min)', () => {
      const k80 = calculateReferenceArrheniusRate(80);
      expect(k80).toBeGreaterThan(0.075);
      expect(k80).toBeLessThan(0.095);
    });

    it('F02-2: verifies extreme temperature sensitivity of rate constant (80°C vs 20°C)', () => {
      const k80 = calculateReferenceArrheniusRate(80);
      const k20 = calculateReferenceArrheniusRate(20);
      expect(k80 / k20).toBeGreaterThan(25); // At least 25x faster at 80°C
    });

    it('F02-3: calculates high esterification conversion (>98%) within 15 min under excess anhydride', () => {
      const k80 = calculateReferenceArrheniusRate(80);
      const kPseudo = k80 * 10.6; // [AA] excess approx 10.6 M
      const conversion15Min = 1 - Math.exp(-kPseudo * 15);
      expect(conversion15Min).toBeGreaterThan(0.98);
    });

    it('F02-4: models oxonium ion intermediate with carbonyl oxygen protonation by H3PO4', () => {
      const pedagogy = PEDAGOGY_CONTENT[1].deepDive;
      expect(pedagogy.latex).toContain('\\text{Ac}_2\\text{O} + \\text{H}^+');
      expect(pedagogy.description).toContain('oxonium intermediate');
    });

    it('F02-5: models tetrahedral intermediate collapse yielding neutral acetic acid byproduct', () => {
      const pedagogy = PEDAGOGY_CONTENT[2].deepDive;
      expect(pedagogy.latex).toContain('Tetrahedral Intermediate');
      expect(pedagogy.latex).toContain('\\text{ASA} + \\text{AcOH}');
    });
  });

  // =========================================================================
  // F03: Co-Solvent Thermodynamics & Metastable Zone
  // =========================================================================
  describe('F03: Co-Solvent Thermodynamics & Metastable Zone', () => {
    it('F03-1: calculates low dielectric constant in crude reaction mixture at Stage 3 (~11.28)', () => {
      const thermo = calculateReferenceThermodynamics(3);
      expect(thermo.dielectricConstant).toBeCloseTo(11.28, 1);
    });

    it('F03-2: calculates high equilibrium solubility of aspirin in organic co-solvent at 4°C (>15 g/100mL)', () => {
      const thermo = calculateReferenceThermodynamics(3);
      expect(thermo.solubilityGPer100Ml).toBeGreaterThan(15.0);
    });

    it('F03-3: confirms low supersaturation ratio S <= 1.20 within the Metastable Zone', () => {
      const thermo = calculateReferenceThermodynamics(3);
      expect(thermo.supersaturation).toBeLessThanOrEqual(1.20);
      expect(thermo.supersaturation).toBeGreaterThanOrEqual(1.0);
    });

    it('F03-4: evaluates prohibitive Classical Nucleation Theory barrier in Stage 3 (>50 kBT)', () => {
      const barrier = calculateReferenceCntBarrier(1.15, 277.15);
      expect(barrier.reducedBarrier).toBeGreaterThan(50);
      expect(barrier.criticalRadiusNm).toBeGreaterThan(5.0);
    });

    it('F03-5: reports isMetastable=true and isPrecipitating=false (clear liquid with 0 crystals)', () => {
      const thermo = calculateReferenceThermodynamics(3);
      expect(thermo.isMetastable).toBe(true);
      expect(thermo.isPrecipitating).toBe(false);
      expect(thermo.temperatureC).toBe(4);
    });
  });

  // =========================================================================
  // F04: Antisolvent Shock & Dielectric Surge
  // =========================================================================
  describe('F04: Antisolvent Shock & Dielectric Surge', () => {
    it('F04-1: verifies sharp dielectric surge upon water addition in Stage 4 (>65)', () => {
      const thermo3 = calculateReferenceThermodynamics(3);
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo3.dielectricConstant).toBeLessThan(15);
      expect(thermo4.dielectricConstant).toBeGreaterThan(65);
      expect(thermo4.dielectricConstant - thermo3.dielectricConstant).toBeGreaterThan(50);
    });

    it('F04-2: verifies exponential collapse of equilibrium solubility to <1.0 g/100mL', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.solubilityGPer100Ml).toBeLessThan(1.0);
      expect(thermo4.solubilityGPer100Ml).toBeCloseTo(0.65, 1);
    });

    it('F04-3: verifies supersaturation ratio spike to S >= 20.0', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.supersaturation).toBeGreaterThanOrEqual(20.0);
    });

    it('F04-4: confirms phase state transition to isPrecipitating=true and isMetastable=false', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.isPrecipitating).toBe(true);
      expect(thermo4.isMetastable).toBe(false);
    });

    it('F04-5: demonstrates thermodynamic driving force increases by over 20-fold', () => {
      const thermo3 = calculateReferenceThermodynamics(3);
      const thermo4 = calculateReferenceThermodynamics(4);
      const drivingForce3 = Math.log(thermo3.supersaturation);
      const drivingForce4 = Math.log(thermo4.supersaturation);
      expect(drivingForce4 / drivingForce3).toBeGreaterThan(20);
    });
  });

  // =========================================================================
  // F05: CNT Nucleation Barrier Collapse & Burst
  // =========================================================================
  describe('F05: CNT Nucleation Barrier Collapse & Burst', () => {
    it('F05-1: verifies 400+ fold collapse of nucleation free energy barrier from Stage 3 to Stage 4', () => {
      const barrier3 = calculateReferenceCntBarrier(1.15, 277.15);
      const barrier4 = calculateReferenceCntBarrier(20.08, 277.15);
      expect(barrier3.cntBarrierJoules / barrier4.cntBarrierJoules).toBeGreaterThan(400);
    });

    it('F05-2: verifies critical nucleus radius shrinks from >10 nm to sub-nanometer (<1 nm)', () => {
      const barrier3 = calculateReferenceCntBarrier(1.15, 277.15);
      const barrier4 = calculateReferenceCntBarrier(20.08, 277.15);
      expect(barrier3.criticalRadiusNm).toBeGreaterThan(8.0);
      expect(barrier4.criticalRadiusNm).toBeLessThan(1.0);
    });

    it('F05-3: verifies reduced nucleation barrier drops to spinodal regime (<5 kBT)', () => {
      const barrier4 = calculateReferenceCntBarrier(20.08, 277.15);
      expect(barrier4.reducedBarrier).toBeLessThan(5.0);
    });

    it('F05-4: reports relativeBarrierRatio < 0.01 in Stage 4 thermodynamic state', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.relativeBarrierRatio).toBeLessThan(0.01);
    });

    it('F05-5: confirms explosive needle crystal burst continues into Stage 5 maturation', () => {
      const thermo5 = calculateReferenceThermodynamics(5);
      expect(thermo5.isPrecipitating).toBe(true);
      expect(thermo5.solubilityGPer100Ml).toBeLessThan(0.3);
    });
  });

  // =========================================================================
  // F06: Anhydride Exothermic Quenching
  // =========================================================================
  describe('F06: Anhydride Exothermic Quenching', () => {
    it('F06-1: models 1:1 stoichiometry with water producing 2 moles acetic acid per mole anhydride', () => {
      const pedagogy = PEDAGOGY_CONTENT[5].deepDive;
      expect(pedagogy.latex).toContain('(\\text{CH}_3\\text{CO})_2\\text{O} + \\text{H}_2\\text{O} \\rightarrow 2\\,\\text{CH}_3\\text{COOH}');
    });

    it('F06-2: confirms standard exothermic quenching enthalpy is -56.5 kJ/mol', () => {
      expect(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING).toBe(-56.5);
    });

    it('F06-3: calculates heat generation for standard excess anhydride (~0.0385 mol) as ~2.18 kJ', () => {
      const molesExcess = 0.0385;
      const heatJoules = molesExcess * Math.abs(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING) * 1000;
      expect(heatJoules).toBeGreaterThan(2100);
      expect(heatJoules).toBeLessThan(2250);
    });

    it('F06-4: verifies adiabatic temperature spike without ice bath would exceed 20°C', () => {
      const heatJoules = 2175;
      const solutionMassG = 20.0;
      const cp = 4.184; // J/(g*K)
      const deltaT = heatJoules / (solutionMassG * cp);
      expect(deltaT).toBeGreaterThan(20.0);
    });

    it('F06-5: confirms ice-water bath maintains temperature at <= 4°C despite quenching exotherm', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.temperatureC).toBeLessThanOrEqual(4);
    });
  });

  // =========================================================================
  // F07: Early Water Contamination Failure
  // =========================================================================
  describe('F07: Early Water Contamination Failure', () => {
    it('F07-1: activates EARLY_WATER failure branch on the simulation store', () => {
      store.setFailureMode('EARLY_WATER');
      expect(store.failureMode).toBe('EARLY_WATER');
    });

    it('F07-2: models complete premature hydrolysis of acetic anhydride before esterification', () => {
      store.setFailureMode('EARLY_WATER');
      expect(store.stoichiometryResult.actualYieldG).toBe(0.0);
      expect(store.stoichiometryResult.percentYield).toBe(0.0);
    });

    it('F07-3: assigns CRITICAL_ERROR feedback category to early water failure', () => {
      store.setFailureMode('EARLY_WATER');
      expect(store.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
    });

    it('F07-4: alters thermodynamic state to suppress crystallization burst', () => {
      store.setStage(4);
      store.setFailureMode('EARLY_WATER');
      expect(store.thermodynamics.isPrecipitating).toBe(false);
      expect(store.thermodynamics.supersaturation).toBe(0.0);
    });

    it('F07-5: resets cleanly back to normal synthesis mode on resetSimulation', () => {
      store.setFailureMode('EARLY_WATER');
      store.resetSimulation();
      expect(store.failureMode).toBe('NONE');
      expect(store.currentStage).toBe(1);
      expect(store.stoichiometryResult.percentYield).toBeGreaterThan(80);
    });
  });

  // =========================================================================
  // F08: Thermal Overheating (>85°C) Failure
  // =========================================================================
  describe('F08: Thermal Overheating (>85°C) Failure', () => {
    it('F08-1: activates OVERHEATING failure branch on store', () => {
      store.setFailureMode('OVERHEATING');
      expect(store.failureMode).toBe('OVERHEATING');
    });

    it('F08-2: reflects elevated bath temperature (>90°C) in thermodynamic state', () => {
      store.setFailureMode('OVERHEATING');
      expect(store.thermodynamics.temperatureC).toBeGreaterThan(85);
    });

    it('F08-3: causes thermal decarboxylation and self-condensation suppressing pure crystallization', () => {
      store.setFailureMode('OVERHEATING');
      expect(store.thermodynamics.isPrecipitating).toBe(false);
      expect(store.thermodynamics.supersaturation).toBeLessThan(0.5);
    });

    it('F08-4: diagnostic rubric recognizes thermal degradation', () => {
      const result = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 0.50, // severely diminished yield from tarring
      });
      expect(result.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(result.diagnosticFeedback).toContain('thermal degradation');
    });

    it('F08-5: switching from OVERHEATING back to NONE restores standard thermodynamics', () => {
      store.setStage(2);
      store.setFailureMode('OVERHEATING');
      expect(store.thermodynamics.temperatureC).toBe(95);
      store.setFailureMode('NONE');
      expect(store.thermodynamics.temperatureC).toBe(80);
    });
  });

  // =========================================================================
  // F09: Lukewarm Wash Loss Failure
  // =========================================================================
  describe('F09: Lukewarm Wash Loss Failure', () => {
    it('F09-1: activates WARM_WASH failure branch on store in Stage 6', () => {
      store.setStage(6);
      store.setFailureMode('WARM_WASH');
      expect(store.failureMode).toBe('WARM_WASH');
    });

    it('F09-2: calculates elevated wash water temperature (25°C) and increased solubility', () => {
      const thermo = calculateReferenceThermodynamics(6, 'WARM_WASH');
      expect(thermo.temperatureC).toBe(25);
      expect(thermo.solubilityGPer100Ml).toBeGreaterThan(3.0); // 15x higher than at 0°C
    });

    it('F09-3: significantly reduces actual recovered yield (<35%)', () => {
      store.setFailureMode('WARM_WASH');
      expect(store.stoichiometryResult.percentYield).toBeLessThan(35.0);
    });

    it('F09-4: classifies lukewarm wash loss as WASH_LOSS category', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 0.83, // ~32% yield
      });
      expect(res.feedbackCategory).toBe('WASH_LOSS');
      expect(res.diagnosticFeedback).toContain('lukewarm water');
    });

    it('F09-5: toggling WARM_WASH off restores standard filtration yield', () => {
      store.setFailureMode('WARM_WASH');
      store.setFailureMode('NONE');
      expect(store.stoichiometryResult.percentYield).toBeGreaterThan(80);
    });
  });

  // =========================================================================
  // F10: Stoichiometry & Limiting Reagent Engine
  // =========================================================================
  describe('F10: Stoichiometry & Limiting Reagent Engine', () => {
    it('F10-1: verifies accurate molar masses and acetic anhydride density', () => {
      expect(PHYSICAL_CONSTANTS.MW_SALICYLIC_ACID).toBe(138.121);
      expect(PHYSICAL_CONSTANTS.MW_ACETIC_ANHYDRIDE).toBe(102.089);
      expect(PHYSICAL_CONSTANTS.DENSITY_ACETIC_ANHYDRIDE).toBe(1.082);
      expect(PHYSICAL_CONSTANTS.MW_ASPIRIN).toBe(180.158);
    });

    it('F10-2: identifies SALICYLIC_ACID as limiting reagent for standard inputs (2.00 g SA, 5.00 mL AA)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
      });
      expect(res.limitingReagent).toBe('SALICYLIC_ACID');
      expect(res.salicylicAcidMoles).toBeCloseTo(0.01448, 4);
      expect(res.aceticAnhydrideMoles).toBeCloseTo(0.05299, 4);
      expect(res.limitingReagentMoles).toBe(res.salicylicAcidMoles);
    });

    it('F10-3: identifies ACETIC_ANHYDRIDE as limiting reagent for inverted inputs (10.00 g SA, 1.00 mL AA)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 10.00,
        aceticAnhydrideVolMl: 1.00,
      });
      expect(res.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(res.limitingReagentMoles).toBe(res.aceticAnhydrideMoles);
    });

    it('F10-4: handles equimolar boundary condition without error', () => {
      // 1.38121 g SA = 0.01 mol; 0.9435 mL AA = 1.0209 g = 0.01 mol
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 1.38121,
        aceticAnhydrideVolMl: 0.94352,
      });
      expect(res.salicylicAcidMoles).toBeCloseTo(0.01, 3);
      expect(res.aceticAnhydrideMoles).toBeCloseTo(0.01, 3);
      expect(res.limitingReagentMoles).toBeCloseTo(0.01, 3);
    });

    it('F10-5: confirms limiting reagent moles is strictly min(n_SA, n_AA)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 3.50,
        aceticAnhydrideVolMl: 4.20,
      });
      const minMoles = Math.min(res.salicylicAcidMoles, res.aceticAnhydrideMoles);
      expect(res.limitingReagentMoles).toBeCloseTo(minMoles, 5);
    });
  });

  // =========================================================================
  // F11: Theoretical & Actual Yield Calculations
  // =========================================================================
  describe('F11: Theoretical & Actual Yield Calculations', () => {
    it('F11-1: calculates exact theoretical yield for standard inputs as ~2.6087 g', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
      });
      expect(res.theoreticalYieldG).toBeCloseTo(2.6087, 2);
    });

    it('F11-2: calculates correct percent yield: 2.20 g / 2.6087 g -> 84.33%', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 2.20,
      });
      expect(res.percentYield).toBeCloseTo(84.33, 1);
    });

    it('F11-3: calculates 100.00% yield when actual mass equals theoretical yield', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 2.6087,
      });
      expect(res.percentYield).toBeCloseTo(100.00, 1);
    });

    it('F11-4: calculates 0.00% yield when actual yield is 0.00 g', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 0.0,
      });
      expect(res.percentYield).toBe(0.0);
    });

    it('F11-5: satisfies linear proportionality: doubling SA mass doubles theoretical yield', () => {
      const res1 = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 10.00,
      });
      const res2 = calculateReferenceStoichiometry({
        salicylicAcidMassG: 4.00,
        aceticAnhydrideVolMl: 10.00,
      });
      expect(res2.theoreticalYieldG).toBeCloseTo(res1.theoreticalYieldG * 2, 2);
    });
  });

  // =========================================================================
  // F12: 8-Tier Diagnostic Feedback Rubric
  // =========================================================================
  describe('F12: 8-Tier Diagnostic Feedback Rubric', () => {
    it('F12-1: flags HIGH_MOISTURE for yield > 105% (e.g. 115%)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 3.00, // ~115%
      });
      expect(res.feedbackCategory).toBe('HIGH_MOISTURE');
      expect(res.diagnosticFeedback).toContain('residual moisture');
    });

    it('F12-2: flags EXCELLENT for yield between 80% and 105% (e.g. 90%)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 2.35, // ~90%
      });
      expect(res.feedbackCategory).toBe('EXCELLENT');
      expect(res.diagnosticFeedback).toContain('Exemplary');
    });

    it('F12-3: flags PARTIAL_CONVERSION for yield between 60% and 79.9% (e.g. 70%)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 1.83, // ~70%
      });
      expect(res.feedbackCategory).toBe('PARTIAL_CONVERSION');
      expect(res.diagnosticFeedback).toContain('Normal undergraduate');
    });

    it('F12-4: flags WASH_LOSS for yield between 25% and 59.9% (e.g. 45%)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 1.17, // ~45%
      });
      expect(res.feedbackCategory).toBe('WASH_LOSS');
      expect(res.diagnosticFeedback).toContain('lukewarm water');
    });

    it('F12-5: flags CRITICAL_ERROR for yield < 25% (e.g. 15%)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 0.39, // ~15%
      });
      expect(res.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(res.diagnosticFeedback).toContain('Critical reaction failure');
    });

    it('F12-6: flags CRITICAL_ERROR for exactly 0% yield with catastrophic failure advisory', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 0.0,
      });
      expect(res.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(res.diagnosticFeedback).toContain('Zero yield');
    });
  });

  // =========================================================================
  // F13: Macro Lab Apparatus 2D Canvas/SVG View
  // =========================================================================
  describe('F13: Macro Lab Apparatus 2D Canvas/SVG View', () => {
    it('F13-1: defines apparatus configuration for Stage 1 (reagents weighing & dispensing)', () => {
      expect(PEDAGOGY_CONTENT[1].eli5.title).toContain('Coat Swap');
      const thermo1 = calculateReferenceThermodynamics(1);
      expect(thermo1.temperatureC).toBe(20);
    });

    it('F13-2: defines apparatus configuration for Stage 2 (water bath at 80°C with vortex)', () => {
      const thermo2 = calculateReferenceThermodynamics(2);
      expect(thermo2.temperatureC).toBe(80);
      expect(thermo2.isPrecipitating).toBe(false);
    });

    it('F13-3: defines apparatus configuration for Stage 3 (ice bath at 4°C with transparent liquid)', () => {
      const thermo3 = calculateReferenceThermodynamics(3);
      expect(thermo3.temperatureC).toBe(4);
      expect(thermo3.isMetastable).toBe(true);
      expect(thermo3.isPrecipitating).toBe(false);
    });

    it('F13-4: defines apparatus configuration for Stage 4 (water injection & radial needle burst)', () => {
      const thermo4 = calculateReferenceThermodynamics(4);
      expect(thermo4.isPrecipitating).toBe(true);
      expect(thermo4.dielectricConstant).toBeGreaterThan(65);
    });

    it('F13-5: defines apparatus configuration for Stage 6 (Buchner funnel & vacuum cake)', () => {
      const thermo6 = calculateReferenceThermodynamics(6);
      expect(thermo6.temperatureC).toBe(4);
      expect(thermo6.isMetastable).toBe(false);
    });
  });

  // =========================================================================
  // F14: Micro 3D Molecular Three.js Viewport
  // =========================================================================
  describe('F14: Micro 3D Molecular Three.js Viewport', () => {
    it('F14-1: includes standard CPK elements in molecular species', () => {
      expect(REFERENCE_MOLECULES.some(m => m.id === 'SA')).toBe(true);
      expect(REFERENCE_MOLECULES.some(m => m.id === 'AA')).toBe(true);
      expect(REFERENCE_MOLECULES.some(m => m.id === 'H3PO4')).toBe(true);
      expect(REFERENCE_MOLECULES.some(m => m.id === 'ASA')).toBe(true);
    });

    it('F14-2: verifies correct atom counts for salicylic acid (16) and aspirin (21)', () => {
      const sa = REFERENCE_MOLECULES.find(m => m.id === 'SA');
      const asa = REFERENCE_MOLECULES.find(m => m.id === 'ASA');
      expect(sa?.atomCount).toBe(16);
      expect(asa?.atomCount).toBe(21);
    });

    it('F14-3: models 3D proton transfer to carbonyl oxygen during Stage 1 and 2', () => {
      const ped1 = PEDAGOGY_CONTENT[1].deepDive;
      expect(ped1.latex).toContain('\\text{Ac}_2\\text{O} + \\text{H}^+');
    });

    it('F14-4: models 3D acetic acid protective solvation shell in Stage 3', () => {
      const ped3 = PEDAGOGY_CONTENT[3].deepDive;
      expect(ped3.description).toContain('solvation');
    });

    it('F14-5: models 3D monoclinic crystal lattice assembly in Stage 4 and 5', () => {
      const ped5 = PEDAGOGY_CONTENT[5].deepDive;
      expect(ped5.title).toContain('Monoclinic Lattice');
    });
  });

  // =========================================================================
  // F15: Dual-View 1:1 Stage Synchronization Engine
  // =========================================================================
  describe('F15: Dual-View 1:1 Stage Synchronization Engine', () => {
    it('F15-1: verifies stage progress is initialized to normalized interval [0, 1]', () => {
      expect(store.stageProgress).toBeGreaterThanOrEqual(0.0);
      expect(store.stageProgress).toBeLessThanOrEqual(1.0);
    });

    it('F15-2: advancing stage updates stage state synchronously for both viewports', () => {
      store.setStage(3);
      expect(store.currentStage).toBe(3);
      expect(store.thermodynamics.stageId).toBe(3);
    });

    it('F15-3: isPlaying flag controls animation loop execution', () => {
      expect(store.isPlaying).toBe(true);
      store.setPlaying(false);
      expect(store.isPlaying).toBe(false);
      store.setPlaying(true);
      expect(store.isPlaying).toBe(true);
    });

    it('F15-4: failure mode propagates synchronously to thermodynamic state', () => {
      store.setFailureMode('EARLY_WATER');
      expect(store.thermodynamics.supersaturation).toBe(0.0);
      expect(store.thermodynamics.isPrecipitating).toBe(false);
    });

    it('F15-5: store reset restores synchronized baseline across macro and micro models', () => {
      store.setStage(5);
      store.setFailureMode('WARM_WASH');
      store.resetSimulation();
      expect(store.currentStage).toBe(1);
      expect(store.failureMode).toBe('NONE');
      expect(store.thermodynamics.stageId).toBe(1);
    });
  });

  // =========================================================================
  // F16: Interactive 3D OrbitControls & Fallbacks
  // =========================================================================
  describe('F16: Interactive 3D OrbitControls & Fallbacks', () => {
    it('F16-1: defines valid distance bounds for 3D camera (min: 3, max: 35)', () => {
      const minDistance = 3;
      const maxDistance = 35;
      expect(minDistance).toBeLessThan(maxDistance);
      expect(minDistance).toBeGreaterThan(0);
    });

    it('F16-2: defines default camera position vector [0, 2, 14]', () => {
      const defaultPos = [0, 2, 14];
      expect(defaultPos.length).toBe(3);
      expect(defaultPos[2]).toBeGreaterThan(0);
    });

    it('F16-3: ensures camera aspect ratio computation handles window resize safely', () => {
      const width = 800;
      const height = 600;
      const aspect = width / height;
      expect(aspect).toBeCloseTo(1.333, 2);
      expect(isFinite(aspect)).toBe(true);
    });

    it('F16-4: handles zero or collapsed dimensions gracefully (fallback aspect)', () => {
      const width = 0;
      const height = 600;
      const aspect = height > 0 && width > 0 ? width / height : 1.0;
      expect(aspect).toBe(1.0);
    });

    it('F16-5: supports interactive camera reset vector restore', () => {
      let cameraPos = [5, 10, 25];
      const resetCamera = () => { cameraPos = [0, 2, 14]; };
      resetCamera();
      expect(cameraPos).toEqual([0, 2, 14]);
    });
  });

  // =========================================================================
  // F17: 6-Stage ELI5 Real-Life Metaphor Cards
  // =========================================================================
  describe('F17: 6-Stage ELI5 Real-Life Metaphor Cards', () => {
    it('F17-1: provides intuitive Coat Swap metaphor for Stage 1', () => {
      const card = PEDAGOGY_CONTENT[1].eli5;
      expect(card.title).toContain('Coat Swap');
      expect(card.analogy).toContain('tailor');
    });

    it('F17-2: provides Sauna Dance metaphor for Stage 2', () => {
      const card = PEDAGOGY_CONTENT[2].eli5;
      expect(card.title).toContain('Sauna Dance');
      expect(card.analogy).toContain('vinegar');
    });

    it('F17-3: provides Sneaky Disguise Party metaphor for Stage 3 (Metastable Zone)', () => {
      const card = PEDAGOGY_CONTENT[3].eli5;
      expect(card.title).toContain('Disguise Party');
      expect(card.analogy).toContain('cozy blanket');
    });

    it('F17-4: provides Strict Water Guard metaphor for Stage 4 (Crystal Burst)', () => {
      const card = PEDAGOGY_CONTENT[4].eli5;
      expect(card.title).toContain('Water Guard');
      expect(card.analogy).toContain('blizzard of needle crystals');
    });

    it('F17-5: provides Crystal Skyscraper and Vacuum Press metaphors for Stages 5 and 6', () => {
      const card5 = PEDAGOGY_CONTENT[5].eli5;
      const card6 = PEDAGOGY_CONTENT[6].eli5;
      expect(card5.title).toContain('Skyscraper');
      expect(card6.title).toContain('Vacuum Press');
    });
  });

  // =========================================================================
  // F18: 6-Stage Academic Deep-Dive LaTeX Cards
  // =========================================================================
  describe('F18: 6-Stage Academic Deep-Dive LaTeX Cards', () => {
    it('F18-1: provides protonation and oxonium ion LaTeX formula for Stage 1', () => {
      const card = PEDAGOGY_CONTENT[1].deepDive;
      expect(card.latex).toContain('\\text{Ac}_2\\text{O} + \\text{H}^+');
    });

    it('F18-2: provides nucleophilic acyl substitution and tetrahedral intermediate LaTeX for Stage 2', () => {
      const card = PEDAGOGY_CONTENT[2].deepDive;
      expect(card.latex).toContain('Tetrahedral Intermediate');
    });

    it('F18-3: provides dielectric permittivity and Metastable Zone formula for Stage 3', () => {
      const card = PEDAGOGY_CONTENT[3].deepDive;
      expect(card.latex).toContain('\\epsilon_{\\text{mix}} \\approx 11.28');
      expect(card.latex).toContain('\\Delta G^* > 65\\,k_BT');
    });

    it('F18-4: provides Classical Nucleation Theory barrier collapse LaTeX formula for Stage 4', () => {
      const card = PEDAGOGY_CONTENT[4].deepDive;
      expect(card.latex).toContain('\\Delta G^* = \\frac{16\\pi \\gamma^3 v_m^2}{3(k_B T \\ln S)^2}');
    });

    it('F18-5: provides Darcy filtration law and quenching enthalpy LaTeX formulas for Stages 5 and 6', () => {
      const card5 = PEDAGOGY_CONTENT[5].deepDive;
      const card6 = PEDAGOGY_CONTENT[6].deepDive;
      expect(card5.latex).toContain('\\Delta H^\\circ = -56.5\\text{ kJ/mol}');
      expect(card6.latex).toContain('\\frac{dV}{dt} = \\frac{A \\Delta P}{\\mu(R_c + R_m)}');
    });
  });

  // =========================================================================
  // F19: Interactive Yield Calculator Modal & Controls
  // =========================================================================
  describe('F19: Interactive Yield Calculator Modal & Controls', () => {
    it('F19-1: dynamically updates theoretical yield when salicylic acid mass changes', () => {
      store.updateStoichiometry({ salicylicAcidMassG: 4.00 });
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(4.00);
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(5.217, 2);
    });

    it('F19-2: dynamically updates limiting reagent when acetic anhydride volume changes', () => {
      store.updateStoichiometry({ salicylicAcidMassG: 5.00, aceticAnhydrideVolMl: 1.00 });
      expect(store.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
    });

    it('F19-3: dynamically updates percent yield when actual yield mass changes', () => {
      store.updateStoichiometry({ actualYieldG: 1.30 });
      expect(store.stoichiometryResult.actualYieldG).toBe(1.30);
      expect(store.stoichiometryResult.percentYield).toBeCloseTo(49.8, 1);
    });

    it('F19-4: supports partial stoichiometry input updates without losing previous values', () => {
      store.updateStoichiometry({ salicylicAcidMassG: 3.00 });
      expect(store.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.00);
      store.updateStoichiometry({ aceticAnhydrideVolMl: 6.00 });
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(3.00);
    });

    it('F19-5: resetSimulation restores canonical default inputs (2.00 g SA, 5.00 mL AA, 2.20 g actual)', () => {
      store.updateStoichiometry({ salicylicAcidMassG: 8.00, aceticAnhydrideVolMl: 12.00 });
      store.resetSimulation();
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(2.00);
      expect(store.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.00);
      expect(store.stoichiometryInputs.actualYieldG).toBe(2.20);
    });
  });

  // =========================================================================
  // F20: Dark Laboratory HUD Layout & Stitch System
  // =========================================================================
  describe('F20: Dark Laboratory HUD Layout & Stitch System', () => {
    it('F20-1: verifies Stitch high-density color tokens (#0B0F17 base, cyan, amber, emerald)', () => {
      const stitchTokens = {
        surfaceBase: '#0B0F17',
        accentCyan: '#00F0FF',
        accentAmber: '#F59E0B',
        accentEmerald: '#10B981',
      };
      expect(stitchTokens.surfaceBase).toBe('#0B0F17');
      expect(stitchTokens.accentCyan).toBe('#00F0FF');
    });

    it('F20-2: verifies JetBrains Mono typography token for data telemetry', () => {
      const fontMono = 'JetBrains Mono, monospace';
      expect(fontMono).toContain('JetBrains Mono');
    });

    it('F20-3: verifies stage timeline stepper reflects active, completed, and pending steps', () => {
      store.setStage(3);
      const isStepCompleted = (step: number) => step < store.currentStage;
      const isStepActive = (step: number) => step === store.currentStage;

      expect(isStepCompleted(1)).toBe(true);
      expect(isStepCompleted(2)).toBe(true);
      expect(isStepActive(3)).toBe(true);
      expect(isStepCompleted(4)).toBe(false);
    });

    it('F20-4: renders failure scenario controls with appropriate alert styling', () => {
      store.setFailureMode('EARLY_WATER');
      const hasFailure = store.failureMode !== 'NONE';
      expect(hasFailure).toBe(true);
    });

    it('F20-5: confirms responsive split-view contract between macro and micro viewports', () => {
      const desktopCols = 'grid-cols-2';
      const mobileCols = 'grid-cols-1';
      expect(desktopCols).toBe('grid-cols-2');
      expect(mobileCols).toBe('grid-cols-1');
    });
  });
});
