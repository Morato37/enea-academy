-- =====================================================================
-- FIX: Allow shared project collaborators to see PDF plans
-- =====================================================================
-- PROBLEM: When a project is shared, collaborators can see the project,
-- its selections, and its zones — but NOT its PDF plans, because the
-- RLS policies on project_plans and project_plan_zones only allow the
-- owner (auth.uid() = user_id) to read them.
--
-- SOLUTION: Update the RLS policies to use the existing SECURITY DEFINER
-- helper functions (can_access_project, is_project_owner,
-- has_edit_project_share) that are already used by the projects,
-- user_selections, and project_zones tables.
--
-- HOW TO APPLY: Copy this entire file and paste it into the Supabase
-- Dashboard SQL Editor, then click "Run".
-- =====================================================================

-- project_plans: SELECT — owner OR shared access
DROP POLICY IF EXISTS "select_own_plans" ON project_plans;
CREATE POLICY "select_own_plans"
  ON project_plans FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      project_id IS NOT NULL
      AND public.can_access_project(project_id)
    )
  );

-- project_plans: INSERT — owner OR edit-share
DROP POLICY IF EXISTS "insert_own_plans" ON project_plans;
CREATE POLICY "insert_own_plans"
  ON project_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      project_id IS NULL
      OR public.is_project_owner(project_id)
      OR public.has_edit_project_share(project_id)
    )
  );

-- project_plans: UPDATE — owner only
DROP POLICY IF EXISTS "update_own_plans" ON project_plans;
CREATE POLICY "update_own_plans"
  ON project_plans FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      project_id IS NOT NULL
      AND public.is_project_owner(project_id)
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      project_id IS NOT NULL
      AND public.is_project_owner(project_id)
    )
  );

-- project_plans: DELETE — owner only
DROP POLICY IF EXISTS "delete_own_plans" ON project_plans;
CREATE POLICY "delete_own_plans"
  ON project_plans FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      project_id IS NOT NULL
      AND public.is_project_owner(project_id)
    )
  );

-- project_plan_zones: SELECT — via parent plan's project (owner OR shared)
DROP POLICY IF EXISTS "select_own_plan_zones" ON project_plan_zones;
CREATE POLICY "select_own_plan_zones"
  ON project_plan_zones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_plans
      WHERE project_plans.id = project_plan_zones.plan_id
      AND (
        project_plans.user_id = auth.uid()
        OR (
          project_plans.project_id IS NOT NULL
          AND public.can_access_project(project_plans.project_id)
        )
      )
    )
  );

-- project_plan_zones: INSERT — owner OR edit-share
DROP POLICY IF EXISTS "insert_own_plan_zones" ON project_plan_zones;
CREATE POLICY "insert_own_plan_zones"
  ON project_plan_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_plans
      WHERE project_plans.id = project_plan_zones.plan_id
      AND (
        project_plans.user_id = auth.uid()
        OR (
          project_plans.project_id IS NOT NULL
          AND (
            public.is_project_owner(project_plans.project_id)
            OR public.has_edit_project_share(project_plans.project_id)
          )
        )
      )
    )
  );

-- project_plan_zones: UPDATE — owner OR edit-share
DROP POLICY IF EXISTS "update_own_plan_zones" ON project_plan_zones;
CREATE POLICY "update_own_plan_zones"
  ON project_plan_zones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_plans
      WHERE project_plans.id = project_plan_zones.plan_id
      AND (
        project_plans.user_id = auth.uid()
        OR (
          project_plans.project_id IS NOT NULL
          AND (
            public.is_project_owner(project_plans.project_id)
            OR public.has_edit_project_share(project_plans.project_id)
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_plans
      WHERE project_plans.id = project_plan_zones.plan_id
      AND (
        project_plans.user_id = auth.uid()
        OR (
          project_plans.project_id IS NOT NULL
          AND (
            public.is_project_owner(project_plans.project_id)
            OR public.has_edit_project_share(project_plans.project_id)
          )
        )
      )
    )
  );

-- project_plan_zones: DELETE — owner OR edit-share
DROP POLICY IF EXISTS "delete_own_plan_zones" ON project_plan_zones;
CREATE POLICY "delete_own_plan_zones"
  ON project_plan_zones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_plans
      WHERE project_plans.id = project_plan_zones.plan_id
      AND (
        project_plans.user_id = auth.uid()
        OR (
          project_plans.project_id IS NOT NULL
          AND (
            public.is_project_owner(project_plans.project_id)
            OR public.has_edit_project_share(project_plans.project_id)
          )
        )
      )
    )
  );
