/**
 * Server-side Supabase client for background jobs and routers that use getSupabaseClient().
 * Same role as tht-express-server db/supabase-client (service role).
 */

import { createManagedSupabaseClient } from '../services/supabase/create-supabase-client';

export const getSupabaseClient = () => createManagedSupabaseClient();
