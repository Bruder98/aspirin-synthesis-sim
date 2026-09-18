/**
 * MicroMolecularView.tsx
 * Three.js 3D WebGL Molecular Dynamics Viewport with Real-Time Chemical Mechanism Kinetics & Molecule Labels
 *
 * Key Capabilities:
 *  1. 3D-to-2D Projected Molecule Identification Badges (Pin Tags) tracking active chemical species in real-time.
 *  2. High-fidelity 6-Stage Organic Chemistry Reaction Kinematics:
 *     - Stage 1: Proton transfer arc from H3PO4 to acetic anhydride carbonyl oxygen + oxonium pulse + electrophilic carbon target ring.
 *     - Stage 2: Curved electron arrow mechanism, nucleophilic attack, sp3 tetrahedral intermediate docking, acetoxy cleavage & acetic acid departure.
 *     - Stage 3: Central aspirin enclosed in 10-AcOH organic solvation cage (εr≈6.2), steric repulsion bouncing approaching molecules (MZW).
 *     - Stage 4: Polar water (εr≈80) antisolvent shock, solvation shell stripping, hydrophobic collapse, carboxylic acid dimer H-bonds & CNT shockwave.
 *     - Stage 5: Monoclinic Form I P2_1/c crystal lattice with free dimer adsorbing onto [001] face (Ostwald ripening).
 *     - Stage 6: Insoluble crystal cake preserved while mobile water and acetic acid/phosphoric acid byproducts elute downward through pores.
 *  3. Live Reaction Mechanism Subtitle Bar providing instantaneous Korean narration of the molecular event.
 *  4. High-DPI Canvas scaling, Ball & Stick vs Space-Filling toggles, Camera Reset, and WebGL cleanup.
 *
 * References: SPEC-UI-3D-PEDAGOGY-001 Section 3, PROJECT.md
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAspirinStore } from '../../store/useAspirinStore';
import { SynthesisStageId, FailureMode } from '../../engine/types';
import { playClickSound } from '../../utils/audioSynthesizer';
import {
  SALICYLIC_ACID_3D,
  ACETIC_ANHYDRIDE_3D,
  PHOSPHORIC_ACID_3D,
  ASPIRIN_3D,
  ACETIC_ACID_3D,
  WATER_3D,
  ASPIRIN_DIMER_3D,
  TETRAHEDRAL_INTERMEDIATE_3D,
  CPK_COLORS,
} from '../../engine/molecularData';

interface MicroMolecularViewProps {
  className?: string;
}

// Projected 2D Label Interface for 3D Molecule Tracking
interface ProjectedLabel {
  id: string;
  name: string;
  formula?: string;
  role: string;
  badgeStyle: string;
  roleStyle: string;
  dotStyle: string;
  screenX: number;
  screenY: number;
  visible: boolean;
}

// Check if WebGL is supported in current browser environment
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl') ||
        canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

export const MicroMolecularView: React.FC<MicroMolecularViewProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zustand subscriptions
  const currentStage = useAspirinStore((s) => s.currentStage);
  const isPlaying = useAspirinStore((s) => s.isPlaying);
  const stageProgress = useAspirinStore((s) => s.stageProgress);
  const playbackSpeed = useAspirinStore((s) => s.playbackSpeed);
  const failureMode = useAspirinStore((s) => s.failureMode);

  // UI state
  const [renderMode, setRenderMode] = useState<'BALL_AND_STICK' | 'SPACE_FILLING'>('BALL_AND_STICK');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  // Mutable refs to keep state accessible inside RAF loop without stale closures
  const renderModeRef = useRef(renderMode);
  renderModeRef.current = renderMode;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;

  // Three.js instances ref
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    moleculeGroup: THREE.Group | null;
    haloLight: THREE.PointLight | null;
    animFrameId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    moleculeGroup: null,
    haloLight: null,
    animFrameId: null,
  });

  // Check WebGL on mount
  useEffect(() => {
    setIsSupported(isWebGLAvailable());
  }, []);

  // Reset Camera Helper
  const handleResetCamera = useCallback(() => {
    playClickSound();
    const { camera, controls } = threeRef.current;
    if (camera && controls) {
      camera.position.set(0, 2, 14);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, []);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    if (!isSupported) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    // 2. Camera Setup
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 14);

    // 3. Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    } catch {
      setIsSupported(false);
      return;
    }

    // 4. OrbitControls
    let controls: OrbitControls | null = null;
    try {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 3;
      controls.maxDistance = 35;
      controls.maxPolarAngle = Math.PI * 0.95;
      controls.minPolarAngle = 0.05;
    } catch {
      controls = null;
    }

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(10, 15, 10);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    const haloLight = new THREE.PointLight(0x00f0ff, 0, 12);
    scene.add(haloLight);

    // 6. Master Molecule Group
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    threeRef.current = {
      renderer,
      scene,
      camera,
      controls,
      moleculeGroup,
      haloLight,
      animFrameId: null,
    };

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Animation & Render Loop
    let lastTime = performance.now();
    let localTime = 0;
    let localProgress = useAspirinStore.getState().stageProgress;
    let lastProgressSyncTime = performance.now();
    let lastLabelUpdateTime = 0;
    let prevStage = useAspirinStore.getState().currentStage;

    const animate = (now: number) => {
      const store = useAspirinStore.getState();
      const liveStage = store.currentStage;
      const storeProgress = store.stageProgress;
      const liveSpeed = store.playbackSpeed;
      const liveFailure = store.failureMode;
      const liveIsPlaying = store.isPlaying;
      const liveRenderMode = renderModeRef.current;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Handle stage transition reset
      if (prevStage !== liveStage) {
        prevStage = liveStage;
        localProgress = 0.0;
      }

      if (liveIsPlaying) {
        localTime += dt * liveSpeed;
        const cycleDuration = 4.0;
        const deltaProgress = (dt * liveSpeed) / cycleDuration;
        localProgress = (localProgress + deltaProgress) % 1.0;

        // If external scrubber drag or reset occurred, resync immediately
        if (Math.abs(storeProgress - localProgress) > 0.05) {
          localProgress = storeProgress;
        }

        // Throttle store sync every ~100ms when running in standalone MICRO mode
        if (now - lastProgressSyncTime >= 100) {
          lastProgressSyncTime = now;
          store.setStageProgress(localProgress);
        }
      } else {
        localProgress = storeProgress;
      }

      if (controls) {
        controls.update();
      }

      // Update kinetic motion within moleculeGroup based on smooth localProgress & time
      updateMolecularKinetics(
        moleculeGroup,
        haloLight,
        liveStage,
        localProgress,
        localTime,
        liveFailure,
        liveRenderMode
      );

      // Compute and update projected 2D molecule labels at ~30Hz (every 33ms)
      if (showLabelsRef.current && now - lastLabelUpdateTime >= 33) {
        lastLabelUpdateTime = now;
        const w = container.clientWidth || 640;
        const h = container.clientHeight || 480;
        const computed = computeProjectedLabels(moleculeGroup, camera, w, h, liveStage, localProgress, liveFailure);
        setProjectedLabels(computed);
      } else if (!showLabelsRef.current && projectedLabels.length > 0) {
        setProjectedLabels([]);
      }

      renderer.render(scene, camera);
      threeRef.current.animFrameId = requestAnimationFrame(animate);
    };

    threeRef.current.animFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount or re-init
    return () => {
      resizeObserver.disconnect();
      if (threeRef.current.animFrameId !== null) {
        cancelAnimationFrame(threeRef.current.animFrameId);
      }
      if (controls) {
        controls.dispose();
      }
      disposeHierarchy(scene);
      renderer.dispose();
      threeRef.current = {
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        moleculeGroup: null,
        haloLight: null,
        animFrameId: null,
      };
    };
  }, [isSupported]);

  // Rebuild 3D Molecular Topologies when Stage, RenderMode, or FailureMode changes
  useEffect(() => {
    const { scene, moleculeGroup } = threeRef.current;
    if (!scene || !moleculeGroup) return;

    // Dispose old children
    while (moleculeGroup.children.length > 0) {
      const child = moleculeGroup.children[0];
      moleculeGroup.remove(child);
      disposeHierarchy(child);
    }

    // Build new stage geometry
    buildStageMolecularScene(moleculeGroup, currentStage, failureMode, renderMode);
  }, [currentStage, failureMode, renderMode]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[360px] flex flex-col bg-lab-950 overflow-hidden select-none ${className}`}
      data-testid="micro-molecular-viewport"
    >
      {isSupported ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />
      ) : (
        /* Fallback Container for environments without WebGL (e.g. headless jsdom) */
        <div
          className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-lab-900 border border-slate-800"
          data-testid="micro-molecular-fallback"
        >
          <div className="w-12 h-12 rounded-full border border-chem-cyan/30 bg-chem-cyan/10 flex items-center justify-center text-chem-cyan mb-3">
            ⚛
          </div>
          <h3 className="text-lg font-bold text-white mb-1">3D Molecular Kinetics Engine</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            WebGL Context Simulator: Stage {currentStage} Active.
            {failureMode !== 'NONE' ? ` [Failure Branch: ${failureMode}]` : ''}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-left bg-lab-950 p-3 rounded border border-slate-800 w-full max-w-xs">
            <div>Stage: <span className="text-chem-cyan">{currentStage}/6</span></div>
            <div>Progress: <span className="text-chem-water">{(stageProgress * 100).toFixed(0)}%</span></div>
            <div>Loop: <span className={isPlaying ? 'text-emerald-400' : 'text-amber-400'}>{isPlaying ? 'PLAYING' : 'PAUSED'}</span></div>
            <div>Speed: <span className="text-slate-200">{playbackSpeed}x</span></div>
          </div>
        </div>
      )}

      {/* Floating 3D Molecular Controls & CPK Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
        {/* Stage Status Badge */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chem-cyan animate-pulse" />
            <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">
              3D MOLECULAR DYNAMICS
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
            {getMicroStageTitle(currentStage, failureMode)}
          </div>
        </div>

        {/* CPK Color Legend */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-md text-[10px] font-mono text-slate-300 flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#334155] border border-slate-500" />
            <span>C</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F8FAFC] border border-slate-400" />
            <span>H</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>O</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>P</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]" />
            <span>H+</span>
          </div>
        </div>
      </div>

      {/* Top Right Controls: Labels Toggle, Render Mode & Reset Camera */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setShowLabels((v) => !v);
          }}
          className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors shadow cursor-pointer ${
            showLabels
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-400'
          }`}
          title="분자 식별 라벨 토글 (Toggle Molecule Tags)"
          data-testid="toggle-molecule-labels-btn"
        >
          🏷️ {showLabels ? '라벨 ON' : '라벨 OFF'}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setRenderMode((m) => (m === 'BALL_AND_STICK' ? 'SPACE_FILLING' : 'BALL_AND_STICK'));
          }}
          className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors shadow cursor-pointer"
          title="Toggle Molecular Representation"
        >
          {renderMode === 'BALL_AND_STICK' ? '⚛ Ball & Stick' : '● Space-Filling'}
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          className="px-2 py-1 text-[11px] font-mono rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors shadow cursor-pointer"
          title="Reset 3D Orbit Camera"
        >
          ⟲ Reset Cam
        </button>
      </div>

      {/* Real-time 3D-to-2D Projected Molecule Identification Badges */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {projectedLabels.map((lbl) => (
            <div
              key={lbl.id}
              style={{
                transform: `translate3d(${lbl.screenX}px, ${lbl.screenY}px, 0)`,
                opacity: lbl.visible ? 1 : 0,
              }}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full transition-opacity duration-150 pointer-events-none"
            >
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border backdrop-blur-md shadow-lg flex items-center gap-1.5 whitespace-nowrap ${lbl.badgeStyle}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lbl.dotStyle}`} />
                <span className="text-white font-bold">{lbl.name}</span>
                {lbl.formula && (
                  <span className="text-slate-400 text-[9px] font-normal">{lbl.formula}</span>
                )}
                <span
                  className={`px-1 py-0.2 rounded text-[8px] font-mono uppercase tracking-wider font-semibold ${lbl.roleStyle}`}
                >
                  {lbl.role}
                </span>
              </div>
              {/* Connector Pin Line */}
              <div className="w-0.5 h-2 bg-cyan-400/50 mx-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Live Reaction Mechanism Subtitle Bar */}
      <div className="absolute bottom-2 left-3 right-3 sm:right-64 z-10 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-lg px-2.5 py-1.5 shadow-xl flex items-center gap-2 pointer-events-auto max-w-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold mr-1.5 uppercase tracking-wider">
              [실시간 화학 메커니즘]
            </span>
            <span className="text-[11px] text-slate-200 font-sans leading-tight">
              {getLiveReactionSubtitle(currentStage, stageProgress, failureMode)}
            </span>
          </div>
        </div>
      </div>

      {/* OrbitControls Hint */}
      <div className="absolute bottom-2 right-3 z-10 text-[10px] font-mono text-slate-500/80 pointer-events-none hidden sm:block">
        Rotate: Left-Drag • Zoom: Wheel • Pan: Right-Drag
      </div>
    </div>
  );
};

