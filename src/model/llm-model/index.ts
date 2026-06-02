export type LlmModel = {
  id: string;
  provider: string;
  model: string;
  input_cost_per_million_usd: number;
  output_cost_per_million_usd: number;
  created_at: string;
  updated_at: string;
};
