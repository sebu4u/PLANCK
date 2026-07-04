/**
 * Estimates the cost in USD for OpenAI API usage
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param options.insightVisionImagesApprox - When set with INSIGHT_VISION_APPROX_INPUT_TOKENS_PER_IMAGE env, adds rough vision input tokens (OpenAI usage already includes image tokens; only use env when you want a separate conservative estimate).
 * @param options.ideAgent - Use DeepSeek IDE agent rates (IDE_AGENT_COST_* env vars).
 * @returns Estimated cost in USD (rounded to 6 decimals)
 */
export function estimateCostUSD(
  inputTokens: number,
  outputTokens: number,
  options?: { insightVisionImagesApprox?: number; ideAgent?: boolean }
): number {
  const inRate = options?.ideAgent
    ? Number(process.env.IDE_AGENT_COST_INPUT_PER_1K || '0.00014')
    : Number(process.env.INSIGHT_COST_INPUT_PER_1K || '0.005');
  const outRate = options?.ideAgent
    ? Number(process.env.IDE_AGENT_COST_OUTPUT_PER_1K || '0.00028')
    : Number(process.env.INSIGHT_COST_OUTPUT_PER_1K || '0.015');
  const perImage = Number(process.env.INSIGHT_VISION_APPROX_INPUT_TOKENS_PER_IMAGE || '0');
  const visionExtra =
    perImage > 0 ? perImage * (options?.insightVisionImagesApprox ?? 0) : 0;
  const cost = ((inputTokens + visionExtra) / 1000) * inRate + (outputTokens / 1000) * outRate;
  return Number(cost.toFixed(6));
}

