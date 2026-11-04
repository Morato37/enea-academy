/*
  # Add Project Plans (PDF Upload with Zone Overlays)

  ## Overview
  Allows users to upload a PDF plan (e.g. a garden/site layout) to their project
  and optionally draw colored zone rectangles on top of it as an overlay.
  The overlay data (zone_id + rectangle coordinates as percentages) is stored
  in a child table so a single plan can have multiple zone markers.

  ## 1. New Tables
  - `project_plans`
    - `id` (uuid, PK)
    - `project_id` (uuid, FK → projects, nullable — can attach to "current selection" too)
    - `user_id` (uuid, FK → auth.users, NOT NULL, DEFAULT auth.uid())
    - `display_name` (text) — user-friendly label
    - `storage_path` (text) — path in the `project-plans` storage bucket
    - `file_size` (bigint)
    - `created_at`, `updated_at`
  - `project_plan_zones`
    - `id` (uuid, PK)
    - `plan_id` (uuid, FK → project_plans, cascade delete)
    - `zone_id` (uuid, FK → project_zones, set null on delete)
    - `x_pct` (numeric, 0–100) — left edge as percentage of page width
    - `y_pct` (numeric, 0–100) — top edge as percentage of page height
    - `w_pct` (numeric, 0–100) — width as percentage
    - `h_pct` (numeric, 0–100) — height as percentage
    - `page_number` (int, default 1) — which PDF page the overlay is on
    - `created_at`

  ## 2. Storage
  - New public bucket `project-plans` (PDF only, 50 MB limit)
  - Public read; authenticated insert/update/delete

  ## 3. Security
  - RLS enabled on both tables
  - Owner-scoped CRUD via auth.uid() = user_id
  - project_plan_zones access scoped through parent plan ownership
*/

CREATE TABLE IF NOT EXISTS project_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plans" ON project_plans;
CREATE POLICY "select_own_plans"
  ON project_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plans" ON project_plans;
CREATE POLICY "insert_own_plans"
  ON project_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plans" ON project_plans;
CREATE POLICY "update_own_plans"
  ON project_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plans" ON project_plans;
CREATE POLICY "delete_own_plans"
  ON project_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_plans_project_id ON project_plans(project_id);

CREATE TABLE IF NOT EXISTS project_plan_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES project_plans(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES project_zones(id) ON DELETE SET NULL,
  x_pct numeric(5,2) NOT NULL DEFAULT 0,
  y_pct numeric(5,2) NOT NULL DEFAULT 0,
  w_pct numeric(5,2) NOT NULL DEFAULT 20,
  h_pct numeric(5,2) NOT NULL DEFAULT 20,
  page_number int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_plan_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plan_zones" ON project_plan_zones;
CREATE POLICY "select_own_plan_zones"
  ON project_plan_zones FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM project_plans WHERE project_plans.id = project_plan_zones.plan_id AND project_plans.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_plan_zones" ON project_plan_zones;
CREATE POLICY "insert_own_plan_zones"
  ON project_plan_zones FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM project_plans WHERE project_plans.id = project_plan_zones.plan_id AND project_plans.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_plan_zones" ON project_plan_zones;
CREATE POLICY "update_own_plan_zones"
  ON project_plan_zones FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM project_plans WHERE project_plans.id = project_plan_zones.plan_id AND project_plans.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM project_plans WHERE project_plans.id = project_plan_zones.plan_id AND project_plans.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_plan_zones" ON project_plan_zones;
CREATE POLICY "delete_own_plan_zones"
  ON project_plan_zones FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM project_plans WHERE project_plans.id = project_plan_zones.plan_id AND project_plans.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_project_plan_zones_plan_id ON project_plan_zones(plan_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-plans', 'project-plans', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read project plans" ON storage.objects;
CREATE POLICY "Public read project plans"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Authenticated upload project plans" ON storage.objects;
CREATE POLICY "Authenticated upload project plans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Authenticated update project plans" ON storage.objects;
CREATE POLICY "Authenticated update project plans"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-plans')
  WITH CHECK (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Authenticated delete project plans" ON storage.objects;
CREATE POLICY "Authenticated delete project plans"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-plans');
