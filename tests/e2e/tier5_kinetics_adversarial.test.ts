/**
 * Tier 5: White-Box Adversarial Stress Suite for Chemical Kinetics & Thermodynamics
 * Project: Acetylsalicylic Acid (Aspirin) Synthesis Simulation
 * 
 * Verifies:
 * 1. Reaction Kinetics & Arrhenius Rate Law (Cryogenic bounds, pyrolytic limits, catalyst scaling, conversion bounds)
 * 2. Thermodynamics, Dielectric Surge, Jouyban-Acree Co-solvency & Classical Nucleation Theory (Singularities at S <= 1.0, barrier collapse at S -> 1000)
 * 3. Stoichiometry Engine, Limiting Reagent Transitions & 8-Tier Diagnostic Rubric (Equimolar equivalence, inverted excess, zero/negative quantities)
 * 4. Failure Mode Branching & FeCl3 Analytical Test State Machine
 * 5. Molecular 3D Geometries, Topological Bond Integrity & Monoclinic Form I Crystal Lattice Invariants
 * 6. High-Throughput Monte Carlo Fuzzing across All Engines
 */

import { describe, it, expect } from 'vitest';
import {
  calculateArrheniusRateConstant,
  calculateReactionConversion,
  calculateQuenchingReaction,
  getStageInfo,
  STAGE_DEFINITIONS,
  MECHANISM_STEPS,
  CHEMICAL_CONSTANTS,
} from '../../src/engine/reactionKinetics';
import {
  calculateEffectiveDielectricConstant,
  calculateEquilibriumSolubility,
  calculateCntParameters,
  calculateThermodynamicState,
  THERMO_CONSTANTS,
  MOLECULAR_VOLUME_VM,
} from '../../src/engine/thermodynamics';
import {
  calculateStoichiometry,
  evaluateYieldDiagnostic,
  STOICHIOMETRY_CONSTANTS,
} from '../../src/engine/stoichiometryEngine';
import {
  getFailureModeDetails,
  calculateFailureImpact,
  getAllFailureModes,
  FAILURE_MODE_DEFINITIONS,
} from '../../src/engine/failureModes';
import {
  SALICYLIC_ACID_3D,
  ACETIC_ANHYDRIDE_3D,
  PHOSPHORIC_ACID_3D,
  OXONIUM_ION_3D,
  ASPIRIN_3D,
  ACETIC_ACID_3D,
  WATER_3D,
  ASPIRIN_DIMER_3D,
  CPK_COLORS,
  CPK_SPHERE_RADII,
  CRYSTAL_LATTICE_CONSTANTS,
} from '../../src/engine/molecularData';
import { sanitizeStageId, SynthesisStageId, FailureMode } from '../../src/engine/types';

