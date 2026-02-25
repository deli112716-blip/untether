-- UnTether Normalized Supabase SQL Schema
-- Run this in your Supabase SQL Editor if you wish to move away from the single JSONB column approach.

-- 1. Profiles (already exists, but adding core scalar stats)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_saved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screen_time NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'The Stoic';

-- 2. Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);

-- 3. Daily Activity Logs
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    screen_time_minutes NUMERIC DEFAULT 0,
    time_saved_minutes NUMERIC DEFAULT 0,
    idle_time_minutes NUMERIC DEFAULT 0,
    focus_sessions INTEGER DEFAULT 0,
    UNIQUE(user_id, log_date)
);

-- 4. Blocked Apps / Websites Registration
CREATE TABLE IF NOT EXISTS public.blocked_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    is_blocked BOOLEAN DEFAULT true,
    icon_color TEXT
);

-- 5. GeoFence Focus Zones
CREATE TABLE IF NOT EXISTS public.focus_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true
);

-- 6. Row Level Security (RLS) Policies
-- Ensure users can only read/write their own data
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journal" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own blocked apps" ON public.blocked_apps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own focus zones" ON public.focus_zones FOR ALL USING (auth.uid() = user_id);
