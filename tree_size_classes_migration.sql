/*
# Add per-species tree size classes

1. New Table: tree_size_classes
   - Stores species-specific average dimensions (DBH, height, crown width, crown base)
     for each of the three size classes (small, medium, large) per tree/palm species.
   - FK to plants_flat(id) ON DELETE CASCADE.
   - Unique constraint on (plant_id, size_class) — one set of dimensions per species per class.

2. Security
   - RLS enabled.
   - All authenticated users can SELECT (needed for the tree benefits calculator).
   - Only admins can INSERT/UPDATE/DELETE (managed via the admin panel).

3. Notes
   - When no row exists for a given plant_id + size_class, the calculator falls back
     to the generic DEFAULT_SIZE_CLASSES (the existing behaviour).
*/

CREATE TABLE IF NOT EXISTS tree_size_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id integer NOT NULL REFERENCES plants_flat(id) ON DELETE CASCADE,
  size_class text NOT NULL CHECK (size_class IN ('small', 'medium', 'large')),
  label text NOT NULL DEFAULT '',
  dbh numeric(5,1) NOT NULL DEFAULT 0,
  height numeric(5,1) NOT NULL DEFAULT 0,
  crown_width numeric(5,1) NOT NULL DEFAULT 0,
  crown_base numeric(5,1) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tree_size_classes_plant_size_key UNIQUE (plant_id, size_class)
);

ALTER TABLE tree_size_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_tree_size_classes" ON tree_size_classes;
CREATE POLICY "read_tree_size_classes"
  ON tree_size_classes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_tree_size_classes" ON tree_size_classes;
CREATE POLICY "admin_insert_tree_size_classes"
  ON tree_size_classes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_tree_size_classes" ON tree_size_classes;
CREATE POLICY "admin_update_tree_size_classes"
  ON tree_size_classes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_tree_size_classes" ON tree_size_classes;
CREATE POLICY "admin_delete_tree_size_classes"
  ON tree_size_classes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  );
