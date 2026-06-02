/**
 * Row shape for `saved_filters` (filters JSON is validated loosely at the API boundary).
 */
export type SavedFilterRow = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
