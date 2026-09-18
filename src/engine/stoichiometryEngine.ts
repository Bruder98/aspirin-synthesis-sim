/**
 * Stoichiometry & Yield Calculation Engine for Aspirin Synthesis
 * References: SPEC-KINETICS-ASA-2026, Section 5
 */

import {
  DiagnosticCategory,
  FeedbackCategory,
  StoichiometryInputs,
  StoichiometryResult,
  YieldDiagnostic
} from './types';

export const STOICHIOMETRY_CONSTANTS = {
  MW_SALICYLIC_ACID: 138.121,      // g/mol
  MW_ACETIC_ANHYDRIDE: 102.089,    // g/mol
  DENSITY_ACETIC_ANHYDRIDE: 1.082, // g/mL
  MW_ASPIRIN: 180.158,             // g/mol
  MW_ACETIC_ACID: 60.052,          // g/mol
} as const;

/**
 * Diagnostic feedback generator according to 8-tier grading matrix.
 */
export function evaluateYieldDiagnostic(
  actualYieldG?: number,
  theoreticalYieldG?: number,
  percentYield?: number
): { diagnostic: YieldDiagnostic; feedbackCategory: FeedbackCategory } {
  // Case 1: No actual yield entered
  if (actualYieldG === undefined) {
    return {
      diagnostic: {
        category: 'NORMAL_TYPICAL',
        badge: 'ℹ️ Awaiting Measurement',
        title: '측정 대기 중',
        description: '합성 및 건조된 아스피린의 실제 질량을 입력하면 수득률 및 오차 분석 진단이 제공됩니다.',
        recommendation: '실험 완료 후 건조된 분말 질량을 저울로 측정하여 입력하세요.'
      },
      feedbackCategory: 'EXCELLENT'
    };
  }

  // Tier 1: Negative input
  if (actualYieldG < 0) {
    return {
      diagnostic: {
        category: 'INVALID_INPUT',
        badge: '⛔ Invalid Mass',
        title: '음수 질량 오류 (Invalid Mass)',
        description: '입력된 측정 질량이 0보다 작습니다. 질량은 물리적으로 음수가 될 수 없습니다.',
        recommendation: '저울의 영점(Tare)을 확인하고 0 이상의 올바른 수치를 입력하세요.'
      },
      feedbackCategory: 'CRITICAL_ERROR'
    };
  }

  // Case 2: Zero or invalid theoretical yield (missing reactants)
  if (theoreticalYieldG === undefined || theoreticalYieldG <= 0) {
    return {
      diagnostic: {
        category: 'INVALID_INPUT',
        badge: '⚠️ No Reactants',
        title: '반응물 투입량 부족 (Zero Theoretical Yield)',
        description: '살리실산 또는 무수아세트산의 투입량이 0이어서 이론적 수득량을 계산할 수 없습니다.',
        recommendation: '살리실산과 무수아세트산을 적정량 투입한 후 계산을 진행하세요.'
      },
      feedbackCategory: 'CRITICAL_ERROR'
    };
  }

  // Case 3: Percent yield undefined fallback
  if (percentYield === undefined) {
    return {
      diagnostic: {
        category: 'NORMAL_TYPICAL',
        badge: 'ℹ️ Awaiting Measurement',
        title: '측정 대기 중',
        description: '합성 및 건조된 아스피린의 실제 질량을 입력하면 수득률 및 오차 분석 진단이 제공됩니다.',
        recommendation: '실험 완료 후 건조된 분말 질량을 저울로 측정하여 입력하세요.'
      },
      feedbackCategory: 'EXCELLENT'
    };
  }

  // Tier 2: Exactly zero yield
  if (actualYieldG === 0) {
    return {
      diagnostic: {
        category: 'ZERO_YIELD',
        badge: '❌ Zero Yield',
        title: '수득량 제로 (Zero Yield)',
        description: '회수된 생성물이 0 g으로 기록되었습니다. 결정 석출에 실패했거나 전량이 유실되었습니다.',
        recommendation: '촉매 첨가 여부, 가열 완결성, 증류수 반용매 투입 절차를 전면 점검하세요.'
      },
      feedbackCategory: 'CRITICAL_ERROR'
    };
  }

  // Tier 8: Greater than 105% (Moisture excess)
  if (percentYield > 105.0) {
    return {
      diagnostic: {
        category: 'MOISTURE_EXCESS',
        badge: '⚠️ Wet / Moisture Excess',
        title: '수분 과다 잔류 경고 (Moisture Excess)',
        description: `수득률이 100% 이론적 한계를 초과했습니다 (${percentYield.toFixed(1)}%). 생성물이 완전히 건조되지 않아 결정 격자 사이에 용매 및 수분이 다량 포획되어 있습니다.`,
        recommendation: '진공 데시케이터 또는 50°C 건조기에서 30분간 추가 건조 후 항량에 도달할 때까지 재칭량하세요.'
      },
      feedbackCategory: 'HIGH_MOISTURE'
    };
  }

  // Tier 7: 90.0% ~ 105.0% (Excellent)
  if (percentYield >= 90.0) {
    return {
      diagnostic: {
        category: 'EXCELLENT',
        badge: '🌟 Outstanding Recovery',
        title: '최우수 정량 수득 (Outstanding Recovery)',
        description: `최우수 실험 결과: 이론적 최대치에 매우 근접한 탁월한 수득률입니다 (${percentYield.toFixed(1)}%). 에스테르화 반응 완결 및 반용매 결정화 상평형이 완벽히 달성되었습니다.`,
        recommendation: '모범적인 실험 프로토콜이 수행되었습니다. 녹는점 측정(135~136°C)으로 순도를 최종 검증하세요.'
      },
      feedbackCategory: 'EXCELLENT'
    };
  }

  // Tier 6: 70.0% ~ 89.9% (Normal Typical Lab Yield)
  if (percentYield >= 70.0) {
    return {
      diagnostic: {
        category: 'NORMAL_TYPICAL',
        badge: '✅ Good Standard Yield',
        title: '표준 학부 실험 수득률 (Good Standard Yield)',
        description: `대학 일반화학 및 유기화학 실습의 표준 기대 수득률 범위입니다 (${percentYield.toFixed(1)}%). 냉각 모액 용해도 손실과 플라스크 기벽 잔류가 정상 수준입니다.`,
        recommendation: '재결정화(에탄올-물계)를 수행하면 제약 등급의 고순도 침상 결정을 얻을 수 있습니다.'
      },
      feedbackCategory: 'EXCELLENT'
    };
  }

  // Tier 5: 50.0% ~ 69.9% (Moderate Loss)
  if (percentYield >= 50.0) {
    return {
      diagnostic: {
        category: 'MODERATE_LOSS',
        badge: '⚠️ Moderate Yield Loss',
        title: '중등도 수득량 저하 (Moderate Loss)',
        description: `수득률이 다소 저하되었습니다 (${percentYield.toFixed(1)}%). 얼음물 수조에서의 결정 숙성 시간 부족, 불충분한 냉각 온도(>10°C), 또는 여과 과정의 물리적 이송 손실이 원인입니다.`,
        recommendation: '증류수 투입 후 얼음물에서 최소 15분 이상 방치하여 오스트발트 라이프닝을 충분히 거친 뒤 여과하세요.'
      },
      feedbackCategory: 'PARTIAL_CONVERSION'
    };
  }

  // Tier 4: 20.0% ~ 49.9% (Severe Loss)
  if (percentYield >= 20.0) {
    return {
      diagnostic: {
        category: 'SEVERE_LOSS',
        badge: '🚨 Severe Loss',
        title: '심각한 수득량 손실 (Severe Loss)',
        description: `절반 이상의 생성물이 유실되었습니다 (${percentYield.toFixed(1)}%). 주요 원인: 뷔히너 깔때기 세척 시 상온/미지근한 물(>25°C)을 사용하여 결정이 모액으로 재용해되었거나, 가열 시간이 5분 미만으로 극히 짧았습니다.`,
        recommendation: '세척수는 반드시 0~4°C 빙냉수를 사용하고 세척액의 양을 최소화(3~5 mL씩 2회)하십시오.'
      },
      feedbackCategory: 'WASH_LOSS'
    };
  }

  // Tier 3: 0.0% < percentYield < 20.0% (Critical Failure)
  return {
    diagnostic: {
      category: 'CRITICAL_FAILURE',
      badge: '❌ Synthesis Failed',
      title: '합성 치명적 실패 (Critical Failure)',
      description: `반응이 거의 진행되지 않았거나 치명적인 조작 실수가 발생했습니다 (${percentYield.toFixed(1)}%). 조기 수분 혼입으로 무수아세트산이 가수분해되었거나, 인산 촉매가 누락되었을 가능성이 높습니다.`,
      recommendation: '초자기구를 완전히 건조시킨 후 재실험하고, 염화철(FeCl3) 시험으로 미반응 살리실산 잔류 여부를 확인하세요.'
    },
    feedbackCategory: 'CRITICAL_ERROR'
  };
}

