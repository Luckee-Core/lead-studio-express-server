export type GenerateColdEmailOfferingFromNotesRequest = {
  sourceNotes: string;
};

export type GenerateColdEmailOfferingFromNotesResult = {
  success: boolean;
  title: string | null;
  hook: string | null;
  description: string | null;
  error?: string;
  model: string;
  rawResponse?: string;
};
