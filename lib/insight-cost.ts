/**
 * Estimates the cost in USD for OpenAI API usage
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Estimated cost in USD (rounded to 6 decimals)
 */
export function estimateCostUSD(inputTokens: number, outputTokens: number): number {
  const inRate = Number(process.env.INSIGHT_COST_INPUT_PER_1K || '0.005'); // USD per 1K tokens
  const outRate = Number(process.env.INSIGHT_COST_OUTPUT_PER_1K || '0.015'); // USD per 1K tokens
  const cost = (inputTokens / 1000) * inRate + (outputTokens / 1000) * outRate;
  return Number(cost.toFixed(6));
}

