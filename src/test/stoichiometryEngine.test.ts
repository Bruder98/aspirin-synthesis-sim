import { describe, it, expect } from 'vitest';
import {
  calculateStoichiometry,
  evaluateYieldDiagnostic,
  STOICHIOMETRY_CONSTANTS
} from '../engine/stoichiometryEngine';

describe('Stoichiometry Engine', () => {
  it('correctly calculates nominal standard inputs (2.00 g SA, 5.00 mL AA)', () => {
    const result = calculateStoichiometry({
      salicylicAcidMassG: 2.00,
      aceticAnhydrideVolMl: 5.00,
      actualYieldG: 2.15
    });

    // Moles SA = 2.00 / 138.121 = 0.01448 mol
    expect(result.salicylicAcidMoles).toBeCloseTo(0.01448, 4);

    // Mass AA = 5.00 * 1.082 = 5.41 g
    expect(result.aceticAnhydrideMassG).toBeCloseTo(5.41, 2);

    // Moles AA = 5.41 / 102.089 = 0.05299 mol
    expect(result.aceticAnhydrideMoles).toBeCloseTo(0.05299, 4);

    // Limiting reagent must be Salicylic Acid
    expect(result.limitingReagent).toBe('SALICYLIC_ACID');
    expect(result.limitingReagentName).toBe('Salicylic Acid');
    expect(result.limitingReagentMoles).toBeCloseTo(0.01448, 4);

    // Excess AA % = ((0.05299 - 0.01448) / 0.01448) * 100 ~ 265.9%
    expect(result.excessReagentPercent).toBeGreaterThan(250);

    // Theoretical yield = 0.01448 * 180.158 = 2.6087 g
    expect(result.theoreticalYieldG).toBeCloseTo(2.6087, 3);

    // Percent yield = (2.15 / 2.6087) * 100 = 82.42%
    expect(result.percentYield).toBeCloseTo(82.42, 1);
    expect(result.diagnostic.category).toBe('NORMAL_TYPICAL');
    expect(result.feedbackCategory).toBe('EXCELLENT');
  });

  it('inverts limiting reagent when Acetic Anhydride is in deficit', () => {
    const result = calculateStoichiometry({
      salicylicAcidMassG: 10.00,
      aceticAnhydrideVolMl: 1.00,
      actualYieldG: 1.50
    });

    // Moles SA = 10.00 / 138.121 = 0.07240 mol
    // Moles AA = (1.00 * 1.082) / 102.089 = 0.01060 mol
    expect(result.limitingReagent).toBe('ACETIC_ANHYDRIDE');
    expect(result.limitingReagentName).toBe('Acetic Anhydride');
    expect(result.limitingReagentMoles).toBeCloseTo(0.0106, 3);

    // Theoretical yield based on AA: 0.0106 * 180.158 = 1.909 g
    expect(result.theoreticalYieldG).toBeCloseTo(1.909, 2);

    // Percent yield = (1.50 / 1.909) * 100 = 78.57%
    expect(result.percentYield).toBeCloseTo(78.57, 1);
  });

  it('handles exact equimolar stoichiometry cleanly', () => {
    // 1 mol SA = 138.121 g; 1 mol AA = 102.089 g / 1.082 = 94.352 mL
    const result = calculateStoichiometry({
      salicylicAcidMassG: 1.38121,
      aceticAnhydrideVolMl: 0.94352,
    });

    expect(result.salicylicAcidMoles).toBeCloseTo(0.01, 3);
    expect(result.aceticAnhydrideMoles).toBeCloseTo(0.01, 3);
    expect(result.excessReagentPercent).toBeCloseTo(0.0, 1);
    expect(result.theoreticalYieldG).toBeCloseTo(1.8016, 2);
  });

  describe('8-Tier Diagnostic Evaluation Matrix', () => {
    const theoG = 2.6087;

    it('flags negative mass as INVALID_INPUT', () => {
      const diag = evaluateYieldDiagnostic(-1.0, theoG, -38.3);
      expect(diag.diagnostic.category).toBe('INVALID_INPUT');
      expect(diag.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(diag.diagnostic.badge).toContain('Invalid');
    });

    it('flags zero yield as ZERO_YIELD', () => {
      const diag = evaluateYieldDiagnostic(0.0, theoG, 0.0);
      expect(diag.diagnostic.category).toBe('ZERO_YIELD');
      expect(diag.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(diag.diagnostic.badge).toContain('Zero');
    });

    it('flags <20% yield as CRITICAL_FAILURE', () => {
      const diag = evaluateYieldDiagnostic(0.35, theoG, 13.4);
      expect(diag.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(diag.feedbackCategory).toBe('CRITICAL_ERROR');
      expect(diag.diagnostic.description).toContain('무수아세트산이 가수분해');
    });

    it('flags 20% - 49.9% yield as SEVERE_LOSS', () => {
      const diag = evaluateYieldDiagnostic(0.95, theoG, 36.4);
      expect(diag.diagnostic.category).toBe('SEVERE_LOSS');
      expect(diag.feedbackCategory).toBe('WASH_LOSS');
      expect(diag.diagnostic.description).toContain('미지근한 물');
    });

    it('flags 50% - 69.9% yield as MODERATE_LOSS', () => {
      const diag = evaluateYieldDiagnostic(1.55, theoG, 59.4);
      expect(diag.diagnostic.category).toBe('MODERATE_LOSS');
      expect(diag.feedbackCategory).toBe('PARTIAL_CONVERSION');
      expect(diag.diagnostic.description).toContain('결정 숙성 시간');
    });

    it('flags 70% - 89.9% yield as NORMAL_TYPICAL', () => {
      const diag = evaluateYieldDiagnostic(2.15, theoG, 82.4);
      expect(diag.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(diag.feedbackCategory).toBe('EXCELLENT');
      expect(diag.diagnostic.description).toContain('표준 기대 수득률');
    });

    it('flags 90% - 105% yield as EXCELLENT', () => {
      const diag = evaluateYieldDiagnostic(2.55, theoG, 97.7);
      expect(diag.diagnostic.category).toBe('EXCELLENT');
      expect(diag.feedbackCategory).toBe('EXCELLENT');
      expect(diag.diagnostic.description).toContain('최우수');
    });

    it('flags >105% yield as MOISTURE_EXCESS', () => {
      const diag = evaluateYieldDiagnostic(3.10, theoG, 118.8);
      expect(diag.diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(diag.feedbackCategory).toBe('HIGH_MOISTURE');
      expect(diag.diagnostic.badge).toContain('Moisture');
      expect(diag.diagnostic.description).toContain('완전히 건조되지 않아');
    });
  });

  describe('Adversarial & Numerical Robustness', () => {
    it('safely handles zero inputs without NaN or throw', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 0,
        aceticAnhydrideVolMl: 0
      });

      expect(result.salicylicAcidMoles).toBe(0);
      expect(result.aceticAnhydrideMoles).toBe(0);
      expect(result.theoreticalYieldG).toBe(0);
      expect(Number.isNaN(result.theoreticalYieldG)).toBe(false);
    });

    it('safely handles undefined actual yield', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 5.0,
        actualYieldG: undefined
      });

      expect(result.percentYield).toBeUndefined();
      expect(result.diagnostic.title).toContain('대기');
    });
  });
});
