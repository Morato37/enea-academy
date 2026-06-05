/*
  # Add Project Sharing

  ## Overview
  Allows users to share their projects with other platform users, granting either
  view-only or edit access. Multiple collaborators can work on the same project.

  ## 1. New Tables
  - `project_shares`
    - `id` (uuid, PK)
    - `project_id` (uuid, FK → projects, cascade delete)
    - `owner_id` (uuid, FK → auth.users) — the user who created the share
    - `shared_with_user_id` (uuid, FK → auth.users) — the recipient
    - `permission` (text, 'view' | 'edit') — what the recipient can do
    - `created_at`
    - UNIQUE constraint on (project_id, shared_with_user_id) to prevent duplicates

  ## 2. Modified RLS Policies
  - `projects` SELECT: also allows users who appear in project_shares as recipient
  - `user_selections` SELECT: also allows seeing all selections in a shared project
  - `user_selections` INSERT: allows inserting into a shared project with edit permission
  - `user_selections` UPDATE/DELETE: allows project owner to update/delete any row in their project
  - `project_zones` SELECT: also allows seeing zones of a shared project

  ## 3. New Indexes
  - project_shares(project_id)
  - project_shares(shared_with_user_id)

  ## 4. Collaboration Model
  - Collaborators with 'edit' add selections under their own user_id but the shared project_id
  - The project view merges all contributor selections by project_id
  - Only the project owner can rename/delete the project and manage zones
  - Collaborators with 'edit' can add/remove their own selections and assign to existing zones
  - Project owner can delete any selection in their project
*/

-- =====================================================
-- project_shares TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, shared_with_user_id)
);

ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS project_shares_project_id_idx ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS project_shares_shared_with_idx ON project_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS project_shares_owner_id_idx ON project_shares(owner_id);

DROP POLICY IF EXISTS "select_project_shares" ON project_shares;
CREATE POLICY "select_project_shares" ON project_shares FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = owner_id OR
    (select auth.uid()) = shared_with_user_id
  );

DROP POLICY IF EXISTS "insert_project_shares" ON project_shares;
CREATE POLICY "insert_project_shares" ON project_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = owner_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "update_project_shares" ON project_shares;
CREATE POLICY "update_project_shares" ON project_shares FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "delete_project_shares" ON project_shares;
CREATE POLICY "delete_project_shares" ON project_shares FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- =====================================================
-- PROJECTS: update SELECT to include shared projects
-- =====================================================

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_shares
      WHERE project_shares.project_id = projects.id
      AND project_shares.shared_with_user_id = (select auth.uid())
    )
  );

-- =====================================================
-- USER_SELECTIONS: update all policies for shared project access
-- =====================================================

DROP POLICY IF EXISTS "Users can view own selections" ON user_selections;
CREATE POLICY "Users can view own selections"
  ON user_selections FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = user_selections.project_id
        AND (
          projects.user_id = (select auth.uid()) OR
          EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_shares.project_id = projects.id
            AND project_shares.shared_with_user_id = (select auth.uid())
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own selections" ON user_selections;
CREATE POLICY "Users can create own selections"
  ON user_selections FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) AND
    (
      project_id IS NULL OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = user_selections.project_id
        AND (
          projects.user_id = (select auth.uid()) OR
          EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_shares.project_id = projects.id
            AND project_shares.shared_with_user_id = (select auth.uid())
            AND project_shares.permission = 'edit'
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own selections" ON user_selections;
CREATE POLICY "Users can update own selections"
  ON user_selections FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = user_selections.project_id
        AND projects.user_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = user_selections.project_id
        AND projects.user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own selections" ON user_selections;
CREATE POLICY "Users can delete own selections"
  ON user_selections FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = user_selections.project_id
        AND projects.user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- PROJECT_ZONES: update SELECT to include shared project zones
-- =====================================================

DROP POLICY IF EXISTS "Users can view own zones" ON project_zones;
CREATE POLICY "Users can view own zones"
  ON project_zones FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_zones.project_id
        AND (
          projects.user_id = (select auth.uid()) OR
          EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_shares.project_id = projects.id
            AND project_shares.shared_with_user_id = (select auth.uid())
          )
        )
      )
    )
  );
