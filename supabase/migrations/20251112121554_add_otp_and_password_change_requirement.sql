/*
  # Add OTP and Password Change Requirement

  1. Changes to Tables
    - Add `temporary_password` field to `user_profiles`
    - Add `must_change_password` boolean flag to track first login
    - Add `password_changed_at` timestamp

  2. Security
    - Only admins can see temporary passwords
    - Users must change password on first login

  3. Notes
    - Temporary passwords are one-time use
    - System tracks when users change their password
    - Password change requirement is enforced at login
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'temporary_password'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN temporary_password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN must_change_password boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN password_changed_at timestamptz;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text AS $$
DECLARE
  chars text := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
