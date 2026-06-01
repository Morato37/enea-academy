/*
  # Add Project Zones

  Allows users to create named zones within a project and assign selections to zones.

  1. New Tables
    - `project_zones`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK → projects, nullable — zones can exist on the "current selection" too)
      - `user_id` (uuid, FK → auth.users)
      - `name` (text — user-defined zone name)
      - `display_order` (int — for drag-reordering zones)
      - `created_at`, `updated_at`

  2. Modified Tables
    - `user_selections`: add `zone_id` (uuid, nullable FK → project_zones)

  3. Security
    - RLS enabled on project_zones
    - Users can only access their own zones
*/

CREATE TABLE IF NOT EXISTS project_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own zones"
  ON project_zones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own zones"
  ON project_zones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own zones"
  ON project_zones FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own zones"
  ON project_zones FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS project_zones_user_id_idx ON project_zones(user_id);
CREATE INDEX IF NOT EXISTS project_zones_project_id_idx ON project_zones(project_id);

-- Add zone_id to user_selections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_selections' AND column_name = 'zone_id'
  ) THEN
    ALTER TABLE user_selections ADD COLUMN zone_id uuid REFERENCES project_zones(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_selections_zone_id_idx ON user_selections(zone_id);
