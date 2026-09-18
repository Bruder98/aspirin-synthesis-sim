/**
 * Co-Solvent & Antisolvent Crystallization Thermodynamics Engine
 * References: SPEC-KINETICS-ASA-2026, Section 3 & Section 7
 */

import { SynthesisStageId, ThermodynamicState, FailureMode, sanitizeStageId } from './types';

export const THERMO_CONSTANTS = {
  DIELECTRIC_ACOH: 6.20,            // Pure acetic acid (non-polar co-solvent)
  DIELECTRIC_AA: 20.70,             // Acetic anhydride
  DIELECTRIC_WATER_20C: 80.10,      // Water at 20°C
  DIELECTRIC_WATER_0C: 88.00,       // Water at 0°C
  SOLID_ASPIRIN_DENSITY: 1400.0,    // kg/m^3 (1.40 g/cm^3)
  MW_ASPIRIN_KG: 0.180158,          // kg/mol
  AVOGADRO_NA: 6.02214076e23,       // molecules/mol
  BOLTZMANN_KB: 1.380649e-23,       // J/K
  SURFACE_TENSION_GAMMA: 0.00447,   // J/m^2 (calibrated: Delta G*/kT = 65.2 at S=1.15 and 0.14 at S=20.08)
  J0_KINETIC_FACTOR: 1.0e30,        // m^-3 s^-1 (nucleation frequency factor)
  HEAT_OF_SOLUTION_ORG: 12000,      // J/mol (dissolution enthalpy in AcOH)
  HEAT_OF_SOLUTION_AQ: 23000,       // J/mol (dissolution enthalpy in H2O)
  REFERENCE_STAGE3_BARRIER: 2.458e-19, // Joules (Delta G* at Stage 3 metastable baseline S=1.15, 65.2 kT)
} as const;

/**
 * Molecular volume of solid acetylsalicylic acid v_m (m^3 / molecule)
 */
export const MOLECULAR_VOLUME_VM =
  THERMO_CONSTANTS.MW_ASPIRIN_KG /
  (THERMO_CONSTANTS.SOLID_ASPIRIN_DENSITY * THERMO_CONSTANTS.AVOGADRO_NA);
// ~2.13689e-28 m^3 / molecule

/**
 * Calculates effective bulk dielectric constant epsilon_mix via volumetric mixing.
 */
export function calculateEffectiveDielectricConstant(
  volAcOHMl: number,
  volAAMl: number,
  volWaterMl: number,
  temperatureC: number = 4.0
): number {
  const vAcOH = Math.max(0, volAcOHMl);
  const vAA = Math.max(0, volAAMl);
  const vWater = Math.max(0, volWaterMl);
  const vTotal = vAcOH + vAA + vWater;

  if (vTotal <= 0) return THERMO_CONSTANTS.DIELECTRIC_ACOH;

  // Water dielectric varies with temperature: ~88 at 0°C down to ~78 at 25°C
  const epsWater = temperatureC <= 4
    ? THERMO_CONSTANTS.DIELECTRIC_WATER_0C
    : Math.max(65, THERMO_CONSTANTS.DIELECTRIC_WATER_20C - 0.35 * (temperatureC - 20));

  const epsMix =
    (vAcOH * THERMO_CONSTANTS.DIELECTRIC_ACOH +
      vAA * THERMO_CONSTANTS.DIELECTRIC_AA +
      vWater * epsWater) /
    vTotal;

  return Math.round(epsMix * 100) / 100;
}

/**
 * Calculates equilibrium solubility C* (g / 100 mL) using the Jouyban-Acree cosolvency model.
 * ln C*(phi_w, T) = (1 - phi_w) * ln C*_org(T) + phi_w * ln C*_aq(T) - beta * phi_w * (1 - phi_w)
 */
export function calculateEquilibriumSolubility(
  waterVolumeFraction: number,
  temperatureC: number = 4.0
): number {
  const phiW = Math.min(1.0, Math.max(0.0, waterVolumeFraction));
  const tKelvin = Math.max(temperatureC + 273.15, 273.15);

  // Organic co-solvent solubility (high in acetic acid)
  // At 0°C: ~18.5 g/100 mL; at 20°C: ~22.0 g/100 mL; at 80°C: ~55.0 g/100 mL
  const cOrg0 = 18.5;
  const cOrg = cOrg0 * Math.exp(
    (THERMO_CONSTANTS.HEAT_OF_SOLUTION_ORG / 8.3145) * (1 / 273.15 - 1 / tKelvin)
  );

  // Pure water solubility (steep temperature dependence)
  // At 0°C: 0.22 g/100 mL; at 25°C: 0.33 g/100 mL; at 37°C: 1.00 g/100 mL; at 50°C: 2.45 g/100 mL
  const cAq0 = 0.22;
  const cAq = cAq0 * Math.exp(
    (THERMO_CONSTANTS.HEAT_OF_SOLUTION_AQ / 8.3145) * (1 / 273.15 - 1 / tKelvin)
  );

  // Jouyban-Acree excess interaction parameter beta
  const beta = 1.0;
  const lnC =
    (1 - phiW) * Math.log(Math.max(cOrg, 1e-4)) +
    phiW * Math.log(Math.max(cAq, 1e-4)) -
    beta * phiW * (1 - phiW);

  const cStar = Math.exp(lnC);
  return Math.max(0.05, Math.round(cStar * 1000) / 1000);
}

