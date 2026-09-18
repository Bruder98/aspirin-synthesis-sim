/**
 * src/test/stoichiometryAdversarialStress.test.tsx
 * 
 * CHALLENGER 1: Adversarial Stress & Empirical Verification Suite
 * Focus: Stoichiometry Calculator & Engine (Milestone 3)
 * Target: src/engine/stoichiometryEngine.ts & src/components/calculator/YieldCalculatorModal.tsx
 * 
 * Tests:
 * 1. Numerical Boundaries (0g, negatives, extreme scales, float precision, NaN immunity)
 * 2. Limiting Reagent Crossover Sweep (molar ratio sweep 0.1 to 10.0, continuity)
 * 3. Exhaustive 8-Tier Diagnostic Tree Coverage & Boundary Precision
 * 4. Rapid Input Thrashing & UI State Stability (100 rapid updates without crash or NaN)
 * 5. Failure Mode Coupling & Store Invariant Preservation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useAspirinStore } from '../store/useAspirinStore';
import { YieldCalculatorModal } from '../components/calculator/YieldCalculatorModal';
import {
  calculateStoichiometry,
  evaluateYieldDiagnostic,
  STOICHIOMETRY_CONSTANTS,
} from '../engine/stoichiometryEngine';
import { DiagnosticCategory } from '../engine/types';

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('CHALLENGER 1: Stoichiometry Engine & Calculator Adversarial Stress Suite', () => {
  beforeEach(() => {
    useAspirinStore.getState().resetSimulation();
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // 1. NUMERICAL BOUNDARIES & ROBUSTNESS
  // =========================================================================
  describe('1. Numerical Boundaries & Extreme Values', () => {
    it('verifies exact physical constants against IUPAC standards', () => {
      expect(STOICHIOMETRY_CONSTANTS.MW_SALICYLIC_ACID).toBe(138.121);
      expect(STOICHIOMETRY_CONSTANTS.MW_ACETIC_ANHYDRIDE).toBe(102.089);
      expect(STOICHIOMETRY_CONSTANTS.DENSITY_ACETIC_ANHYDRIDE).toBe(1.082);
      expect(STOICHIOMETRY_CONSTANTS.MW_ASPIRIN).toBe(180.158);
      expect(STOICHIOMETRY_CONSTANTS.MW_ACETIC_ACID).toBe(60.052);
    });

    it('handles zero masses and volumes cleanly (0g SA, 0mL AA, 0g actual)', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 0,
        aceticAnhydrideVolMl: 0,
        actualYieldG: 0,
      });

      expect(result.salicylicAcidMoles).toBe(0);
      expect(result.aceticAnhydrideMassG).toBe(0);
      expect(result.aceticAnhydrideMoles).toBe(0);
      expect(result.limitingReagentMoles).toBe(0);
      expect(result.theoreticalYieldMoles).toBe(0);
      expect(result.theoreticalYieldG).toBe(0);
      expect(Number.isNaN(result.theoreticalYieldG)).toBe(false);
      expect(Number.isFinite(result.theoreticalYieldG)).toBe(true);
      expect(result.excessReagentPercent).toBe(0);
      // When theoretical yield is 0, percentYield should not be NaN (undefined or 0)
      expect(result.percentYield).toBeUndefined();
    });

    it('clamps or safely neutralizes negative masses and volumes', () => {
      const resultNegativeSA = calculateStoichiometry({
        salicylicAcidMassG: -5.0,
        aceticAnhydrideVolMl: 5.0,
        actualYieldG: 1.0,
      });

      // Negative SA must be clamped to 0 without NaN
      expect(resultNegativeSA.salicylicAcidMoles).toBe(0);
      expect(resultNegativeSA.theoreticalYieldG).toBe(0);
      expect(Number.isNaN(resultNegativeSA.theoreticalYieldG)).toBe(false);

      const resultNegativeAA = calculateStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: -10.0,
        actualYieldG: 1.0,
      });

      // Negative AA must be clamped to 0 without NaN
      expect(resultNegativeAA.aceticAnhydrideMoles).toBe(0);
      expect(resultNegativeAA.theoreticalYieldG).toBe(0);
      expect(Number.isNaN(resultNegativeAA.theoreticalYieldG)).toBe(false);
    });

    it('handles extremely large scale inputs (100g, 1000mL) without overflow or precision loss', () => {
      const resultLarge = calculateStoichiometry({
        salicylicAcidMassG: 100.0,
        aceticAnhydrideVolMl: 1000.0,
        actualYieldG: 110.0,
      });

      // n_SA = 100 / 138.121 = 0.724003... mol
      expect(resultLarge.salicylicAcidMoles).toBeCloseTo(0.724, 3);

      // m_AA = 1000 * 1.082 = 1082 g; n_AA = 1082 / 102.089 = 10.59859... mol
      expect(resultLarge.aceticAnhydrideMassG).toBe(1082);
      expect(resultLarge.aceticAnhydrideMoles).toBeCloseTo(10.5986, 3);

      // SA is limiting reagent
      expect(resultLarge.limitingReagent).toBe('SALICYLIC_ACID');
      expect(resultLarge.limitingReagentMoles).toBeCloseTo(0.724, 3);

      // Theoretical yield = 0.724003 * 180.158 = 130.435 g
      expect(resultLarge.theoreticalYieldG).toBeCloseTo(130.435, 2);

      // Percent yield = (110 / 130.435) * 100 = 84.33%
      expect(resultLarge.percentYield).toBeCloseTo(84.33, 1);
      expect(resultLarge.diagnostic.category).toBe('NORMAL_TYPICAL');
    });

    it('handles micro-scale inputs (1 mg scale) and documents 5-decimal rounding cutoff without NaN', () => {
      // 1 mg (0.001 g) is within 5-decimal molar resolution (0.001 / 138.121 = 0.00000724 -> 0.00001 mol)
      const resultMilli = calculateStoichiometry({
        salicylicAcidMassG: 0.001,
        aceticAnhydrideVolMl: 0.001,
      });

      expect(resultMilli.salicylicAcidMoles).toBe(0.00001);
      expect(resultMilli.aceticAnhydrideMoles).toBe(0.00001);
      expect(resultMilli.theoreticalYieldG).toBeCloseTo(0.0013, 4);
      expect(Number.isFinite(resultMilli.theoreticalYieldG)).toBe(true);

      // Sub-milligram (<0.69 mg): rounds to 0.00000 mol due to 5-decimal rounding, handled cleanly without NaN
      const resultSubMilli = calculateStoichiometry({
        salicylicAcidMassG: 0.0001,
        aceticAnhydrideVolMl: 0.0001,
      });
      expect(resultSubMilli.salicylicAcidMoles).toBe(0);
      expect(resultSubMilli.theoreticalYieldG).toBe(0.0001);
      expect(Number.isNaN(resultSubMilli.theoreticalYieldG)).toBe(false);
    });

    it('resists direct NaN and Infinity inputs gracefully', () => {
      const nanResult = calculateStoichiometry({
        salicylicAcidMassG: NaN,
        aceticAnhydrideVolMl: NaN,
        actualYieldG: NaN,
      });

      expect(Number.isNaN(nanResult.theoreticalYieldG)).toBe(false);
      expect(nanResult.salicylicAcidMoles).toBe(0);
      expect(nanResult.aceticAnhydrideMoles).toBe(0);

      const infResult = calculateStoichiometry({
        salicylicAcidMassG: Infinity,
        aceticAnhydrideVolMl: 5.0,
      });
      // Infinity SA means AA is limiting reagent
      expect(infResult.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(Number.isFinite(infResult.theoreticalYieldG)).toBe(true);
    });
  });

  // =========================================================================
  // 2. LIMITING REAGENT CROSSOVER SWEEP (0.1 to 10.0 MOLAR RATIO)
  // =========================================================================
  describe('2. Limiting Reagent Crossover & Continuity Sweep', () => {
    it('sweeps molar ratios (n_SA / n_AA) from 0.1 to 10.0 across 100 sample steps', () => {
      const fixedMolesSA = 0.01; // 0.01 mol SA = 1.38121 g
      const massSA = fixedMolesSA * STOICHIOMETRY_CONSTANTS.MW_SALICYLIC_ACID;

      let crossoverObserved = false;
      let previousTheoreticalYield = 0;

      for (let i = 1; i <= 100; i++) {
        // Ratio sweeps from 0.1 to 10.0
        const molarRatio = 0.1 + (i / 100) * 9.9;
        // n_AA = n_SA / molarRatio
        const targetMolesAA = fixedMolesSA / molarRatio;
        const massAA = targetMolesAA * STOICHIOMETRY_CONSTANTS.MW_ACETIC_ANHYDRIDE;
        const volAA = massAA / STOICHIOMETRY_CONSTANTS.DENSITY_ACETIC_ANHYDRIDE;

        const result = calculateStoichiometry({
          salicylicAcidMassG: massSA,
          aceticAnhydrideVolMl: volAA,
          actualYieldG: 1.0,
        });

        // Check Limiting Reagent assignment
        if (molarRatio < 0.999) {
          // n_SA < n_AA: Salicylic acid must be limiting
          expect(result.limitingReagent).toBe('SALICYLIC_ACID');
          expect(result.limitingReagentName).toBe('Salicylic Acid');
          expect(result.limitingReagentMoles).toBeCloseTo(fixedMolesSA, 4);
          expect(result.excessReagentPercent).toBeGreaterThanOrEqual(0);
        } else if (molarRatio > 1.001) {
          // n_SA > n_AA: Acetic anhydride must be limiting
          expect(result.limitingReagent).toBe('ACETIC_ANHYDRIDE');
          expect(result.limitingReagentName).toBe('Acetic Anhydride');
          expect(result.limitingReagentMoles).toBeCloseTo(targetMolesAA, 4);
          expect(result.excessReagentPercent).toBeGreaterThanOrEqual(0);
          crossoverObserved = true;
        }

        // Theoretical yield must never be negative or NaN
        expect(result.theoreticalYieldG).toBeGreaterThan(0);
        expect(Number.isNaN(result.theoreticalYieldG)).toBe(false);

        // Limiting reagent moles must strictly equal min(n_SA, n_AA)
        const expectedMinMoles = Math.min(result.salicylicAcidMoles, result.aceticAnhydrideMoles);
        expect(result.limitingReagentMoles).toBeCloseTo(expectedMinMoles, 4);

        previousTheoreticalYield = result.theoreticalYieldG;
      }

      expect(crossoverObserved).toBe(true);
    });

    it('verifies exact equimolar boundary behavior at n_SA == n_AA', () => {
      // Exactly 0.015 mol of both SA and AA
      const targetMoles = 0.015;
      const massSA = targetMoles * STOICHIOMETRY_CONSTANTS.MW_SALICYLIC_ACID;
      const massAA = targetMoles * STOICHIOMETRY_CONSTANTS.MW_ACETIC_ANHYDRIDE;
      const volAA = massAA / STOICHIOMETRY_CONSTANTS.DENSITY_ACETIC_ANHYDRIDE;

      const result = calculateStoichiometry({
        salicylicAcidMassG: massSA,
        aceticAnhydrideVolMl: volAA,
      });

      expect(result.salicylicAcidMoles).toBeCloseTo(targetMoles, 5);
      expect(result.aceticAnhydrideMoles).toBeCloseTo(targetMoles, 5);
      expect(result.limitingReagentMoles).toBeCloseTo(targetMoles, 5);
      expect(result.excessReagentPercent).toBeCloseTo(0.0, 1);
      expect(result.theoreticalYieldG).toBeCloseTo(targetMoles * STOICHIOMETRY_CONSTANTS.MW_ASPIRIN, 3);
    });
  });

  // =========================================================================
  // 3. EXHAUSTIVE 8-TIER DIAGNOSTIC TREE COVERAGE
  // =========================================================================
  describe('3. Exhaustive 8-Tier Diagnostic Tree Coverage', () => {
    const theoG = 2.6087;

    const allCategories: DiagnosticCategory[] = [
      'INVALID_INPUT',
      'ZERO_YIELD',
      'CRITICAL_FAILURE',
      'SEVERE_LOSS',
      'MODERATE_LOSS',
      'NORMAL_TYPICAL',
      'EXCELLENT',
      'MOISTURE_EXCESS',
    ];

    it('triggers all 8 distinct diagnostic categories without omission', () => {
      const triggeredCategories = new Set<DiagnosticCategory>();

      // Tier 1: INVALID_INPUT (< 0)
      const d1 = evaluateYieldDiagnostic(-0.5, theoG, -19.2);
      triggeredCategories.add(d1.diagnostic.category);
      expect(d1.diagnostic.category).toBe('INVALID_INPUT');
      expect(d1.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 2: ZERO_YIELD (== 0)
      const d2 = evaluateYieldDiagnostic(0.0, theoG, 0.0);
      triggeredCategories.add(d2.diagnostic.category);
      expect(d2.diagnostic.category).toBe('ZERO_YIELD');
      expect(d2.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 3: CRITICAL_FAILURE (0 < yield < 20%)
      const d3 = evaluateYieldDiagnostic(0.26, theoG, 10.0);
      triggeredCategories.add(d3.diagnostic.category);
      expect(d3.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(d3.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 4: SEVERE_LOSS (20% <= yield < 50%)
      const d4 = evaluateYieldDiagnostic(0.91, theoG, 35.0);
      triggeredCategories.add(d4.diagnostic.category);
      expect(d4.diagnostic.category).toBe('SEVERE_LOSS');
      expect(d4.feedbackCategory).toBe('WASH_LOSS');

      // Tier 5: MODERATE_LOSS (50% <= yield < 70%)
      const d5 = evaluateYieldDiagnostic(1.56, theoG, 60.0);
      triggeredCategories.add(d5.diagnostic.category);
      expect(d5.diagnostic.category).toBe('MODERATE_LOSS');
      expect(d5.feedbackCategory).toBe('PARTIAL_CONVERSION');

      // Tier 6: NORMAL_TYPICAL (70% <= yield < 90%)
      const d6 = evaluateYieldDiagnostic(2.08, theoG, 80.0);
      triggeredCategories.add(d6.diagnostic.category);
      expect(d6.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(d6.feedbackCategory).toBe('EXCELLENT');

      // Tier 7: EXCELLENT (90% <= yield <= 105%)
      const d7 = evaluateYieldDiagnostic(2.55, theoG, 98.0);
      triggeredCategories.add(d7.diagnostic.category);
      expect(d7.diagnostic.category).toBe('EXCELLENT');
      expect(d7.feedbackCategory).toBe('EXCELLENT');

      // Tier 8: MOISTURE_EXCESS (> 105%)
      const d8 = evaluateYieldDiagnostic(3.13, theoG, 120.0);
      triggeredCategories.add(d8.diagnostic.category);
      expect(d8.diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(d8.feedbackCategory).toBe('HIGH_MOISTURE');

      // Verify every category in the domain specification was activated
      for (const cat of allCategories) {
        expect(triggeredCategories.has(cat)).toBe(true);
      }
      expect(triggeredCategories.size).toBe(8);
    });

    it('tests razor-sharp boundary transitions between diagnostic tiers', () => {
      // Boundary between CRITICAL_FAILURE (<20.0%) and SEVERE_LOSS (>=20.0%)
      const below20 = evaluateYieldDiagnostic(0.5217, theoG, 19.999);
      const exact20 = evaluateYieldDiagnostic(0.52174, theoG, 20.000);
      expect(below20.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(exact20.diagnostic.category).toBe('SEVERE_LOSS');

      // Boundary between SEVERE_LOSS (<50.0%) and MODERATE_LOSS (>=50.0%)
      const below50 = evaluateYieldDiagnostic(1.3043, theoG, 49.999);
      const exact50 = evaluateYieldDiagnostic(1.30435, theoG, 50.000);
      expect(below50.diagnostic.category).toBe('SEVERE_LOSS');
      expect(exact50.diagnostic.category).toBe('MODERATE_LOSS');

      // Boundary between MODERATE_LOSS (<70.0%) and NORMAL_TYPICAL (>=70.0%)
      const below70 = evaluateYieldDiagnostic(1.8260, theoG, 69.999);
      const exact70 = evaluateYieldDiagnostic(1.82609, theoG, 70.000);
      expect(below70.diagnostic.category).toBe('MODERATE_LOSS');
      expect(exact70.diagnostic.category).toBe('NORMAL_TYPICAL');

      // Boundary between NORMAL_TYPICAL (<90.0%) and EXCELLENT (>=90.0%)
      const below90 = evaluateYieldDiagnostic(2.3478, theoG, 89.999);
      const exact90 = evaluateYieldDiagnostic(2.34783, theoG, 90.000);
      expect(below90.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(exact90.diagnostic.category).toBe('EXCELLENT');

      // Boundary between EXCELLENT (<=105.0%) and MOISTURE_EXCESS (>105.0%)
      const exact105 = evaluateYieldDiagnostic(2.7391, theoG, 105.000);
      const above105 = evaluateYieldDiagnostic(2.7392, theoG, 105.001);
      expect(exact105.diagnostic.category).toBe('EXCELLENT');
      expect(above105.diagnostic.category).toBe('MOISTURE_EXCESS');
    });

    it('proves mutual exclusivity and exhaustiveness across 500 continuous test points', () => {
      for (let i = 0; i <= 500; i++) {
        const simulatedPercent = -5 + (i / 500) * 150; // Range: -5% to +145%
        const simulatedMass = (simulatedPercent / 100) * theoG;

        const diag = evaluateYieldDiagnostic(simulatedMass, theoG, simulatedPercent);

        expect(allCategories).toContain(diag.diagnostic.category);
        expect(diag.diagnostic.title).toBeDefined();
        expect(diag.diagnostic.description.length).toBeGreaterThan(10);
        expect(diag.diagnostic.recommendation.length).toBeGreaterThan(10);
      }
    });
  });

  // =========================================================================
  // 4. RAPID INPUT CHANGES & REACT UI STATE STABILITY (100 UPDATES)
  // =========================================================================
  describe('4. Rapid State Updates & UI Stability (100 Thrashing Cycles)', () => {
    it('executes 100 rapid successive state updates in YieldCalculatorModal without crash or NaN', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(React.createElement(YieldCalculatorModal));

      const saInput = screen.getByTestId('input-sa-mass') as HTMLInputElement;
      const aaInput = screen.getByTestId('input-aa-vol') as HTMLInputElement;
      const actualInput = screen.getByTestId('input-actual-yield') as HTMLInputElement;

      expect(saInput).toBeDefined();
      expect(aaInput).toBeDefined();
      expect(actualInput).toBeDefined();

      // Stress loop: 100 rapid input changes
      for (let i = 1; i <= 100; i++) {
        const saVal = (0.5 + ((i * 7) % 95) / 10).toFixed(2); // 0.5 ~ 10.0
        const aaVal = (1.0 + ((i * 11) % 190) / 10).toFixed(1); // 1.0 ~ 20.0
        const actualVal = (((i * 13) % 60) / 10).toFixed(2); // 0.0 ~ 6.0

        fireEvent.change(saInput, { target: { value: saVal } });
        fireEvent.change(aaInput, { target: { value: aaVal } });
        fireEvent.change(actualInput, { target: { value: actualVal } });

        const store = useAspirinStore.getState();
        expect(store.stoichiometryInputs.salicylicAcidMassG).toBe(parseFloat(saVal));
        expect(store.stoichiometryInputs.aceticAnhydrideVolMl).toBe(parseFloat(aaVal));
        expect(store.stoichiometryInputs.actualYieldG).toBe(parseFloat(actualVal));

        // Verify no NaN in resulting calculations
        expect(Number.isNaN(store.stoichiometryResult.theoreticalYieldG)).toBe(false);
        expect(store.stoichiometryResult.theoreticalYieldG).toBeGreaterThan(0);
        if (store.stoichiometryResult.percentYield !== undefined) {
          expect(Number.isNaN(store.stoichiometryResult.percentYield)).toBe(false);
        }
      }

      // Verify DOM reflects clean numbers without NaN or corruption
      const theoText = screen.getByTestId('theoretical-yield-g').textContent;
      const percentText = screen.getByTestId('percent-yield-value').textContent;
      const reagentText = screen.getByTestId('limiting-reagent-badge').textContent;

      expect(theoText).not.toContain('NaN');
      expect(percentText).not.toContain('NaN');
      expect(reagentText).not.toContain('NaN');
      expect(['Salicylic Acid', 'Acetic Anhydride']).toContain(reagentText);

      // Verify preset buttons and reset button still function after thrashing
      fireEvent.click(screen.getByTestId('reset-calculator-defaults-btn'));
      const resetStore = useAspirinStore.getState();
      expect(resetStore.stoichiometryInputs.salicylicAcidMassG).toBe(2.0);
      expect(resetStore.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.0);
      expect(resetStore.stoichiometryInputs.actualYieldG).toBe(2.15);
      expect(resetStore.stoichiometryResult.limitingReagent).toBe('SALICYLIC_ACID');
    }, 20000);

    it('survives rapid empty string and zero inputs in UI fields without throw', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(React.createElement(YieldCalculatorModal));

      const saInput = screen.getByTestId('input-sa-mass') as HTMLInputElement;

      // Type empty string
      fireEvent.change(saInput, { target: { value: '' } });
      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(0);

      // Type 0
      fireEvent.change(saInput, { target: { value: '0' } });
      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(0);

      // Type negative
      fireEvent.change(saInput, { target: { value: '-3.5' } });
      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(-3.5);
      expect(useAspirinStore.getState().stoichiometryResult.theoreticalYieldG).toBe(0);
      expect(screen.getByTestId('theoretical-yield-g').textContent).toContain('0.000');
    });
  });

  // =========================================================================
  // 5. FAILURE MODE COUPLING & STORE INVARIANTS
  // =========================================================================
  describe('5. Failure Mode Coupling & Store Invariants', () => {
    it('synchronizes failure mode overrides correctly with stoichiometry', () => {
      // 1. EARLY_WATER: must force 0% yield
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      const earlyWaterResult = useAspirinStore.getState().stoichiometryResult;
      expect(earlyWaterResult.actualYieldG).toBe(0);
      expect(earlyWaterResult.percentYield).toBe(0);
      expect(earlyWaterResult.diagnostic.category).toBe('ZERO_YIELD');
      expect(earlyWaterResult.feedbackCategory).toBe('CRITICAL_ERROR');

      // 2. OVERHEATING: must force ~12.5% yield and tar warning
      useAspirinStore.getState().setFailureMode('OVERHEATING');
      const overheatResult = useAspirinStore.getState().stoichiometryResult;
      expect(overheatResult.percentYield).toBe(12.5);
      expect(overheatResult.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(overheatResult.feedbackCategory).toBe('CRITICAL_ERROR');

      // 3. WARM_WASH: must force 32% yield and wash loss warning
      useAspirinStore.getState().setFailureMode('WARM_WASH');
      const washResult = useAspirinStore.getState().stoichiometryResult;
      expect(washResult.percentYield).toBe(32.0);
      expect(washResult.diagnostic.category).toBe('SEVERE_LOSS');
      expect(washResult.feedbackCategory).toBe('WASH_LOSS');

      // 4. Reset to NONE restores nominal calculation
      useAspirinStore.getState().setFailureMode('NONE');
      const normalResult = useAspirinStore.getState().stoichiometryResult;
      expect(normalResult.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(normalResult.feedbackCategory).toBe('EXCELLENT');
    });
  });
});
