/**
 * Express type augmentation
 * Extends Express Request to include custom properties added by middleware
 */

import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      supabase: SupabaseClient;
    }
    /** Align with mentorai-server: route params are single strings. */
    interface ParamsDictionary {
      [key: string]: string;
    }
  }
}

export {};

