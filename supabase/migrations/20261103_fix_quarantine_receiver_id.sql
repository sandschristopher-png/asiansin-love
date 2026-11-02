-- =====================================================================
-- 20261103_fix_quarantine_receiver_id.sql        (asiansin.love)
--
-- admin_release_quarantine (20261012_admin_moderation.sql) selected
-- messages.recipient_id, but the live table column is receiver_id, so every
-- "Release" from /admin/moderation failed with
--   column "recipient_id" does not exist
--
-- The function only needs sender_id, so the bad column is dropped from the
-- SELECT. CREATE OR REPLACE keeps the existing grants (service_role only,
-- from 20261102_security_hardening.sql); they are re-asserted below anyway.
-- Safe to re-run.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.admin_release_quarantine(
  p_message_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg RECORD;
BEGIN
  SELECT id, sender_id, receiver_id, is_quarantined
  INTO v_msg
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found: %', p_message_id;
  END IF;

  IF NOT v_msg.is_quarantined THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Message is not quarantined'
    );
  END IF;

  -- Transaction-scoped override checked by guard_message_quarantine()
  PERFORM set_config('moderation.allow_quarantine_lift', 'on', true);

  UPDATE public.messages
  SET is_quarantined = FALSE
  WHERE id = p_message_id;

  -- Live moderation_log columns: category / action / flagged_text / points_deducted / actor_id.
  INSERT INTO public.moderation_log (
    user_id,
    category,
    action,
    flagged_text,
    points_deducted,
    actor_id
  ) VALUES (
    v_msg.sender_id,
    'admin_release',
    'release_quarantine',
    COALESCE(p_notes, 'Message quarantine lifted by administrator'),
    0,
    COALESCE(p_admin_id, auth.uid())
  );

  RETURN jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'sender_id', v_msg.sender_id,
    'receiver_id', v_msg.receiver_id,
    'action', 'released'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_release_quarantine(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_release_quarantine(UUID, UUID, TEXT) TO service_role;
