export const FREE_DAILY_LIMIT = 3;
export const FREE_RAPTOR1_MONTHLY_LIMIT = 10;
export const PLUS_MONTHLY_LIMIT = 800;

export const INSIGHT_ALLOWED_MODELS = ['gpt-4o', 'gpt-4o-mini', 'deep-thinking'] as const;

export type InsightModel = (typeof INSIGHT_ALLOWED_MODELS)[number];

export function resolveInsightModel(model: unknown): InsightModel {
  if (typeof model === 'string' && INSIGHT_ALLOWED_MODELS.includes(model as InsightModel)) {
    return model as InsightModel;
  }

  return 'gpt-4o';
}

export function shouldUseRaptorFreeTierLimits(persona: unknown) {
  return persona === 'ide';
}

export function isInsightIdeFastModel(model: InsightModel) {
  return model === 'gpt-4o-mini';
}
