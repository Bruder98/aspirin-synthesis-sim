/**
 * FailureScenarioControl.tsx
 * Interactive Laboratory Failure Scenario Branching Control Panel.
 * Supports NONE (Normal ~90%), EARLY_WATER (0%), OVERHEATING (>85°C Tar, 12.5%), WARM_WASH (32%).
 * Provides root-cause chemical mechanism summaries, visual badges, and FeCl3 Test launcher.
 */

import React from 'react';
import { useAspirinStore } from '../../store/useAspirinStore';
import { FailureMode } from '../../engine/types';
import { FAILURE_MODE_DEFINITIONS } from '../../engine/failureModes';
import { playClickSound, playFailureWarningSound } from '../../utils/audioSynthesizer';
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Droplets,
  Waves,
  FlaskConical,
  TestTube,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export interface FailureScenarioControlProps {
  className?: string;
  onOpenFeCl3Modal?: () => void;
}

interface ScenarioCardConfig {
  mode: FailureMode;
  title: string;
  subtitleEn: string;
  yieldBadge: string;
  yieldColor: string;
  stageTrigger: string;
  icon: React.FC<{ className?: string }>;
  borderColor: string;
  activeBg: string;
  feCl3Status: string;
  feCl3BadgeClass: string;
}

const SCENARIO_CONFIGS: ScenarioCardConfig[] = [
  {
    mode: 'NONE',
    title: '정상 합성 (표준 프로토콜)',
    subtitleEn: 'Standard Protocol (Control)',
    yieldBadge: '수득률 ~90%',
    yieldColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    stageTrigger: '전 단계 표준 준수',
    icon: CheckCircle2,
    borderColor: 'border-emerald-500/40',
    activeBg: 'bg-emerald-950/30 ring-1 ring-emerald-500/50',
    feCl3Status: '음성 (담황색, 유리 페놀기 없음)',
    feCl3BadgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    mode: 'EARLY_WATER',
    title: '조기 수분 혼입 (사전 가수분해)',
    subtitleEn: 'Early Water Contamination',
    yieldBadge: '수득률 0%',
    yieldColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    stageTrigger: 'Stage 1~2 (가열 전/중 물 유입)',
    icon: Droplets,
    borderColor: 'border-purple-500/40',
    activeBg: 'bg-purple-950/30 ring-1 ring-purple-500/50',
    feCl3Status: '양성 (진한 보라색, 미반응 살리실산 100%)',
    feCl3BadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    mode: 'OVERHEATING',
    title: '고온 과열 탄화 (>85°C 타르 형성)',
    subtitleEn: 'Thermal Overheating (>85°C)',
    yieldBadge: '수득률 ~12.5%',
    yieldColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    stageTrigger: 'Stage 2 (물중탕 온도 85°C 초과)',
    icon: Flame,
    borderColor: 'border-rose-500/40',
    activeBg: 'bg-rose-950/30 ring-1 ring-rose-500/50',
    feCl3Status: '타르/분해 (암갈색 점조물, 측정 불가)',
    feCl3BadgeClass: 'bg-stone-800 text-amber-400 border-amber-900',
  },
  {
    mode: 'WARM_WASH',
    title: '미지근한 물 과다 세척 (재용해)',
    subtitleEn: 'Lukewarm Water Wash Loss',
    yieldBadge: '수득률 ~32%',
    yieldColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    stageTrigger: 'Stage 6 (25°C 상온수 세척)',
    icon: Waves,
    borderColor: 'border-sky-500/40',
    activeBg: 'bg-sky-950/30 ring-1 ring-sky-500/50',
    feCl3Status: '음성 (순도는 유지되나 수득량 붕괴)',
    feCl3BadgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
];

export const FailureScenarioControl: React.FC<FailureScenarioControlProps> = ({
  className = '',
  onOpenFeCl3Modal,
}) => {
  const failureMode = useAspirinStore((s) => s.failureMode);
  const setFailureMode = useAspirinStore((s) => s.setFailureMode);
  const setFailureModalOpen = useAspirinStore((s) => s.setFailureModalOpen);

  const activeDef = FAILURE_MODE_DEFINITIONS[failureMode] || FAILURE_MODE_DEFINITIONS.NONE;
  const activeCfg = SCENARIO_CONFIGS.find((c) => c.mode === failureMode) || SCENARIO_CONFIGS[0];

  const handleSelectMode = (mode: FailureMode) => {
    if (mode === failureMode) return;
    setFailureMode(mode);

    if (mode === 'NONE') {
      playClickSound();
    } else {
      playFailureWarningSound();
    }
  };

  const handleOpenFeCl3 = () => {
    playClickSound();
    if (onOpenFeCl3Modal) {
      onOpenFeCl3Modal();
    } else {
      setFailureModalOpen(true);
    }
  };

  return (
    <section
      data-testid="failure-scenario-control"
      aria-label="실험 실패 시나리오 제어판"
      className={`bg-lab-900/95 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-lg space-y-3 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>실험 실패 사례 분기 &amp; 오차 진단</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                What-If Branching
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              실제 화학 실험실의 3대 주요 실패 요인을 주입하여 수득률 급감 원인과 메커니즘을 탐구합니다.
            </p>
          </div>
        </div>

        {/* Action: FeCl3 Qualitative Test Launcher */}
        <button
          type="button"
          onClick={handleOpenFeCl3}
          data-testid="fecl3-test-launcher-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white transition-all text-xs font-mono font-bold shadow-[0_0_12px_rgba(168,85,247,0.15)] shrink-0 self-start sm:self-auto"
        >
          <TestTube className="w-3.5 h-3.5 text-purple-400" />
          <span>FeCl₃ 정성 시험 실행</span>
          <ArrowRight className="w-3 h-3 text-purple-400" />
        </button>
      </div>

      {/* 4-Scenario Quick Toggle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {SCENARIO_CONFIGS.map((cfg) => {
          const Icon = cfg.icon;
          const isSelected = failureMode === cfg.mode;

          return (
            <button
              key={cfg.mode}
              type="button"
              onClick={() => handleSelectMode(cfg.mode)}
              data-testid={`failure-btn-${cfg.mode}`}
              className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-1.5 cursor-pointer ${
                isSelected
                  ? `${cfg.activeBg} ${cfg.borderColor} shadow-md`
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1 rounded border shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-mono tracking-tight text-white truncate">
                      {cfg.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans truncate">{cfg.subtitleEn}</div>
                  </div>
                </div>
                {isSelected && (
                  <span className="flex h-2 w-2 relative shrink-0 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                <span className={`px-1.5 py-0.2 rounded border font-bold ${cfg.yieldColor}`}>
                  {cfg.yieldBadge}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{cfg.stageTrigger}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Diagnostic Callout for Active Scenario */}
      <div
        className={`p-3 rounded-lg border transition-all ${
          failureMode === 'NONE'
            ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
        }`}
      >
        {/* Banner Header & Action */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>선택된 시나리오 화학 메커니즘 분석</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${activeCfg.feCl3BadgeClass}`}
            >
              FeCl₃ 반응: {activeCfg.feCl3Status}
            </span>
          </div>

          {failureMode !== 'NONE' && (
            <button
              type="button"
              onClick={() => handleSelectMode('NONE')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
              title="정상 합성으로 복귀"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>정상 합성 복귀</span>
            </button>
          )}
        </div>

        {/* Structured Diagnosis 3-Row Compact Grid */}
        <div className="space-y-1 pt-2 text-xs font-sans">
          <div className="leading-snug text-slate-200">
            <span className="text-slate-400 font-semibold font-mono text-[11px]">[화학적 원인]: </span>
            <span>{activeDef.chemicalCause}</span>
          </div>

          <div className="leading-snug text-slate-300">
            <span className="text-slate-400 font-semibold font-mono text-[11px]">[관찰 현상]: </span>
            <span>{activeDef.observableOutcome}</span>
          </div>

          <div className="leading-snug text-slate-400">
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">[개선 대책]: </span>
            <span>{activeDef.remedyRecommendation}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FailureScenarioControl;
