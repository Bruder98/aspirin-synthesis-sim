/**
 * audioSynthesizer.ts
 * Pure native Web Audio API procedural sound synthesizer for Aspirin Synthesis Simulation.
 * Operates 100% offline with zero external audio files.
 * Provides micro-clicks, stage transitions, failure warnings, crystal bursts, and success chimes.
 */

let isMutedState = false;
let globalAudioCtx: AudioContext | null = null;
let unlockListenersAttached = false;

/**
 * Lazily retrieves or instantiates the AudioContext.
 * Automatically handles browser suspended state and user activation unlock.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    try {
      globalAudioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  // Attempt auto-resume if suspended
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {
      // Browsers may block resume until user gesture
    });
  }

  // Attach one-time unlock listener if not yet attached
  if (!unlockListenersAttached && typeof window.addEventListener === 'function') {
    const unlock = () => {
      if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    unlockListenersAttached = true;
  }

  return globalAudioCtx;
}

/**
 * Checks if the global audio synthesizer is currently muted.
 */
export function isAudioMuted(): boolean {
  return isMutedState;
}

/**
 * Sets the global mute state.
 */
export function setAudioMuted(muted: boolean): void {
  isMutedState = Boolean(muted);
}

/**
 * Toggles the global mute state and returns the new state.
 */
export function toggleAudioMute(): boolean {
  isMutedState = !isMutedState;
  return isMutedState;
}

/**
 * 1. playClickSound:
 * 800Hz gentle micro-click with 15ms exponential decay.
 * Ideal for tactile button feedback.
 */
export function playClickSound(): void {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    // 15ms decay envelope
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  } catch {}
}

/**
 * 2. playStageTransitionSound:
 * Dual-tone rising chime (523Hz -> 659Hz: C5 to E5).
 * Signals advancing through the 6-stage reaction lifecycle.
 */
export function playStageTransitionSound(): void {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.20);

    // Tone 2: 659.25 Hz (E5) rising
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);

    osc2.onended = () => {
      try {
        osc1.disconnect();
        gain1.disconnect();
        osc2.disconnect();
        gain2.disconnect();
      } catch {}
    };
  } catch {}
}

/**
 * 3. playFailureWarningSound:
 * Low discordant warning buzz (180Hz sawtooth through a low-pass filter).
 * Signals laboratory failure mode activation (early water, overheating tar, warm wash loss).
 */
export function playFailureWarningSound(): void {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    // Slight pitch sag downwards for discordant warning feel
    osc.frequency.linearRampToValueAtTime(160, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.40);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };
  } catch {}
}

/**
 * 4. playCrystalBurstSound:
 * High-frequency crystalline shimmer (1200Hz - 2400Hz frequency modulation/sweep).
 * Emulates the rapid nucleation barrier collapse and needle crystal eruption.
 */
export function playCrystalBurstSound(): void {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

    // Shimmer frequency modulation
    mod.type = 'sine';
    mod.frequency.setValueAtTime(65, now);
    modGain.gain.setValueAtTime(320, now);
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.35);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.45);
    osc.stop(now + 0.45);

    osc.onended = () => {
      try {
        mod.disconnect();
        modGain.disconnect();
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  } catch {}
}

/**
 * 5. playSuccessChime:
 * Major triad chime (C5 - E5 - G5: 523.25Hz, 659.25Hz, 783.99Hz).
 * Celebrates successful synthesis or negative FeCl3 purity verification.
 */
export function playSuccessChime(): void {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0.00 }, // C5
      { freq: 659.25, delay: 0.08 }, // E5
      { freq: 783.99, delay: 0.16 }, // G5
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);
    masterGain.connect(ctx.destination);

    notes.forEach((note) => {
      const startTime = now + note.delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.70);
    });

    setTimeout(() => {
      try {
        masterGain.disconnect();
      } catch {}
    }, 900);
  } catch {}
}

/**
 * Unified Synthesizer Object Interface for flexible importing
 */
export const audioSynthesizer = {
  getAudioContext,
  isMuted: isAudioMuted,
  setMuted: setAudioMuted,
  toggleMute: toggleAudioMute,
  playClickSound,
  playStageTransitionSound,
  playFailureWarningSound,
  playCrystalBurstSound,
  playSuccessChime,
};

export default audioSynthesizer;
