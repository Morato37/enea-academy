/*
  # Fix infinite recursion in project sharing RLS policies

  ## Problem
  The `projects` SELECT policy contains an EXISTS subquery that queries `project_shares`.
  When the frontend joins `project_shares` with `projects` (e.g. `project_shares.select('*, project:projects(*)')`),
  Postgres detects a circular dependency:
    query project_shares → join projects → projects policy queries project_shares → recursion detected

  ## Solution
  Create SECURITY DEFINER helper functions that bypass RLS when doing cross-table lookups.
  SECURITY DEFINER functions run as the function owner (postgres/superuser), which skips RLS on
  any tables they query, breaking the circular dependency.

  ## Changes
  1. New SECURITY DEFINER functions:
     - `has_project_share(project_id)` — checks if auth.uid() has any share for a project
     - `has_edit_project_share(project_id)` — checks if auth.uid() has 'edit' share
     - `is_project_owner(project_id)` — checks if auth.uid() owns a project
     - `can_access_project(project_id)` — checks owner OR shared access

  2. Replaced recursive policies using inline cross-table subqueries with calls to these functions:
     - projects SELECT
     - project_shares INSERT
     - user_selections SELECT, INSERT, UPDATE, DELETE
     - project_zones SELECT
*/

-- =====================================================
-- SECURITY DEFINER helper functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_project_share(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_id = p_project_id
    AND shared_with_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_edit_project_share(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_id = p_project_id
    AND shared_with_user_id = auth.uid()
    AND permission = 'edit'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_id = p_project_id
        AND shared_with_user_id = auth.uid()
      )
    )
  );
$$;

-- =====================================================
-- projects: fix SELECT to use security definer
-- =====================================================

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    public.has_project_share(id)
  );

-- =====================================================
-- project_shares: fix INSERT to use security definer
-- =====================================================

DROP POLICY IF EXISTS "insert_project_shares" ON project_shares;
CREATE POLICY "insert_project_shares" ON project_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = owner_id AND
    public.is_project_owner(project_id)
  );

-- =====================================================
-- user_selections: replace all policies using security definer
-- =====================================================

DROP POLICY IF EXISTS "Users can view own selections" ON user_selections;
CREATE POLICY "Users can view own selections"
  ON user_selections FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      public.can_access_project(project_id)
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
      public.is_project_owner(project_id) OR
      public.has_edit_project_share(project_id)
    )
  );

DROP POLICY IF EXISTS "Users can update own selections" ON user_selections;
CREATE POLICY "Users can update own selections"
  ON user_selections FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (project_id IS NOT NULL AND public.is_project_owner(project_id))
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    (project_id IS NOT NULL AND public.is_project_owner(project_id))
  );

DROP POLICY IF EXISTS "Users can delete own selections" ON user_selections;
CREATE POLICY "Users can delete own selections"
  ON user_selections FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (project_id IS NOT NULL AND public.is_project_owner(project_id))
  );

-- =====================================================
-- project_zones: fix SELECT to use security definer
-- =====================================================

DROP POLICY IF EXISTS "Users can view own zones" ON project_zones;
CREATE POLICY "Users can view own zones"
  ON project_zones FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (
      project_id IS NOT NULL AND
      public.can_access_project(project_id)
    )
  );
