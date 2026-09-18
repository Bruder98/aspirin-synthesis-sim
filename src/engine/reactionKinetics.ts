/**
 * Chemical Reaction Kinetics & Mechanism State Machine for Aspirin Synthesis
 * References: SPEC-KINETICS-ASA-2026, Section 2 & Section 6
 */

import { StageInfo, SynthesisStageId } from './types';

export const CHEMICAL_CONSTANTS = {
  MW_SALICYLIC_ACID: 138.121,      // g/mol
  MW_ACETIC_ANHYDRIDE: 102.089,    // g/mol
  DENSITY_ACETIC_ANHYDRIDE: 1.082, // g/mL at 20°C
  MW_ASPIRIN: 180.158,             // g/mol
  MW_ACETIC_ACID: 60.052,          // g/mol
  MW_WATER: 18.015,                // g/mol
  MW_PHOSPHORIC_ACID: 97.994,      // g/mol
  GAS_CONSTANT_R: 8.3145,          // J/(mol*K)
  ACTIVATION_ENERGY_EA: 48500,     // J/mol (48.5 kJ/mol)
  PRE_EXPONENTIAL_A: 1.21e7,       // L/(mol*min) (yields k_eff ~ 0.811 L/(mol*min) at 80°C)
  ENTHALPY_QUENCHING: -56500,      // J/mol (exothermic hydrolysis)
  STANDARD_AA_CONCENTRATION_M: 10.6,// mol/L (excess liquid)
} as const;

export interface ReactionIntermediateStep {
  stepId: '2a_protonation' | '2b_nucleophilic_attack' | '2c_proton_transfer' | '2d_elimination' | '2e_catalyst_regen';
  titleKo: string;
  titleEn: string;
  reactants: string[];
  products: string[];
  electrophilicChargeDeltaPlus: number;
  hybridization: 'sp2' | 'sp3';
  descriptionKo: string;
  descriptionEn: string;
}

