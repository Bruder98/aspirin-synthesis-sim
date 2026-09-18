/**
 * App.tsx
 * Aspirin Synthesis Simulation Web Application - Modern Laboratory Cockpit
 * Mounting DualViewportContainer, Integrated Stage Stepper, Dual-Layer Pedagogy,
 * Yield Calculator Modal, Failure Branching Control Panel, FeCl3 Qualitative Test Modal,
 * and Web Audio API Synthesizer Feedback.
 */

import React, { useState, useEffect } from 'react';
import { useAspirinStore } from './store/useAspirinStore';
import { DualViewportContainer } from './components/viewport';
import { SynthesisStageId, FailureMode } from './engine/types';
import { Eli5PedagogyCard } from './components/pedagogy/Eli5PedagogyCard';
import { AcademicDeepDiveCard } from './components/pedagogy/AcademicDeepDiveCard';
import { YieldCalculatorModal } from './components/calculator/YieldCalculatorModal';
import { FailureScenarioControl } from './components/controls/FailureScenarioControl';
import { FeCl3TestModal } from './components/controls/FeCl3TestModal';
import {
  playClickSound,
  playStageTransitionSound,
  playFailureWarningSound,
  playCrystalBurstSound,
  playSuccessChime,
  isAudioMuted,
  toggleAudioMute,
} from './utils/audioSynthesizer';
import {
  FlaskConical,
  Flame,
  Snowflake,
  Droplets,
  Sparkles,
  Filter,
  AlertTriangle,
  RefreshCw,
  Calculator,
  Lightbulb,
  GraduationCap,
  Activity,
  Gauge,
  Scale,
  Volume2,
  VolumeX,
  TestTube,
} from 'lucide-react';

const STAGES: Array<{
  id: SynthesisStageId;
  title: string;
  shortTitle: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}> = [
  {
    id: 1,
    title: '1. 시약 투입 및 촉매 혼합',
    shortTitle: '1. 시약 투입',
    icon: FlaskConical,
    description:
      '살리실산 분말(2.00g)과 무수아세트산(5.00mL), 85% 인산 촉매(5방울)를 삼각플라스크에 투입하고 혼합합니다.',
  },
  {
    id: 2,
    title: '2. 물중탕 가열 에스테르화',
    shortTitle: '2. 가열 반응',
    icon: Flame,
    description:
      '75~85°C 온수 물중탕에서 마그네틱 교반하며 친핵성 아실 치환 반응을 완결합니다.',
  },
  {
    id: 3,
    title: '3. 얼음물 1차 냉각 (준안정)',
    shortTitle: '3. 얼음물 냉각',
    icon: Snowflake,
    description:
      '고농도 아세트산 공용매 효과(εr≈6.2)로 인해 0~4°C 얼음물에서도 결정이 석출되지 않고 투명한 준안정 상태(Metastable Zone)를 유지합니다.',
  },
  {
    id: 4,
    title: '4. 증류수 주입 (핵생성 폭발)',
    shortTitle: '4. 증류수 주입',
    icon: Droplets,
    description:
      '극성 증류수(εr≈80) 주입으로 유전율 급상승 및 용해도 급감! CNT 핵생성 장벽이 붕괴되며 순백색 침상 결정이 폭발적으로 석출됩니다.',
  },
  {
    id: 5,
    title: '5. 결정 숙성 (Ostwald Ripening)',
    shortTitle: '5. 결정 숙성',
    icon: Sparkles,
    description:
      '얼음물에서 15분간 안치하여 단사정계(P2_1/c) 아스피린 다이머 침상 결정이 치밀하게 성장하고 가라앉습니다.',
  },
  {
    id: 6,
    title: '6. 감압 여과 및 세척',
    shortTitle: '6. 감압 여과',
    icon: Filter,
    description:
      '뷰흐너 깔때기 감압 흡인 여과기로 모액을 분리하고, 빙냉 증류수(0°C)로 잔류 아세트산을 씻어내어 고순도 건조 결정을 수득합니다.',
  },
];