describe('Tier 5: White-Box Adversarial Hardening — Core Chemical Engines', () => {

  // =========================================================================
  // 1. REACTION KINETICS & ARRHENIUS RATE LAW ADVERSARIAL ANALYSIS
  // =========================================================================
  describe('1. Reaction Kinetics & Arrhenius Rate Law', () => {
    it('verifies Arrhenius rate at absolute zero limit (T = -273.15 C / 0 K)', () => {
      // Clamps temperatureK to Math.max(T + 273.15, 1.0) = 1.0 K
      // Exponent: -48500 / (8.3145 * 1.0) = -5833.18 -> exp(-5833) underflows strictly to 0
      const kZero = calculateArrheniusRateConstant(-273.15, 1.0);
      expect(kZero).toBe(0.0);
      expect(Number.isNaN(kZero)).toBe(false);
      expect(isFinite(kZero)).toBe(true);
    });

    it('defends against sub-absolute-zero inputs (T = -300 C, T = -500 C)', () => {
      const kDeepCryo1 = calculateArrheniusRateConstant(-300, 1.0);
      const kDeepCryo2 = calculateArrheniusRateConstant(-500, 1.0);
      expect(kDeepCryo1).toBe(0.0);
      expect(kDeepCryo2).toBe(0.0);
    });

    it('verifies Arrhenius rate at extreme pyrolytic limits (T = 500 C, 1000 C, 10000 C)', () => {
      const k500 = calculateArrheniusRateConstant(500, 1.0);
      const k1000 = calculateArrheniusRateConstant(1000, 1.0);
      const k10000 = calculateArrheniusRateConstant(10000, 1.0);

      // At T -> infinity, exp(-Ea / RT) -> 1, so k -> PRE_EXPONENTIAL_A (1.21e7)
      expect(k500).toBeGreaterThan(0);
      expect(k500).toBeLessThan(CHEMICAL_CONSTANTS.PRE_EXPONENTIAL_A);
      expect(k1000).toBeGreaterThan(k500);
      expect(k1000).toBeLessThan(CHEMICAL_CONSTANTS.PRE_EXPONENTIAL_A);
      // At 10,000 C (10273 K), Ea/RT = 48500/(8.3145*10273) = 0.5678, exp(-0.5678) = 0.5667 -> k ~ 6.86e6
      expect(k10000).toBeGreaterThan(6.0e6);
      expect(k10000).toBeLessThan(CHEMICAL_CONSTANTS.PRE_EXPONENTIAL_A);
      expect(isFinite(k10000)).toBe(true);
    });

    it('enforces strict Arrhenius monotonicity: k(T1) < k(T2) for all valid temperatures', () => {
      const temps = [-50, 0, 20, 40, 60, 75, 80, 85, 95, 120, 200];
      for (let i = 0; i < temps.length - 1; i++) {
        const k1 = calculateArrheniusRateConstant(temps[i]);
        const k2 = calculateArrheniusRateConstant(temps[i + 1]);
        expect(k1).toBeLessThan(k2);
      }
    });

    it('verifies nominal rate constant at reference temperature (80 C)', () => {
      const k80 = calculateArrheniusRateConstant(80, 1.0);
      // At 80 C (353.15 K): Ea = 48500, R = 8.3145, A = 1.21e7
      // exponent = -48500 / (8.3145 * 353.15) = -16.518 -> exp = 6.702e-8
      // k = 1.21e7 * 6.702e-8 = 0.811 L/(mol*min)
      expect(k80).toBeCloseTo(0.811, 2);
    });

    it('verifies catalyst concentration scaling and negative concentration clamping', () => {
      const kUncatalyzed = calculateArrheniusRateConstant(80, 0.0);
      expect(kUncatalyzed).toBe(0.0);

      const kNegativeCat = calculateArrheniusRateConstant(80, -2.5);
      expect(kNegativeCat).toBe(0.0);

      const kHalf = calculateArrheniusRateConstant(80, 0.5);
      const kStandard = calculateArrheniusRateConstant(80, 1.0);
      const kDouble = calculateArrheniusRateConstant(80, 2.0);

      expect(kHalf).toBeCloseTo(kStandard / 2, 5);
      expect(kDouble).toBeCloseTo(kStandard * 2, 5);
    });

    it('verifies reaction conversion X(t) bounds: strictly [0, 1] across all conditions', () => {
      // Time zero
      expect(calculateReactionConversion(80, 0)).toBe(0.0);
      // Negative time
      expect(calculateReactionConversion(80, -10)).toBe(0.0);

      // Standard reaction: 80 C, 15 min, [AA] = 10.6 M
      const x15 = calculateReactionConversion(80, 15);
      expect(x15).toBeGreaterThan(0.9999);
      expect(x15).toBeLessThanOrEqual(1.0);

      // Short reaction time: 20 C, 0.05 min (3 seconds) yields low conversion
      const xShort = calculateReactionConversion(20, 0.05);
      expect(xShort).toBeLessThan(0.05);
      expect(xShort).toBeGreaterThan(0.0);

      // Infinite time asymptote
      const xInf = calculateReactionConversion(80, 1e8);
      expect(xInf).toBe(1.0);

      // Zero acetic anhydride concentration
      const xZeroAA = calculateReactionConversion(80, 15, 0.0);
      expect(xZeroAA).toBe(0.0);

      // Negative acetic anhydride concentration
      const xNegAA = calculateReactionConversion(80, 15, -5.0);
      expect(xNegAA).toBe(0.0);
    });

    it('verifies exothermic quenching physics and zero/negative moles defense', () => {
      // Zero excess moles
      const qZero = calculateQuenchingReaction(0.0);
      expect(qZero.heatReleasedJ).toBe(0.0);
      expect(qZero.adiabaticTempRiseC).toBe(0.0);
      expect(qZero.aceticAcidProducedMoles).toBe(0.0);

      // Negative excess moles
      const qNeg = calculateQuenchingReaction(-0.05);
      expect(qNeg.heatReleasedJ).toBe(0.0);
      expect(qNeg.adiabaticTempRiseC).toBe(0.0);

      // Standard quenching: 0.0385 mol excess anhydride in 20 g solution
      const qNominal = calculateQuenchingReaction(0.0385, 20.0, 4.184);
      expect(qNominal.heatReleasedJ).toBeCloseTo(0.0385 * 56500, 1); // ~2175.25 J
      expect(qNominal.adiabaticTempRiseC).toBeCloseTo(2175.25 / (20 * 4.184), 1); // ~25.99 C
      expect(qNominal.aceticAcidProducedMoles).toBeCloseTo(0.0385 * 2, 4);

      // Zero solution mass defense: clamps mass to >= 1.0 g to prevent division by zero
      const qZeroMass = calculateQuenchingReaction(0.01, 0.0, 4.184);
      expect(isFinite(qZeroMass.adiabaticTempRiseC)).toBe(true);
      expect(qZeroMass.adiabaticTempRiseC).toBeGreaterThan(0);
    });

    it('validates all 5 mechanism steps: sequential IDs, formal charge deltas and hybridizations', () => {
      expect(MECHANISM_STEPS).toHaveLength(5);
      const expectedSteps = [
        '2a_protonation',
        '2b_nucleophilic_attack',
        '2c_proton_transfer',
        '2d_elimination',
        '2e_catalyst_regen',
      ];
      MECHANISM_STEPS.forEach((step, idx) => {
        expect(step.stepId).toBe(expectedSteps[idx]);
        expect(step.titleKo).toBeTruthy();
        expect(step.titleEn).toBeTruthy();
        expect(step.reactants.length).toBeGreaterThan(0);
        expect(step.products.length).toBeGreaterThan(0);
        expect(isFinite(step.electrophilicChargeDeltaPlus)).toBe(true);
      });

      // Oxonium ion must feature maximum electrophilic delta+ charge (+0.88)
      expect(MECHANISM_STEPS[0].electrophilicChargeDeltaPlus).toBe(0.88);
      expect(MECHANISM_STEPS[0].hybridization).toBe('sp2');

      // Tetrahedral intermediate must transition to sp3 hybridization
      expect(MECHANISM_STEPS[1].hybridization).toBe('sp3');
      expect(MECHANISM_STEPS[2].hybridization).toBe('sp3');

      // Final product must restore sp2 carbonyl hybridization and neutral charge delta+ 0.0
      expect(MECHANISM_STEPS[4].hybridization).toBe('sp2');
      expect(MECHANISM_STEPS[4].electrophilicChargeDeltaPlus).toBe(0.0);
    });

    it('validates stage definitions, temperature invariants and fallback retrieval', () => {
      for (let s = 1; s <= 6; s++) {
        const info = getStageInfo(s as SynthesisStageId);
        expect(info.id).toBe(s);
        expect(info.stepKey).toBeTruthy();
        expect(info.temperatureC).toBeGreaterThanOrEqual(0);
        expect(info.temperatureC).toBeLessThanOrEqual(100);
      }

      // Stage 3 strictly marked as metastable and non-precipitating
      expect(STAGE_DEFINITIONS[3].isMetastable).toBe(true);
      expect(STAGE_DEFINITIONS[3].isPrecipitating).toBe(false);

      // Stages 4 and 5 strictly marked as precipitating
      expect(STAGE_DEFINITIONS[4].isPrecipitating).toBe(true);
      expect(STAGE_DEFINITIONS[5].isPrecipitating).toBe(true);

      // Out of range fallbacks
      expect(getStageInfo(0 as any).id).toBe(1);
      expect(getStageInfo(99 as any).id).toBe(1);
      expect(getStageInfo(-5 as any).id).toBe(1);
    });
  });

  // =========================================================================
  // 2. THERMODYNAMICS, DIELECTRIC SURGE, JOUYBAN-ACREE & CNT ANALYSIS
  // =========================================================================
  describe('2. Thermodynamics, Dielectric Surge & Classical Nucleation Theory', () => {
    it('verifies bulk dielectric constant interpolation and temperature compensation', () => {
      // Zero total volume returns baseline AcOH dielectric (6.2)
      expect(calculateEffectiveDielectricConstant(0, 0, 0)).toBe(6.2);

      // Negative volumes clamped to 0
      expect(calculateEffectiveDielectricConstant(-5, -2, -1)).toBe(6.2);

      // Pure water at 4 C (88.0) vs 20 C (80.1) vs 50 C (69.6)
      expect(calculateEffectiveDielectricConstant(0, 0, 10, 4)).toBe(88.0);
      expect(calculateEffectiveDielectricConstant(0, 0, 10, 20)).toBe(80.1);
      expect(calculateEffectiveDielectricConstant(0, 0, 10, 50)).toBe(69.6);

      // Pure acetic acid (6.2) and pure acetic anhydride (20.7)
      expect(calculateEffectiveDielectricConstant(10, 0, 0)).toBe(6.2);
      expect(calculateEffectiveDielectricConstant(0, 10, 0)).toBe(20.7);

      // Stage 3 (3.2 mL AcOH + 3.5 mL AA) vs Stage 4 (+15 mL Water at 4 C)
      const epsStage3 = calculateEffectiveDielectricConstant(3.2, 3.5, 0.0, 4);
      const epsStage4 = calculateEffectiveDielectricConstant(3.2, 0.1, 15.0, 4);

      expect(epsStage3).toBeCloseTo(13.78, 1);
      expect(epsStage4).toBeCloseTo(73.33, 1);
      expect(epsStage4 / epsStage3).toBeGreaterThan(5.0); // Dielectric surge > 5x
    });

    it('verifies Jouyban-Acree solubility: organic vs aqueous contrast and excess parameter', () => {
      // Water fraction phi_w = 0.0 (pure acetic acid) at 4 C
      const cOrg4C = calculateEquilibriumSolubility(0.0, 4);
      expect(cOrg4C).toBeGreaterThan(18.0); // ~19.0 g/100 mL

      // Water fraction phi_w = 1.0 (pure water) at 4 C
      const cAq4C = calculateEquilibriumSolubility(1.0, 4);
      expect(cAq4C).toBeCloseTo(0.24, 1); // ~0.24 g/100 mL

      // Pure organic has > 70x higher solubility than pure water at 4 C
      expect(cOrg4C / cAq4C).toBeGreaterThan(70.0);

      // Clamping: phi_w < 0 clamps to 0, phi_w > 1 clamps to 1
      expect(calculateEquilibriumSolubility(-0.5, 4)).toBe(calculateEquilibriumSolubility(0.0, 4));
      expect(calculateEquilibriumSolubility(1.5, 4)).toBe(calculateEquilibriumSolubility(1.0, 4));

      // Temperature effect: hot 80 C organic vs chilled 4 C organic
      const cOrg80C = calculateEquilibriumSolubility(0.0, 80);
      expect(cOrg80C).toBeGreaterThan(cOrg4C * 2.5); // Steep dissolution in warm bath
    });

    it('verifies Jouyban-Acree solubility under extreme temperatures (T = -50 C to 500 C)', () => {
      // Sub-zero clamped to 273.15 K (0 C)
      const cSubZero = calculateEquilibriumSolubility(0.5, -50);
      const cZero = calculateEquilibriumSolubility(0.5, 0);
      expect(cSubZero).toBe(cZero);

      // High pyrolytic temperature: 500 C
      const cHighT = calculateEquilibriumSolubility(0.5, 500);
      expect(isFinite(cHighT)).toBe(true);
      expect(cHighT).toBeGreaterThan(cZero);
      expect(cHighT).toBeGreaterThanOrEqual(0.05);
    });

    it('handles Classical Nucleation Theory (CNT) singularity at S <= 1.01 (barrier protection)', () => {
      // Sub-saturated (S = 0.5)
      const cntSub = calculateCntParameters(0.5, 4);
      expect(cntSub.reducedBarrier).toBe(65.2);
      expect(cntSub.criticalRadiusNm).toBe(15.0);
      expect(cntSub.nucleationRateJ).toBe(0.0);

      // Exact saturation (S = 1.00)
      const cntSat = calculateCntParameters(1.0, 4);
      expect(cntSat.reducedBarrier).toBe(65.2);
      expect(cntSat.criticalRadiusNm).toBe(15.0);
      expect(cntSat.nucleationRateJ).toBe(0.0);

      // Negative supersaturation (S = -2.0)
      const cntNeg = calculateCntParameters(-2.0, 4);
      expect(cntNeg.reducedBarrier).toBe(65.2);
      expect(cntNeg.nucleationRateJ).toBe(0.0);
    });

    it('verifies CNT barrier collapse and explosive nucleation rate at high supersaturation (S = 20 vs S = 1000)', () => {
      // Metastable baseline (S = 1.15 at 4 C)
      const cntMeta = calculateCntParameters(1.15, 4);
      expect(cntMeta.reducedBarrier).toBeCloseTo(62.44, 1);
      expect(cntMeta.nucleationRateJ).toBe(0.0); // Metastable: homogeneous nucleation halted

      // Antisolvent burst (S = 20.08 at 4 C)
      const cntBurst = calculateCntParameters(20.08, 4);
      expect(cntBurst.reducedBarrier).toBeCloseTo(0.14, 1);
      // Barrier collapses by > 400x
      expect(cntMeta.reducedBarrier / cntBurst.reducedBarrier).toBeGreaterThan(400);
      // Nucleation rate explodes to astronomical scale (> 1e29 m^-3 s^-1)
      expect(cntBurst.nucleationRateJ).toBeGreaterThan(1e29);
      expect(cntBurst.criticalRadiusNm).toBeLessThan(1.0);

      // Extreme supersaturation shock (S = 1000.0)
      const cntExtreme = calculateCntParameters(1000.0, 4);
      expect(cntExtreme.reducedBarrier).toBeLessThan(0.05);
      expect(cntExtreme.criticalRadiusNm).toBe(0.2); // Clamped to physical minimum 0.2 nm
      expect(cntExtreme.nucleationRateJ).toBeGreaterThan(9.0e29);
      expect(cntExtreme.nucleationRateJ).toBeLessThanOrEqual(THERMO_CONSTANTS.J0_KINETIC_FACTOR);
      expect(isFinite(cntExtreme.barrierJoules)).toBe(true);
    });

    it('verifies full stage thermodynamic state machine across all 6 stages', () => {
      // Stage 1: Reagents Dispensing
      const s1 = calculateThermodynamicState(1);
      expect(s1.temperatureC).toBe(20);
      expect(s1.isMetastable).toBe(false);
      expect(s1.isPrecipitating).toBe(false);

      // Stage 2: Hot Water Bath Heating (80 C)
      const s2 = calculateThermodynamicState(2);
      expect(s2.temperatureC).toBe(80);
      expect(s2.supersaturation).toBeLessThan(1.0); // Undersaturated, fully dissolved

      // Stage 3: Ice-Water 1st Cooling (4 C, Metastable Zone)
      const s3 = calculateThermodynamicState(3);
      expect(s3.temperatureC).toBe(4);
      expect(s3.isMetastable).toBe(true);
      expect(s3.isPrecipitating).toBe(false);
      expect(s3.supersaturation).toBe(1.15);
      expect(s3.relativeBarrierRatio).toBeCloseTo(0.97, 1);

      // Stage 4: Distilled Water Antisolvent Shock (4 C, Rapid Crystal Burst)
      const s4 = calculateThermodynamicState(4);
      expect(s4.temperatureC).toBe(4);
      expect(s4.isMetastable).toBe(false);
      expect(s4.isPrecipitating).toBe(true);
      expect(s4.isSpinodalBurst).toBe(true);
      expect(s4.supersaturation).toBeGreaterThan(15.0);
      expect(s4.relativeBarrierRatio).toBeLessThan(0.01); // 460-fold collapse

      // Stage 5: Crystal Maturation & Quenching (2 C)
      const s5 = calculateThermodynamicState(5);
      expect(s5.temperatureC).toBe(2);
      expect(s5.isPrecipitating).toBe(true);
      expect(s5.isSpinodalBurst).toBe(false);

      // Stage 6: Vacuum Filtration & Cold Wash (2 C)
      const s6 = calculateThermodynamicState(6);
      expect(s6.temperatureC).toBe(2);
      expect(s6.isPrecipitating).toBe(false);
    });

    it('verifies failure mode overrides on thermodynamic state', () => {
      // EARLY_WATER: 0% aspirin concentration, zero supersaturation, no precipitation
      const sEarlyWater = calculateThermodynamicState(4, 'EARLY_WATER');
      expect(sEarlyWater.actualConcentrationGPer100Ml).toBe(0.0);
      expect(sEarlyWater.supersaturation).toBe(0.0);
      expect(sEarlyWater.isPrecipitating).toBe(false);
      expect(sEarlyWater.isSpinodalBurst).toBe(false);
      expect(sEarlyWater.relativeBarrierRatio).toBe(1.0);

      // OVERHEATING: elevated 95 C, low supersaturation 0.2, tar/no crystallization
      const sOverheating = calculateThermodynamicState(4, 'OVERHEATING');
      expect(sOverheating.temperatureC).toBe(95);
      expect(sOverheating.supersaturation).toBe(0.2);
      expect(sOverheating.isPrecipitating).toBe(false);

      // WARM_WASH: at stage 6, warm 25 C wash elevates solubility to 3.3 g/100 mL
      const sWarmWash = calculateThermodynamicState(6, 'WARM_WASH');
      expect(sWarmWash.temperatureC).toBe(25);
      expect(sWarmWash.solubilityGPer100Ml).toBe(3.3);
      expect(sWarmWash.supersaturation).toBe(0.4);
    });

    it('verifies sanitizeStageId defenses against all malformed inputs', () => {
      expect(sanitizeStageId(null)).toBe(1);
      expect(sanitizeStageId(undefined)).toBe(1);
      expect(sanitizeStageId(NaN)).toBe(1);
      expect(sanitizeStageId(Infinity)).toBe(1);
      expect(sanitizeStageId(-Infinity)).toBe(1);
      expect(sanitizeStageId('invalid')).toBe(1);
      expect(sanitizeStageId(-10)).toBe(1);
      expect(sanitizeStageId(0)).toBe(1);
      expect(sanitizeStageId(7)).toBe(6);
      expect(sanitizeStageId(100)).toBe(6);
      expect(sanitizeStageId(3.4)).toBe(3);
      expect(sanitizeStageId(3.6)).toBe(4);
      expect(sanitizeStageId('5')).toBe(5);
    });
  });

  // =========================================================================
  // 3. STOICHIOMETRY ENGINE & 8-TIER DIAGNOSTIC RUBRIC ADVERSARIAL ANALYSIS
  // =========================================================================
  describe('3. Stoichiometry Engine, Limiting Reagent & Diagnostic Rubric', () => {
    it('verifies standard student inputs (2.00 g SA, 5.00 mL AA)', () => {
      const res = calculateStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00,
        actualYieldG: 2.20,
      });

      // SA: 2.00 / 138.121 = 0.01448 mol
      expect(res.salicylicAcidMoles).toBeCloseTo(0.01448, 5);
      // AA: (5.00 * 1.082) / 102.089 = 0.05299 mol
      expect(res.aceticAnhydrideMassG).toBeCloseTo(5.410, 3);
      expect(res.aceticAnhydrideMoles).toBeCloseTo(0.05299, 5);

      // Limiting reagent: Salicylic Acid (1:1 stoichiometry)
      expect(res.limitingReagent).toBe('SALICYLIC_ACID');
      expect(res.limitingReagentMoles).toBeCloseTo(0.01448, 5);
      expect(res.excessReagentPercent).toBeGreaterThan(260.0); // ~265.9% excess AA

      // Theoretical yield: 0.01448 * 180.158 = 2.6087 g
      expect(res.theoreticalYieldG).toBeCloseTo(2.6087, 3);

      // Actual yield: 2.20 g -> (2.20 / 2.6087) * 100 = 84.33%
      expect(res.percentYield).toBeCloseTo(84.33, 1);
      expect(res.feedbackCategory).toBe('EXCELLENT');
      expect(res.diagnostic.category).toBe('NORMAL_TYPICAL');
    });


    it('verifies inverted excess condition where Acetic Anhydride is limiting', () => {
      // 10.00 g SA (0.0724 mol) + 1.00 mL AA (0.0106 mol)
      const res = calculateStoichiometry({
        salicylicAcidMassG: 10.00,
        aceticAnhydrideVolMl: 1.00,
      });

      expect(res.salicylicAcidMoles).toBeCloseTo(0.07240, 5);
      expect(res.aceticAnhydrideMoles).toBeCloseTo(0.01060, 5);
      expect(res.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(res.limitingReagentName).toBe('Acetic Anhydride');
      expect(res.limitingReagentMoles).toBeCloseTo(0.01060, 5);
      expect(res.excessReagentPercent).toBeGreaterThan(500.0); // SA excess > 500%
      expect(res.theoreticalYieldG).toBeCloseTo(0.01060 * 180.158, 2);
    });

    it('verifies equimolar stoichiometric equivalence point (0.0% excess)', () => {
      // 1.38121 g SA = 0.01000 mol
      // V_AA = (0.01000 * 102.089) / 1.082 = 0.943521257 mL
      // When V_AA is slightly below exact (0.94352 mL), AA is limiting (~0.0% excess)
      const resAA = calculateStoichiometry({
        salicylicAcidMassG: 1.38121,
        aceticAnhydrideVolMl: 0.94352,
      });

      expect(resAA.salicylicAcidMoles).toBeCloseTo(0.01000, 5);
      expect(resAA.aceticAnhydrideMoles).toBeCloseTo(0.01000, 5);
      expect(resAA.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(resAA.excessReagentPercent).toBeCloseTo(0.0, 1);
      expect(resAA.theoreticalYieldG).toBeCloseTo(1.8016, 3);

      // When V_AA is slightly above exact (0.94353 mL), SA is limiting (~0.0% excess)
      const resSA = calculateStoichiometry({
        salicylicAcidMassG: 1.38121,
        aceticAnhydrideVolMl: 0.94353,
      });
      expect(resSA.limitingReagent).toBe('SALICYLIC_ACID');
      expect(resSA.excessReagentPercent).toBeCloseTo(0.0, 1);
      expect(resSA.theoreticalYieldG).toBeCloseTo(1.8016, 3);
    });

    it('defends against zero and negative inputs', () => {
      // Zero SA mass
      const resZeroSA = calculateStoichiometry({
        salicylicAcidMassG: 0.0,
        aceticAnhydrideVolMl: 5.0,
      });
      expect(resZeroSA.salicylicAcidMoles).toBe(0.0);
      expect(resZeroSA.limitingReagent).toBe('SALICYLIC_ACID');
      expect(resZeroSA.theoreticalYieldG).toBe(0.0);

      // Zero AA vol
      const resZeroAA = calculateStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 0.0,
      });
      expect(resZeroAA.aceticAnhydrideMoles).toBe(0.0);
      expect(resZeroAA.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(resZeroAA.theoreticalYieldG).toBe(0.0);

      // Both zero
      const resBothZero = calculateStoichiometry({
        salicylicAcidMassG: 0.0,
        aceticAnhydrideVolMl: 0.0,
      });
      expect(resBothZero.theoreticalYieldG).toBe(0.0);

      // Negative inputs clamped
      const resNeg = calculateStoichiometry({
        salicylicAcidMassG: -10.0,
        aceticAnhydrideVolMl: -5.0,
      });
      expect(resNeg.salicylicAcidMoles).toBe(0.0);
      expect(resNeg.aceticAnhydrideMoles).toBe(0.0);
      expect(resNeg.theoreticalYieldG).toBe(0.0);
    });

    it('verifies scale resolution boundaries: sub-milligram rounding vs small-scale resolution', () => {
      // Small-scale inputs (0.01 g SA, 0.01 mL AA) above 5-decimal place threshold (7.24e-5 mol)
      const resSmall = calculateStoichiometry({
        salicylicAcidMassG: 0.01,
        aceticAnhydrideVolMl: 0.01,
      });
      expect(resSmall.salicylicAcidMoles).toBe(0.00007);
      expect(resSmall.theoreticalYieldG).toBeGreaterThan(0);
      expect(isFinite(resSmall.theoreticalYieldG)).toBe(true);

      // Micro-scale inputs (0.0001 g SA) underflow 5-decimal place display precision (7.24e-7 mol -> 0.00000)
      const resMicro = calculateStoichiometry({
        salicylicAcidMassG: 0.0001,
        aceticAnhydrideVolMl: 0.0001,
      });
      expect(resMicro.salicylicAcidMoles).toBe(0.0);
      expect(resMicro.theoreticalYieldG).toBe(0.0001);
    });

    it('validates complete 8-tier diagnostic rubric boundary transitions', () => {
      const theo = 2.6087;

      // Tier 1: Negative yield (< 0) -> INVALID_INPUT, CRITICAL_ERROR
      const t1 = evaluateYieldDiagnostic(-0.5, theo, -19.16);
      expect(t1.diagnostic.category).toBe('INVALID_INPUT');
      expect(t1.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 2: Exactly zero yield (0.0 g) -> ZERO_YIELD, CRITICAL_ERROR
      const t2 = evaluateYieldDiagnostic(0.0, theo, 0.0);
      expect(t2.diagnostic.category).toBe('ZERO_YIELD');
      expect(t2.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 3: 0.0% < Y < 20.0% (e.g. 15.0%) -> CRITICAL_FAILURE, CRITICAL_ERROR
      const t3 = evaluateYieldDiagnostic(0.39, theo, 15.0);
      expect(t3.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(t3.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 3 to 4 boundary: 19.9% vs 20.0%
      const t3_bound = evaluateYieldDiagnostic(0.519, theo, 19.9);
      const t4_bound = evaluateYieldDiagnostic(0.522, theo, 20.0);
      expect(t3_bound.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(t4_bound.diagnostic.category).toBe('SEVERE_LOSS');
      expect(t4_bound.feedbackCategory).toBe('WASH_LOSS');

      // Tier 4 to 5 boundary: 49.9% vs 50.0%
      const t4_high = evaluateYieldDiagnostic(1.30, theo, 49.9);
      const t5_low = evaluateYieldDiagnostic(1.304, theo, 50.0);
      expect(t4_high.diagnostic.category).toBe('SEVERE_LOSS');
      expect(t5_low.diagnostic.category).toBe('MODERATE_LOSS');
      expect(t5_low.feedbackCategory).toBe('PARTIAL_CONVERSION');

      // Tier 5 to 6 boundary: 69.9% vs 70.0%
      const t5_high = evaluateYieldDiagnostic(1.82, theo, 69.9);
      const t6_low = evaluateYieldDiagnostic(1.826, theo, 70.0);
      expect(t5_high.diagnostic.category).toBe('MODERATE_LOSS');
      expect(t6_low.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(t6_low.feedbackCategory).toBe('EXCELLENT');

      // Tier 6 to 7 boundary: 89.9% vs 90.0%
      const t6_high = evaluateYieldDiagnostic(2.345, theo, 89.9);
      const t7_low = evaluateYieldDiagnostic(2.348, theo, 90.0);
      expect(t6_high.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(t7_low.diagnostic.category).toBe('EXCELLENT');
      expect(t7_low.feedbackCategory).toBe('EXCELLENT');

      // Tier 7 to 8 boundary: 105.0% vs 105.1%
      const t7_high = evaluateYieldDiagnostic(2.739, theo, 105.0);
      const t8_low = evaluateYieldDiagnostic(2.742, theo, 105.1);
      expect(t7_high.diagnostic.category).toBe('EXCELLENT');
      expect(t8_low.diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(t8_low.feedbackCategory).toBe('HIGH_MOISTURE');

      // Tier 8 extreme excess (>500%)
      const t8_extreme = evaluateYieldDiagnostic(15.0, theo, 575.0);
      expect(t8_extreme.diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(t8_extreme.feedbackCategory).toBe('HIGH_MOISTURE');

      // Awaiting measurement case (undefined input)
      const tAwait = evaluateYieldDiagnostic(undefined, theo, undefined);
      expect(tAwait.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(tAwait.diagnostic.title).toContain('대기');
    });
  });

  // =========================================================================
  // 4. FAILURE MODE ENGINE & FECL3 SPECTROPHOTOMETRIC STATE MACHINE
  // =========================================================================
  describe('4. Failure Mode Engine & FeCl3 Analytical Test State Machine', () => {
    it('verifies all 4 failure mode definitions and analytical color codes', () => {
      const allModes = getAllFailureModes();
      expect(allModes).toHaveLength(4);

      // NONE: Control
      const fNone = getFailureModeDetails('NONE');
      expect(fNone.feCl3TestResult).toBe('BUFF_NEGATIVE');
      expect(fNone.feCl3ColorHex).toBe('#EAB308');
      expect(fNone.expectedYieldPercentRange).toEqual([82.0, 88.0]);

      // EARLY_WATER: Violet positive ([Fe(salicylate)3]3-)
      const fEarlyWater = getFailureModeDetails('EARLY_WATER');
      expect(fEarlyWater.feCl3TestResult).toBe('VIOLET_POSITIVE');
      expect(fEarlyWater.feCl3ColorHex).toBe('#7E22CE');
      expect(fEarlyWater.triggerStage).toBe(2);
      expect(fEarlyWater.expectedYieldPercentRange).toEqual([0.0, 5.0]);

      // OVERHEATING: Pitch tar
      const fOverheat = getFailureModeDetails('OVERHEATING');
      expect(fOverheat.feCl3TestResult).toBe('TAR_INCONCLUSIVE');
      expect(fOverheat.feCl3ColorHex).toBe('#451A03');
      expect(fOverheat.expectedYieldPercentRange).toEqual([5.0, 20.0]);

      // WARM_WASH: Wash loss
      const fWarmWash = getFailureModeDetails('WARM_WASH');
      expect(fWarmWash.feCl3TestResult).toBe('BUFF_NEGATIVE');
      expect(fWarmWash.triggerStage).toBe(6);
      expect(fWarmWash.expectedYieldPercentRange).toEqual([30.0, 45.0]);

      // Fallback for unrecognized mode
      expect(getFailureModeDetails('UNKNOWN_MODE' as FailureMode).mode).toBe('NONE');
    });

    it('calculates failure impact on yields and fatality status', () => {
      const theo = 2.6087;

      const iNone = calculateFailureImpact('NONE', theo);
      expect(iNone.isFatal).toBe(false);
      expect(iNone.simulatedPercentYield).toBe(85.0);
      expect(iNone.simulatedYieldG).toBeCloseTo((theo * 85.0) / 100, 3);

      const iEarly = calculateFailureImpact('EARLY_WATER', theo);
      expect(iEarly.isFatal).toBe(true);
      expect(iEarly.simulatedPercentYield).toBe(2.5);
      expect(iEarly.simulatedYieldG).toBeCloseTo((theo * 2.5) / 100, 3);
      expect(iEarly.feCl3TestResult).toBe('VIOLET_POSITIVE');

      const iOverheat = calculateFailureImpact('OVERHEATING', theo);
      expect(iOverheat.isFatal).toBe(true);
      expect(iOverheat.simulatedPercentYield).toBe(12.5);

      const iWarmWash = calculateFailureImpact('WARM_WASH', theo);
      expect(iWarmWash.isFatal).toBe(false);
      expect(iWarmWash.simulatedPercentYield).toBe(37.5);
      expect(iWarmWash.feCl3TestResult).toBe('BUFF_NEGATIVE');
    });
  });

  // =========================================================================
  // 5. MOLECULAR DATA, 3D GEOMETRIES & CRYSTAL LATTICE INVARIANTS
  // =========================================================================
  describe('5. Molecular Data, CPK Geometries & Monoclinic Form I Lattice Invariants', () => {
    const molecules = [
      SALICYLIC_ACID_3D,
      ACETIC_ANHYDRIDE_3D,
      PHOSPHORIC_ACID_3D,
      OXONIUM_ION_3D,
      ASPIRIN_3D,
      ACETIC_ACID_3D,
      WATER_3D,
      ASPIRIN_DIMER_3D,
    ];

    it('enforces strict topological bond referential integrity across all 8 molecular models', () => {
      // Invariant: Every bond must reference atom IDs that strictly exist within that molecule's atoms array
      molecules.forEach((mol) => {
        const atomIdSet = new Set(mol.atoms.map((a) => a.id));
        expect(atomIdSet.size).toBe(mol.atoms.length); // All atom IDs must be strictly unique

        mol.bonds.forEach((bond) => {
          expect(
            atomIdSet.has(bond.atom1Id),
            `Molecule ${mol.name} has dangling bond atom1Id: ${bond.atom1Id}`
          ).toBe(true);
          expect(
            atomIdSet.has(bond.atom2Id),
            `Molecule ${mol.name} has dangling bond atom2Id: ${bond.atom2Id}`
          ).toBe(true);
          expect([1.0, 1.5, 2.0]).toContain(bond.order);
        });
      });
    });

    it('enforces finite 3D coordinates, CPK color standard and sphere radii', () => {
      molecules.forEach((mol) => {
        mol.atoms.forEach((atom) => {
          expect(atom.pos).toHaveLength(3);
          atom.pos.forEach((coord) => {
            expect(isFinite(coord)).toBe(true);
            expect(Number.isNaN(coord)).toBe(false);
          });
          expect(Object.keys(CPK_COLORS)).toContain(atom.element);
          expect(atom.radius).toBeGreaterThan(0.1);
          expect(atom.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });

    it('validates Aspirin Centrosymmetric Dimer R_2^2(8) crystal synthon structure', () => {
      // Aspirin dimer has 42 atoms (21 x 2) and exactly 2 intermolecular hydrogen bonds
      expect(ASPIRIN_DIMER_3D.atoms).toHaveLength(42);

      const hBonds = ASPIRIN_DIMER_3D.bonds.filter((b) => b.type === 'hydrogen');
      expect(hBonds).toHaveLength(2);

      // Verify the twin hydrogen bond connectivity: O1_m1 ... O2_m2 and O1_m2 ... O2_m1
      expect(hBonds).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ atom1Id: 'ASA_O1_m1', atom2Id: 'ASA_O2_m2', type: 'hydrogen' }),
          expect.objectContaining({ atom1Id: 'ASA_O1_m2', atom2Id: 'ASA_O2_m1', type: 'hydrogen' }),
        ])
      );
    });

    it('validates Monoclinic Form I crystal lattice crystallography parameters', () => {
      expect(CRYSTAL_LATTICE_CONSTANTS.SPACE_GROUP).toBe('P2_1/c');
      expect(CRYSTAL_LATTICE_CONSTANTS.A_ANGSTROM).toBe(11.45);
      expect(CRYSTAL_LATTICE_CONSTANTS.B_ANGSTROM).toBe(6.60);
      expect(CRYSTAL_LATTICE_CONSTANTS.C_ANGSTROM).toBe(11.39);
      expect(CRYSTAL_LATTICE_CONSTANTS.BETA_DEG).toBe(95.6);
      expect(CRYSTAL_LATTICE_CONSTANTS.Z_MOLECULES).toBe(4);
      expect(CRYSTAL_LATTICE_CONSTANTS.FAST_GROWTH_AXIS).toContain('[001]');
    });
  });

  // =========================================================================
  // 6. HIGH-THROUGHPUT MONTE CARLO FUZZING & CHAOS MONKEY STRESS
  // =========================================================================
  describe('6. High-Throughput Monte Carlo Fuzzing & Numerical Chaos Stress', () => {
    it('survives 1,000 randomized iterations of Arrhenius rate evaluation without NaN/Infinity', () => {
      for (let i = 0; i < 1000; i++) {
        const randTemp = Math.random() * 800 - 300; // -300 C to +500 C
        const randCat = Math.random() * 20 - 5;     // -5.0 to +15.0
        const k = calculateArrheniusRateConstant(randTemp, randCat);

        expect(isFinite(k)).toBe(true);
        expect(Number.isNaN(k)).toBe(false);
        expect(k).toBeGreaterThanOrEqual(0.0);
      }
    });

    it('survives 1,000 randomized iterations of Jouyban-Acree solubility calculation', () => {
      for (let i = 0; i < 1000; i++) {
        const randPhi = Math.random() * 4 - 1.5;   // -1.5 to +2.5
        const randTemp = Math.random() * 400 - 50; // -50 C to +350 C
        const cStar = calculateEquilibriumSolubility(randPhi, randTemp);

        expect(isFinite(cStar)).toBe(true);
        expect(Number.isNaN(cStar)).toBe(false);
        expect(cStar).toBeGreaterThanOrEqual(0.05); // Absolute minimum solubility clamp
      }
    });

    it('survives 1,000 randomized iterations of Classical Nucleation Theory (CNT) parameters', () => {
      for (let i = 0; i < 1000; i++) {
        const randS = Math.random() * 2000 - 50;   // -50 to +1950 supersaturation
        const randTemp = Math.random() * 150 - 50; // -50 C to +100 C
        const cnt = calculateCntParameters(randS, randTemp);

        expect(isFinite(cnt.criticalRadiusNm)).toBe(true);
        expect(isFinite(cnt.barrierJoules)).toBe(true);
        expect(isFinite(cnt.reducedBarrier)).toBe(true);
        expect(isFinite(cnt.nucleationRateJ)).toBe(true);

        expect(cnt.criticalRadiusNm).toBeGreaterThanOrEqual(0.2);
        expect(cnt.criticalRadiusNm).toBeLessThanOrEqual(50.0);
        expect(cnt.barrierJoules).toBeGreaterThanOrEqual(1e-25);
        expect(cnt.nucleationRateJ).toBeGreaterThanOrEqual(0.0);
      }
    });

    it('survives 1,000 randomized iterations of Stoichiometry calculations', () => {
      for (let i = 0; i < 1000; i++) {
        const randSa = Math.random() * 200 - 50;    // -50 g to +150 g
        const randAa = Math.random() * 200 - 50;    // -50 mL to +150 mL
        const randYield = Math.random() * 300 - 50; // -50 g to +250 g

        const res = calculateStoichiometry({
          salicylicAcidMassG: randSa,
          aceticAnhydrideVolMl: randAa,
          actualYieldG: randYield,
        });

        expect(isFinite(res.salicylicAcidMoles)).toBe(true);
        expect(isFinite(res.aceticAnhydrideMoles)).toBe(true);
        expect(isFinite(res.limitingReagentMoles)).toBe(true);
        expect(isFinite(res.theoreticalYieldG)).toBe(true);
        expect(res.theoreticalYieldG).toBeGreaterThanOrEqual(0.0);
        expect(['SALICYLIC_ACID', 'ACETIC_ANHYDRIDE']).toContain(res.limitingReagent);
        expect(res.diagnostic).toBeDefined();
        expect(res.feedbackCategory).toBeDefined();
      }
    });
  });
});
