import type { NormalizedFacebookPostForActivity } from '../../../utils/facebook';

export type FacebookActivityScoreInput = {
  businessName: string;
  pageUrl: string;
  posts: NormalizedFacebookPostForActivity[];
};

/**
 * Structured output from the activity scoring model (persisted on research payload).
 */
export type FacebookActivityScoreResult = {
  activityScore: number;
  confidence: 'low' | 'medium' | 'high';
  postingPattern: string;
  evidence: string;
  limitations: string;
};
