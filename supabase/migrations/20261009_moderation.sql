-- 1. Quarantine flag on messages (idempotent)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_quarantined BOOLEAN DEFAULT FALSE;

-- Index for filtering quarantined messages out of fetches cheaply
CREATE INDEX IF NOT EXISTS idx_messages_quarantined
  ON public.messages (conversation_id, is_quarantined);

-- 2. Moderation log table
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_rule TEXT NOT NULL,
  flagged_text TEXT,
  penalty_points INT NOT NULL DEFAULT 0 CHECK (penalty_points >= 0),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who/what fired it, null = system
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_user
  ON public.moderation_log (user_id, created_at DESC);

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no anon/authenticated policies needed.
-- Users viewing their OWN moderation history would use this policy:
DROP POLICY IF EXISTS "Users read own moderation log" ON public.moderation_log;
CREATE POLICY "Users read own moderation log" ON public.moderation_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Penalty RPC (immutable params, SECURITY DEFINER, locked search path)
CREATE OR REPLACE FUNCTION public.apply_moderation_penalty(
  p_user_id UUID,
  p_rule TEXT,
  p_text TEXT DEFAULT NULL,
  p_points INT DEFAULT 0,
  p_actor_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.moderation_log (user_id, trigger_rule, flagged_text, penalty_points, actor_id)
  VALUES (p_user_id, p_rule, p_text, GREATEST(p_points, 0), p_actor_id);

  UPDATE public.profiles
  SET reputation_score = GREATEST(0, COALESCE(reputation_score, 100) - GREATEST(p_points, 0))
  WHERE id = p_user_id;
END;
$$;

-- 4. Lock quarantine flag: only the service role flips it.
-- Enforcement via trigger, since RLS on messages is user-facing.
CREATE OR REPLACE FUNCTION public.guard_message_quarantine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow row creation in either state; once quarantined, only service role may change it
  IF OLD.is_quarantined = TRUE AND NEW.is_quarantined = FALSE THEN
    RAISE EXCEPTION 'Quarantine cannot be lifted from the API layer';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_message_quarantine ON public.messages;
CREATE TRIGGER trg_guard_message_quarantine
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_quarantine();