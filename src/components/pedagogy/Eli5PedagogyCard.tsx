/**
 * Eli5PedagogyCard.tsx
 * ELI5 (Explain Like I'm 5) Intuitive Pedagogical Visual Analogy Card.
 * Renders tangible, vivid real-life visual metaphors for all 6 synthesis stages and 3 failure modes.
 * Complies with SPEC-UI-3D-PEDAGOGY-001 Section 5.
 */

import React from 'react';
import { useAspirinStore } from '../../store/useAspirinStore';
import { SynthesisStageId, FailureMode } from '../../engine/types';
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Flame,
  Droplets,
  Snowflake,
  Coffee,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface StageMetaphor {
  titleEn: string;
  titleKo: string;
  metaphorSub: string;
  story: string;
  visualHighlight: string;
  scientificAnchor: string;
  keyTakeaway: string;
  badgeColor: string;
  icon: React.ReactNode;
}

interface FailureMetaphor {
  mode: FailureMode;
  titleEn: string;
  titleKo: string;
  story: string;
  visualHighlight: string;
  scientificAnchor: string;
}

const STAGE_METAPHORS: Record<SynthesisStageId, StageMetaphor> = {
  1: {
    titleEn: 'The Winter Coat Swap Meet',
    titleKo: '겨울 코트 스왑 미팅',
    metaphorSub: '인산(H+)이 무수아세트산의 철문을 활짝 여는 순간',
    story:
      '살리실산 분자는 얇은 스웨터(가벼운 옷)를 입고 파티에 왔어요. 무수아세트산은 두 벌의 두꺼운 겨울 코트(아세틸기)가 하나로 꿰매어진 옷을 입고 있죠. 인산 촉매는 친절한 마법 재단사(H+)로 가위를 들고 나타나 코트 하나를 싹둑 잘라내어 살리실산에게 입혀줄 준비를 합니다!',
    visualHighlight: '인산(H+) 열쇠가 문을 열어 살리실산의 결합을 유도합니다.',
    scientificAnchor: '산 촉매 양성자화(Protonation)에 의한 카보닐 탄소의 친전자성(δ+) 극대화',
    keyTakeaway: '인산 촉매 없이는 실온에서 반응 속도가 1만 배 이상 느려 합성이 거의 일어나지 않습니다.',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
        <Building2 className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[9px] font-bold text-black items-center justify-center">H</span>
        </span>
      </div>
    ),
  },
  2: {
    titleEn: 'The Sauna Transformation',
    titleKo: '사우나 대변신',
    metaphorSub: '따뜻한 온천(75~85°C)에서 일어나는 완벽한 결합 교환',
    story:
      '따뜻한 80°C 물중탕 사우나에서 살리실산 분자가 잘려나간 겨울 코트(아세틸기)를 재빨리 낚아채 걸쳐 입고 아스피린으로 대변신합니다. 남겨진 조각은 시큼한 식초(아세트산)가 되어 날아갑니다.',
    visualHighlight: '아세틸기가 이동하고 아세트산 부산물이 탈락합니다.',
    scientificAnchor: '친핵성 아실 치환(SnAc) 반응 & 사면체 중간체(sp3)를 거치는 에스테르화',
    keyTakeaway: '물중탕 온도가 85°C를 넘지 않아야 불순물 타르 형성을 막고 90% 이상 수득률을 얻습니다.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-400">
        <Flame className="w-8 h-8" />
      </div>
    ),
  },
  3: {
    titleEn: 'The Sneaky Disguise Party',
    titleKo: '비밀 위장 파티',
    metaphorSub: '얼음물에 넣어도 결정이 안 생기고 투명한 이유!',
    story:
      '플라스크를 0~4°C 얼음물에 푹 담가도 아스피린은 결정을 만들지 않고 투명하게 녹아있어요! 왜일까요? 플라스크 안에 가득 찬 식초(아세트산) 친구들이 아스피린을 포근히 둘러싸 숨겨주고 있기 때문이죠 (공용매 효과와 준안정 영역).',
    visualHighlight: '아세트산 공용매 쉘이 아스피린을 둘러싸 결정을 가로막고 있습니다.',
    scientificAnchor: '아세트산 공용매(Co-solvent, εr≈6.2) 효과 및 준안정 영역(Metastable Zone)',
    keyTakeaway: '단순 냉각만으로는 높은 아세트산 용해도 때문에 핵생성 장벽(ΔG* > 65 kBT)을 넘지 못해 결정이 석출되지 않습니다.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-800/80 text-blue-400">
        <Snowflake className="w-8 h-8" />
      </div>
    ),
  },
  4: {
    titleEn: 'The Strict Water Guard Arrives!',
    titleKo: '엄격한 물 경비원의 습격',
    metaphorSub: '증류수 한 방울에 하얀 바늘 결정이 쏟아져 나오는 마법',
    story:
      '차가운 증류수 경비원이 거대한 파도처럼 쏟아져 들어옵니다! 물 경비원은 기름진 아스피린을 밀어내고 아세트산 친구들을 낚아채갑니다. 숨을 곳을 잃은 아스피린 분자들은 살기 위해 서로를 꽉 끌어안으며 3초 만에 새하얀 바늘 결정 눈꽃을 폭발시킵니다!',
    visualHighlight: '유전율 급상승으로 에너지 장벽이 무너지며 침상 결정이 쏟아집니다.',
    scientificAnchor: '반용매(Antisolvent, εr≈80) 주입에 따른 CNT 핵생성 장벽(ΔG* ≈ 0.14 kBT) 붕괴',
    keyTakeaway: '증류수는 과량의 무수아세트산을 분해(Quenching)함과 동시에 용해도를 100배 떨어뜨려 결정을 석출시킵니다.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
        <Droplets className="w-8 h-8" />
      </div>
    ),
  },
  5: {
    titleEn: 'Building the Crystal Skyscraper',
    titleKo: '결정 마천루 건설',
    metaphorSub: '가만히 안치해두면 결정이 규칙적이고 순수하게 자라납니다',
    story:
      '얼음물에서 조용히 쉬는 동안, 바늘 결정들이 [010] 결정 축을 따라 나노 레고 블록처럼 정교하게 맞물리며 길고 단단한 결정 마천루를 건설하여 바닥에 차곡차곡 가라앉습니다.',
    visualHighlight: '작은 결정이 큰 결정 격자에 흡수되며 치밀한 단사정계 바늘 결정을 완성합니다.',
    scientificAnchor: '단사정계 Form I 결정 습성 및 오스트발트 숙성(Ostwald Ripening)',
    keyTakeaway: '숙성 시간을 충분히 가져야 여과 시 여과지 공극으로 빠져나가는 미세 결정 손실을 방지합니다.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/80 text-purple-400">
        <Sparkles className="w-8 h-8" />
      </div>
    ),
  },
  6: {
    titleEn: 'The Ultimate Juice Press & Refreshing Shower',
    titleKo: '궁극의 착즙기와 상쾌한 샤워',
    metaphorSub: '깨끗한 순백색 건조 아스피린 결정만 남기는 마지막 관문',
    story:
      '뷰흐너 깔때기의 강력한 진공 모터가 거대한 빨대처럼 끈적한 모액을 단숨에 들이마시고, 얼음장처럼 차가운 빙냉 증류수 샤워가 불순물 식초를 싹 씻어내어 뽀송뽀송하고 순수한 하얀 아스피린 케이크만 남깁니다.',
    visualHighlight: '감압 흡인으로 모액을 분리하고 순수 결정을 수득합니다.',
    scientificAnchor: '다르시 케이크 여과 법칙(Darcy\'s Law) 및 빙냉 세척 선택도',
    keyTakeaway: '반드시 0~4°C 빙냉수로 세척해야 결정 용해 손실(<2%)을 막고 순도 99% 이상을 달성합니다.',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    icon: (
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-950/60 border border-teal-800/80 text-teal-400">
        <Coffee className="w-8 h-8" />
      </div>
    ),
  },
};

