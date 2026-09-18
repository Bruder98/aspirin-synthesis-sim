import { describe, it, expect } from 'vitest';
import {
  calculateArrheniusRateConstant,
  calculateReactionConversion,
  calculateQuenchingReaction,
  CHEMICAL_CONSTANTS,
  getStageInfo,
  MECHANISM_STEPS,
  STAGE_DEFINITIONS
} from '../engine/reactionKinetics';

describe('Reaction Kinetics & Mechanism Engine', () => {
  describe('Arrhenius Rate Modeling', () => {
    it('calculates temperature-dependent rate constants accurately', () => {
      // At 80°C (353.15 K)
      const k80 = calculateArrheniusRateConstant(80);
      // At 20°C (293.15 K)
      const k20 = calculateArrheniusRateConstant(20);

      expect(k80).toBeCloseTo(0.811, 2);
      expect(k20).toBeCloseTo(0.028, 2);

      // Heating from 20°C to 80°C speeds up the esterification by ~28-30x
      const accelerationFactor = k80 / k20;
      expect(accelerationFactor).toBeGreaterThan(25);
      expect(accelerationFactor).toBeLessThan(35);
    });

    it('handles zero or negative catalyst concentration', () => {
      const kZeroCatalyst = calculateArrheniusRateConstant(80, 0);
      expect(kZeroCatalyst).toBe(0);

      const kNegCatalyst = calculateArrheniusRateConstant(80, -1);
      expect(kNegCatalyst).toBe(0);
    });
  });

  describe('Pseudo-First-Order Esterification Conversion', () => {
    it('achieves >99% conversion in 15 minutes at 80°C', () => {
      const conversion15Min = calculateReactionConversion(80, 15);
      expect(conversion15Min).toBeGreaterThan(0.99);
      expect(conversion15Min).toBeLessThanOrEqual(1.0);

      const conversion5Min = calculateReactionConversion(80, 5);
      expect(conversion5Min).toBeGreaterThan(0.95);

      const conversion0Min = calculateReactionConversion(80, 0);
      expect(conversion0Min).toBe(0);
    });

    it('demonstrates sluggish conversion at room temperature (20°C)', () => {
      const conversionRoomTemp1Min = calculateReactionConversion(20, 1);
      expect(conversionRoomTemp1Min).toBeLessThan(0.35);
    });
  });

  describe('Exothermic Anhydride Quenching', () => {
    it('accurately predicts enthalpy release and adiabatic temperature rise', () => {
      // 0.0385 mol excess anhydride in 20 mL aqueous solution
      const quenching = calculateQuenchingReaction(0.0385, 20.0, 4.184);

      // Q = 0.0385 * 56500 = 2175.25 J
      expect(quenching.heatReleasedJ).toBeCloseTo(2175.25, 1);

      // Delta T = 2175.25 / (20.0 * 4.184) = ~26.0°C
      expect(quenching.adiabaticTempRiseC).toBeCloseTo(25.99, 1);

      // 2 moles acetic acid per mole anhydride hydrolyzed
      expect(quenching.aceticAcidProducedMoles).toBeCloseTo(0.077, 3);
    });

    it('safely handles zero excess anhydride', () => {
      const quenching = calculateQuenchingReaction(0);
      expect(quenching.heatReleasedJ).toBe(0);
      expect(quenching.adiabaticTempRiseC).toBe(0);
      expect(quenching.aceticAcidProducedMoles).toBe(0);
    });
  });

  describe('6-Stage Lifecycle & Mechanism Steps', () => {
    it('defines all 6 stages with valid temperatures and state flags', () => {
      const stageIds = [1, 2, 3, 4, 5, 6] as const;
      for (const id of stageIds) {
        const info = getStageInfo(id);
        expect(info.id).toBe(id);
        expect(info.titleKo.length).toBeGreaterThan(0);
        expect(info.titleEn.length).toBeGreaterThan(0);
        expect(info.temperatureC).toBeGreaterThanOrEqual(0);
      }

      // Stage 3 MUST be metastable and NOT precipitating
      expect(STAGE_DEFINITIONS[3].isMetastable).toBe(true);
      expect(STAGE_DEFINITIONS[3].isPrecipitating).toBe(false);

      // Stage 4 MUST precipitate and NOT be metastable
      expect(STAGE_DEFINITIONS[4].isMetastable).toBe(false);
      expect(STAGE_DEFINITIONS[4].isPrecipitating).toBe(true);
    });

    it('contains all 5 microscopic reaction intermediate steps', () => {
      expect(MECHANISM_STEPS).toHaveLength(5);
      const stepIds = MECHANISM_STEPS.map(s => s.stepId);
      expect(stepIds).toContain('2a_protonation');
      expect(stepIds).toContain('2b_nucleophilic_attack');
      expect(stepIds).toContain('2c_proton_transfer');
      expect(stepIds).toContain('2d_elimination');
      expect(stepIds).toContain('2e_catalyst_regen');

      // 2a oxonium electrophilic activation boosts delta+ to 0.88
      const step2a = MECHANISM_STEPS.find(s => s.stepId === '2a_protonation');
      expect(step2a?.electrophilicChargeDeltaPlus).toBe(0.88);

      // 2b tetrahedral intermediate has sp3 center
      const step2b = MECHANISM_STEPS.find(s => s.stepId === '2b_nucleophilic_attack');
      expect(step2b?.hybridization).toBe('sp3');
    });
  });
});
