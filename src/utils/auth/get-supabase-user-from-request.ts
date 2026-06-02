import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { getBearerToken } from './get-bearer-token';

type SupabaseRequest = Request & { supabase: any };

/**
 * Resolve the current Supabase auth user from the JWT, or null.
 */
export const getSupabaseUserFromRequest = async (req: Request): Promise<User | null> => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return null;
  }

  const supabase = (req as SupabaseRequest).supabase;
  if (!supabase?.auth?.getUser) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
};
