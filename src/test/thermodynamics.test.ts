import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveDielectricConstant,
  calculateEquilibriumSolubility,
  calculateCntParameters,
  calculateThermodynamicState,
  MOLECULAR_VOLUME_VM,
  THERMO_CONSTANTS
} from '../engine/thermodynamics';

describe('Thermodynamics & Crystallization Engine', () => {
  describe('Dielectric Permittivity Jump', () => {
    it('calculates low organic dielectric in Stage 3 and dramatic surge upon water addition in Stage 4', () => {
      // Stage 3: 3.2 mL AcOH, 1.8 mL AA, 0 mL water
      const epsStage3 = calculateEffectiveDielectricConstant(3.2, 1.8, 0, 4);
      // Expected: (3.2 * 6.2 + 1.8 * 20.7) / 5.0 = (19.84 + 37.26) / 5.0 = 11.42
      expect(epsStage3).toBeGreaterThan(10);
      expect(epsStage3).toBeLessThan(13);

      // Stage 4: 4.5 mL AcOH, 0.5 mL AA, 15.0 mL water at 4°C (eps_water ~ 88)
      const epsStage4 = calculateEffectiveDielectricConstant(4.5, 0.5, 15.0, 4);
      // Expected: (4.5 * 6.2 + 0.5 * 20.7 + 15.0 * 88.0) / 20.0 = (27.9 + 10.35 + 1320) / 20 = 67.9
      expect(epsStage4).toBeGreaterThan(65);
      expect(epsStage4).toBeLessThan(75);

      // Verify the dielectric jump is > 50 units
      const dielectricSurge = epsStage4 - epsStage3;
      expect(dielectricSurge).toBeGreaterThan(50);
    });
  });

  describe('Jouyban-Acree Antisolvent Solubility Collapse', () => {
    it('demonstrates high solubility in organic co-solvent and exponential collapse upon water addition', () => {
      // 0% water (pure organic) at 0°C
      const cOrganic = calculateEquilibriumSolubility(0.0, 0);
      expect(cOrganic).toBeCloseTo(18.5, 1);

      // 75% water (antisolvent shock) at 0°C
      const cAntisolvent = calculateEquilibriumSolubility(0.75, 0);
      expect(cAntisolvent).toBeLessThan(1.0);
      expect(cAntisolvent).toBeGreaterThan(0.4);

      // Solubility collapse ratio > 20x
      const collapseRatio = cOrganic / cAntisolvent;
      expect(collapseRatio).toBeGreaterThan(20);
    });

    it('models temperature-dependent aqueous solubility (rationale for lukewarm wash loss)', () => {
      // 100% water at 0°C vs 25°C vs 50°C
      const c0C = calculateEquilibriumSolubility(1.0, 0);
      const c25C = calculateEquilibriumSolubility(1.0, 25);
      const c50C = calculateEquilibriumSolubility(1.0, 50);

      expect(c0C).toBeCloseTo(0.22, 1);
      expect(c25C).toBeGreaterThan(c0C);
      expect(c50C).toBeGreaterThan(c25C * 2);
    });
  });

  describe('Classical Nucleation Theory (CNT) Barrier Collapse', () => {
    it('proves insurmountable barrier in Stage 3 (metastable, zero nucleation)', () => {
      // S = 1.15 in Stage 3
      const cnt = calculateCntParameters(1.15, 4);

      // Barrier Delta G* / (kB * T) must exceed 60 kT (impenetrable)
      expect(cnt.reducedBarrier).toBeGreaterThan(60);
      expect(cnt.nucleationRateJ).toBe(0);
      expect(cnt.criticalRadiusNm).toBeGreaterThan(3.0);
    });

    it('proves catastrophic barrier collapse in Stage 4 (spinodal explosion)', () => {
      // S = 20.08 in Stage 4
      const cnt = calculateCntParameters(20.08, 4);

      // Barrier Delta G* / (kB * T) collapses to < 0.5 kT (barrierless)
      expect(cnt.reducedBarrier).toBeLessThan(0.5);
      expect(cnt.nucleationRateJ).toBeGreaterThan(1e25);
      expect(cnt.criticalRadiusNm).toBeLessThan(1.0);
    });

    it('confirms a 400+ fold collapse of the nucleation energy barrier', () => {
      const cntStage3 = calculateCntParameters(1.15, 4);
      const cntStage4 = calculateCntParameters(20.08, 4);

      const barrierRatio = cntStage3.barrierJoules / cntStage4.barrierJoules;
      expect(barrierRatio).toBeGreaterThan(400);
    });

    it('protects against S <= 1.0 safely without NaN or Infinity', () => {
      const cntUndersaturated = calculateCntParameters(0.8, 4);
      expect(cntUndersaturated.reducedBarrier).toBeGreaterThanOrEqual(65.2);
      expect(Number.isNaN(cntUndersaturated.barrierJoules)).toBe(false);
      expect(cntUndersaturated.nucleationRateJ).toBe(0);
    });
  });

  describe('Stage Thermodynamic State Mapping', () => {
    it('sets correct state properties for Stage 3 (Metastable Zone)', () => {
      const state3 = calculateThermodynamicState(3);
      expect(state3.stageId).toBe(3);
      expect(state3.isMetastable).toBe(true);
      expect(state3.isPrecipitating).toBe(false);
      expect(state3.relativeBarrierRatio).toBeCloseTo(1.0, 1);
    });

    it('sets correct state properties for Stage 4 (Crystal Burst)', () => {
      const state4 = calculateThermodynamicState(4);
      expect(state4.stageId).toBe(4);
      expect(state4.isMetastable).toBe(false);
      expect(state4.isPrecipitating).toBe(true);
      expect(state4.isSpinodalBurst).toBe(true);
      expect(state4.dielectricConstant).toBeGreaterThan(60);
      expect(state4.supersaturation).toBeGreaterThan(15);
      expect(state4.relativeBarrierRatio).toBeLessThan(0.01);
    });
  });
});
