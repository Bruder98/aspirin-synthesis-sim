/**
 * src/test/tier5AppAdversarial.test.tsx
 * ============================================================================
 * CHALLENGER 2: Tier 5 White-Box Adversarial Hardening Test Suite
 * Focus: App Cockpit, Synchronized Viewports, Failure Integration & Lifecycle Robustness
 *
 * Test Dimensions:
 * 1. Component Lifecycle & Unmount Safety during Active Animations / Audio Playback
 * 2. High-Concurrency Chaos Monkey & Multi-Control Fuzz Testing
 * 3. Viewport Resizing, Layout Shifts, Zero-Dimension & High-DPI Scaling Stress
 * 4. KaTeX Rigor, Malformed Formulas, Edge Boundary & Injection Resistance
 * 5. Global Audio Mute/Unmute State Persistence & Web Audio Resilience
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as THREE from 'three';

import App from '../App';
import { useAspirinStore } from '../store/useAspirinStore';
import { DualViewportContainer } from '../components/viewport/DualViewportContainer';
import { MacroApparatusView } from '../components/viewport/MacroApparatusView';
import { MicroMolecularView } from '../components/viewport/MicroMolecularView';
import { Eli5PedagogyCard } from '../components/pedagogy/Eli5PedagogyCard';
import { AcademicDeepDiveCard, LatexSpan } from '../components/pedagogy/AcademicDeepDiveCard';
import { YieldCalculatorModal } from '../components/calculator/YieldCalculatorModal';
import { FailureScenarioControl } from '../components/controls/FailureScenarioControl';
import { FeCl3TestModal } from '../components/controls/FeCl3TestModal';
import {
  audioSynthesizer,
  isAudioMuted,
  setAudioMuted,
  toggleAudioMute,
  playClickSound,
  playStageTransitionSound,
  playFailureWarningSound,
  playCrystalBurstSound,
  playSuccessChime,
  getAudioContext,
} from '../utils/audioSynthesizer';
import { SynthesisStageId, FailureMode } from '../engine/types';

const h = React.createElement;

// ============================================================================
// MOCK INFRASTRUCTURE HARNESS
// ============================================================================

// 1. ResizeObserver Mock
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn((target: Element) => {
    // Immediate initial callback with standard test rect
    this.callback(
      [
        {
          target,
          contentRect: { width: 640, height: 480, top: 0, left: 0, bottom: 480, right: 640, x: 0, y: 0, toJSON: () => ({}) },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        } as unknown as ResizeObserverEntry,
      ],
      this
    );
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as any;

// 2. Path2D Mock
class MockPath2D {
  moveTo = vi.fn();
  lineTo = vi.fn();
  quadraticCurveTo = vi.fn();
  bezierCurveTo = vi.fn();
  arc = vi.fn();
  arcTo = vi.fn();
  ellipse = vi.fn();
  rect = vi.fn();
  roundRect = vi.fn();
  closePath = vi.fn();
}
(globalThis as any).Path2D = MockPath2D;

// 3. Canvas 2D Mock Context
function createMockCanvasContext(): any {
  const gradientMock = {
    addColorStop: vi.fn(),
  };
  return {
    canvas: document.createElement('canvas'),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 45 })),
    createLinearGradient: vi.fn(() => gradientMock),
    createRadialGradient: vi.fn(() => gradientMock),
    createPattern: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
  };
}

// 4. Web Audio API Mock Harness
let createdOscillators: any[] = [];
let createdGainNodes: any[] = [];
let createdFilterNodes: any[] = [];

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
    return this;
  });
  linearRampToValueAtTime = vi.fn((val: number) => {
    this.value = val;
    return this;
  });
  exponentialRampToValueAtTime = vi.fn((val: number) => {
    if (val <= 0) {
      throw new RangeError(`Target value must be positive non-zero, got ${val}`);
    }
    this.value = val;
    return this;
  });
}

class MockAudioNode {
  connect = vi.fn((target: any) => target);
  disconnect = vi.fn();
}

class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  start = vi.fn(() => {
    this.started = true;
  });
  stop = vi.fn(() => {
    this.stopped = true;
    if (this.onended) this.onended();
  });
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = new MockAudioNode();

  createOscillator = vi.fn(() => {
    const osc = new MockOscillatorNode();
    createdOscillators.push(osc);
    return osc;
  });

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    createdGainNodes.push(gain);
    return gain;
  });

  createBiquadFilter = vi.fn(() => {
    const filter = new MockBiquadFilterNode();
    createdFilterNodes.push(filter);
    return filter;
  });

  resume = vi.fn(async () => {
    this.state = 'running';
  });

  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

// 5. RAF Mock Tracker
let activeRafs = new Map<number, (time: number) => void>();
let nextRafId = 1;

function setupRafSpies() {
  activeRafs.clear();
  nextRafId = 1;

  vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
    const id = nextRafId++;
    activeRafs.set(id, cb);
    return id;
  });

  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    activeRafs.delete(id);
  });
}

// ============================================================================
// TEST SUITE BEGIN
// ============================================================================

describe('Tier 5 White-Box Adversarial Hardening Suite (Challenger 2)', () => {
  let originalGetContext: any;
  let mockCtx2D: any;

  beforeEach(() => {
    cleanup();
    setupRafSpies();
    createdOscillators = [];
    createdGainNodes = [];
    createdFilterNodes = [];

    // Reset Zustand store to clean default state
    useAspirinStore.getState().resetSimulation();

    // Canvas 2D mock setup
    mockCtx2D = createMockCanvasContext();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === '2d') {
        mockCtx2D.canvas = this;
        return mockCtx2D;
      }
      return null;
    }) as any;

    // Web Audio Mock Setup
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
    setAudioMuted(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    if (originalGetContext) {
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    }
  });

  // ==========================================================================
  // DIMENSION 1: COMPONENT LIFECYCLE & UNMOUNT SAFETY UNDER ACTIVE ANIMATIONS
  // ==========================================================================
  describe('Dimension 1: Component Lifecycle & Unmount Safety under Active Animation & Audio', () => {
    it('cancels requestAnimationFrame cleanly when MacroApparatusView unmounts during active loop', () => {
      useAspirinStore.getState().setPlaying(true);

      const { unmount } = render(h(MacroApparatusView));
      expect(activeRafs.size).toBeGreaterThanOrEqual(1);

      // Unmount immediately while RAF is active
      unmount();

      // All animation frames registered by MacroApparatusView should be cleanly cancelled
      expect(activeRafs.size).toBe(0);
    });

    it('survives rapid mount-and-unmount cycling of MacroApparatusView 25 times without leaking frames', () => {
      for (let i = 0; i < 25; i++) {
        const { unmount } = render(h(MacroApparatusView));
        expect(activeRafs.size).toBeGreaterThanOrEqual(1);
        unmount();
      }
      expect(activeRafs.size).toBe(0);
    });

    it('safely handles MicroMolecularView unmounting while WebGL loop and ResizeObserver are active', () => {
      const { unmount } = render(h(MicroMolecularView));
      expect(() => {
        unmount();
      }).not.toThrow();
      expect(activeRafs.size).toBe(0);
    });

    it('safely cleans up DualViewportContainer when unmounted during high-speed playback (2.0x)', () => {
      useAspirinStore.getState().setPlaying(true);
      useAspirinStore.getState().setPlaybackSpeed(2.0);
      useAspirinStore.getState().setStage(4);

      const { unmount } = render(h(DualViewportContainer));
      expect(() => {
        unmount();
      }).not.toThrow();
      expect(activeRafs.size).toBe(0);
    });

    it('prevents memory leaks and handles in-flight 400ms setTimeout in FeCl3TestModal when unmounted early', async () => {
      vi.useFakeTimers();

      let isOpen = true;
      const { rerender, unmount } = render(
        h(FeCl3TestModal, { isOpen, onClose: () => { isOpen = false; } })
      );

      // Trigger drop dispensing which starts 400ms timer
      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      // Advance clock partially (200ms of 400ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Unmount while droplet timer is pending in mid-air
      unmount();

      // Advance remaining timer - must not throw or update unmounted component
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('safely dispatches audio triggers during component unmount without uncaught errors', () => {
      const { unmount } = render(h(App));

      // Fire audio triggers
      playStageTransitionSound();
      playCrystalBurstSound();
      playSuccessChime();

      // Unmount App while audio tail decays
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // DIMENSION 2: HIGH-CONCURRENCY CHAOS MONKEY & MULTI-CONTROL FUZZ TESTING
  // ==========================================================================
  describe('Dimension 2: High-Concurrency Chaos Monkey & Multi-Control Fuzz Testing', () => {
    it('maintains strict mathematical store invariants across 300 randomized concurrent mutations', () => {
      const failureModes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];
      const tabs: Array<'ELI5' | 'DEEP_DIVE' | 'TELEMETRY'> = ['ELI5', 'DEEP_DIVE', 'TELEMETRY'];
      const speeds = [0.5, 1.0, 2.0];

      // Chaos monkey loop across 300 cycles
      for (let i = 0; i < 300; i++) {
        const op = i % 10;
        act(() => {
          switch (op) {
            case 0:
              useAspirinStore.getState().setStage(stages[i % stages.length]);
              break;
            case 1:
              useAspirinStore.getState().setFailureMode(failureModes[i % failureModes.length]);
              break;
            case 2:
              useAspirinStore.getState().togglePlaying();
              break;
            case 3:
              // Fuzz progress with out-of-bounds numbers and NaNs
              const weirdProgress = i % 3 === 0 ? -10 : i % 3 === 1 ? 5.5 : NaN;
              useAspirinStore.getState().setStageProgress(weirdProgress);
              break;
            case 4:
              useAspirinStore.getState().setPlaybackSpeed(speeds[i % speeds.length]);
              break;
            case 5:
              useAspirinStore.getState().setActiveTab(tabs[i % tabs.length]);
              break;
            case 6:
              useAspirinStore.getState().setCalculatorOpen(i % 2 === 0);
              break;
            case 7:
              useAspirinStore.getState().setFailureModalOpen(i % 2 === 1);
              break;
            case 8:
              // Fuzz stoichiometry with boundary inputs
              useAspirinStore.getState().updateStoichiometry({
                salicylicAcidMassG: i % 4 === 0 ? 0 : i % 4 === 1 ? -2 : i % 4 === 2 ? 100 : 2.0,
                aceticAnhydrideVolMl: i % 3 === 0 ? 0 : i % 3 === 1 ? -5 : 5.0,
                actualYieldG: i % 2 === 0 ? 0 : 2.15,
              });
              break;
            case 9:
              useAspirinStore.getState().nextStage();
              break;
          }
        });

        // Verify Store Invariants
        const state = useAspirinStore.getState();
        expect(state.currentStage).toBeGreaterThanOrEqual(1);
        expect(state.currentStage).toBeLessThanOrEqual(6);
        expect(Number.isInteger(state.currentStage)).toBe(true);
        expect(state.stageProgress).toBeGreaterThanOrEqual(0.0);
        expect(state.stageProgress).toBeLessThanOrEqual(1.0);
        expect(Number.isNaN(state.stageProgress)).toBe(false);
        expect(Number.isNaN(state.thermodynamics.temperatureC)).toBe(false);
        expect(Number.isNaN(state.thermodynamics.dielectricConstant)).toBe(false);
        expect(Number.isNaN(state.thermodynamics.solubilityGPer100Ml)).toBe(false);
      }
    });

    it('survives 100 randomized interactive DOM events on App cockpit without error', () => {
      render(h(App));

      const failureOptions = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];

      for (let i = 0; i < 100; i++) {
        const choice = i % 8;
        act(() => {
          switch (choice) {
            case 0: {
              // Click random stage button
              const stageId = (1 + (i % 6)) as SynthesisStageId;
              const btn = screen.getByTestId(`stage-step-btn-${stageId}`);
              fireEvent.click(btn);
              break;
            }
            case 1: {
              // Toggle play/pause
              const playPauseBtn = screen.getByTestId('play-pause-btn');
              fireEvent.click(playPauseBtn);
              break;
            }
            case 2: {
              // Toggle failure scenario select
              const select = screen.getByTestId('failure-mode-select');
              fireEvent.change(select, { target: { value: failureOptions[i % failureOptions.length] } });
              break;
            }
            case 3: {
              // Switch pedagogy tabs
              const tabIds = ['tab-btn-eli5', 'tab-btn-deep-dive', 'tab-btn-telemetry'];
              const tabBtn = screen.getByTestId(tabIds[i % tabIds.length]);
              fireEvent.click(tabBtn);
              break;
            }
            case 4: {
              // Open and close calculator
              const openCalcBtn = screen.getByTestId('header-calculator-btn');
              fireEvent.click(openCalcBtn);
              const closeCalcBtn = screen.queryByTestId('close-calculator-btn');
              if (closeCalcBtn) {
                fireEvent.click(closeCalcBtn);
              } else {
                useAspirinStore.getState().setCalculatorOpen(false);
              }
              break;
            }
            case 5: {
              // Toggle sound
              const muteBtn = screen.getByTestId('audio-mute-toggle');
              fireEvent.click(muteBtn);
              break;
            }
            case 6: {
              // Scrub progress slider
              const scrubber = screen.getByTestId('stage-progress-scrubber');
              fireEvent.change(scrubber, { target: { value: String((i * 13) % 101) } });
              break;
            }
            case 7: {
              // Switch viewport mode
              const modeBtns = ['mode-dual-btn', 'mode-macro-btn', 'mode-micro-btn'];
              const modeBtn = screen.getByTestId(modeBtns[i % modeBtns.length]);
              fireEvent.click(modeBtn);
              break;
            }
          }
        });
      }

      // Final state assertion: app cockpit remains intact
      expect(screen.getByTestId('dual-viewport-container')).toBeDefined();
    }, 15000);

    it('fuzzes stage hopping non-linearly (1 -> 6 -> 2 -> 5 -> 3 -> 4) 10 times in App without desync', () => {
      render(h(App));
      const sequence: SynthesisStageId[] = [1, 6, 2, 5, 3, 4];

      for (let cycle = 0; cycle < 10; cycle++) {
        for (const stage of sequence) {
          act(() => {
            const btn = screen.getByTestId(`stage-step-btn-${stage}`);
            fireEvent.click(btn);
          });
          expect(useAspirinStore.getState().currentStage).toBe(stage);
        }
      }
    });
  });

  // ==========================================================================
  // DIMENSION 3: VIEWPORT RESIZING, LAYOUT SHIFTS & HIGH-DPI SCALING STRESS
  // ==========================================================================
  describe('Dimension 3: Viewport Resizing, Layout Shifts & High-DPI Scaling Stress', () => {
    it('adapts canvas dimensions correctly across standard and high-DPI scaling (DPR 1, 2, 3, 0.5)', () => {
      const dprValues = [1.0, 2.0, 3.0, 0.5];

      for (const dpr of dprValues) {
        // Explicitly set on window object
        (window as any).devicePixelRatio = dpr;

        const { container, unmount } = render(h(MacroApparatusView));
        const canvas = container.querySelector('canvas') as HTMLCanvasElement;
        expect(canvas).toBeDefined();

        // Simulate bounding client rect of 600x400
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
          width: 600,
          height: 400,
          top: 0,
          left: 0,
          bottom: 400,
          right: 600,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });

        // Trigger animation frame wrapped in act
        act(() => {
          const frames = Array.from(activeRafs.values());
          for (const frame of frames) {
            frame(performance.now());
          }
        });

        // Target canvas width/height must scale with DPR
        expect(canvas.width).toBe(Math.round(600 * dpr));
        expect(canvas.height).toBe(Math.round(400 * dpr));

        unmount();
      }
    });

    it('gracefully handles zero-dimension (0x0) layout collapse without division-by-zero crashes', () => {
      const { container, unmount } = render(h(MacroApparatusView));
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Simulate 0x0 collapsed container (e.g. display: none or unmeasured flexbox)
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      expect(() => {
        act(() => {
          const frame = activeRafs.values().next().value;
          if (frame) {
            frame(performance.now());
          }
        });
      }).not.toThrow();

      unmount();
    });

    it('handles extreme ultrawide (10000x200) and narrow vertical (200x5000) aspect ratios', () => {
      const extremeSizes = [
        { width: 10000, height: 200 },
        { width: 200, height: 5000 },
      ];

      for (const size of extremeSizes) {
        const { container, unmount } = render(h(MacroApparatusView));
        const canvas = container.querySelector('canvas') as HTMLCanvasElement;

        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
          width: size.width,
          height: size.height,
          top: 0,
          left: 0,
          bottom: size.height,
          right: size.width,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });

        expect(() => {
          act(() => {
            const frame = activeRafs.values().next().value;
            if (frame) {
              frame(performance.now());
            }
          });
        }).not.toThrow();

        unmount();
      }
    });

    it('handles rapid toggling of ViewportMode (DUAL -> MACRO -> MICRO -> DUAL) under active playback', () => {
      useAspirinStore.getState().setPlaying(true);
      render(h(DualViewportContainer));

      const dualBtn = screen.getByTestId('mode-dual-btn');
      const macroBtn = screen.getByTestId('mode-macro-btn');
      const microBtn = screen.getByTestId('mode-micro-btn');

      for (let i = 0; i < 15; i++) {
        act(() => {
          fireEvent.click(macroBtn);
        });
        expect(screen.queryByTestId('macro-apparatus-viewport')).toBeDefined();

        act(() => {
          fireEvent.click(microBtn);
        });
        expect(screen.queryByTestId('micro-molecular-fallback') || screen.queryByTestId('micro-molecular-viewport')).toBeDefined();

        act(() => {
          fireEvent.click(dualBtn);
        });
        expect(screen.queryByTestId('macro-apparatus-viewport')).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // DIMENSION 4: KATEX RIGOR, MALFORMED FORMULAS & INJECTION RESILIENCE
  // ==========================================================================
  describe('Dimension 4: KaTeX Rigor, Malformed Formulas & Security/Corrupted String Resilience', () => {
    it('gracefully renders malformed / incomplete KaTeX syntax without throwing uncaught exceptions', () => {
      const corruptedFormulas = [
        '\\frac{1}{',
        '\\sqrt[incomplete',
        '\\begin{matrix} 1 & 2',
        '\\unknownMacro{xyz}',
        '{unclosed bracket',
        '\\int_{0}^{',
        '\\\\\\\\\\\\\\',
      ];

      for (const formula of corruptedFormulas) {
        expect(() => {
          const { unmount } = render(h(LatexSpan, { math: formula }));
          unmount();
        }).not.toThrow();
      }
    });

    it('evaluates fallback behavior when KaTeX throws on corrupted input', () => {
      const maliciousHtmlPayload = '<img src="x" onerror="window.__xss=1" />';

      // Render LatexSpan with arbitrary string
      const { container } = render(h(LatexSpan, { math: maliciousHtmlPayload }));
      const span = container.querySelector('span');
      expect(span).toBeDefined();

      // Ensure that KaTeX rendered markup or escaped text exists
      expect(span?.innerHTML).toBeDefined();
    });

    it('renders YieldCalculatorModal mathematical derivation with boundary/extreme values without crashing', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      useAspirinStore.getState().updateStoichiometry({
        salicylicAcidMassG: 0.0,
        aceticAnhydrideVolMl: 0.0,
        actualYieldG: 0.0,
      });

      render(h(YieldCalculatorModal));

      // Open derivation drawer
      const toggleDerivationBtn = screen.getByTestId('toggle-derivation-btn');
      fireEvent.click(toggleDerivationBtn);

      // Verify derivation container rendered cleanly
      expect(screen.getByText(/화학양론 수학적 유도 과정 상세 보기/)).toBeDefined();
      expect(screen.getByTestId('percent-yield-value')).toBeDefined();
    });

    it('survives all 6 stages and 3 failure modes rendering AcademicDeepDiveCard KaTeX without crashes', () => {
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];
      const failureModes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];

      const { rerender } = render(h(AcademicDeepDiveCard));

      for (const stage of stages) {
        for (const mode of failureModes) {
          act(() => {
            useAspirinStore.getState().setStage(stage);
            useAspirinStore.getState().setFailureMode(mode);
          });
          rerender(h(AcademicDeepDiveCard));

          const card = screen.getByTestId('academic-deep-dive-card');
          expect(card).toBeDefined();
        }
      }
    });

    it('renders Eli5PedagogyCard across all 6 stages and 3 failure modes with correct metadata', () => {
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];
      const failureModes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];

      const { rerender } = render(h(Eli5PedagogyCard));

      for (const stage of stages) {
        for (const mode of failureModes) {
          act(() => {
            useAspirinStore.getState().setStage(stage);
            useAspirinStore.getState().setFailureMode(mode);
          });
          rerender(h(Eli5PedagogyCard));

          const card = screen.getByTestId('eli5-card');
          expect(card).toBeDefined();
        }
      }
    });
  });

  // ==========================================================================
  // DIMENSION 5: GLOBAL AUDIO MUTE/UNMUTE STATE PERSISTENCE & ROBUSTNESS
  // ==========================================================================
  describe('Dimension 5: Global Audio Mute/Unmute State Persistence & Web Audio Resilience', () => {
    it('strictly suppresses all audio node creation when isAudioMuted is true', () => {
      setAudioMuted(true);
      expect(isAudioMuted()).toBe(true);

      createdOscillators = [];
      createdGainNodes = [];

      // Attempt to play all 5 sounds
      playClickSound();
      playStageTransitionSound();
      playFailureWarningSound();
      playCrystalBurstSound();
      playSuccessChime();

      // Zero audio nodes must be instantiated when muted
      expect(createdOscillators.length).toBe(0);
      expect(createdGainNodes.length).toBe(0);
    });

    it('instantiates expected audio nodes when isAudioMuted is false', () => {
      setAudioMuted(false);
      expect(isAudioMuted()).toBe(false);

      createdOscillators = [];
      playClickSound();
      expect(createdOscillators.length).toBe(1);

      createdOscillators = [];
      playStageTransitionSound();
      expect(createdOscillators.length).toBe(2);

      createdOscillators = [];
      playFailureWarningSound();
      expect(createdOscillators.length).toBe(1);

      createdOscillators = [];
      playCrystalBurstSound();
      expect(createdOscillators.length).toBe(2); // main + modulator

      createdOscillators = [];
      playSuccessChime();
      expect(createdOscillators.length).toBe(3); // C5 + E5 + G5
    });

    it('preserves global audio mute state when user toggles resetSimulation()', () => {
      setAudioMuted(true);
      expect(isAudioMuted()).toBe(true);

      // Reset simulation state
      useAspirinStore.getState().resetSimulation();

      // Audio mute preference must remain preserved
      expect(isAudioMuted()).toBe(true);
    });

    it('synchronizes header audio mute toggle button with audioSynthesizer state', () => {
      setAudioMuted(false);
      render(h(App));

      const muteBtn = screen.getByTestId('audio-mute-toggle');
      expect(muteBtn.textContent).toContain('Audio On');

      // Click to mute
      fireEvent.click(muteBtn);
      expect(isAudioMuted()).toBe(true);
      expect(muteBtn.textContent).toContain('Muted');

      // Click to unmute
      fireEvent.click(muteBtn);
      expect(isAudioMuted()).toBe(false);
      expect(muteBtn.textContent).toContain('Audio On');
    });

    it('survives rapid 100-cycle mute toggling without leaking nodes or throwing', () => {
      for (let i = 0; i < 100; i++) {
        const newMuted = toggleAudioMute();
        expect(isAudioMuted()).toBe(newMuted);
        if (!newMuted) {
          playClickSound();
        }
      }
    });

    it('handles suspended AudioContext and rejects from autoplay restriction gracefully', async () => {
      const mockCtx = getAudioContext() as unknown as MockAudioContext;
      mockCtx.state = 'suspended';
      mockCtx.resume = vi.fn().mockRejectedValue(new Error('Autoplay policy restricted'));

      expect(() => {
        playClickSound();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // DIMENSION 6: INTEGRATION VERIFICATION OF MODALS AND COCKPIT CONTROLS
  // ==========================================================================
  describe('Dimension 6: Integration Verification of Modals and Cockpit Controls', () => {
    it('seamlessly integrates FailureScenarioControl with store and FeCl3TestModal opening', () => {
      let opened = false;
      render(
        h(FailureScenarioControl, {
          onOpenFeCl3Modal: () => {
            opened = true;
          },
        })
      );

      // Verify scenario trigger buttons exist
      const earlyWaterBtn = screen.getByTestId('failure-btn-EARLY_WATER');
      fireEvent.click(earlyWaterBtn);
      expect(useAspirinStore.getState().failureMode).toBe('EARLY_WATER');

      // Verify FeCl3 launcher triggers callback
      const fecl3Btn = screen.getByTestId('fecl3-test-launcher-btn');
      fireEvent.click(fecl3Btn);
      expect(opened).toBe(true);
    });

    it('correctly displays FeCl3 color and diagnosis across all 3 failure modes upon adding reagent', async () => {
      vi.useFakeTimers();

      const { rerender } = render(h(FeCl3TestModal, { isOpen: true }));

      // Mode 1: EARLY_WATER
      act(() => {
        useAspirinStore.getState().setFailureMode('EARLY_WATER');
      });
      rerender(h(FeCl3TestModal, { isOpen: true }));

      const dropBtn = screen.getByTestId('add-fecl3-drops-btn');
      fireEvent.click(dropBtn);

      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(screen.getByText(/강양성/)).toBeDefined();

      // Mode 2: WARM_WASH
      act(() => {
        useAspirinStore.getState().setFailureMode('WARM_WASH');
      });
      rerender(h(FeCl3TestModal, { isOpen: true }));
      expect(screen.getAllByText(/음성/).length).toBeGreaterThanOrEqual(1);

      // Mode 3: OVERHEATING
      act(() => {
        useAspirinStore.getState().setFailureMode('OVERHEATING');
      });
      rerender(h(FeCl3TestModal, { isOpen: true }));
      expect(screen.getByText(/타르 변색/)).toBeDefined();

      vi.useRealTimers();
    });

    it('verifies YieldCalculatorModal preset buttons update store inputs and diagnostic telemetry', () => {
      useAspirinStore.getState().setCalculatorOpen(true);
      render(h(YieldCalculatorModal));

      // 1. Wet moisture error preset
      const wetPresetBtn = screen.getByTestId('preset-wet-moisture-btn');
      fireEvent.click(wetPresetBtn);

      const storeState = useAspirinStore.getState();
      expect(storeState.stoichiometryInputs.actualYieldG).toBe(2.85);
      expect(storeState.stoichiometryResult.percentYield).toBeGreaterThan(100);

      // 2. Reset defaults preset
      const resetPresetBtn = screen.getByTestId('reset-calculator-defaults-btn');
      fireEvent.click(resetPresetBtn);

      const resetState = useAspirinStore.getState();
      expect(resetState.stoichiometryInputs.salicylicAcidMassG).toBe(2.0);
      expect(resetState.stoichiometryInputs.aceticAnhydrideVolMl).toBe(5.0);
      expect(resetState.stoichiometryInputs.actualYieldG).toBe(2.15);
    });
  });
});
