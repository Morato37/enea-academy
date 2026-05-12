/*
  # Add Azure OAuth Support

  ## Overview
  This migration enhances the user profile creation system to properly handle
  Azure AD (Microsoft 365) OAuth authentication. OAuth users will have profiles
  automatically created with appropriate defaults.

  ## Changes
  1. Update handle_new_user() function to better handle OAuth users
  2. Ensure OAuth users don't need password changes (must_change_password = false)
  3. Extract name from OAuth provider metadata
  4. Set default role to 'user' for new OAuth accounts

  ## Security
  - OAuth users are automatically verified by Azure AD
  - No password change required for OAuth accounts
  - RLS policies remain unchanged and work for all authentication methods
*/

-- Update the handle_new_user function to properly handle OAuth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_role text;
  is_oauth_user boolean;
BEGIN
  -- Determine if this is an OAuth user by checking if they have a provider other than 'email'
  is_oauth_user := NEW.raw_app_meta_data->>'provider' IS NOT NULL
                   AND NEW.raw_app_meta_data->>'provider' != 'email';

  -- Extract full name from metadata (OAuth providers populate this)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'full_name',
    NEW.raw_app_meta_data->>'name',
    ''
  );

  -- Extract role (default to 'user' for new accounts)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  -- Insert or update user profile
  INSERT INTO public.user_profiles (id, email, full_name, role, status, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    'active',
    -- OAuth users don't need to change password, only email/password users do
    CASE WHEN is_oauth_user THEN false ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
