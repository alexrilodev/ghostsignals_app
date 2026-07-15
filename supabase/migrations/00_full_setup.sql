-- ============================================
-- GHOST SIGNALS - COMPLETE DATABASE SETUP
-- ============================================
-- Run this single script in Supabase SQL Editor
-- to set up the entire database schema
-- ============================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Create signals table
CREATE TABLE public.signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  location GEOMETRY(Point, 4326) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Signals are viewable by everyone"
  ON public.signals FOR SELECT USING (true);

CREATE POLICY "Users can insert their own signals"
  ON public.signals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals"
  ON public.signals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signals"
  ON public.signals FOR DELETE USING (auth.uid() = user_id);

-- 5. Create indexes
CREATE INDEX signals_location_idx ON public.signals USING GIST (location);
CREATE INDEX signals_user_id_idx ON public.signals (user_id);
CREATE INDEX signals_tags_idx ON public.signals USING GIN (tags);
CREATE INDEX signals_created_at_idx ON public.signals (created_at DESC);

-- 6. Create RPC function
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
    ST_Distance(
      s.location::geography,
      v_user_location::geography
    ) / 1000 AS distance
  FROM public.signals s
  WHERE ST_DWithin(
    s.location::geography,
    v_user_location::geography,
    p_radius_km * 1000
  )
  ORDER BY distance ASC;
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_nearby_signals(FLOAT, FLOAT, FLOAT) TO authenticated;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
