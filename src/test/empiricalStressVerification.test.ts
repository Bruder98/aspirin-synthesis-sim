/**
 * Challenger 1 (Milestone 1) - Empirical Verification & Stress Test Suite
 * Target Modules:
 *  - src/engine/thermodynamics.ts
 *  - src/engine/reactionKinetics.ts
 *  - src/engine/stoichiometryEngine.ts
 *
 * Requirements Tested:
 * 1. Boundary values: 0g, negative inputs, extreme masses (1000g), extreme volumes (1000mL), limiting reagent inversion.
 * 2. Temperature extremes (-10°C to 120°C).
 * 3. CNT barrier calculation: verify Delta G* collapse behavior and avoid division by zero when S <= 1.
 * 4. Thermodynamic bounds, permittivity limits, and mass conservation.
 * 5. Monte Carlo randomized property sweeps (1,000 iterations) for numerical stability (no NaN, no Infinity).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCntParameters,
  calculateEffectiveDielectricConstant,
  calculateEquilibriumSolubility,
  calculateThermodynamicState,
  MOLECULAR_VOLUME_VM,
  THERMO_CONSTANTS
} from '../engine/thermodynamics';
import {
  calculateArrheniusRateConstant,
  calculateQuenchingReaction,
  calculateReactionConversion,
  CHEMICAL_CONSTANTS,
  getStageInfo,
  STAGE_DEFINITIONS
} from '../engine/reactionKinetics';
import {
  calculateStoichiometry,
  evaluateYieldDiagnostic,
  STOICHIOMETRY_CONSTANTS
} from '../engine/stoichiometryEngine';

describe('CHALLENGER 1: Milestone 1 Empirical Stress Verification Suite', () => {

  // =========================================================================
  // SECTION 1: Stoichiometry Engine Boundary Values & Limiting Reagent
  // =========================================================================
  describe('1. Stoichiometry Engine Boundary & Extreme Inputs', () => {

    it('handles exact zero inputs (0g SA, 0mL AA) with strict numerical stability', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 0,
        aceticAnhydrideVolMl: 0
      });

      expect(result.salicylicAcidMoles).toBe(0);
      expect(result.aceticAnhydrideMassG).toBe(0);
      expect(result.aceticAnhydrideMoles).toBe(0);
      expect(result.limitingReagentMoles).toBe(0);
      expect(result.excessReagentPercent).toBe(0);
      expect(result.theoreticalYieldMoles).toBe(0);
      expect(result.theoreticalYieldG).toBe(0);
      expect(result.percentYield).toBeUndefined();

      // Ensure no NaNs exist in any numeric property
      expect(Number.isNaN(result.salicylicAcidMoles)).toBe(false);
      expect(Number.isNaN(result.aceticAnhydrideMassG)).toBe(false);
      expect(Number.isNaN(result.aceticAnhydrideMoles)).toBe(false);
      expect(Number.isNaN(result.theoreticalYieldG)).toBe(false);
    });

    it('safely clamps negative masses and volumes to zero without throws', () => {
      const negativeCases = [
        { sa: -1.0, aa: 5.0 },
        { sa: 2.0, aa: -5.0 },
        { sa: -100.0, aa: -50.0 },
        { sa: -0.00001, aa: -0.00001 }
      ];

      for (const tc of negativeCases) {
        const result = calculateStoichiometry({
          salicylicAcidMassG: tc.sa,
          aceticAnhydrideVolMl: tc.aa
        });

        expect(result.salicylicAcidMoles).toBeGreaterThanOrEqual(0);
        expect(result.aceticAnhydrideMoles).toBeGreaterThanOrEqual(0);
        expect(result.theoreticalYieldG).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(result.theoreticalYieldG)).toBe(true);
      }
    });

    it('evaluates extreme industrial macro scale (1000g SA, 1000mL AA)', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 1000.0,
        aceticAnhydrideVolMl: 1000.0
      });

      // SA: 1000 / 138.121 = 7.239999... mol
      // AA: (1000 * 1.082) / 102.089 = 10.598595... mol
      expect(result.salicylicAcidMoles).toBeCloseTo(7.2400, 3);
      expect(result.aceticAnhydrideMoles).toBeCloseTo(10.5986, 3);
      expect(result.limitingReagent).toBe('SALICYLIC_ACID');
      expect(result.limitingReagentMoles).toBeCloseTo(7.2400, 3);

      // Theoretical yield = 7.2400 * 180.158 = 1304.34 g
      expect(result.theoreticalYieldG).toBeCloseTo(1304.34, 1);
      expect(Number.isFinite(result.theoreticalYieldG)).toBe(true);
    });

    it('verifies limiting reagent inversion across stoichiometric transition point', () => {
      // Nominal standard: 2.00 g SA + 5.00 mL AA -> SA is limiting
      const resStandard = calculateStoichiometry({
        salicylicAcidMassG: 2.00,
        aceticAnhydrideVolMl: 5.00
      });
      expect(resStandard.limitingReagent).toBe('SALICYLIC_ACID');
      expect(resStandard.limitingReagentName).toBe('Salicylic Acid');
      expect(resStandard.excessReagentPercent).toBeGreaterThan(200);

      // Inversion: 10.00 g SA + 1.00 mL AA -> AA is limiting
      const resInverted = calculateStoichiometry({
        salicylicAcidMassG: 10.00,
        aceticAnhydrideVolMl: 1.00
      });
      expect(resInverted.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(resInverted.limitingReagentName).toBe('Acetic Anhydride');
      expect(resInverted.limitingReagentMoles).toBeCloseTo((1.0 * 1.082) / 102.089, 4);

      // Exact equimolar test: 0.1 mol SA (13.8121 g) and 0.1 mol AA (10.2089 g -> 9.43521 mL)
      const resEquimolar = calculateStoichiometry({
        salicylicAcidMassG: 13.8121,
        aceticAnhydrideVolMl: 10.2089 / 1.082
      });
      expect(resEquimolar.salicylicAcidMoles).toBeCloseTo(0.1, 4);
      expect(resEquimolar.aceticAnhydrideMoles).toBeCloseTo(0.1, 4);
      expect(resEquimolar.excessReagentPercent).toBeCloseTo(0.0, 1);
      expect(resEquimolar.theoreticalYieldG).toBeCloseTo(18.0158, 2);
    });

    it('strictly tests 8-tier diagnostic rubric boundary transitions', () => {
      const theo = 2.6087;

      // 1. Negative yield -> INVALID_INPUT
      expect(evaluateYieldDiagnostic(-0.01, theo, -0.38).diagnostic.category).toBe('INVALID_INPUT');

      // 2. Exactly zero yield -> ZERO_YIELD
      expect(evaluateYieldDiagnostic(0.0, theo, 0.0).diagnostic.category).toBe('ZERO_YIELD');

      // 3. Sub-20% yield -> CRITICAL_FAILURE (19.99%)
      expect(evaluateYieldDiagnostic(0.5215, theo, 19.99).diagnostic.category).toBe('CRITICAL_FAILURE');

      // 4. Boundary 20.00% -> SEVERE_LOSS
      expect(evaluateYieldDiagnostic(0.5217, theo, 20.00).diagnostic.category).toBe('SEVERE_LOSS');
      expect(evaluateYieldDiagnostic(1.3040, theo, 49.99).diagnostic.category).toBe('SEVERE_LOSS');

      // 5. Boundary 50.00% -> MODERATE_LOSS
      expect(evaluateYieldDiagnostic(1.3044, theo, 50.00).diagnostic.category).toBe('MODERATE_LOSS');
      expect(evaluateYieldDiagnostic(1.8258, theo, 69.99).diagnostic.category).toBe('MODERATE_LOSS');

      // 6. Boundary 70.00% -> NORMAL_TYPICAL
      expect(evaluateYieldDiagnostic(1.8261, theo, 70.00).diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(evaluateYieldDiagnostic(2.3475, theo, 89.99).diagnostic.category).toBe('NORMAL_TYPICAL');

      // 7. Boundary 90.00% to 105.00% -> EXCELLENT
      expect(evaluateYieldDiagnostic(2.3478, theo, 90.00).diagnostic.category).toBe('EXCELLENT');
      expect(evaluateYieldDiagnostic(2.7391, theo, 105.00).diagnostic.category).toBe('EXCELLENT');

      // 8. Greater than 105.00% -> MOISTURE_EXCESS
      expect(evaluateYieldDiagnostic(2.7394, theo, 105.01).diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(evaluateYieldDiagnostic(10.0, theo, 383.3).diagnostic.category).toBe('MOISTURE_EXCESS');

      // Undefined actual yield -> Awaiting measurement
      expect(evaluateYieldDiagnostic(undefined, theo, undefined).diagnostic.badge).toContain('Awaiting');
    });

    it('verifies stoichiometric mass balance conservation law', () => {
      // Reaction: 1 C7H6O3 + 1 C4H6O3 -> 1 C9H8O4 + 1 C2H4O2
      // SA: 138.121 g/mol, AA: 102.089 g/mol -> Reactants sum = 240.210 g/mol
      // ASA: 180.158 g/mol, AcOH: 60.052 g/mol -> Products sum = 240.210 g/mol
      const reactantsMass = CHEMICAL_CONSTANTS.MW_SALICYLIC_ACID + CHEMICAL_CONSTANTS.MW_ACETIC_ANHYDRIDE;
      const productsMass = CHEMICAL_CONSTANTS.MW_ASPIRIN + CHEMICAL_CONSTANTS.MW_ACETIC_ACID;
      expect(reactantsMass).toBeCloseTo(productsMass, 3);
    });
  });

  // =========================================================================
  // SECTION 2: Temperature Extremes & Reaction Kinetics (-10°C to 120°C)
  // =========================================================================
  describe('2. Temperature Extremes & Arrhenius Kinetics (-10°C to 120°C)', () => {

    it('empirically verifies strict Arrhenius rate monotonicity across -10°C to 120°C', () => {
      const temperatures = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
      const rateConstants: number[] = [];

      for (const temp of temperatures) {
        const k = calculateArrheniusRateConstant(temp);
        expect(k).toBeGreaterThan(0);
        expect(Number.isFinite(k)).toBe(true);
        expect(Number.isNaN(k)).toBe(false);
        rateConstants.push(k);
      }

      // Verify strict monotonicity: k(T_{i+1}) > k(T_i)
      for (let i = 0; i < rateConstants.length - 1; i++) {
        expect(rateConstants[i + 1]).toBeGreaterThan(rateConstants[i]);
      }

      // Acceleration factor: k(120°C) / k(-10°C)
      const accelerationFactor = rateConstants[rateConstants.length - 1] / rateConstants[0];
      expect(accelerationFactor).toBeGreaterThan(1000); // Massive thermal acceleration
    });

    it('verifies reaction conversion bounds X(t) in [0.0, 1.0] across all temperatures and times', () => {
      const temps = [-10, 0, 20, 50, 80, 120];
      const times = [0, 0.5, 1, 5, 10, 15, 30, 60, 120, 1000];

      for (const tC of temps) {
        for (const tMin of times) {
          const conv = calculateReactionConversion(tC, tMin);
          expect(conv).toBeGreaterThanOrEqual(0.0);
          expect(conv).toBeLessThanOrEqual(1.0);
          expect(Number.isFinite(conv)).toBe(true);

          if (tMin === 0) {
            expect(conv).toBe(0.0);
          }
        }
      }

      // Standard nominal synthesis conditions: 80°C for 15 minutes achieves >99% completion
      const standardConv = calculateReactionConversion(80, 15);
      expect(standardConv).toBeGreaterThan(0.99);

      // Cold conditions: -10°C for 15 minutes reaction is heavily suppressed (<40%)
      const frozenConv = calculateReactionConversion(-10, 15);
      expect(frozenConv).toBeLessThan(0.40);
    });

    it('tests exothermic quenching enthalpy under extreme excess anhydride quantities', () => {
      // Hydrolysis of 0.05 mol anhydride
      const res = calculateQuenchingReaction(0.05, 25.0, 4.184);
      expect(res.heatReleasedJ).toBeCloseTo(0.05 * 56500, 1);
      expect(res.aceticAcidProducedMoles).toBeCloseTo(0.10, 3);
      expect(res.adiabaticTempRiseC).toBeGreaterThan(20.0);
      expect(Number.isFinite(res.adiabaticTempRiseC)).toBe(true);

      // Zero and negative moles safety
      const resZero = calculateQuenchingReaction(0);
      expect(resZero.heatReleasedJ).toBe(0);
      expect(resZero.adiabaticTempRiseC).toBe(0);

      const resNeg = calculateQuenchingReaction(-10);
      expect(resNeg.heatReleasedJ).toBe(0);
      expect(resNeg.adiabaticTempRiseC).toBe(0);
    });
  });

  // =========================================================================
  // SECTION 3: Classical Nucleation Theory (CNT) Barrier & Singularity Avoidance
  // =========================================================================
  describe('3. Classical Nucleation Theory (CNT) Barrier & S <= 1 Singularity Protection', () => {

    it('guarantees complete singularity avoidance when S <= 1.01 (no division by zero)', () => {
      // Testing the critical boundary conditions: negative S, 0, 0.5, 0.99, 1.00, 1.01
      const singularInputs = [-100.0, -1.0, 0.0, 0.0001, 0.5, 0.9, 0.999, 1.000, 1.005, 1.010];

      for (const s of singularInputs) {
        const cnt = calculateCntParameters(s, 4.0);

        // Under S <= 1.01, barrier must be safely bounded to the default impenetrable 65.2 kT
        expect(Number.isNaN(cnt.barrierJoules)).toBe(false);
        expect(Number.isFinite(cnt.barrierJoules)).toBe(true);
        expect(cnt.barrierJoules).toBeGreaterThan(0);

        expect(cnt.reducedBarrier).toBe(65.2);
        expect(cnt.nucleationRateJ).toBe(0); // Zero nucleation rate in undersaturated zone
        expect(cnt.criticalRadiusNm).toBe(15.0);
      }
    });

    it('empirically verifies the 400+ fold Delta G* collapse from Stage 3 to Stage 4', () => {
      // Stage 3 baseline: S = 1.15 in organic co-solvent (Metastable Zone)
      const cntStage3 = calculateCntParameters(1.15, 4.0);
      expect(cntStage3.reducedBarrier).toBeGreaterThan(60.0);
      expect(cntStage3.nucleationRateJ).toBe(0); // Impenetrable barrier

      // Stage 4 antisolvent shock: S = 20.08 upon water injection (Spinodal burst)
      const cntStage4 = calculateCntParameters(20.08, 4.0);
      expect(cntStage4.reducedBarrier).toBeLessThan(0.5); // Barrierless collapse
      expect(cntStage4.nucleationRateJ).toBeGreaterThan(1e25); // Nucleation explosion

      // Calculate collapse ratio: Delta G*(S=1.15) / Delta G*(S=20.08)
      const barrierCollapseRatio = cntStage3.barrierJoules / cntStage4.barrierJoules;
      expect(barrierCollapseRatio).toBeGreaterThan(400.0);
      expect(barrierCollapseRatio).toBeCloseTo(460.0, -2); // ~460-fold collapse
    });

    it('tests extreme high supersaturations (S = 50, 100, 1000, 10^6) for numerical stability', () => {
      const highS = [50, 100, 500, 1000, 1000000];

      for (const s of highS) {
        const cnt = calculateCntParameters(s, 4.0);
        expect(Number.isFinite(cnt.barrierJoules)).toBe(true);
        expect(Number.isNaN(cnt.barrierJoules)).toBe(false);
        expect(cnt.barrierJoules).toBeGreaterThanOrEqual(1e-25);
        expect(cnt.criticalRadiusNm).toBeGreaterThanOrEqual(0.2); // Clamped to minimum atomic lattice dimension
        expect(cnt.nucleationRateJ).toBeLessThanOrEqual(THERMO_CONSTANTS.J0_KINETIC_FACTOR);
        expect(cnt.nucleationRateJ).toBeGreaterThan(1e25);
      }
    });
  });

  // =========================================================================
  // SECTION 4: Co-Solvent / Antisolvent Thermodynamic State Consistency
  // =========================================================================
  describe('4. Thermodynamic State Machine & Solvent Permittivity Consistency', () => {

    it('verifies bulk dielectric constant bounds eps in [6.2, 88.0] across all volume permutations', () => {
      const volumePermutations = [
        { acoh: 0, aa: 0, w: 0 },
        { acoh: 5, aa: 0, w: 0 },
        { acoh: 0, aa: 5, w: 0 },
        { acoh: 0, aa: 0, w: 20 },
        { acoh: 4.5, aa: 0.5, w: 15.0 },
        { acoh: 1000, aa: 1000, w: 1000 }
      ];

      for (const p of volumePermutations) {
        const eps = calculateEffectiveDielectricConstant(p.acoh, p.aa, p.w, 4.0);
        expect(eps).toBeGreaterThanOrEqual(THERMO_CONSTANTS.DIELECTRIC_ACOH);
        expect(eps).toBeLessThanOrEqual(THERMO_CONSTANTS.DIELECTRIC_WATER_0C);
        expect(Number.isFinite(eps)).toBe(true);
      }
    });

    it('verifies Jouyban-Acree solubility collapse ratio > 20x upon water addition', () => {
      // Pure organic co-solvent (0% water) at 4°C
      const cOrg = calculateEquilibriumSolubility(0.0, 4.0);
      expect(cOrg).toBeGreaterThan(18.0);

      // Antisolvent mixture (75% water) at 4°C
      const cAq = calculateEquilibriumSolubility(0.75, 4.0);
      expect(cAq).toBeLessThan(1.0);

      const collapseRatio = cOrg / cAq;
      expect(collapseRatio).toBeGreaterThan(20.0);
    });

    it('verifies full thermodynamic state progression across all 6 synthesis stages', () => {
      for (let stageId = 1; stageId <= 6; stageId++) {
        const state = calculateThermodynamicState(stageId as any);

        expect(state.stageId).toBe(stageId);
        expect(Number.isFinite(state.temperatureC)).toBe(true);
        expect(Number.isFinite(state.dielectricConstant)).toBe(true);
        expect(Number.isFinite(state.solubilityGPer100Ml)).toBe(true);
        expect(Number.isFinite(state.actualConcentrationGPer100Ml)).toBe(true);
        expect(Number.isFinite(state.supersaturation)).toBe(true);
        expect(Number.isFinite(state.cntBarrierJoules)).toBe(true);
        expect(Number.isFinite(state.relativeBarrierRatio)).toBe(true);

        // Specific stage assertions:
        if (stageId === 3) {
          // Stage 3 MUST be Metastable (0-4°C ice bath, organic co-solvent, no crystals)
          expect(state.isMetastable).toBe(true);
          expect(state.isPrecipitating).toBe(false);
          expect(state.relativeBarrierRatio).toBeCloseTo(1.0, 1);
        }

        if (stageId === 4) {
          // Stage 4 MUST precipitate with spinodal burst
          expect(state.isMetastable).toBe(false);
          expect(state.isPrecipitating).toBe(true);
          expect(state.isSpinodalBurst).toBe(true);
          expect(state.relativeBarrierRatio).toBeLessThan(0.01);
        }
      }
    });
  });

  // =========================================================================
  // SECTION 5: Monte Carlo Randomized Property-Based Stress Sweep (1,000 runs)
  // =========================================================================
  describe('5. Monte Carlo Randomized Property-Based Stress Sweep (1,000 iterations)', () => {

    it('executes 1,000 randomized parameter combinations with zero NaN or crashes', () => {
      let passedIterations = 0;

      for (let i = 0; i < 1000; i++) {
        // Generate pseudo-random inputs across wild ranges
        const saMass = (Math.random() * 200) - 20; // [-20g, 180g]
        const aaVol = (Math.random() * 200) - 20;  // [-20mL, 180mL]
        const actualYield = Math.random() > 0.1 ? (Math.random() * 250) - 10 : undefined;
        const tempC = (Math.random() * 160) - 20;   // [-20°C, 140°C]
        const timeMin = Math.random() * 120;        // [0, 120 min]
        const sRatio = (Math.random() * 100) - 10;  // [-10, 90]
        const waterFrac = Math.random();

        // 1. Stoichiometry Engine
        const stoich = calculateStoichiometry({
          salicylicAcidMassG: saMass,
          aceticAnhydrideVolMl: aaVol,
          actualYieldG: actualYield
        });
        expect(Number.isFinite(stoich.salicylicAcidMoles)).toBe(true);
        expect(Number.isFinite(stoich.aceticAnhydrideMoles)).toBe(true);
        expect(Number.isFinite(stoich.theoreticalYieldG)).toBe(true);

        // 2. Reaction Kinetics
        const k = calculateArrheniusRateConstant(tempC);
        expect(Number.isFinite(k)).toBe(true);
        expect(k).toBeGreaterThan(0);

        const conv = calculateReactionConversion(tempC, timeMin);
        expect(conv).toBeGreaterThanOrEqual(0);
        expect(conv).toBeLessThanOrEqual(1.0);

        // 3. Classical Nucleation Theory
        const cnt = calculateCntParameters(sRatio, tempC);
        expect(Number.isFinite(cnt.barrierJoules)).toBe(true);
        expect(Number.isFinite(cnt.reducedBarrier)).toBe(true);
        expect(Number.isFinite(cnt.nucleationRateJ)).toBe(true);
        expect(Number.isFinite(cnt.criticalRadiusNm)).toBe(true);

        // 4. Thermodynamics & Solubility
        const sol = calculateEquilibriumSolubility(waterFrac, tempC);
        expect(sol).toBeGreaterThan(0);
        expect(Number.isFinite(sol)).toBe(true);

        passedIterations++;
      }

      expect(passedIterations).toBe(1000);
    });
  });
});
