/*
  # Security Fixes Part 2 - Optimized RLS Policies (Corrected)

  Recreate all RLS policies with:
  - Optimized auth.uid() calls using (select auth.uid())
  - Proper admin restrictions instead of USING (true)
  - No duplicate policies
  - Correct column names
*/

-- =====================================================
-- PROJECTS TABLE
-- =====================================================

CREATE POLICY "Users can view own projects" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own projects" 
  ON projects FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own projects" 
  ON projects FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own projects" 
  ON projects FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- =====================================================
-- USER SELECTIONS TABLE
-- =====================================================

CREATE POLICY "Users can view own selections" 
  ON user_selections FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own selections" 
  ON user_selections FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own selections" 
  ON user_selections FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own selections" 
  ON user_selections FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================

CREATE POLICY "Users can view all profiles" 
  ON user_profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile or admins can update any" 
  ON user_profiles FOR UPDATE 
  TO authenticated 
  USING (
    id = (select auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    id = (select auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can insert user profiles" 
  ON user_profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete user profiles" 
  ON user_profiles FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- STONE COMBINATIONS TABLE
-- =====================================================

CREATE POLICY "Anyone can view stone combinations" 
  ON stone_combinations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can insert stone combinations" 
  ON stone_combinations FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update stone combinations" 
  ON stone_combinations FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete stone combinations" 
  ON stone_combinations FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- DOCUMENTS METADATA TABLE
-- =====================================================

CREATE POLICY "Users can insert their own documents" 
  ON documents_metadata FOR INSERT 
  TO authenticated 
  WITH CHECK (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can update their own documents" 
  ON documents_metadata FOR UPDATE 
  TO authenticated 
  USING (uploaded_by = (select auth.uid()))
  WITH CHECK (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can delete their own documents" 
  ON documents_metadata FOR DELETE 
  TO authenticated 
  USING (uploaded_by = (select auth.uid()));

-- =====================================================
-- TICKETS TABLE
-- =====================================================

CREATE POLICY "All users can view all tickets" 
  ON tickets FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create tickets" 
  ON tickets FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can update tickets" 
  ON tickets FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- TICKET COMMENTS TABLE
-- =====================================================

CREATE POLICY "All users can view all comments" 
  ON ticket_comments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create comments" 
  ON ticket_comments FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- TICKET VOTES TABLE
-- =====================================================

CREATE POLICY "Users can add votes" 
  ON ticket_votes FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can remove own votes" 
  ON ticket_votes FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- =====================================================
-- MICROCLIMATE FACTORS TABLE
-- =====================================================

CREATE POLICY "Anyone can read microclimate factors" 
  ON microclimate_factors FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage microclimate factors" 
  ON microclimate_factors FOR ALL 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- ZONE ADJUSTMENTS TABLE
-- =====================================================

CREATE POLICY "Anyone can read zone adjustments" 
  ON zone_adjustments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage zone adjustments" 
  ON zone_adjustments FOR ALL 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- CLIMATE DATA POINTS TABLE
-- =====================================================

CREATE POLICY "Admins can insert climate data" 
  ON climate_data_points FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update climate data" 
  ON climate_data_points FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- PLANT IMAGES TABLE
-- =====================================================

CREATE POLICY "Admins can insert plant images" 
  ON plant_images FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update plant images" 
  ON plant_images FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete plant images" 
  ON plant_images FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- PLANTS FLAT TABLE
-- =====================================================

CREATE POLICY "Admins can insert plants" 
  ON plants_flat FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update plants" 
  ON plants_flat FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete plants" 
  ON plants_flat FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- POSTAL CODE ZONES TABLE
-- =====================================================

CREATE POLICY "Admins can insert postal code zones" 
  ON postal_code_zones FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- STONE IMAGES TABLE
-- =====================================================

CREATE POLICY "Admins can insert stone images" 
  ON stone_images FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update stone images" 
  ON stone_images FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete stone images" 
  ON stone_images FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- STONES TABLE
-- =====================================================

CREATE POLICY "Admins can insert stones" 
  ON stones FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update stones" 
  ON stones FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete stones" 
  ON stones FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- =====================================================
-- BACKUP TABLES (if exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'climate_data_points_backup') THEN
    DROP POLICY IF EXISTS "Admins can access climate backup" ON climate_data_points_backup;
    CREATE POLICY "Admins can access climate backup" 
      ON climate_data_points_backup FOR ALL 
      TO authenticated 
      USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plants_backup_20251204') THEN
    DROP POLICY IF EXISTS "Admins can access plants backup" ON plants_backup_20251204;
    CREATE POLICY "Admins can access plants backup" 
      ON plants_backup_20251204 FOR ALL 
      TO authenticated 
      USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
      );
  END IF;
END $$;