// ============================================================================
// 3D-TO-2D PROJECTION ENGINE FOR DYNAMIC MOLECULE IDENTIFIERS
// ============================================================================

function computeProjectedLabels(
  parent: THREE.Group,
  camera: THREE.PerspectiveCamera,
  w: number,
  h: number,
  stage: SynthesisStageId,
  t: number,
  failureMode: FailureMode
): ProjectedLabel[] {
  const labels: ProjectedLabel[] = [];

  const addLabel = (
    obj: THREE.Object3D | null | undefined,
    id: string,
    name: string,
    formula: string | undefined,
    role: string,
    badgeStyle: string,
    roleStyle: string,
    dotStyle: string,
    yOffset: number = 1.3
  ) => {
    if (!obj || !obj.visible) return;
    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    worldPos.y += yOffset;
    worldPos.project(camera);

    // Filter points behind camera or far off screen
    if (
      worldPos.z < 1.0 &&
      worldPos.x >= -1.15 &&
      worldPos.x <= 1.15 &&
      worldPos.y >= -1.15 &&
      worldPos.y <= 1.15
    ) {
      const screenX = ((worldPos.x + 1) * 0.5) * w;
      const screenY = ((-worldPos.y + 1) * 0.5) * h;
      labels.push({
        id,
        name,
        formula,
        role,
        badgeStyle,
        roleStyle,
        dotStyle,
        screenX: Math.round(screenX),
        screenY: Math.round(screenY),
        visible: true,
      });
    }
  };

  switch (stage) {
    case 1: {
      const sa = parent.getObjectByName('mol_SA');
      addLabel(
        sa,
        'sa',
        '살리실산',
        'C₇H₆O₃',
        '친핵체 (-OH기 대기)',
        'border-cyan-500/40 bg-slate-950/90 text-cyan-200',
        'bg-cyan-500/20 text-cyan-300',
        'bg-cyan-400'
      );

      const aa = parent.getObjectByName('mol_AA');
      addLabel(
        aa,
        'aa',
        '무수아세트산',
        'C₄H₆O₃',
        t >= 0.7 ? '양성자화 (친전자체 활성화)' : '반응 기질 (친전자체)',
        t >= 0.7
          ? 'border-amber-500/50 bg-amber-950/90 text-amber-200'
          : 'border-slate-700 bg-slate-900/90 text-slate-200',
        t >= 0.7 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300',
        t >= 0.7 ? 'bg-amber-400' : 'bg-slate-400'
      );

      const proton = parent.getObjectByName('proton_transfer');
      addLabel(
        proton,
        'h_plus',
        '촉매 H⁺',
        '양성자',
        t >= 0.7 ? '카보닐 산소 결합' : '카보닐 산소로 이동',
        'border-cyan-400 bg-cyan-950/90 text-white',
        'bg-cyan-400/30 text-cyan-200',
        'bg-cyan-300 animate-ping',
        0.5
      );

      const pa = parent.getObjectByName('mol_PA');
      addLabel(
        pa,
        'pa',
        '인산 촉매',
        'H₃PO₄',
        'H⁺ 공여체',
        'border-amber-600/40 bg-slate-900/90 text-amber-300',
        'bg-amber-950/50 text-amber-400',
        'bg-amber-500',
        1.1
      );
      break;
    }

    case 2: {
      if (failureMode === 'OVERHEATING') {
        const tar = parent.getObjectByName('mol_tar');
        addLabel(
          tar,
          'tar',
          '고온 열분해 타르 (Tar)',
          '비가역 고분자',
          '>85°C 자기축합 (수득률 12.5%)',
          'border-rose-500/50 bg-rose-950/90 text-rose-200',
          'bg-rose-500/20 text-rose-300',
          'bg-rose-400',
          1.8
        );
        break;
      }

      if (t < 0.38) {
        const sa = parent.getObjectByName('react_SA');
        addLabel(
          sa,
          'sa2',
          '살리실산',
          'C₇H₆O₃',
          '페놀성 -OH 친핵 공격',
          'border-cyan-500/40 bg-slate-950/90 text-cyan-200',
          'bg-cyan-500/20 text-cyan-300',
          'bg-cyan-400'
        );

        const aa = parent.getObjectByName('react_AA');
        addLabel(
          aa,
          'aa2',
          '무수아세트산',
          '[C₄H₇O₃]⁺',
          '친전자체 (C=O 활성화)',
          'border-amber-500/40 bg-slate-950/90 text-amber-200',
          'bg-amber-500/20 text-amber-300',
          'bg-amber-400'
        );
      } else if (t < 0.65) {
        const tet = parent.getObjectByName('mol_tetrahedral');
        addLabel(
          tet,
          'tet',
          'sp³ 사면체 중간체',
          '[C₁₁H₁₃O₆]⁺',
          '공유결합 사면체 전이 상태',
          'border-purple-500/50 bg-purple-950/90 text-purple-200',
          'bg-purple-500/20 text-purple-300',
          'bg-purple-400 animate-pulse',
          1.6
        );
      } else {
        const asa = parent.getObjectByName('prod_ASA');
        addLabel(
          asa,
          'asa2',
          '아스피린 (아세틸살리실산)',
          'C₉H₈O₄',
          '에스테르화 완결 (생성물)',
          'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
          'bg-emerald-500/20 text-emerald-300',
          'bg-emerald-400'
        );

        const acoh = parent.getObjectByName('prod_AcOH');
        addLabel(
          acoh,
          'acoh2',
          '아세트산',
          'CH₃COOH',
          '이탈기 탈리 (부산물)',
          'border-amber-500/40 bg-slate-950/90 text-amber-200',
          'bg-amber-500/20 text-amber-300',
          'bg-amber-400'
        );

        const regenH = parent.getObjectByName('regen_H');
        addLabel(
          regenH,
          'regen_h',
          '재생된 H⁺',
          '촉매',
          '다음 사이클 복귀',
          'border-cyan-400 bg-cyan-950/90 text-cyan-200',
          'bg-cyan-500/20 text-cyan-300',
          'bg-cyan-400',
          0.4
        );
      }
      break;
    }

    case 3: {
      const central = parent.getObjectByName('central_aspirin');
      addLabel(
        central,
        'central_asp',
        '아스피린 분자',
        'C₉H₈O₄',
        '용질 (비극성 벤젠 고리)',
        'border-cyan-500/40 bg-slate-950/90 text-cyan-200',
        'bg-cyan-500/20 text-cyan-300',
        'bg-cyan-400'
      );

      const shell = parent.getObjectByName('solvation_shell');
      addLabel(
        shell,
        'solv_shell',
        '아세트산 공용매 껍질',
        '10 × CH₃COOH',
        '유기 케이지 (εᵣ≈6.2)',
        'border-amber-500/40 bg-slate-950/90 text-amber-200',
        'bg-amber-500/20 text-amber-300',
        'bg-amber-400',
        3.2
      );

      const bouncing = parent.getObjectByName('bouncing_aspirin');
      addLabel(
        bouncing,
        'bounce_asp',
        '접근하는 아스피린',
        'C₉H₈O₄',
        '케이지에 반발 튕김 (MZW 무석출)',
        'border-rose-500/40 bg-slate-950/90 text-rose-200',
        'bg-rose-500/20 text-rose-300',
        'bg-rose-400',
        1.2
      );
      break;
    }

    case 4: {
      const asp0 = parent.getObjectByName('asp_cluster_0');
      addLabel(
        asp0,
        'asp_cluster',
        '아스피린 카복실산 다이머',
        '(C₉H₈O₄)₂ R₂²(8)',
        t >= 0.35 ? '단사정계 침상핵 폭발적 자가조립' : '소수성 붕괴 시작',
        'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
        'bg-emerald-500/20 text-emerald-300',
        'bg-emerald-400',
        1.4
      );

      const w0 = parent.getObjectByName('water_0');
      addLabel(
        w0,
        'water_ant',
        '증류수 (반용매)',
        'H₂O (εᵣ≈80)',
        '아세트산 껍질 박리 & 용해도 급감',
        'border-sky-500/40 bg-slate-950/90 text-sky-200',
        'bg-sky-500/20 text-sky-300',
        'bg-sky-400',
        0.8
      );
      break;
    }

    case 5: {
      if (failureMode === 'EARLY_WATER') {
        const saUn = parent.getObjectByName('unreacted_SA');
        addLabel(
          saUn,
          'un_sa',
          '미반응 살리실산',
          'C₇H₆O₃',
          '무수물 가수분해로 합성 실패',
          'border-rose-500/40 bg-slate-950/90 text-rose-200',
          'bg-rose-500/20 text-rose-300',
          'bg-rose-400',
          1.4
        );
        break;
      }

      const lat = parent.getObjectByName('crystal_lattice');
      addLabel(
        lat,
        'cryst_lat',
        '단사정계(P2₁/c) 결정 격자',
        'Form I Crystal',
        '치밀한 3D 수소결합 네트워크',
        'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
        'bg-emerald-500/20 text-emerald-300',
        'bg-emerald-400',
        3.6
      );

      const freeD = parent.getObjectByName('free_dimer_adsorbing');
      addLabel(
        freeD,
        'adsorb_dimer',
        '흡착 성장하는 다이머',
        '(C₉H₈O₄)₂',
        '오스트발트 숙성 (성장면 흡착)',
        'border-cyan-500/40 bg-slate-950/90 text-cyan-200',
        'bg-cyan-500/20 text-cyan-300',
        'bg-cyan-400',
        1.2
      );
      break;
    }

    case 6: {
      const cake = parent.getObjectByName('filter_cake_lattice');
      addLabel(
        cake,
        'filter_cake',
        '다공성 아스피린 결정 케이크',
        '순수 결정 보존',
        '빙냉수 불용성 (0.08g/100mL)',
        'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
        'bg-emerald-500/20 text-emerald-300',
        'bg-emerald-400',
        3.4
      );

      const pw0 = parent.getObjectByName('pore_water_0');
      addLabel(
        pw0,
        'pore_w',
        '빙냉 세척수 (0°C)',
        'H₂O',
        '잔류 불순물 선택적 용출',
        'border-sky-500/40 bg-slate-950/90 text-sky-200',
        'bg-sky-500/20 text-sky-300',
        'bg-sky-400',
        1.6
      );
      break;
    }
  }

  return labels;
}

