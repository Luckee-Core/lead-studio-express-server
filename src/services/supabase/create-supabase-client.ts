
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';

export type SupabaseCredentials = {
  url: string;
  key: string;
};

// Singleton for managed client
let managedClient: SupabaseClient | null = null;

/**
 * Get or create the managed Supabase client (hosted mode)
 */
export const getManagedSupabaseClient = (): SupabaseClient | null => {
  if (managedClient) return managedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Managed Supabase not configured');
    return null;
  }

  managedClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return managedClient;
};

/**
 * Create managed Supabase client (hosted mode)
 */
export const createManagedSupabaseClient = (): SupabaseClient => {
  const client = getManagedSupabaseClient();
  if (!client) {
    throw new Error('Managed Supabase not configured');
  }
  return client;
};

/**
 * Create BYOK Supabase client (user's own instance)
 */
export const createBYOKSupabaseClient = (credentials: SupabaseCredentials): SupabaseClient => {
  return createClient(credentials.url, credentials.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/**
 * Create Supabase client with support for hosted and BYOK modes
 */
export const createSupabaseClient = (req?: Request): SupabaseClient => {
  // Check if user is providing their own Supabase credentials (BYOK mode)
  const userSupabaseUrl = req?.headers['x-user-supabase-url'] as string;
  const userSupabaseKey = req?.headers['x-user-supabase-key'] as string;

  if (userSupabaseUrl && userSupabaseKey) {
    // BYOK mode - use user's Supabase instance
    return createBYOKSupabaseClient({ url: userSupabaseUrl, key: userSupabaseKey });
  }

  // Hosted mode - use our Supabase instance
  return createManagedSupabaseClient();
};

/**
 * Middleware to attach Supabase client to request
 */
export const attachSupabaseClient = (req: Request, res: any, next: any) => {
  try {
    (req as any).supabase = createSupabaseClient(req);
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to initialize database connection',
    });
  }
};
