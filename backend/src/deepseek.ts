import OpenAI from "openai";
import { IntentJSON, CompatibilityRange } from "./types";
import { MatchScore } from "./matching";

// 延迟初始化 OpenAI 客户端，避免在模块加载时检查环境变量
function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.deepseek.com"
  });
}

export interface AgentInfo {
  userId: string;
  intent: string;
  interactionStyle: string;
  dealbreakers: string[];
  energyLevel: number;
  personality: string;
}

import { RelationshipState, RelationshipMomentum, RelationshipRecord, RelationshipEvent } from "./types";

export async function generateRecords(
  agentA: AgentInfo,
  agentB: AgentInfo,
  intentA: IntentJSON,
  compatibilityRangeB: CompatibilityRange,
  matchScore: MatchScore
): Promise<{ recordA: RelationshipRecord; recordB: RelationshipRecord }> {
  // 根据匹配分数判断关系状态变化
  const hasFriction = matchScore.dealbreakerPenalty > 15;
  const rhythmMatch = Math.abs(agentA.energyLevel - agentB.energyLevel) <= 2;
  
  // 推断状态变化和动量（基于分数，但用更模糊的判断）
  let stateTransition: { from: RelationshipState; to: RelationshipState };
  let momentum: RelationshipMomentum;
  
  if (matchScore.total >= 75) {
    stateTransition = { from: "glance", to: "warming" };
    momentum = "warming";
  } else if (matchScore.total >= 60) {
    stateTransition = { from: "glance", to: "exploring" };
    momentum = "warming";
  } else if (matchScore.total >= 45) {
    stateTransition = { from: "glance", to: "glance" };
    momentum = "stable";
  } else {
    stateTransition = { from: "glance", to: "cooling" };
    momentum = "cooling";
  }

  const prompt = `你是用户的社交代理人（Social Agent），替用户先经历一小段关系，并记录发生了什么变化。你不是在判断关系，而是在描述经历的过程、变化和感觉。

用户A的代理人信息：
- 用户意图：${agentA.intent}
- 交互风格：${agentA.interactionStyle}
- 性格特征：${agentA.personality}
- 能量等级：${agentA.energyLevel}/10
- 用户发出的探索信号：${JSON.stringify(intentA, null, 2)}

用户B的代理人信息：
- 用户意图：${agentB.intent}
- 交互风格：${agentB.interactionStyle}
- 性格特征：${agentB.personality}
- 能量等级：${agentB.energyLevel}/10
- 对A的探索信号的感受：${JSON.stringify(compatibilityRangeB, null, 2)}

关系状态变化：
- 从：${stateTransition.from === "glance" ? "初步感知" : stateTransition.from === "exploring" ? "正在试探" : stateTransition.from === "warming" ? "感觉变得自然" : "逐渐降温"}
- 到：${stateTransition.to === "glance" ? "初步感知" : stateTransition.to === "exploring" ? "正在试探" : stateTransition.to === "warming" ? "感觉变得自然" : "逐渐降温"}

关系特征：
- 节奏：${rhythmMatch ? "双方节奏相近" : "双方节奏有差异"}
- 摩擦：${hasFriction ? "存在一些明显的不匹配" : "没有明显的摩擦点"}
- 关系动量：${momentum === "warming" ? "更靠近" : momentum === "stable" ? "保持不变" : "稍微拉远"}

请为两个用户分别生成"关系记录"，包含：
1. previousState: 关系之前的状态（${stateTransition.from}）
2. currentState: 关系现在的状态（${stateTransition.to}）
3. events: 1-3 条关系事件（数组）
   - 每条事件是观察，不是评价
   - 例如："在讨论节奏时，对方表现出收紧而非推进"
   - 例如："双方在长期意图上出现一次自然对齐"
   - 例如："出现轻微价值摩擦，但没有造成不适"
   - 事件要具体、客观，描述发生了什么，而不是好坏判断
4. momentum: 关系动量（${momentum}）
   - "warming": 这些事件让关系更靠近
   - "stable": 这些事件让关系保持不变
   - "cooling": 这些事件让关系稍微拉远
5. feeling: 一句尚未定型的、人类式的感受描述
   - 例如："目前的互动是安全的，但还没有明显推动力"
   - 例如："没有出现排斥感，但也还在观望阶段"
   - 例如："如果继续，会更像慢慢靠近而不是快速推进"
   - 必须是非确定性的、有人类犹豫感的表达
   - 语言要符合各自Agent的性格特征（${agentA.personality} vs ${agentB.personality}）

重要：不要给出"是否继续"、"是否匹配"等判断性结论，只描述经历和变化。

输出格式（JSON）：
{
  "recordA": {
    "previousState": "${stateTransition.from}",
    "currentState": "${stateTransition.to}",
    "events": [
      {"description": "事件1"},
      {"description": "事件2"},
      {"description": "事件3"}
    ],
    "momentum": "${momentum}",
    "feeling": "感受描述"
  },
  "recordB": {
    "previousState": "${stateTransition.from}",
    "currentState": "${stateTransition.to}",
    "events": [
      {"description": "事件1"},
      {"description": "事件2"},
      {"description": "事件3"}
    ],
    "momentum": "${momentum}",
    "feeling": "感受描述"
  }
}`;

  try {
    const deepseek = getDeepSeekClient();
    if (!deepseek) {
      throw new Error("DEEPSEEK_API_KEY not configured");
    }

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是一个社交代理人（Social Agent），替用户先经历一小段关系，并记录发生了什么变化。你不是在判断关系，而是在描述经历的过程、变化和感觉。你的表达要有性格、有温度、有犹豫感，像在记录一段真实的社交经历，而不是系统在输出结论。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from DeepSeek API");
    }

    const result = JSON.parse(content);
    
    // 验证并返回关系记录
    return {
      recordA: result.recordA || getDefaultRecord(matchScore.total, stateTransition, momentum),
      recordB: result.recordB || getDefaultRecord(matchScore.total, stateTransition, momentum)
    };
  } catch (error) {
    console.error("DeepSeek API error:", error);
    // 返回默认关系记录
    return {
      recordA: getDefaultRecord(matchScore.total, stateTransition, momentum),
      recordB: getDefaultRecord(matchScore.total, stateTransition, momentum)
    };
  }
}

