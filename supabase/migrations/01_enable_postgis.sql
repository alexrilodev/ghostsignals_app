-- Enable PostGIS extension for geospatial queries
-- Run this first in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Verify installation
SELECT PostGIS_Version();