// ============================================================================
// 3D SCENE BUILDERS PER SYNTHESIS STAGE
// ============================================================================

function buildStageMolecularScene(
  parent: THREE.Group,
  stage: SynthesisStageId,
  failureMode: FailureMode,
  mode: 'BALL_AND_STICK' | 'SPACE_FILLING'
) {
  const scale = mode === 'SPACE_FILLING' ? 1.4 : 1.0;

  switch (stage) {
    case 1: {
      // Stage 1 Reagents: Salicylic Acid, Acetic Anhydride, H3PO4 catalyst
      // Left: Salicylic acid
      const saGroup = createMoleculeMesh(SALICYLIC_ACID_3D, scale, mode === 'SPACE_FILLING');
      saGroup.position.set(-3.2, 0.4, 0);
      saGroup.name = 'mol_SA';
      parent.add(saGroup);

      // Center-Right: Acetic Anhydride
      const aaGroup = createMoleculeMesh(ACETIC_ANHYDRIDE_3D, scale, mode === 'SPACE_FILLING');
      aaGroup.position.set(1.8, -0.2, 0);
      aaGroup.name = 'mol_AA';
      parent.add(aaGroup);

      // Top: Phosphoric Acid Catalyst
      const paGroup = createMoleculeMesh(PHOSPHORIC_ACID_3D, scale, mode === 'SPACE_FILLING');
      paGroup.position.set(-0.5, 3.2, 0);
      paGroup.name = 'mol_PA';
      parent.add(paGroup);

      // Proton H+ sphere that travels from PA to AA
      const protonGeo = new THREE.SphereGeometry(0.25 * scale, 16, 16);
      const protonMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.0,
        roughness: 0.1,
      });
      const protonMesh = new THREE.Mesh(protonGeo, protonMat);
      protonMesh.name = 'proton_transfer';
      parent.add(protonMesh);

      // Electrophilic Carbon Target Ring (pulses around carbonyl carbon upon protonation)
      const ringGeo = new THREE.TorusGeometry(0.5, 0.04, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(1.8 - 1.18, -0.2 + 0.65, 0);
      ringMesh.name = 'carbonyl_target_ring';
      ringMesh.visible = false;
      parent.add(ringMesh);
      break;
    }

    case 2: {
      // Stage 2: Nucleophilic Acyl Substitution & Esterification
      if (failureMode === 'OVERHEATING') {
        const tarGroup = createDeformedTarAggregate(scale);
        tarGroup.name = 'mol_tar';
        parent.add(tarGroup);
      } else {
        // Reactants
        const saGroup = createMoleculeMesh(SALICYLIC_ACID_3D, scale, mode === 'SPACE_FILLING');
        saGroup.name = 'react_SA';
        parent.add(saGroup);

        const aaGroup = createMoleculeMesh(ACETIC_ANHYDRIDE_3D, scale, mode === 'SPACE_FILLING');
        aaGroup.name = 'react_AA';
        parent.add(aaGroup);

        // 3D Curved Arrow showing electron movement from -OH to carbonyl carbon
        const arrowGroup = createCurvedArrowMesh();
        arrowGroup.name = 'curved_arrow';
        parent.add(arrowGroup);

        // sp3 Tetrahedral Intermediate
        const tetGroup = createMoleculeMesh(TETRAHEDRAL_INTERMEDIATE_3D, scale, mode === 'SPACE_FILLING');
        tetGroup.name = 'mol_tetrahedral';
        tetGroup.visible = false;
        parent.add(tetGroup);

        // Cleaved Products
        const asaGroup = createMoleculeMesh(ASPIRIN_3D, scale, mode === 'SPACE_FILLING');
        asaGroup.name = 'prod_ASA';
        asaGroup.visible = false;
        parent.add(asaGroup);

        const acohGroup = createMoleculeMesh(ACETIC_ACID_3D, scale, mode === 'SPACE_FILLING');
        acohGroup.name = 'prod_AcOH';
        acohGroup.visible = false;
        parent.add(acohGroup);

        // Regenerated H+ Catalyst
        const regenHGeo = new THREE.SphereGeometry(0.24 * scale, 16, 16);
        const regenHMat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: 1.0,
        });
        const regenHMesh = new THREE.Mesh(regenHGeo, regenHMat);
        regenHMesh.name = 'regen_H';
        regenHMesh.visible = false;
        parent.add(regenHMesh);
      }
      break;
    }

    case 3: {
      // Stage 3: Metastable Zone with 10-AcOH Organic Solvation Shell
      const centerAspirin = createMoleculeMesh(ASPIRIN_3D, scale, mode === 'SPACE_FILLING');
      centerAspirin.name = 'central_aspirin';
      parent.add(centerAspirin);

      // Solvation Shell of 10 Acetic Acid molecules in organic cage
      const solvationGroup = new THREE.Group();
      solvationGroup.name = 'solvation_shell';
      const numSolvent = 10;
      for (let i = 0; i < numSolvent; i++) {
        const solvent = createMoleculeMesh(ACETIC_ACID_3D, scale * 0.75, mode === 'SPACE_FILLING');
        const phi = Math.acos(-1 + (2 * i) / numSolvent);
        const theta = Math.sqrt(numSolvent * Math.PI) * phi;
        const radius = 3.6;
        solvent.position.set(
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi)
        );
        solvent.lookAt(0, 0, 0);
        solvationGroup.add(solvent);
      }
      parent.add(solvationGroup);

      // Semi-transparent organic solvation cage mesh
      const cageGeo = new THREE.IcosahedronGeometry(4.0, 2);
      const cageMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      });
      const cageMesh = new THREE.Mesh(cageGeo, cageMat);
      cageMesh.name = 'solvation_cage_mesh';
      parent.add(cageMesh);

      // Bouncing Aspirin trying to crystallize but sterically hindered by cage
      const bounceAsp = createMoleculeMesh(ASPIRIN_3D, scale * 0.8, mode === 'SPACE_FILLING');
      bounceAsp.name = 'bouncing_aspirin';
      bounceAsp.position.set(-6.2, 1.0, 0);
      parent.add(bounceAsp);
      break;
    }

    case 4: {
      // Stage 4: Distilled Water Antisolvent Shock & CNT Nucleation Burst
      const nucleusGroup = new THREE.Group();
      nucleusGroup.name = 'nucleation_cluster';

      // 4 Aspirin molecules assembling into dimer nucleus
      for (let i = 0; i < 4; i++) {
        const asp = createMoleculeMesh(ASPIRIN_3D, scale * 0.88, mode === 'SPACE_FILLING');
        asp.name = `asp_cluster_${i}`;
        nucleusGroup.add(asp);
      }
      parent.add(nucleusGroup);

      // Swarm of Water molecules rushing from outside
      const waterGroup = new THREE.Group();
      waterGroup.name = 'water_cluster';
      const waterCount = 22;
      for (let i = 0; i < waterCount; i++) {
        const w = createMoleculeMesh(WATER_3D, scale * 0.68, mode === 'SPACE_FILLING');
        w.name = `water_${i}`;
        waterGroup.add(w);
      }
      parent.add(waterGroup);

      // Expanding Shockwave Ring (CNT Barrier Collapse)
      const shockGeo = new THREE.RingGeometry(0.2, 0.45, 32);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const shockMesh = new THREE.Mesh(shockGeo, shockMat);
      shockMesh.name = 'shockwave_ring';
      shockMesh.visible = false;
      parent.add(shockMesh);

      // Carboxylic Acid Dimer Hydrogen Bond Connectors
      const hBondsGroup = new THREE.Group();
      hBondsGroup.name = 'dimer_h_bonds';
      const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
      const cylMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.4,
      });
      const h1 = new THREE.Mesh(cylGeo, cylMat);
      h1.position.set(-0.3, 0.5, 0);
      h1.rotation.z = Math.PI / 2;
      const h2 = new THREE.Mesh(cylGeo, cylMat);
      h2.position.set(0.3, -0.5, 0);
      h2.rotation.z = Math.PI / 2;
      hBondsGroup.add(h1);
      hBondsGroup.add(h2);
      hBondsGroup.visible = false;
      parent.add(hBondsGroup);
      break;
    }

    case 5: {
      if (failureMode === 'EARLY_WATER') {
        const saGroup = createMoleculeMesh(SALICYLIC_ACID_3D, scale, mode === 'SPACE_FILLING');
        saGroup.name = 'unreacted_SA';
        parent.add(saGroup);
      } else {
        // Stage 5: Multi-unit-cell 3D crystal lattice of Aspirin (P2_1/c dimers)
        const latticeGroup = new THREE.Group();
        latticeGroup.name = 'crystal_lattice';

        const dimer = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
        latticeGroup.add(dimer);

        const dimer2 = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
        dimer2.position.set(0, 3.8, 1.2);
        latticeGroup.add(dimer2);

        const dimer3 = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
        dimer3.position.set(0, -3.8, -1.2);
        latticeGroup.add(dimer3);

        parent.add(latticeGroup);

        // Free dimer adsorbing onto the open growth site (Ostwald Ripening)
        const adsorbingDimer = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
        adsorbingDimer.name = 'free_dimer_adsorbing';
        adsorbingDimer.position.set(4.5, 3.2, 1.5);
        parent.add(adsorbingDimer);
      }
      break;
    }

    case 6: {
      // Stage 6: Porous Filter Cake & Impurity Elution
      const filterGroup = new THREE.Group();
      filterGroup.name = 'filter_cake_lattice';

      const dimer = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
      filterGroup.add(dimer);

      const dimer2 = createMoleculeMesh(ASPIRIN_DIMER_3D, scale * 0.85, mode === 'SPACE_FILLING');
      dimer2.position.set(0, 3.6, 0);
      filterGroup.add(dimer2);

      // Pore mobile water molecules gliding down
      const poreMobileGroup = new THREE.Group();
      poreMobileGroup.name = 'pore_mobile_phase';
      for (let i = 0; i < 14; i++) {
        const w = createMoleculeMesh(WATER_3D, scale * 0.6, mode === 'SPACE_FILLING');
        w.name = `pore_water_${i}`;
        poreMobileGroup.add(w);
      }
      filterGroup.add(poreMobileGroup);

      // Mobile byproduct molecules (AcOH & H3PO4) being washed away
      const byproductsGroup = new THREE.Group();
      byproductsGroup.name = 'eluting_byproducts';
      for (let i = 0; i < 3; i++) {
        const acoh = createMoleculeMesh(ACETIC_ACID_3D, scale * 0.65, mode === 'SPACE_FILLING');
        acoh.name = `eluting_acoh_${i}`;
        byproductsGroup.add(acoh);
      }
      filterGroup.add(byproductsGroup);

      parent.add(filterGroup);
      break;
    }
  }
}

