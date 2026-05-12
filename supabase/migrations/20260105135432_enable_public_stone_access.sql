/*
  # Enable Public Access to Stones

  1. Security Changes
    - Add policy to allow anyone to read stones table
    - Add policy to allow anyone to read stone_combinations table
    - These tables contain public product information that should be accessible without login
  
  2. Purpose
    - Enable public stone detail pages that can be accessed without authentication
    - Allow sharing of stone information via direct links
*/

-- Allow anyone to read stones
DROP POLICY IF EXISTS "Anyone can read stones" ON stones;
CREATE POLICY "Anyone can read stones"
  ON stones FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to read stone combinations
DROP POLICY IF EXISTS "Anyone can read stone combinations" ON stone_combinations;
CREATE POLICY "Anyone can read stone combinations"
  ON stone_combinations FOR SELECT
  TO anon, authenticated
  USING (true);
