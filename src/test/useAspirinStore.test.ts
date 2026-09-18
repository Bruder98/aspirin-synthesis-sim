import { describe, it, expect, beforeEach } from 'vitest';
import { useAspirinStore } from '../store/useAspirinStore';

describe('useAspirinStore Zustand Store', () => {
  beforeEach(() => {
    useAspirinStore.getState().resetSimulation();
  });

  it('initializes with proper default state and stoichiometry calculations', () => {
    const state = useAspirinStore.getState();
    expect(state.currentStage).toBe(1);
    expect(state.failureMode).toBe('NONE');
    expect(state.isPlaying).toBe(true);
    expect(state.stageProgress).toBe(0.0);
    expect(state.stoichiometryInputs.salicylicAcidMassG).toBe(2.00);
    expect(state.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.00);
    expect(state.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
    expect(state.thermodynamics.stageId).toBe(1);
  });

  it('updates stage and recalculates thermodynamics reactively', () => {
    const store = useAspirinStore.getState();

    // Transition to Stage 3 (Ice Bath Cooling - Metastable Zone)
    store.setStage(3);
    let state = useAspirinStore.getState();
    expect(state.currentStage).toBe(3);
    expect(state.thermodynamics.isMetastable).toBe(true);
    expect(state.thermodynamics.isPrecipitating).toBe(false);

    // Transition to Stage 4 (Antisolvent Shock - Crystal Burst)
    store.nextStage();
    state = useAspirinStore.getState();
    expect(state.currentStage).toBe(4);
    expect(state.thermodynamics.isMetastable).toBe(false);
    expect(state.thermodynamics.isPrecipitating).toBe(true);
    expect(state.thermodynamics.isSpinodalBurst).toBe(true);
  });

  it('clamps stage boundaries between 1 and 6', () => {
    const store = useAspirinStore.getState();

    // Attempt to go backward from 1
    store.prevStage();
    expect(useAspirinStore.getState().currentStage).toBe(1);

    // Jump to 6
    store.setStage(6);
    expect(useAspirinStore.getState().currentStage).toBe(6);

    // Attempt to go forward beyond 6
    store.nextStage();
    expect(useAspirinStore.getState().currentStage).toBe(6);

    // Arbitrary out-of-range inputs
    store.setStage(99 as any);
    expect(useAspirinStore.getState().currentStage).toBe(6);

    store.setStage(-5 as any);
    expect(useAspirinStore.getState().currentStage).toBe(1);
  });

  it('manages playback controls and stage progress', () => {
    const store = useAspirinStore.getState();

    store.togglePlaying();
    expect(useAspirinStore.getState().isPlaying).toBe(false);

    store.setPlaying(true);
    expect(useAspirinStore.getState().isPlaying).toBe(true);

    store.setStageProgress(0.75);
    expect(useAspirinStore.getState().stageProgress).toBe(0.75);

    // Progress is clamped between 0 and 1
    store.setStageProgress(1.5);
    expect(useAspirinStore.getState().stageProgress).toBe(1.0);

    store.setStageProgress(-0.2);
    expect(useAspirinStore.getState().stageProgress).toBe(0.0);

    store.setPlaybackSpeed(2.0);
    expect(useAspirinStore.getState().playbackSpeed).toBe(2.0);
  });

  it('updates stoichiometry inputs and recalculates dependent values', () => {
    const store = useAspirinStore.getState();

    store.updateStoichiometry({
      salicylicAcidMassG: 5.00,
      aceticAnhydrideVolMl: 2.00,
      actualYieldG: 1.80
    });

    const state = useAspirinStore.getState();
    expect(state.stoichiometryInputs.salicylicAcidMassG).toBe(5.00);
    expect(state.stoichiometryInputs.aceticAnhydrideVolMl).toBe(2.00);
    // AA should now be limiting
    expect(state.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
    expect(state.stoichiometryResult.actualYieldG).toBe(1.80);
    expect(state.stoichiometryResult.percentYield).toBeDefined();
  });

  it('switches failure modes and resets cleanly', () => {
    const store = useAspirinStore.getState();

    store.setFailureMode('EARLY_WATER');
    expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');

    store.setStage(4);
    store.resetSimulation();

    const resetState = useAspirinStore.getState();
    expect(resetState.currentStage).toBe(1);
    expect(resetState.failureMode).toBe('NONE');
    expect(resetState.isPlaying).toBe(true);
    expect(resetState.stageProgress).toBe(0.0);
  });

  it('sanitizes float and NaN stage inputs cleanly', () => {
    const store = useAspirinStore.getState();

    // Floats round to nearest integer
    store.setStage(2.7 as any);
    expect(useAspirinStore.getState().currentStage).toBe(3);

    store.setStage(1.2 as any);
    expect(useAspirinStore.getState().currentStage).toBe(1);

    // NaN safely preserves or falls back to valid stage
    store.setStage(NaN as any);
    const stage = useAspirinStore.getState().currentStage;
    expect(Number.isNaN(stage)).toBe(false);
    expect(stage).toBeGreaterThanOrEqual(1);
    expect(stage).toBeLessThanOrEqual(6);
  });

  it('reactively updates stoichiometry and thermodynamics across failure modes', () => {
    const store = useAspirinStore.getState();

    // EARLY_WATER: 0% yield, no crystallization
    store.setStage(4);
    store.setFailureMode('EARLY_WATER');
    let state = useAspirinStore.getState();
    expect(state.failureMode).toBe('EARLY_WATER');
    expect(state.stoichiometryResult.actualYieldG).toBe(0.0);
    expect(state.stoichiometryResult.percentYield).toBe(0.0);
    expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
    expect(state.thermodynamics.isPrecipitating).toBe(false);
    expect(state.thermodynamics.supersaturation).toBe(0.0);

    // OVERHEATING: elevated temperature, reduced yield
    store.setStage(2);
    store.setFailureMode('OVERHEATING');
    state = useAspirinStore.getState();
    expect(state.thermodynamics.temperatureC).toBeGreaterThan(85);
    expect(state.stoichiometryResult.percentYield).toBe(12.5);
    expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');

    // WARM_WASH: wash loss in stage 6
    store.setStage(6);
    store.setFailureMode('WARM_WASH');
    state = useAspirinStore.getState();
    expect(state.stoichiometryResult.percentYield).toBe(32.0);
    expect(state.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');
    expect(state.thermodynamics.temperatureC).toBe(25);
    expect(state.thermodynamics.solubilityGPer100Ml).toBe(3.3);

    // Toggle back to NONE: restores nominal yield
    store.setFailureMode('NONE');
    state = useAspirinStore.getState();
    expect(state.failureMode).toBe('NONE');
    expect(state.stoichiometryResult.percentYield).toBeGreaterThan(70.0);
  });
});

