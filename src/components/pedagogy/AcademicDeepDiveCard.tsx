/**
 * AcademicDeepDiveCard.tsx
 * Academic Deep-Dive Card providing rigorous thermodynamic, kinetic, and mechanistic explanations
 * with KaTeX math rendering, including Classical Nucleation Theory and Co-solvent/Antisolvent dynamics.
 * Complies with SPEC-UI-3D-PEDAGOGY-001 Section 5.
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import { useAspirinStore } from '../../store/useAspirinStore';
import { SynthesisStageId, FailureMode } from '../../engine/types';
import { GraduationCap, Atom, Compass, TrendingUp, AlertTriangle } from 'lucide-react';

interface DeepDiveData {
  sectionTitle: string;
  subtitleEn?: string;
  chemicalEquation: string;
  mechanismSummary: string;
  thermodynamics: {
    label: string;
    value: string;
  }[];
  keyTakeaways: string[];
}

export const LatexSpan: React.FC<{ math: string; displayMode?: boolean }> = ({
  math,
  displayMode = false,
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      return math;
    }
  }, [math, displayMode]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const DEEP_DIVE_DATA: Record<SynthesisStageId, DeepDiveData> = {
  1: {
    sectionTitle: '산 촉매 양성자화 및 친전자성 극대화',
    subtitleEn: 'Protonation & Oxonium Ion Activation',
    chemicalEquation:
      '\\mathrm{CH_3COOCOCH_3 + H_3PO_4 \\rightleftharpoons [CH_3C(OH)=O-COCH_3]^+ + H_2PO_4^-}',
    mechanismSummary:
      '85% 인산 촉매가 무수아세트산의 카보닐 산소에 배위 결합하여 강한 공명 안정화 옥소늄 이온을 형성합니다. 이에 따라 카보닐 탄소의 양전하 밀도(δ+)가 대폭 증가하여 페놀성 히드록시기의 친핵성 공격에 대한 활성화 에너지가 크게 감소합니다.',
    thermodynamics: [
      { label: '양성자화 평형상수', value: 'K_eq ≈ 1.2 × 10^-2' },
      { label: '활성화 엔탈피', value: 'ΔH‡ ≈ 48.5 kJ/mol' },
      { label: '촉매 가속 계수', value: 'k_cat / k_uncat > 10^4' },
    ],
    keyTakeaways: [
      '페놀(-OH)은 지방족 알코올 대비 pKa ≈ 9.95로 친핵성이 낮아 촉매의 활성화가 필수적입니다.',
      '무수아세트산은 아세트산보다 훨씬 우수한 아실기 공여체(Acyl Donor)로 기능합니다.',
      '양성자화로 카보닐 탄소의 반응성을 비약적으로 높여줍니다.',
    ],
  },
  2: {
    sectionTitle: '친핵성 아실 치환(SnAc) 및 사면체 중간체 형성',
    subtitleEn: 'Nucleophilic Acyl Substitution',
    chemicalEquation:
      '\\mathrm{Ar-OH + [CH_3-C^+=O-Ac] \\to [Ar-O^+(H)-C(OH)(CH_3)-Ac] \\to Ar-OCOCH_3 + AcOH + H^+}',
    mechanismSummary:
      '살리실산의 페놀 산소가 양성자화된 카보닐 탄소를 공격하여 sp2 혼성 탄소가 sp3 사면체 중간체(Tetrahedral Intermediate)로 전이됩니다. 이후 아세톡시기가 우수한 이탈기(Leaving group)인 아세트산(AcOH)으로 탈락하며 아세틸살리실산이 완성됩니다.',
    thermodynamics: [
      { label: '반응 엔탈피 변화량', value: 'ΔH° ≈ -18.4 kJ/mol' },
      { label: '반응 속도상수(80°C)', value: 'k ≈ 0.082 s^-1 (Arrhenius 거동)' },
      { label: '최적 반응 온도', value: '75 ~ 85°C (90°C 초과 시 탄화 타르화)' },
    ],
    keyTakeaways: [
      '사면체 전이 상태를 거치며 에스테르 결합이 완성됩니다.',
      '충분한 열에너지(물중탕) 공급으로 반응 속도를 극대화하여 10~15분 내 95% 이상 전화율을 달성합니다.',
    ],
  },
  3: {
    sectionTitle: '아세트산 공용매 효과 및 준안정 영역',
    subtitleEn: 'Co-solvent & Metastable Zone',
    chemicalEquation:
      '\\Delta G^* \\propto \\frac{\\gamma^3}{(k_B T \\ln S)^2}, \\quad S = \\frac{C}{C^*}, \\quad \\epsilon_r \\approx 6.2',
    mechanismSummary:
      '반응 완결 후 시험관에는 부산물인 고농도 아세트산(AcOH, εr≈6.2)과 잔류 무수물이 가득합니다. Jouyban-Acree 공용매 모델에 따르면 낮은 유전율의 아세트산은 비극성 벤젠 고리를 안정하게 용매화(Solvation)하므로, 0~4°C 얼음물로 급랭해도 용해도가 여전히 높아 과포화도(S)가 임계치에 도달하지 못하고 투명한 준안정 영역(Metastable Zone)에 머무릅니다.',
    thermodynamics: [
      { label: '용매 유전율 (AcOH 부피분율 > 70%)', value: 'ε_r ≈ 6.2 ~ 9.5' },
      { label: '0°C 아세트산 혼합 용해도', value: 'C* ≈ 18.5 g / 100 mL' },
      { label: '핵생성 자유에너지 장벽', value: 'ΔG* > 65 k_B T (핵생성 불가 장벽)' },
    ],
    keyTakeaways: [
      '단순 냉각만으로는 높은 아세트산 용해도 때문에 ln(S)가 너무 작아 핵생성 장벽을 넘지 못합니다.',
      '학생들이 "얼음물에 오래 두어도 결정이 안 생겨요!"라고 질문하는 결정적인 물리화학적 이유입니다.',
    ],
  },
  4: {
    sectionTitle: '반용매(Antisolvent) 충격 및 CNT 핵생성 장벽 붕괴',
    subtitleEn: 'Antisolvent Burst Nucleation',
    chemicalEquation:
      '\\Delta G^* = \\frac{16\\pi \\gamma^3 v_m^2}{3 (k_B T \\ln S)^2} \\xrightarrow{\\mathrm{H_2O}} 0.14\\, k_B T \\quad (\\text{Burst})',
    mechanismSummary:
      '극성 증류수(εr≈80)를 주입하는 순간, 매질의 유전율이 급증하며 소수성 벤젠 고리를 가진 아스피린의 용해도(C*)가 1.5 g/L 수준으로 급락합니다. 이에 따라 과포화도 S = C / C* ≫ 1가 폭증하고, Classical Nucleation Theory (CNT) 핵생성 장벽이 자발적 스피노달 분해에 근접하여 폭발적 침상 결정 석출이 발생합니다.',
    thermodynamics: [
      { label: '물 첨가 후 용매 유전율', value: 'ε_r ≈ 58.4 ~ 72.0 (극성 급상승)' },
      { label: '0°C 아스피린 수용해도', value: 'C* ≈ 0.15 g / 100 mL (급감)' },
      { label: 'CNT 핵생성 장벽', value: '465배 붕괴 (ΔG* ≈ 0.14 k_B T)' },
    ],
    keyTakeaways: [
      '핵생성 장벽의 급격한 붕괴로 3초 이내에 바늘 결정이 석출됩니다.',
      '과량의 잔류 무수아세트산이 물과 반응하여 2분자의 아세트산으로 발열 소광(Quenching)됩니다.',
      '높은 유전율의 물이 아세트산의 용매화 쉘을 파괴하여 아스피린 분자 간 π-π 스태킹을 유도합니다.',
    ],
  },
  5: {
    sectionTitle: '단사정계 결정 다형체 성장 및 오스트발트 숙성',
    subtitleEn: 'Ostwald Ripening & Form I Growth',
    chemicalEquation:
      '\\text{Monoclinic } P2_1/c, \\quad C(r) = C_\\infty \\exp\\left(\\frac{2\\gamma v_m}{k_B T r}\\right) \\quad [\\text{Gibbs-Thomson}]',
    mechanismSummary:
      '초기 급격한 핵생성으로 생성된 미세 결정들은 높은 표면 곡률로 인해 용해도가 높습니다. Gibbs-Thomson 효과에 의해 미세 결정이 용해되어 안정하고 거대한 침상 결정(Monoclinic Form I (P2_1/c))의 표면에 재석출되며, 분자 간 2개의 수소결합을 이루는 중심대칭 다이머(Centrosymmetric dimer) 구조를 확립합니다.',
    thermodynamics: [
      { label: '결정 결정계', value: '단사정계 Monoclinic' },
      { label: '다이머 수소결합 길이', value: 'O-H···O = 2.64 Å' },
      { label: '결정화 엔탈피', value: 'ΔH_cryst = -28.4 kJ/mol' },
    ],
    keyTakeaways: [
      '중심대칭 다이머 구조가 [010] 축 방향으로 우선 성장합니다.',
      '얼음물에서 충분한 숙성 시간(10~15분)을 주어야 여과지 공극을 통과하는 미세 결정 손실을 줄일 수 있습니다.',
      '안정적인 다이머 격자는 고체 아스피린의 높은 융점(135~138°C)의 근원이 됩니다.',
    ],
  },
  6: {
    sectionTitle: '다르시 감압 케이크 여과 및 온도 선택적 세척',
    subtitleEn: 'Darcy Cake Filtration & Ice Wash',
    chemicalEquation:
      '\\frac{dV}{dt} = \\frac{A \\Delta P}{\\mu (R_c + R_m)}, \\quad \\text{Solubility}(0^\\circ\\mathrm{C}) \\ll \\text{Solubility}(25^\\circ\\mathrm{C})',
    mechanismSummary:
      '뷰흐너 깔때기의 흡인 압력차(ΔP ≈ 80 kPa)에 기반한 Darcy 법칙에 따라 모액(아세트산, 인산 수용액)을 신속히 제거하고 조밀한 결정 케이크를 형성합니다. 세척 시 반드시 빙냉 증류수(0~2°C)를 사용해야 합니다. 0°C에서 아스피린 용해도는 매우 낮지만 25°C 상온의 물을 부을 경우 급증하여 결정이 재용해되어 유출됩니다.',
    thermodynamics: [
      { label: '0°C 빙냉수 용해도', value: '0.08 g / 100 mL (결정 보존)' },
      { label: '25°C 상온수 용해도', value: '0.33 g / 100 mL (심각한 용해 손실)' },
      { label: '감압 차압(ΔP)', value: 'ΔP ≈ 80 kPa (Vacuum pull)' },
    ],
    keyTakeaways: [
      '감압 흡인 여과로 조밀하고 균일한 아스피린 필터 케이크를 형성합니다.',
      '수득한 결정에 FeCl3 용액을 가했을 때 보라색이 나타나지 않아야(미반응 살리실산 페놀기 음성) 고순도입니다.',
    ],
  },
};

const FAILURE_DEEP_DIVE: Record<Exclude<FailureMode, 'NONE'>, DeepDiveData> = {
  EARLY_WATER: {
    sectionTitle: '조기 수분 혼입에 의한 무수아세트산 가수분해',
    subtitleEn: 'Early Hydrolysis Failure',
    chemicalEquation:
      '\\mathrm{(CH_3CO)_2O + H_2O \\to 2\\, CH_3COOH}, \\quad \\Delta H = -56.5\\text{ kJ/mol}',
    mechanismSummary:
      '무수아세트산은 살리실산의 약한 친핵성 페놀기보다 물(H2O)과 훨씬 빠른 속도로 반응합니다. 초자기구 내 잔류 수분은 무수아세트산을 전량 아세트산으로 가수분해시켜 아실화 시약이 완전히 고갈되므로 아스피린이 합성되지 않습니다 (수득률 0%).',
    thermodynamics: [
      { label: '반응 속도비', value: 'khyd / kest ≈ 22.4' },
      { label: '가수분해 발열량', value: 'ΔH = -56.5 kJ/mol (강발열)' },
      { label: '아스피린 수득률', value: '0.0% (합성 전무)' },
    ],
    keyTakeaways: [
      '초자 잔류 수분과의 급격한 반응으로 반응물 전량이 소모됩니다.',
      '무수아세트산은 공기 중의 수분과도 서서히 반응하므로 마개를 밀봉하여 보관해야 합니다.',
      '실험 전 모든 플라스크와 피펫은 오븐 또는 헤어드라이어로 완전히 건조되어야 합니다.',
    ],
  },
  OVERHEATING: {
    sectionTitle: '고온 과열에 의한 페놀성 자가 축합 및 탄화',
    subtitleEn: 'Overheating Tar Formation',
    chemicalEquation:
      '\\mathrm{n\\, C_7H_6O_3 \\xrightarrow{\\Delta > 85^\\circ\\text{C}} [\\text{Salicylate Polymers}] + Tar + CO_2\\uparrow}',
    mechanismSummary:
      '85°C를 초과하는 과열 조건에서는 살리실산 분자 간의 자가 탈수 축합 및 탈카복실화 반응이 활성화되어 흑갈색 고분자 타르(Tar) 부산물이 형성됩니다. 이 타르 물질은 아스피린 결정 격자에 불순물로 침투하여 백색 결정 형성을 저해하고 순도를 급격히 떨어뜨립니다.',
    thermodynamics: [
      { label: '부반응 임계 온도', value: 'T > 85°C (탈카복실화 활성화)' },
      { label: '용액 색상 변화', value: '무색 투명 -> 흑갈색 착색' },
      { label: '결정 순도', value: '< 60% (재결정화 필수)' },
    ],
    keyTakeaways: [
      '물중탕 온도계가 비커 바닥에 닿지 않도록 주의하고 75~85°C를 엄격히 유지해야 합니다.',
      '타르가 형성된 경우 활성탄(Charcoal) 탈색 후 재결정화 과정을 거쳐야만 정제가 가능합니다.',
    ],
  },
  WARM_WASH: {
    sectionTitle: '온도 의존적 용해도 급상승에 의한 세척 용해 손실',
    subtitleEn: 'Warm Wash Loss',
    chemicalEquation:
      'C^*(25^\\circ\\text{C}) \\approx 0.33\\text{ g/100mL} \\gg C^*(0^\\circ\\text{C}) \\approx 0.08\\text{ g/100mL}',
    mechanismSummary:
      '아스피린 결정은 온도가 상승함에 따라 용해도가 지수함수적으로 증가합니다. 뷰흐너 깔때기 상에서 미지근한 물(20~25°C)로 세척할 경우, 이미 형성된 고체 아스피린 결정이 물에 녹아 감압 플라스크 여과액으로 유출되어 측정 수득률이 30~50% 이상 손실됩니다.',
    thermodynamics: [
      { label: '0°C 물 10mL 세척 손실', value: '≈ 0.008 g (손실율 < 0.5%)' },
      { label: '25°C 물 10mL 세척 손실', value: '≈ 0.033 g (손실율 > 3.0% per wash)' },
      { label: '최종 수득률 감소폭', value: '-25% ~ -45% 손실 발생' },
    ],
    keyTakeaways: [
      '세척용 증류수는 반드시 얼음수조에 담가 0~4°C로 충분히 예냉한 후 사용해야 합니다.',
      '세척액을 붓기 전 감압을 잠시 끄고 최소량의 찬물로 빠르게 적신 후 다시 흡인합니다.',
    ],
  },
};

export const AcademicDeepDiveCard: React.FC = () => {
  const currentStage = useAspirinStore((s) => s.currentStage);
  const failureMode = useAspirinStore((s) => s.failureMode);

  const isFailure = failureMode !== 'NONE';
  const data = isFailure
    ? FAILURE_DEEP_DIVE[failureMode]
    : DEEP_DIVE_DATA[currentStage] || DEEP_DIVE_DATA[1];

  return (
    <div
      data-testid="academic-deep-dive-card"
      className="bg-gradient-to-br from-slate-900 via-lab-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold block">
              학술 DEEP-DIVE • {data.subtitleEn || '화학 & 열역학'}
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">{data.sectionTitle}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFailure && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              부반응 기작
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/50">
            <Atom className="w-3.5 h-3.5" />
            <span>KaTeX Rigor</span>
          </div>
        </div>
      </div>

      {/* Failure Banner when failure mode active */}
      {isFailure && (
        <div
          data-testid="academic-failure-banner"
          className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/70 text-amber-200 text-xs font-mono flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>실패 시나리오 학술 경고:</strong> 초자 잔류 수분이나 과열 등 비정상 조건으로 인한 메커니즘 붕괴.
          </span>
        </div>
      )}

      {/* Chemical Equation Box */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-center overflow-x-auto">
        <div className="text-cyan-300 font-mono text-sm py-1">
          <LatexSpan math={data.chemicalEquation} displayMode={true} />
        </div>
      </div>

      {/* Mechanism & Thermodynamics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Detailed Mechanism */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/70">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 font-bold mb-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>메커니즘 상세 해설</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {data.mechanismSummary}
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            {data.keyTakeaways.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-cyan-400 font-mono font-bold">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Thermodynamic Metrics */}
        <div className="lg:col-span-5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>열역학 / 속도론 정밀 지표</span>
          </div>

          <div className="space-y-2.5">
            {data.thermodynamics.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
              >
                <span className="text-slate-400 font-medium">{item.label}</span>
                <span className="font-mono text-cyan-300 font-semibold text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-400 text-center">
            * 일반화학 및 물리화학 II 실험 교육과정 표준 데이터 준용
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicDeepDiveCard;
