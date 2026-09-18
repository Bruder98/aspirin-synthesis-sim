/**
 * MacroApparatusView.tsx
 * High-fidelity 2D Canvas dynamic rendering of laboratory apparatus with window.devicePixelRatio scaling.
 * Features realistic laboratory equipment:
 *  - Precision digital analytical balance (전자저울) with glass draft shield & dynamic mass readout (0.000g -> 2.000g)
 *  - 125 mL Pyrex Erlenmeyer flask (삼각플라스크) with mathematically accurate convex borosilicate geometry & white graduations
 *  - Digital hotplate-stirrer (마그네틱 핫플레이트 교반기) with ceramic top plate, LED display & magnetic vortex
 *  - 800 mL Pyrex water bath beaker (물중탕 비커) with authentic immersion depth, convection & thermometer
 *  - Retort stand and 3-prong clamp securing flask in water bath
 *  - Insulated ice-water bath tub with faceted floating ice cubes & frost condensation
 *  - Chemical spatula, volumetric pipette, amber dropper bottle with catalyst drops
 *  - Antisolvent nucleation burst of sharp monoclinic needle crystals (침상 결정) strictly confined within flask liquid
 *  - Ostwald crystal ripening cake with facet glints & glass stirring rod
 *  - Heavy-wall Büchner filter flask (감압 플라스크), porcelain Büchner funnel (뷔히너 깔때기), vacuum hose & wash bottle
 * References: SPEC-UI-3D-PEDAGOGY-001 Section 4, PROJECT.md
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useAspirinStore } from '../../store/useAspirinStore';
import { SynthesisStageId, FailureMode } from '../../engine/types';

interface MacroApparatusViewProps {
  className?: string;
}

// Particle interfaces for dynamic apparatus effects
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color?: string;
}

interface IceCube {
  x: number;
  y: number;
  size: number;
  angle: number;
  points: [number, number][];
}

interface NeedleCrystal {
  x: number;
  y: number;
  length: number;
  angle: number;
  thickness: number;
  delay: number;
}

export const MacroApparatusView: React.FC<MacroApparatusViewProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zustand subscriptions
  const currentStage = useAspirinStore((s) => s.currentStage);
  const isPlaying = useAspirinStore((s) => s.isPlaying);
  const stageProgress = useAspirinStore((s) => s.stageProgress);
  const playbackSpeed = useAspirinStore((s) => s.playbackSpeed);
  const failureMode = useAspirinStore((s) => s.failureMode);
  const setStageProgress = useAspirinStore((s) => s.setStageProgress);

  // Internal animation timing and particles state
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const localTimeRef = useRef<number>(0);
  const localProgressRef = useRef<number>(stageProgress);
  const lastProgressSyncTimeRef = useRef<number>(0);
  const prevStageRef = useRef<SynthesisStageId>(currentStage);

  // Cached procedural elements
  const iceCubesRef = useRef<IceCube[]>([]);
  const needlesRef = useRef<NeedleCrystal[]>([]);
  const steamParticlesRef = useRef<Particle[]>([]);
  const dropletParticlesRef = useRef<Particle[]>([]);

  // Initialize procedural ice cubes with 3D faceted geometry
  const initIceCubes = useCallback(() => {
    const cubes: IceCube[] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const size = 18 + Math.random() * 10;
      const angle = (Math.random() * Math.PI) / 3;
      const pts: [number, number][] = [];
      const numVertices = 6;
      for (let v = 0; v < numVertices; v++) {
        const theta = (v * 2 * Math.PI) / numVertices + (Math.random() - 0.5) * 0.25;
        const r = size * 0.5 * (0.85 + Math.random() * 0.3);
        pts.push([Math.cos(theta) * r, Math.sin(theta) * r]);
      }
      cubes.push({
        x: -105 + (i % 8) * 28 + (Math.random() - 0.5) * 6,
        y: 20 + Math.floor(i / 8) * 26 + (Math.random() - 0.5) * 4,
        size,
        angle,
        points: pts,
      });
    }
    iceCubesRef.current = cubes;
  }, []);

  // Initialize needle crystals strictly bounded for Stage 4 burst inside flask liquid
  const initNeedles = useCallback(() => {
    const needles: NeedleCrystal[] = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * 48;
      needles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * (dist * 0.42),
        length: 10 + Math.random() * 22,
        angle: angle + (Math.random() - 0.5) * 0.6,
        thickness: 1.2 + Math.random() * 1.5,
        delay: Math.random() * 0.45,
      });
    }
    needlesRef.current = needles;
  }, []);

  useEffect(() => {
    initIceCubes();
    initNeedles();
  }, [initIceCubes, initNeedles]);

  // Synchronize localProgressRef if external stageProgress changes or stage changes
  useEffect(() => {
    if (prevStageRef.current !== currentStage) {
      prevStageRef.current = currentStage;
      localProgressRef.current = 0.0;
      return;
    }

    if (!isPlaying) {
      localProgressRef.current = stageProgress;
      return;
    }

    const timeSinceOurSync = performance.now() - lastProgressSyncTimeRef.current;
    if (timeSinceOurSync > 150 || Math.abs(stageProgress - localProgressRef.current) > 0.04) {
      localProgressRef.current = stageProgress;
    }
  }, [stageProgress, isPlaying, currentStage]);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (isPlaying) {
        const cycleDuration = 4.0;
        const deltaProgress = (dt * playbackSpeed) / cycleDuration;
        localProgressRef.current = (localProgressRef.current + deltaProgress) % 1.0;

        if (now - lastProgressSyncTimeRef.current >= 100) {
          lastProgressSyncTimeRef.current = now;
          setStageProgress(localProgressRef.current);
        }
        localTimeRef.current += dt * playbackSpeed;
      } else {
        localProgressRef.current = useAspirinStore.getState().stageProgress;
      }
      const t = localProgressRef.current;
      const timeSec = localTimeRef.current;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetWidth = Math.round(rect.width * dpr);
      const targetHeight = Math.round(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // 1. Reset transform matrix to true device pixel identity & clear canvas buffer
      if (typeof ctx.setTransform === 'function') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Set DPR coordinate system [0, w] x [0, h]
      if (typeof ctx.setTransform === 'function') {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        ctx.save();
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;

      // 3. Modern Laboratory Fume Hood Background (Polished Deep Dark Slate)
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, Math.max(w, h));
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.6, '#090d16');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fume Hood Ambient Light Cone from top
      const hoodLight = ctx.createRadialGradient(w * 0.5, 0, 60, w * 0.5, h * 0.45, w * 0.7);
      hoodLight.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      hoodLight.addColorStop(0.6, 'rgba(56, 189, 248, 0.02)');
      hoodLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hoodLight;
      ctx.fillRect(0, 0, w, h);

      // Subtle Background Grid Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h * 0.82);
        ctx.stroke();
      }
      for (let y = 0; y <= h * 0.82; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Centered Apparatus Coordinate System
      ctx.save();
      const benchY = 100;
      const scale = Math.min(w / 430, h / 360) * 1.02;
      ctx.translate(w * 0.5, h * 0.53);
      ctx.scale(scale, scale);

      // Laboratory Bench Surface in scaled coordinates
      drawLabBenchSurface(ctx, (-w / scale) * 0.6, (w / scale) * 0.6, benchY, 180);

      // Render Active Apparatus Scene
      renderApparatusScene(ctx, currentStage, t, timeSec, failureMode, {
        iceCubes: iceCubesRef.current,
        needles: needlesRef.current,
        steamParticles: steamParticlesRef.current,
        dropletParticles: dropletParticlesRef.current,
        dt,
      });

      ctx.restore(); // restore scaled apparatus transform

      // 5. Sleek, Minimal, Non-Intrusive HUD Badge Overlays
      renderModernHudOverlay(ctx, w, h, currentStage, t, failureMode);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [currentStage, isPlaying, playbackSpeed, failureMode, setStageProgress]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] flex flex-col bg-lab-950 overflow-hidden select-none ${className}`}
      data-testid="macro-apparatus-viewport"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Accessible Screen Reader Status */}
      <div className="sr-only" aria-live="polite">
        현재 거시적 실험실 뷰: {getStageDescription(currentStage, failureMode)}
      </div>
    </div>
  );
};