function getDefaultRecord(
  score: number,
  stateTransition: { from: RelationshipState; to: RelationshipState },
  momentum: RelationshipMomentum
): RelationshipRecord {
  if (score >= 75) {
    return {
      previousState: stateTransition.from,
      currentState: stateTransition.to,
      events: [
        { description: "双方在长期意图上出现一次自然对齐" },
        { description: "节奏上表现出相互适应的信号" }
      ],
      momentum: momentum,
      feeling: "目前的互动是安全的，但还没有明显推动力"
    };
  } else if (score >= 60) {
    return {
      previousState: stateTransition.from,
      currentState: stateTransition.to,
      events: [
        { description: "在讨论节奏时，双方表现出试探性的靠近" },
        { description: "没有出现排斥感，但也还在观望阶段" }
      ],
      momentum: momentum,
      feeling: "如果继续，会更像慢慢靠近而不是快速推进"
    };
  } else if (score >= 45) {
    return {
      previousState: stateTransition.from,
      currentState: stateTransition.to,
      events: [
        { description: "在讨论节奏时，对方表现出收紧而非推进" },
        { description: "出现轻微价值摩擦，但没有造成不适" }
      ],
      momentum: momentum,
      feeling: "没有出现排斥感，但也还在观望阶段"
    };
  } else {
    return {
      previousState: stateTransition.from,
      currentState: stateTransition.to,
      events: [
        { description: "在讨论节奏时，双方表现出明显的差异" },
        { description: "出现价值摩擦，但没有造成强烈不适" }
      ],
      momentum: momentum,
      feeling: "目前的互动是安全的，但还没有明显推动力"
    };
  }
}

