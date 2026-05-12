/*
  # Add Projects Table for Selection History

  ## Overview
  This migration creates a projects table to allow users to save their selections
  with project names and manage a history of different projects.

  ## Changes

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique project identifier
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `name` (text) - Project name given by user
      - `description` (text, optional) - Project description
      - `created_at` (timestamptz) - When project was created
      - `updated_at` (timestamptz) - When project was last modified

  2. Modified Tables
    - `user_selections`
      - Add `project_id` (uuid, foreign key, nullable) - Links to projects table
      - Make it nullable to maintain backward compatibility

  3. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to manage their own projects
    - Update user_selections policies to support project-based access

  4. Indexes
    - Add index on user_selections(project_id) for performance
    - Add index on projects(user_id) for performance
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add project_id to user_selections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_selections' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE user_selections ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_project_id ON user_selections(project_id);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update user_selections policies to support project-based access
DROP POLICY IF EXISTS "Users can view own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can create own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can update own selections" ON user_selections;
DROP POLICY IF EXISTS "Users can delete own selections" ON user_selections;

CREATE POLICY "Users can view own selections"
  ON user_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own selections"
  ON user_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own selections"
  ON user_selections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own selections"
  ON user_selections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
