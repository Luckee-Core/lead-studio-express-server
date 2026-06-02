-- MentorAI Hub Database Schema
-- Initial migration

-- ============================================
-- CORE USER TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  provider TEXT NOT NULL, -- 'apple', 'google', 'email'
  image TEXT,
  tier TEXT DEFAULT 'free', -- 'free', 'paid', 'byok'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (global context)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  timezone TEXT,
  language TEXT DEFAULT 'en',
  communication_style TEXT,
  profile_summary TEXT,
  last_summary_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Credits
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits Deductions (audit trail)
CREATE TABLE IF NOT EXISTS public.credits_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_credits_id UUID REFERENCES public.user_credits(id) NOT NULL,
  exchange_id UUID,
  exchange_type TEXT, -- 'mentor', 'chef', 'bitit', 'spotter'
  credits_deducted INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits Purchases
CREATE TABLE IF NOT EXISTS public.credits_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_credits_id UUID REFERENCES public.user_credits(id) NOT NULL,
  source TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL,
  price INTEGER NOT NULL, -- in cents
  transaction_id TEXT NOT NULL,
  payment_provider TEXT NOT NULL, -- 'IAP', 'Stripe', 'PayPal'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORY LAYER TABLES
-- ============================================

-- Memory Facts (atomic knowledge pieces)
CREATE TABLE IF NOT EXISTS public.memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL, -- 'global', 'mentor', 'pot_notes', 'bitit', 'spotter'
  category TEXT NOT NULL, -- 'preference', 'goal', 'constraint', 'history', 'skill'
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  confidence NUMERIC DEFAULT 1.0,
  source_type TEXT DEFAULT 'explicit', -- 'explicit', 'inferred'
  source_exchange_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain, category, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_memory_facts_user_domain 
  ON public.memory_facts(user_id, domain, is_active);

-- Memory Events (time-based occurrences)
CREATE TABLE IF NOT EXISTS public.memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  event_summary TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_exchange_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_events_user_domain 
  ON public.memory_events(user_id, domain, occurred_at DESC);

-- Context Summaries (AI-generated rollups)
CREATE TABLE IF NOT EXISTS public.context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  summary_type TEXT NOT NULL, -- 'daily', 'weekly', 'all_time', 'session'
  summary_text TEXT NOT NULL,
  key_points JSONB,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Configs (per-domain settings)
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  system_prompt_overrides JSONB,
  temperature NUMERIC DEFAULT 0.7,
  memory_window_size INTEGER DEFAULT 10,
  include_facts BOOLEAN DEFAULT TRUE,
  include_events BOOLEAN DEFAULT TRUE,
  include_summaries BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- ============================================
-- MENTOR (BUSINESS COACH) TABLES
-- ============================================

-- Personas
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  last_chat_at BIGINT,
  your_role_and_background TEXT,
  your_business TEXT,
  style_tone INTEGER,
  style_thinking INTEGER,
  style_communication INTEGER,
  style_instruction INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id),
  name TEXT NOT NULL,
  tags TEXT[],
  summary TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Goals
CREATE TABLE IF NOT EXISTS public.session_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Exchanges
CREATE TABLE IF NOT EXISTS public.mentor_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.personas(id),
  user_message TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  credits_used INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER,
  output_tokens INTEGER,
  status TEXT DEFAULT 'pending', -- 'idle', 'pending', 'completed', 'failed'
  type TEXT DEFAULT 'original', -- 'original', 'follow-up'
  parent_exchange_id UUID REFERENCES public.mentor_exchanges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POT NOTES (CHEF) TABLES
-- ============================================

-- Chef Exchanges (denormalized)
CREATE TABLE IF NOT EXISTS public.chef_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID,
  user_question_content TEXT NOT NULL,
  user_question_tokens TEXT,
  user_question_status TEXT DEFAULT 'pending',
  chef_response_raw JSONB,
  chef_response_input_tokens INTEGER,
  chef_response_output_tokens INTEGER,
  credits_used INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle', -- 'idle', 'pending', 'completed', 'failed'
  type TEXT DEFAULT 'original', -- 'original', 'follow-up'
  parent_exchange_id UUID REFERENCES public.chef_exchanges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BITIT (COMEDY) TABLES
-- ============================================

-- BitIt Threads
CREATE TABLE IF NOT EXISTS public.bitit_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_message_timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BitIt Exchanges
CREATE TABLE IF NOT EXISTS public.bitit_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES public.bitit_threads(id) ON DELETE CASCADE NOT NULL,
  user_input TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  bit_created BOOLEAN DEFAULT FALSE,
  bit_id UUID,
  credits_used INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  type TEXT DEFAULT 'original',
  parent_exchange_id UUID REFERENCES public.bitit_exchanges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bits (comedy content pieces)
CREATE TABLE IF NOT EXISTS public.bits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  status TEXT DEFAULT 'draft', -- 'draft', 'polished', 'archived'
  set_id UUID,
  thread_id UUID REFERENCES public.bitit_threads(id),
  exchange_id UUID REFERENCES public.bitit_exchanges(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets (collections of bits)
CREATE TABLE IF NOT EXISTS public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for bits.set_id
ALTER TABLE public.bits 
  ADD CONSTRAINT fk_bits_set 
  FOREIGN KEY (set_id) REFERENCES public.sets(id) ON DELETE SET NULL;

-- Transitions
CREATE TABLE IF NOT EXISTS public.transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
  from_bit_id UUID REFERENCES public.bits(id) ON DELETE SET NULL,
  to_bit_id UUID REFERENCES public.bits(id) ON DELETE SET NULL,
  transition_text TEXT NOT NULL,
  type TEXT, -- 'callback', 'theme-bridge', 'energy-shift', 'cold', 'crowd-work'
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC,
  "order" INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPOTTER (FITNESS) TABLES
-- ============================================

-- Spotter Threads (workout sessions)
CREATE TABLE IF NOT EXISTS public.spotter_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date BIGINT,
  status TEXT DEFAULT 'active', -- 'active', 'completed'
  message_count INTEGER DEFAULT 0,
  last_message_timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spotter Exchanges
CREATE TABLE IF NOT EXISTS public.spotter_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES public.spotter_threads(id) ON DELETE CASCADE NOT NULL,
  user_message JSONB,
  spotter_response JSONB,
  credits_used INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  type TEXT DEFAULT 'original',
  parent_exchange_id UUID REFERENCES public.spotter_exchanges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitit_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitit_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotter_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotter_exchanges ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
-- Note: Service role key bypasses RLS

CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Repeat for other tables...
-- (In production, add comprehensive policies for each table)

