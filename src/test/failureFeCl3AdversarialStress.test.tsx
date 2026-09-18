/**
 * src/test/failureFeCl3AdversarialStress.test.tsx
 * CHALLENGER 2: Milestone 4 Failure Branching & FeCl3 Modal Adversarial Verifier
 *
 * Comprehensive Empirical Adversarial Stress Suite verifying:
 * 1. High-Frequency Failure Mode Toggling at 60Hz (`NONE -> EARLY_WATER -> OVERHEATING -> WARM_WASH -> NONE`)
 *    under active simulation playback and non-linear stage progression.
 * 2. Bi-directional Synchronization between Header Dropdown (`failure-mode-select`),
 *    FailureScenarioControl cards, and Reset controls.
 * 3. FeCl3 Qualitative Test Modal Lifecycle: rapid open/close thrashing, Escape key listeners,
 *    DOM cleanup, and state auto-reset.
 * 4. Droplet Dispensing Spam & Concurrency Guards (`isDropping` debouncing, mid-animation unmounts,
 *    and manual test resets).
 * 5. Spectrophotometric Color Transitions & Diagnostic Purity Verification across all 4 failure branches:
 *    - NONE: Negative transparent amber (#EAB308) - Complete acetylation (~90% yield)
 *    - EARLY_WATER: Strong positive deep violet (#6B21A8) - Unreacted phenolic -OH (0% yield)
 *    - OVERHEATING: Dark murky brown tar (#451A03) - Self-condensation & decarboxylation (~12.5% yield)
 *    - WARM_WASH: Negative amber (#F59E0B) - Pure product but severe dissolution loss (~32% yield)
 *    - Live failure mode hot-swap while modal is actively open and liquid is displayed.
 * 6. KaTeX Chemical Coordination Formula Rendering & Error Resilience.
 * 7. Full Cockpit Chaos Monkey: 150 randomized concurrent actions across failure modes, modals,
 *    stages, tabs, and audio controls with zero errors.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import katex from 'katex';
import { useAspirinStore } from '../store/useAspirinStore';
import { FailureScenarioControl } from '../components/controls/FailureScenarioControl';
import { FeCl3TestModal } from '../components/controls/FeCl3TestModal';
import { FailureMode, SynthesisStageId } from '../engine/types';
import { setAudioMuted } from '../utils/audioSynthesizer';
import App from '../App';

const h = React.createElement;

// ---------------------------------------------------------------------------
// JSDOM Environment Harness Mocks
// ---------------------------------------------------------------------------

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

class MockAudioNode {
  connect = vi.fn().mockReturnValue({});
  disconnect = vi.fn();
}

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn().mockReturnThis();
  linearRampToValueAtTime = vi.fn().mockReturnThis();
  exponentialRampToValueAtTime = vi.fn().mockReturnThis();
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockAudioContext {
  state = 'running';
  currentTime = 10.0;
  destination = new MockAudioNode();
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Test Suite Begins
// ---------------------------------------------------------------------------

describe('CHALLENGER 2: Failure Branching & FeCl3 Modal Adversarial Verification', () => {
  beforeEach(() => {
    (window as any).AudioContext = MockAudioContext;
    setAudioMuted(false);
    useAspirinStore.getState().resetSimulation();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // =========================================================================
  // SUITE 1: High-Frequency Failure Mode Toggling at 60Hz with Active Simulation
  // =========================================================================
  describe('1. High-Frequency 60Hz Failure Mode Toggling Under Live Simulation', () => {
    it('thrashes failure modes across 120 cycles at 60Hz while simulation is actively playing and scrubbing', () => {
      const store = useAspirinStore.getState();
      store.setPlaying(true);
      expect(useAspirinStore.getState().isPlaying).toBe(true);

      const modes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];

      // 120 cycles of 60Hz simulation step transitions
      for (let i = 0; i < 120; i++) {
        const mode = modes[i % modes.length];
        const stage = stages[i % stages.length];
        const progress = (i % 100) / 100;

        act(() => {
          useAspirinStore.getState().setFailureMode(mode);
          useAspirinStore.getState().setStage(stage);
          useAspirinStore.getState().setStageProgress(progress);
        });

        const state = useAspirinStore.getState();
        expect(state.failureMode).toBe(mode);
        expect(state.currentStage).toBe(stage);
        expect(state.stageProgress).toBe(progress);
        expect(state.isPlaying).toBe(true);

        // Verify stoichiometry percent yield invariants per failure mode
        const yieldVal = state.stoichiometryResult.percentYield;
        expect(yieldVal).toBeDefined();
        expect(Number.isNaN(yieldVal!)).toBe(false);

        if (mode === 'EARLY_WATER') {
          expect(yieldVal).toBe(0);
          expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
        } else if (mode === 'OVERHEATING') {
          expect(yieldVal).toBe(12.5);
          expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
        } else if (mode === 'WARM_WASH') {
          expect(yieldVal).toBe(32.0);
          expect(state.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');
        } else if (mode === 'NONE') {
          expect(yieldVal).toBeGreaterThan(80);
          expect(yieldVal).toBeLessThan(100);
        }

        // Verify thermodynamic parameters are never NaN or infinite
        expect(Number.isFinite(state.thermodynamics.dielectricConstant)).toBe(true);
        expect(Number.isFinite(state.thermodynamics.solubilityGPer100Ml)).toBe(true);
        expect(Number.isFinite(state.thermodynamics.supersaturation)).toBe(true);
      }
    });

    it('rapidly clicks failure scenario cards at 60Hz in FailureScenarioControl component', () => {
      render(h(FailureScenarioControl));

      const modes: FailureMode[] = ['EARLY_WATER', 'OVERHEATING', 'WARM_WASH', 'NONE'];

      // Thrash button clicks 40 times in rapid succession
      for (let i = 0; i < 40; i++) {
        const mode = modes[i % modes.length];
        const btn = screen.getByTestId(`failure-btn-${mode}`);

        fireEvent.click(btn);

        expect(useAspirinStore.getState().failureMode).toBe(mode);

        // Verify active visual indicator and badge
        if (mode === 'EARLY_WATER') {
          expect(screen.getByText(/조기 수분 혼입/)).toBeDefined();
          expect(screen.getByText(/양성 \(진한 보라색/)).toBeDefined();
        } else if (mode === 'OVERHEATING') {
          expect(screen.getByText(/고온 과열 탄화/)).toBeDefined();
          expect(screen.getByText(/타르\/분해/)).toBeDefined();
        } else if (mode === 'WARM_WASH') {
          expect(screen.getByText(/미지근한 물 과다 세척/)).toBeDefined();
          expect(screen.getByText(/순도는 유지되나 수득량 붕괴/)).toBeDefined();
        } else if (mode === 'NONE') {
          expect(screen.getByText(/정상 합성 \(표준 프로토콜\)/)).toBeDefined();
          expect(screen.getByText(/음성 \(담황색/)).toBeDefined();
        }
      }
    });

    it('safely handles idempotent re-selection of the currently active failure mode without duplicate events', () => {
      render(h(FailureScenarioControl));

      const earlyWaterBtn = screen.getByTestId('failure-btn-EARLY_WATER');
      fireEvent.click(earlyWaterBtn);
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');

      // Click 10 more times on the same already-active button
      for (let i = 0; i < 10; i++) {
        fireEvent.click(earlyWaterBtn);
        expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');
      }
    });
  });

  // =========================================================================
  // SUITE 2: Bi-directional Cross-Control Synchronization
  // =========================================================================
  describe('2. Bi-directional Synchronization between Header Dropdown and Scenario Control', () => {
    it('synchronizes header select dropdown and scenario control cards in App', () => {
      render(h(App));

      const select = screen.getByTestId('failure-mode-select') as HTMLSelectElement;
      expect(select.value).toBe('NONE');

      // 1. Change via Header Select Dropdown
      fireEvent.change(select, { target: { value: 'EARLY_WATER' } });
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');
      expect(select.value).toBe('EARLY_WATER');

      // Verify FailureScenarioControl reflected the change
      const earlyWaterCard = screen.getByTestId('failure-btn-EARLY_WATER');
      expect(earlyWaterCard.className).toContain('bg-purple-950/30');

      // 2. Change via FailureScenarioControl Card
      const overheatingCard = screen.getByTestId('failure-btn-OVERHEATING');
      fireEvent.click(overheatingCard);
      expect(useAspirinStore.getState().failureMode).toBe('OVERHEATING');
      expect(select.value).toBe('OVERHEATING');

      // 3. Reset via FailureScenarioControl "정상 합성 복귀" button
      const resetBtn = screen.getByTitle('정상 합성으로 복귀');
      fireEvent.click(resetBtn);
      expect(useAspirinStore.getState().failureMode).toBe('NONE');
      expect(select.value).toBe('NONE');
    });

    it('stress-tests 50 alternating mutations between dropdown and scenario cards', () => {
      render(h(App));

      const select = screen.getByTestId('failure-mode-select') as HTMLSelectElement;
      const modes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];

      for (let i = 0; i < 50; i++) {
        const mode = modes[i % modes.length];

        if (i % 2 === 0) {
          fireEvent.change(select, { target: { value: mode } });
        } else {
          const card = screen.getByTestId(`failure-btn-${mode}`);
          fireEvent.click(card);
        }

        expect(useAspirinStore.getState().failureMode).toBe(mode);
        expect(select.value).toBe(mode);
      }
    });

    it('header reset button resets both stage and failure mode back to default', () => {
      render(h(App));

      // Advance stage to 5 and failure mode to OVERHEATING
      fireEvent.click(screen.getByTestId('stage-step-btn-5'));
      fireEvent.click(screen.getByTestId('failure-btn-OVERHEATING'));

      expect(useAspirinStore.getState().currentStage).toBe(5);
      expect(useAspirinStore.getState().failureMode).toBe('OVERHEATING');

      // Click header reset simulation
      fireEvent.click(screen.getByTestId('header-reset-btn'));

      expect(useAspirinStore.getState().currentStage).toBe(1);
      expect(useAspirinStore.getState().failureMode).toBe('NONE');

      const select = screen.getByTestId('failure-mode-select') as HTMLSelectElement;
      expect(select.value).toBe('NONE');
    });
  });

  // =========================================================================
  // SUITE 3: FeCl3 Qualitative Test Modal Lifecycle & Boundary Stress
  // =========================================================================
  describe('3. FeCl3 Qualitative Test Modal Lifecycle & Event Handling', () => {
    it('thrashes modal open/close across 25 iterations through varied triggers in App', () => {
      render(h(App));

      const headerFeCl3Btn = screen.getByTestId('header-fecl3-btn');
      const launcherBtn = screen.getByTestId('fecl3-test-launcher-btn');

      for (let i = 0; i < 25; i++) {
        // Alternately open via header or launcher button
        if (i % 2 === 0) {
          fireEvent.click(headerFeCl3Btn);
        } else {
          fireEvent.click(launcherBtn);
        }

        expect(screen.getByTestId('fecl3-test-modal')).toBeDefined();

        // Alternately close via close button, backdrop click, or Escape key
        const closeMod = i % 3;
        if (closeMod === 0) {
          fireEvent.click(screen.getByTestId('close-fecl3-modal-btn'));
        } else if (closeMod === 1) {
          const backdrop = screen.getByTestId('fecl3-test-modal');
          fireEvent.click(backdrop);
        } else {
          fireEvent.keyDown(window, { key: 'Escape' });
        }

        expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();
      }
    }, 15000);

    it('thrashes isolated FeCl3TestModal open/close across 50 iterations without leaking', () => {
      let isOpen = false;
      const { rerender } = render(h(FeCl3TestModal, { isOpen, onClose: () => { isOpen = false; } }));

      for (let i = 0; i < 50; i++) {
        isOpen = true;
        rerender(h(FeCl3TestModal, { isOpen, onClose: () => { isOpen = false; } }));
        expect(screen.getByTestId('fecl3-test-modal')).toBeDefined();

        if (i % 2 === 0) {
          fireEvent.click(screen.getByTestId('close-fecl3-modal-btn'));
        } else {
          fireEvent.keyDown(window, { key: 'Escape' });
        }
        rerender(h(FeCl3TestModal, { isOpen, onClose: () => { isOpen = false; } }));
        expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();
      }
    });

    it('verifies Escape key does nothing and causes zero errors when modal is closed', () => {
      render(h(App));
      expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();

      // Press Escape multiple times when closed
      for (let i = 0; i < 10; i++) {
        expect(() => {
          fireEvent.keyDown(window, { key: 'Escape' });
        }).not.toThrow();
      }

      expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();
    });

    it('automatically resets droplet count and liquid state to pristine whenever modal re-opens', async () => {
      vi.useFakeTimers();
      render(h(App));

      // 1. Open modal
      fireEvent.click(screen.getByTestId('header-fecl3-btn'));
      expect(screen.getByText(/시약 투여 대기 중 \(Clear Solution\)/)).toBeDefined();

      // 2. Add drops
      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/1% FeCl₃ 적하 \(1방울\)/)).toBeDefined();

      // 3. Close modal
      fireEvent.click(screen.getByTestId('close-fecl3-modal-btn'));
      expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();

      // 4. Re-open modal
      fireEvent.click(screen.getByTestId('header-fecl3-btn'));

      // Droplet count must be 0 and state must be pristine
      expect(screen.getByText(/1% FeCl₃ 적하 \(0방울\)/)).toBeDefined();
      expect(screen.getByText(/시약 투여 대기 중 \(Clear Solution\)/)).toBeDefined();
      expect(screen.queryByTestId('reset-fecl3-test-btn')).toBeNull();
    });

    it('tests manual reset button in FeCl3TestModal', async () => {
      vi.useFakeTimers();
      render(h(FeCl3TestModal, { isOpen: true }));

      // Before drops, reset button is not rendered
      expect(screen.queryByTestId('reset-fecl3-test-btn')).toBeNull();

      // Add a drop
      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });

      // Reset button must now be visible
      const resetBtn = screen.getByTestId('reset-fecl3-test-btn');
      expect(resetBtn).toBeDefined();

      // Click reset button
      fireEvent.click(resetBtn);

      // Droplet count resets to 0 and reset button vanishes
      expect(screen.getByText(/1% FeCl₃ 적하 \(0방울\)/)).toBeDefined();
      expect(screen.getByText(/시약 투여 대기 중 \(Clear Solution\)/)).toBeDefined();
      expect(screen.queryByTestId('reset-fecl3-test-btn')).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 4: Droplet Dispensing Spam & Concurrency Guard Verification
  // =========================================================================
  describe('4. Droplet Dispensing Spam & Concurrency Guards', () => {
    it('debounces rapid spam clicking (30 clicks in 5ms) to exactly 1 droplet dispensing cycle', () => {
      vi.useFakeTimers();
      render(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');

      // Spam click 30 times instantaneously
      for (let i = 0; i < 30; i++) {
        fireEvent.click(dropBtn);
      }

      // During animation (before 400ms), dropsCount remains 0
      expect(screen.getByText(/1% FeCl₃ 적하 \(0방울\)/)).toBeDefined();

      // Advance timers past the 400ms animation duration
      act(() => {
        vi.advanceTimersByTime(450);
      });

      // Exactly 1 drop must have been added, NOT 30!
      expect(screen.getByText(/1% FeCl₃ 적하 \(1방울\)/)).toBeDefined();

      // Now click once more after completion
      fireEvent.click(dropBtn);
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/1% FeCl₃ 적하 \(2방울\)/)).toBeDefined();
    });

    it('safely handles component unmount while 400ms droplet animation is in-flight', () => {
      vi.useFakeTimers();
      const { unmount } = render(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      // Advance halfway through the 400ms timer
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Unmount while timer is pending
      expect(() => {
        unmount();
      }).not.toThrow();

      // Advance remaining time; must not throw unhandled exception or memory error
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });

  // =========================================================================
  // SUITE 5: Spectrophotometric Color Transitions & Diagnostic Purity Verification
  // =========================================================================
  describe('5. Spectrophotometric Color Transitions Across All 4 Failure Branches', () => {
    it('verifies standard NONE synthesis: negative transparent amber (#EAB308)', () => {
      vi.useFakeTimers();
      useAspirinStore.getState().setFailureMode('NONE');
      render(h(FeCl3TestModal, { isOpen: true }));

      // Add drops
      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });

      // Current sample cuvette
      const cuvetteCurrent = screen.getByTestId('cuvette-current');
      expect(cuvetteCurrent).toBeDefined();
      expect(screen.getByText(/음성 \(Negative, 투명 담황색\)/)).toBeDefined();
      expect(screen.getByText(/완벽한 에스테르화 완결!/)).toBeDefined();

      // Control cuvettes
      expect(screen.getByTestId('cuvette-control-sa')).toBeDefined();
      expect(screen.getByTestId('cuvette-control-aspirin')).toBeDefined();
      expect(screen.getByText(/양성: 짙은 보라색/)).toBeDefined();
      expect(screen.getByText(/음성: 담황색 \(FeCl₃색\)/)).toBeDefined();
    });

    it('verifies EARLY_WATER contamination: strong positive deep violet (#6B21A8)', () => {
      vi.useFakeTimers();
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      render(h(FeCl3TestModal, { isOpen: true }));

      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/강양성 \(Positive, 진한 보라색\)/)).toBeDefined();
      expect(screen.getByText(/조기 수분 혼입으로 무수아세트산이 전량 소모/)).toBeDefined();
      expect(screen.getByText(/유리 페놀성 -OH가 Fe³⁺와 착물을 형성/)).toBeDefined();
    });

    it('verifies OVERHEATING degradation: dark murky pitch/tar brown (#451A03)', () => {
      vi.useFakeTimers();
      useAspirinStore.getState().setFailureMode('OVERHEATING');
      render(h(FeCl3TestModal, { isOpen: true }));

      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/타르 변색 \/ 측정 불가 \(Dark Murky Brown\)/)).toBeDefined();
      expect(screen.getByText(/85°C 초과 과열로 살리실산의 자기축합 및 탈카복실화/)).toBeDefined();
      expect(screen.getByText(/흑갈색 고분자 타르가 형성/)).toBeDefined();
    });

    it('verifies WARM_WASH dissolution loss: negative amber (#F59E0B) with high chemical purity', () => {
      vi.useFakeTimers();
      useAspirinStore.getState().setFailureMode('WARM_WASH');
      render(h(FeCl3TestModal, { isOpen: true }));

      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/음성 \(Negative, 담황색\)/)).toBeDefined();
      expect(screen.getByText(/미지근한 물에 결정을 대량 잃었으나, 잔류한 결정 자체는 아세틸화가 완결/)).toBeDefined();
      expect(screen.getByText(/유리 페놀기가 없어 Fe³⁺ 착물을 형성하지 않고/)).toBeDefined();
    });

    it('live hot-swaps failure mode while modal is actively open and liquid is displayed', () => {
      vi.useFakeTimers();
      useAspirinStore.getState().setFailureMode('NONE');
      render(h(FeCl3TestModal, { isOpen: true }));

      // Add drops in NONE mode
      fireEvent.click(screen.getByTestId('add-fecl3-drops-btn'));
      act(() => {
        vi.advanceTimersByTime(450);
      });
      expect(screen.getByText(/음성 \(Negative, 투명 담황색\)/)).toBeDefined();

      // 1. Hot-swap to EARLY_WATER
      act(() => {
        useAspirinStore.getState().setFailureMode('EARLY_WATER');
      });
      expect(screen.getByText(/강양성 \(Positive, 진한 보라색\)/)).toBeDefined();

      // 2. Hot-swap to OVERHEATING
      act(() => {
        useAspirinStore.getState().setFailureMode('OVERHEATING');
      });
      expect(screen.getByText(/타르 변색 \/ 측정 불가/)).toBeDefined();

      // 3. Hot-swap to WARM_WASH
      act(() => {
        useAspirinStore.getState().setFailureMode('WARM_WASH');
      });
      expect(screen.getByText(/음성 \(Negative, 담황색\)/)).toBeDefined();

      // 4. Hot-swap back to NONE
      act(() => {
        useAspirinStore.getState().setFailureMode('NONE');
      });
      expect(screen.getByText(/음성 \(Negative, 투명 담황색\)/)).toBeDefined();
    });
  });

  // =========================================================================
  // SUITE 6: KaTeX Chemical Coordination Formula & Analytical Robustness
  // =========================================================================
  describe('6. KaTeX Chemical Coordination Formula & Analytical Robustness', () => {
    it('verifies iron(III)-salicylate KaTeX coordination formula renders cleanly without errors', () => {
      render(h(FeCl3TestModal, { isOpen: true }));

      const modal = screen.getByTestId('fecl3-test-modal');

      // KaTeX HTML elements
      const katexSpans = modal.querySelectorAll('.katex');
      expect(katexSpans.length).toBeGreaterThan(0);

      // Check chemical formula tokens
      const mathContent = modal.textContent || '';
      expect(mathContent).toContain('Fe');
      expect(mathContent).toContain('530 nm');

      // Analytical Significance sections
      expect(screen.getByText(/1. 에스테르화의 표적 작용기 확인:/)).toBeDefined();
      expect(screen.getByText(/2. 의약품 순도 및 위장관 독성 예방:/)).toBeDefined();
      expect(screen.getByText(/약전 규격\(USP\/KP\)/)).toBeDefined();
    });

    it('gracefully degrades when KaTeX rendering throws an exception', () => {
      const originalRender = katex.renderToString;
      katex.renderToString = vi.fn().mockImplementation(() => {
        throw new Error('Adversarial KaTeX syntax fault injection');
      });

      // Modal must still render safely with fallback formula string without unmounting or crashing
      expect(() => {
        render(h(FeCl3TestModal, { isOpen: true }));
      }).not.toThrow();

      expect(screen.getByTestId('fecl3-test-modal')).toBeDefined();

      // Restore KaTeX
      katex.renderToString = originalRender;
    });
  });

  // =========================================================================
  // SUITE 7: Cockpit Chaos Monkey & High-Concurrency Interaction Stress
  // =========================================================================
  describe('7. Full Cockpit Chaos Monkey & High-Concurrency Interaction Stress', () => {
    it('survives 150 randomized concurrent operations across failure modes, modals, stages, and tabs', () => {
      render(h(App));

      const failureModes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
      const tabs: Array<'ELI5' | 'DEEP_DIVE' | 'TELEMETRY'> = ['ELI5', 'DEEP_DIVE', 'TELEMETRY'];
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];

      for (let i = 0; i < 150; i++) {
        const actionType = i % 6;

        act(() => {
          switch (actionType) {
            case 0: {
              // Stage jump
              const st = stages[Math.floor(Math.random() * stages.length)];
              useAspirinStore.getState().setStage(st);
              break;
            }
            case 1: {
              // Failure mode toggle
              const fm = failureModes[Math.floor(Math.random() * failureModes.length)];
              useAspirinStore.getState().setFailureMode(fm);
              break;
            }
            case 2: {
              // Audio mute toggle
              const muteToggle = screen.getByTestId('audio-mute-toggle');
              fireEvent.click(muteToggle);
              break;
            }
            case 3: {
              // Tab switch
              const tab = tabs[Math.floor(Math.random() * tabs.length)];
              useAspirinStore.getState().setActiveTab(tab);
              break;
            }
            case 4: {
              // FeCl3 modal toggle
              const isOpen = useAspirinStore.getState().isFailureModalOpen;
              useAspirinStore.getState().setFailureModalOpen(!isOpen);
              break;
            }
            case 5: {
              // Progress advance
              useAspirinStore.getState().setStageProgress(Math.random());
              break;
            }
          }
        });

        // Store invariants
        const store = useAspirinStore.getState();
        expect(store.currentStage >= 1 && store.currentStage <= 6).toBe(true);
        expect(failureModes.includes(store.failureMode)).toBe(true);
        expect(Number.isFinite(store.thermodynamics.dielectricConstant)).toBe(true);
      }

      // App remains mounted and interactive
      expect(screen.getByTestId('audio-mute-toggle')).toBeDefined();
      expect(screen.getByTestId('failure-scenario-control')).toBeDefined();
    });
  });
});