export function App() {
  const currentStage = useAspirinStore((s) => s.currentStage);
  const failureMode = useAspirinStore((s) => s.failureMode);
  const setStage = useAspirinStore((s) => s.setStage);
  const setFailureMode = useAspirinStore((s) => s.setFailureMode);
  const resetSimulation = useAspirinStore((s) => s.resetSimulation);
  const activeTab = useAspirinStore((s) => s.activeTab);
  const setActiveTab = useAspirinStore((s) => s.setActiveTab);
  const setCalculatorOpen = useAspirinStore((s) => s.setCalculatorOpen);
  const isFailureModalOpen = useAspirinStore((s) => s.isFailureModalOpen);
  const setFailureModalOpen = useAspirinStore((s) => s.setFailureModalOpen);
  const thermodynamics = useAspirinStore((s) => s.thermodynamics);
  const stoichiometryResult = useAspirinStore((s) => s.stoichiometryResult);

  const [muted, setMuted] = useState<boolean>(isAudioMuted());
  const [isFeCl3ModalOpen, setIsFeCl3ModalOpen] = useState<boolean>(false);

  // Sync URL query params on mount for quick navigation and testing (?stage=2&mode=OVERHEATING)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage');
      if (stageParam) {
        const s = parseInt(stageParam, 10);
        if (s >= 1 && s <= 6) {
          setStage(s as SynthesisStageId);
        }
      }
      const modeParam = params.get('mode');
      if (modeParam && ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'].includes(modeParam)) {
        setFailureMode(modeParam as FailureMode);
      }
    } catch {
      // ignore URL parsing errors in test environments
    }
  }, [setStage, setFailureMode]);

  // Bidirectional sync between store failure modal open and local state
  useEffect(() => {
    setIsFeCl3ModalOpen(isFailureModalOpen);
  }, [isFailureModalOpen]);

  const currentStageObj = STAGES.find((st) => st.id === currentStage) || STAGES[0];

  const handleToggleSound = () => {
    const newMuted = toggleAudioMute();
    setMuted(newMuted);
    if (!newMuted) {
      playClickSound();
    }
  };

  const handleStageSelect = (stageId: SynthesisStageId) => {
    if (stageId === currentStage) return;
    setStage(stageId);

    if (stageId === 4) {
      playCrystalBurstSound();
    } else if (stageId === 6 && failureMode === 'NONE') {
      playSuccessChime();
    } else {
      playStageTransitionSound();
    }
  };

  const handleSelectFailureMode = (mode: FailureMode) => {
    setFailureMode(mode);
    if (mode === 'NONE') {
      playClickSound();
    } else {
      playFailureWarningSound();
    }
  };

  const handleReset = () => {
    playClickSound();
    resetSimulation();
  };

  return (
    <div className="min-h-screen bg-lab-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* 1. Sleek Modern Header Bar */}
      <header className="bg-lab-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold font-display text-white tracking-tight">
                아세틸살리실산(아스피린) 합성 시뮬레이션
              </h1>
              <span className="hidden md:inline-flex px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                Dual-View 60FPS
              </span>
            </div>
          </div>

          {/* Top Actions Toolbar */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Native Audio Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              data-testid="audio-mute-toggle"
              className={`px-2 py-1 rounded-lg border transition-all font-mono font-medium flex items-center gap-1 cursor-pointer ${
                muted
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
              }`}
              title={muted ? '음소거 해제' : '음소거'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[10px]">{muted ? 'Muted' : 'Audio On'}</span>
            </button>

            {/* Header FeCl3 Qualitative Test Launcher */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFailureModalOpen(true);
                setIsFeCl3ModalOpen(true);
              }}
              data-testid="header-fecl3-btn"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 hover:text-white transition-all font-mono text-xs font-semibold shadow-[0_0_8px_rgba(168,85,247,0.15)] cursor-pointer"
              title="FeCl3 페놀성 -OH 정성 분석 시험"
            >
              <TestTube className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FeCl₃ 시험</span>
              <span className="sm:hidden">FeCl₃</span>
            </button>

            {/* Stoichiometry Yield Calculator Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setCalculatorOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 hover:text-white transition-all font-mono text-xs font-semibold shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer"
              data-testid="header-calculator-btn"
              title="화학양론 수득률 계산기"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">수득률 계산기</span>
              <span className="sm:hidden">계산기</span>
            </button>

            {/* Failure Mode Select Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-0.5 text-xs">
              <AlertTriangle
                className={`w-3 h-3 ${
                  failureMode !== 'NONE' ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                }`}
              />
              <select
                value={failureMode}
                onChange={(e) => handleSelectFailureMode(e.target.value as FailureMode)}
                className={`bg-transparent text-xs font-mono focus:outline-none cursor-pointer ${
                  failureMode !== 'NONE'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-300'
                }`}
                title="실험 실패 시나리오 선택"
                data-testid="failure-mode-select"
              >
                <option value="NONE" className="bg-slate-900 text-slate-200">정상 (~90%)</option>
                <option value="EARLY_WATER" className="bg-slate-900 text-purple-300">조기 수분 (0%)</option>
                <option value="OVERHEATING" className="bg-slate-900 text-rose-300">고온 과열 (12.5%)</option>
                <option value="WARM_WASH" className="bg-slate-900 text-sky-300">온수 세척 (32%)</option>
              </select>
            </div>

            {/* Reset Simulation Button */}
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="시뮬레이션 초기화"
              data-testid="header-reset-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Integrated Modern Stage Navigation Cockpit & Slim Guideline */}
      <nav aria-label="실험 단계 진행 내비게이션" className="bg-lab-900/90 border-b border-slate-800 px-3 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-col gap-1">
          {/* 6-Step Stepper Bar */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {STAGES.map((st) => {
              const Icon = st.icon;
              const isActive = st.id === currentStage;
              const isCompleted = st.id < currentStage;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStageSelect(st.id)}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap border flex-1 justify-center cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : isCompleted
                      ? 'bg-slate-950/60 border-slate-800/80 text-emerald-400 hover:bg-slate-800/50'
                      : 'bg-slate-950/30 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                  data-testid={`stage-step-btn-${st.id}`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-mono text-xs hidden sm:inline">{st.shortTitle}</span>
                  <span className="font-mono text-xs sm:hidden">{st.id}</span>
                </button>
              );
            })}
          </div>

          {/* Slim High-Contrast Guideline Ribbon */}
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-slate-800/80 text-xs">
            <span className="font-mono font-bold text-cyan-400 uppercase tracking-wide text-[10px] shrink-0">
              STAGE {currentStage}:
            </span>
            <span className="text-slate-300 truncate text-[11px] sm:text-xs">
              {currentStageObj.description}
            </span>
          </div>
        </div>
      </nav>

      {/* 3. Main Dashboard Cockpit */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {/* Synchronized Dual Viewports */}
        <DualViewportContainer />

        {/* 4. Failure Scenario Branching Control Panel */}
        <FailureScenarioControl
          onOpenFeCl3Modal={() => {
            playClickSound();
            setFailureModalOpen(true);
            setIsFeCl3ModalOpen(true);
          }}
        />

        {/* 5. Dual-Layer Pedagogical & Telemetry Dashboard Section */}
        <section
          className="bg-lab-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3"
          aria-label="교육 학습 대시보드"
          data-testid="pedagogical-dashboard-section"
        >
          {/* Segmented Tab Switcher Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
              {/* Tab 1: ELI5 Metaphor */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('ELI5');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  activeTab === 'ELI5'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
                data-testid="tab-btn-eli5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>ELI5 직관 비유</span>
              </button>

              {/* Tab 2: Academic Deep-Dive */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('DEEP_DIVE');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  activeTab === 'DEEP_DIVE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
                data-testid="tab-btn-deep-dive"
              >
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span>학술 DEEP-DIVE (KaTeX)</span>
              </button>

              {/* Tab 3: Real-Time Telemetry */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('TELEMETRY');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  activeTab === 'TELEMETRY'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
                data-testid="tab-btn-telemetry"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>실시간 열역학 &amp; 화학양론</span>
              </button>
            </div>
          </div>

          {/* Active Tab Panel Rendering */}
          <div className="mt-1">
            {activeTab === 'ELI5' && <Eli5PedagogyCard />}

            {activeTab === 'DEEP_DIVE' && <AcademicDeepDiveCard />}

            {activeTab === 'TELEMETRY' && (
              <div
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3"
                data-testid="telemetry-dashboard-panel"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Gauge className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold block">
                        실시간 열역학 및 동역학 텔레메트리
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">과포화도, 유전율 및 화학양론 지표</h3>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    STAGE {currentStage}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">온도 (T)</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-cyan-300">
                      {thermodynamics.temperatureC.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">혼합 유전율 (ε_mix)</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-cyan-300">
                      {thermodynamics.dielectricConstant.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">포화 용해도 (C*)</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-cyan-300">
                      {thermodynamics.solubilityGPer100Ml.toFixed(2)} g/dL
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">과포화도 (S)</span>
                    <span
                      className={`text-sm sm:text-base font-bold font-mono ${
                        thermodynamics.supersaturation > 5 ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {thermodynamics.supersaturation.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase">상태 진단:</span>
                    <div className="text-slate-200">
                      {failureMode === 'EARLY_WATER' && '⚠️ 조기 수분 침투: 무수아세트산 가수분해 (아스피린 0% 수득)'}
                      {failureMode === 'OVERHEATING' && '⚠️ 85°C 초과 과열: 살리실산 자기축합 타르(Pitch) 형성'}
                      {failureMode === 'WARM_WASH' && '⚠️ 미지근한 세척수: 결정 재용해 대량 손실 (~32% 수득)'}
                      {failureMode === 'NONE' && (
                        <>
                          {thermodynamics.isMetastable && '🧊 준안정 영역 (Metastable Zone, 투명 액체)'}
                          {thermodynamics.isPrecipitating && '⚡ 급격한 핵생성 및 결정 석출 (바늘 결정)'}
                          {!thermodynamics.isMetastable && !thermodynamics.isPrecipitating && '🧪 균일 혼합 용액 상태'}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase">한계 반응물:</span>
                    <div className="text-cyan-300 font-bold">
                      {stoichiometryResult.limitingReagent === 'SALICYLIC_ACID' ? '살리실산' : '무수아세트산'} ({stoichiometryResult.limitingReagentMoles.toFixed(4)} mol)
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase">이론적 수득량:</span>
                    <div className="text-emerald-400 font-bold">
                      {stoichiometryResult.theoreticalYieldG.toFixed(3)} g (100% 기준)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 6. Modals */}
      <YieldCalculatorModal />
      <FeCl3TestModal
        isOpen={isFeCl3ModalOpen}
        onClose={() => {
          setIsFeCl3ModalOpen(false);
          setFailureModalOpen(false);
        }}
      />

      {/* 7. Clean Minimal Footer */}
      <footer className="bg-lab-900/90 border-t border-slate-800 px-4 py-2.5 text-center text-xs font-mono text-slate-400">
        아세틸살리실산(아스피린) 합성 시뮬레이터 • © 방어진고등학교 교사 이건희 (All Rights Reserved)
      </footer>
    </div>
  );
}

export default App;
