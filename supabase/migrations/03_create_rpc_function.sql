-- Create RPC function for geospatial queries
-- Run after 02_create_signals_table.sql

CREATE OR REPLACE FUNCTION public.get_nearby_signals(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_km FLOAT DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  latitude FLOAT,
  longitude FLOAT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  distance FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_location GEOMETRY;
BEGIN
  -- Create point geometry from user coordinates
  v_user_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.title,
    s.description,
    s.image_url,
    s.latitude,
    s.longitude,
    s.tags,
    s.created_at,
    -- Calculate distance in kilometers using geography type
    ST_Distance(
      s.location::geography,
      v_user_location::geography
    ) / 1000 AS distance
  FROM public.signals s
  WHERE ST_DWithin(
    s.location::geography,
    v_user_location::geography,
    p_radius_km * 1000  -- Convert km to meters
  )
  ORDER BY distance ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_nearby_signals(FLOAT, FLOAT, FLOAT) TO authenticated;
