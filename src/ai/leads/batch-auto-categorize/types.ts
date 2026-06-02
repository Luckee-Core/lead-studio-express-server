export type BatchAutoCategorizeCategoryInput = {
  id: string;
  name: string;
  normalized_name?: string;
};

export type BatchAutoCategorizeLeadInput = {
  id: string;
  business_name: string;
  description: string | null;
  website: string | null;
  address: string | null;
  summary: unknown | null;
};

export type BatchAutoCategorizeAssignment = {
  leadId: string;
  categoryId: string | null;
};

export type BatchAutoCategorizeStructuredResponse = {
  assignments: BatchAutoCategorizeAssignment[];
};
