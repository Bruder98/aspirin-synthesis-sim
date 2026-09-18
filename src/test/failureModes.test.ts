import { describe, it, expect } from 'vitest';
import {
  calculateFailureImpact,
  FAILURE_MODE_DEFINITIONS,
  getAllFailureModes,
  getFailureModeDetails
} from '../engine/failureModes';

describe('Failure Modes Engine', () => {
  it('defines all 4 failure scenarios with thorough scientific attributes', () => {
    const modes = getAllFailureModes();
    expect(modes).toHaveLength(4);

    const modeKeys = modes.map(m => m.mode);
    expect(modeKeys).toContain('NONE');
    expect(modeKeys).toContain('EARLY_WATER');
    expect(modeKeys).toContain('OVERHEATING');
    expect(modeKeys).toContain('WARM_WASH');
  });

  describe('Early Water Contamination (EARLY_WATER)', () => {
    it('accurately models complete esterification failure and violet FeCl3 test', () => {
      const details = getFailureModeDetails('EARLY_WATER');
      expect(details.triggerStage).toBe(2);
      expect(details.feCl3TestResult).toBe('VIOLET_POSITIVE');
      expect(details.feCl3ColorHex).toBe('#7E22CE');
      expect(details.expectedYieldPercentRange[0]).toBe(0.0);
      expect(details.expectedYieldPercentRange[1]).toBeLessThanOrEqual(5.0);

      const impact = calculateFailureImpact('EARLY_WATER', 2.6087);
      expect(impact.isFatal).toBe(true);
      expect(impact.simulatedYieldG).toBeLessThan(0.15);
      expect(impact.feCl3TestResult).toBe('VIOLET_POSITIVE');
    });
  });

  describe('Overheating >85°C (OVERHEATING)', () => {
    it('models polycondensation tar formation and low yield', () => {
      const details = getFailureModeDetails('OVERHEATING');
      expect(details.chemicalCause).toContain('폴리살리실레이트');
      expect(details.feCl3TestResult).toBe('TAR_INCONCLUSIVE');
      expect(details.feCl3ColorHex).toBe('#451A03');

      const impact = calculateFailureImpact('OVERHEATING', 2.6087);
      expect(impact.isFatal).toBe(true);
      expect(impact.simulatedPercentYield).toBeLessThan(25.0);
    });
  });

  describe('Lukewarm Water Wash Loss (WARM_WASH)', () => {
    it('models product dissolution loss while retaining chemical identity', () => {
      const details = getFailureModeDetails('WARM_WASH');
      expect(details.triggerStage).toBe(6);
      expect(details.chemicalCause).toContain('수용해도 급상승');
      // The remaining product is still pure aspirin, so FeCl3 is negative (buff)
      expect(details.feCl3TestResult).toBe('BUFF_NEGATIVE');
      expect(details.expectedYieldPercentRange).toEqual([30.0, 45.0]);

      const impact = calculateFailureImpact('WARM_WASH', 2.6087);
      expect(impact.isFatal).toBe(false);
      expect(impact.simulatedPercentYield).toBeCloseTo(37.5, 1);
      expect(impact.simulatedYieldG).toBeLessThan(1.2);
    });
  });

  describe('Normal Control (NONE)', () => {
    it('models exemplary laboratory yield and negative FeCl3 test', () => {
      const details = getFailureModeDetails('NONE');
      expect(details.feCl3TestResult).toBe('BUFF_NEGATIVE');
      expect(details.expectedYieldPercentRange).toEqual([82.0, 88.0]);

      const impact = calculateFailureImpact('NONE', 2.6087);
      expect(impact.isFatal).toBe(false);
      expect(impact.simulatedPercentYield).toBeCloseTo(85.0, 1);
    });
  });
});