// ============================================================================
// LAB BENCH SURFACE
// ============================================================================
function drawLabBenchSurface(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  rightX: number,
  benchY: number,
  depth: number
) {
  const width = rightX - leftX;

  ctx.save();
  // Bench Top Surface (Dark Epoxy Lab Resin Bench with soft depth reflection)
  const benchGrad = ctx.createLinearGradient(0, benchY, 0, benchY + depth);
  benchGrad.addColorStop(0, '#1e293b');
  benchGrad.addColorStop(0.12, '#0f172a');
  benchGrad.addColorStop(1, '#020617');
  ctx.fillStyle = benchGrad;
  ctx.fillRect(leftX, benchY, width, depth);

  // Bevel Highlight Edge
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX, benchY);
  ctx.lineTo(rightX, benchY);
  ctx.stroke();

  // Subtle cyan edge reflection line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX + width * 0.15, benchY + 2);
  ctx.lineTo(rightX - width * 0.15, benchY + 2);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// STAGE-SPECIFIC DRAWING ROUTINES
// ============================================================================

interface SceneAssets {
  iceCubes: IceCube[];
  needles: NeedleCrystal[];
  steamParticles: Particle[];
  dropletParticles: Particle[];
  dt: number;
}

function renderApparatusScene(
  ctx: CanvasRenderingContext2D,
  stage: SynthesisStageId,
  t: number,
  timeSec: number,
  failureMode: FailureMode,
  assets: SceneAssets
) {
  switch (stage) {
    case 1:
      drawStage1ReagentDispensing(ctx, t, timeSec, failureMode);
      break;
    case 2:
      drawStage2HotWaterBath(ctx, t, timeSec, failureMode, assets);
      break;
    case 3:
      drawStage3IceBathMetastable(ctx, t, timeSec, failureMode, assets.iceCubes);
      break;
    case 4:
      drawStage4WaterAntisolventBurst(ctx, t, timeSec, failureMode, assets.iceCubes, assets.needles);
      break;
    case 5:
      drawStage5CrystalMaturation(ctx, t, timeSec, failureMode, assets.iceCubes);
      break;
    case 6:
      drawStage6BuchnerFiltration(ctx, t, timeSec, failureMode, assets.dropletParticles, assets.dt);
      break;
  }
}

