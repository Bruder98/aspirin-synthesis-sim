/**
 * DualViewportContainer.tsx
 * Synchronized Split-Screen Container coordinating 1:1 Macro Lab Canvas & Micro 3D Molecular Simulation.
 * Provides Viewport Mode Toggles, Synchronized Loop Playback Controls, and Live Thermodynamic Telemetry HUD.
 * References: SPEC-UI-3D-PEDAGOGY-001 Sections 2 & 8, PROJECT.md
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Columns,
  Maximize2,
  Gauge,
  Zap,
  Thermometer,
  Layers,
} from 'lucide-react';
import { useAspirinStore } from '../../store/useAspirinStore';
import { MacroApparatusView } from './MacroApparatusView';
import { MicroMolecularView } from './MicroMolecularView';
import { SynthesisStageId } from '../../engine/types';
import {
  playClickSound,
  playStageTransitionSound,
  playCrystalBurstSound,
  playSuccessChime,
} from '../../utils/audioSynthesizer';

export type ViewportMode = 'DUAL' | 'MACRO' | 'MICRO';

interface DualViewportContainerProps {
  className?: string;
}

export const DualViewportContainer: React.FC<DualViewportContainerProps> = ({ className = '' }) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('DUAL');

  // Store subscriptions
  const currentStage = useAspirinStore((s) => s.currentStage);
  const isPlaying = useAspirinStore((s) => s.isPlaying);
  const stageProgress = useAspirinStore((s) => s.stageProgress);
  const playbackSpeed = useAspirinStore((s) => s.playbackSpeed);
  const failureMode = useAspirinStore((s) => s.failureMode);
  const thermodynamics = useAspirinStore((s) => s.thermodynamics);
  const stoichiometryResult = useAspirinStore((s) => s.stoichiometryResult);

  // Store actions
  const nextStage = useAspirinStore((s) => s.nextStage);
  const prevStage = useAspirinStore((s) => s.prevStage);
  const togglePlaying = useAspirinStore((s) => s.togglePlaying);
  const setStageProgress = useAspirinStore((s) => s.setStageProgress);
  const setPlaybackSpeed = useAspirinStore((s) => s.setPlaybackSpeed);
  const resetSimulation = useAspirinStore((s) => s.resetSimulation);

  const handlePrevStage = () => {
    playClickSound();
    prevStage();
  };

  const handleNextStage = () => {
    const next = (currentStage + 1) as SynthesisStageId;
    if (next === 4) {
      playCrystalBurstSound();
    } else if (next === 6 && failureMode === 'NONE') {
      playSuccessChime();
    } else {
      playStageTransitionSound();
    }
    nextStage();
  };

  const handleTogglePlaying = () => {
    playClickSound();
    togglePlaying();
  };

  const handleReset = () => {
    playClickSound();
    resetSimulation();
  };

  const handleSetSpeed = (speed: number) => {
    playClickSound();
    setPlaybackSpeed(speed);
  };

  const handleSetViewportMode = (mode: ViewportMode) => {
    playClickSound();
    setViewportMode(mode);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    setStageProgress(val);
  };

  return (
    <div
      className={`flex flex-col w-full bg-lab-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}
      data-testid="dual-viewport-container"
    >
      {/* 1. Top Control Cockpit Bar: Step Nav, Play/Pause, Scrubber, Speed, Mode Toggles */}
      <div className="flex items-center justify-between gap-2.5 px-3 sm:px-4 py-2 bg-slate-900/95 border-b border-slate-800 text-xs font-mono">
        {/* Left: Step Stepper (< STAGE X / 6 >) */}
        <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 shrink-0">
          <button
            type="button"
            onClick={handlePrevStage}
            disabled={currentStage <= 1}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="이전 단계 (Previous Stage)"
            data-testid="prev-stage-btn"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="px-2 text-xs font-bold text-chem-cyan flex items-center gap-1.5">
            <span className="hidden sm:inline">STAGE</span>
            <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[11px]">
              {currentStage} / 6
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextStage}
            disabled={currentStage >= 6}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="다음 단계 (Next Stage)"
            data-testid="next-stage-btn"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Play/Pause, Scrubber, Speed, Reset */}
        <div className="flex items-center gap-2 flex-1 max-w-xl justify-center">
          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePlaying}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-chem-cyan/20 text-chem-cyan border border-chem-cyan/40 hover:bg-chem-cyan/30'
            }`}
            title={isPlaying ? '일시 정지 (Pause)' : '재생 (Play)'}
            data-testid="play-pause-btn"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Interactive Loop Progress Scrubber */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(stageProgress * 100)}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              title="반응 루프 진행도 조절"
              data-testid="stage-progress-scrubber"
            />
            <span className="text-[10px] font-mono text-cyan-400 min-w-[28px] text-right">
              {Math.round(stageProgress * 100)}%
            </span>
          </div>

          {/* Speed Selector (0.5x, 1.0x, 2.0x) */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-[11px] shrink-0">
            {[0.5, 1.0, 2.0].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSetSpeed(speed)}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-chem-cyan text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`${speed}x 재생 배속`}
                data-testid={`speed-btn-${speed}`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors shrink-0 cursor-pointer"
            title="초기 상태로 리셋"
            data-testid="reset-sim-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Viewport Mode Switcher (DUAL | MACRO | MICRO) */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 font-mono text-xs shrink-0">
          <button
            type="button"
            onClick={() => handleSetViewportMode('DUAL')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              viewportMode === 'DUAL'
                ? 'bg-chem-cyan/20 text-chem-cyan border border-chem-cyan/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="거시-미시 동시 분할 뷰"
            data-testid="mode-dual-btn"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">DUAL SPLIT</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewportMode('MACRO')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              viewportMode === 'MACRO'
                ? 'bg-chem-cyan/20 text-chem-cyan border border-chem-cyan/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="거시적 실험실 뷰 전체 화면"
            data-testid="mode-macro-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">MACRO</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewportMode('MICRO')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              viewportMode === 'MICRO'
                ? 'bg-chem-cyan/20 text-chem-cyan border border-chem-cyan/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="미시적 3D 분자 반응 뷰 전체 화면"
            data-testid="mode-micro-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">MICRO</span>
          </button>
        </div>
      </div>

      {/* 2. Main Viewport Display Area (Balanced Height for comfortable viewing) */}
      <div className="relative w-full h-[52vh] min-h-[440px] max-h-[640px] bg-lab-950 flex flex-col md:flex-row overflow-hidden">
        {/* Macro Lab Viewport */}
        {(viewportMode === 'DUAL' || viewportMode === 'MACRO') && (
          <div
            className={`relative h-full transition-all duration-300 ${
              viewportMode === 'DUAL'
                ? 'w-full md:w-1/2 md:border-r border-slate-800/80'
                : 'w-full'
            }`}
          >
            <MacroApparatusView className="w-full h-full" />
          </div>
        )}

        {/* Micro Three.js 3D Viewport */}
        {(viewportMode === 'DUAL' || viewportMode === 'MICRO') && (
          <div
            className={`relative h-full transition-all duration-300 ${
              viewportMode === 'DUAL' ? 'w-full md:w-1/2' : 'w-full'
            }`}
          >
            <MicroMolecularView className="w-full h-full" />
          </div>
        )}
      </div>

      {/* 3. Bottom Live Thermodynamic & Stoichiometric Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2.5 bg-slate-900/90 border-t border-slate-800 text-xs font-mono">
        {/* Temperature */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">온도 (TEMP)</div>
            <div className="font-bold text-white text-xs">
              {thermodynamics.temperatureC.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Dielectric Constant */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">유전율 (εr)</div>
            <div className="font-bold text-white text-xs flex items-center gap-1">
              <span>{thermodynamics.dielectricConstant.toFixed(1)}</span>
              <span className="text-[9px] text-slate-500 font-normal">
                {thermodynamics.dielectricConstant < 20 ? '(AcOH)' : '(H2O)'}
              </span>
            </div>
          </div>
        </div>

        {/* Supersaturation S */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">과포화도 (S)</div>
            <div
              className={`font-bold text-xs ${
                thermodynamics.supersaturation > 5 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {thermodynamics.supersaturation.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Nucleation Barrier Ratio */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">CNT 핵생성 장벽</div>
            <div className="font-bold text-white text-xs">
              {thermodynamics.relativeBarrierRatio < 0.01
                ? '붕괴 (<0.01)'
                : `${thermodynamics.relativeBarrierRatio.toFixed(2)}x`}
            </div>
          </div>
        </div>

        {/* Thermodynamic State Status */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              thermodynamics.isPrecipitating
                ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                : thermodynamics.isMetastable
                ? 'bg-cyan-400 shadow-[0_0_8px_#38BDF8]'
                : 'bg-slate-500'
            }`}
          />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">상태 진단</div>
            <div className="font-bold text-slate-200 text-xs truncate">
              {thermodynamics.isMetastable
                ? '준안정 (MZW)'
                : thermodynamics.isPrecipitating
                ? '결정 석출 중'
                : '균일 용액'}
            </div>
          </div>
        </div>

        {/* Theoretical Yield Telemetry */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
          <span className="text-xs text-cyan-400 font-bold">Y</span>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">이론 수득량</div>
            <div className="font-bold text-cyan-300 text-xs">
              {stoichiometryResult.theoreticalYieldG.toFixed(2)} g
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualViewportContainer;
