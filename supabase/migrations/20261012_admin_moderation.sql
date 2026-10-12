-- 1. Update guard trigger to allow bypass via transaction-local setting
CREATE OR REPLACE FUNCTION public.guard_message_quarantine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_quarantined = TRUE AND NEW.is_quarantined = FALSE THEN
    -- Permit update only when authorized by an admin RPC session
    IF current_setting('moderation.allow_quarantine_lift', true) = 'on' THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Quarantine cannot be lifted from the API layer';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Admin Release RPC Function
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
  -- Validate message exists
  SELECT id, sender_id, recipient_id, content, is_quarantined
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

  -- Set transaction-scoped override flag for the trigger
  PERFORM set_config('moderation.allow_quarantine_lift', 'on', true);

  -- Release the message to regular chat streams
  UPDATE public.messages
  SET is_quarantined = FALSE
  WHERE id = p_message_id;

  -- Insert audit log row
  INSERT INTO public.moderation_log (
    user_id,
    trigger_rule,
    flagged_text,
    penalty_points,
    actor_id
  ) VALUES (
    v_msg.sender_id,
    'admin_release',
    COALESCE(p_notes, 'Message quarantine lifted by administrator'),
    0,
    p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'sender_id', v_msg.sender_id,
    'action', 'released'
  );
END;
$$;

-- 3. Companion RPC: Admin Confirm Violation & Maintain Quarantine
CREATE OR REPLACE FUNCTION public.admin_confirm_quarantine(
  p_message_id UUID,
  p_admin_id UUID,
  p_additional_penalty INT DEFAULT 0,
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
  SELECT id, sender_id, content, is_quarantined
  INTO v_msg
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found: %', p_message_id;
  END IF;

  -- Apply additional penalty if specified
  IF p_additional_penalty > 0 THEN
    UPDATE public.profiles
    SET reputation_score = GREATEST(0, COALESCE(reputation_score, 100) - p_additional_penalty)
    WHERE id = v_msg.sender_id;
  END IF;

  -- Insert audit log record
  INSERT INTO public.moderation_log (
    user_id,
    trigger_rule,
    flagged_text,
    penalty_points,
    actor_id
  ) VALUES (
    v_msg.sender_id,
    'admin_confirmed_violation',
    COALESCE(p_notes, 'Violation confirmed by administrator; quarantine maintained'),
    GREATEST(p_additional_penalty, 0),
    p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'sender_id', v_msg.sender_id,
    'action', 'confirmed'
  );
END;
$$;
