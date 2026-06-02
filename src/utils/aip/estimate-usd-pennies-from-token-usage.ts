/**
 * Rough Anthropic-ish pricing for v1 cost snapshots (USD → integer pennies).
 * Extend mapping as you lock commercial rates; unknown models use DEFAULT_RATE.
 */
type TokenRate = { inputUsdPerMillion: number; outputUsdPerMillion: number };

const DEFAULT_RATE: TokenRate = { inputUsdPerMillion: 3, outputUsdPerMillion: 15 };

const RATES_BY_MODEL_PREFIX: { prefix: string; rate: TokenRate }[] = [
  { prefix: 'claude-opus', rate: { inputUsdPerMillion: 15, outputUsdPerMillion: 75 } },
  { prefix: 'claude-sonnet', rate: { inputUsdPerMillion: 3, outputUsdPerMillion: 15 } },
  { prefix: 'claude-haiku', rate: { inputUsdPerMillion: 0.25, outputUsdPerMillion: 1.25 } },
  { prefix: 'claude-3-5-haiku', rate: { inputUsdPerMillion: 0.8, outputUsdPerMillion: 4 } },
  { prefix: 'claude-3-opus', rate: { inputUsdPerMillion: 15, outputUsdPerMillion: 75 } },
  { prefix: 'claude-3-sonnet', rate: { inputUsdPerMillion: 3, outputUsdPerMillion: 15 } },
];

const pickRate = (model: string): TokenRate => {
  const m = model.trim().toLowerCase();
  if (!m) return DEFAULT_RATE;
  for (const row of RATES_BY_MODEL_PREFIX) {
    if (m.startsWith(row.prefix)) return row.rate;
  }
  return DEFAULT_RATE;
};

const toPennies = (usd: number): bigint => {
  if (!Number.isFinite(usd) || usd <= 0) return 0n;
  return BigInt(Math.round(usd * 100));
};

/**
 * Estimates spend in USD pennies for one model bucket from token totals.
 */
export const estimateUsdPenniesFromTokenUsage = (input: {
  model: string;
  inputTokens: bigint;
  outputTokens: bigint;
}): bigint => {
  const rate = pickRate(input.model);
  const inTok = Number(input.inputTokens);
  const outTok = Number(input.outputTokens);
  const usd =
    (inTok / 1_000_000) * rate.inputUsdPerMillion + (outTok / 1_000_000) * rate.outputUsdPerMillion;
  return toPennies(usd);
};
