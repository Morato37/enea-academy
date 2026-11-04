/*
  # Add Bloom Calendar Tables

  ## Overview
  Creates tables for the "Blühkalender" (blooming calendar) module, allowing users
  to create custom A3 poster calendars showing plant bloom/leaf colors across 12 months.

  1. New Tables
    - `bloom_calendars`
      - `id` (uuid, PK) — Unique calendar identifier
      - `owner_id` (uuid, FK → auth.users, DEFAULT auth.uid()) — Calendar owner
      - `title` (text) — Calendar title shown above poster
      - `center_text` (text, default 'PFLANZKONZEPT\nFÜR DAS\nGANZE JAHR') — Center text on poster
      - `options` (jsonb) — Display options (logo, months, fauna, side panel, climate, etc.)
      - `climate` (jsonb, nullable) — Climate data (location, temperatures, precipitation, wind)
      - `created_at` (timestamptz) — Creation timestamp
      - `updated_at` (timestamptz) — Last modification timestamp

    - `bloom_calendar_plants`
      - `id` (uuid, PK) — Unique entry identifier
      - `calendar_id` (uuid, FK → bloom_calendars, ON DELETE CASCADE) — Parent calendar
      - `plant_id` (int, FK → plants_flat, nullable) — Reference to master plant data
      - `position` (int) — Sort order for drag & drop
      - `custom_name` (text, nullable) — Override display name
      - `months_override` (jsonb, nullable) — Array(12) of month entries, replacing master data
      - `bloom_color` (text, nullable) — Override bloom color
      - `leaf_color` (text, nullable) — Override leaf color
      - `created_at` (timestamptz) — Creation timestamp

  2. Security
    - Enable RLS on both tables.
    - Owner-scoped CRUD: authenticated users can only access their own calendars.
    - bloom_calendar_plants access is scoped through the parent calendar's owner_id.

  3. Indexes
    - bloom_calendars(owner_id)
    - bloom_calendar_plants(calendar_id)
*/

-- =====================================================
-- bloom_calendars TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bloom_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Neuer Blühkalender',
  center_text text NOT NULL DEFAULT 'PFLANZKONZEPT
FÜR DAS
GANZE JAHR',
  options jsonb NOT NULL DEFAULT '{"title":"","centerText":"PFLANZKONZEPT\nFÜR DAS\nGANZE JAHR","showLogo":true,"showPlantList":false,"showMonths":true,"showFauna":false,"showSide":false,"showClimate":false}'::jsonb,
  climate jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bloom_calendars ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bloom_calendars_owner_id_idx ON bloom_calendars(owner_id);

DROP POLICY IF EXISTS "select_own_bloom_calendars" ON bloom_calendars;
CREATE POLICY "select_own_bloom_calendars" ON bloom_calendars FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_bloom_calendars" ON bloom_calendars;
CREATE POLICY "insert_own_bloom_calendars" ON bloom_calendars FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_bloom_calendars" ON bloom_calendars;
CREATE POLICY "update_own_bloom_calendars" ON bloom_calendars FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_bloom_calendars" ON bloom_calendars;
CREATE POLICY "delete_own_bloom_calendars" ON bloom_calendars FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- =====================================================
-- bloom_calendar_plants TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bloom_calendar_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES bloom_calendars(id) ON DELETE CASCADE,
  plant_id int REFERENCES plants_flat(id) ON DELETE SET NULL,
  position int NOT NULL DEFAULT 0,
  custom_name text,
  months_override jsonb,
  bloom_color text,
  leaf_color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bloom_calendar_plants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bloom_calendar_plants_calendar_id_idx ON bloom_calendar_plants(calendar_id);

DROP POLICY IF EXISTS "select_own_bloom_calendar_plants" ON bloom_calendar_plants;
CREATE POLICY "select_own_bloom_calendar_plants" ON bloom_calendar_plants FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM bloom_calendars WHERE bloom_calendars.id = bloom_calendar_plants.calendar_id AND bloom_calendars.owner_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_bloom_calendar_plants" ON bloom_calendar_plants;
CREATE POLICY "insert_own_bloom_calendar_plants" ON bloom_calendar_plants FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM bloom_calendars WHERE bloom_calendars.id = bloom_calendar_plants.calendar_id AND bloom_calendars.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_bloom_calendar_plants" ON bloom_calendar_plants;
CREATE POLICY "update_own_bloom_calendar_plants" ON bloom_calendar_plants FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM bloom_calendars WHERE bloom_calendars.id = bloom_calendar_plants.calendar_id AND bloom_calendars.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM bloom_calendars WHERE bloom_calendars.id = bloom_calendar_plants.calendar_id AND bloom_calendars.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_bloom_calendar_plants" ON bloom_calendar_plants;
CREATE POLICY "delete_own_bloom_calendar_plants" ON bloom_calendar_plants FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM bloom_calendars WHERE bloom_calendars.id = bloom_calendar_plants.calendar_id AND bloom_calendars.owner_id = auth.uid()));

-- =====================================================
-- updated_at trigger for bloom_calendars
-- =====================================================

CREATE OR REPLACE FUNCTION update_bloom_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bloom_calendars_updated_at ON bloom_calendars;
CREATE TRIGGER bloom_calendars_updated_at BEFORE UPDATE ON bloom_calendars
  FOR EACH ROW EXECUTE FUNCTION update_bloom_calendars_updated_at();
