ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'self_reported',
  ADD COLUMN IF NOT EXISTS location_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_geo ON profiles (latitude, longitude);
