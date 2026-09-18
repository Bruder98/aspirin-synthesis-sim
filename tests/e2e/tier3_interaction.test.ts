import { describe, it, expect, beforeEach } from 'vitest';
import {
  createReferenceStore,
  calculateReferenceStoichiometry,
  calculateReferenceThermodynamics,
  AspirinStoreState,
} from './testRunner';

describe('Tier 3: Cross-Feature Interactions, Failure Cascades & State Persistence', () => {
  let store: AspirinStoreState;

  beforeEach(() => {
    store = createReferenceStore();
  });

  // =========================================================================
  // Stage Transitions & Stoichiometric State Persistence
  // =========================================================================
  describe('Stage Transitions & Parameter Persistence', () => {
    it('preserves customized stoichiometry inputs across forward stage transitions (Stage 1 -> 6)', () => {
      store.updateStoichiometry({
        salicylicAcidMassG: 3.50,
        aceticAnhydrideVolMl: 7.00,
        actualYieldG: 3.80,
      });

      // Advance through all stages
      for (let s = 1; s <= 5; s++) {
        store.nextStage();
      }
      expect(store.currentStage).toBe(6);

      // Verify custom inputs and computed results persist intact
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(3.50);
      expect(store.stoichiometryInputs.aceticAnhydrideVolMl).toBe(7.00);
      expect(store.stoichiometryInputs.actualYieldG).toBe(3.80);
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(4.565, 2);
      expect(store.stoichiometryResult.percentYield).toBeCloseTo(83.24, 1);
    });

    it('preserves customized stoichiometry inputs across backward stage navigation (Stage 6 -> 1)', () => {
      store.setStage(6);
      store.updateStoichiometry({ salicylicAcidMassG: 4.20 });

      for (let s = 6; s >= 2; s--) {
        store.prevStage();
      }
      expect(store.currentStage).toBe(1);
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(4.20);
    });

    it('retains animation play/pause state when switching stages', () => {
      expect(store.isPlaying).toBe(true);
      store.setPlaying(false);
      expect(store.isPlaying).toBe(false);

      store.setStage(3);
      expect(store.isPlaying).toBe(false);

      store.nextStage();
      expect(store.isPlaying).toBe(false);

      store.setPlaying(true);
      expect(store.isPlaying).toBe(true);
    });
  });

  // =========================================================================
  // Failure Branch Cascades Across Stage Progression
  // =========================================================================
  describe('Failure Branch Cascades Across Stages', () => {
    it('EARLY_WATER failure in Stage 1 suppresses crystal burst in Stage 4 and 5', () => {
      store.setStage(1);
      store.setFailureMode('EARLY_WATER');

      // Normal Stage 4 has isPrecipitating=true, but EARLY_WATER suppresses it
      store.setStage(4);
      expect(store.currentStage).toBe(4);
      expect(store.failureMode).toBe('EARLY_WATER');
      expect(store.thermodynamics.isPrecipitating).toBe(false);
      expect(store.thermodynamics.supersaturation).toBe(0.0);
      expect(store.stoichiometryResult.actualYieldG).toBe(0.0);
      expect(store.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
    });

    it('OVERHEATING failure in Stage 2 persists elevated temperature and tar state into Stage 5', () => {
      store.setStage(2);
      store.setFailureMode('OVERHEATING');
      expect(store.thermodynamics.temperatureC).toBe(95);

      store.setStage(5);
      expect(store.failureMode).toBe('OVERHEATING');
      expect(store.thermodynamics.isPrecipitating).toBe(false); // Gummy tar instead of white crystals
    });

    it('WARM_WASH failure in Stage 6 specifically triggers elevated solubility and mass deficit', () => {
      store.setStage(5);
      expect(store.thermodynamics.isPrecipitating).toBe(true);

      store.setStage(6);
      store.setFailureMode('WARM_WASH');
      expect(store.thermodynamics.temperatureC).toBe(25);
      expect(store.thermodynamics.solubilityGPer100Ml).toBeGreaterThan(3.0);
      expect(store.stoichiometryResult.percentYield).toBeLessThan(35.0);
      expect(store.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');
    });

    it('switching failureMode from WARM_WASH back to NONE restores normal Stage 6 cold wash', () => {
      store.setStage(6);
      store.setFailureMode('WARM_WASH');
      expect(store.thermodynamics.temperatureC).toBe(25);

      store.setFailureMode('NONE');
      expect(store.failureMode).toBe('NONE');
      expect(store.thermodynamics.temperatureC).toBe(4);
      expect(store.thermodynamics.solubilityGPer100Ml).toBeLessThan(0.3);
    });
  });

  // =========================================================================
  // Dynamic Stoichiometry Crossover & Limiting Reagent Inversion
  // =========================================================================
  describe('Dynamic Stoichiometry Crossover & Inversion', () => {
    it('dynamically flips limiting reagent and recalculates theoretical yield on the fly', () => {
      // Initially: 2.00 g SA, 5.00 mL AA -> SA limiting (0.0145 mol vs 0.0530 mol)
      expect(store.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(2.6087, 2);

      // Drastically reduce AA to 1.00 mL -> AA becomes limiting (0.0106 mol < 0.0145 mol)
      store.updateStoichiometry({ aceticAnhydrideVolMl: 1.00 });
      expect(store.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(store.stoichiometryResult.limitingReagentMoles).toBeCloseTo(0.0106, 4);
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(1.909, 2);

      // Increase SA to 10.00 g -> AA remains limiting
      store.updateStoichiometry({ salicylicAcidMassG: 10.00 });
      expect(store.stoichiometryResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(1.909, 2);

      // Restore AA to 15.00 mL -> SA flips back to limiting
      store.updateStoichiometry({ aceticAnhydrideVolMl: 15.00 });
      expect(store.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
      expect(store.stoichiometryResult.theoreticalYieldG).toBeCloseTo(13.043, 2);
    });

    it('updating actual yield mass shifts diagnostic feedback dynamically through tiers', () => {
      // Theo yield is ~2.6087 g
      // Test High Moisture (>105%): 3.00 g
      store.updateStoichiometry({ actualYieldG: 3.00 });
      expect(store.stoichiometryResult.feedbackCategory).toBe('HIGH_MOISTURE');

      // Test Excellent (80-105%): 2.30 g (~88%)
      store.updateStoichiometry({ actualYieldG: 2.30 });
      expect(store.stoichiometryResult.feedbackCategory).toBe('EXCELLENT');

      // Test Partial Conversion (60-79.9%): 1.80 g (~69%)
      store.updateStoichiometry({ actualYieldG: 1.80 });
      expect(store.stoichiometryResult.feedbackCategory).toBe('PARTIAL_CONVERSION');

      // Test Wash Loss (25-59.9%): 1.10 g (~42%)
      store.updateStoichiometry({ actualYieldG: 1.10 });
      expect(store.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');

      // Test Critical Error (<25%): 0.30 g (~11%)
      store.updateStoichiometry({ actualYieldG: 0.30 });
      expect(store.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
    });
  });

  // =========================================================================
  // Total Reset Interaction
  // =========================================================================
  describe('Total Reset Synchronization', () => {
    it('resets from any deeply modified state back to Stage 1 pristine baseline', () => {
      store.setStage(5);
      store.setFailureMode('OVERHEATING');
      store.setPlaying(false);
      store.updateStoichiometry({
        salicylicAcidMassG: 7.50,
        aceticAnhydrideVolMl: 2.50,
        actualYieldG: 1.00,
      });

      expect(store.currentStage).toBe(5);
      expect(store.failureMode).toBe('OVERHEATING');
      expect(store.isPlaying).toBe(false);

      // Perform complete reset
      store.resetSimulation();

      expect(store.currentStage).toBe(1);
      expect(store.failureMode).toBe('NONE');
      expect(store.isPlaying).toBe(true);
      expect(store.stageProgress).toBe(0.0);
      expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(2.00);
      expect(store.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.00);
      expect(store.thermodynamics.stageId).toBe(1);
      expect(store.thermodynamics.isMetastable).toBe(false);
      expect(store.thermodynamics.isPrecipitating).toBe(false);
    });
  });
});