// ============================================================================
// DYNAMIC KINETICS UPDATE PER FRAME
// ============================================================================

function updateMolecularKinetics(
  parent: THREE.Group,
  haloLight: THREE.PointLight | null,
  stage: SynthesisStageId,
  progress: number,
  timeSec: number,
  failureMode: FailureMode,
  _mode: 'BALL_AND_STICK' | 'SPACE_FILLING'
) {
  const t = progress;

  switch (stage) {
    case 1: {
      // Step 1: Thermal Brownian Drift + Proton Transfer to Carbonyl Oxygen
      const sa = parent.getObjectByName('mol_SA');
      const aa = parent.getObjectByName('mol_AA');
      const pa = parent.getObjectByName('mol_PA');
      const proton = parent.getObjectByName('proton_transfer');
      const targetRing = parent.getObjectByName('carbonyl_target_ring');

      if (sa) {
        sa.position.x = -3.2 + Math.sin(timeSec * 1.5) * 0.2;
        sa.position.y = 0.4 + Math.cos(timeSec * 1.2) * 0.2;
        sa.rotation.z = Math.sin(timeSec * 0.8) * 0.1;
      }
      if (aa) {
        aa.position.x = 1.8 + Math.cos(timeSec * 1.8) * 0.2;
        aa.position.y = -0.2 + Math.sin(timeSec * 1.4) * 0.2;
        aa.rotation.y = Math.cos(timeSec * 0.6) * 0.15;
      }
      if (pa) {
        pa.position.y = 3.2 + Math.sin(timeSec * 2.0) * 0.15;
      }

      // Proton Transfer Trajectory (detaches from PA, curves to AA carbonyl oxygen)
      if (proton && pa && aa) {
        const startPos = new THREE.Vector3(pa.position.x - 0.2, pa.position.y - 0.6, 0);
        const targetPos = new THREE.Vector3(aa.position.x - 1.22, aa.position.y + 1.86, 0);

        if (t < 0.25) {
          proton.position.copy(startPos);
          if (haloLight) haloLight.intensity = 0;
          if (targetRing) targetRing.visible = false;
        } else if (t <= 0.70) {
          const frac = (t - 0.25) / 0.45;
          const arc = Math.sin(frac * Math.PI) * 1.4;
          proton.position.lerpVectors(startPos, targetPos, frac);
          proton.position.y += arc;

          if (haloLight) {
            haloLight.position.copy(proton.position);
            haloLight.intensity = 1.8 * Math.sin(frac * Math.PI);
          }
          if (targetRing) targetRing.visible = false;
        } else {
          // Docked to carbonyl oxygen with oxonium ion activation
          proton.position.copy(targetPos);
          const pulse = (Math.sin(timeSec * 8) + 1) * 0.5;
          if (haloLight) {
            haloLight.position.copy(targetPos);
            haloLight.intensity = 1.2 + pulse * 1.0;
          }
          // Activate pulsating electrophilic carbon target ring
          if (targetRing) {
            targetRing.visible = true;
            targetRing.position.set(aa.position.x - 1.18, aa.position.y + 0.65, 0);
            targetRing.rotation.z = timeSec * 2.5;
            const ringScale = 0.95 + pulse * 0.2;
            targetRing.scale.set(ringScale, ringScale, ringScale);
          }
        }
      }
      break;
    }

    case 2: {
      // Step 2: Nucleophilic Attack -> sp3 Intermediate -> Acetic Acid Cleavage
      if (failureMode === 'OVERHEATING') {
        const tar = parent.getObjectByName('mol_tar');
        if (tar) {
          tar.rotation.y = timeSec * 0.35;
          tar.rotation.x = Math.sin(timeSec * 0.5) * 0.2;
        }
        return;
      }

      const sa = parent.getObjectByName('react_SA');
      const aa = parent.getObjectByName('react_AA');
      const arrow = parent.getObjectByName('curved_arrow');
      const tet = parent.getObjectByName('mol_tetrahedral');
      const asa = parent.getObjectByName('prod_ASA');
      const acoh = parent.getObjectByName('prod_AcOH');
      const regenH = parent.getObjectByName('regen_H');

      // Phase 1 (t < 0.38): Reactants approach with curved arrow mechanism
      if (t < 0.38) {
        const frac = t / 0.38;
        if (sa && aa) {
          sa.visible = true;
          aa.visible = true;
          sa.position.set(-3.2 * (1 - frac) - 0.8 * frac, 0.3 * (1 - frac), 0);
          aa.position.set(2.2 * (1 - frac) + 0.8 * frac, -0.2 * (1 - frac), 0);
        }
        if (arrow) {
          arrow.visible = true;
          const arrowMat = (arrow.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
          if (arrowMat) arrowMat.opacity = 0.6 + Math.sin(timeSec * 8) * 0.35;
        }
        if (tet) tet.visible = false;
        if (asa) asa.visible = false;
        if (acoh) acoh.visible = false;
        if (regenH) regenH.visible = false;
        if (haloLight) haloLight.intensity = 0;
      }
      // Phase 2 (0.38 <= t < 0.65): Transient sp3 Tetrahedral Intermediate
      else if (t < 0.65) {
        if (sa) sa.visible = false;
        if (aa) aa.visible = false;
        if (arrow) arrow.visible = false;

        if (tet) {
          tet.visible = true;
          tet.rotation.y = timeSec * 0.3;
          tet.rotation.x = Math.sin(timeSec * 0.4) * 0.1;
        }
        if (haloLight) {
          haloLight.position.set(0, 0, 0);
          haloLight.intensity = 1.4 + Math.sin(timeSec * 10) * 0.5;
        }
        if (asa) asa.visible = false;
        if (acoh) acoh.visible = false;
        if (regenH) regenH.visible = false;
      }
      // Phase 3 (t >= 0.65): Cleavage into Aspirin + Acetic Acid + Regenerated H+
      else {
        if (sa) sa.visible = false;
        if (aa) aa.visible = false;
        if (arrow) arrow.visible = false;
        if (tet) tet.visible = false;

        const frac = (t - 0.65) / 0.35;
        if (asa) {
          asa.visible = true;
          asa.position.set(-0.3 - frac * 2.2, 0.2 + frac * 0.4, 0);
          asa.rotation.y = frac * 0.8;
        }
        if (acoh) {
          acoh.visible = true;
          acoh.position.set(0.3 + frac * 2.8, -0.3 - frac * 0.8, 0);
          acoh.rotation.z = -frac * 1.5;
        }
        if (regenH) {
          regenH.visible = true;
          regenH.position.set(0, 0.6 + frac * 2.5, 0);
        }
        if (haloLight) {
          haloLight.position.set(0, 0.6 + frac * 2.5, 0);
          haloLight.intensity = Math.max(0, 1.5 * (1 - frac));
        }
      }
      break;
    }

    case 3: {
      // Step 3: Metastable Zone (Solvation Shell & Steric Repulsion Bouncing)
      const center = parent.getObjectByName('central_aspirin');
      const shell = parent.getObjectByName('solvation_shell');
      const cage = parent.getObjectByName('solvation_cage_mesh');
      const bounce = parent.getObjectByName('bouncing_aspirin');

      if (center) {
        center.rotation.y = timeSec * 0.12;
        center.rotation.z = Math.sin(timeSec * 0.2) * 0.06;
      }
      if (shell) {
        shell.rotation.y = -timeSec * 0.15;
        shell.children.forEach((solvent, idx) => {
          const pulse = Math.sin(timeSec * 2.5 + idx) * 0.15;
          solvent.position.normalize().multiplyScalar(3.6 + pulse);
        });
      }
      if (cage) {
        cage.rotation.y = timeSec * 0.1;
      }
      if (bounce) {
        // Approaching molecule bounces off the solvation cage at r ~ 4.1
        const bounceCycle = (t * 2) % 1.0;
        let bx: number;
        if (bounceCycle < 0.5) {
          const f = bounceCycle / 0.5;
          bx = -6.2 + f * 2.1; // approach to -4.1
        } else {
          const f = (bounceCycle - 0.5) / 0.5;
          bx = -4.1 - f * 2.1; // bounce back to -6.2
        }
        bounce.position.set(bx, 1.0 + Math.sin(timeSec * 3) * 0.3, 0);
        bounce.rotation.y = timeSec * 1.5;
      }
      break;
    }

    case 4: {
      // Step 4: Antisolvent Injection & Hydrophobic Collapse into Dimer Needle
      const nucleus = parent.getObjectByName('nucleation_cluster');
      const waters = parent.getObjectByName('water_cluster');
      const shockwave = parent.getObjectByName('shockwave_ring');
      const hBonds = parent.getObjectByName('dimer_h_bonds');

      // Water molecules rush inward
      if (waters) {
        waters.rotation.y = timeSec * 0.4;
        waters.children.forEach((w, idx) => {
          const initR = 8.5;
          const targetR = 3.6;
          const currentR = initR - Math.min(1.0, t * 1.8) * (initR - targetR);
          const angle = (idx / waters.children.length) * Math.PI * 2 + timeSec * 0.3;
          w.position.set(
            Math.cos(angle) * currentR,
            Math.sin(angle * 2) * 1.8,
            Math.sin(angle) * currentR
          );
        });
      }

      // Aspirin molecules assemble into dimer nucleus
      if (nucleus) {
        const snapFrac =
          failureMode === 'EARLY_WATER' ? 0 : Math.max(0, Math.min(1, (t - 0.35) / 0.55));
        nucleus.children.forEach((asp, idx) => {
          const dispersedPos = new THREE.Vector3(
            idx === 0 ? -3.8 : idx === 1 ? 3.8 : idx === 2 ? -2.2 : 2.2,
            idx < 2 ? 2.6 : -2.6,
            idx % 2 === 0 ? 1.5 : -1.5
          );
          const orderedPos = new THREE.Vector3(
            (idx - 1.5) * 1.8,
            idx % 2 === 0 ? 0.4 : -0.4,
            0
          );
          asp.position.lerpVectors(dispersedPos, orderedPos, snapFrac);
          asp.rotation.y = (1 - snapFrac) * idx + snapFrac * 0.2;
        });
      }

      // Shockwave Ring & H-Bond Activation
      if (failureMode !== 'EARLY_WATER' && t >= 0.35) {
        const burstT = (t - 0.35) / 0.65;
        if (shockwave) {
          shockwave.visible = true;
          const shockScale = 0.5 + burstT * 6.5;
          shockwave.scale.set(shockScale, shockScale, shockScale);
          const mat = (shockwave as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat) mat.opacity = Math.max(0, (1 - burstT) * 0.9);
        }
        if (hBonds) {
          hBonds.visible = true;
          const pulse = (Math.sin(timeSec * 8) + 1) * 0.5;
          hBonds.children.forEach((cyl) => {
            const mat = (cyl as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat) mat.emissiveIntensity = 1.0 + pulse * 0.8;
          });
        }
      } else {
        if (shockwave) shockwave.visible = false;
        if (hBonds) hBonds.visible = false;
      }
      break;
    }

    case 5: {
      if (failureMode === 'EARLY_WATER') {
        const sa = parent.getObjectByName('unreacted_SA');
        if (sa) {
          sa.rotation.y = timeSec * 0.25;
          sa.rotation.x = Math.sin(timeSec * 0.15) * 0.08;
        }
        return;
      }

      // Step 5: Crystal Maturation & Ostwald Ripening Adsorption
      const lattice = parent.getObjectByName('crystal_lattice');
      const adsorbing = parent.getObjectByName('free_dimer_adsorbing');

      if (lattice) {
        lattice.rotation.y = timeSec * 0.25;
        lattice.rotation.x = Math.sin(timeSec * 0.15) * 0.08;
      }

      if (adsorbing) {
        // Free dimer unit drifts in and locks into open lattice site at t ~ 0.65
        const startPos = new THREE.Vector3(4.5, 3.2, 1.5);
        const targetPos = new THREE.Vector3(0, 3.8, 1.2);

        if (t < 0.65) {
          const frac = t / 0.65;
          adsorbing.position.lerpVectors(startPos, targetPos, frac);
          adsorbing.rotation.y = timeSec * 0.5 + frac * 0.5;
        } else {
          adsorbing.position.copy(targetPos);
          adsorbing.rotation.y = (lattice ? lattice.rotation.y : 0);
        }
      }
      break;
    }

    case 6: {
      // Step 6: Vacuum Filtration Cake & Pore Flow
      const filterGroup = parent.getObjectByName('filter_cake_lattice');
      const mobilePhase = parent.getObjectByName('pore_mobile_phase');
      const byproducts = parent.getObjectByName('eluting_byproducts');

      if (filterGroup) {
        if (failureMode === 'WARM_WASH' && t > 0.4) {
          const shake = (Math.random() - 0.5) * 0.08;
          filterGroup.position.x = shake;
          filterGroup.scale.setScalar(Math.max(0.4, 1.0 - (t - 0.4) * 0.9));
        } else {
          filterGroup.position.set(0, 0, 0);
          filterGroup.scale.setScalar(1.0);
        }
      }

      // Mobile water molecules gliding downward through interstitial pores
      if (mobilePhase) {
        mobilePhase.children.forEach((w, idx) => {
          const streamSpeed = failureMode === 'WARM_WASH' ? 6.5 : 4.2;
          const wy = 4.5 - (((timeSec * streamSpeed + idx * 0.8) % 9.0));
          const wx = -1.2 + ((idx * 0.7) % 2.4);
          const wz = -1.0 + ((idx * 0.5) % 2.0);
          w.position.set(wx, wy, wz);
          w.rotation.x = timeSec * 3 + idx;
        });
      }

      // Byproduct molecules (AcOH & H3PO4) being washed away
      if (byproducts) {
        byproducts.children.forEach((bp, idx) => {
          const streamSpeed = 4.8;
          const by = 4.0 - (((timeSec * streamSpeed + idx * 1.5) % 8.5));
          const bx = -0.9 + ((idx * 0.9) % 1.8);
          const bz = -0.7 + ((idx * 0.6) % 1.4);
          bp.position.set(bx, by, bz);
          bp.rotation.y = timeSec * 2.5 + idx;
        });
      }
      break;
    }
  }
}

// ============================================================================
// PROCEDURAL MESH GENERATION HELPERS
// ============================================================================

interface MoleculeSpec {
  atoms: Array<{
    id: string;
    element: string;
    pos: [number, number, number];
    color: string;
    radius: number;
  }>;
  bonds: Array<{
    atom1Id: string;
    atom2Id: string;
    order: number;
    type?: string;
  }>;
}

function createMoleculeMesh(
  spec: MoleculeSpec,
  scale: number,
  spaceFilling: boolean
): THREE.Group {
  const group = new THREE.Group();
  const atomPosMap = new Map<string, THREE.Vector3>();

  const sphereGeo = new THREE.SphereGeometry(1.0, 16, 16);

  // 1. Create Atoms
  spec.atoms.forEach((atom) => {
    const radiusMultiplier = spaceFilling ? 1.6 : 0.85;
    const effectiveRadius = atom.radius * radiusMultiplier * scale;

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(atom.color),
      roughness: 0.35,
      metalness: 0.15,
      emissive: atom.element === 'H+' ? new THREE.Color(0x00f0ff) : new THREE.Color(0x000000),
      emissiveIntensity: atom.element === 'H+' ? 0.9 : 0.0,
    });

    const atomMesh = new THREE.Mesh(sphereGeo, material);
    const pos = new THREE.Vector3(...atom.pos).multiplyScalar(scale);
    atomMesh.position.copy(pos);
    atomMesh.scale.set(effectiveRadius, effectiveRadius, effectiveRadius);
    atomMesh.name = `atom_${atom.id}`;
    group.add(atomMesh);

    atomPosMap.set(atom.id, pos);
  });

  // 2. Create Bonds (Ball & Stick only)
  if (!spaceFilling) {
    const bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.5,
      metalness: 0.1,
    });

    spec.bonds.forEach((bond) => {
      const p1 = atomPosMap.get(bond.atom1Id);
      const p2 = atomPosMap.get(bond.atom2Id);
      if (!p1 || !p2) return;

      const direction = new THREE.Vector3().subVectors(p2, p1);
      const length = direction.length();
      const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      const bondRadius = 0.09 * scale;
      const cylinderGeo = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8);

      const cylinder = new THREE.Mesh(cylinderGeo, bondMaterial);
      cylinder.position.copy(center);
      cylinder.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      group.add(cylinder);
    });
  }

  return group;
}

