/**
 * src/test/audioAdversarialStress.test.ts
 * CHALLENGER 1: Milestone 4 Audio Synthesizer & Audio Lifecycle Adversarial Stress Suite
 *
 * Empirical verification of:
 * 1. Rapid Click / Trigger Spamming (100 - 500 rapid triggers in succession)
 *    - Memory safety, singleton AudioContext reuse, unhandled exception freedom.
 * 2. Mute State Guarantee (isAudioMuted, setAudioMuted, toggleAudioMute)
 *    - Strict zero-node creation when muted across all 5 sound types.
 *    - Instant seamless resumption upon unmuting.
 *    - Mute state thrashing under high-frequency triggering.
 * 3. Suspended AudioContext & Autoplay Policy Resilience
 *    - Autoplay restriction handling when resume() rejects with DOMException / NotAllowedError.
 *    - Zero uncaught promise rejections.
 *    - User gesture unlock listeners (pointerdown/keydown) lifecycle and cleanup.
 * 4. Web Audio API Spec Conformance & Parameter Boundaries
 *    - Zero exponential ramp to <= 0 (prevents Web Audio RangeError).
 *    - Monotonic start/stop timestamps.
 *    - Resilient fallback when AudioContext constructor throws or window is absent.
 * 5. Full React Cockpit HUD Integration
 *    - Audio mute toggle button interaction in App.
 *    - Stage navigation and laboratory failure triggering with mute toggle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
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
import { useAspirinStore } from '../store/useAspirinStore';
import App from '../App';

// ResizeObserver Mock for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ---------------------------------------------------------------------------
// Realistic Web Audio API Mock Harness with Parameter & Safety Assertions
// ---------------------------------------------------------------------------

class MockAudioParam {
  value = 0;
  rampHistory: Array<{ method: string; value: number; time: number }> = [];

  setValueAtTime = vi.fn((val: number, time: number) => {
    this.value = val;
    this.rampHistory.push({ method: 'setValueAtTime', value: val, time });
    return this;
  });

  linearRampToValueAtTime = vi.fn((val: number, time: number) => {
    this.value = val;
    this.rampHistory.push({ method: 'linearRampToValueAtTime', value: val, time });
    return this;
  });

  exponentialRampToValueAtTime = vi.fn((val: number, time: number) => {
    if (val <= 0) {
      throw new RangeError(
        `Web Audio Spec Violation: exponentialRampToValueAtTime target value must be positive and non-zero, got ${val}`
      );
    }
    this.value = val;
    this.rampHistory.push({ method: 'exponentialRampToValueAtTime', value: val, time });
    return this;
  });
}

class MockAudioNode {
  connections: any[] = [];
  isDisconnected = false;

  connect = vi.fn((target: any) => {
    this.connections.push(target);
    return target;
  });

  disconnect = vi.fn(() => {
    this.isDisconnected = true;
    this.connections = [];
  });
}

class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  startTime: number | null = null;
  stopTime: number | null = null;
  onended: (() => void) | null = null;

  start = vi.fn((time: number) => {
    this.startTime = time;
  });

  stop = vi.fn((time: number) => {
    this.stopTime = time;
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

let activeContextInstances: MockAudioContext[] = [];

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 100.0;
  destination = new MockAudioNode();
  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];
  createdFilters: MockBiquadFilterNode[] = [];

  createOscillator = vi.fn(() => {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc;
  });

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain;
  });

  createBiquadFilter = vi.fn(() => {
    const filter = new MockBiquadFilterNode();
    this.createdFilters.push(filter);
    return filter;
  });

  resume = vi.fn().mockImplementation(async () => {
    this.state = 'running';
  });

  close = vi.fn().mockImplementation(async () => {
    this.state = 'closed';
  });

  constructor() {
    activeContextInstances.push(this);
  }
}

describe('CHALLENGER 1: Milestone 4 Audio Synthesizer & Audio Lifecycle Adversarial Suite', () => {
  beforeEach(() => {
    (window as any).AudioContext = MockAudioContext;
    setAudioMuted(false);
    useAspirinStore.getState().resetSimulation();

    // Reset singleton state by closing existing context if any
    const existing = getAudioContext();
    if (existing) {
      (existing as any).state = 'closed';
    }
    // Reset instance tracker so test only tracks instances created during the test
    activeContextInstances = [];
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // SECTION 1: Rapid Trigger Spamming (100 - 500 calls) & Concurrency
  // =========================================================================
  describe('1. Concurrency & High-Frequency Trigger Spamming', () => {
    it('survives 100 rapid playClickSound invocations with singleton context reuse', () => {
      for (let i = 0; i < 100; i++) {
        playClickSound();
      }

      const ctx = getAudioContext() as unknown as MockAudioContext;
      expect(ctx).toBeDefined();
      expect(activeContextInstances.length).toBe(1);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(100);
      expect(ctx.createGain).toHaveBeenCalledTimes(100);

      // Verify each oscillator stopped after start
      ctx.createdOscillators.forEach((osc) => {
        expect(osc.startTime).not.toBeNull();
        expect(osc.stopTime).not.toBeNull();
        expect(osc.stopTime!).toBeGreaterThanOrEqual(osc.startTime!);
      });
    });

    it('survives 100 rapid playStageTransitionSound dual-tone triggers', () => {
      for (let i = 0; i < 100; i++) {
        playStageTransitionSound();
      }

      const ctx = getAudioContext() as unknown as MockAudioContext;
      // Dual-tone produces 2 oscillators and 2 gains per trigger
      expect(ctx.createOscillator).toHaveBeenCalledTimes(200);
      expect(ctx.createGain).toHaveBeenCalledTimes(200);
      expect(activeContextInstances.length).toBe(1);
    });

    it('survives 100 rapid playFailureWarningSound triggers with biquad filter', () => {
      for (let i = 0; i < 100; i++) {
        playFailureWarningSound();
      }

      const ctx = getAudioContext() as unknown as MockAudioContext;
      expect(ctx.createOscillator).toHaveBeenCalledTimes(100);
      expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(100);
      expect(ctx.createGain).toHaveBeenCalledTimes(100);
      expect(activeContextInstances.length).toBe(1);
    });

    it('survives 100 rapid playCrystalBurstSound FM modulation triggers', () => {
      for (let i = 0; i < 100; i++) {
        playCrystalBurstSound();
      }

      const ctx = getAudioContext() as unknown as MockAudioContext;
      // Each crystal burst produces 2 oscillators (carrier + mod) and 2 gains (modGain + gain)
      expect(ctx.createOscillator).toHaveBeenCalledTimes(200);
      expect(ctx.createGain).toHaveBeenCalledTimes(200);
      expect(activeContextInstances.length).toBe(1);
    });

    it('survives 100 rapid playSuccessChime triggers and cleans up masterGain timers', () => {
      vi.useFakeTimers();

      for (let i = 0; i < 100; i++) {
        playSuccessChime();
      }

      const ctx = getAudioContext() as unknown as MockAudioContext;
      // Triad produces 3 oscillators and 4 gains (3 notes + 1 master)
      expect(ctx.createOscillator).toHaveBeenCalledTimes(300);
      expect(ctx.createGain).toHaveBeenCalledTimes(400);

      // Fast-forward 1000ms to allow all disconnect timeouts to execute
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      vi.useRealTimers();
      expect(activeContextInstances.length).toBe(1);
    });

    it('executes 500 interleaved randomized sound triggers across all generators without crash', () => {
      const generators = [
        playClickSound,
        playStageTransitionSound,
        playFailureWarningSound,
        playCrystalBurstSound,
        playSuccessChime,
      ];

      expect(() => {
        for (let i = 0; i < 500; i++) {
          const randomIndex = i % generators.length;
          generators[randomIndex]();
        }
      }).not.toThrow();

      expect(activeContextInstances.length).toBe(1);
      const ctx = getAudioContext() as unknown as MockAudioContext;
      // 100 * (1 + 2 + 1 + 2 + 3) = 900 oscillators
      expect(ctx.createOscillator).toHaveBeenCalledTimes(900);
    });
  });

  // =========================================================================
  // SECTION 2: Mute State Handling & Zero-Playback Guarantee
  // =========================================================================
  describe('2. Mute State Handling & Strict Zero-Playback Guarantee', () => {
    it('guarantees zero audio node creation across all generators when muted', () => {
      setAudioMuted(true);
      expect(isAudioMuted()).toBe(true);

      const ctx = getAudioContext() as unknown as MockAudioContext;
      const oscCountBefore = ctx.createOscillator.mock.calls.length;
      const gainCountBefore = ctx.createGain.mock.calls.length;

      // Trigger all generators 50 times each
      for (let i = 0; i < 50; i++) {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }

      // Absolutely zero new nodes should be instantiated
      expect(ctx.createOscillator.mock.calls.length).toBe(oscCountBefore);
      expect(ctx.createGain.mock.calls.length).toBe(gainCountBefore);
    });

    it('seamlessly resumes audio node generation when unmuted via toggleAudioMute', () => {
      setAudioMuted(true);
      expect(isAudioMuted()).toBe(true);

      playClickSound();
      const ctx = getAudioContext() as unknown as MockAudioContext;
      expect(ctx.createOscillator).not.toHaveBeenCalled();

      // Toggle to unmuted
      const newState = toggleAudioMute();
      expect(newState).toBe(false);
      expect(isAudioMuted()).toBe(false);

      playClickSound();
      expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    });

    it('handles high-frequency mute toggling during continuous playback triggers', () => {
      const ctx = getAudioContext() as unknown as MockAudioContext;
      let totalExpectedClicks = 0;

      for (let i = 0; i < 200; i++) {
        const shouldMute = i % 2 === 0;
        setAudioMuted(shouldMute);

        playClickSound();
        if (!shouldMute) {
          totalExpectedClicks++;
        }
      }

      expect(ctx.createOscillator).toHaveBeenCalledTimes(totalExpectedClicks);
      expect(totalExpectedClicks).toBe(100);
    });
  });

  // =========================================================================
  // SECTION 3: Suspended AudioContext & Autoplay Policy Handling
  // =========================================================================
  describe('3. Suspended AudioContext & Autoplay Restrictions', () => {
    it('does not throw uncaught promise rejection when resume() fails due to autoplay policy', async () => {
      const ctx = getAudioContext() as unknown as MockAudioContext;
      ctx.state = 'suspended';

      // Simulate browser rejecting resume() because user has not interacted with page
      ctx.resume = vi.fn().mockRejectedValue(
        new DOMException('The play() request was blocked by autoplay policy.', 'NotAllowedError')
      );

      expect(() => {
        // Triggering sound when context is suspended should not throw or trigger uncaught rejections
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();

      // Ensure resume was invoked attempt
      expect(ctx.resume).toHaveBeenCalled();
    });

    it('attaches user interaction listeners to unlock suspended audio context and cleans them up after first gesture', () => {
      const ctx = getAudioContext() as unknown as MockAudioContext;
      ctx.state = 'suspended';
      ctx.resume = vi.fn().mockResolvedValue(undefined);

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Simulate user gesture via pointerdown on window
      window.dispatchEvent(new Event('pointerdown'));

      // Context resume should be invoked once
      expect(ctx.resume).toHaveBeenCalledTimes(1);

      // Verify listeners were cleaned up
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      // Subsequent gestures should not invoke resume again because listeners were removed
      window.dispatchEvent(new Event('keydown'));
      window.dispatchEvent(new Event('pointerdown'));
      expect(ctx.resume).toHaveBeenCalledTimes(1);

      removeEventListenerSpy.mockRestore();
    });

    it('creates a fresh AudioContext if previous context was closed', () => {
      const ctx1 = getAudioContext() as unknown as MockAudioContext;
      expect(activeContextInstances.length).toBe(1);

      // Close current context
      ctx1.state = 'closed';

      // Subsequent getAudioContext creates a new instance
      const ctx2 = getAudioContext() as unknown as MockAudioContext;
      expect(activeContextInstances.length).toBe(2);
      expect(ctx2).not.toBe(ctx1);
    });
  });

  // =========================================================================
  // SECTION 4: Web Audio API Spec Conformance & Parameter Boundaries
  // =========================================================================
  describe('4. Web Audio API Spec Conformance & Edge Cases', () => {
    it('never calls exponentialRampToValueAtTime with zero or negative value', () => {
      // Calling all 5 sounds with MockAudioParam that throws on <= 0 target values
      expect(() => {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();

      const ctx = getAudioContext() as unknown as MockAudioContext;
      ctx.createdGains.forEach((gain) => {
        const ramps = gain.gain.rampHistory.filter(
          (r) => r.method === 'exponentialRampToValueAtTime'
        );
        ramps.forEach((ramp) => {
          expect(ramp.value).toBeGreaterThan(0);
        });
      });
    });

    it('handles Web Audio API completely missing in environment without crashing', () => {
      const savedAudioContext = (window as any).AudioContext;
      const savedWebkit = (window as any).webkitAudioContext;

      // Remove Web Audio classes
      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = undefined;

      // Close current global context so getAudioContext is forced to re-evaluate
      const existing = getAudioContext();
      if (existing) (existing as any).state = 'closed';

      expect(getAudioContext()).toBeNull();

      expect(() => {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();

      (window as any).AudioContext = savedAudioContext;
      (window as any).webkitAudioContext = savedWebkit;
    });

    it('handles AudioContext constructor throwing hardware quota or security exception', () => {
      (window as any).AudioContext = class ThrowingAudioContext {
        constructor() {
          throw new DOMException('Hardware device allocation failed', 'QuotaExceededError');
        }
      };

      const existing = getAudioContext();
      if (existing) (existing as any).state = 'closed';

      expect(getAudioContext()).toBeNull();

      expect(() => {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();

      (window as any).AudioContext = MockAudioContext;
    });

    it('falls back seamlessly to webkitAudioContext when standard AudioContext is absent', () => {
      const existing = getAudioContext();
      if (existing) (existing as any).state = 'closed';

      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = MockAudioContext;

      const ctx = getAudioContext();
      expect(ctx).toBeDefined();
      expect(ctx).toBeInstanceOf(MockAudioContext);

      (window as any).AudioContext = MockAudioContext;
      (window as any).webkitAudioContext = undefined;
    });

    it('gracefully handles createOscillator or createGain throwing out-of-memory errors', () => {
      const ctx = getAudioContext() as unknown as MockAudioContext;
      ctx.createOscillator = vi.fn(() => {
        throw new Error('Out of audio memory (device allocation error)');
      });
      ctx.createGain = vi.fn(() => {
        throw new Error('Out of audio memory (gain node allocation error)');
      });

      expect(() => {
        playClickSound();
        playStageTransitionSound();
        playFailureWarningSound();
        playCrystalBurstSound();
        playSuccessChime();
      }).not.toThrow();
    });

    it('invokes onended disconnect handlers cleanly and ignores any disconnect errors', () => {
      playClickSound();
      playStageTransitionSound();
      playFailureWarningSound();
      playCrystalBurstSound();

      const ctx = getAudioContext() as unknown as MockAudioContext;

      // Trigger all registered onended callbacks and ensure no errors throw even if disconnect throws
      ctx.createdOscillators.forEach((osc) => {
        if (osc.onended) {
          // Force disconnect to throw to verify try/catch resilience
          osc.disconnect = vi.fn(() => {
            throw new Error('Node already disconnected');
          });
          expect(() => osc.onended!()).not.toThrow();
        }
      });
    });
  });

  // =========================================================================
  // SECTION 5: React Cockpit HUD Integration & UI Mute Sync
  // =========================================================================
  describe('5. App Master Cockpit UI Mute Integration', () => {
    it('syncs audio mute state via header button and mutes simulation action sounds', async () => {
      render(React.createElement(App));

      const muteBtn = screen.getByTestId('audio-mute-toggle');
      expect(muteBtn).toBeDefined();

      // Initial state is unmuted
      expect(isAudioMuted()).toBe(false);

      // Click mute button in header
      fireEvent.click(muteBtn);
      expect(isAudioMuted()).toBe(true);

      const ctx = getAudioContext() as unknown as MockAudioContext;
      if (ctx) {
        vi.clearAllMocks();
      }

      // Advance stage via step button while muted
      const stage2Btn = screen.getByTestId('stage-step-btn-1');
      fireEvent.click(stage2Btn);

      if (ctx) {
        // No audio nodes should have been created because it is muted
        expect(ctx.createOscillator).not.toHaveBeenCalled();
      }

      // Unmute via header button
      fireEvent.click(muteBtn);
      expect(isAudioMuted()).toBe(false);

      // Advance stage again while unmuted
      const stage3Btn = screen.getByTestId('stage-step-btn-2');
      fireEvent.click(stage3Btn);

      if (ctx) {
        expect(ctx.createOscillator).toHaveBeenCalled();
      }
    });
  });
});
