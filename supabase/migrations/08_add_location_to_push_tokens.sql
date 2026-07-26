ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS longitude FLOAT;

DROP FUNCTION IF EXISTS public.get_nearby_push_tokens(double precision, double precision, double precision, uuid);

CREATE OR REPLACE FUNCTION public.save_push_token(
  p_user_id TEXT,
  p_token TEXT,
  p_platform TEXT DEFAULT 'android',
  p_latitude FLOAT DEFAULT NULL,
  p_longitude FLOAT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.push_tokens (user_id, token, platform, latitude, longitude, updated_at)
  VALUES (p_user_id, p_token, p_platform, p_latitude, p_longitude, NOW())
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_push_tokens(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_km FLOAT DEFAULT 5,
  p_exclude_user_id TEXT DEFAULT NULL
)
RETURNS TABLE(token TEXT, user_id TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT pt.token, pt.user_id
  FROM public.push_tokens pt
  WHERE pt.latitude IS NOT NULL
    AND pt.longitude IS NOT NULL
    AND (p_exclude_user_id IS NULL OR pt.user_id != p_exclude_user_id)
    AND ST_DWithin(
      ST_MakePoint(pt.longitude, pt.latitude)::geography,
      ST_MakePoint(p_longitude, p_latitude)::geography,
      p_radius_km * 1000
    )
$$;