// 3D Curved Arrow showing Electron Push Reaction Mechanism
function createCurvedArrowMesh(): THREE.Group {
  const group = new THREE.Group();

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-1.4, 0.9, 0),
    new THREE.Vector3(0.0, 2.2, 0.4),
    new THREE.Vector3(0.8, 0.45, 0)
  );
  const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.85,
    roughness: 0.2,
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, arrowMat);
  group.add(tubeMesh);

  // Arrowhead Cone at endpoint
  const coneGeo = new THREE.ConeGeometry(0.24, 0.5, 12);
  coneGeo.rotateX(Math.PI / 2);
  const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
  coneMesh.position.set(0.8, 0.45, 0);
  coneMesh.lookAt(1.0, 0.25, 0);
  group.add(coneMesh);

  return group;
}

// Overheating Charred Tar Polymer Aggregate
function createDeformedTarAggregate(scale: number): THREE.Group {
  const group = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(1.0, 12, 12);
  const tarMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
    metalness: 0.05,
    emissive: 0x451a03,
    emissiveIntensity: 0.3,
  });

  const count = 38;
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(sphereGeo, tarMat);
    const r = (0.4 + Math.random() * 0.7) * scale;
    mesh.scale.set(r, r, r);
    mesh.position.set(
      (Math.random() - 0.5) * 3.5 * scale,
      (Math.random() - 0.5) * 3.5 * scale,
      (Math.random() - 0.5) * 3.5 * scale
    );
    group.add(mesh);
  }

  return group;
}

