/**
 * User Types
 * Core user and credits types
 */

export type User = {
  id: string;
  name: string;
  email?: string;
  provider: 'apple' | 'google' | 'email';
  image?: string;
  tier: 'free' | 'paid' | 'byok';
  created_at: string;
  updated_at: string;
};

export type UserCredits = {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
};

export type CreditsDeduction = {
  id: string;
  user_id: string;
  user_credits_id: string;
  exchange_id?: string;
  exchange_type?: string; // 'mentor', 'chef', 'bitit', 'spotter'
  credits_deducted: number;
  created_at: string;
};

export type CreditsPurchase = {
  id: string;
  user_id: string;
  user_credits_id: string;
  source: string;
  credits_purchased: number;
  price: number; // in cents
  transaction_id: string;
  payment_provider: 'IAP' | 'Stripe' | 'PayPal';
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  user_id: string;
  timezone?: string;
  language: string;
  communication_style?: string;
  profile_summary?: string;
  last_summary_at?: string;
  created_at: string;
  updated_at: string;
};

