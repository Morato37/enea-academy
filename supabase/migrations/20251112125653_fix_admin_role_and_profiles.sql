/*
  # Fix Admin Role and User Profiles

  1. Updates
    - Set admin role for admin@admin.ch
    - Create user_profiles entries for users missing them
    - Update app_metadata to include role information

  2. Changes
    - Updates is_admin function to check both user_profiles and app_metadata
    - Ensures all auth.users have corresponding user_profiles entries
*/

-- Create user_profiles for users that don't have them
INSERT INTO user_profiles (id, email, full_name, role, status)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'user'),
  'active'
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Set admin role for the main admin user in user_profiles
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@admin.ch';

-- Update the is_admin function to check app_metadata as well
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND (raw_app_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;