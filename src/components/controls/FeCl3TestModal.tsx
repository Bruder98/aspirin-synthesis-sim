/**
 * FeCl3TestModal.tsx
 * Interactive Iron(III) Chloride (FeCl3) Phenolic -OH Qualitative Color Test Modal.
 * Renders color comparison cuvettes/test tubes, KaTeX chemical coordination equations,
 * and analytical significance explaining why aspirin synthesis purity is verified with FeCl3.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import { useAspirinStore } from '../../store/useAspirinStore';
import { FailureMode } from '../../engine/types';
import {
  playClickSound,
  playFailureWarningSound,
  playSuccessChime,
} from '../../utils/audioSynthesizer';
import {
  X,
  TestTube,
  Pipette,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
  Beaker,
  Droplet,
} from 'lucide-react';

export interface FeCl3TestModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const FeCl3TestModal: React.FC<FeCl3TestModalProps> = ({
  isOpen: propIsOpen,
  onClose,
}) => {
  const storeIsOpen = useAspirinStore((s) => s.isFailureModalOpen);
  const setStoreIsOpen = useAspirinStore((s) => s.setFailureModalOpen);
  const failureMode = useAspirinStore((s) => s.failureMode);

  const isVisible = propIsOpen !== undefined ? propIsOpen : storeIsOpen;

  const [dropsCount, setDropsCount] = useState<number>(0);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
        dropTimerRef.current = null;
      }
    };
  }, []);

  // Reset drops count whenever modal opens, and cancel any pending drop timer when modal closes
  useEffect(() => {
    if (isVisible) {
      setDropsCount(0);
      setIsDropping(false);
    } else if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
  }, [isVisible]);

  // Handle Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleClose = () => {
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    playClickSound();
    if (onClose) {
      onClose();
    }
    setStoreIsOpen(false);
  };

  const handleAddDrops = () => {
    if (isDropping) return;
    setIsDropping(true);
    playClickSound();

    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
    }

    dropTimerRef.current = setTimeout(() => {
      const nextDrops = dropsCount + 1;
      setDropsCount(nextDrops);
      setIsDropping(false);
      dropTimerRef.current = null;

      // Play diagnostic sound based on test outcome
      if (failureMode === 'EARLY_WATER') {
        playFailureWarningSound();
      } else if (failureMode === 'NONE' || failureMode === 'WARM_WASH') {
        playSuccessChime();
      } else if (failureMode === 'OVERHEATING') {
        playFailureWarningSound();
      }
    }, 400);
  };

  const handleResetTest = () => {
    playClickSound();
    setDropsCount(0);
  };

  // Render KaTeX formulas safely
  const renderFormula = (formula: string, displayMode = false) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      return formula;
    }
  };

  if (!isVisible) return null;

  // Determine current tube dynamic state based on failureMode and dropsCount
  const getCurrentTubeDetails = () => {
    if (dropsCount === 0) {
      return {
        colorClass: 'bg-amber-100/40 border-amber-200/30',
        liquidStyle: { backgroundColor: 'rgba(254, 243, 199, 0.35)' },
        statusLabel: '시약 투여 대기 중 (Clear Solution)',
        statusBadge: 'text-slate-400 bg-slate-800 border-slate-700',
        resultCategory: 'PENDING',
        description: '무색~미황색의 반응 조생성물 용액입니다. FeCl₃ 시약을 적하하여 페놀기를 확인하세요.',
      };
    }

    switch (failureMode) {
      case 'EARLY_WATER':
        return {
          colorClass: 'bg-purple-900 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.5)]',
          liquidStyle: {
            backgroundColor: '#6B21A8',
            background: 'linear-gradient(180deg, #9333EA 0%, #581C87 70%, #3B0764 100%)',
          },
          statusLabel: '강양성 (Positive, 진한 보라색)',
          statusBadge: 'text-purple-300 bg-purple-950 border-purple-500 font-bold animate-pulse',
          resultCategory: 'POSITIVE_FAIL',
          description:
            '조기 수분 혼입으로 무수아세트산이 전량 소모되어, 살리실산이 전혀 아세틸화되지 못하고 미반응 상태로 잔류했습니다. 유리 페놀성 -OH가 Fe³⁺와 착물을 형성하여 짙은 보라색을 띱니다 (합성 실패 100%).',
        };

      case 'OVERHEATING':
        return {
          colorClass: 'bg-stone-900 border-amber-800 shadow-[0_0_20px_rgba(120,53,15,0.4)]',
          liquidStyle: {
            backgroundColor: '#451A03',
            background: 'linear-gradient(180deg, #78350F 0%, #451A03 60%, #1C1917 100%)',
          },
          statusLabel: '타르 변색 / 측정 불가 (Dark Murky Brown)',
          statusBadge: 'text-amber-400 bg-stone-900 border-amber-900 font-bold',
          resultCategory: 'TAR_FAIL',
          description:
            '85°C 초과 과열로 살리실산의 자기축합 및 탈카복실화가 진행되어 흑갈색 고분자 타르가 형성되었습니다. 착물 발색이 타르 색상에 묻혀 식별이 어렵습니다.',
        };

      case 'WARM_WASH':
        return {
          colorClass: 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
          liquidStyle: {
            backgroundColor: '#F59E0B',
            background: 'linear-gradient(180deg, #FDE68A 0%, #F59E0B 70%, #D97706 100%)',
          },
          statusLabel: '음성 (Negative, 담황색)',
          statusBadge: 'text-emerald-300 bg-emerald-950 border-emerald-500 font-bold',
          resultCategory: 'NEGATIVE_LOW_YIELD',
          description:
            '미지근한 물에 결정을 대량 잃었으나, 잔류한 결정 자체는 아세틸화가 완결된 순수 아스피린입니다. 유리 페놀기가 없어 Fe³⁺ 착물을 형성하지 않고 FeCl₃ 고유의 담황색을 띱니다 (순도는 정상).',
        };

      case 'NONE':
      default:
        return {
          colorClass: 'bg-amber-400/25 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
          liquidStyle: {
            backgroundColor: '#EAB308',
            background: 'linear-gradient(180deg, #FEF08A 0%, #FACC15 65%, #CA8A04 100%)',
          },
          statusLabel: '음성 (Negative, 투명 담황색)',
          statusBadge: 'text-emerald-300 bg-emerald-950 border-emerald-500 font-bold',
          resultCategory: 'NEGATIVE_SUCCESS',
          description:
            '완벽한 에스테르화 완결! 살리실산의 페놀성 -OH기가 아세틸기(-OCOCH₃)로 치환되어 Fe³⁺와 착물을 형성하지 않습니다. FeCl₃ 자체의 옅은 노란색/호박색을 띱니다 (고순도 아스피린 입증).',
        };
    }
  };

  const currentTube = getCurrentTubeDetails();

  return (
    <div
      data-testid="fecl3-test-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <TestTube className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-display">
                  염화철(III) (FeCl₃) 페놀성 히드록시기(-OH) 정성 시험
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  Purity Assay
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                아스피린의 아세틸화 완결 여부 및 미반응 살리실산의 불순물 잔류를 색채 반응으로 진단합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            data-testid="close-fecl3-modal-btn"
            aria-label="닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Section 1: Chemical Coordination Reaction & KaTeX Equation */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>철(III)-살리실레이트 배위 착물 형성 반응식 (KaTeX)</span>
              </span>
              <span className="text-[11px] text-slate-400">λ_max ≈ 530 nm (Violet)</span>
            </div>

            <div className="text-center py-2 px-3 bg-slate-900/90 rounded-lg border border-slate-800 text-sm sm:text-base font-mono overflow-x-auto text-purple-200">
              <span
                dangerouslySetInnerHTML={{
                  __html: renderFormula(
                    '\\mathrm{Fe^{3+} + C_7H_6O_3 \\rightleftharpoons [Fe(C_7H_5O_3)]^+ + H^+}',
                    true
                  ),
                }}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              페놀성 히드록시기(Phenolic -OH)를 가진 살리실산 분자는 Fe³⁺ 이온에 배위하여 강한 전하 이동 전이(Ligand-to-Metal Charge Transfer, LMCT)를 일으키며 530nm 파장의 빛을 흡수하고 짙은 보라색을 방출합니다.
            </p>
          </div>

          {/* Section 2: Interactive Test Tubes Comparison Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                <Beaker className="w-4 h-4 text-cyan-400" />
                <span>비색 시험관 대조군 및 현재 시료 비교</span>
              </h3>

              {/* Action Buttons: Add Drop & Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddDrops}
                  disabled={isDropping}
                  data-testid="add-fecl3-drops-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95"
                >
                  <Pipette className={`w-3.5 h-3.5 ${isDropping ? 'animate-bounce' : ''}`} />
                  <span>1% FeCl₃ 적하 ({dropsCount}방울)</span>
                </button>

                {dropsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetTest}
                    data-testid="reset-fecl3-test-btn"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="시험관 세척 및 초기화"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 3 Cuvettes / Test Tubes Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tube 1: Positive Control - Salicylic Acid */}
              <div
                data-testid="cuvette-control-sa"
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center gap-3 relative"
              >
                <div className="text-[11px] font-mono font-bold text-slate-400 text-center">
                  [양성 대조군]<br />살리실산 원료 (Salicylic Acid)
                </div>

                {/* Test Tube Graphic */}
                <div className="w-14 h-36 rounded-b-full border-2 border-slate-600/80 bg-slate-900/60 relative overflow-hidden flex flex-col justify-end p-1 shadow-inner">
                  {/* Glass Reflection */}
                  <div className="absolute top-2 left-1.5 w-1 h-28 bg-white/10 rounded-full z-10" />
                  {/* Liquid */}
                  <div
                    className="w-full rounded-b-full transition-all duration-700"
                    style={{
                      height: dropsCount > 0 ? '70%' : '50%',
                      backgroundColor: dropsCount > 0 ? '#6B21A8' : '#FEF3C7',
                      background:
                        dropsCount > 0
                          ? 'linear-gradient(180deg, #9333EA 0%, #581C87 100%)'
                          : 'rgba(254, 243, 199, 0.4)',
                    }}
                  />
                </div>

                <div className="w-full space-y-1 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40">
                    {dropsCount > 0 ? '양성: 짙은 보라색' : '적하 전 (미황색)'}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    유리 페놀성 -OH 풍부 → Fe³⁺ 착물 형성
                  </p>
                </div>
              </div>

              {/* Tube 2: Negative Control - Pure Aspirin */}
              <div
                data-testid="cuvette-control-aspirin"
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center gap-3 relative"
              >
                <div className="text-[11px] font-mono font-bold text-slate-400 text-center">
                  [음성 대조군]<br />정제 아스피린 (Pure Aspirin)
                </div>

                {/* Test Tube Graphic */}
                <div className="w-14 h-36 rounded-b-full border-2 border-slate-600/80 bg-slate-900/60 relative overflow-hidden flex flex-col justify-end p-1 shadow-inner">
                  <div className="absolute top-2 left-1.5 w-1 h-28 bg-white/10 rounded-full z-10" />
                  <div
                    className="w-full rounded-b-full transition-all duration-700"
                    style={{
                      height: dropsCount > 0 ? '70%' : '50%',
                      backgroundColor: dropsCount > 0 ? '#EAB308' : '#FEF3C7',
                      background:
                        dropsCount > 0
                          ? 'linear-gradient(180deg, #FEF08A 0%, #FACC15 100%)'
                          : 'rgba(254, 243, 199, 0.4)',
                    }}
                  />
                </div>

                <div className="w-full space-y-1 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40">
                    {dropsCount > 0 ? '음성: 담황색 (FeCl₃색)' : '적하 전 (미황색)'}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    페놀기 아세틸화 완결 → 착물 미형성
                  </p>
                </div>
              </div>

              {/* Tube 3: Current Experiment Sample */}
              <div
                data-testid="cuvette-current"
                className={`bg-slate-950/80 rounded-xl p-3.5 flex flex-col items-center gap-3 relative border-2 ${
                  dropsCount > 0
                    ? failureMode === 'EARLY_WATER'
                      ? 'border-purple-500 bg-purple-950/20'
                      : failureMode === 'OVERHEATING'
                      ? 'border-stone-600 bg-stone-950/40'
                      : 'border-emerald-500 bg-emerald-950/20'
                    : 'border-cyan-500/40'
                }`}
              >
                <div className="text-[11px] font-mono font-bold text-cyan-300 text-center">
                  [현재 합성 시료]<br />
                  <span className="text-[10px] text-slate-400">분기: {failureMode}</span>
                </div>

                {/* Test Tube Graphic */}
                <div className="w-14 h-36 rounded-b-full border-2 border-cyan-500/60 bg-slate-900/60 relative overflow-hidden flex flex-col justify-end p-1 shadow-inner">
                  <div className="absolute top-2 left-1.5 w-1 h-28 bg-white/20 rounded-full z-10" />
                  <div
                    className="w-full rounded-b-full transition-all duration-700"
                    style={{
                      height: dropsCount > 0 ? '70%' : '50%',
                      ...currentTube.liquidStyle,
                    }}
                  />
                </div>

                <div className="w-full space-y-1 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${currentTube.statusBadge}`}
                  >
                    {currentTube.statusLabel}
                  </span>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {dropsCount > 0 ? '색채 반응 발색 완료' : 'FeCl₃ 적하 대기'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Result Diagnostic Card */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>현재 시료 분석 결과 진단:</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">
                {currentTube.description}
              </p>
            </div>
          </div>

          {/* Section 3: Analytical Significance & Pedagogical Explanation */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>화학적·약학적 분석 의의 (Analytical Significance)</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-2 font-sans leading-relaxed">
              <p>
                <strong className="text-white font-mono">1. 에스테르화의 표적 작용기 확인:</strong> 살리실산의 카복실기(-COOH)는 에스테르화 후에도 유지되지만, 페놀성 히드록시기(-OH)는 아세틸기(-OCOCH₃)로 완전 치환됩니다. 따라서 생성물에 잔류하는 -OH의 유무는 반응 완결도의 직접적인 척도가 됩니다.
              </p>
              <p>
                <strong className="text-white font-mono">2. 의약품 순도 및 위장관 독성 예방:</strong> 미반응 살리실산 불순물은 위 점막에 강한 자극과 궤양을 유발할 수 있으므로, 약전 규격(USP/KP)에서는 FeCl₃ 정성 시험에서 어떠한 보라색 착물도 검출되지 않아야 함(유리 살리실산 함량 0.1% 이하)을 엄격히 규정합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>FeCl₃ Qualitative Phenolic Colorimetry Test</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeCl3TestModal;
