/*
  # Security Fixes Part 3 - Function Search Path Security

  Set explicit search_path for all functions to prevent schema injection attacks.
  This ensures functions only search in the public schema and pg_temp.
*/

-- Set explicit search_path for all functions with correct signatures
DO $$
BEGIN
  -- update_stone_combinations_updated_at
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_stone_combinations_updated_at') THEN
    ALTER FUNCTION update_stone_combinations_updated_at() SET search_path = public, pg_temp;
  END IF;

  -- update_postal_code_access
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_postal_code_access') THEN
    ALTER FUNCTION update_postal_code_access() SET search_path = public, pg_temp;
  END IF;

  -- clean_expired_geocode_cache
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clean_expired_geocode_cache') THEN
    ALTER FUNCTION clean_expired_geocode_cache() SET search_path = public, pg_temp;
  END IF;

  -- sync_user_role_to_auth (no parameters)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_user_role_to_auth') THEN
    ALTER FUNCTION sync_user_role_to_auth() SET search_path = public, pg_temp;
  END IF;

  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;
  END IF;

  -- update_updated_at_column
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
  END IF;

  -- update_ticket_timestamp
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_ticket_timestamp') THEN
    ALTER FUNCTION update_ticket_timestamp() SET search_path = public, pg_temp;
  END IF;

  -- is_admin (takes user_id uuid parameter)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    ALTER FUNCTION is_admin(user_id uuid) SET search_path = public, pg_temp;
  END IF;

  -- generate_otp
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_otp') THEN
    ALTER FUNCTION generate_otp() SET search_path = public, pg_temp;
  END IF;
END $$;
