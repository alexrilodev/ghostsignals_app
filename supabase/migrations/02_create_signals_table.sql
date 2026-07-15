-- Create signals table with PostGIS geometry
-- Run after 01_enable_postgis.sql

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

-- Enable Row Level Security
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can view signals
CREATE POLICY "Signals are viewable by everyone"
  ON public.signals
  FOR SELECT
  USING (true);

-- Create policy: Authenticated users can insert their own signals
CREATE POLICY "Users can insert their own signals"
  ON public.signals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own signals
CREATE POLICY "Users can update their own signals"
  ON public.signals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own signals
CREATE POLICY "Users can delete their own signals"
  ON public.signals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for geospatial queries
CREATE INDEX signals_location_idx ON public.signals USING GIST (location);

-- Create index for user queries
CREATE INDEX signals_user_id_idx ON public.signals (user_id);

-- Create index for tags queries
CREATE INDEX signals_tags_idx ON public.signals USING GIN (tags);

-- Create index for created_at sorting
CREATE INDEX signals_created_at_idx ON public.signals (created_at DESC);