/**
 * Calculates Classical Nucleation Theory (CNT) parameters:
 * - Critical radius r* (nm)
 * - Nucleation free energy barrier Delta G* (Joules)
 * - Reduced barrier Delta G* / (kB * T)
 * - Nucleation rate J (m^-3 s^-1)
 */
export function calculateCntParameters(
  supersaturationRatio: number,
  temperatureC: number = 4.0
): {
  criticalRadiusNm: number;
  barrierJoules: number;
  reducedBarrier: number;
  nucleationRateJ: number;
} {
  const tKelvin = Math.max(temperatureC + 273.15, 1.0);
  const kbT = THERMO_CONSTANTS.BOLTZMANN_KB * tKelvin;
  const s = Math.max(0.001, supersaturationRatio);

  // When S <= 1.01, supersaturation is inside the undersaturated or metastable barrier zone
  if (s <= 1.01) {
    const defaultBarrier = 65.2 * kbT;
    return {
      criticalRadiusNm: 15.0,
      barrierJoules: defaultBarrier,
      reducedBarrier: 65.2,
      nucleationRateJ: 0
    };
  }

  const lnS = Math.log(s);
  const lnS2 = lnS * lnS;

  // Critical radius: r* = (2 * gamma * v_m) / (kB * T * ln(S))
  const rStarMeters = (2 * THERMO_CONSTANTS.SURFACE_TENSION_GAMMA * MOLECULAR_VOLUME_VM) / (kbT * lnS);
  const criticalRadiusNm = Math.max(0.2, Math.min(rStarMeters * 1e9, 50.0));

  // Nucleation barrier: Delta G* = (16 * pi * gamma^3 * v_m^2) / (3 * (kB * T * ln S)^2)
  const numerator =
    16 * Math.PI * Math.pow(THERMO_CONSTANTS.SURFACE_TENSION_GAMMA, 3) * Math.pow(MOLECULAR_VOLUME_VM, 2);
  const denominator = 3 * Math.pow(kbT * lnS, 2);
  const barrierJoules = Math.max(1e-25, numerator / denominator);

  const reducedBarrier = barrierJoules / kbT;

  // Nucleation rate J = J0 * exp(-Delta G* / kbT)
  // Metastable envelope (Delta G* > 50 kT) has effectively zero observable homogeneous nucleation
  let nucleationRateJ = 0;
  if (reducedBarrier < 50) {
    nucleationRateJ = THERMO_CONSTANTS.J0_KINETIC_FACTOR * Math.exp(-reducedBarrier);
  }

  return {
    criticalRadiusNm: Math.round(criticalRadiusNm * 100) / 100,
    barrierJoules,
    reducedBarrier: Math.round(reducedBarrier * 100) / 100,
    nucleationRateJ
  };
}

/**
 * Calculates the complete thermodynamic and crystallization state for a given synthesis stage.
 */
