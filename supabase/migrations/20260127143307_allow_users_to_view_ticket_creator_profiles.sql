/*
  # Allow users to view profiles of ticket creators

  1. Changes
    - Add new RLS policy to allow authenticated users to view user_profiles
    - This enables users to see who created tickets (including admins)
    - Users can now see email addresses of ticket creators for proper attribution

  2. Security
    - Only authenticated users can view profiles
    - Only basic profile information (id, email) is exposed
    - Users still can only modify their own profiles
*/

-- Drop the restrictive SELECT policy for regular users
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create a new policy that allows all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);
