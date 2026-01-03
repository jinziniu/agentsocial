import { SocialAgent } from "../SocialAgent";
import { IntentJSON, CompatibilityRange, RelationshipMomentum, RelationshipEvent, RelationshipRecord } from "../types";
import { MatchScore, calculateMatchScore } from "../matching";

export type TraceEntryType = "signal" | "question" | "boundary" | "offer" | "reflection";

export interface TraceEntry {
  round: number;
  speaker: "AgentA" | "AgentB";
  type: TraceEntryType;
  content: string; // 自然语言，社交语气
  payload?: any; // 结构化数据，可选
  microReflection?: string; // 局部反思
}

export interface NegotiationResult {
  trace: TraceEntry[];
  summary: RelationshipRecord;
}

export async function runNegotiation(
  agentA: SocialAgent,
  agentB: SocialAgent,
  intentA: IntentJSON
): Promise<NegotiationResult> {
  const trace: TraceEntry[] = [];
  const rounds = 4; // 固定 4 轮

  // Round 1: AgentA 发出初始信号
  const signalContent = generateSignal(agentA, intentA, 1);
  trace.push({
    round: 1,
    speaker: "AgentA",
    type: "signal",
    content: signalContent,
    payload: { 
      intent: intentA,
      agentInfo: {
        userId: agentA.userId,
        interactionStyle: agentA.interactionStyle,
        personality: agentA.personality,
        energyLevel: agentA.energyLevel
      }
    }
  });
  agentA.recordMemory("send_signal", { round: 1, intent: intentA });

  // Round 2: AgentB 回应并提问
  const compatibilityRangeB = agentB.evaluateCompatibility(intentA);
  const questionContent = generateQuestion(agentB, intentA, compatibilityRangeB, signalContent);
  trace.push({
    round: 2,
    speaker: "AgentB",
    type: "question",
    content: questionContent,
    payload: { 
      compatibilityRange: compatibilityRangeB,
      agentInfo: {
        userId: agentB.userId,
        interactionStyle: agentB.interactionStyle,
        personality: agentB.personality,
        energyLevel: agentB.energyLevel
      },
      receivedSignal: signalContent
    }
  });
  agentB.recordMemory("respond_question", { round: 2, intentA, compatibilityRangeB });

  // Round 3: AgentA 提供边界和提议
  const boundaryContent = generateBoundary(agentA, agentB.dealbreakers, questionContent);
  trace.push({
    round: 3,
    speaker: "AgentA",
    type: "boundary",
    content: boundaryContent,
    payload: { 
      dealbreakers: agentA.dealbreakers,
      receivedQuestion: questionContent,
      evaluation: "基于对方提问，明确自己的边界"
    }
  });
  const offerContent = generateOffer(agentA, intentA, boundaryContent);
  trace.push({
    round: 3,
    speaker: "AgentA",
    type: "offer",
    content: offerContent,
    payload: { 
      offer: intentA,
      communicationFrequency: intentA.communicationFrequency,
      timeCommitment: intentA.timeCommitment,
      relationshipType: intentA.relationshipType
    }
  });
  agentA.recordMemory("set_boundary_offer", { round: 3 });

  // Round 4: AgentB 最终反思
  const reflectionContent = generateReflection(agentB, compatibilityRangeB, agentA, offerContent);
  trace.push({
    round: 4,
    speaker: "AgentB",
    type: "reflection",
    content: reflectionContent,
    payload: { 
      finalReflection: true,
      receivedOffer: offerContent,
      compatibilityAssessment: {
        hasCommonTopics: compatibilityRangeB.preferredTopics.length > 0,
        preferredTopics: compatibilityRangeB.preferredTopics,
        acceptableFrequencies: compatibilityRangeB.acceptableFrequencies,
        acceptableRelationshipTypes: compatibilityRangeB.acceptableRelationshipTypes
      },
      agentComparison: {
        styleA: agentA.interactionStyle,
        styleB: agentB.interactionStyle,
        energyDiff: Math.abs(agentA.energyLevel - agentB.energyLevel)
      }
    }
  });
  agentB.recordMemory("final_reflection", { round: 4 });

  // 计算匹配分数
  const matchScore = calculateMatchScore(
    intentA,
    compatibilityRangeB,
    agentA.interactionStyle,
    agentB.interactionStyle,
    agentA.dealbreakers,
    agentB.dealbreakers,
    agentA.energyLevel,
    agentB.energyLevel
  );

  // 生成每轮的局部反思
  addMicroReflections(trace, matchScore);

  // 生成最终总结
  const summary = generateSummary(matchScore, trace, agentA, agentB);

  return { trace, summary };
}

