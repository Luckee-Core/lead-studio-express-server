/**
 * Customer Types
 * Simple CRM for user's clients
 */

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  status: 'pending_review' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type CreateCustomerInput = {
  user_id: string;
  name: string;
  status?: 'pending_review' | 'active' | 'inactive'; // Default: 'active'
};

export type UpdateCustomerInput = {
  name?: string;
};

