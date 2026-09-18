/**
 * src/test/pedagogyAndCalculator.test.ts
 * Milestone 3: Unit and Component Test Suite for Dual-Layer Pedagogy (ELI5 & Academic Deep-Dive)
 * and Interactive Stoichiometry Yield Calculator Modal.
 * Written in pure TypeScript (.ts) using React.createElement.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useAspirinStore } from '../store/useAspirinStore';
import { Eli5PedagogyCard } from '../components/pedagogy/Eli5PedagogyCard';
import { AcademicDeepDiveCard } from '../components/pedagogy/AcademicDeepDiveCard';
import { YieldCalculatorModal } from '../components/calculator/YieldCalculatorModal';
import { calculateStoichiometry, evaluateYieldDiagnostic } from '../engine/stoichiometryEngine';
import App from '../App';

const h = React.createElement;

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Milestone 3: Educational Pedagogy & Stoichiometry Yield Calculator', () => {
  beforeEach(() => {
    useAspirinStore.getState().resetSimulation();
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Eli5PedagogyCard (Visual Analogy Layer)', () => {
    it('renders Stage 1: The Winter Coat Swap Meet', () => {
      useAspirinStore.getState().setStage(1);
      render(h(Eli5PedagogyCard));

      expect(screen.getByTestId('eli5-card')).toBeDefined();
      expect(screen.getByText(/The Winter Coat Swap Meet/i)).toBeDefined();
      expect(screen.getByText(/겨울 코트 스왑 미팅/i)).toBeDefined();
      expect(screen.getByText(/살리실산 분자는 얇은 스웨터/i)).toBeDefined();
      expect(screen.getByText(/산 촉매 양성자화/i)).toBeDefined();
    });

    it('renders Stage 2: The Sauna Transformation', () => {
      useAspirinStore.getState().setStage(2);
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Sauna Transformation/i)).toBeDefined();
      expect(screen.getByText(/사우나 대변신/i)).toBeDefined();
      expect(screen.getByText(/따뜻한 80°C 물중탕 사우나/i)).toBeDefined();
      expect(screen.getByText(/친핵성 아실 치환/i)).toBeDefined();
    });

    it('renders Stage 3: The Sneaky Disguise Party (Metastable Zone)', () => {
      useAspirinStore.getState().setStage(3);
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Sneaky Disguise Party/i)).toBeDefined();
      expect(screen.getByText(/비밀 위장 파티/i)).toBeDefined();
      expect(screen.getByText(/플라스크를 0~4°C 얼음물에 푹 담가도/i)).toBeDefined();
      expect(screen.getByText(/아세트산 공용매.*효과/i)).toBeDefined();
    });

    it('renders Stage 4: The Strict Water Guard Arrives! (Antisolvent Burst)', () => {
      useAspirinStore.getState().setStage(4);
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Strict Water Guard Arrives!/i)).toBeDefined();
      expect(screen.getByText(/엄격한 물 경비원의 습격/i)).toBeDefined();
      expect(screen.getByText(/차가운 증류수 경비원이 거대한 파도처럼/i)).toBeDefined();
      expect(screen.getByText(/반용매.*CNT 핵생성 장벽/i)).toBeDefined();
    });

    it('renders Stage 5: Building the Crystal Skyscraper', () => {
      useAspirinStore.getState().setStage(5);
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/Building the Crystal Skyscraper/i)).toBeDefined();
      expect(screen.getByText(/결정 마천루 건설/i)).toBeDefined();
      expect(screen.getByText(/\[010\] 결정 축을 따라 나노 레고 블록처럼/i)).toBeDefined();
      expect(screen.getByText(/단사정계 Form I 결정 습성/i)).toBeDefined();
    });

    it('renders Stage 6: The Ultimate Juice Press & Refreshing Shower', () => {
      useAspirinStore.getState().setStage(6);
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Ultimate Juice Press & Refreshing Shower/i)).toBeDefined();
      expect(screen.getByText(/궁극의 착즙기와 상쾌한 샤워/i)).toBeDefined();
      expect(screen.getByText(/뷰흐너 깔때기의 강력한 진공 모터가 거대한 빨대처럼/i)).toBeDefined();
      expect(screen.getByText(/다르시 케이크 여과 법칙/i)).toBeDefined();
    });

    it('displays failure mode: EARLY_WATER (The Soggy Tailor Disaster)', () => {
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Soggy Tailor Disaster/i)).toBeDefined();
      expect(screen.getByText(/재단사\(인산\)가 가위를 꺼내들기도 전에/i)).toBeDefined();
      expect(screen.getByText(/무수아세트산의 우선적 발열 가수분해/i)).toBeDefined();
    });

    it('displays failure mode: OVERHEATING (The Burnt Caramel Nightmare)', () => {
      useAspirinStore.getState().setFailureMode('OVERHEATING');
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Burnt Caramel Nightmare/i)).toBeDefined();
      expect(screen.getByText(/사우나 온도가 85°C를 넘어 용광로처럼/i)).toBeDefined();
      expect(screen.getByText(/살리실산 분자 간 자기축합/i)).toBeDefined();
    });

    it('displays failure mode: WARM_WASH (The Warm Jacuzzi Melt-Down)', () => {
      useAspirinStore.getState().setFailureMode('WARM_WASH');
      render(h(Eli5PedagogyCard));

      expect(screen.getByText(/The Warm Jacuzzi Melt-Down/i)).toBeDefined();
      expect(screen.getByText(/따뜻한 미지근한 물\(25°C\)을 부어버렸어요/i)).toBeDefined();
      expect(screen.getByText(/온도 상승에 따른 아스피린 수용해도 급증/i)).toBeDefined();
    });
  });

  describe('2. AcademicDeepDiveCard (KaTeX & Physical Chemistry Layer)', () => {
    it('renders chemical equations and mechanisms for Stage 1', () => {
      useAspirinStore.getState().setStage(1);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByTestId('academic-deep-dive-card')).toBeDefined();
      expect(screen.getByText(/산 촉매 양성자화 및 친전자성 극대화/i)).toBeDefined();
      expect(screen.getByText(/Protonation & Oxonium Ion Activation/i)).toBeDefined();
      expect(screen.getByText(/공명 안정화 옥소늄 이온/i)).toBeDefined();
      expect(screen.getByText(/K_eq ≈ 1.2 × 10\^-2/i)).toBeDefined();
    });

    it('renders SnAc mechanism and tetrahedral intermediate for Stage 2', () => {
      useAspirinStore.getState().setStage(2);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByText(/친핵성 아실 치환\(SnAc\) 및 사면체 중간체 형성/i)).toBeDefined();
      expect(screen.getByText(/sp3 사면체 중간체/i)).toBeDefined();
      expect(screen.getByText(/ΔH° ≈ -18.4 kJ\/mol/i)).toBeDefined();
    });

    it('renders Metastable Zone, Jouyban-Acree and εr for Stage 3', () => {
      useAspirinStore.getState().setStage(3);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByText(/아세트산 공용매 효과 및 준안정 영역/i)).toBeDefined();
      expect(screen.getByText(/Jouyban-Acree 공용매 모델/i)).toBeDefined();
      expect(screen.getByText(/C\* ≈ 18.5 g \/ 100 mL/i)).toBeDefined();
    });

    it('renders Classical Nucleation Theory (CNT) barrier collapse for Stage 4', () => {
      useAspirinStore.getState().setStage(4);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByText(/반용매\(Antisolvent\) 충격 및 CNT 핵생성 장벽 붕괴/i)).toBeDefined();
      expect(screen.getByText(/Classical Nucleation Theory/i)).toBeDefined();
      expect(screen.getByText(/465배 붕괴/i)).toBeDefined();
    });

    it('renders Monoclinic P2_1/c habit and dimer synthons for Stage 5', () => {
      useAspirinStore.getState().setStage(5);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByText(/단사정계 결정 다형체 성장 및 오스트발트 숙성/i)).toBeDefined();
      expect(screen.getByText(/Monoclinic Form I \(P2_1\/c\)/i)).toBeDefined();
      expect(screen.getByText(/O-H···O = 2.64 Å/i)).toBeDefined();
    });

    it('renders Darcy law and temperature selectivity for Stage 6', () => {
      useAspirinStore.getState().setStage(6);
      render(h(AcademicDeepDiveCard));

      expect(screen.getByText(/다르시 감압 케이크 여과 및 온도 선택적 세척/i)).toBeDefined();
      expect(screen.getByText(/Darcy 법칙/i)).toBeDefined();
      expect(screen.getByText(/0.08 g \/ 100 mL/i)).toBeDefined();
    });

    it('renders failure banner when failure mode is active', () => {
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      render(h(AcademicDeepDiveCard));

      expect(screen.getByTestId('academic-failure-banner')).toBeDefined();
      expect(screen.getByText(/조기 수분 혼입에 의한 무수아세트산 가수분해/i)).toBeDefined();
      expect(screen.getByText(/khyd \/ kest ≈ 22.4/i)).toBeDefined();
    });
  });

  describe('3. Stoichiometry Engine & Diagnostic Classifier', () => {
    it('calculates theoretical yield with salicylic acid limiting', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 2.0,
        aceticAnhydrideVolMl: 5.0,
        actualYieldG: 2.15,
      });

      expect(result.limitingReagent).toBe('SALICYLIC_ACID');
      expect(result.limitingReagentName).toBe('Salicylic Acid');
      expect(result.salicylicAcidMoles).toBeCloseTo(0.01448, 4);
      expect(result.aceticAnhydrideMoles).toBeCloseTo(0.05299, 4);
      expect(result.theoreticalYieldG).toBeCloseTo(2.6087, 3);
      expect(result.percentYield).toBeCloseTo(82.42, 1);
      expect(result.feedbackCategory).toBe('EXCELLENT');
    });

    it('calculates theoretical yield with acetic anhydride limiting', () => {
      const result = calculateStoichiometry({
        salicylicAcidMassG: 10.0,
        aceticAnhydrideVolMl: 2.0,
        actualYieldG: 3.0,
      });

      expect(result.limitingReagent).toBe('ACETIC_ANHYDRIDE');
      expect(result.limitingReagentName).toBe('Acetic Anhydride');
      expect(result.theoreticalYieldG).toBeCloseTo(3.8188, 3);
    });

    it('evaluates all 8 diagnostic feedback tiers correctly', () => {
      // Tier 1: Negative input (< 0)
      const t1 = evaluateYieldDiagnostic(-1.0, 2.61, -38.3);
      expect(t1.diagnostic.category).toBe('INVALID_INPUT');
      expect(t1.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 2: Zero yield (0.0)
      const t2 = evaluateYieldDiagnostic(0.0, 2.61, 0.0);
      expect(t2.diagnostic.category).toBe('ZERO_YIELD');
      expect(t2.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 3: Critical Failure (< 20%)
      const t3 = evaluateYieldDiagnostic(0.35, 2.61, 13.4);
      expect(t3.diagnostic.category).toBe('CRITICAL_FAILURE');
      expect(t3.feedbackCategory).toBe('CRITICAL_ERROR');

      // Tier 4: Severe Loss (20% ~ 49.9%)
      const t4 = evaluateYieldDiagnostic(1.0, 2.61, 38.3);
      expect(t4.diagnostic.category).toBe('SEVERE_LOSS');
      expect(t4.feedbackCategory).toBe('WASH_LOSS');

      // Tier 5: Moderate Loss (50% ~ 69.9%)
      const t5 = evaluateYieldDiagnostic(1.5, 2.61, 57.5);
      expect(t5.diagnostic.category).toBe('MODERATE_LOSS');
      expect(t5.feedbackCategory).toBe('PARTIAL_CONVERSION');

      // Tier 6: Normal Typical Lab Yield (70% ~ 89.9%)
      const t6 = evaluateYieldDiagnostic(2.0, 2.61, 76.6);
      expect(t6.diagnostic.category).toBe('NORMAL_TYPICAL');
      expect(t6.feedbackCategory).toBe('EXCELLENT');

      // Tier 7: Excellent Synthesis (90% ~ 105%)
      const t7 = evaluateYieldDiagnostic(2.45, 2.61, 93.9);
      expect(t7.diagnostic.category).toBe('EXCELLENT');
      expect(t7.feedbackCategory).toBe('EXCELLENT');

      // Tier 8: Moisture Excess (> 105%)
      const t8 = evaluateYieldDiagnostic(3.0, 2.61, 114.9);
      expect(t8.diagnostic.category).toBe('MOISTURE_EXCESS');
      expect(t8.feedbackCategory).toBe('HIGH_MOISTURE');
    });
  });

  describe('4. YieldCalculatorModal Component Interaction', () => {
    it('does not render when isCalculatorOpen is false', () => {
      useAspirinStore.getState().setCalculatorOpen(false);
      render(h(YieldCalculatorModal));

      expect(screen.queryByTestId('yield-calculator-modal')).toBeNull();
    });

    it('renders and calculates properly when opened', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      expect(screen.getByTestId('yield-calculator-modal')).toBeDefined();
      expect(screen.getByText(/화학양론 한계반응물 & 수득률 계산기/i)).toBeDefined();
      expect(screen.getByTestId('limiting-reagent-badge').textContent).toContain('Salicylic Acid');
      expect(screen.getByTestId('theoretical-yield-g').textContent).toContain('2.609');
      expect(screen.getByTestId('percent-yield-value').textContent).toContain('82.4%');
    });

    it('updates calculation upon typing in numeric input fields', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      const saInput = screen.getByTestId('input-sa-mass') as HTMLInputElement;
      fireEvent.change(saInput, { target: { value: '3.00' } });

      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(3.0);
      expect(useAspirinStore.getState().stoichiometryResult.theoreticalYieldG).toBeCloseTo(3.913, 2);
    });

    it('updates calculation upon dragging range sliders', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      const saSlider = screen.getByTestId('slider-sa-mass') as HTMLInputElement;
      fireEvent.change(saSlider, { target: { value: '4.50' } });

      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(4.5);
    });

    it('toggles expandable KaTeX derivation panel', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      const toggleBtn = screen.getByTestId('toggle-derivation-btn');
      expect(screen.queryByText(/1\. 살리실산\(SA\) 몰수 산출/i)).toBeNull();

      fireEvent.click(toggleBtn);
      expect(screen.getByText(/1\. 살리실산\(SA\) 몰수 산출/i)).toBeDefined();
      expect(screen.getByText(/2\. 무수아세트산\(AA\) 질량 및 몰수 산출/i)).toBeDefined();
      expect(screen.getByText(/3\. 한계반응물 결정 및 이론적 수득량/i)).toBeDefined();
      expect(screen.getByText(/4\. 백분율 수득률\(Percent Yield\) 공식/i)).toBeDefined();

      fireEvent.click(toggleBtn);
      expect(screen.queryByText(/1\. 살리실산\(SA\) 몰수 산출/i)).toBeNull();
    });

    it('applies preset scenarios and resets to defaults', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      // Preset: Wet moisture
      fireEvent.click(screen.getByTestId('preset-wet-moisture-btn'));
      expect(useAspirinStore.getState().stoichiometryInputs.actualYieldG).toBe(2.85);
      expect(useAspirinStore.getState().stoichiometryResult.percentYield).toBeGreaterThan(100);

      // Reset
      fireEvent.click(screen.getByTestId('reset-calculator-defaults-btn'));
      expect(useAspirinStore.getState().stoichiometryInputs.salicylicAcidMassG).toBe(2.0);
      expect(useAspirinStore.getState().stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.0);
      expect(useAspirinStore.getState().stoichiometryInputs.actualYieldG).toBe(2.15);
    });

    it('closes modal on close button click', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      fireEvent.click(screen.getByTestId('close-calculator-btn'));
      expect(useAspirinStore.getState().isCalculatorOpen).toBe(false);
    });
  });

  describe('5. App Integration & Dual-Layer Navigation', () => {
    it('switches between ELI5, Deep Dive, and Telemetry tabs in App', () => {
      render(h(App));

      // Default active tab is ELI5
      expect(screen.getByTestId('eli5-card')).toBeDefined();
      expect(screen.queryByTestId('academic-deep-dive-card')).toBeNull();

      // Switch to Deep-Dive
      fireEvent.click(screen.getByTestId('tab-btn-deep-dive'));
      expect(useAspirinStore.getState().activeTab).toBe('DEEP_DIVE');
      expect(screen.getByTestId('academic-deep-dive-card')).toBeDefined();
      expect(screen.queryByTestId('eli5-card')).toBeNull();

      // Switch to Telemetry
      fireEvent.click(screen.getByTestId('tab-btn-telemetry'));
      expect(useAspirinStore.getState().activeTab).toBe('TELEMETRY');
      expect(screen.getByTestId('telemetry-dashboard-panel')).toBeDefined();
    });

    it('opens Yield Calculator from HUD header action button', () => {
      render(h(App));

      expect(useAspirinStore.getState().isCalculatorOpen).toBe(false);
      fireEvent.click(screen.getByTestId('header-calculator-btn'));
      expect(useAspirinStore.getState().isCalculatorOpen).toBe(true);
      expect(screen.getByTestId('yield-calculator-modal')).toBeDefined();
    });
  });
});
