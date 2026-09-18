/**
 * src/test/milestone4Polish.test.tsx
 * Comprehensive Vitest test suite for Milestone 4:
 * 1. Native Web Audio API Procedural Synthesizer
 * 2. FailureScenarioControl Component & State Branching
 * 3. FeCl3TestModal Qualitative Phenolic -OH Test & KaTeX Equations
 * 4. App Master Cockpit Integration & Dark Laboratory HUD Audio-Visual Polish
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useAspirinStore } from '../store/useAspirinStore';
import {
  playClickSound,
  playStageTransitionSound,
  playFailureWarningSound,
  playCrystalBurstSound,
  playSuccessChime,
  isAudioMuted,
  setAudioMuted,
  toggleAudioMute,
  getAudioContext,
  audioSynthesizer,
} from '../utils/audioSynthesizer';
import { FailureScenarioControl } from '../components/controls/FailureScenarioControl';
import { FeCl3TestModal } from '../components/controls/FeCl3TestModal';
import App from '../App';

const h = React.createElement;

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Web Audio API Mocks
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

let mockAudioCtxInstance: any = null;

class MockAudioContext {
  state = 'running';
  currentTime = 10.0;
  destination = new MockAudioNode();
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  constructor() {
    mockAudioCtxInstance = this;
  }
}

describe('Milestone 4: Failure Branching Controls, FeCl3 Test Modal & Audio-Visual HUD', () => {
  beforeEach(() => {
    mockAudioCtxInstance = null;
    (window as any).AudioContext = MockAudioContext;
    setAudioMuted(false);
    useAspirinStore.getState().resetSimulation();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Audio Synthesizer Unit Tests
  // =========================================================================
  describe('1. Web Audio API Procedural Sound Synthesizer', () => {
    it('initializes in unmuted state and supports setAudioMuted / toggleAudioMute', () => {
      expect(isAudioMuted()).toBe(false);

      setAudioMuted(true);
      expect(isAudioMuted()).toBe(true);

      const toggled = toggleAudioMute();
      expect(toggled).toBe(false);
      expect(isAudioMuted()).toBe(false);
    });

    it('plays click sound (800Hz micro-click with exponential decay)', () => {
      playClickSound();

      const ctx = getAudioContext() as any;
      expect(ctx).toBeDefined();
      expect(ctx.createOscillator).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });

    it('plays stage transition sound (dual-tone rising chime 523Hz -> 659Hz)', () => {
      playStageTransitionSound();

      const ctx = getAudioContext() as any;
      expect(ctx).toBeDefined();
      // Should create 2 oscillators for dual-tone rising chime
      expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
      expect(ctx.createGain).toHaveBeenCalledTimes(2);
    });

    it('plays failure warning sound (180Hz sawtooth + low-pass filter)', () => {
      playFailureWarningSound();

      const ctx = getAudioContext() as any;
      expect(ctx).toBeDefined();
      expect(ctx.createOscillator).toHaveBeenCalled();
      expect(ctx.createBiquadFilter).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });

    it('plays crystal burst sound (1200Hz - 2400Hz frequency modulation shimmer)', () => {
      playCrystalBurstSound();

      const ctx = getAudioContext() as any;
      expect(ctx).toBeDefined();
      expect(ctx.createOscillator).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });

    it('plays success chime (major triad arpeggio/chord C5-E5-G5)', () => {
      playSuccessChime();

      const ctx = getAudioContext() as any;
      expect(ctx).toBeDefined();
      // Major triad has 3 notes
      expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
      expect(ctx.createGain).toHaveBeenCalledTimes(4); // 3 note gains + 1 master gain
    });

    it('does not create any audio nodes when muted', () => {
      setAudioMuted(true);
      const ctx = getAudioContext() as any;
      if (ctx) {
        vi.clearAllMocks();
      }

      playClickSound();
      playStageTransitionSound();
      playFailureWarningSound();
      playCrystalBurstSound();
      playSuccessChime();

      if (ctx) {
        expect(ctx.createOscillator).not.toHaveBeenCalled();
        expect(ctx.createGain).not.toHaveBeenCalled();
      }
    });

    it('safely handles missing or throwing AudioContext without crashing', () => {
      const originalAudioContext = window.AudioContext;
      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = undefined;

      expect(() => {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();

      (window as any).AudioContext = originalAudioContext;
    });

    it('exposes audioSynthesizer object bundle', () => {
      expect(audioSynthesizer.playClickSound).toBeDefined();
      expect(audioSynthesizer.playSuccessChime).toBeDefined();
      expect(audioSynthesizer.toggleMute).toBeDefined();
    });
  });

  // =========================================================================
  // 2. FailureScenarioControl Component Tests
  // =========================================================================
  describe('2. FailureScenarioControl Component', () => {
    it('renders the 4 failure scenario buttons and header information', () => {
      render(h(FailureScenarioControl));

      expect(screen.getByTestId('failure-scenario-control')).toBeDefined();
      expect(screen.getByTestId('failure-btn-NONE')).toBeDefined();
      expect(screen.getByTestId('failure-btn-EARLY_WATER')).toBeDefined();
      expect(screen.getByTestId('failure-btn-OVERHEATING')).toBeDefined();
      expect(screen.getByTestId('failure-btn-WARM_WASH')).toBeDefined();
      expect(screen.getByTestId('fecl3-test-launcher-btn')).toBeDefined();

      // Yield Badges
      expect(screen.getByText(/수득률 ~90%/)).toBeDefined();
      expect(screen.getByText(/수득률 0%/)).toBeDefined();
      expect(screen.getByText(/수득률 ~12.5%/)).toBeDefined();
      expect(screen.getByText(/수득률 ~32%/)).toBeDefined();
    });

    it('switches failure mode to EARLY_WATER and updates state and mechanism', () => {
      render(h(FailureScenarioControl));

      fireEvent.click(screen.getByTestId('failure-btn-EARLY_WATER'));

      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');
      expect(useAspirinStore.getState().stoichiometryResult.percentYield).toBe(0);
      expect(screen.getByText(/조기 수분 혼입/)).toBeDefined();
      expect(screen.getByText(/양성 \(진한 보라색/)).toBeDefined();
      expect(screen.getByText(/무수아세트산의 물에 대한 친핵 반응 속도가/)).toBeDefined();
    });

    it('switches failure mode to OVERHEATING and displays tar degradation info', () => {
      render(h(FailureScenarioControl));

      fireEvent.click(screen.getByTestId('failure-btn-OVERHEATING'));

      expect(useAspirinStore.getState().failureMode).toBe('OVERHEATING');
      expect(useAspirinStore.getState().stoichiometryResult.percentYield).toBe(12.5);
      expect(screen.getByText(/고온 과열 탄화/)).toBeDefined();
      expect(screen.getByText(/살리실산의 분자 간 자기 축합/)).toBeDefined();
    });

    it('switches failure mode to WARM_WASH and displays lukewarm dissolution info', () => {
      render(h(FailureScenarioControl));

      fireEvent.click(screen.getByTestId('failure-btn-WARM_WASH'));

      expect(useAspirinStore.getState().failureMode).toBe('WARM_WASH');
      expect(useAspirinStore.getState().stoichiometryResult.percentYield).toBe(32.0);
      expect(screen.getByText(/미지근한 물 과다 세척/)).toBeDefined();
      expect(screen.getByText(/아스피린의 수용해도 급상승/)).toBeDefined();
    });

    it('resets to normal synthesis when clicking normal mode or reset button', () => {
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      render(h(FailureScenarioControl));

      const resetBtn = screen.getByTitle('정상 합성으로 복귀');
      fireEvent.click(resetBtn);

      expect(useAspirinStore.getState().failureMode).toBe('NONE');
    });

    it('calls onOpenFeCl3Modal callback when launcher button is clicked', () => {
      const onOpenMock = vi.fn();
      render(h(FailureScenarioControl, { onOpenFeCl3Modal: onOpenMock }));

      fireEvent.click(screen.getByTestId('fecl3-test-launcher-btn'));
      expect(onOpenMock).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. FeCl3TestModal Component Tests
  // =========================================================================
  describe('3. FeCl3TestModal (Iron(III) Chloride Phenolic -OH Test)', () => {
    it('does not render when closed', () => {
      render(h(FeCl3TestModal, { isOpen: false }));
      expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();
    });

    it('renders comparison cuvettes and analytical information when open', () => {
      render(h(FeCl3TestModal, { isOpen: true }));

      expect(screen.getByTestId('fecl3-test-modal')).toBeDefined();
      expect(screen.getByTestId('cuvette-control-sa')).toBeDefined();
      expect(screen.getByTestId('cuvette-control-aspirin')).toBeDefined();
      expect(screen.getByTestId('cuvette-current')).toBeDefined();
      expect(screen.getByTestId('add-fecl3-drops-btn')).toBeDefined();

      // Titles and controls
      expect(screen.getByText(/살리실산 원료/)).toBeDefined();
      expect(screen.getByText(/정제 아스피린/)).toBeDefined();
      expect(screen.getByText(/현재 합성 시료/)).toBeDefined();

      // Analytical significance
      expect(screen.getByText(/에스테르화의 표적 작용기 확인/)).toBeDefined();
      expect(screen.getByText(/의약품 순도 및 위장관 독성 예방/)).toBeDefined();
    });

    it('renders KaTeX coordination chemical equation in modal', () => {
      render(h(FeCl3TestModal, { isOpen: true }));

      const modal = screen.getByTestId('fecl3-test-modal');
      expect(modal.innerHTML).toContain('katex');
      expect(modal.innerHTML).toContain('Fe');
      expect(screen.getByText(/λ_max ≈ 530 nm/)).toBeDefined();
    });

    it('adds FeCl3 drops and observes negative amber result in normal synthesis (NONE)', async () => {
      useAspirinStore.getState().setFailureMode('NONE');
      render(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      await waitFor(() => {
        expect(screen.getByText(/음성 \(Negative, 투명 담황색\)/)).toBeDefined();
        expect(screen.getByText(/완벽한 에스테르화 완결/)).toBeDefined();
      });

      // Reset test
      const resetTestBtn = screen.getByTestId('reset-fecl3-test-btn');
      fireEvent.click(resetTestBtn);
      expect(screen.getByText(/시약 투여 대기 중/)).toBeDefined();
    });

    it('adds FeCl3 drops and observes deep violet positive result in EARLY_WATER mode', async () => {
      useAspirinStore.getState().setFailureMode('EARLY_WATER');
      render(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      await waitFor(() => {
        expect(screen.getByText(/강양성 \(Positive, 진한 보라색\)/)).toBeDefined();
        expect(screen.getByText(/조기 수분 혼입으로 무수아세트산이 전량 소모/)).toBeDefined();
      });
    });

    it('adds FeCl3 drops and observes dark murky tar in OVERHEATING mode', async () => {
      useAspirinStore.getState().setFailureMode('OVERHEATING');
      render(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      await waitFor(() => {
        expect(screen.getByText(/타르 변색 \/ 측정 불가/)).toBeDefined();
        expect(screen.getByText(/85°C 초과 과열로 살리실산의 자기축합/)).toBeDefined();
      });
    });

    it('closes modal when close button is clicked', () => {
      const onCloseMock = vi.fn();
      render(h(FeCl3TestModal, { isOpen: true, onClose: onCloseMock }));

      fireEvent.click(screen.getByTestId('close-fecl3-modal-btn'));
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('closes modal when Escape key is pressed', () => {
      const onCloseMock = vi.fn();
      render(h(FeCl3TestModal, { isOpen: true, onClose: onCloseMock }));

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('closes modal when backdrop is clicked', () => {
      const onCloseMock = vi.fn();
      render(h(FeCl3TestModal, { isOpen: true, onClose: onCloseMock }));

      const backdrop = screen.getByTestId('fecl3-test-modal');
      fireEvent.click(backdrop);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. App Master Cockpit Integration & HUD Polish Tests
  // =========================================================================
  describe('4. App Master Cockpit Integration & Dark HUD', () => {
    it('mounts audio mute toggle button in header and toggles mute state', () => {
      render(h(App));

      const muteToggle = screen.getByTestId('audio-mute-toggle');
      expect(muteToggle).toBeDefined();
      expect(isAudioMuted()).toBe(false);

      fireEvent.click(muteToggle);
      expect(isAudioMuted()).toBe(true);

      fireEvent.click(muteToggle);
      expect(isAudioMuted()).toBe(false);
    });

    it('mounts header FeCl3 test button and opens the test modal', () => {
      render(h(App));

      const headerFeCl3Btn = screen.getByTestId('header-fecl3-btn');
      expect(headerFeCl3Btn).toBeDefined();

      fireEvent.click(headerFeCl3Btn);
      expect(screen.getByTestId('fecl3-test-modal')).toBeDefined();

      fireEvent.click(screen.getByTestId('close-fecl3-modal-btn'));
      expect(screen.queryByTestId('fecl3-test-modal')).toBeNull();
    });

    it('integrates FailureScenarioControl in main layout and updates store', () => {
      render(h(App));

      expect(screen.getByTestId('failure-scenario-control')).toBeDefined();

      fireEvent.click(screen.getByTestId('failure-btn-OVERHEATING'));
      expect(useAspirinStore.getState().failureMode).toBe('OVERHEATING');
    });

    it('triggers stage progression audio feedback and updates active stage', () => {
      render(h(App));

      // Click Stage 4 (Antisolvent water injection crystal burst)
      fireEvent.click(screen.getByTestId('stage-step-btn-4'));
      expect(useAspirinStore.getState().currentStage).toBe(4);

      // Click Stage 6 (Filtration)
      fireEvent.click(screen.getByTestId('stage-step-btn-6'));
      expect(useAspirinStore.getState().currentStage).toBe(6);
    });

    it('keeps failure mode select dropdown synchronized with failure control panel', () => {
      render(h(App));

      const select = screen.getByTestId('failure-mode-select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'WARM_WASH' } });

      expect(useAspirinStore.getState().failureMode).toBe('WARM_WASH');
    });
  });
});