// ----------------------------------------------------------------------------
// STAGE 1: Reagents Dispensing & Mixing
// Precision Digital Analytical Balance, 125mL Erlenmeyer Flask on weighing pan,
// Spatula adding salicylic acid powder, pipette pouring acetic anhydride, dropper adding catalyst.
// ----------------------------------------------------------------------------
function drawStage1ReagentDispensing(
  ctx: CanvasRenderingContext2D,
  t: number,
  timeSec: number,
  failureMode: FailureMode
) {
  const safeT = Math.max(0, Math.min(1, t));
  const benchY = 100;

  // 1. Digital Analytical Balance with Draft Shield
  const balanceW = 220;
  const balanceH = 46;
  const balanceY = benchY - balanceH;
  const panW = 100;
  const panY = balanceY - 14;

  const dispensedMassG = Math.max(0.0, Math.min(2.0, (safeT / 0.35) * 2.0));
  const isStable = safeT >= 0.35;

  drawDigitalAnalyticalBalance(ctx, 0, balanceY, balanceW, balanceH, panY, panW, dispensedMassG, isStable);

  // 2. Erlenmeyer Flask sits directly on the Balance Pan
  const flaskBaseY = panY - 2;
  const flaskBodyH = 125;
  const flaskY = flaskBaseY - flaskBodyH * 0.5;

  let liquidHeightFraction = 0;
  if (safeT > 0.3) {
    liquidHeightFraction = Math.min(1.0, (safeT - 0.3) / 0.4);
  }

  const powderAmount = Math.min(1.0, safeT / 0.35);

  const liquidColor =
    failureMode === 'EARLY_WATER'
      ? 'rgba(226, 232, 240, 0.50)'
      : 'rgba(241, 245, 249, 0.28)';

  let swirlAngle = 0;
  if (safeT > 0.85) {
    const swirlT = (safeT - 0.85) / 0.15;
    swirlAngle = Math.sin(swirlT * Math.PI * 6) * 0.035;
  }

  ctx.save();
  ctx.translate(0, flaskBaseY);
  ctx.rotate(swirlAngle);
  ctx.translate(0, -flaskBaseY);

  drawErlenmeyerFlask(ctx, 0, flaskY, {
    liquidFraction: liquidHeightFraction * 0.38,
    liquidColor,
    powderAmount,
    showGraduations: true,
  });

  if (failureMode === 'EARLY_WATER' && safeT > 0.35) {
    drawFizzingBubbles(ctx, 0, flaskBaseY - 15, 45, timeSec);
  }
  ctx.restore();

  // 3. Laboratory Spatula & Falling White Powder Stream (t < 0.38)
  if (safeT < 0.38) {
    const spatulaFade = safeT < 0.3 ? 1 : (0.38 - safeT) / 0.08;
    ctx.save();
    ctx.globalAlpha = spatulaFade;

    ctx.save();
    ctx.translate(-50, flaskY - 105);
    ctx.rotate(0.32);

    // Spatula handle
    ctx.fillStyle = '#475569';
    ctx.fillRect(-65, -3.5, 65, 7);
    // Polished stainless blade
    const spatGrad = ctx.createLinearGradient(0, -4, 0, 4);
    spatGrad.addColorStop(0, '#cbd5e1');
    spatGrad.addColorStop(0.5, '#f1f5f9');
    spatGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = spatGrad;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(55, -2.5);
    ctx.lineTo(62, 2.5);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();

    // White salicylic acid powder pile on spatula
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(36, -1.5, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Falling powder crystal particles
    const streamIntensity = Math.max(0, Math.sin((Math.max(0, Math.min(0.35, safeT)) / 0.35) * Math.PI));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 20; i++) {
      const pY = flaskY - 95 + ((i * 11 + timeSec * 260) % 140);
      const spread = (pY - (flaskY - 95)) * 0.1;
      const pX = -10 + Math.sin(i * 3.7) * spread;
      if (pY > flaskY - 95 && pY < flaskBaseY - 4) {
        ctx.beginPath();
        const r = Math.max(0.2, 1.3 * streamIntensity);
        ctx.arc(pX, pY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 4. Volumetric Pipette pouring Acetic Anhydride (t in [0.28, 0.68])
  if (safeT >= 0.28 && safeT <= 0.68) {
    const pipetteAlpha = safeT < 0.32 ? (safeT - 0.28) / 0.04 : safeT > 0.62 ? (0.68 - safeT) / 0.06 : 1.0;
    ctx.save();
    ctx.globalAlpha = pipetteAlpha;

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(32, flaskY - 150);
    ctx.lineTo(24, flaskY - 150);
    ctx.lineTo(12, flaskY - 75);
    ctx.lineTo(8, flaskY - 55);
    ctx.lineTo(14, flaskY - 55);
    ctx.lineTo(18, flaskY - 75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stream of clear liquid
    ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.fillRect(9, flaskY - 55, 3.5, 105);

    ctx.restore();
  }

  // 5. Amber Dropper adding 5 drops H3PO4 Catalyst (t in [0.63, 0.88])
  if (safeT >= 0.63 && safeT <= 0.88) {
    const dropperAlpha = safeT < 0.67 ? (safeT - 0.63) / 0.04 : safeT > 0.84 ? (0.88 - safeT) / 0.04 : 1.0;
    ctx.save();
    ctx.globalAlpha = dropperAlpha;

    // Amber dropper tip
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-6, flaskY - 130, 12, 45);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-6, flaskY - 85);
    ctx.lineTo(6, flaskY - 85);
    ctx.lineTo(2.5, flaskY - 65);
    ctx.lineTo(-2.5, flaskY - 65);
    ctx.closePath();
    ctx.fill();

    // 5 drops sequence
    const dropPhase = ((safeT - 0.65) / 0.2) * 5;
    const currentDropIndex = Math.floor(dropPhase);
    const dropFrac = dropPhase - currentDropIndex;

    if (currentDropIndex < 5) {
      const dropY = flaskY - 65 + dropFrac * 105;
      if (dropY < flaskBaseY - 15) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
        ctx.beginPath();
        ctx.ellipse(0, dropY, 2.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const rippleR = (dropY - (flaskBaseY - 15)) * 1.5;
        ctx.strokeStyle = `rgba(245, 158, 11, ${Math.max(0, 0.8 - rippleR / 15)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, flaskBaseY - 15, rippleR, rippleR * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ----------------------------------------------------------------------------
// STAGE 2: Hot Water Bath Heating & Magnetic Stirring
// Digital Hotplate-Stirrer, 800mL Pyrex Beaker Water Bath, Retort Stand & Clamp,
// Immersed Erlenmeyer Flask with vortex & rotating stir bar, Thermometer, Steam.
// ----------------------------------------------------------------------------
function drawStage2HotWaterBath(
  ctx: CanvasRenderingContext2D,
  _t: number,
  timeSec: number,
  failureMode: FailureMode,
  _assets: SceneAssets
) {
  const isOverheating = failureMode === 'OVERHEATING';
  const bathTemp = isOverheating ? 98.5 : 80.0;
  const benchY = 100;

  // 1. Digital Hotplate-Stirrer Chassis
  const hpW = 270;
  const hpH = 44;
  const hpY = benchY - hpH;

  drawDigitalHotplate(ctx, 0, hpY, hpW, hpH, bathTemp, isOverheating, timeSec);

  // 2. Retort Stand (Cast-iron base on bench, steel rod on right)
  const standRodX = 120;
  drawRetortStandAndRod(ctx, standRodX, benchY, -170);

  // 3. 800 mL Pyrex Water Bath Beaker Back Wall & Water Fill
  const beakerW = 230;
  const beakerH = 155;
  const beakerX = 0;
  const beakerBaseY = hpY - 2;

  const waterColor = isOverheating ? 'rgba(234, 88, 12, 0.28)' : 'rgba(56, 189, 248, 0.24)';
  drawLaboratoryBeakerBack(ctx, beakerX, beakerBaseY, beakerW, beakerH, {
    waterHeight: 110,
    waterColor,
    timeSec,
  });

  // Steam Wisps rising from hot water bath
  drawSteamWisps(ctx, beakerX, beakerBaseY - 110, beakerW * 0.7, timeSec, isOverheating);

  // Thermometer immersed in water bath
  drawThermometer(ctx, -beakerW * 0.38, beakerBaseY - beakerH - 18, 140, bathTemp, 110);

  // 4. Immersed 125 mL Erlenmeyer Flask
  const flaskBaseY = beakerBaseY - 20; // Suspended 20px above beaker bottom
  const flaskBodyH = 125;
  const flaskY = flaskBaseY - flaskBodyH * 0.5;

  const stirAngle = timeSec * (isOverheating ? 32 : 18);
  const liquidColor = isOverheating
    ? 'rgba(120, 53, 15, 0.75)'
    : 'rgba(254, 240, 138, 0.38)';

  drawErlenmeyerFlask(ctx, beakerX, flaskY, {
    liquidFraction: 0.42,
    liquidColor,
    powderAmount: 0,
    showGraduations: true,
    isStirring: true,
    stirAngle,
    hasTar: isOverheating,
  });

  // Water Bath Immersion Refraction Tint on submerged flask
  ctx.save();
  const waterRefractGrad = ctx.createLinearGradient(0, beakerBaseY - 110, 0, beakerBaseY);
  waterRefractGrad.addColorStop(0, isOverheating ? 'rgba(234, 88, 12, 0.10)' : 'rgba(14, 165, 233, 0.12)');
  waterRefractGrad.addColorStop(1, isOverheating ? 'rgba(234, 88, 12, 0.22)' : 'rgba(14, 165, 233, 0.18)');
  ctx.fillStyle = waterRefractGrad;
  ctx.beginPath();
  ctx.rect(beakerX - beakerW * 0.46, beakerBaseY - 110, beakerW * 0.92, 110);
  ctx.fill();
  ctx.restore();

  // 5. Beaker Front Glass Outline, Spout, Lip & Enamel Graduations
  drawLaboratoryBeakerFront(ctx, beakerX, beakerBaseY, beakerW, beakerH, timeSec);

  // 6. Retort Stand Clamp securing the flask neck
  const clampY = flaskY - 65;
  drawRetortStandClamp(ctx, standRodX, clampY, beakerX);
}

// ----------------------------------------------------------------------------
// STAGE 3: Ice-Water Bath 1st Cooling (Metastable Zone)
// Insulated Ice Bath Basin, floating ice cubes, Erlenmeyer flask with
// 100% crystal-clear transparent liquid (zero crystals in metastable zone).
// ----------------------------------------------------------------------------
function drawStage3IceBathMetastable(
  ctx: CanvasRenderingContext2D,
  _t: number,
  timeSec: number,
  _failureMode: FailureMode,
  iceCubes: IceCube[]
) {
  const benchY = 100;
  const tubW = 250;
  const tubH = 92;
  const tubBaseY = benchY;

  // 1. Chilled Ice Bath Basin
  drawIceBathTub(ctx, 0, tubBaseY, tubW, tubH, timeSec);

  // Ice cubes behind flask
  drawIceCubes(ctx, iceCubes.slice(0, 8), timeSec);

  // 2. Erlenmeyer Flask seated in ice bath
  const flaskBaseY = tubBaseY - 14;
  const flaskBodyH = 125;
  const flaskY = flaskBaseY - flaskBodyH * 0.5;

  // CRUCIAL: 100% transparent clear liquid, 0% crystals (Metastable Zone)
  drawErlenmeyerFlask(ctx, 0, flaskY, {
    liquidFraction: 0.38,
    liquidColor: 'rgba(254, 240, 138, 0.38)',
    powderAmount: 0,
    showGraduations: true,
    hasFrost: true,
  });

  // Floating ice cubes in front of flask
  drawIceCubes(ctx, iceCubes.slice(8), timeSec);

  // Immersion thermometer (2.0°C) in ice-water slurry
  drawThermometer(ctx, 92, tubBaseY - tubH - 12, 95, 2.0, 50);

  // Clamp bracket on tub wall
  ctx.fillStyle = '#475569';
  ctx.fillRect(88, tubBaseY - tubH - 2, 8, 8);
}

// ----------------------------------------------------------------------------
// STAGE 4: Distilled Water Antisolvent Injection (Nucleation Burst)
// Distilled water stream injected, sudden dielectric surge, explosive bloom
// of sharp white needle-like crystals strictly confined within the flask.
// ----------------------------------------------------------------------------
function drawStage4WaterAntisolventBurst(
  ctx: CanvasRenderingContext2D,
  t: number,
  timeSec: number,
  failureMode: FailureMode,
  iceCubes: IceCube[],
  needles: NeedleCrystal[]
) {
  const benchY = 100;
  const tubW = 250;
  const tubH = 92;
  const tubBaseY = benchY;

  // 1. Ice Bath Basin in background
  drawIceBathTub(ctx, 0, tubBaseY, tubW, tubH, timeSec);
  drawIceCubes(ctx, iceCubes.slice(0, 8), timeSec);

  // 2. Erlenmeyer Flask
  const flaskBaseY = tubBaseY - 14;
  const flaskBodyH = 125;
  const flaskY = flaskBaseY - flaskBodyH * 0.5;

  const isEarlyWater = failureMode === 'EARLY_WATER';

  let liquidColor = 'rgba(254, 240, 138, 0.38)';
  if (t > 0.2) {
    const milkAlpha = Math.min(0.92, 0.38 + (t - 0.2) * 1.5);
    liquidColor = `rgba(241, 245, 249, ${milkAlpha})`;
  }

  const waterFillFrac = 0.38 + Math.min(0.27, t * 0.35);
  const burstProgress = isEarlyWater ? 0 : Math.max(0, Math.min(1.0, (t - 0.22) / 0.65));

  drawErlenmeyerFlask(ctx, 0, flaskY, {
    liquidFraction: waterFillFrac,
    liquidColor,
    powderAmount: 0,
    showGraduations: true,
    hasFrost: true,
    needleBurstProgress: burstProgress,
    needles,
  });

  // 3. Water Injection Cylinder / Pouring Vessel (t < 0.38)
  if (t < 0.38) {
    const streamAlpha = t < 0.3 ? 1.0 : (0.38 - t) / 0.08;
    ctx.save();
    ctx.globalAlpha = streamAlpha;

    ctx.save();
    ctx.translate(48, flaskY - 110);
    ctx.rotate(-0.48);

    // Cylinder glass body
    ctx.fillStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-10, -48, 20, 64, [3, 3, 5, 5]);
    ctx.fill();
    ctx.stroke();

    // Pouring spout at rim
    ctx.beginPath();
    ctx.moveTo(-10, -48);
    ctx.lineTo(-16, -52);
    ctx.lineTo(-8, -48);
    ctx.stroke();

    // Hexagonal foot base
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillRect(-15, 14, 30, 4);

    // Blue water volume inside cylinder
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.beginPath();
    ctx.roundRect(-8, -25, 16, 38, 2);
    ctx.fill();

    // White graduation lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let gy = -40; gy <= 8; gy += 10) {
      ctx.beginPath();
      ctx.moveTo(-8, gy);
      ctx.lineTo(-1, gy);
      ctx.stroke();
    }
    ctx.restore();

    // Continuous curved stream of ice-cold distilled water into flask
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.moveTo(34, flaskY - 100);
    ctx.quadraticCurveTo(24, flaskY - 60, 4, flaskBaseY - 45);
    ctx.lineTo(8, flaskBaseY - 45);
    ctx.quadraticCurveTo(27, flaskY - 60, 38, flaskY - 100);
    ctx.closePath();
    ctx.fill();

    // Droplet splash at impact site
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(6, flaskBaseY - 46, 3.5, 0, Math.PI * 2);
    ctx.arc(10, flaskBaseY - 50, 2.2, 0, Math.PI * 2);
    ctx.arc(2, flaskBaseY - 49, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Early Water failure: cloudy gray solution with warning text
  if (isEarlyWater && t > 0.3) {
    ctx.save();
    ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, flaskBaseY - 30, 45, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('침상 결정 미석출 (사전 가수분해 실패)', 0, flaskBaseY - 26);
    ctx.restore();
  }

  // Ice cubes in front
  drawIceCubes(ctx, iceCubes.slice(8), timeSec);
}

// ----------------------------------------------------------------------------
// STAGE 5: Crystal Maturation / Ripening in Ice Bath
// Dense crystalline cake settled at bottom, clear supernatant, sparkling facets,
// glass stirring rod gently moving.
// ----------------------------------------------------------------------------
function drawStage5CrystalMaturation(
  ctx: CanvasRenderingContext2D,
  _t: number,
  timeSec: number,
  failureMode: FailureMode,
  iceCubes: IceCube[]
) {
  const benchY = 100;
  const tubW = 250;
  const tubH = 92;
  const tubBaseY = benchY;

  drawIceBathTub(ctx, 0, tubBaseY, tubW, tubH, timeSec);
  drawIceCubes(ctx, iceCubes.slice(0, 8), timeSec);

  const flaskBaseY = tubBaseY - 14;
  const flaskBodyH = 125;
  const flaskY = flaskBaseY - flaskBodyH * 0.5;

  drawErlenmeyerFlask(ctx, 0, flaskY, {
    liquidFraction: 0.65,
    liquidColor: 'rgba(226, 232, 240, 0.25)',
    powderAmount: 0,
    showGraduations: true,
    hasFrost: true,
    settledCakeHeight: 38,
    cakeColor: failureMode === 'OVERHEATING' ? '#78350f' : '#ffffff',
  });

  // Realistic borosilicate glass stirring rod gently resting inside flask
  const rodOffset = Math.sin(timeSec * 3) * 8;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rodOffset - 15, flaskY - 110);
  ctx.lineTo(rodOffset + 24, flaskBaseY - 12);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rodOffset - 16, flaskY - 108);
  ctx.lineTo(rodOffset + 23, flaskBaseY - 14);
  ctx.stroke();
  ctx.restore();

  // Specular facet sparkle glints on pure crystal facets
  if (failureMode !== 'OVERHEATING') {
    drawGlintSparkles(ctx, 0, flaskBaseY - 20, 60, 18, timeSec);
  }

  drawIceCubes(ctx, iceCubes.slice(8), timeSec);
}

// ----------------------------------------------------------------------------
// STAGE 6: Buchner Vacuum Filtration & Washing
// Heavy-wall Side-Arm Filter Flask on bench, Porcelain Büchner Funnel, Rubber Adapter,
// Vacuum Tubing to pump, Suction Droplets, Filtrate Rising, Wash Bottle Jet.
// ----------------------------------------------------------------------------
function drawStage6BuchnerFiltration(
  ctx: CanvasRenderingContext2D,
  t: number,
  timeSec: number,
  failureMode: FailureMode,
  droplets: Particle[],
  dt: number
) {
  const isWarmWash = failureMode === 'WARM_WASH';
  const benchY = 100;

  // Filter Flask sits firmly on the bench
  const flaskBaseY = benchY;
  const flaskH = 135;
  const flaskNeckY = flaskBaseY - flaskH;

  ctx.save();

  // 1. Heavy Vacuum Tubing from side-arm down toward bench vacuum tap
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(35, flaskNeckY + 28);
  ctx.bezierCurveTo(70, flaskNeckY + 28, 110, flaskNeckY + 45, 155, benchY + 15);
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 2. Heavy-Walled Side-Arm Filter Flask Glass Body
  drawFilterFlaskBody(ctx, 0, flaskBaseY, flaskH, t);

  // 3. Black Neoprene Rubber Adapter Ring
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-22, flaskNeckY - 6, 44, 10, 3);
  ctx.fill();
  ctx.stroke();

  // 4. Porcelain Büchner Funnel
  const funnelY = flaskNeckY - 6;
  drawBuchnerFunnel(ctx, 0, funnelY, t, failureMode);

  // 5. Suction Liquid Droplets dripping into flask
  if (Math.random() < 0.35) {
    droplets.push({
      x: (Math.random() - 0.5) * 6,
      y: funnelY + 38,
      vx: 0,
      vy: 110 + Math.random() * 70,
      size: 2.2 + Math.random() * 1.5,
      alpha: 0.85,
      life: 0,
      maxLife: 0.7,
      color: 'rgba(245, 158, 11, 0.85)',
    });
  }

  for (let i = droplets.length - 1; i >= 0; i--) {
    const p = droplets[i];
    p.life += dt;
    p.y += p.vy * dt;
    if (p.life >= p.maxLife || p.y > flaskBaseY - 10) {
      droplets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color || '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * 0.7, p.size * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Wash Bottle Jet (t in [0.52, 0.95])
  if (t >= 0.52 && t <= 0.95) {
    const washAlpha = t < 0.58 ? (t - 0.52) / 0.06 : t > 0.9 ? (0.95 - t) / 0.05 : 1.0;
    ctx.save();
    ctx.globalAlpha = washAlpha;

    // Wash nozzle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(65, funnelY - 95);
    ctx.lineTo(25, funnelY - 75);
    ctx.stroke();

    // Wash liquid stream
    ctx.fillStyle = isWarmWash ? 'rgba(251, 146, 60, 0.85)' : 'rgba(56, 189, 248, 0.85)';
    ctx.fillRect(20, funnelY - 75, 3.5, 45);

    ctx.restore();
  }

  // 7. Warm Wash Failure Callout Text
  if (isWarmWash && t > 0.45) {
    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.fillText('미지근한 세척수 (25°C): 아스피린 결정 재용해 손실', 0, flaskNeckY - 80);
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// CORE APPARATUS GEOMETRY DRAWING FUNCTIONS
// ============================================================================

/**
 * Precision Digital Analytical Balance (전자저울)
 */
function drawDigitalAnalyticalBalance(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  panY: number,
  panW: number,
  massG: number,
  isStable: boolean
) {
  ctx.save();

  // Draft Shield Glass Chamber (Clear borosilicate enclosing balance pan)
  const shieldW = w * 0.82;
  const shieldH = y - panY + 110;
  const shieldTopY = y - shieldH;

  ctx.fillStyle = 'rgba(224, 242, 254, 0.04)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - shieldW * 0.5, shieldTopY, shieldW, shieldH, [6, 6, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Glass chamber frame posts
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - shieldW * 0.5 - 2, shieldTopY, 4, shieldH);
  ctx.fillRect(x + shieldW * 0.5 - 2, shieldTopY, 4, shieldH);

  // Balance Main Body (Dark Sleek Laboratory Housing)
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, '#1e293b');
  bodyGrad.addColorStop(0.5, '#0f172a');
  bodyGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, y, w, h, [8, 8, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Rubber Feet on Bench
  ctx.fillStyle = '#020617';
  ctx.fillRect(x - w * 0.45, y + h - 2, 20, 5);
  ctx.fillRect(x + w * 0.45 - 20, y + h - 2, 20, 5);

  // Digital LED Display Screen
  const screenW = 105;
  const screenH = 26;
  const screenX = x - screenW * 0.5;
  const screenY = y + 10;

  ctx.fillStyle = '#050a14';
  ctx.fillRect(screenX, screenY, screenW, screenH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, screenW, screenH);

  // Stability & Mode Indicator
  ctx.font = '7px "JetBrains Mono", monospace';
  ctx.fillStyle = isStable ? '#10b981' : '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText(isStable ? '● STBL' : '○ TARE', screenX + 5, screenY + 10);

  // Digital Screen Text
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = isStable ? '#10b981' : '#38bdf8';
  ctx.textAlign = 'right';
  ctx.fillText(`${massG.toFixed(3)} g`, screenX + screenW - 6, screenY + 20);

  // Control Buttons (TARE, CAL)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(screenX - 35, screenY + 4, 25, 16, 3);
  ctx.roundRect(screenX + screenW + 10, screenY + 4, 25, 16, 3);
  ctx.fill();
  ctx.font = '7px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('TARE', screenX - 22, screenY + 15);
  ctx.fillText('CAL', screenX + screenW + 22, screenY + 15);

  // Stainless Steel Weighing Pan (pan sits atop central column)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 8, panY + 4, 16, y - panY);

  // Pan Plate
  const panGrad = ctx.createLinearGradient(x - panW * 0.5, panY, x + panW * 0.5, panY);
  panGrad.addColorStop(0, '#94a3b8');
  panGrad.addColorStop(0.25, '#e2e8f0');
  panGrad.addColorStop(0.75, '#f8fafc');
  panGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = panGrad;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - panW * 0.5, panY, panW, 6, 3);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Digital Magnetic Hotplate-Stirrer
 */
function drawDigitalHotplate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tempC: number,
  isOverheating: boolean,
  _timeSec: number
) {
  ctx.save();

  // Main Chassis
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, y, w, h, [6, 6, 12, 12]);
  ctx.fill();
  ctx.stroke();

  // White Ceramic Top Heating Plate
  const plateH = 8;
  const plateW = w * 0.94;
  const plateY = y - plateH;
  const plateGrad = ctx.createLinearGradient(x - plateW * 0.5, plateY, x + plateW * 0.5, plateY);
  plateGrad.addColorStop(0, '#cbd5e1');
  plateGrad.addColorStop(0.5, '#f8fafc');
  plateGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = plateGrad;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - plateW * 0.5, plateY, plateW, plateH, [4, 4, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Hot Surface Warning Glow if heated
  if (tempC > 40) {
    const heatGlow = ctx.createLinearGradient(0, plateY, 0, plateY + 6);
    heatGlow.addColorStop(0, isOverheating ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)');
    heatGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = heatGlow;
    ctx.fillRect(x - plateW * 0.48, plateY, plateW * 0.96, 6);
  }

  // Dual Digital Displays on Chassis (Temp & RPM)
  const dW = 68;
  const dH = 22;
  const dY = y + 10;

  // Temperature Display (Left)
  ctx.fillStyle = '#020617';
  ctx.fillRect(x - dW - 8, dY, dW, dH);
  ctx.strokeStyle = isOverheating ? '#ef4444' : '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - dW - 8, dY, dW, dH);

  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = isOverheating ? '#ef4444' : '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(`${tempC.toFixed(1)}°C`, x - dW * 0.5 - 8, dY + 15);

  // Stirring RPM Display (Right)
  ctx.fillStyle = '#020617';
  ctx.fillRect(x + 8, dY, dW, dH);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(x + 8, dY, dW, dH);

  ctx.fillStyle = '#10b981';
  ctx.fillText('360 RPM', x + dW * 0.5 + 8, dY + 15);

  // Knobs
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(x - w * 0.38, dY + 11, 10, 0, Math.PI * 2);
  ctx.arc(x + w * 0.38, dY + 11, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 800 mL Pyrex Water Bath Beaker - Back Glass & Water Fill
 */
interface BeakerBackOptions {
  waterHeight: number;
  waterColor: string;
  timeSec: number;
}

function drawLaboratoryBeakerBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
  opts: BeakerBackOptions
) {
  const { waterHeight, waterColor, timeSec } = opts;
  const topY = baseY - h;
  const filletR = 16;

  ctx.save();

  // Closed path for beaker body interior
  const beakerInterior = new Path2D();
  beakerInterior.moveTo(x - w * 0.5 + 4, topY);
  beakerInterior.lineTo(x - w * 0.5 + 4, baseY - filletR);
  beakerInterior.quadraticCurveTo(x - w * 0.5 + 4, baseY - 3, x - w * 0.5 + filletR, baseY - 3);
  beakerInterior.lineTo(x + w * 0.5 - filletR, baseY - 3);
  beakerInterior.quadraticCurveTo(x + w * 0.5 - 4, baseY - 3, x + w * 0.5 - 4, baseY - filletR);
  beakerInterior.lineTo(x + w * 0.5 - 4, topY);
  beakerInterior.closePath();

  // Back glass gradient tint
  const glassBackGrad = ctx.createLinearGradient(x - w * 0.5, topY, x + w * 0.5, baseY);
  glassBackGrad.addColorStop(0, 'rgba(30, 58, 138, 0.12)');
  glassBackGrad.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
  ctx.fillStyle = glassBackGrad;
  ctx.fill(beakerInterior);

  // Water Fill clipped to beaker interior
  ctx.save();
  ctx.clip(beakerInterior);

  const waterGrad = ctx.createLinearGradient(0, baseY - waterHeight, 0, baseY);
  waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
  waterGrad.addColorStop(1, waterColor);
  ctx.fillStyle = waterGrad;
  ctx.fillRect(x - w * 0.5, baseY - waterHeight, w, waterHeight + 10);

  // Convective heat ripples in water
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const wy = baseY - 20 - i * 22;
    ctx.beginPath();
    for (let px = x - w * 0.44; px <= x + w * 0.44; px += 10) {
      const dy = Math.sin(px * 0.05 + timeSec * 3 + i) * 3;
      if (px === x - w * 0.44) ctx.moveTo(px, wy + dy);
      else ctx.lineTo(px, wy + dy);
    }
    ctx.stroke();
  }

  ctx.restore(); // end clip

  ctx.restore();
}

/**
 * 800 mL Pyrex Water Bath Beaker - Front Glass Outline, Spout & Graduations
 */
function drawLaboratoryBeakerFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
  _timeSec: number
) {
  const topY = baseY - h;
  const filletR = 16;

  ctx.save();

  // Beaker Glass Body Outline & Spout
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.88)';
  ctx.lineWidth = 2.4;

  ctx.beginPath();
  // Spout on left rim
  ctx.moveTo(x - w * 0.5 - 8, topY - 3);
  ctx.lineTo(x - w * 0.5, topY);
  ctx.lineTo(x - w * 0.5, baseY - filletR);
  ctx.quadraticCurveTo(x - w * 0.5, baseY, x - w * 0.5 + filletR, baseY);
  ctx.lineTo(x + w * 0.5 - filletR, baseY);
  ctx.quadraticCurveTo(x + w * 0.5, baseY, x + w * 0.5, baseY - filletR);
  ctx.lineTo(x + w * 0.5, topY);
  ctx.stroke();

  // Flared Top Rim Lip
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, topY, w * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Water level meniscus line on front wall
  const meniscusY = baseY - 110;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, meniscusY, w * 0.48, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Glass Specular Glint along Left Wall
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.45, topY + 10);
  ctx.lineTo(x - w * 0.45, baseY - filletR);
  ctx.stroke();

  // Enamel Graduations (200, 400, 600, 800 mL) & Pyrex badge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.2;
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';

  const beakerMarks = [
    { label: '200mL', y: baseY - h * 0.28 },
    { label: '400mL', y: baseY - h * 0.52 },
    { label: '600mL', y: baseY - h * 0.74 },
    { label: '800mL', y: baseY - h * 0.9 },
  ];

  beakerMarks.forEach(({ label, y }) => {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.48, y);
    ctx.lineTo(x - w * 0.48 + 14, y);
    ctx.stroke();
    ctx.fillText(label, x - w * 0.48 + 17, y + 3);
  });

  // White circular PYREX logo stamp on right side
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(x + w * 0.35, topY + 30, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Retort Stand & Clamp
 */
function drawRetortStandAndRod(
  ctx: CanvasRenderingContext2D,
  rodX: number,
  benchY: number,
  topY: number
) {
  ctx.save();

  // Cast iron stand base plate on bench
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.fillRect(rodX - 30, benchY - 8, 60, 8);
  ctx.strokeRect(rodX - 30, benchY - 8, 60, 8);

  // Vertical steel support rod
  const rodGrad = ctx.createLinearGradient(rodX - 4, 0, rodX + 4, 0);
  rodGrad.addColorStop(0, '#64748b');
  rodGrad.addColorStop(0.5, '#cbd5e1');
  rodGrad.addColorStop(1, '#475569');
  ctx.fillStyle = rodGrad;
  ctx.fillRect(rodX - 3.5, topY, 7, benchY - 8 - topY);

  ctx.restore();
}

function drawRetortStandClamp(
  ctx: CanvasRenderingContext2D,
  rodX: number,
  clampY: number,
  targetX: number
) {
  ctx.save();

  // Cast-iron Bosshead (clamp fastener on rod)
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(rodX - 8, clampY - 7, 16, 14, 3);
  ctx.fill();
  ctx.stroke();

  // Horizontal clamp arm extending to flask neck
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(rodX - 8, clampY);
  ctx.lineTo(targetX + 22, clampY);
  ctx.stroke();

  // 3-Prong Clamp grasping the neck
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(targetX - 24, clampY - 5, 48, 10, 4);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Insulated Ice Bath Tub (얼음물 수조)
 */
function drawIceBathTub(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
  timeSec: number
) {
  const topY = baseY - h;

  ctx.save();

  // Tub Body (Insulated Dark Blue / Slate)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, topY, w, h, [10, 10, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Grip Handles on sides
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - w * 0.5 - 8, topY + 25, 8, 20);
  ctx.fillRect(x + w * 0.5, topY + 25, 8, 20);

  // Ice-Water Slurry Fill
  const slurryGrad = ctx.createLinearGradient(0, topY + 12, 0, baseY);
  slurryGrad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
  slurryGrad.addColorStop(1, 'rgba(56, 189, 248, 0.48)');
  ctx.fillStyle = slurryGrad;
  ctx.fillRect(x - w * 0.48, topY + 12, w * 0.96, h - 16);

  // Water Slurry Surface Wave
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let px = x - w * 0.48; px <= x + w * 0.48; px += 8) {
    const wy = topY + 12 + Math.sin(px * 0.05 + timeSec * 2) * 2;
    if (px === x - w * 0.48) ctx.moveTo(px, wy);
    else ctx.lineTo(px, wy);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Standard 125 mL Pyrex Erlenmeyer Flask (삼각플라스크)
 * Physically accurate convex polygon contour with rounded corners, borosilicate glass refraction,
 * and strict interior clipping so needle crystals and liquids NEVER breach the glass perimeter!
 */
interface FlaskDrawOptions {
  liquidFraction?: number;
  liquidColor?: string;
  powderAmount?: number;
  showGraduations?: boolean;
  isStirring?: boolean;
  stirAngle?: number;
  hasFrost?: boolean;
  hasTar?: boolean;
  settledCakeHeight?: number;
  cakeColor?: string;
  needleBurstProgress?: number;
  needles?: NeedleCrystal[];
}

function drawErlenmeyerFlask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: FlaskDrawOptions = {}
) {
  const {
    liquidFraction = 0,
    liquidColor = 'rgba(254, 240, 138, 0.35)',
    powderAmount = 0,
    showGraduations = true,
    isStirring = false,
    stirAngle = 0,
    hasFrost = false,
    hasTar = false,
    settledCakeHeight = 0,
    cakeColor = '#ffffff',
    needleBurstProgress = 0,
    needles = [],
  } = opts;

  // Real Pyrex 125mL Dimensions
  const neckW = 36;
  const neckH = 46;
  const bodyH = 125;
  const baseW = 140;
  const filletR = 14;

  const halfNeck = neckW * 0.5;
  const halfBase = baseW * 0.5;
  const topY = y - neckH - bodyH * 0.5;
  const neckBottomY = topY + neckH;
  const baseY = y + bodyH * 0.5;

  ctx.save();

  // Glass Silhouette Path (Mathematically exact, convex, closed contour)
  const flaskPath = new Path2D();
  flaskPath.moveTo(x - halfNeck, topY);
  flaskPath.lineTo(x - halfNeck, neckBottomY);
  flaskPath.lineTo(x - halfBase, baseY - filletR);
  flaskPath.quadraticCurveTo(x - halfBase, baseY, x - halfBase + filletR, baseY);
  flaskPath.lineTo(x + halfBase - filletR, baseY);
  flaskPath.quadraticCurveTo(x + halfBase, baseY, x + halfBase, baseY - filletR);
  flaskPath.lineTo(x + halfNeck, neckBottomY);
  flaskPath.lineTo(x + halfNeck, topY);
  flaskPath.closePath();

  // 1. Refractive Glass Interior Tint (High-grade clear borosilicate)
  const glassTint = ctx.createLinearGradient(x - halfBase, topY, x + halfBase, baseY);
  glassTint.addColorStop(0, 'rgba(224, 242, 254, 0.10)');
  glassTint.addColorStop(0.5, 'rgba(186, 230, 253, 0.06)');
  glassTint.addColorStop(1, 'rgba(148, 163, 184, 0.12)');
  ctx.fillStyle = glassTint;
  ctx.fill(flaskPath);

  // STRICT CLIP: Any contents (powder, liquid, crystals, stir bar) are confined inside glass!
  ctx.save();
  ctx.clip(flaskPath);

  // 2. Powder mound at bottom if present (Stage 1)
  if (powderAmount > 0) {
    const moundH = 22 * powderAmount;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, baseY - 5, baseW * 0.35 * powderAmount, moundH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Settled crystal cake if present (Stage 5)
  if (settledCakeHeight > 0) {
    ctx.fillStyle = cakeColor;
    ctx.fillRect(x - halfBase, baseY - settledCakeHeight, baseW, settledCakeHeight);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = x - halfBase * 0.9; px <= x + halfBase * 0.9; px += 8) {
      const cy = baseY - settledCakeHeight + Math.sin(px * 0.4) * 2;
      ctx.lineTo(px, cy);
    }
    ctx.stroke();
  }

  // 4. Liquid fill
  if (liquidFraction > 0) {
    const totalFillH = bodyH * liquidFraction;
    const surfaceY = baseY - totalFillH;

    ctx.fillStyle = liquidColor;
    ctx.fillRect(x - halfBase, surfaceY, baseW, totalFillH + 10);

    // Liquid surface meniscus
    const currentBaseW = halfBase - (halfBase - halfNeck) * (totalFillH / bodyH);
    ctx.beginPath();
    if (isStirring) {
      ctx.moveTo(x - currentBaseW, surfaceY);
      ctx.quadraticCurveTo(x, surfaceY + 14, x + currentBaseW, surfaceY);
    } else {
      ctx.ellipse(x, surfaceY, currentBaseW, 5, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // Stir bar if stirring
    if (isStirring) {
      ctx.save();
      ctx.translate(x, baseY - 8);
      ctx.rotate(stirAngle);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-12, -4, 24, 8, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Needle crystal burst confined STRICTLY within liquid layer (Stage 4)
    if (needleBurstProgress > 0 && needles.length > 0) {
      drawInternalNeedleCrystalBurst(ctx, x, baseY - totalFillH * 0.5, needleBurstProgress, needles);
    }

    // Overheating tar residue
    if (hasTar) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x - halfBase * 0.85, surfaceY + 5, 14, totalFillH - 10);
      ctx.fillRect(x + halfBase * 0.85 - 14, surfaceY + 5, 14, totalFillH - 10);
    }
  }

  // Frost / condensation mist on cold outer glass (Stage 3, 4, 5)
  if (hasFrost) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x - halfBase, y - bodyH * 0.5, baseW, bodyH);
  }

  ctx.restore(); // end clip

  // 5. Outer Glass Walls (Crisp High-Contrast Borosilicate Line)
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.90)';
  ctx.lineWidth = 2.4;
  ctx.stroke(flaskPath);

  // Inner Wall Refraction Stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke(flaskPath);

  // Flared Top Rim Lip
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, topY, halfNeck + 4, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Glass Specular Glint along Left Wall
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - halfNeck * 0.85, topY + 6);
  ctx.lineTo(x - halfNeck * 0.85, neckBottomY);
  ctx.lineTo(x - halfBase * 0.88, baseY - filletR);
  ctx.stroke();

  // 6. Pyrex Enamel Graduations and Logo
  if (showGraduations) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const marks = [
      { label: '25ml', y: baseY - bodyH * 0.22 },
      { label: '50ml', y: baseY - bodyH * 0.42 },
      { label: '75ml', y: baseY - bodyH * 0.62 },
      { label: '100ml', y: baseY - bodyH * 0.82 },
    ];

    marks.forEach(({ label, y: my }) => {
      const currentHalfW = halfBase - (halfBase - halfNeck) * ((baseY - my) / bodyH);
      const startX = x - currentHalfW + 6;
      ctx.beginPath();
      ctx.moveTo(startX, my);
      ctx.lineTo(startX + 14, my);
      ctx.stroke();
      ctx.fillText(label, startX + 17, my + 3);
    });

    // Circular Pyrex white frosted logo badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x, baseY - bodyH * 0.52, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 6px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('PYREX', x, baseY - bodyH * 0.52 + 2);
  }

  ctx.restore();
}

/**
 * Needle crystal burst strictly drawn inside the flask liquid
 */
function drawInternalNeedleCrystalBurst(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  progress: number,
  needles: NeedleCrystal[]
) {
  ctx.save();
  ctx.translate(originX, originY);

  // Soft crystalline bloom
  const cloudRadius = progress * 55;
  const cloudGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, cloudRadius);
  cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
  cloudGrad.addColorStop(0.6, 'rgba(241, 245, 249, 0.55)');
  cloudGrad.addColorStop(1, 'rgba(241, 245, 249, 0.0)');
  ctx.fillStyle = cloudGrad;
  ctx.beginPath();
  ctx.arc(0, 0, cloudRadius, 0, Math.PI * 2);
  ctx.fill();

  // Needle crystals
  needles.forEach((n) => {
    if (progress < n.delay) return;
    const localP = (progress - n.delay) / (1 - n.delay);
    const growth = Math.sqrt(localP);
    const currentLen = n.length * growth;

    const nx1 = n.x;
    const ny1 = n.y;
    const nx2 = n.x + Math.cos(n.angle) * currentLen;
    const ny2 = n.y + Math.sin(n.angle) * currentLen;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = n.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nx1, ny1);
    ctx.lineTo(nx2, ny2);
    ctx.stroke();

    // Secondary perpendicular facet line
    if (localP > 0.6) {
      const branchLen = currentLen * 0.35;
      const bAngle = n.angle + Math.PI * 0.35;
      ctx.lineWidth = n.thickness * 0.7;
      ctx.beginPath();
      ctx.moveTo(nx2, ny2);
      ctx.lineTo(nx2 + Math.cos(bAngle) * branchLen, ny2 + Math.sin(bAngle) * branchLen);
      ctx.stroke();
    }
  });

  ctx.restore();
}

/**
 * Heavy-Wall Side-Arm Filter Flask (Stage 6)
 */
function drawFilterFlaskBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  h: number,
  t: number
) {
  const neckY = baseY - h;
  const neckW = 44;
  const baseW = 150;
  const filletR = 14;

  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.90)';
  ctx.lineWidth = 2.6;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';

  // Closed Path for Side-Arm Flask
  const flaskPath = new Path2D();
  flaskPath.moveTo(x - neckW * 0.5, neckY);
  flaskPath.lineTo(x - neckW * 0.5, neckY + 30);
  flaskPath.lineTo(x - baseW * 0.5, baseY - filletR);
  flaskPath.quadraticCurveTo(x - baseW * 0.5, baseY, x - baseW * 0.5 + filletR, baseY);
  flaskPath.lineTo(x + baseW * 0.5 - filletR, baseY);
  flaskPath.quadraticCurveTo(x + baseW * 0.5, baseY, x + baseW * 0.5, baseY - filletR);
  flaskPath.lineTo(x + neckW * 0.5, neckY + 30);

  // Side-arm branch on right neck
  flaskPath.lineTo(x + neckW * 0.5, neckY + 28);
  flaskPath.lineTo(x + neckW * 0.5 + 16, neckY + 28);
  flaskPath.lineTo(x + neckW * 0.5 + 16, neckY + 20);
  flaskPath.lineTo(x + neckW * 0.5, neckY + 20);
  flaskPath.lineTo(x + neckW * 0.5, neckY);
  flaskPath.closePath();

  ctx.fill(flaskPath);
  ctx.stroke(flaskPath);

  // Filtrate Liquid collecting inside bottom (clipped to flask interior)
  ctx.save();
  ctx.clip(flaskPath);

  const filtrateH = 25 + Math.min(30, t * 30);
  const filtrateGrad = ctx.createLinearGradient(0, baseY - filtrateH, 0, baseY);
  filtrateGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
  filtrateGrad.addColorStop(1, 'rgba(217, 119, 6, 0.45)');
  ctx.fillStyle = filtrateGrad;
  ctx.fillRect(x - baseW * 0.5, baseY - filtrateH, baseW, filtrateH + 5);

  ctx.restore(); // end clip

  // Specular reflection highlight on left
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - neckW * 0.4, neckY + 5);
  ctx.lineTo(x - neckW * 0.4, neckY + 30);
  ctx.lineTo(x - baseW * 0.42, baseY - filletR);
  ctx.stroke();

  ctx.restore();
}

/**
 * Porcelain Büchner Funnel (Stage 6)
 */
function drawBuchnerFunnel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  failureMode: FailureMode
) {
  const isWarmWash = failureMode === 'WARM_WASH';

  ctx.save();

  // 1. Porcelain Stem entering flask neck
  const stemGrad = ctx.createLinearGradient(x - 6, y, x + 6, y);
  stemGrad.addColorStop(0, '#cbd5e1');
  stemGrad.addColorStop(0.3, '#f8fafc');
  stemGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = stemGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(x - 6, y, 12, 42);
  ctx.fill();
  ctx.stroke();

  // Stem beveled tip
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 42);
  ctx.lineTo(x + 6, y + 36);
  ctx.strokeStyle = '#94a3b8';
  ctx.stroke();

  // 2. Porcelain Funnel Bowl Body (Conical base + Cylindrical top)
  const bowlGrad = ctx.createLinearGradient(x - 50, y - 65, x + 50, y - 65);
  bowlGrad.addColorStop(0, '#e2e8f0');
  bowlGrad.addColorStop(0.4, '#ffffff');
  bowlGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = bowlGrad;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;

  ctx.beginPath();
  // Cylindrical top bowl
  ctx.moveTo(x - 48, y - 65);
  ctx.lineTo(x - 48, y - 28);
  // Conical transition to stem
  ctx.lineTo(x - 6, y);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x + 48, y - 28);
  ctx.lineTo(x + 48, y - 65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Flared Porcelain Top Rim
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(x, y - 65, 48, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Perforated Plate & Circular Filter Paper
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - 28, 45, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Filter paper perforations
  ctx.fillStyle = '#64748b';
  for (let px = -32; px <= 32; px += 8) {
    ctx.beginPath();
    ctx.arc(x + px, y - 28, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Pure Aspirin Crystal Precipitate Cake
  let cakeThickness = 14;
  if (isWarmWash && t > 0.4) {
    cakeThickness = Math.max(3, 14 - (t - 0.4) * 22);
  }

  const cakeY = y - 28 - cakeThickness;
  const cakeGrad = ctx.createLinearGradient(0, cakeY, 0, y - 28);
  if (failureMode === 'OVERHEATING') {
    cakeGrad.addColorStop(0, '#78350f');
    cakeGrad.addColorStop(1, '#451a03');
  } else {
    cakeGrad.addColorStop(0, '#ffffff');
    cakeGrad.addColorStop(0.7, '#f8fafc');
    cakeGrad.addColorStop(1, '#e2e8f0');
  }
  ctx.fillStyle = cakeGrad;
  ctx.strokeStyle = failureMode === 'OVERHEATING' ? '#92400e' : '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - 43, cakeY, 86, cakeThickness, [3, 3, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Micro crystalline facet glints on top of cake
  if (failureMode !== 'OVERHEATING') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 6; i++) {
      const gx = x - 32 + i * 12;
      const gy = cakeY + 3 + (i % 2) * 3;
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }

  ctx.restore();
}

// ----------------------------------------------------------------------------
// AUXILIARY VISUAL ELEMENTS
// ----------------------------------------------------------------------------

function drawIceCubes(ctx: CanvasRenderingContext2D, cubes: IceCube[], timeSec: number) {
  cubes.forEach((c, idx) => {
    ctx.save();
    const bob = Math.sin(timeSec * 2 + idx) * 3;
    ctx.translate(c.x, c.y + bob);
    ctx.rotate(c.angle);

    ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    c.points.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (c.points.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(c.points[0][0], c.points[0][1]);
      ctx.lineTo(c.points[3][0], c.points[3][1]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawThermometer(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  height: number,
  tempC: number,
  maxTemp: number
) {
  ctx.save();

  // Glass Sheath
  ctx.fillStyle = 'rgba(224, 242, 254, 0.25)';
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 4, topY, 8, height - 12, [4, 4, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Mercury/Spirit Bulb
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
  ctx.beginPath();
  ctx.arc(x, topY + height - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Red Spirit Column
  const safeTemp = Math.max(0, Math.min(maxTemp, tempC));
  const columnH = (safeTemp / maxTemp) * (height - 24);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - 1.5, topY + height - 12 - columnH, 3, columnH);

  // Digital Temperature Badge on side
  const badgeW = 42;
  const badgeX = x < 0 ? x - badgeW - 8 : x + 8;
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, topY + height * 0.25, badgeW, 18, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.fillText(`${tempC.toFixed(0)}°C`, badgeX + badgeW * 0.5, topY + height * 0.25 + 12);

  ctx.restore();
}

function drawSteamWisps(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spread: number,
  timeSec: number,
  isOverheating: boolean
) {
  ctx.save();
  const steamCount = isOverheating ? 14 : 7;
  for (let i = 0; i < steamCount; i++) {
    const phase = (timeSec * (isOverheating ? 1.4 : 0.8) + i / steamCount) % 1.0;
    const sy = y - phase * 85;
    const sx = x - spread * 0.4 + ((i * 37) % spread) + Math.sin(phase * Math.PI * 2 + i) * 12;
    const alpha = Math.sin(phase * Math.PI) * (isOverheating ? 0.45 : 0.25);
    const size = 8 + phase * 18;

    ctx.fillStyle = isOverheating ? `rgba(180, 83, 9, ${alpha})` : `rgba(241, 245, 249, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFizzingBubbles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  timeSec: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const bx = x + Math.sin(i * 3 + timeSec * 5) * radius * 0.8;
    const by = y - ((timeSec * 80 + i * 15) % 40);
    const r = 1.5 + (i % 3);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlintSparkles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spreadW: number,
  spreadH: number,
  timeSec: number
) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const pulse = (Math.sin(timeSec * 4 + i * 2) + 1) * 0.5;
    if (pulse < 0.2) continue;
    const gx = x - spreadW * 0.5 + ((i * 29 + 13) % spreadW);
    const gy = y - spreadH * 0.5 + ((i * 17 + 7) % spreadH);

    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.9})`;
    ctx.beginPath();
    const r1 = 4 * pulse;
    const r2 = 1.2 * pulse;
    ctx.moveTo(gx, gy - r1);
    ctx.lineTo(gx + r2, gy - r2);
    ctx.lineTo(gx + r1, gy);
    ctx.lineTo(gx + r2, gy + r2);
    ctx.lineTo(gx, gy + r1);
    ctx.lineTo(gx - r2, gy + r2);
    ctx.lineTo(gx - r1, gy);
    ctx.lineTo(gx - r2, gy - r2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// SLEEK MODERN HUD OVERLAY (Minimal, Non-Intrusive, Glassmorphic Pills)
// ============================================================================

function renderModernHudOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  stage: SynthesisStageId,
  progress: number,
  failureMode: FailureMode
) {
  ctx.save();

  const stageTitles: Record<SynthesisStageId, string> = {
    1: 'Step 1: 시약 투입 및 촉매 혼합',
    2: 'Step 2: 물중탕 가열 에스테르화',
    3: 'Step 3: 얼음물 1차 냉각 (준안정)',
    4: 'Step 4: 증류수 주입 반용매 핵생성',
    5: 'Step 5: 결정 숙성 (Ostwald Ripening)',
    6: 'Step 6: 감압 여과 및 세척',
  };

  const pillH = 26;
  const pillY = 12;

  // 1. Top-Left Minimal Stage Pill
  const titleText = stageTitles[stage];
  ctx.font = 'bold 11px "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  const textW = ctx.measureText(titleText).width;
  const pillW = Math.min(w * 0.55, textW + 28);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(12, pillY, pillW, pillH, 13);
  ctx.fill();
  ctx.stroke();

  // Status Indicator Dot
  ctx.beginPath();
  ctx.arc(23, pillY + 13, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = failureMode !== 'NONE' ? '#ef4444' : '#06b6d4';
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.fillText(titleText, 32, pillY + 17);

  // 2. Top-Right 60 FPS Loop Meter Pill
  const loopW = 105;
  const loopX = w - loopW - 12;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(loopX, pillY, loopW, pillH, 13);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('60FPS', loopX + 10, pillY + 16);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(progress * 100)}%`, loopX + loopW - 12, pillY + 16);

  // 3. Optional Failure Warning Pill (positioned right under stage pill if active)
  if (failureMode !== 'NONE') {
    const failureLabels: Record<FailureMode, string> = {
      NONE: '',
      EARLY_WATER: '⚠️ 조기 수분 혼입 (수득률 0%)',
      OVERHEATING: '⚠️ 85°C 과열 타르 형성',
      WARM_WASH: '⚠️ 미지근한 물 세척 손실',
    };
    const failText = failureLabels[failureMode];
    ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
    const failW = ctx.measureText(failText).width + 16;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.90)';
    ctx.beginPath();
    ctx.roundRect(12, pillY + pillH + 6, failW, 20, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(failText, 20, pillY + pillH + 20);
  }

  ctx.restore();
}

function getStageDescription(stage: SynthesisStageId, mode: FailureMode): string {
  if (mode === 'EARLY_WATER') return '조기 수분 혼입으로 인한 사전 가수분해 실패 상태';
  if (mode === 'OVERHEATING') return '고온 과열로 인한 타르 탄화 실패 상태';
  if (mode === 'WARM_WASH') return '미지근한 세척수로 인한 아스피린 재용해 손실 실패 상태';

  switch (stage) {
    case 1:
      return '전자저울 위 삼각플라스크에 살리실산 분말 투입, 무수아세트산 주입 및 인산 촉매 적하';
    case 2:
      return '80°C 물중탕 비커 속 삼각플라스크 가열 및 마그네틱 교반 반응 진행';
    case 3:
      return '얼음물 냉각 중 준안정 상태 (아세트산 공용매로 결정 미석출)';
    case 4:
      return '증류수 급속 주입 및 유전율 급상승으로 인한 침상 결정 폭발적 석출';
    case 5:
      return '얼음물 속 결정 숙성 및 순수 침상 결정 퇴적';
    case 6:
      return '감압 뷰흐너 깔때기 흡인 여과 및 빙냉 증류수 세척';
  }
}

export default MacroApparatusView;
