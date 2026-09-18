/**
 * YieldCalculatorModal.tsx
 * Interactive Stoichiometry & Yield Calculation Activity Modal.
 * Calculates limiting reagent, theoretical yield, percent yield, and provides 8-tier diagnostic error feedback.
 */

import React, { useState } from 'react';
import { useAspirinStore } from '../../store/useAspirinStore';
import {
  Calculator,
  X,
  Scale,
  FlaskRound,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LatexSpan } from '../pedagogy/AcademicDeepDiveCard';
import { playClickSound } from '../../utils/audioSynthesizer';

export const YieldCalculatorModal: React.FC = () => {
  const isCalculatorOpen = useAspirinStore((s) => s.isCalculatorOpen);
  const setCalculatorOpen = useAspirinStore((s) => s.setCalculatorOpen);
  const stoichiometryInputs = useAspirinStore((s) => s.stoichiometryInputs);
  const stoichiometryResult = useAspirinStore((s) => s.stoichiometryResult);
  const updateStoichiometry = useAspirinStore((s) => s.updateStoichiometry);
  const failureMode = useAspirinStore((s) => s.failureMode);
  const setFailureMode = useAspirinStore((s) => s.setFailureMode);

  const [isDerivationOpen, setDerivationOpen] = useState(false);

  if (!isCalculatorOpen) return null;

  const { salicylicAcidMassG, aceticAnhydrideVolMl, actualYieldG = 0 } = stoichiometryInputs;
  const {
    salicylicAcidMoles,
    aceticAnhydrideMoles,
    limitingReagent,
    limitingReagentName,
    theoreticalYieldG,
    percentYield = 0,
    diagnostic,
    diagnosticFeedback,
  } = stoichiometryResult;

  const displayActualYield = stoichiometryResult.actualYieldG ?? actualYieldG;

  const handleInputChange = (partial: Partial<typeof stoichiometryInputs>) => {
    if (failureMode !== 'NONE') {
      setFailureMode('NONE');
    }
    updateStoichiometry(partial);
  };

  const applyPreset = (sa: number, aa: number, actual: number) => {
    playClickSound();
    handleInputChange({
      salicylicAcidMassG: sa,
      aceticAnhydrideVolMl: aa,
      actualYieldG: actual,
    });
  };

  const handleClose = () => {
    playClickSound();
    setCalculatorOpen(false);
  };

  return (
    <div
      data-testid="yield-calculator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                화학양론 한계반응물 & 수득률 계산기
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                반응물의 투입량과 건조 결정 질량을 바탕으로 이론적 수득량과 백분율 수득률을 산출합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            data-testid="close-calculator-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Presets Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-semibold">실험 프리셋:</span>
            <button
              type="button"
              onClick={() => applyPreset(2.0, 5.0, 2.15)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all"
              data-testid="reset-calculator-defaults-btn"
            >
              표준 실험 (2.00g / 5.00mL / 2.15g)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2.0, 5.0, 2.85)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all"
              data-testid="preset-wet-moisture-btn"
            >
              수분 미건조 오차 (&gt;100%)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2.0, 5.0, 1.15)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition-all"
            >
              미지근한 세척수 손실 (&lt;50%)
            </button>
          </div>

          {/* Input Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Salicylic Acid */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    살리실산 (C7H6O3)
                  </span>
                  <span className="font-mono text-slate-400">138.12 g/mol</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="10.0"
                    value={salicylicAcidMassG}
                    onChange={(e) =>
                      handleInputChange({
                        salicylicAcidMassG: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    data-testid="input-sa-mass"
                  />
                  <span className="text-xs font-mono text-slate-400">g</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={salicylicAcidMassG}
                  onChange={(e) =>
                    handleInputChange({
                      salicylicAcidMassG: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-2 accent-cyan-400"
                  data-testid="slider-sa-mass"
                />
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                몰수: {salicylicAcidMoles.toFixed(4)} mol
              </div>
            </div>

            {/* Acetic Anhydride */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <FlaskRound className="w-3.5 h-3.5 text-amber-400" />
                    무수아세트산
                  </span>
                  <span className="font-mono text-slate-400">ρ=1.082 g/mL</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="20.0"
                    value={aceticAnhydrideVolMl}
                    onChange={(e) =>
                      handleInputChange({
                        aceticAnhydrideVolMl: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    data-testid="input-aa-vol"
                  />
                  <span className="text-xs font-mono text-slate-400">mL</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={aceticAnhydrideVolMl}
                  onChange={(e) =>
                    handleInputChange({
                      aceticAnhydrideVolMl: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-2 accent-amber-400"
                />
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-amber-400">
                몰수: {aceticAnhydrideMoles.toFixed(4)} mol
              </div>
            </div>

            {/* Actual Dry Aspirin Yield */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-800/50 flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-cyan-300 mb-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    측정 결정 질량
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">건조 아스피린</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.0"
                    max="10.0"
                    value={displayActualYield}
                    onChange={(e) =>
                      handleInputChange({
                        actualYieldG: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-cyan-700 rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-200 font-bold focus:outline-none focus:border-cyan-400"
                    data-testid="input-actual-yield"
                  />
                  <span className="text-xs font-mono text-cyan-400 font-bold">g</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="6.0"
                  step="0.05"
                  value={displayActualYield}
                  onChange={(e) =>
                    handleInputChange({
                      actualYieldG: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-2 accent-cyan-400"
                />
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                몰질량: 180.16 g/mol
              </div>
            </div>
          </div>

          {/* Stoichiometry Result Display */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  한계 반응물 (Limiting)
                </span>
                <span
                  className="text-xs font-bold font-mono text-cyan-300"
                  data-testid="limiting-reagent-badge"
                >
                  {limitingReagentName || (limitingReagent === 'SALICYLIC_ACID' ? 'Salicylic Acid' : 'Acetic Anhydride')}
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  이론적 수득량
                </span>
                <span
                  className="text-sm font-bold font-mono text-white"
                  data-testid="theoretical-yield-g"
                >
                  {theoreticalYieldG.toFixed(3)} g
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  실제 수득량
                </span>
                <span className="text-sm font-bold font-mono text-white">
                  {displayActualYield.toFixed(2)} g
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-cyan-700/60 bg-cyan-950/20">
                <span className="text-[10px] font-mono text-cyan-400 block mb-1">
                  백분율 수득률 (%)
                </span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    percentYield > 100
                      ? 'text-amber-400'
                      : percentYield >= 75
                      ? 'text-emerald-400'
                      : 'text-cyan-300'
                  }`}
                  data-testid="percent-yield-value"
                >
                  {percentYield.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Yield Progress Bar */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>수득률 게이지</span>
                <span>{percentYield.toFixed(1)}% (기준 100%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentYield > 100
                      ? 'bg-amber-400'
                      : percentYield >= 70
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(percentYield, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Diagnostic Error Analysis Box */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 space-y-2">
            <div className="flex items-center gap-2">
              {percentYield > 100 ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : percentYield >= 70 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              )}
              <h4 className="text-xs font-bold font-mono text-white">
                {diagnostic?.title || '오차 분석 및 피드백'}
              </h4>
              {diagnostic?.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                  {diagnostic.badge}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {diagnostic?.description || diagnosticFeedback}
            </p>

            {diagnostic?.recommendation && (
              <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 p-2 rounded-lg">
                💡 실험실 권장사항: {diagnostic.recommendation}
              </div>
            )}
          </div>

          {/* Expandable KaTeX Derivation Panel */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDerivationOpen(!isDerivationOpen);
              }}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              data-testid="toggle-derivation-btn"
            >
              <span>📐 화학양론 수학적 유도 과정 상세 보기</span>
              {isDerivationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isDerivationOpen && (
              <div className="p-4 border-t border-slate-800 space-y-3 text-xs font-mono text-slate-300">
                <div>
                  <div className="text-cyan-400 font-bold mb-1">1. 살리실산(SA) 몰수 산출:</div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center overflow-x-auto">
                    <LatexSpan
                      math={
                        salicylicAcidMassG >= 0
                          ? `n_{\\text{SA}} = \\frac{m_{\\text{SA}}}{M_{\\text{SA}}} = \\frac{${salicylicAcidMassG.toFixed(2)}\\text{ g}}{138.121\\text{ g/mol}} = ${salicylicAcidMoles.toFixed(4)}\\text{ mol}`
                          : `n_{\\text{SA}} = 0.0000\\text{ mol (음수 질량 오류)}`
                      }
                      displayMode={true}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-amber-400 font-bold mb-1">2. 무수아세트산(AA) 질량 및 몰수 산출:</div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center overflow-x-auto">
                    <LatexSpan
                      math={
                        aceticAnhydrideVolMl >= 0
                          ? `n_{\\text{AA}} = \\frac{V_{\\text{AA}} \\times \\rho_{\\text{AA}}}{M_{\\text{AA}}} = \\frac{${aceticAnhydrideVolMl.toFixed(1)}\\text{ mL} \\times 1.082\\text{ g/mL}}{102.089\\text{ g/mol}} = ${aceticAnhydrideMoles.toFixed(4)}\\text{ mol}`
                          : `n_{\\text{AA}} = 0.0000\\text{ mol (음수 부피 오류)}`
                      }
                      displayMode={true}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-emerald-400 font-bold mb-1">3. 한계반응물 결정 및 이론적 수득량:</div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center overflow-x-auto">
                    <LatexSpan
                      math={`m_{\\text{theo}} = n_{\\text{limiting}} \\times M_{\\text{ASA}} = ${theoreticalYieldG.toFixed(3)}\\text{ g}`}
                      displayMode={true}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-purple-400 font-bold mb-1">4. 백분율 수득률(Percent Yield) 공식:</div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center overflow-x-auto">
                    <LatexSpan
                      math={
                        theoreticalYieldG > 0 && displayActualYield >= 0
                          ? `\\%\\text{Yield} = \\left(\\frac{m_{\\text{actual}}}{m_{\\text{theo}}}\\right) \\times 100\\% = \\left(\\frac{${displayActualYield.toFixed(2)}\\text{ g}}{${theoreticalYieldG.toFixed(3)}\\text{ g}}\\right) \\times 100\\% = ${percentYield.toFixed(1)}\\%`
                          : displayActualYield < 0
                          ? `\\%\\text{Yield} = 0.0\\%\\text{ (음수 질량 오류)}`
                          : `\\%\\text{Yield} = 0.0\\%\\text{ (이론적 수득량 0g)}`
                      }
                      displayMode={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => applyPreset(2.0, 5.0, 2.15)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기값 리셋
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default YieldCalculatorModal;
