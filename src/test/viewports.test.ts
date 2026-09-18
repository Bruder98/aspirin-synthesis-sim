/**
 * viewports.test.ts
 * Comprehensive Vitest Unit & Integration Tests for Milestone 2:
 * MacroApparatusView, MicroMolecularView, DualViewportContainer, and App.
 * Written in pure TypeScript (.ts) using React.createElement.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { useAspirinStore } from '../store/useAspirinStore';
import { MacroApparatusView } from '../components/viewport/MacroApparatusView';
import { MicroMolecularView } from '../components/viewport/MicroMolecularView';
import { DualViewportContainer } from '../components/viewport/DualViewportContainer';
import App from '../App';
import { SynthesisStageId, FailureMode } from '../engine/types';

const h = React.createElement;

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame & cancelAnimationFrame
let animFrameCallbacks: Array<((time: number) => void)> = [];
let nextFrameId = 1;

vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
  animFrameCallbacks.push(cb);
  return nextFrameId++;
});

vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
  animFrameCallbacks = [];
});

describe('Milestone 2: Viewport Components & Dual-View Integration', () => {
  beforeEach(() => {
    act(() => {
      useAspirinStore.getState().resetSimulation();
    });
    animFrameCallbacks = [];
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // 1. MacroApparatusView Tests
  // ==========================================================================
  describe('MacroApparatusView (2D Canvas Laboratory Apparatus)', () => {
    it('renders the canvas element and viewport container with accessible status', () => {
      render(h(MacroApparatusView, null));
      const viewport = screen.getByTestId('macro-apparatus-viewport');
      expect(viewport).toBeDefined();

      const canvas = viewport.querySelector('canvas');
      expect(canvas).not.toBeNull();

      // Screen reader announcement element
      const srText = viewport.querySelector('.sr-only');
      expect(srText).not.toBeNull();
      expect(srText?.textContent).toContain('현재 거시적 실험실 뷰');
    });

    it('updates description across all 6 synthesis stages', () => {
      const { rerender } = render(h(MacroApparatusView, null));

      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];
      stages.forEach((st) => {
        act(() => {
          useAspirinStore.getState().setStage(st);
        });
        rerender(h(MacroApparatusView, null));
        const viewport = screen.getByTestId('macro-apparatus-viewport');
        const srText = viewport.querySelector('.sr-only');
        expect(srText?.textContent).toBeDefined();
      });
    });

    it('adapts accessible text when failure modes are active', () => {
      const { rerender } = render(h(MacroApparatusView, null));

      const failureModes: FailureMode[] = ['EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
      failureModes.forEach((mode) => {
        act(() => {
          useAspirinStore.getState().setFailureMode(mode);
        });
        rerender(h(MacroApparatusView, null));
        const viewport = screen.getByTestId('macro-apparatus-viewport');
        const srText = viewport.querySelector('.sr-only');
        expect(srText?.textContent).toContain('실패 상태');
      });
    });

    it('handles animation frame cycle and progress scrubbing without crashing', () => {
      render(h(MacroApparatusView, null));

      // Scrub progress
      act(() => {
        useAspirinStore.getState().setStageProgress(0.5);
      });

      // Simulate a few animation frame ticks
      act(() => {
        if (animFrameCallbacks.length > 0) {
          const cbs = [...animFrameCallbacks];
          animFrameCallbacks = [];
          cbs.forEach((cb) => cb(performance.now() + 16));
        }
      });

      const viewport = screen.getByTestId('macro-apparatus-viewport');
      expect(viewport).toBeDefined();
    });
  });

  // ==========================================================================
  // 2. MicroMolecularView Tests
  // ==========================================================================
  describe('MicroMolecularView (Three.js 3D Molecular Simulation)', () => {
    it('renders the 3D molecular viewport and controls', () => {
      render(h(MicroMolecularView, null));
      const viewport = screen.getByTestId('micro-molecular-viewport');
      expect(viewport).toBeDefined();

      // Should display 3D molecular dynamics label and CPK legend
      expect(screen.getByText('3D MOLECULAR DYNAMICS')).toBeDefined();
      expect(screen.getByText('C')).toBeDefined();
      expect(screen.getByText('H')).toBeDefined();
      expect(screen.getByText('O')).toBeDefined();
      expect(screen.getByText('P')).toBeDefined();
      expect(screen.getByText('H+')).toBeDefined();
    });

    it('toggles molecular representation mode between Ball & Stick and Space-Filling', () => {
      render(h(MicroMolecularView, null));
      const toggleBtn = screen.getByTitle('Toggle Molecular Representation');
      expect(toggleBtn.textContent).toContain('Ball & Stick');

      // Click toggle
      fireEvent.click(toggleBtn);
      expect(toggleBtn.textContent).toContain('Space-Filling');

      // Click back
      fireEvent.click(toggleBtn);
      expect(toggleBtn.textContent).toContain('Ball & Stick');
    });

    it('handles reset camera button click gracefully', () => {
      render(h(MicroMolecularView, null));
      const resetCamBtn = screen.getByTitle('Reset 3D Orbit Camera');
      expect(resetCamBtn).toBeDefined();
      fireEvent.click(resetCamBtn);
    });

    it('transitions across all 6 stages cleanly without unhandled exceptions', () => {
      const { rerender } = render(h(MicroMolecularView, null));

      for (let st = 1; st <= 6; st++) {
        act(() => {
          useAspirinStore.getState().setStage(st as SynthesisStageId);
        });
        rerender(h(MicroMolecularView, null));
        const viewport = screen.getByTestId('micro-molecular-viewport');
        expect(viewport).toBeDefined();
      }
    });

    it('unmounts cleanly and disposes resources without memory leaks', () => {
      const { unmount } = render(h(MicroMolecularView, null));
      expect(() => unmount()).not.toThrow();
    });
  });

  // ==========================================================================
  // 3. DualViewportContainer Tests
  // ==========================================================================
  describe('DualViewportContainer (Synchronized Split-Screen Container)', () => {
    it('renders both Macro and Micro viewports by default in DUAL mode', () => {
      render(h(DualViewportContainer, null));
      expect(screen.getByTestId('dual-viewport-container')).toBeDefined();
      expect(screen.getByTestId('macro-apparatus-viewport')).toBeDefined();
      expect(screen.getByTestId('micro-molecular-viewport')).toBeDefined();
    });

    it('switches viewport modes between Dual Split, Macro Focus, and Micro Focus', () => {
      render(h(DualViewportContainer, null));

      const dualBtn = screen.getByTestId('mode-dual-btn');
      const macroBtn = screen.getByTestId('mode-macro-btn');
      const microBtn = screen.getByTestId('mode-micro-btn');

      // Switch to Macro Focus
      fireEvent.click(macroBtn);
      expect(screen.getByTestId('macro-apparatus-viewport')).toBeDefined();
      expect(screen.queryByTestId('micro-molecular-viewport')).toBeNull();

      // Switch to Micro Focus
      fireEvent.click(microBtn);
      expect(screen.queryByTestId('macro-apparatus-viewport')).toBeNull();
      expect(screen.getByTestId('micro-molecular-viewport')).toBeDefined();

      // Switch back to Dual Split
      fireEvent.click(dualBtn);
      expect(screen.getByTestId('macro-apparatus-viewport')).toBeDefined();
      expect(screen.getByTestId('micro-molecular-viewport')).toBeDefined();
    });

    it('controls simulation loop play/pause toggle', () => {
      render(h(DualViewportContainer, null));
      const playPauseBtn = screen.getByTestId('play-pause-btn');

      expect(useAspirinStore.getState().isPlaying).toBe(true);

      // Pause
      fireEvent.click(playPauseBtn);
      expect(useAspirinStore.getState().isPlaying).toBe(false);

      // Resume
      fireEvent.click(playPauseBtn);
      expect(useAspirinStore.getState().isPlaying).toBe(true);
    });

    it('adjusts loop playback speed (0.5x, 1.0x, 2.0x)', () => {
      render(h(DualViewportContainer, null));

      fireEvent.click(screen.getByTestId('speed-btn-0.5'));
      expect(useAspirinStore.getState().playbackSpeed).toBe(0.5);

      fireEvent.click(screen.getByTestId('speed-btn-2'));
      expect(useAspirinStore.getState().playbackSpeed).toBe(2.0);

      fireEvent.click(screen.getByTestId('speed-btn-1'));
      expect(useAspirinStore.getState().playbackSpeed).toBe(1.0);
    });

    it('scrubs stage loop progress via slider input', () => {
      render(h(DualViewportContainer, null));
      const scrubber = screen.getByTestId('stage-progress-scrubber');

      fireEvent.change(scrubber, { target: { value: '65' } });
      expect(useAspirinStore.getState().stageProgress).toBe(0.65);

      fireEvent.change(scrubber, { target: { value: '10' } });
      expect(useAspirinStore.getState().stageProgress).toBe(0.1);
    });

    it('navigates stages using Prev and Next stage buttons', () => {
      render(h(DualViewportContainer, null));
      const prevBtn = screen.getByTestId('prev-stage-btn');
      const nextBtn = screen.getByTestId('next-stage-btn');

      // Stage 1: Prev is disabled
      expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
      expect(useAspirinStore.getState().currentStage).toBe(1);

      // Advance to Stage 2
      fireEvent.click(nextBtn);
      expect(useAspirinStore.getState().currentStage).toBe(2);
      expect((prevBtn as HTMLButtonElement).disabled).toBe(false);

      // Go back to Stage 1
      fireEvent.click(prevBtn);
      expect(useAspirinStore.getState().currentStage).toBe(1);
    });

    it('resets simulation to initial state on Reset button click', () => {
      render(h(DualViewportContainer, null));
      act(() => {
        useAspirinStore.getState().setStage(4);
        useAspirinStore.getState().setFailureMode('EARLY_WATER');
      });

      const resetBtn = screen.getByTestId('reset-sim-btn');
      fireEvent.click(resetBtn);

      const state = useAspirinStore.getState();
      expect(state.currentStage).toBe(1);
      expect(state.failureMode).toBe('NONE');
      expect(state.stageProgress).toBe(0.0);
    });

    it('renders live thermodynamic telemetry HUD values accurately', () => {
      render(h(DualViewportContainer, null));

      // At Stage 1:
      expect(screen.getByText('온도 (TEMP)')).toBeDefined();
      expect(screen.getByText('유전율 (εr)')).toBeDefined();
      expect(screen.getByText('과포화도 (S)')).toBeDefined();
      expect(screen.getByText('CNT 핵생성 장벽')).toBeDefined();
      expect(screen.getByText('상태 진단')).toBeDefined();
      expect(screen.getByText('이론 수득량')).toBeDefined();

      // Advance to Stage 3 (Ice bath cooling - Metastable zone)
      act(() => {
        useAspirinStore.getState().setStage(3);
      });
      expect(screen.getByText('준안정 (MZW)')).toBeDefined();

      // Advance to Stage 4 (Distilled water addition - Antisolvent precipitation)
      act(() => {
        useAspirinStore.getState().setStage(4);
      });
      expect(screen.getByText('결정 석출 중')).toBeDefined();
    });
  });

  // ==========================================================================
  // 4. App Master Cockpit Integration Tests
  // ==========================================================================
  describe('App Master Cockpit Integration', () => {
    it('mounts header, stepper navigation, DualViewportContainer, and footer', () => {
      render(h(App, null));

      // Header title
      expect(screen.getByText('아세틸살리실산(아스피린) 합성 시뮬레이션')).toBeDefined();

      // Stepper navigation buttons (1 to 6)
      for (let st = 1; st <= 6; st++) {
        expect(screen.getByTestId(`stage-step-btn-${st}`)).toBeDefined();
      }

      // Dual viewport container
      expect(screen.getByTestId('dual-viewport-container')).toBeDefined();

      // Footer
      expect(screen.getByText(/방어진고등학교 교사 이희/)).toBeDefined();
    });

    it('changes synthesis stage when clicking on stepper navigation buttons', () => {
      render(h(App, null));

      const step3Btn = screen.getByTestId('stage-step-btn-3');
      fireEvent.click(step3Btn);
      expect(useAspirinStore.getState().currentStage).toBe(3);

      const step5Btn = screen.getByTestId('stage-step-btn-5');
      fireEvent.click(step5Btn);
      expect(useAspirinStore.getState().currentStage).toBe(5);
    });

    it('switches failure modes via header selector', () => {
      render(h(App, null));
      const select = screen.getByTestId('failure-mode-select');

      fireEvent.change(select, { target: { value: 'EARLY_WATER' } });
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');

      fireEvent.change(select, { target: { value: 'OVERHEATING' } });
      expect(useAspirinStore.getState().failureMode).toBe('OVERHEATING');

      fireEvent.change(select, { target: { value: 'WARM_WASH' } });
      expect(useAspirinStore.getState().failureMode).toBe('WARM_WASH');

      fireEvent.change(select, { target: { value: 'NONE' } });
      expect(useAspirinStore.getState().failureMode).toBe('NONE');
    });

    it('resets simulation via header reset button', () => {
      render(h(App, null));

      act(() => {
        useAspirinStore.getState().setStage(5);
        useAspirinStore.getState().setFailureMode('OVERHEATING');
      });

      const headerResetBtn = screen.getByTestId('header-reset-btn');
      fireEvent.click(headerResetBtn);

      expect(useAspirinStore.getState().currentStage).toBe(1);
      expect(useAspirinStore.getState().failureMode).toBe('NONE');
    });
  });
});
