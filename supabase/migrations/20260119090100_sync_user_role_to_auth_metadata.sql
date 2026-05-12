/*
  # Sync User Role to Auth Metadata

  ## Problem
  When updating a user's role in user_profiles table, the role in auth.users metadata
  is not updated, causing inconsistencies. The is_admin() function checks both places,
  but if they don't match, it can lead to users not getting proper permissions.

  ## Solution
  1. Create a trigger that automatically syncs role changes from user_profiles to auth.users.raw_app_meta_data
  2. Sync all existing roles from user_profiles to auth.users
  3. Update is_admin() function to primarily check user_profiles (single source of truth)

  ## Changes
  - New trigger function: sync_user_role_to_auth()
  - New trigger: on_user_role_change
  - One-time sync of all existing roles
  - Updated is_admin() function

  ## Security
  - Uses SECURITY DEFINER to allow updating auth.users metadata
  - Only syncs role field, nothing else
*/

-- Function to sync role from user_profiles to auth.users.raw_app_meta_data
CREATE OR REPLACE FUNCTION sync_user_role_to_auth()
RETURNS trigger AS $$
BEGIN
  -- Update the raw_app_meta_data with the new role
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_role_change ON user_profiles;

-- Create trigger that fires on INSERT or UPDATE of user_profiles
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- Sync all existing roles from user_profiles to auth.users
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id, role FROM user_profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', profile_record.role)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Update is_admin function to use user_profiles as primary source of truth
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check user_profiles first (primary source of truth)
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;