function generateSignal(agent: SocialAgent, intent: IntentJSON, round: number): string {
  // 根据 Agent 的性格特征生成更自然的开场
  if (agent.personality.includes("理性") || agent.personality.includes("直接")) {
    return `你好，我这边主要是想${intent.purpose}。对${intent.topics.join("、")}这些方向比较感兴趣，不知道你那边情况如何？`;
  } else if (agent.personality.includes("感性") || agent.personality.includes("细腻")) {
    return `嗨，最近在思考${intent.purpose}这件事。特别是${intent.topics[0]}，感觉很有意思，想看看有没有共同探索的空间`;
  } else if (agent.personality.includes("务实") || agent.personality.includes("高效")) {
    return `你好，我这边在寻找${intent.purpose}的机会。主要关注${intent.topics.join("和")}，如果你也有类似想法，我们可以聊聊`;
  } else {
    return `你好，我这边想${intent.purpose}，对${intent.topics.join("、")}比较感兴趣。想看看我们是否有合作的可能`;
  }
}

function generateQuestion(agent: SocialAgent, intent: IntentJSON, compatibility: CompatibilityRange, previousContent?: string): string {
  // 根据对方的信号和 Agent 的性格生成回应
  if (compatibility.preferredTopics.length > 0) {
    if (agent.personality.includes("理性") || agent.personality.includes("直接")) {
      return `关于${compatibility.preferredTopics[0]}，我也有兴趣。你希望怎么样的交流节奏？是偏向深度讨论还是更灵活一些？`;
    } else if (agent.personality.includes("感性")) {
      return `听起来不错，${compatibility.preferredTopics[0]}确实是个有意思的方向。你平时是怎么探索这个领域的？`;
    } else {
      return `好的，${compatibility.preferredTopics[0]}这个方向我也在关注。你希望怎么样的交流频率和方式？`;
    }
  }
  
  // 如果没有明显匹配的话题，更谨慎地提问
  if (agent.personality.includes("理性")) {
    return `你提到的${intent.topics[0]}，具体是指什么方向？我想先了解一下，看看是否匹配`;
  } else {
    return `关于${intent.topics[0]}，能多说说你的想法吗？我想看看我们是否有共同点`;
  }
}

function generateBoundary(agent: SocialAgent, otherDealbreakers: string[], previousQuestion?: string): string {
  // 根据对方的提问和 Agent 的性格生成边界说明
  if (agent.dealbreakers.length > 0) {
    if (agent.personality.includes("直接")) {
      return `嗯，关于节奏的话，我这边不太能接受${agent.dealbreakers[0]}这种模式，其他都还好。你那边呢？`;
    } else if (agent.personality.includes("感性")) {
      return `我觉得节奏上，${agent.dealbreakers[0]}可能不太适合我，但其他方向我比较开放。你觉得呢？`;
    } else {
      return `我这边比较看重${agent.dealbreakers[0]}这一点，如果这个不合适可能就不太匹配。其他方面我倒比较灵活`;
    }
  }
  
  if (agent.personality.includes("开放") || agent.personality.includes("灵活")) {
    return `我这边比较开放，主要是看节奏是否合适，还有双方是否真的能产生价值。你觉得呢？`;
  } else {
    return `我这边主要看节奏和方向是否匹配，其他都还好说`;
  }
}

