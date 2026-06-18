export type InsightAgentIntentType =
  | 'tutor'
  | 'diagnosis'
  | 'plan'
  | 'recommendation'
  | 'parent_report';

export type InsightAgentSubject = 'fizica' | 'matematica' | 'informatica' | 'biologie' | 'general';

export type PlanckResourceType =
  | 'problem'
  | 'lesson'
  | 'course'
  | 'learning_path'
  | 'quiz'
  | 'flashcard_deck';

export interface PlanckResourceReference {
  type: PlanckResourceType;
  id: string;
  title: string;
  subtitle?: string | null;
  subject?: InsightAgentSubject | string | null;
  topic?: string | null;
  difficulty?: string | null;
  url: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

export type InsightMessageArtifact =
  | {
      type: 'resource_references';
      title?: string;
      resources: PlanckResourceReference[];
    }
  | {
      type: 'agent_action';
      title: string;
      status: 'planned' | 'completed' | 'failed' | 'needs_confirmation';
      action: string;
      metadata?: Record<string, unknown>;
    };

export interface InsightAgentIntent {
  type: InsightAgentIntentType;
  subject: InsightAgentSubject;
  topic: string | null;
  confidence: number;
  reasons: string[];
}

export interface InsightAgentArtifacts {
  diagnosis?: {
    subject: InsightAgentSubject;
    weak_topics: Array<{ topic: string; evidence: string; confidence: number }>;
    strengths: string[];
    confidence: number;
    evidence_json: Record<string, unknown>;
  };
  plan?: {
    title: string;
    subject: InsightAgentSubject;
    plan_json: {
      source: 'insight_chat';
      intent: InsightAgentIntent;
      steps: Array<{ title: string; objective: string; resource?: PlanckResourceReference }>;
      resources?: PlanckResourceReference[];
    };
  };
  recommendation?: {
    recommendation_type: 'course' | 'learning_path' | 'problem' | 'lesson';
    target_url: string | null;
    reason: string;
    confidence: number;
    metadata: Record<string, unknown>;
    resources?: PlanckResourceReference[];
  };
  parentReport?: {
    report_json: Record<string, unknown>;
  };
}

export interface InsightAgentProfileMemory {
  grade?: string | null;
  subjects?: string[];
  goals?: string[];
  weak_topics?: Array<{ subject?: string | null; topic: string; confidence?: number }>;
  strengths?: Array<{ subject?: string | null; topic: string; confidence?: number }>;
  preferred_explanation_style?: string | null;
  recent_resource_ids?: string[];
  updated_from?: string;
}