// Recursive disposal of Object3D, Geometries, Materials, and Textures
function disposeHierarchy(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }
  });
}

function getMicroStageTitle(stage: SynthesisStageId, mode: FailureMode): string {
  if (mode === 'EARLY_WATER') return '수분 혼입: 무수아세트산 가수분해 진행 (아스피린 생성 불가)';
  if (mode === 'OVERHEATING') return '고온 과열: 살리실산 고분자화 및 불규칙 타르(Tar) 응집';
  if (mode === 'WARM_WASH') return '온수 세척: 높은 수용해도로 인한 결정 격자 붕괴 및 용출';

  switch (stage) {
    case 1:
      return 'H3PO4 촉매에 의한 무수아세트산 카보닐 산소 양성자화 (옥소늄 이온 활성화)';
    case 2:
      return '살리실산 페놀성 -OH의 친핵성 아실 치환 반응 (sp3 사면체 중간체 경유)';
    case 3:
      return '아세트산 공용매(εr≈6.2) 유기 케이지 용매화 쉘 & 준안정 상태 (MZW)';
    case 4:
      return '물(εr≈80) 반용매 충격: 소수성 배제 및 아스피린 다이머 침상 결정 자가조립';
    case 5:
      return '단사정계(P2_1/c) 카복실산 수소결합 다이머 결정 격자 형성 및 숙성';
    case 6:
      return '다공성 결정 케이크 형성 및 빙냉수를 통한 부산물(AcOH, H3PO4) 선택적 용출';
  }
}

