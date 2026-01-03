import { IntentJSON, CompatibilityRange, MemoryEntry } from "./types";

export class SocialAgent {
  userId: string;
  intent: string;
  interactionStyle: string;
  dealbreakers: string[];
  energyLevel: number;
  memory: MemoryEntry[];
  personality: string; // Agent 的性格特征，用于生成有差异的表达

  constructor(
    userId: string,
    intent: string,
    interactionStyle: string,
    dealbreakers: string[],
    energyLevel: number,
    personality?: string
  ) {
    this.userId = userId;
    this.intent = intent;
    this.interactionStyle = interactionStyle;
    this.dealbreakers = dealbreakers;
    this.energyLevel = energyLevel;
    this.memory = [];
    // 根据 interactionStyle 推断性格，或使用传入的 personality
    this.personality = personality || this.inferPersonality(interactionStyle);
  }

  private inferPersonality(style: string): string {
    if (style.includes("技术") || style.includes("学习")) {
      return "理性、直接，喜欢用数据和逻辑说话";
    } else if (style.includes("商业") || style.includes("创业")) {
      return "务实、高效，关注价值和结果";
    } else if (style.includes("创意") || style.includes("艺术")) {
      return "感性、细腻，用比喻和感受表达";
    } else if (style.includes("学习") || style.includes("求知")) {
      return "温和、耐心，喜欢深入探讨";
    } else if (style.includes("自由") || style.includes("灵活")) {
      return "随性、开放，用轻松的语气交流";
    }
    return "友好、平衡，用温和的语气表达";
  }

  generateIntent(): IntentJSON {
    // 基于 Agent 的属性生成结构化意图
    const intentMap: { [key: string]: IntentJSON } = {
      "寻找学习伙伴": {
        purpose: "寻找技术学习伙伴，共同进步",
        topics: ["编程", "技术分享", "项目合作"],
        communicationFrequency: "每周2-3次",
        relationshipType: "学习伙伴",
        timeCommitment: "每周5-10小时"
      },
      "寻找合作者": {
        purpose: "寻找创业合作伙伴，共同发展",
        topics: ["创业", "商业", "产品开发"],
        communicationFrequency: "每天",
        relationshipType: "合作伙伴",
        timeCommitment: "每周20+小时"
      },
      "寻找创意伙伴": {
        purpose: "寻找创意设计伙伴，共同创作",
        topics: ["设计", "艺术", "创意项目"],
        communicationFrequency: "每周2-3次",
        relationshipType: "创意伙伴",
        timeCommitment: "每周8-12小时"
      },
      "寻找投资项目": {
        purpose: "寻找有潜力的创业项目进行投资",
        topics: ["商业计划", "市场分析", "投资"],
        communicationFrequency: "每周1-2次",
        relationshipType: "投资关系",
        timeCommitment: "每周5-8小时"
      },
      "寻找导师": {
        purpose: "寻找经验丰富的导师指导学习",
        topics: ["学习指导", "职业规划", "技能提升"],
        communicationFrequency: "每周1次",
        relationshipType: "师生关系",
        timeCommitment: "每周2-4小时"
      },
      "寻找项目合作": {
        purpose: "寻找灵活的项目合作机会",
        topics: ["项目合作", "自由职业", "远程协作"],
        communicationFrequency: "按需沟通",
        relationshipType: "项目伙伴",
        timeCommitment: "每周10-15小时"
      }
    };

    // 根据 intent 字符串匹配或生成默认
    if (intentMap[this.intent]) {
      return intentMap[this.intent];
    }

    // 默认意图
    return {
      purpose: this.intent,
      topics: ["通用话题"],
      communicationFrequency: "每周1-2次",
      relationshipType: "朋友",
      timeCommitment: "每周3-5小时"
    };
  }

  evaluateCompatibility(otherIntent: IntentJSON): CompatibilityRange {
    // 基于 Agent 的 dealbreakers 和 interactionStyle 评估对方意图
    const acceptablePurposes: string[] = [];
    const preferredTopics: string[] = [];
    const acceptableFrequencies: string[] = [];
    const acceptableRelationshipTypes: string[] = [];
    const acceptableTimeCommitments: string[] = [];
    const dealbreakerChecks: { [key: string]: boolean } = {};

    // 评估目的
    if (!this.dealbreakers.some(db => otherIntent.purpose.includes(db))) {
      acceptablePurposes.push(otherIntent.purpose);
    }

    // 评估话题
    if (this.interactionStyle.includes("技术") || this.interactionStyle.includes("学习")) {
      preferredTopics.push(...otherIntent.topics.filter(t => 
        ["编程", "技术", "学习", "项目"].some(keyword => t.includes(keyword))
      ));
    } else if (this.interactionStyle.includes("商业") || this.interactionStyle.includes("创业")) {
      preferredTopics.push(...otherIntent.topics.filter(t => 
        ["创业", "商业", "产品", "合作"].some(keyword => t.includes(keyword))
      ));
    } else {
      preferredTopics.push(...otherIntent.topics);
    }

    // 评估频率
    const frequencies = ["每天", "每周2-3次", "每周1-2次", "偶尔"];
    const currentFreqIndex = frequencies.indexOf(otherIntent.communicationFrequency);
    if (currentFreqIndex >= 0) {
      // 接受相同或更低的频率
      acceptableFrequencies.push(...frequencies.slice(0, currentFreqIndex + 1));
    } else {
      acceptableFrequencies.push(otherIntent.communicationFrequency);
    }

    // 评估关系类型
    acceptableRelationshipTypes.push(otherIntent.relationshipType);
    if (this.interactionStyle.includes("正式")) {
      acceptableRelationshipTypes.push("合作伙伴", "同事");
    } else {
      acceptableRelationshipTypes.push("朋友", "学习伙伴");
    }

    // 评估时间投入
    const timeCommitments = ["每周20+小时", "每周10-20小时", "每周5-10小时", "每周3-5小时", "每周1-3小时"];
    const currentTimeIndex = timeCommitments.indexOf(otherIntent.timeCommitment);
    if (currentTimeIndex >= 0) {
      // 接受相同或更少的时间投入
      acceptableTimeCommitments.push(...timeCommitments.slice(currentTimeIndex));
    } else {
      acceptableTimeCommitments.push(otherIntent.timeCommitment);
    }

    // Dealbreaker 检查
    this.dealbreakers.forEach(db => {
      dealbreakerChecks[db] = !otherIntent.purpose.includes(db) && 
                              !otherIntent.topics.some(t => t.includes(db));
    });

    this.recordMemory("evaluate_compatibility", {
      otherIntent,
      result: { acceptablePurposes, preferredTopics }
    });

    return {
      acceptablePurposes,
      preferredTopics,
      acceptableFrequencies,
      acceptableRelationshipTypes,
      acceptableTimeCommitments,
      dealbreakerChecks
    };
  }

  recordMemory(event: string, data: any): void {
    this.memory.push({
      timestamp: Date.now(),
      event,
      data
    });
  }
}

