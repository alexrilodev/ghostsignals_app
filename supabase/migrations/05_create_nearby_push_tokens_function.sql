CREATE OR REPLACE FUNCTION public.get_nearby_push_tokens(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_km FLOAT DEFAULT 5,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE(token TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT pt.token
  FROM public.push_tokens pt
  WHERE (p_exclude_user_id IS NULL OR pt.user_id != p_exclude_user_id)
$$;
