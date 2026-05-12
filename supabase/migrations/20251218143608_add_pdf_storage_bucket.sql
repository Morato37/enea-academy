/*
  # Add PDF Storage Bucket

  1. Storage Bucket
    - Create `documents` bucket for PDF files
    - Set size limit to 50MB per file
    - Allow only PDF mime types
  
  2. Security
    - Enable public read access to documents bucket
    - Allow authenticated admin users to upload PDFs
    - PDFs accessible via public URLs
  
  3. Notes
    - PDFs will be stored in Supabase Storage instead of /public folder
    - Accessible via: {SUPABASE_URL}/storage/v1/object/public/documents/{filename}
*/

-- Create storage bucket for PDF documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
CREATE POLICY "Public read access for documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');