export const MECHANISM_STEPS: ReactionIntermediateStep[] = [
  {
    stepId: '2a_protonation',
    titleKo: '카보닐 산소 양성자화 및 옥소늄 이온 형성',
    titleEn: 'Protonation & Oxonium Ion Activation',
    reactants: ['Acetic Anhydride', 'H+ (from H3PO4)'],
    products: ['Protonated Acetic Anhydride (Oxonium Ion)', 'H2PO4-'],
    electrophilicChargeDeltaPlus: 0.88,
    hybridization: 'sp2',
    descriptionKo: '인산 촉매의 H+가 무수아세트산의 카보닐 산소에 결합하여 친전자성 극성(delta+)을 +0.52에서 +0.88로 극대화합니다.',
    descriptionEn: 'Phosphoric acid protonates the carbonyl oxygen, dramatically lowering the LUMO and boosting electrophilicity from delta+ 0.52 to 0.88.'
  },
  {
    stepId: '2b_nucleophilic_attack',
    titleKo: '살리실산 페놀성 -OH의 친핵성 공격 (사면체 중간체)',
    titleEn: 'Nucleophilic Attack & Tetrahedral Intermediate',
    reactants: ['Salicylic Acid (Phenolic -OH)', 'Oxonium Ion'],
    products: ['Tetrahedral Intermediate ([C11H13O6]+)'],
    electrophilicChargeDeltaPlus: 0.20,
    hybridization: 'sp3',
    descriptionKo: '살리실산의 페놀성 수산기 산소 비공유 전자쌍이 활성화된 카보닐 탄소를 공격하여 sp3 사면체 중간체를 형성합니다.',
    descriptionEn: 'The lone pair of salicylic acid phenolic -OH attacks the electrophilic carbonyl carbon, forming an sp3 tetrahedral intermediate.'
  },
  {
    stepId: '2c_proton_transfer',
    titleKo: '분자 내/용매 매개 양성자 이동',
    titleEn: 'Proton Transfer',
    reactants: ['Tetrahedral Intermediate'],
    products: ['Proton-shifted Tetrahedral Adduct'],
    electrophilicChargeDeltaPlus: 0.15,
    hybridization: 'sp3',
    descriptionKo: '살리실산 유래 산소에 위치한 양성자가 이탈기인 아세테이트 산소로 신속히 이동하여 좋은 이탈기(아세트산)로 전환됩니다.',
    descriptionEn: 'Proton shifts from the phenolic oxygen to the bridging anhydride oxygen, turning it into a stable neutral leaving group.'
  },
  {
    stepId: '2d_elimination',
    titleKo: '아세트산 분자 이탈 및 에스테르 결합 형성',
    titleEn: 'Collapse & Elimination of Acetic Acid',
    reactants: ['Proton-shifted Tetrahedral Adduct'],
    products: ['Protonated Acetylsalicylic Acid', 'Neutral Acetic Acid (AcOH)'],
    electrophilicChargeDeltaPlus: 0.45,
    hybridization: 'sp2',
    descriptionKo: '카보닐 C=O 이중결합이 복원되며 중성 아세트산(CH3COOH)이 이탈하고 에스테르 결합(아세틸화)이 완성됩니다.',
    descriptionEn: 'The carbonyl double bond reforms, expelling neutral acetic acid as the leaving group.'
  },
  {
    stepId: '2e_catalyst_regen',
    titleKo: '촉매 양성자 회수 및 아스피린 생성 완성',
    titleEn: 'Deprotonation & Catalyst Regeneration',
    reactants: ['Protonated Acetylsalicylic Acid', 'H2PO4-'],
    products: ['Acetylsalicylic Acid (Aspirin)', 'H3PO4 Catalyst'],
    electrophilicChargeDeltaPlus: 0.0,
    hybridization: 'sp2',
    descriptionKo: 'H2PO4- 음이온이 양성자를 회수하여 H3PO4 촉매가 재생되고 순수한 아세틸살리실산 분자가 생성됩니다.',
    descriptionEn: 'The conjugate base H2PO4- abstracts the proton, regenerating H3PO4 catalyst and yielding neutral aspirin.'
  }
];