const FAILURE_METAPHORS: Record<Exclude<FailureMode, 'NONE'>, FailureMetaphor> = {
  EARLY_WATER: {
    mode: 'EARLY_WATER',
    titleEn: 'The Soggy Tailor Disaster',
    titleKo: '젖은 재단사의 비극',
    story:
      '재단사(인산)가 가위를 꺼내들기도 전에 젖은 플라스크의 물방울이 무수아세트산을 덮쳐 두 쪽으로 쪼개버렸어요! 아스피린은 하나도 만들어지지 않고(수득률 0%), 철염(FeCl3) 시험에서 진한 보라색만 남깁니다.',
    visualHighlight: '무수아세트산이 살리실산과 반응하기 전에 물과 반응하여 전량 아세트산으로 소멸합니다.',
    scientificAnchor: '무수아세트산의 우선적 발열 가수분해: Ac2O + H2O -> 2 AcOH (수득률 0%, FeCl3 보라색 정색)',
  },
  OVERHEATING: {
    mode: 'OVERHEATING',
    titleEn: 'The Burnt Caramel Nightmare',
    titleKo: '타버린 카라멜 악몽',
    story:
      '사우나 온도가 85°C를 넘어 용광로처럼 과열되자, 살리실산 분자들이 들러붙고 타버려 끈적끈적하고 새카만 탄화 타르가 플라스크 벽에 엉겨 붙어버렸어요!',
    visualHighlight: '고온 산화 및 고분자 자기 축합으로 검은 타르 부산물이 생성됩니다.',
    scientificAnchor: '살리실산 분자 간 자기축합 및 고온 탄화 타르 형성 (Tar Formation)',
  },
  WARM_WASH: {
    mode: 'WARM_WASH',
    titleEn: 'The Warm Jacuzzi Melt-Down',
    titleKo: '따뜻한 자쿠지 용해 참사',
    story:
      '여과할 때 얼음물이 아닌 따뜻한 미지근한 물(25°C)을 부어버렸어요! 힘들게 키운 아스피린 결정들이 온천욕을 하듯 물에 스르륵 녹아 감압 플라스크로 다 빠져나가 수득률이 폭락했습니다.',
    visualHighlight: '상온 수용해도 급상승으로 인해 아스피린 결정이 여과액으로 녹아 유출됩니다.',
    scientificAnchor: '온도 상승에 따른 아스피린 수용해도 급증 및 재용해 손실 (0.15g at 0°C vs 0.33g at 25°C)',
  },
};

