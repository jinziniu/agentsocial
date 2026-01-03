export interface IntentJSON {
  purpose: string;
  topics: string[];
  communicationFrequency: string;
  relationshipType: string;
  timeCommitment: string;
}

export interface CompatibilityRange {
  acceptablePurposes: string[];
  preferredTopics: string[];
  acceptableFrequencies: string[];
  acceptableRelationshipTypes: string[];
  acceptableTimeCommitments: string[];
  dealbreakerChecks: {
    [key: string]: boolean;
  };
}

export type RelationshipState = "glance" | "exploring" | "warming" | "cooling";
export type RelationshipMomentum = "warming" | "stable" | "cooling";

export interface RelationshipEvent {
  description: string; // 事件描述，例如"在讨论节奏时，对方表现出收紧而非推进"
}

export interface RelationshipRecord {
  previousState: RelationshipState;
  currentState: RelationshipState;
  events: RelationshipEvent[]; // 1-3 条关系事件
  momentum: RelationshipMomentum; // 关系动量：更靠近、保持不变、稍微拉远
  feeling: string; // 尚未定型的、人类式的感受描述
}

export interface MatchResult {
  score?: number; // 仅用于内部计算（可选）
  trace?: any[]; // trace 在 negotiation 模块中定义
  summary: RelationshipRecord; // 最终总结
}

export interface MemoryEntry {
  timestamp: number;
  event: string;
  data: any;
}

