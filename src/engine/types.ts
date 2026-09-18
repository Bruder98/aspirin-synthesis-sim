/**
 * Pure Domain Engine Type Definitions for Aspirin Synthesis Simulation
 * Document Code: SPEC-KINETICS-ASA-2026 / PROJECT.md
 */

export type SynthesisStageId = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Sanitizes and clamps any raw input strictly to a valid SynthesisStageId (1 | 2 | 3 | 4 | 5 | 6).
 *
 * Guarantees:
 * - Returns an integer strictly in [1, 6].
 * - Defends against NaN, Infinity, -Infinity, null, undefined, and non-numeric types.
 * - Rounds floats to the nearest integer (Math.round).
 * - Clamps values < 1 to 1, and values > 6 to 6.
 * - Preserves provided fallback if input is unparseable or NaN.
 */
export function sanitizeStageId(
  input: unknown,
  fallback: SynthesisStageId = 1
): SynthesisStageId {
  const safeFallback: SynthesisStageId =
    typeof fallback === 'number' &&
    Number.isInteger(fallback) &&
    fallback >= 1 &&
    fallback <= 6
      ? fallback
      : 1;

  if (input === null || input === undefined) {
    return safeFallback;
  }

  const num = typeof input === 'number' ? input : Number(input);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return safeFallback;
  }

  const rounded = Math.round(num);
  const clamped = Math.max(1, Math.min(6, rounded));

  return clamped as SynthesisStageId;
}


export type FailureMode = 'NONE' | 'EARLY_WATER' | 'OVERHEATING' | 'WARM_WASH';

export interface StoichiometryInputs {
  salicylicAcidMassG: number;     // e.g. 2.00 g (nominal)
  aceticAnhydrideVolMl: number;   // e.g. 5.00 mL (nominal)
  actualYieldG?: number;          // user measured dry aspirin mass
}

export type FeedbackCategory =
  | 'EXCELLENT'
  | 'HIGH_MOISTURE'
  | 'PARTIAL_CONVERSION'
  | 'WASH_LOSS'
  | 'CRITICAL_ERROR';

export type DiagnosticCategory =
  | 'MOISTURE_EXCESS'
  | 'EXCELLENT'
  | 'NORMAL_TYPICAL'
  | 'MODERATE_LOSS'
  | 'SEVERE_LOSS'
  | 'CRITICAL_FAILURE'
  | 'ZERO_YIELD'
  | 'INVALID_INPUT';

export interface YieldDiagnostic {
  category: DiagnosticCategory;
  badge: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface StoichiometryResult {
  salicylicAcidMoles: number;
  aceticAnhydrideMassG: number;
  aceticAnhydrideMoles: number;
  limitingReagent: 'SALICYLIC_ACID' | 'ACETIC_ANHYDRIDE';
  limitingReagentName: 'Salicylic Acid' | 'Acetic Anhydride';
  limitingReagentMoles: number;
  excessReagentPercent: number;
  theoreticalYieldMoles: number;
  theoreticalYieldG: number;
  actualYieldG?: number;
  percentYield?: number;
  diagnosticFeedback?: string;
  feedbackCategory?: FeedbackCategory;
  diagnostic: YieldDiagnostic;
}

export interface ThermodynamicState {
  stageId: SynthesisStageId;
  temperatureC: number;
  dielectricConstant: number;          // ~6.2 in AcOH/AA -> ~80 in H2O
  solubilityGPer100Ml: number;         // C*
  actualConcentrationGPer100Ml: number;// C
  supersaturation: number;             // S = C / C*
  cntBarrierJoules: number;            // Delta G*
  relativeBarrierRatio: number;        // normalized to stage 3 (~1.0 at stage 3 -> ~0.002 at stage 4)
  criticalRadiusNm: number;            // r* (nm)
  nucleationRateJ: number;             // J (m^-3 s^-1)
  isMetastable: boolean;               // true in stage 3 (ice bath before water: 0-4°C, transparent liquid)
  isPrecipitating: boolean;            // true in stage 4-5
  isSpinodalBurst: boolean;            // true in stage 4 (CNT barrier collapsed)
}

export interface StageInfo {
  id: SynthesisStageId;
  stepKey: string;
  titleKo: string;
  titleEn: string;
  temperatureC: number;
  descriptionKo: string;
  descriptionEn: string;
  macroVisualDescription: string;
  microVisualDescription: string;
  isMetastable: boolean;
  isPrecipitating: boolean;
}

export interface FailureModeDetails {
  mode: FailureMode;
  nameKo: string;
  nameEn: string;
  description: string;
  triggerStage: SynthesisStageId;
  chemicalCause: string;
  observableOutcome: string;
  feCl3TestResult: 'VIOLET_POSITIVE' | 'BUFF_NEGATIVE' | 'TAR_INCONCLUSIVE';
  feCl3ColorHex: string;
  expectedYieldPercentRange: [number, number];
  remedyRecommendation: string;
}

export interface Atom3D {
  id: string;
  element: 'C' | 'H' | 'O' | 'P' | 'H+';
  pos: [number, number, number];
  color: string;
  radius: number;
}

export interface Bond3D {
  atom1Id: string;
  atom2Id: string;
  order: 1.0 | 1.5 | 2.0;
  type?: 'covalent' | 'hydrogen';
}

export interface Molecule3D {
  name: string;
  formula: string;
  atoms: Atom3D[];
  bonds: Bond3D[];
}