/**
 * Calculates stoichiometry: moles, limiting reagent, theoretical yield, percent yield, and diagnostics.
 */
export function calculateStoichiometry(inputs: StoichiometryInputs): StoichiometryResult {
  const saMass = Math.max(0, inputs.salicylicAcidMassG);
  const aaVol = Math.max(0, inputs.aceticAnhydrideVolMl);

  // 1. Moles of Salicylic Acid: n_SA = m_SA / M_SA
  const salicylicAcidMoles = saMass > 0
    ? saMass / STOICHIOMETRY_CONSTANTS.MW_SALICYLIC_ACID
    : 0;

  // 2. Mass & Moles of Acetic Anhydride: m_AA = V_AA * rho, n_AA = m_AA / M_AA
  const aceticAnhydrideMassG = aaVol * STOICHIOMETRY_CONSTANTS.DENSITY_ACETIC_ANHYDRIDE;
  const aceticAnhydrideMoles = aceticAnhydrideMassG > 0
    ? aceticAnhydrideMassG / STOICHIOMETRY_CONSTANTS.MW_ACETIC_ANHYDRIDE
    : 0;

  // 3. Limiting Reagent Determination (1:1 stoichiometry)
  let limitingReagent: 'SALICYLIC_ACID' | 'ACETIC_ANHYDRIDE' = 'SALICYLIC_ACID';
  let limitingReagentName: 'Salicylic Acid' | 'Acetic Anhydride' = 'Salicylic Acid';
  let limitingReagentMoles = 0;
  let excessReagentPercent = 0;

  if (salicylicAcidMoles <= aceticAnhydrideMoles) {
    limitingReagent = 'SALICYLIC_ACID';
    limitingReagentName = 'Salicylic Acid';
    limitingReagentMoles = salicylicAcidMoles;
    if (salicylicAcidMoles > 0) {
      excessReagentPercent = ((aceticAnhydrideMoles - salicylicAcidMoles) / salicylicAcidMoles) * 100;
    }
  } else {
    limitingReagent = 'ACETIC_ANHYDRIDE';
    limitingReagentName = 'Acetic Anhydride';
    limitingReagentMoles = aceticAnhydrideMoles;
    if (aceticAnhydrideMoles > 0) {
      excessReagentPercent = ((salicylicAcidMoles - aceticAnhydrideMoles) / aceticAnhydrideMoles) * 100;
    }
  }

  // 4. Theoretical Yield of Aspirin (ASA): m_theo = n_limiting * M_ASA
  const theoreticalYieldMoles = limitingReagentMoles;
  const theoreticalYieldG = theoreticalYieldMoles * STOICHIOMETRY_CONSTANTS.MW_ASPIRIN;

  // 5. Experimental Actual Yield & Percent Yield
  let percentYield: number | undefined = undefined;
  if (inputs.actualYieldG !== undefined && theoreticalYieldG > 0) {
    percentYield = (inputs.actualYieldG / theoreticalYieldG) * 100;
  }

  // 6. 8-Tier Intelligent Diagnostic Evaluation
  const { diagnostic, feedbackCategory } = evaluateYieldDiagnostic(
    inputs.actualYieldG,
    theoreticalYieldG,
    percentYield
  );

  return {
    salicylicAcidMoles: Math.round(salicylicAcidMoles * 100000) / 100000,
    aceticAnhydrideMassG: Math.round(aceticAnhydrideMassG * 1000) / 1000,
    aceticAnhydrideMoles: Math.round(aceticAnhydrideMoles * 100000) / 100000,
    limitingReagent,
    limitingReagentName,
    limitingReagentMoles: Math.round(limitingReagentMoles * 100000) / 100000,
    excessReagentPercent: Math.round(excessReagentPercent * 10) / 10,
    theoreticalYieldMoles: Math.round(theoreticalYieldMoles * 100000) / 100000,
    theoreticalYieldG: Math.round(theoreticalYieldG * 10000) / 10000,
    actualYieldG: inputs.actualYieldG,
    percentYield: percentYield !== undefined ? Math.round(percentYield * 100) / 100 : undefined,
    diagnosticFeedback: diagnostic.description,
    feedbackCategory,
    diagnostic
  };
}