function getLiveReactionSubtitle(
  stage: SynthesisStageId,
  t: number,
  failureMode: FailureMode
): string {
  switch (stage) {
    case 1:
      if (t < 0.25) return '① 살리실산과 무수아세트산 분자가 용액 내에서 열운동(브라운 운동)하며 반응을 대기합니다.';
      if (t < 0.70) return '② 인산 촉매에서 해리된 H⁺(양성자)가 무수아세트산의 카보닐 산소(=O) 고립전자쌍으로 이동합니다.';
      return '③ 카보닐 산소가 양성자화(옥소늄 이온)되어 인접 카보닐 탄소(C*)의 친전자성이 극대화됩니다.';
    case 2:
      if (failureMode === 'OVERHEATING') {
        return '⚠ 85°C 초과 고온 과열: 살리실산의 비가역적 자기축합으로 흑갈색 점조성 타르(Tar) 부산물이 형성됩니다.';
      }
      if (t < 0.38) return '① 살리실산의 페놀성 -OH 산소가 친전자성 카보닐 탄소(C*)를 향해 친핵 공격을 시작합니다.';
      if (t < 0.65) return '② 산소-탄소 결합이 형성되며 sp³ 사면체 중간체(Tetrahedral Intermediate)가 생성됩니다.';
      return '③ 아세톡시기가 분해되어 아세트산(CH₃COOH) 부산물로 탈리되고 H⁺ 촉매가 재생되며 아스피린이 완성됩니다.';
    case 3:
      return '얼음물 냉각(0~4°C): 부산물 아세트산(εr≈6.2)이 유기 용매화 껍질을 형성하여 아스피린 분자 간 접근을 차단합니다 (준안정 상태 MZW).';
    case 4:
      if (failureMode === 'EARLY_WATER') {
        return '⚠ 조기 수분 혼입: 무수아세트산 사전 가수분해로 아세틸화가 차단되어 아스피린 결정이 전혀 석출되지 않습니다.';
      }
      if (t < 0.35) return '① 극성 증류수(εr≈80)가 대량 유입되며 아세트산 분자들을 낚아채어 유기 용매화 껍질을 붕괴시킵니다.';
      return '② 아스피린 분자들이 소수성 인력과 카복실산 다이머 수소결합으로 결합하며 단사정계 침상 결정핵으로 폭발적 자가조립합니다!';
    case 5:
      if (failureMode === 'EARLY_WATER') {
        return '⚠ 반응 실패: 미반응 살리실산만 용액 중에 남아 결정 숙성이 일어나지 않습니다.';
      }
      return '오스트발트 숙성(Ostwald Ripening): 미세 클러스터가 용해되어 거대 단사정계(P2₁/c) 결정 격자의 고속 성장면([001])으로 흡착 결합합니다.';
    case 6:
      if (failureMode === 'WARM_WASH') {
        return '⚠ 미지근한 물 세척(25°C): 아스피린 수용해도 급상승으로 결정 케이크가 재용해 손실됩니다.';
      }
      return '감압 여과 및 빙냉 세척: 다공성 결정 케이크는 보존되고, 잔류 아세트산과 인산 불순물만 빙냉 세척수 흐름에 실려 하향 용출 분리됩니다.';
  }
}
