/**
 * Centralized Zustand Simulation Store for Aspirin Synthesis
 * References: PROJECT.md, SPEC-KINETICS-ASA-2026, SPEC-UI-3D-PEDAGOGY-001
 */

import { create } from 'zustand';
import {
  FailureMode,
  StoichiometryInputs,
  StoichiometryResult,
  SynthesisStageId,
  ThermodynamicState,
  sanitizeStageId
} from '../engine/types';
import { calculateStoichiometry } from '../engine/stoichiometryEngine';
import { calculateThermodynamicState } from '../engine/thermodynamics';
import { calculateFailureImpact } from '../engine/failureModes';

export interface AspirinStoreState {
  currentStage: SynthesisStageId;
  failureMode: FailureMode;
  isPlaying: boolean;
  stageProgress: number;            // 0.0 to 1.0 within active loop
  playbackSpeed: number;            // 0.5x, 1.0x, 2.0x
  activeTab: 'ELI5' | 'DEEP_DIVE' | 'TELEMETRY';
  isCalculatorOpen: boolean;
  isFailureModalOpen: boolean;

  stoichiometryInputs: StoichiometryInputs;
  stoichiometryResult: StoichiometryResult;
  thermodynamics: ThermodynamicState;

  // Actions
  setStage: (stage: SynthesisStageId) => void;
  nextStage: () => void;
  prevStage: () => void;
  setFailureMode: (mode: FailureMode) => void;
  resetSimulation: () => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setStageProgress: (progress: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setActiveTab: (tab: 'ELI5' | 'DEEP_DIVE' | 'TELEMETRY') => void;
  setCalculatorOpen: (open: boolean) => void;
  setFailureModalOpen: (open: boolean) => void;
  updateStoichiometry: (inputs: Partial<StoichiometryInputs>) => void;
}

const DEFAULT_INPUTS: StoichiometryInputs = {
  salicylicAcidMassG: 2.00,
  aceticAnhydrideVolMl: 5.00,
  actualYieldG: 2.15,
};

/**
 * Computes stoichiometry result with failure mode overrides.
 */
export function computeStoreStoichiometry(
  inputs: StoichiometryInputs,
  mode: FailureMode
): StoichiometryResult {
  const baseResult = calculateStoichiometry(inputs);

  if (mode === 'NONE') {
    return baseResult;
  }

  const failureImpact = calculateFailureImpact(mode, baseResult.theoreticalYieldG);

  switch (mode) {
    case 'EARLY_WATER': {
      const res = calculateStoichiometry({
        ...inputs,
        actualYieldG: 0.0,
      });
      return {
        ...res,
        actualYieldG: 0.0,
        percentYield: 0.0,
        feedbackCategory: 'CRITICAL_ERROR',
        diagnosticFeedback:
          'Zero yield recovered: early water contamination caused premature hydrolysis of acetic anhydride before esterification could occur.',
        diagnostic: {
          category: 'ZERO_YIELD',
          badge: '오류 (사전 가수분해)',
          title: '조기 수분 혼입으로 인한 반응 완전 실패',
          description:
            '무수아세트산이 살리실산과 반응하기 전 수분에 의해 전량 아세트산으로 가수분해되었습니다.',
          recommendation: '모든 초자기구를 완전 건조 후 무수 조건에서 재실험하세요.'
        }
      };
    }

    case 'OVERHEATING': {
      const res = calculateStoichiometry({
        ...inputs,
        actualYieldG: failureImpact.simulatedYieldG,
      });
      return {
        ...res,
        actualYieldG: failureImpact.simulatedYieldG,
        percentYield: 12.5,
        feedbackCategory: 'CRITICAL_ERROR',
        diagnosticFeedback:
          'Severely diminished yield: thermal degradation (>85°C) caused self-condensation of salicylic acid and dark tar pitch formation.',
        diagnostic: {
          category: 'CRITICAL_FAILURE',
          badge: '과열 탄화',
          title: '고온 과열로 인한 타르(Pitch) 형성',
          description:
            '85°C 초과 고온에서 살리실산의 자기 축합 및 탈카복실화로 흑갈색 고분자 타르가 형성되었습니다.',
          recommendation: '물중탕 온도를 75~85°C로 엄격히 제어하세요.'
        }
      };
    }

    case 'WARM_WASH': {
      const washActualYield = Number((baseResult.theoreticalYieldG * 0.32).toFixed(4));
      const res = calculateStoichiometry({
        ...inputs,
        actualYieldG: washActualYield,
      });
      return {
        ...res,
        actualYieldG: washActualYield,
        percentYield: 32.0,
        feedbackCategory: 'WASH_LOSS',
        diagnosticFeedback:
          'Mass deficit detected: washing with lukewarm water caused excessive dissolution of the aspirin cake into the suction filtrate.',
        diagnostic: {
          category: 'SEVERE_LOSS',
          badge: '세척 손실',
          title: '미지근한 세척수로 인한 재용해 손실',
          description:
            '상온(25°C) 세척수로 인해 아스피린 결정이 흡인 여액으로 대량 용출되었습니다.',
          recommendation: '0~4°C로 냉각된 빙냉 증류수를 소량씩 사용하세요.'
        }
      };
    }

    default:
      return baseResult;
  }
}

const INITIAL_STOICHIOMETRY = computeStoreStoichiometry(DEFAULT_INPUTS, 'NONE');
const INITIAL_THERMO = calculateThermodynamicState(
  1,
  undefined,
  undefined,
  DEFAULT_INPUTS.salicylicAcidMassG,
  DEFAULT_INPUTS.aceticAnhydrideVolMl
);


export const useAspirinStore = create<AspirinStoreState>((set, get) => ({
  currentStage: 1,
  failureMode: 'NONE',
  isPlaying: true,
  stageProgress: 0.0,
  playbackSpeed: 1.0,
  activeTab: 'ELI5',
  isCalculatorOpen: false,
  isFailureModalOpen: false,

  stoichiometryInputs: DEFAULT_INPUTS,
  stoichiometryResult: INITIAL_STOICHIOMETRY,
  thermodynamics: INITIAL_THERMO,

  setStage: (stage: SynthesisStageId) => {
    const current = get().currentStage;
    const safeFallback: SynthesisStageId =
      typeof current === 'number' && Number.isInteger(current) && current >= 1 && current <= 6
        ? current
        : 1;
    const clampedStage = sanitizeStageId(stage, safeFallback);
    const { stoichiometryInputs, failureMode } = get();
    const newThermo = calculateThermodynamicState(
      clampedStage,
      undefined,
      undefined,
      stoichiometryInputs.salicylicAcidMassG,
      stoichiometryInputs.aceticAnhydrideVolMl,
      failureMode
    );

    set({
      currentStage: clampedStage,
      stageProgress: 0.0,
      thermodynamics: newThermo
    });
  },

  nextStage: () => {
    const safeCurrent = sanitizeStageId(get().currentStage, 1);
    if (safeCurrent < 6) {
      get().setStage((safeCurrent + 1) as SynthesisStageId);
    } else if (get().currentStage !== 6) {
      get().setStage(6);
    }
  },

  prevStage: () => {
    const safeCurrent = sanitizeStageId(get().currentStage, 1);
    if (safeCurrent > 1) {
      get().setStage((safeCurrent - 1) as SynthesisStageId);
    } else if (get().currentStage !== 1) {
      get().setStage(1);
    }
  },

  setFailureMode: (mode: FailureMode) => {
    const { currentStage, stoichiometryInputs } = get();
    const targetInputs: StoichiometryInputs = {
      ...stoichiometryInputs,
      actualYieldG: mode === 'NONE'
        ? (DEFAULT_INPUTS.actualYieldG ?? 2.15)
        : stoichiometryInputs.actualYieldG
    };
    const newStoich = computeStoreStoichiometry(targetInputs, mode);
    const newThermo = calculateThermodynamicState(
      currentStage,
      undefined,
      undefined,
      targetInputs.salicylicAcidMassG,
      targetInputs.aceticAnhydrideVolMl,
      mode
    );

    const updatedInputs: StoichiometryInputs = {
      ...targetInputs,
      actualYieldG: mode === 'NONE'
        ? (DEFAULT_INPUTS.actualYieldG ?? 2.15)
        : (newStoich.actualYieldG ?? targetInputs.actualYieldG)
    };

    set({
      failureMode: mode,
      stoichiometryInputs: updatedInputs,
      stoichiometryResult: newStoich,
      thermodynamics: newThermo
    });
  },

  resetSimulation: () => {
    const defaultThermo = calculateThermodynamicState(
      1,
      undefined,
      undefined,
      DEFAULT_INPUTS.salicylicAcidMassG,
      DEFAULT_INPUTS.aceticAnhydrideVolMl,
      'NONE'
    );
    const defaultStoich = computeStoreStoichiometry(DEFAULT_INPUTS, 'NONE');

    set({
      currentStage: 1,
      failureMode: 'NONE',
      isPlaying: true,
      stageProgress: 0.0,
      playbackSpeed: 1.0,
      activeTab: 'ELI5',
      stoichiometryInputs: DEFAULT_INPUTS,
      stoichiometryResult: defaultStoich,
      thermodynamics: defaultThermo
    });
  },

  setPlaying: (playing: boolean) => set({ isPlaying: playing }),

  togglePlaying: () => set(state => ({ isPlaying: !state.isPlaying })),

  setStageProgress: (progress: number) => {
    const num = typeof progress === 'number' && !Number.isNaN(progress) ? progress : 0.0;
    const clamped = Math.max(0.0, Math.min(1.0, num));
    set({ stageProgress: clamped });
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  setActiveTab: (tab: 'ELI5' | 'DEEP_DIVE' | 'TELEMETRY') => set({ activeTab: tab }),

  setCalculatorOpen: (open: boolean) => set({ isCalculatorOpen: open }),

  setFailureModalOpen: (open: boolean) => set({ isFailureModalOpen: open }),

  updateStoichiometry: (inputs: Partial<StoichiometryInputs>) => {
    const currentInputs = get().stoichiometryInputs;
    const mergedInputs: StoichiometryInputs = {
      salicylicAcidMassG: inputs.salicylicAcidMassG !== undefined
        ? inputs.salicylicAcidMassG
        : currentInputs.salicylicAcidMassG,
      aceticAnhydrideVolMl: inputs.aceticAnhydrideVolMl !== undefined
        ? inputs.aceticAnhydrideVolMl
        : currentInputs.aceticAnhydrideVolMl,
      actualYieldG: inputs.actualYieldG !== undefined
        ? inputs.actualYieldG
        : currentInputs.actualYieldG
    };

    const { currentStage, failureMode } = get();
    const newResult = computeStoreStoichiometry(mergedInputs, failureMode);
    const newThermo = calculateThermodynamicState(
      currentStage,
      undefined,
      undefined,
      mergedInputs.salicylicAcidMassG,
      mergedInputs.aceticAnhydrideVolMl,
      failureMode
    );

    set({
      stoichiometryInputs: mergedInputs,
      stoichiometryResult: newResult,
      thermodynamics: newThermo
    });
  }
}));