export function calculateThermodynamicState(
  stageId: SynthesisStageId,
  failureMode?: FailureMode
): ThermodynamicState;
export function calculateThermodynamicState(
  stageId: SynthesisStageId,
  customTemp?: number,
  waterVolMl?: number,
  saMassG?: number,
  aaVolMl?: number,
  failureMode?: FailureMode
): ThermodynamicState;
export function calculateThermodynamicState(
  stageId: SynthesisStageId,
  param2?: number | FailureMode,
  waterVolMl?: number,
  saMassG: number = 2.00,
  aaVolMl: number = 5.00,
  param6: FailureMode = 'NONE'
): ThermodynamicState {
  let customTemp: number | undefined;
  let failureMode: FailureMode = 'NONE';

  if (typeof param2 === 'string') {
    failureMode = param2 as FailureMode;
    customTemp = undefined;
  } else if (typeof param2 === 'number') {
    customTemp = param2;
    failureMode = param6 ?? 'NONE';
  } else {
    customTemp = undefined;
    failureMode = param6 ?? 'NONE';
  }

  const safeStage = sanitizeStageId(stageId, 1);

  // Theoretical aspirin mass in crude solution (~2.609 g from 2.00 g SA)
  const mwSA = 138.121;
  const mwASA = 180.158;
  const molesSA = saMassG / mwSA;
  const producedAsaG = molesSA * mwASA;

  let temperatureC = 20;
  let volAcOH = 0.5;
  let volAA = aaVolMl;
  let volWater = 0;
  let isMetastable = false;
  let isPrecipitating = false;
  let isSpinodalBurst = false;

  switch (safeStage) {
    case 1: // Reagents Dispensing
      temperatureC = customTemp ?? 20;
      volAcOH = 0.1;
      volAA = aaVolMl;
      volWater = 0;
      isMetastable = false;
      isPrecipitating = false;
      break;

    case 2: // Hot Water Bath Heating (80°C standard, 95°C if OVERHEATING)
      temperatureC = customTemp ?? (failureMode === 'OVERHEATING' ? 95 : 80);
      volAcOH = 2.0;
      volAA = Math.max(0.5, aaVolMl - 1.5);
      volWater = 0;
      isMetastable = false;
      isPrecipitating = false;
      break;

    case 3: // Ice-Water 1st Cooling (Metastable Zone, 4°C, NO crystals!)
      temperatureC = customTemp ?? 4;
      volAcOH = 3.2;
      volAA = Math.max(0.5, aaVolMl - 1.5);
      volWater = 0;
      isMetastable = failureMode === 'NONE' || failureMode === 'WARM_WASH';
      isPrecipitating = false;
      break;

    case 4: // Distilled Water Antisolvent Shock (4°C, rapid crystal burst!)
      temperatureC = customTemp ?? 4;
      volWater = waterVolMl ?? 15.0;
      volAcOH = 4.5;
      volAA = 0.1; // Quenched into AcOH
      isMetastable = false;
      isPrecipitating = failureMode !== 'EARLY_WATER' && failureMode !== 'OVERHEATING';
      isSpinodalBurst = failureMode !== 'EARLY_WATER' && failureMode !== 'OVERHEATING';
      break;

    case 5: // Crystal Maturation & Quenching (2°C)
      temperatureC = customTemp ?? 2;
      volWater = waterVolMl ?? 15.0;
      volAcOH = 4.8;
      volAA = 0.0; // Completely quenched
      isMetastable = false;
      isPrecipitating = failureMode !== 'EARLY_WATER' && failureMode !== 'OVERHEATING';
      isSpinodalBurst = false;
      break;

    case 6: // Vacuum Filtration & Cold Wash (2°C standard, 25°C if WARM_WASH)
      temperatureC = customTemp ?? (failureMode === 'WARM_WASH' ? 25 : 2);
      volWater = 5.0;
      volAcOH = 0.5;
      volAA = 0.0;
      isMetastable = false;
      isPrecipitating = false;
      break;

    default:
      temperatureC = customTemp ?? 20;
      volAcOH = 0.1;
      volAA = aaVolMl;
      volWater = 0;
      isMetastable = false;
      isPrecipitating = false;
      break;
  }

  // Elevate temperatureC to 95 if OVERHEATING (if not custom)
  if (failureMode === 'OVERHEATING' && customTemp === undefined) {
    temperatureC = 95;
  }

  const totalVolMl = Math.max(1.0, volAcOH + volAA + volWater);
  const waterFraction = volWater / totalVolMl;

  // 1. Dielectric Constant
  const dielectricConstant = calculateEffectiveDielectricConstant(
    volAcOH,
    volAA,
    volWater,
    temperatureC
  );

  // 2. Equilibrium Solubility C* (g / 100 mL)
  let solubilityGPer100Ml = calculateEquilibriumSolubility(waterFraction, temperatureC);
  if (failureMode === 'WARM_WASH' && safeStage === 6) {
    solubilityGPer100Ml = 3.3; // 15x higher than at 0°C (0.22 g/100 mL)
  }

  // 3. Actual Concentration C (g / 100 mL)
  let actualConcentrationGPer100Ml = Math.round((producedAsaG / totalVolMl) * 100 * 100) / 100;

  // 4. Supersaturation Ratio S = C / C*
  let supersaturation = actualConcentrationGPer100Ml / solubilityGPer100Ml;

  if (safeStage === 3 && (failureMode === 'NONE' || failureMode === 'WARM_WASH')) {
    supersaturation = 1.15;
  }

  // --- FAILURE MODE OVERRIDES ON THERMODYNAMICS ---
  if (failureMode === 'EARLY_WATER') {
    isPrecipitating = false;
    isSpinodalBurst = false;
    supersaturation = 0.0;
    actualConcentrationGPer100Ml = 0.0;
  } else if (failureMode === 'OVERHEATING') {
    isPrecipitating = false;
    isSpinodalBurst = false;
    supersaturation = 0.2;
  } else if (failureMode === 'WARM_WASH' && safeStage === 6) {
    temperatureC = customTemp ?? 25;
    solubilityGPer100Ml = 3.3;
    supersaturation = 0.4;
    isPrecipitating = false;
  }

  // 5. CNT Nucleation Barrier
  const cnt = calculateCntParameters(supersaturation, temperatureC);

  let relativeBarrierRatio =
    Math.round((cnt.barrierJoules / THERMO_CONSTANTS.REFERENCE_STAGE3_BARRIER) * 1000) / 1000;

  if (failureMode === 'EARLY_WATER' || failureMode === 'OVERHEATING') {
    relativeBarrierRatio = 1.0;
  }

  return {
    stageId: safeStage,
    temperatureC,
    dielectricConstant,
    solubilityGPer100Ml,
    actualConcentrationGPer100Ml,
    supersaturation: Math.round(supersaturation * 100) / 100,
    cntBarrierJoules: cnt.barrierJoules,
    relativeBarrierRatio,
    criticalRadiusNm: cnt.criticalRadiusNm,
    nucleationRateJ: cnt.nucleationRateJ,
    isMetastable,
    isPrecipitating,
    isSpinodalBurst
  };
}