export const STAGE_DEFINITIONS: Record<SynthesisStageId, StageInfo> = {
  1: {
    id: 1,
    stepKey: 'STEP_1_DISPENSE',
    titleKo: '시약 칭량 및 촉매 혼합',
    titleEn: 'Reagent Dispensing & Catalyst Mixing',
    temperatureC: 20,
    descriptionKo: '살리실산 분말(2.00 g)에 과량의 무수아세트산(5.00 mL)과 85% 인산 촉매 5방울을 가하고 가볍게 흔들어 혼합합니다.',
    descriptionEn: 'Weigh 2.00 g salicylic acid into an Erlenmeyer flask, add 5.00 mL acetic anhydride, and add 5 drops of 85% phosphoric acid catalyst.',
    macroVisualDescription: '삼각플라스크에 백색 살리실산 분말 투입, 무수아세트산 액체 주입, 인산 촉매 점적 및 불균일 현탁액 형성',
    microVisualDescription: '살리실산, 무수아세트산, H3PO4 분자들의 자유 브라운 운동 및 카보닐 산소로의 H+ 이동 준비',
    isMetastable: false,
    isPrecipitating: false
  },
  2: {
    id: 2,
    stepKey: 'STEP_2_HEAT',
    titleKo: '물중탕 가열 및 에스테르화 반응',
    titleEn: 'Hot Water Bath Heating & Esterification',
    temperatureC: 80,
    descriptionKo: '75~85°C 온수 중탕에서 10~15분간 가열 및 교반하여 살리실산을 완전히 용해시키고 친핵성 아실 치환 반응을 완결합니다.',
    descriptionEn: 'Immerse the flask in a 75-85°C water bath for 10-15 minutes with swirling to complete the nucleophilic acyl substitution.',
    macroVisualDescription: '80°C 항온 수조에서 대류 열전달 및 플라스크 내부 고체가 완전히 용해되어 투명한 미황색 용액 형성',
    microVisualDescription: '카보닐 산소 양성자화 -> 옥소늄 이온 -> 페놀성 친핵 공격 -> sp3 사면체 중간체 -> 아세트산 이탈 및 아스피린 분자 형성',
    isMetastable: false,
    isPrecipitating: false
  },
  3: {
    id: 3,
    stepKey: 'STEP_3_COOL_META',
    titleKo: '얼음물 1차 냉각 (준안정 상태)',
    titleEn: 'Ice-Water 1st Cooling (Metastable Zone)',
    temperatureC: 4,
    descriptionKo: '반응액을 0~4°C 얼음물에 담가 냉각합니다. 고농도 아세트산 공용매 효과로 인해 결정을 형성하지 않고 100% 맑고 투명한 상태를 유지합니다.',
    descriptionEn: 'Cool the flask in an ice bath (0-4°C). Due to high acetic acid co-solvent concentration, the solution remains 100% clear with NO spontaneous crystallization.',
    macroVisualDescription: '얼음물 수조에 담긴 플라스크 내부 액체가 맑고 투명하게 유지됨 (결정 미석출, 준안정 구역)',
    microVisualDescription: '아세트산 분자 6~8개가 아스피린의 소수성 벤젠 고리를 둘러싸는 용매화 쉘(Solvation Shell) 형성, 핵생성 장벽 유지',
    isMetastable: true,
    isPrecipitating: false
  },
  4: {
    id: 4,
    stepKey: 'STEP_4_WATER_BURST',
    titleKo: '증류수 첨가 (반용매 급격 결정화)',
    titleEn: 'Distilled Water Antisolvent Shock',
    temperatureC: 4,
    descriptionKo: '냉증류수 15~20 mL를 급격히 주입합니다. 유전율 급상승과 용해도 급락으로 핵생성 장벽(ΔG*)이 붕괴되어 순식간에 하얀 바늘 모양 결정이 쏟아져 나옵니다.',
    descriptionEn: 'Rapidly inject 15-20 mL chilled distilled water. Dielectric permittivity surges, collapsing the nucleation barrier and triggering an explosive needle crystal burst.',
    macroVisualDescription: '증류수 주입 즉시 우윳빛 백탁 확산 후 순식간에 눈꽃 같은 하얀 침상 결정이 플라스크 전체로 폭발적 분출',
    microVisualDescription: '물 분자가 아세트산 용매화 쉘을 박탈, 소수성 배제력으로 아스피린 분자들이 급격히 자가 회합하여 결정 핵 형성',
    isMetastable: false,
    isPrecipitating: true
  },
  5: {
    id: 5,
    stepKey: 'STEP_5_MATURE',
    titleKo: '완전 결정화 및 잔류물 수화',
    titleEn: 'Crystal Maturation & Quenching',
    temperatureC: 2,
    descriptionKo: '얼음물 속에서 10~15분간 방치하여 결정 격자를 두껍게 성장시키고(오스트발트 라이프닝), 잔류 무수아세트산을 완전히 아세트산으로 가수분해(Quenching)합니다.',
    descriptionEn: 'Leave flask in ice bath for 10-15 min to mature the crystal lattice (Ostwald ripening) and quench any unreacted acetic anhydride into acetic acid.',
    macroVisualDescription: '하얀 침상 결정들이 빽빽하게 얽힌 진한 백색 죽(Slurry) 상태를 형성하고 바닥으로 침강',
    microVisualDescription: '카복실산 이량체(twin H-bonds)가 c축을 따라 적층되며 단사정계(Monoclinic) 결정 격자로 안정화',
    isMetastable: false,
    isPrecipitating: true
  },
  6: {
    id: 6,
    stepKey: 'STEP_6_FILTRATION',
    titleKo: '감압 흡인 여과 및 냉각 세척',
    titleEn: 'Büchner Vacuum Filtration & Washing',
    temperatureC: 2,
    descriptionKo: '뷔히너 깔때기와 감압 플라스크를 연결하여 모액을 흡인 여과하고, 0~4°C 냉증류수로 2~3회 세척하여 순수한 건조 아스피린 결정을 회수합니다.',
    descriptionEn: 'Filter the crystal slurry through a Büchner funnel under vacuum suction, and wash with ice-cold distilled water to isolate pure white aspirin cake.',
    macroVisualDescription: '감압 펌프 작동으로 모액이 여과 플라스크 아래로 빠져나가고, 거름종이 위에 순백색의 아스피린 케이크가 단단히 압착 형성',
    microVisualDescription: '다공성 결정 격자 사이로 용매(물, 아세트산, 인산 이온)가 하향 흡인 배출되고 순수한 아스피린 격자만 잔류',
    isMetastable: false,
    isPrecipitating: false
  }
};

