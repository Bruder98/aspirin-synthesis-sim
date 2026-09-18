/**
 * Laboratory Failure Modes & Error Diagnostic Engine
 * References: SPEC-KINETICS-ASA-2026, Section 4
 */

import { FailureMode, FailureModeDetails } from './types';

export const FAILURE_MODE_DEFINITIONS: Record<FailureMode, FailureModeDetails> = {
  NONE: {
    mode: 'NONE',
    nameKo: '정상 실험군 (대조군)',
    nameEn: 'Standard Protocol (Control)',
    description: '표준 프로토콜에 따라 건조된 초자기구, 80°C 항온 수조, 얼음물 준안정 냉각, 급격 반용매 결정화, 0~4°C 빙냉수 세척을 순차적으로 수행합니다.',
    triggerStage: 1,
    chemicalCause: '정상 에스테르화 친핵성 아실 치환 반응 완결 및 반용매 첨가에 의한 완전 상분리 결정화',
    observableOutcome: '투명 무색 반응액 -> 얼음물 투명 유지(준안정) -> 증류수 첨가 즉시 눈꽃 침상 결정 폭발적 분출 -> 순백색 고체 케이크 회수',
    feCl3TestResult: 'BUFF_NEGATIVE',
    feCl3ColorHex: '#EAB308', // Pale yellow / buff
    expectedYieldPercentRange: [82.0, 88.0],
    remedyRecommendation: '표준 절차가 완벽히 준수되었습니다. 순도 확인을 위해 135~136°C 녹는점 측정을 진행하세요.'
  },
  EARLY_WATER: {
    mode: 'EARLY_WATER',
    nameKo: '사전 수분 혼입 (조기 가수분해)',
    nameEn: 'Early Water Contamination',
    description: '반응 전 또는 가열 초기 단계에서 초자기구의 물기나 수증기가 유입되어 무수아세트산이 살리실산과 반응하기 전에 먼저 분해됩니다.',
    triggerStage: 2,
    chemicalCause: '무수아세트산의 물에 대한 친핵 반응 속도가 페놀성 -OH보다 약 22.4배 빨라 (khyd >> kest), 아세틸화제가 살리실산 반응 전 전량 아세트산으로 소모됨',
    observableOutcome: '가열 중 산성 증기 급격 발생, 살리실산 미반응 잔류, 증류수를 추가 투입해도 침상 아스피린 결정이 전혀 석출되지 않음',
    feCl3TestResult: 'VIOLET_POSITIVE',
    feCl3ColorHex: '#7E22CE', // Deep violet / purple ([Fe(salicylate)3]3-)
    expectedYieldPercentRange: [0.0, 5.0],
    remedyRecommendation: '초자기구를 100°C 오븐이나 드라이어로 완전히 건조시키고, 수증기가 플라스크 내부로 응축되지 않도록 주의하세요.'
  },
  OVERHEATING: {
    mode: 'OVERHEATING',
    nameKo: '고온 과열 탄화 (>85°C 타르 형성)',
    nameEn: 'Thermal Overheating (>85°C)',
    description: '물중탕 온도가 85°C를 초과하여 (95~100°C 끓는물 또는 직화 가열) 살리실산 분자 간 자기 축합 및 탈카복실화 반응이 유발됩니다.',
    triggerStage: 2,
    chemicalCause: '고온 및 산 촉매 하에서 살리실산의 분자 간 자기 축합(폴리살리실레이트 에스테르) 및 페놀로의 탈카복실화, 퀴논계 고분자 타르(Pitch) 형성',
    observableOutcome: '플라스크 용액이 황색 -> 호박색 -> 흑갈색으로 변색되며 역한 냄새 발생. 냉각 후에도 끈적한 암갈색 타르가 기벽에 달라붙음',
    feCl3TestResult: 'TAR_INCONCLUSIVE',
    feCl3ColorHex: '#451A03', // Muddy dark brown
    expectedYieldPercentRange: [5.0, 20.0],
    remedyRecommendation: '반드시 온도계가 장착된 항온 물중탕을 사용하여 반응 온도를 75~85°C 사이로 정밀하게 제어하세요.'
  },
  WARM_WASH: {
    mode: 'WARM_WASH',
    nameKo: '미지근한 세척수로 인한 재용해 손실',
    nameEn: 'Lukewarm Water Wash Loss',
    description: '합성과 결정화는 성공적이었으나, 감압 여과 시 뷔히너 깔때기의 결정을 상온(25°C) 또는 미지근한 물(>30°C)로 과량 세척하여 결정이 녹아내립니다.',
    triggerStage: 6,
    chemicalCause: '아스피린의 수용해도 급상승 (0°C: 0.22 g/100 mL -> 25°C: 0.33 g/100 mL -> 37°C: 1.00 g/100 mL). 온수 통과 시 다량의 아스피린이 흡인 여액으로 용출됨',
    observableOutcome: '뷔히너 깔때기 위에서 순백색 결정 케이크가 눈에 띄게 얇아지고 침식되며, 여과 플라스크 하부로 아스피린이 대거 빠져나감',
    feCl3TestResult: 'BUFF_NEGATIVE',
    feCl3ColorHex: '#EAB308', // Remaining solid is pure ASA
    expectedYieldPercentRange: [30.0, 45.0],
    remedyRecommendation: '세척수는 반드시 얼음물 수조에서 0~4°C로 충분히 예냉된 증류수를 3~5 mL씩 소량만 나누어 사용하세요.'
  }
};

/**
 * Returns full details for a failure mode.
 */
export function getFailureModeDetails(mode: FailureMode): FailureModeDetails {
  return FAILURE_MODE_DEFINITIONS[mode] ?? FAILURE_MODE_DEFINITIONS.NONE;
}

/**
 * Calculates the yield reduction and physical outcome of an active failure mode.
 */
export function calculateFailureImpact(
  mode: FailureMode,
  theoreticalYieldG: number
): {
  simulatedYieldG: number;
  simulatedPercentYield: number;
  feCl3TestResult: 'VIOLET_POSITIVE' | 'BUFF_NEGATIVE' | 'TAR_INCONCLUSIVE';
  feCl3ColorHex: string;
  isFatal: boolean;
  statusMessage: string;
} {
  const details = getFailureModeDetails(mode);
  const [minY, maxY] = details.expectedYieldPercentRange;
  const avgPercent = (minY + maxY) / 2;
  const simulatedYieldG = Math.round(((theoreticalYieldG * avgPercent) / 100) * 1000) / 1000;

  return {
    simulatedYieldG,
    simulatedPercentYield: avgPercent,
    feCl3TestResult: details.feCl3TestResult,
    feCl3ColorHex: details.feCl3ColorHex,
    isFatal: mode === 'EARLY_WATER' || mode === 'OVERHEATING',
    statusMessage: details.observableOutcome
  };
}

/**
 * Returns all failure modes as an array for UI dropdowns and controls.
 */
export function getAllFailureModes(): FailureModeDetails[] {
  return Object.values(FAILURE_MODE_DEFINITIONS);
}
