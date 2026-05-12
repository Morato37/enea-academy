/*
  # Security Fixes Part 1 - Indexes and Policy Cleanup

  1. Add missing indexes for foreign keys
  2. Drop all existing policies that need to be recreated
  3. Remove duplicate indexes
  4. Enable RLS on backup tables
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documents_metadata_uploaded_by 
  ON documents_metadata(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id 
  ON ticket_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_ticket_votes_user_id 
  ON ticket_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_invited_by 
  ON user_profiles(invited_by);

-- =====================================================
-- 2. DROP ALL POLICIES THAT NEED TO BE RECREATED
-- =====================================================

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- User selections
DROP POLICY IF EXISTS "Users can view own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can create own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can update own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can delete own selections" ON user_selections;

-- User profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

-- Stone combinations
DROP POLICY IF EXISTS "Anyone can read stone combinations" ON stone_combinations;
DROP POLICY IF EXISTS "Anyone can view stone combinations" ON stone_combinations;
DROP POLICY IF EXISTS "Admins can insert stone combinations" ON stone_combinations;
DROP POLICY IF EXISTS "Admins can update stone combinations" ON stone_combinations;
DROP POLICY IF EXISTS "Admins can delete stone combinations" ON stone_combinations;

-- Documents metadata
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents_metadata;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents_metadata;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents_metadata;

-- Tickets
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "All users can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

-- Ticket comments
DROP POLICY IF EXISTS "Admins can create comments" ON ticket_comments;
DROP POLICY IF EXISTS "Users can comment on any ticket" ON ticket_comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON ticket_comments;
DROP POLICY IF EXISTS "All users can view all comments" ON ticket_comments;

-- Ticket votes
DROP POLICY IF EXISTS "Users can add votes" ON ticket_votes;
DROP POLICY IF EXISTS "Users can remove own votes" ON ticket_votes;

-- Microclimate factors
DROP POLICY IF EXISTS "Anyone can read microclimate factors" ON microclimate_factors;
DROP POLICY IF EXISTS "Authenticated users can manage microclimate factors" ON microclimate_factors;

-- Zone adjustments
DROP POLICY IF EXISTS "Anyone can read zone adjustments" ON zone_adjustments;
DROP POLICY IF EXISTS "Authenticated users can manage zone adjustments" ON zone_adjustments;

-- Climate data points
DROP POLICY IF EXISTS "Authenticated users can insert climate data" ON climate_data_points;
DROP POLICY IF EXISTS "Authenticated users can update climate data" ON climate_data_points;

-- Plant images
DROP POLICY IF EXISTS "Authenticated users can insert plant images" ON plant_images;
DROP POLICY IF EXISTS "Authenticated users can update plant images" ON plant_images;
DROP POLICY IF EXISTS "Authenticated users can delete plant images" ON plant_images;

-- Plants flat
DROP POLICY IF EXISTS "Authenticated users can insert plants_flat" ON plants_flat;
DROP POLICY IF EXISTS "Authenticated users can update plants_flat" ON plants_flat;
DROP POLICY IF EXISTS "Authenticated users can delete plants_flat" ON plants_flat;

-- Postal code zones
DROP POLICY IF EXISTS "Authenticated users can insert postal code zones" ON postal_code_zones;

-- Stone images
DROP POLICY IF EXISTS "Authenticated users can insert stone images" ON stone_images;
DROP POLICY IF EXISTS "Authenticated users can update stone images" ON stone_images;
DROP POLICY IF EXISTS "Authenticated users can delete stone images" ON stone_images;

-- Stones
DROP POLICY IF EXISTS "Authenticated users can insert stones" ON stones;
DROP POLICY IF EXISTS "Authenticated users can update stones" ON stones;
DROP POLICY IF EXISTS "Authenticated users can delete stones" ON stones;

-- =====================================================
-- 3. REMOVE DUPLICATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_plant_images_plant_id;

-- =====================================================
-- 4. ENABLE RLS ON BACKUP TABLES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'climate_data_points_backup') THEN
    ALTER TABLE climate_data_points_backup ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plants_backup_20251204') THEN
    ALTER TABLE plants_backup_20251204 ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
