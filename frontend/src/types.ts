export type RelationshipState = "glance" | "exploring" | "warming" | "cooling";
export type RelationshipMomentum = "warming" | "stable" | "cooling";
export type TraceEntryType = "signal" | "question" | "boundary" | "offer" | "reflection";

export interface RelationshipEvent {
  description: string;
}

export interface RelationshipRecord {
  previousState: RelationshipState;
  currentState: RelationshipState;
  events: RelationshipEvent[];
  momentum: RelationshipMomentum;
  feeling: string;
}

export interface TraceEntry {
  round: number;
  speaker: "AgentA" | "AgentB";
  type: TraceEntryType;
  content: string;
  payload?: any;
  microReflection?: string;
}

export interface MatchResult {
  trace: TraceEntry[];
  summary: RelationshipRecord;
}

export interface User {
  userId: string;
  intent: string;
  interactionStyle: string;
  dealbreakers: string[];
  energyLevel: number;
}

