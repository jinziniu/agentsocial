import { IntentJSON, CompatibilityRange } from "./types";

export interface MatchScore {
  intentMatch: number;
  styleMatch: number;
  dealbreakerPenalty: number;
  energyMatch: number;
  total: number;
}

export function calculateMatchScore(
  intentA: IntentJSON,
  compatibilityRangeB: CompatibilityRange,
  styleA: string,
  styleB: string,
  dealbreakersA: string[],
  dealbreakersB: string[],
  energyA: number,
  energyB: number
): MatchScore {
  // 1. 意图匹配度 (40%)
  let intentMatch = 0;
  if (compatibilityRangeB.acceptablePurposes.includes(intentA.purpose)) {
    intentMatch += 20;
  }
  
  const topicMatches = intentA.topics.filter(topic => 
    compatibilityRangeB.preferredTopics.some(pref => 
      pref.includes(topic) || topic.includes(pref)
    )
  ).length;
  intentMatch += (topicMatches / intentA.topics.length) * 20;

  // 2. 交互风格兼容性 (20%)
  let styleMatch = 0;
  const styleKeywordsA = styleA.toLowerCase().split(/[,\s]+/);
  const styleKeywordsB = styleB.toLowerCase().split(/[,\s]+/);
  const commonKeywords = styleKeywordsA.filter(k => styleKeywordsB.includes(k));
  if (commonKeywords.length > 0) {
    styleMatch = (commonKeywords.length / Math.max(styleKeywordsA.length, styleKeywordsB.length)) * 20;
  } else {
    // 如果没有共同关键词，检查是否互补
    const complementaryPairs = [
      ["技术", "学习"],
      ["商业", "创业"],
      ["正式", "专业"]
    ];
    const isComplementary = complementaryPairs.some(pair => 
      (styleKeywordsA.some(k => pair.includes(k)) && 
       styleKeywordsB.some(k => pair.includes(k)))
    );
    styleMatch = isComplementary ? 10 : 5;
  }

  // 3. Dealbreakers 检查 (30% 扣分)
  let dealbreakerPenalty = 0;
  const dealbreakerChecks = compatibilityRangeB.dealbreakerChecks;
  const failedChecks = Object.entries(dealbreakerChecks).filter(([_, passed]) => !passed).length;
  dealbreakerPenalty = (failedChecks / Math.max(dealbreakersA.length, 1)) * 30;

  // 检查 B 的 dealbreakers 是否与 A 的意图冲突
  dealbreakersB.forEach(db => {
    if (intentA.purpose.includes(db) || intentA.topics.some(t => t.includes(db))) {
      dealbreakerPenalty += 15;
    }
  });

  // 4. 能量等级匹配 (10%)
  const energyDiff = Math.abs(energyA - energyB);
  const energyMatch = Math.max(0, 10 - (energyDiff * 2));

  // 计算总分
  const total = Math.max(0, Math.min(100, 
    intentMatch + 
    styleMatch + 
    (30 - dealbreakerPenalty) + 
    energyMatch
  ));

  return {
    intentMatch,
    styleMatch,
    dealbreakerPenalty,
    energyMatch,
    total: Math.round(total)
  };
}

