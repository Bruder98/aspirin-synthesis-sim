import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAspirinStore } from '../store/useAspirinStore';
import {
  calculateFailureImpact,
  FAILURE_MODE_DEFINITIONS,
  getAllFailureModes,
  getFailureModeDetails
} from '../engine/failureModes';
import { SynthesisStageId, FailureMode } from '../engine/types';

describe('Adversarial Verification: State Machine, Failure Branching & Store Reactivity', () => {
  beforeEach(() => {
    useAspirinStore.getState().resetSimulation();
  });

  // =========================================================================
  // 1. Rapid Stage Transitions & Boundary Stress
  // =========================================================================
  describe('1. Stage Transitions & State Consistency', () => {
    it('1.1 advances sequentially 1 -> 2 -> 3 -> 4 -> 5 -> 6 with accurate thermodynamics sync', () => {
      const store = useAspirinStore.getState();

      for (let s = 1; s <= 6; s++) {
        expect(useAspirinStore.getState().currentStage).toBe(s);
        expect(useAspirinStore.getState().thermodynamics.stageId).toBe(s);
        if (s < 6) {
          store.nextStage();
        }
      }
    });

    it('1.2 clamps strictly at upper boundary (cannot exceed Stage 6)', () => {
      const store = useAspirinStore.getState();
      store.setStage(6);
      expect(useAspirinStore.getState().currentStage).toBe(6);

      // Repeated attempts to advance
      for (let i = 0; i < 5; i++) {
        store.nextStage();
        expect(useAspirinStore.getState().currentStage).toBe(6);
        expect(useAspirinStore.getState().thermodynamics.stageId).toBe(6);
      }
    });

    it('1.3 clamps strictly at lower boundary (cannot step back below Stage 1)', () => {
      const store = useAspirinStore.getState();
      expect(useAspirinStore.getState().currentStage).toBe(1);

      // Repeated attempts to step backward
      for (let i = 0; i < 5; i++) {
        store.prevStage();
        expect(useAspirinStore.getState().currentStage).toBe(1);
        expect(useAspirinStore.getState().thermodynamics.stageId).toBe(1);
      }
    });

    it('1.4 handles 500 rapid pseudo-random stage jumps maintaining internal consistency', () => {
      const store = useAspirinStore.getState();
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];

      for (let i = 0; i < 500; i++) {
        const targetStage = stages[Math.floor(Math.random() * stages.length)];
        store.setStage(targetStage);

        const state = useAspirinStore.getState();
        expect(state.currentStage).toBe(targetStage);
        expect(state.thermodynamics.stageId).toBe(targetStage);
        expect(state.stageProgress).toBe(0.0);

        // Verify stage-specific thermodynamic invariants
        if (targetStage === 3) {
          expect(state.thermodynamics.isMetastable).toBe(true);
          expect(state.thermodynamics.isPrecipitating).toBe(false);
        } else if (targetStage === 4) {
          expect(state.thermodynamics.isMetastable).toBe(false);
          expect(state.thermodynamics.isPrecipitating).toBe(true);
          expect(state.thermodynamics.isSpinodalBurst).toBe(true);
        }
      }
    });

    it('1.5 clamps out-of-range integer stage inputs', () => {
      const store = useAspirinStore.getState();

      store.setStage(-10 as any);
      expect(useAspirinStore.getState().currentStage).toBe(1);

      store.setStage(0 as any);
      expect(useAspirinStore.getState().currentStage).toBe(1);

      store.setStage(7 as any);
      expect(useAspirinStore.getState().currentStage).toBe(6);

      store.setStage(999 as any);
      expect(useAspirinStore.getState().currentStage).toBe(6);
    });

    it('1.6 tests behavior on non-integer stage inputs (e.g. floats)', () => {
      const store = useAspirinStore.getState();
      store.setStage(2.7 as any);

      // Assessment: Does the store clamp/round floats to an integer stage?
      const stage = useAspirinStore.getState().currentStage;
      // Valid stage IDs must strictly be 1, 2, 3, 4, 5, or 6
      const isValidIntegerStage = Number.isInteger(stage) && stage >= 1 && stage <= 6;
      expect(isValidIntegerStage).toBe(true);
    });

    it('1.7 tests behavior on NaN or undefined stage input', () => {
      const store = useAspirinStore.getState();
      store.setStage(NaN as any);

      const stage = useAspirinStore.getState().currentStage;
      // Corrupting currentStage to NaN breaks nextStage/prevStage permanently
      expect(Number.isNaN(stage)).toBe(false);
      expect(stage).toBeGreaterThanOrEqual(1);
      expect(stage).toBeLessThanOrEqual(6);
    });

    it('1.8 clamps stageProgress strictly between 0.0 and 1.0', () => {
      const store = useAspirinStore.getState();

      store.setStageProgress(0.5);
      expect(useAspirinStore.getState().stageProgress).toBe(0.5);

      store.setStageProgress(1.5);
      expect(useAspirinStore.getState().stageProgress).toBe(1.0);

      store.setStageProgress(-0.8);
      expect(useAspirinStore.getState().stageProgress).toBe(0.0);
    });
  });

  // =========================================================================
  // 2. Zustand Store Reactivity, Subscriptions & Listener Isolation
  // =========================================================================
  describe('2. Zustand Store Reactivity & Subscriptions', () => {
    it('2.1 fires subscriber callback synchronously on state changes', () => {
      let callCount = 0;
      let lastObservedStage = 0;

      const unsubscribe = useAspirinStore.subscribe((state) => {
        callCount++;
        lastObservedStage = state.currentStage;
      });

      useAspirinStore.getState().setStage(3);
      expect(callCount).toBe(1);
      expect(lastObservedStage).toBe(3);

      useAspirinStore.getState().setStage(5);
      expect(callCount).toBe(2);
      expect(lastObservedStage).toBe(5);

      unsubscribe();

      // Subsequent changes should not invoke listener
      useAspirinStore.getState().setStage(1);
      expect(callCount).toBe(2);
      expect(lastObservedStage).toBe(5);
    });

    it('2.2 survives high-frequency burst state updates without lag or corruption', () => {
      const store = useAspirinStore.getState();
      const startTime = performance.now();

      for (let i = 0; i < 2000; i++) {
        store.setStageProgress((i % 100) / 100);
        if (i % 50 === 0) {
          store.togglePlaying();
        }
      }

      const elapsed = performance.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Must complete within 1 second
      expect(useAspirinStore.getState().isPlaying).toBeDefined();
    });

    it('2.3 maintains reactivity between stoichiometry inputs and dependent outputs', () => {
      const store = useAspirinStore.getState();

      // Change input to make acetic anhydride limiting
      store.updateStoichiometry({
        salicylicAcidMassG: 10.0,
        aceticAnhydrideVolMl: 1.0,
        actualYieldG: 1.2
      });

      const state = useAspirinStore.getState();
      expect(state.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(state.stoichiometryResult.actualYieldG).toBe(1.2);
      expect(state.stoichiometryResult.percentYield).toBeDefined();
      expect(state.stoichiometryResult.percentYield!).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. Failure Mode Engine Verification (`failureModes.ts`)
  // =========================================================================
  describe('3. Failure Modes Pure Engine Verification', () => {
    it('3.1 provides comprehensive details for all 4 failure modes', () => {
      const allModes = getAllFailureModes();
      expect(allModes).toHaveLength(4);

      const modeKeys = allModes.map(m => m.mode);
      expect(modeKeys).toEqual(['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH']);

      for (const details of allModes) {
        expect(details.nameKo).toBeTruthy();
        expect(details.nameEn).toBeTruthy();
        expect(details.description).toBeTruthy();
        expect(details.chemicalCause).toBeTruthy();
        expect(details.observableOutcome).toBeTruthy();
        expect(details.remedyRecommendation).toBeTruthy();
        expect(details.expectedYieldPercentRange[0]).toBeLessThanOrEqual(details.expectedYieldPercentRange[1]);
      }
    });

    it('3.2 calculates failure impacts accurately across all modes for nominal yield (2.6087 g)', () => {
      const theoYield = 2.6087;

      // NONE (Control)
      const noneImpact = calculateFailureImpact('NONE', theoYield);
      expect(noneImpact.isFatal).toBe(false);
      expect(noneImpact.simulatedPercentYield).toBe(85.0);
      expect(noneImpact.simulatedYieldG).toBeCloseTo(2.217, 2);
      expect(noneImpact.feCl3TestResult).toBe('BUFF_NEGATIVE');

      // EARLY_WATER
      const waterImpact = calculateFailureImpact('EARLY_WATER', theoYield);
      expect(waterImpact.isFatal).toBe(true);
      expect(waterImpact.simulatedPercentYield).toBe(2.5);
      expect(waterImpact.simulatedYieldG).toBeCloseTo(0.065, 2);
      expect(waterImpact.feCl3TestResult).toBe('VIOLET_POSITIVE');

      // OVERHEATING
      const heatImpact = calculateFailureImpact('OVERHEATING', theoYield);
      expect(heatImpact.isFatal).toBe(true);
      expect(heatImpact.simulatedPercentYield).toBe(12.5);
      expect(heatImpact.simulatedYieldG).toBeCloseTo(0.326, 2);
      expect(heatImpact.feCl3TestResult).toBe('TAR_INCONCLUSIVE');

      // WARM_WASH
      const washImpact = calculateFailureImpact('WARM_WASH', theoYield);
      expect(washImpact.isFatal).toBe(false);
      expect(washImpact.simulatedPercentYield).toBe(37.5);
      expect(washImpact.simulatedYieldG).toBeCloseTo(0.978, 2);
      expect(washImpact.feCl3TestResult).toBe('BUFF_NEGATIVE');
    });

    it('3.3 handles edge case: zero or negative theoretical yield in calculateFailureImpact', () => {
      const zeroImpact = calculateFailureImpact('EARLY_WATER', 0);
      expect(zeroImpact.simulatedYieldG).toBe(0);

      // Invalid negative yield
      const negImpact = calculateFailureImpact('EARLY_WATER', -10);
      // Even if negative yield is fed, output should either be clamped or predictable
      expect(Number.isFinite(negImpact.simulatedYieldG)).toBe(true);
    });

    it('3.4 safely falls back to NONE for unknown failure mode key', () => {
      const fallback = getFailureModeDetails('INVALID_MODE' as any);
      expect(fallback.mode).toBe('NONE');
    });
  });

  // =========================================================================
  // 4. Store Failure Branching & Yield Override Verification (`useAspirinStore.ts`)
  // =========================================================================
  describe('4. Store Failure Branching & Yield Overrides', () => {
    it('4.1 activating EARLY_WATER updates store failure mode', () => {
      const store = useAspirinStore.getState();
      store.setFailureMode('EARLY_WATER');
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');
    });

    it('4.2 checks whether EARLY_WATER overrides yield in store stoichiometryResult', () => {
      const store = useAspirinStore.getState();
      store.setFailureMode('EARLY_WATER');

      const state = useAspirinStore.getState();
      // An active EARLY_WATER failure represents catastrophic synthesis failure (0% yield, CRITICAL_ERROR)
      // Verify whether the store reflects this in its stoichiometryResult
      expect(state.stoichiometryResult.percentYield).toBeLessThanOrEqual(5.0);
    });

    it('4.3 checks whether EARLY_WATER suppresses precipitation in Stage 4/5 thermodynamics', () => {
      const store = useAspirinStore.getState();
      store.setStage(4);
      store.setFailureMode('EARLY_WATER');

      const state = useAspirinStore.getState();
      // In early water contamination, anhydride is hydrolyzed prior to reaction; no aspirin is formed,
      // so injecting water in stage 4 cannot produce crystal burst.
      expect(state.thermodynamics.isPrecipitating).toBe(false);
    });

    it('4.4 checks whether OVERHEATING reflects elevated thermal degradation (>85°C)', () => {
      const store = useAspirinStore.getState();
      store.setStage(2);
      store.setFailureMode('OVERHEATING');

      const state = useAspirinStore.getState();
      // Overheating failure should reflect temperature > 85°C in thermodynamics
      expect(state.thermodynamics.temperatureC).toBeGreaterThan(85);
    });

    it('4.5 checks whether WARM_WASH in Stage 6 triggers wash loss in stoichiometryResult', () => {
      const store = useAspirinStore.getState();
      store.setStage(6);
      store.setFailureMode('WARM_WASH');

      const state = useAspirinStore.getState();
      // WARM_WASH should override yield to wash loss range (<45%)
      expect(state.stoichiometryResult.percentYield).toBeLessThan(50.0);
    });

    it('4.6 checks clean recovery when toggling from failure mode back to NONE', () => {
      const store = useAspirinStore.getState();
      store.setFailureMode('EARLY_WATER');
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');

      store.setFailureMode('NONE');
      const recoveredState = useAspirinStore.getState();
      expect(recoveredState.failureMode).toBe('NONE');
      // If failure overrides were applied, returning to NONE should restore standard yield (>70%)
      if (recoveredState.stoichiometryResult.percentYield !== undefined) {
        expect(recoveredState.stoichiometryResult.percentYield).toBeGreaterThan(70.0);
      }
    });

    it('4.7 resets completely on resetSimulation() after failure branch and stage progression', () => {
      const store = useAspirinStore.getState();
      store.setStage(5);
      store.setFailureMode('OVERHEATING');
      store.setPlaying(false);
      store.setStageProgress(0.8);

      store.resetSimulation();

      const state = useAspirinStore.getState();
      expect(state.currentStage).toBe(1);
      expect(state.failureMode).toBe('NONE');
      expect(state.isPlaying).toBe(true);
      expect(state.stageProgress).toBe(0.0);
      expect(state.thermodynamics.stageId).toBe(1);
    });
  });
});
