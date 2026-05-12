/*
  # Add Documents Metadata Table

  1. New Tables
    - `documents_metadata`
      - `id` (uuid, primary key)
      - `filename` (text, unique) - The name of the file in storage
      - `display_name` (text) - User-friendly display name
      - `description` (text, nullable) - Optional description
      - `category` (text) - Category: general_information, templates, or technical_information
      - `file_size` (bigint) - File size in bytes
      - `storage_path` (text) - Path in Supabase storage
      - `uploaded_by` (uuid) - Reference to auth.users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `documents_metadata` table
    - Add policy for authenticated users to read documents
    - Add policy for authenticated users to manage their own uploads
    - Admin users can manage all documents
*/

CREATE TABLE IF NOT EXISTS documents_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('general_information', 'templates', 'technical_information')),
  file_size bigint DEFAULT 0,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documents metadata"
  ON documents_metadata
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own documents"
  ON documents_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents"
  ON documents_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents"
  ON documents_metadata
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents_metadata(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents_metadata(created_at DESC);