export const Eli5PedagogyCard: React.FC = () => {
  const currentStage = useAspirinStore((s) => s.currentStage);
  const failureMode = useAspirinStore((s) => s.failureMode);

  const stageData = STAGE_METAPHORS[currentStage] || STAGE_METAPHORS[1];
  const isFailure = failureMode !== 'NONE';
  const failureData = isFailure ? FAILURE_METAPHORS[failureMode] : null;

  return (
    <div
      data-testid="eli5-card"
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
              ELI5 직관 비유 모델 • {isFailure && failureData ? failureData.titleEn : stageData.titleEn}
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFailure && failureData ? failureData.titleKo : stageData.titleKo}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFailure && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              실패 분기
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            STAGE {currentStage}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Icon Box */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="mb-2">{stageData.icon}</div>
          <span className="text-[10px] font-mono text-slate-400 text-center leading-tight">
            {isFailure && failureData ? failureData.visualHighlight : stageData.visualHighlight}
          </span>
        </div>

        {/* Right Story Box */}
        <div className="md:col-span-9 flex flex-col justify-between">
          <div className="text-xs font-mono text-amber-400 mb-1 font-semibold">
            {isFailure ? '⚠️ 실패 시나리오 비유' : stageData.metaphorSub}
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
            {isFailure && failureData ? failureData.story : stageData.story}
          </p>

          {/* Scientific Anchor Tag */}
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 px-3 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold text-[11px]">
              학술 앵커링: {isFailure && failureData ? failureData.scientificAnchor : stageData.scientificAnchor}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Key Takeaway */}
      {!isFailure && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>핵심 포인트: {stageData.keyTakeaway}</span>
        </div>
      )}
    </div>
  );
};

export default Eli5PedagogyCard;
