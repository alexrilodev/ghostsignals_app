CREATE OR REPLACE FUNCTION public.save_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_platform TEXT DEFAULT 'android'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.push_tokens (user_id, token, platform, updated_at)
  VALUES (p_user_id, p_token, p_platform, NOW())
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_push_tokens(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.push_tokens WHERE user_id = p_user_id;
END;
$$;