/**
 * Calculates the Arrhenius effective rate constant k_eff (L / (mol * min)).
 * k = A * exp(-Ea / (R * T_Kelvin)) * relativeCatalystConc
 */
export function calculateArrheniusRateConstant(
  temperatureC: number,
  relativeCatalystConc: number = 1.0
): number {
  const temperatureK = Math.max(temperatureC + 273.15, 1.0);
  const exponent = -CHEMICAL_CONSTANTS.ACTIVATION_ENERGY_EA / (CHEMICAL_CONSTANTS.GAS_CONSTANT_R * temperatureK);
  const k = CHEMICAL_CONSTANTS.PRE_EXPONENTIAL_A * Math.exp(exponent) * Math.max(0, relativeCatalystConc);
  return k;
}

/**
 * Calculates reaction conversion X(t) = 1 - exp(-k_pseudo * t)
 * where k_pseudo = k_eff * [AA]_0
 */
export function calculateReactionConversion(
  temperatureC: number,
  timeMinutes: number,
  aceticAnhydrideConcM: number = CHEMICAL_CONSTANTS.STANDARD_AA_CONCENTRATION_M,
  relativeCatalystConc: number = 1.0
): number {
  if (timeMinutes <= 0) return 0;
  const kEff = calculateArrheniusRateConstant(temperatureC, relativeCatalystConc);
  const kPseudo = kEff * Math.max(0, aceticAnhydrideConcM);
  const conversion = 1 - Math.exp(-kPseudo * timeMinutes);
  return Math.min(1.0, Math.max(0.0, conversion));
}

/**
 * Calculates exothermic quenching parameters when water is added to excess acetic anhydride.
 * (CH3CO)2O + H2O -> 2 CH3COOH (Delta H = -56.5 kJ/mol)
 */
export function calculateQuenchingReaction(
  excessAnhydrideMoles: number,
  solutionMassG: number = 20.0,
  specificHeatJPerGPerK: number = 4.184
): {
  heatReleasedJ: number;
  adiabaticTempRiseC: number;
  aceticAcidProducedMoles: number;
} {
  const moles = Math.max(0, excessAnhydrideMoles);
  const heatReleasedJ = moles * Math.abs(CHEMICAL_CONSTANTS.ENTHALPY_QUENCHING);
  const massG = Math.max(solutionMassG, 1.0);
  const adiabaticTempRiseC = heatReleasedJ / (massG * specificHeatJPerGPerK);
  const aceticAcidProducedMoles = moles * 2;

  return {
    heatReleasedJ,
    adiabaticTempRiseC,
    aceticAcidProducedMoles
  };
}

/**
 * Returns stage metadata by stage ID.
 */
export function getStageInfo(stageId: SynthesisStageId): StageInfo {
  return STAGE_DEFINITIONS[stageId] ?? STAGE_DEFINITIONS[1];
}
