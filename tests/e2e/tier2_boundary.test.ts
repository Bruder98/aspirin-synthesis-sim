import { describe, it, expect } from 'vitest';
import {
  createReferenceStore,
  calculateReferenceStoichiometry,
  calculateReferenceThermodynamics,
  calculateReferenceArrheniusRate,
  calculateReferenceCntBarrier,
  PHYSICAL_CONSTANTS,
  SynthesisStageId,
} from './testRunner';

describe('Tier 2: Boundary Value Analysis, Corner Cases & Numerical Hardening', () => {
  // =========================================================================
  // Zero & Negative Input Boundaries
  // =========================================================================
  describe('Zero & Negative Input Hardening', () => {
    it('handles zero salicylic acid mass (0.00 g) without NaN or crash', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 0.0,
        aceticAnhydrideVolMl: 5.0,
      });
      expect(res.salicylicAcidMoles).toBe(0.0);
      expect(res.limitingReagent).toBe('SALICYLIC_ACID');
      expect(res.limitingReagentMoles).toBe(0.0);
      expect(res.theoreticalYieldG).toBe(0.0);
      expect(Number.isNaN(res.theoreticalYieldG)).toBe(false);
    });

    it('handles zero acetic anhydride volume (0.00 mL) without NaN or crash', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 0.0,
      });
      expect(res.aceticAnhydrideMoles).toBe(0.0);
      expect(res.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(res.limitingReagentMoles).toBe(0.0);
      expect(res.theoreticalYieldG).toBe(0.0);
      expect(Number.isNaN(res.theoreticalYieldG)).toBe(false);
    });

    it('safely clamps negative mass input (-5.00 g) to 0 without corrupting balances', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: -5.0,
        aceticAnhydrideVolMl: 5.0,
      });
      expect(res.salicylicAcidMoles).toBe(0.0);
      expect(res.theoreticalYieldG).toBe(0.0);
    });

    it('safely clamps negative volume input (-10.00 mL) to 0 without corrupting balances', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: -10.0,
      });
      expect(res.aceticAnhydrideMoles).toBe(0.0);
      expect(res.theoreticalYieldG).toBe(0.0);
    });

    it('safely clamps negative actual yield input (-2.50 g) without throwing', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 5.0,
        actualYieldG: -2.5,
      });
      expect(res.actualYieldG).toBe(0.0);
      expect(res.percentYield).toBe(0.0);
      expect(res.feedbackCategory).toBe('CRITICAL_ERROR');
    });
  });

  // =========================================================================
  // Extreme Scale & Precision Boundaries
  // =========================================================================
  describe('Extreme Scale & Precision Boundaries', () => {
    it('handles industrial micro-scale inputs (0.0001 g SA, 0.001 mL AA)', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 0.0001,
        aceticAnhydrideVolMl: 0.001,
      });
      expect(res.salicylicAcidMoles).toBeGreaterThan(0);
      expect(res.theoreticalYieldG).toBeGreaterThan(0);
      expect(isFinite(res.theoreticalYieldG)).toBe(true);
    });

    it('handles pilot plant mega-scale inputs (10000.0 g SA, 25000.0 mL AA) without overflow', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 10000.0,
        aceticAnhydrideVolMl: 25000.0,
      });
      expect(res.salicylicAcidMoles).toBeCloseTo(72.40, 1);
      expect(res.theoreticalYieldG).toBeCloseTo(13043.5, 0);
      expect(isFinite(res.theoreticalYieldG)).toBe(true);
    });

    it('handles exact equimolar stoichiometry threshold without precision artifacts', () => {
      // SA: 1.38121 g = 0.010000 mol
      // AA: V = (0.01 * 102.089) / 1.082 = 0.943521 mL
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 1.38121,
        aceticAnhydrideVolMl: 0.943521,
      });
      expect(Math.abs(res.salicylicAcidMoles - res.aceticAnhydrideMoles)).toBeLessThan(1e-5);
      expect(res.theoreticalYieldG).toBeCloseTo(1.8016, 3);
    });

    it('handles excessive yield input (>500%) cleanly categorizing as HIGH_MOISTURE', () => {
      const res = calculateReferenceStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 5.0,
        actualYieldG: 15.0, // ~575%
      });
      expect(res.percentYield).toBeGreaterThan(500);
      expect(res.feedbackCategory).toBe('HIGH_MOISTURE');
      expect(res.diagnosticFeedback).toContain('residual moisture');
    });
  });

  // =========================================================================
  // Classical Nucleation Theory (CNT) & Supersaturation S <= 1.0
  // =========================================================================
  describe('Classical Nucleation Theory (CNT) Singularities', () => {
    it('defends against ln(S) singularity when S <= 1.0 (sub-saturated solution)', () => {
      // When S <= 1, ln(S) <= 0 would cause barrier division by zero or negative barrier
      const barrierAtOne = calculateReferenceCntBarrier(1.0, 277.15);
      expect(barrierAtOne.cntBarrierJoules).toBeGreaterThan(0);
      expect(isFinite(barrierAtOne.cntBarrierJoules)).toBe(true);
      expect(barrierAtOne.criticalRadiusNm).toBeGreaterThan(0);
    });

    it('defends against negative or zero supersaturation (S <= 0)', () => {
      const barrierZero = calculateReferenceCntBarrier(0.0, 277.15);
      expect(isFinite(barrierZero.cntBarrierJoules)).toBe(true);
      expect(barrierZero.reducedBarrier).toBeGreaterThan(100);
    });

    it('handles extreme supersaturation spike (S = 1000.0) without underflow', () => {
      const barrier1000 = calculateReferenceCntBarrier(1000.0, 277.15);
      expect(barrier1000.cntBarrierJoules).toBeGreaterThan(0);
      expect(barrier1000.criticalRadiusNm).toBeLessThan(0.3); // Extremely tiny critical nucleus (~0.20 nm)
      expect(barrier1000.reducedBarrier).toBeLessThan(1.0); // Completely barrierless
    });

    it('handles absolute zero temperature limit (T -> 0 K) safely', () => {
      const barrierZeroK = calculateReferenceCntBarrier(20.0, 0.001);
      expect(isFinite(barrierZeroK.criticalRadiusNm)).toBe(true);
    });
  });

  // =========================================================================
  // Arrhenius Kinetics Extreme Temperatures
  // =========================================================================
  describe('Arrhenius Kinetics Extreme Temperatures', () => {
    it('calculates zero reaction rate at absolute zero (-273.15°C / 0 K)', () => {
      const kZero = calculateReferenceArrheniusRate(-273.15);
      expect(kZero).toBe(0);
    });

    it('handles negative Celsius temperatures gracefully (-20°C)', () => {
      const kSubZero = calculateReferenceArrheniusRate(-20);
      expect(kSubZero).toBeGreaterThan(0);
      expect(kSubZero).toBeLessThan(0.0005); // Virtually frozen reaction (~0.00012)
    });

    it('calculates rapid rate at boiling water temperature (100°C / 373.15 K)', () => {
      const k100 = calculateReferenceArrheniusRate(100);
      expect(k100).toBeGreaterThan(0.18);
      expect(k100).toBeLessThan(0.25);
    });

    it('handles ultra-high pyrolytic temperature (200°C) without NaN', () => {
      const k200 = calculateReferenceArrheniusRate(200);
      expect(k200).toBeGreaterThan(4.0);
      expect(k200).toBeLessThan(7.0);
      expect(isFinite(k200)).toBe(true);
    });
  });

  // =========================================================================
  // State Machine Range & Type Safety Clamping
  // =========================================================================
  describe('State Machine Boundary Clamping', () => {
    it('ignores invalid negative stage ID (setStage(-1))', () => {
      const store = createReferenceStore();
      store.setStage(-1 as unknown as SynthesisStageId);
      expect(store.currentStage).toBe(1);
    });

    it('ignores out-of-bounds stage ID (setStage(7) or setStage(99))', () => {
      const store = createReferenceStore();
      store.setStage(7 as unknown as SynthesisStageId);
      expect(store.currentStage).toBe(1);
      store.setStage(99 as unknown as SynthesisStageId);
      expect(store.currentStage).toBe(1);
    });

    it('repeatedly calling prevStage at Stage 1 never decrements below 1', () => {
      const store = createReferenceStore();
      for (let i = 0; i < 10; i++) {
        store.prevStage();
      }
      expect(store.currentStage).toBe(1);
    });

    it('repeatedly calling nextStage at Stage 6 never increments beyond 6', () => {
      const store = createReferenceStore();
      store.setStage(6);
      for (let i = 0; i < 10; i++) {
        store.nextStage();
      }
      expect(store.currentStage).toBe(6);
    });

    it('re-setting same stage leaves state stable and intact', () => {
      const store = createReferenceStore();
      store.setStage(3);
      expect(store.currentStage).toBe(3);
      store.setStage(3);
      expect(store.currentStage).toBe(3);
      expect(store.thermodynamics.isMetastable).toBe(true);
    });
  });

  // =========================================================================
  // Anhydride Quenching Boundaries
  // =========================================================================
  describe('Anhydride Quenching Enthalpy Boundaries', () => {
    it('calculates zero quenching heat release when anhydride is completely consumed (0 mol excess)', () => {
      const excessMoles = 0.0;
      const heatJoules = excessMoles * Math.abs(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING) * 1000;
      expect(heatJoules).toBe(0);
    });

    it('calculates large quenching heat release for massive anhydride excess (1.0 mol)', () => {
      const excessMoles = 1.0;
      const heatJoules = excessMoles * Math.abs(PHYSICAL_CONSTANTS.ENTHALPY_QUENCHING) * 1000;
      expect(heatJoules).toBe(56500); // 56.5 kJ
    });
  });

  // =========================================================================
  // Failure Mode Boundary Transitions
  // =========================================================================
  describe('Failure Mode Boundary Transitions', () => {
    it('rapidly switching between failure modes updates state without dangling flags', () => {
      const store = createReferenceStore();
      store.setFailureMode('EARLY_WATER');
      expect(store.failureMode).toBe('EARLY_WATER');
      store.setFailureMode('OVERHEATING');
      expect(store.failureMode).toBe('OVERHEATING');
      store.setFailureMode('WARM_WASH');
      expect(store.failureMode).toBe('WARM_WASH');
      store.setFailureMode('NONE');
      expect(store.failureMode).toBe('NONE');
    });

    it('thermodynamics for NONE mode at Stage 6 always reflects standard cold wash (4°C)', () => {
      const thermo = calculateReferenceThermodynamics(6, 'NONE');
      expect(thermo.temperatureC).toBe(4);
      expect(thermo.solubilityGPer100Ml).toBeLessThan(0.3);
    });
  });
});
