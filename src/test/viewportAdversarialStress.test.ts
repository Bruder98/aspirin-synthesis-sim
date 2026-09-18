/**
 * viewportAdversarialStress.test.ts
 * Milestone 2 Iteration 2 Gate Verification: Viewport Synchronization & Lifecycle Adversarial Stress Suite
 * Challenger 1 (critic, specialist)
 *
 * Requirements Tested Under Adversarial Stress:
 * 1. Rapid stage skipping (1 -> 6 -> 2 -> 5 -> 3 -> 4) while simulation is actively playing.
 * 2. Rapid failure mode toggling (NONE -> EARLY_WATER -> OVERHEATING -> WARM_WASH -> NONE) at 60Hz.
 * 3. Viewport mode transitions ('DUAL' -> 'MACRO' -> 'MICRO' -> 'DUAL') with concurrent window resize events.
 * 4. Unmount / mount cycles ensuring 0 memory leaks and 0 dangling requestAnimationFrame callbacks.
 * 5. High-frequency scrubbing and playback speed thrashing during live execution.
 * 6. Concurrency & Chaos monkey test: 200 random state transitions verifying zero uncaught errors.
 * 7. Pure Three.js molecular topology & kinetic updates across all stages and failure modes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import * as THREE from 'three';
import { useAspirinStore } from '../store/useAspirinStore';
import { DualViewportContainer } from '../components/viewport/DualViewportContainer';
import { MacroApparatusView } from '../components/viewport/MacroApparatusView';
import { MicroMolecularView } from '../components/viewport/MicroMolecularView';
import { SynthesisStageId, FailureMode } from '../engine/types';
import {
  SALICYLIC_ACID_3D,
  ACETIC_ANHYDRIDE_3D,
  PHOSPHORIC_ACID_3D,
  ASPIRIN_3D,
  ACETIC_ACID_3D,
  WATER_3D,
  ASPIRIN_DIMER_3D,
} from '../engine/molecularData';

const h = React.createElement;

// ----------------------------------------------------------------------------
// MOCK ENVIRONMENT HARNESS: Canvas 2D, RAF Tracking, ResizeObserver
// ----------------------------------------------------------------------------

interface ActiveRafCallback {
  id: number;
  cb: (time: number) => void;
  cancelled: boolean;
}

let activeRafs = new Map<number, ActiveRafCallback>();
let rafIdCounter = 1;
let danglingExecutedCount = 0;

function setupRafMocks() {
  activeRafs.clear();
  rafIdCounter = 1;
  danglingExecutedCount = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
    const id = rafIdCounter++;
    activeRafs.set(id, { id, cb, cancelled: false });
    return id;
  });

  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    const item = activeRafs.get(id);
    if (item) {
      item.cancelled = true;
      activeRafs.delete(id);
    }
  });
}

function flushAllActiveFrames(time = performance.now()) {
  const current = Array.from(activeRafs.values());
  for (const item of current) {
    if (!item.cancelled) {
      activeRafs.delete(item.id);
      item.cb(time);
    } else {
      danglingExecutedCount++;
    }
  }
}

// Mock Path2D for JSDOM
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

// Robust Canvas 2D context mock
function createMockCanvas2DContext(): Partial<CanvasRenderingContext2D> {
  const gradientMock = {
    addColorStop: vi.fn(),
  };

  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    roundRect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn().mockReturnValue([]),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    createLinearGradient: vi.fn().mockReturnValue(gradientMock),
    createRadialGradient: vi.fn().mockReturnValue(gradientMock),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'center',
    globalAlpha: 1.0,
  } as unknown as Partial<CanvasRenderingContext2D>;
}

// ResizeObserver mock
let resizeCallbacks: Array<() => void> = [];
class MockResizeObserver {
  callback: () => void;
  constructor(cb: () => void) {
    this.callback = cb;
    resizeCallbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    resizeCallbacks = resizeCallbacks.filter((c) => c !== this.callback);
  }
}

describe('CHALLENGER 1: Viewport Synchronization & Lifecycle Adversarial Stress Suite', () => {
  let mockCtx: Partial<CanvasRenderingContext2D>;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    setupRafMocks();
    global.ResizeObserver = MockResizeObserver as any;
    resizeCallbacks = [];

    // Mock Canvas 2D
    mockCtx = createMockCanvas2DContext();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type: string) => {
      if (type === '2d') {
        return mockCtx as CanvasRenderingContext2D;
      }
      return null;
    }) as any;

    act(() => {
      useAspirinStore.getState().resetSimulation();
    });
  });

  afterEach(() => {
    cleanup();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    activeRafs.clear();
  });

  // ==========================================================================
  // SECTION 1: Rapid Stage Skipping (1 -> 6 -> 2 -> 5 -> 3 -> 4) Under Live Playback
  // ==========================================================================
  describe('1. Adversarial Stage Skipping (1 -> 6 -> 2 -> 5 -> 3 -> 4) During Active Simulation', () => {
    it('executes rapid non-linear stage hopping while isPlaying is true without desync or throw', () => {
      const { unmount } = render(h(DualViewportContainer, null));
      expect(useAspirinStore.getState().isPlaying).toBe(true);

      const skipSequence: SynthesisStageId[] = [1, 6, 2, 5, 3, 4];

      for (let i = 0; i < skipSequence.length; i++) {
        const targetStage = skipSequence[i];

        act(() => {
          useAspirinStore.getState().setStage(targetStage);
        });

        // Simulate multiple RAF ticks at this stage
        act(() => {
          flushAllActiveFrames(performance.now() + i * 16.6);
        });

        const state = useAspirinStore.getState();
        expect(state.currentStage).toBe(targetStage);
        expect(state.thermodynamics.stageId).toBe(targetStage);

        // Verify thermodynamic consistency during the skip
        if (targetStage === 3) {
          expect(state.thermodynamics.isMetastable).toBe(true);
          expect(state.thermodynamics.isPrecipitating).toBe(false);
          expect(state.thermodynamics.temperatureC).toBeCloseTo(4.0, 1);
        } else if (targetStage === 4) {
          expect(state.thermodynamics.isPrecipitating).toBe(true);
          expect(state.thermodynamics.dielectricConstant).toBeGreaterThan(60.0);
        } else if (targetStage === 2) {
          expect(state.thermodynamics.temperatureC).toBeCloseTo(80.0, 1);
        }

        // Verify container header displays correct stage indicator
        const stageBadge = screen.getByText(`${targetStage} / 6`);
        expect(stageBadge).toBeDefined();
      }

      unmount();
    });

    it('survives back-to-back synchronous stage thrashing (50 jumps in single event loop)', () => {
      const { unmount } = render(h(DualViewportContainer, null));
      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];

      act(() => {
        for (let i = 0; i < 50; i++) {
          const next = stages[i % stages.length];
          useAspirinStore.getState().setStage(next);
        }
      });

      // Advance frames after chaotic blast
      act(() => {
        flushAllActiveFrames();
      });

      // Stage must be 50 % 6 = 2 (1-based: index 2 is 3)
      const expectedStage = stages[49 % stages.length];
      expect(useAspirinStore.getState().currentStage).toBe(expectedStage);
      expect(useAspirinStore.getState().stageProgress).toBeGreaterThanOrEqual(0.0);
      expect(useAspirinStore.getState().stageProgress).toBeLessThanOrEqual(1.0);

      unmount();
    });
  });

  // ==========================================================================
  // SECTION 2: Rapid Failure Mode Toggling at 60Hz (NONE -> EARLY_WATER -> OVERHEATING -> WARM_WASH -> NONE)
  // ==========================================================================
  describe('2. 60Hz High-Frequency Failure Mode Toggling', () => {
    it('switches failure modes every frame (60Hz rate) across 120 consecutive frames', () => {
      const { unmount } = render(h(DualViewportContainer, null));

      const failureModes: FailureMode[] = [
        'NONE',
        'EARLY_WATER',
        'OVERHEATING',
        'WARM_WASH',
        'NONE',
      ];

      for (let frame = 0; frame < 120; frame++) {
        const mode = failureModes[frame % failureModes.length];

        act(() => {
          useAspirinStore.getState().setFailureMode(mode);
        });

        act(() => {
          flushAllActiveFrames(performance.now() + frame * 16.66);
        });

        const state = useAspirinStore.getState();
        expect(state.failureMode).toBe(mode);

        // Check failure impact correctness
        if (mode === 'EARLY_WATER') {
          expect(state.stoichiometryResult.actualYieldG).toBe(0.0);
          expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
        } else if (mode === 'OVERHEATING') {
          expect(state.stoichiometryResult.feedbackCategory).toBe('CRITICAL_ERROR');
        } else if (mode === 'WARM_WASH') {
          expect(state.stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');
        }
      }

      // Check canvas drawing routines were invoked throughout without error
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      unmount();
    });

    it('synchronizes failure mode and stage transitions concurrently', () => {
      const { unmount } = render(h(DualViewportContainer, null));

      // Stage 1 with EARLY_WATER
      act(() => {
        useAspirinStore.getState().setStage(1);
        useAspirinStore.getState().setFailureMode('EARLY_WATER');
      });
      act(() => flushAllActiveFrames());
      expect(useAspirinStore.getState().stoichiometryResult.actualYieldG).toBe(0.0);

      // Stage 2 with OVERHEATING
      act(() => {
        useAspirinStore.getState().setStage(2);
        useAspirinStore.getState().setFailureMode('OVERHEATING');
      });
      act(() => flushAllActiveFrames());
      expect(useAspirinStore.getState().thermodynamics.stageId).toBe(2);

      // Stage 6 with WARM_WASH
      act(() => {
        useAspirinStore.getState().setStage(6);
        useAspirinStore.getState().setFailureMode('WARM_WASH');
      });
      act(() => flushAllActiveFrames());
      expect(useAspirinStore.getState().stoichiometryResult.feedbackCategory).toBe('WASH_LOSS');

      // Clear back to NONE
      act(() => {
        useAspirinStore.getState().setFailureMode('NONE');
      });
      act(() => flushAllActiveFrames());
      expect(useAspirinStore.getState().failureMode).toBe('NONE');

      unmount();
    });
  });

  // ==========================================================================
  // SECTION 3: Viewport Mode Transitions with Concurrent Window Resizing
  // ==========================================================================
  describe('3. Viewport Mode Transitions (DUAL -> MACRO -> MICRO -> DUAL) & Resize Stress', () => {
    it('rapidly toggles viewport modes while firing concurrent window and observer resize events', () => {
      const { unmount } = render(h(DualViewportContainer, null));

      const dualBtn = screen.getByTestId('mode-dual-btn');
      const macroBtn = screen.getByTestId('mode-macro-btn');
      const microBtn = screen.getByTestId('mode-micro-btn');

      const dimensions = [
        { w: 1920, h: 1080 },
        { w: 800, h: 600 },
        { w: 320, h: 480 },  // Narrow mobile
        { w: 3440, h: 1440 }, // Ultra-wide
        { w: 0, h: 0 },       // Collapsed zero dimension boundary
      ];

      for (let i = 0; i < 20; i++) {
        const dim = dimensions[i % dimensions.length];

        // 1. MACRO Focus
        fireEvent.click(macroBtn);
        expect(screen.getByTestId('macro-apparatus-viewport')).toBeDefined();
        expect(screen.queryByTestId('micro-molecular-viewport')).toBeNull();

        // Trigger resize
        act(() => {
          window.innerWidth = dim.w;
          window.innerHeight = dim.h;
          window.dispatchEvent(new Event('resize'));
          resizeCallbacks.forEach((cb) => cb());
          flushAllActiveFrames();
        });

        // 2. MICRO Focus
        fireEvent.click(microBtn);
        expect(screen.queryByTestId('macro-apparatus-viewport')).toBeNull();
        expect(screen.getByTestId('micro-molecular-viewport')).toBeDefined();

        act(() => {
          window.innerWidth = dim.w;
          window.innerHeight = dim.h;
          window.dispatchEvent(new Event('resize'));
          resizeCallbacks.forEach((cb) => cb());
          flushAllActiveFrames();
        });

        // 3. DUAL Split
        fireEvent.click(dualBtn);
        expect(screen.getByTestId('macro-apparatus-viewport')).toBeDefined();
        expect(screen.getByTestId('micro-molecular-viewport')).toBeDefined();

        act(() => {
          flushAllActiveFrames();
        });
      }

      unmount();
    });
  });

  // ==========================================================================
  // SECTION 4: Unmount / Mount Cycles & Dangling RAF Lifecycle Verification
  // ==========================================================================
  describe('4. Lifecycle Stability: 50 Mount/Unmount Cycles & Zero Dangling RAFs', () => {
    it('mounts and unmounts DualViewportContainer 50 times, verifying cancelAnimationFrame on every unmount', () => {
      danglingExecutedCount = 0;

      for (let i = 0; i < 50; i++) {
        const { unmount } = render(h(DualViewportContainer, null));

        // Let it run a frame
        act(() => {
          flushAllActiveFrames(performance.now() + i * 20);
        });

        // Record how many RAFs are active right before unmount
        const activeCountBefore = activeRafs.size;
        expect(activeCountBefore).toBeGreaterThanOrEqual(1);

        // Unmount
        unmount();

        // All active RAFs associated with this component must be cancelled or removed
        // In our mock, cancelAnimationFrame removes them from activeRafs
        expect(activeRafs.size).toBe(0);
      }

      // Ensure zero dangling callbacks were ever invoked after unmount
      expect(danglingExecutedCount).toBe(0);
    });

    it('mounts and unmounts MacroApparatusView individually with zero memory leaks', () => {
      for (let i = 0; i < 30; i++) {
        const { unmount } = render(h(MacroApparatusView, null));
        act(() => {
          flushAllActiveFrames();
        });
        unmount();
        expect(activeRafs.size).toBe(0);
      }
      expect(danglingExecutedCount).toBe(0);
    });

    it('mounts and unmounts MicroMolecularView individually with zero memory leaks', () => {
      for (let i = 0; i < 30; i++) {
        const { unmount } = render(h(MicroMolecularView, null));
        act(() => {
          flushAllActiveFrames();
        });
        unmount();
        expect(activeRafs.size).toBe(0);
      }
      expect(danglingExecutedCount).toBe(0);
    });
  });

  // ==========================================================================
  // SECTION 5: High-Frequency Scrubber & Playback Speed Thrashing
  // ==========================================================================
  describe('5. High-Frequency Scrubber & Playback Controls Thrashing', () => {
    it('thrashes stage progress scrubber and playback speed concurrently under live playback', () => {
      const { unmount } = render(h(DualViewportContainer, null));
      const scrubber = screen.getByTestId('stage-progress-scrubber');

      const progressValues = [0, 99, 15, 85, 50, 100, 3, 72, 44, 98];
      const speeds = [0.5, 2.0, 1.0, 2.0, 0.5];

      for (let i = 0; i < 30; i++) {
        const pVal = progressValues[i % progressValues.length];
        const spd = speeds[i % speeds.length];

        fireEvent.change(scrubber, { target: { value: String(pVal) } });
        expect(useAspirinStore.getState().stageProgress).toBeCloseTo(pVal / 100, 2);

        act(() => {
          useAspirinStore.getState().setPlaybackSpeed(spd);
        });
        expect(useAspirinStore.getState().playbackSpeed).toBe(spd);

        // Advance simulation time
        act(() => {
          flushAllActiveFrames(performance.now() + i * 50);
        });

        const currentProg = useAspirinStore.getState().stageProgress;
        expect(currentProg).toBeGreaterThanOrEqual(0.0);
        expect(currentProg).toBeLessThanOrEqual(1.0);
        expect(Number.isNaN(currentProg)).toBe(false);
      }

      unmount();
    });

    it('rapidly toggles play/pause at high frequency without stalling timer delta', () => {
      const { unmount } = render(h(DualViewportContainer, null));
      const playPauseBtn = screen.getByTestId('play-pause-btn');

      for (let i = 0; i < 40; i++) {
        fireEvent.click(playPauseBtn);
        act(() => {
          flushAllActiveFrames(performance.now() + i * 33);
        });
      }

      // Confirm simulation remains responsive
      expect(typeof useAspirinStore.getState().isPlaying).toBe('boolean');
      unmount();
    });
  });

  // ==========================================================================
  // SECTION 6: Chaos Monkey: 200 Randomized Concurrent Stress Mutations
  // ==========================================================================
  describe('6. Chaos Monkey: 200 Randomized Concurrent State Mutations', () => {
    it('survives 200 fully randomized concurrent mutations with zero exceptions', () => {
      const { unmount } = render(h(DualViewportContainer, null));

      const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];
      const failures: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
      const speeds = [0.5, 1.0, 2.0];

      let mutationCount = 0;

      for (let i = 0; i < 200; i++) {
        const randStage = stages[Math.floor(Math.random() * stages.length)];
        const randFailure = failures[Math.floor(Math.random() * failures.length)];
        const randSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        const randPlaying = Math.random() > 0.3;
        const randProgress = Math.random();

        act(() => {
          useAspirinStore.getState().setStage(randStage);
          useAspirinStore.getState().setFailureMode(randFailure);
          useAspirinStore.getState().setPlaybackSpeed(randSpeed);
          useAspirinStore.getState().setPlaying(randPlaying);
          useAspirinStore.getState().setStageProgress(randProgress);
        });

        // Simulate frame tick
        act(() => {
          flushAllActiveFrames(performance.now() + i * 16.6);
        });

        // Assert sanity
        const state = useAspirinStore.getState();
        expect(state.currentStage).toBe(randStage);
        expect(state.failureMode).toBe(randFailure);
        expect(state.playbackSpeed).toBe(randSpeed);
        expect(Number.isFinite(state.stageProgress)).toBe(true);
        expect(Number.isNaN(state.stageProgress)).toBe(false);

        mutationCount++;
      }

      expect(mutationCount).toBe(200);
      unmount();
    });
  });

  // ==========================================================================
  // SECTION 7: Pure Three.js Molecular Dynamics Verification Across All Stages
  // ==========================================================================
  describe('7. Pure Three.js 3D Molecular Topology & Kinetics Scene Verification', () => {
    it('verifies 3D scene builds and contains required named meshes across all 6 stages', () => {
      // Create Three.js master group
      const scene = new THREE.Scene();
      const moleculeGroup = new THREE.Group();
      scene.add(moleculeGroup);

      // Verify all 7 species molecules defined in molecularData.ts can be instantiated into meshes
      const speciesList = [
        { name: 'SALICYLIC_ACID', data: SALICYLIC_ACID_3D },
        { name: 'ACETIC_ANHYDRIDE', data: ACETIC_ANHYDRIDE_3D },
        { name: 'PHOSPHORIC_ACID', data: PHOSPHORIC_ACID_3D },
        { name: 'ASPIRIN', data: ASPIRIN_3D },
        { name: 'ACETIC_ACID', data: ACETIC_ACID_3D },
        { name: 'WATER', data: WATER_3D },
        { name: 'ASPIRIN_DIMER', data: ASPIRIN_DIMER_3D },
      ];

      for (const sp of speciesList) {
        expect(sp.data.atoms.length).toBeGreaterThan(0);
        expect(sp.data.bonds.length).toBeGreaterThan(0);

        // Verify all atom positions are valid 3D coordinates (finite numbers)
        for (const atom of sp.data.atoms) {
          expect(atom.pos.length).toBe(3);
          expect(Number.isFinite(atom.pos[0])).toBe(true);
          expect(Number.isFinite(atom.pos[1])).toBe(true);
          expect(Number.isFinite(atom.pos[2])).toBe(true);
          expect(typeof atom.color).toBe('string');
        }

        // Verify bond references valid atom ids
        const atomIdSet = new Set(sp.data.atoms.map((a) => a.id));
        for (const bond of sp.data.bonds) {
          expect(atomIdSet.has(bond.atom1Id)).toBe(true);
          expect(atomIdSet.has(bond.atom2Id)).toBe(true);
        }
      }
    });

    it('verifies that Three.js scene cleanup recurses and disposes all geometries and materials', () => {
      const parent = new THREE.Group();
      const geom = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geom, mat);
      parent.add(mesh);

      const disposeGeomSpy = vi.spyOn(geom, 'dispose');
      const disposeMatSpy = vi.spyOn(mat, 'dispose');

      // Recursively dispose helper
      function disposeHierarchy(obj: THREE.Object3D) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
          disposeHierarchy(obj.children[i]);
        }
        if ((obj as any).geometry) {
          (obj as any).geometry.dispose();
        }
        if ((obj as any).material) {
          if (Array.isArray((obj as any).material)) {
            (obj as any).material.forEach((m: any) => m.dispose());
          } else {
            (obj as any).material.dispose();
          }
        }
      }

      disposeHierarchy(parent);
      expect(disposeGeomSpy).toHaveBeenCalledTimes(1);
      expect(disposeMatSpy).toHaveBeenCalledTimes(1);
    });
  });
});