function generateOffer(agent: SocialAgent, intent: IntentJSON, previousBoundary?: string): string {
  // 根据之前的对话生成提议
  if (agent.personality.includes("务实") || agent.personality.includes("高效")) {
    return `如果节奏合适的话，我们可以${intent.communicationFrequency}交流，大概${intent.timeCommitment}。这样既能保持联系，又不会太占用彼此时间，你觉得怎么样？`;
  } else if (agent.personality.includes("感性")) {
    return `如果感觉对的话，我们可以${intent.communicationFrequency}交流，大概${intent.timeCommitment}。我觉得关系需要慢慢培养，不用太急`;
  } else {
    return `如果节奏合适，我们可以${intent.communicationFrequency}交流，${intent.timeCommitment}左右。这样应该比较平衡`;
  }
}

function generateReflection(agent: SocialAgent, compatibility: CompatibilityRange, otherAgent: SocialAgent, previousOffer?: string): string {
  // 根据整个对话过程生成最终反思
  const hasCommonTopics = compatibility.preferredTopics.length > 0;
  
  if (hasCommonTopics) {
    if (agent.personality.includes("理性")) {
      return `整体来看，我们在${compatibility.preferredTopics[0]}上有共同点，这是好的基础。节奏上可能需要再磨合一下，但方向是对的`;
    } else if (agent.personality.includes("感性")) {
      return `感觉在${compatibility.preferredTopics[0]}上我们有共鸣，这让我觉得有继续了解的空间。节奏上可能需要慢慢来，但我不排斥`;
    } else {
      return `感觉在${compatibility.preferredTopics[0]}上有共同点，节奏上可能需要再磨合一下，但整体方向是匹配的`;
    }
  } else {
    if (agent.personality.includes("理性")) {
      return `目前来看，我们还没有特别明显的连接点，但也没有排斥感。可能需要更多时间才能判断是否真的匹配`;
    } else {
      return `目前还没有特别明显的连接点，但也没有排斥感。如果继续的话，可能需要更多探索才能找到共同方向`;
    }
  }
}

function addMicroReflections(trace: TraceEntry[], matchScore: MatchScore): void {
  // 为每轮添加局部反思
  const reflections = [
    matchScore.total >= 70 ? "这轮之后关系更靠近" : matchScore.total >= 50 ? "这轮之后关系保持稳定" : "这轮之后关系稍微拉远",
    matchScore.total >= 70 ? "目前没有明显不适，但还在观察中" : "需要再感受一下节奏",
    matchScore.total >= 70 ? "如果继续，会更像慢慢靠近" : "暂时还不太确定"
  ];

  trace.forEach((entry, idx) => {
    if (entry.type === "reflection" || (entry.type === "offer" && idx === trace.length - 2)) {
      entry.microReflection = reflections[Math.min(idx, reflections.length - 1)];
    }
  });
}

function generateSummary(
  matchScore: MatchScore,
  trace: TraceEntry[],
  agentA: SocialAgent,
  agentB: SocialAgent
): RelationshipRecord {
  // 推断关系动量
  let momentum: RelationshipMomentum;
  if (matchScore.total >= 70) {
    momentum = "warming";
  } else if (matchScore.total >= 50) {
    momentum = "stable";
  } else {
    momentum = "cooling";
  }

  // 从 trace 中提取事件
  const events: RelationshipEvent[] = [];
  
  // 从 trace 中提取关键事件
  trace.forEach(entry => {
    if (entry.type === "signal" || entry.type === "question" || entry.type === "boundary") {
      if (entry.content.includes("节奏") || entry.content.includes("交流")) {
        events.push({ description: entry.content });
      }
    }
  });

  // 确保至少有 1 条事件
  if (events.length === 0) {
    events.push({ description: "双方在交流节奏上进行了初步试探" });
  }

  // 限制事件数量为 1-3 条
  const finalEvents = events.slice(0, 3);

  // 生成感受描述
  let feeling: string;
  if (matchScore.total >= 70) {
    feeling = "目前的互动是安全的，但还没有明显推动力";
  } else if (matchScore.total >= 50) {
    feeling = "没有出现排斥感，但也还在观望阶段";
  } else {
    feeling = "如果继续，会更像慢慢靠近而不是快速推进";
  }

  return {
    previousState: "glance",
    currentState: momentum === "warming" ? "exploring" : momentum === "stable" ? "glance" : "cooling",
    events: finalEvents,
    momentum,
    feeling
  };
}

