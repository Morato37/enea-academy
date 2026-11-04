/*
  # Create Library System

  1. New Tables
    - `library_books` - title, author, isbn, description, category, cover_image_url
    - `library_reservations` - book_id, user_id, status, reserved_at, due_date, returned_at

  2. Security
    - All authenticated users can browse books and see who has which book
    - Users can reserve and cancel their own reservations
    - Admins can add/edit/delete books and manage all reservations
    - Partial unique index prevents double-booking (one active reservation per book)

  3. Notes
    - One copy per book
    - 30-day loan period (due_date set by frontend on insert)
*/

CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  description text,
  category text DEFAULT 'General',
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  reserved_at timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  returned_at timestamptz,
  CONSTRAINT valid_reservation_status CHECK (status IN ('active', 'returned'))
);

CREATE INDEX IF NOT EXISTS idx_library_books_category ON library_books(category);
CREATE INDEX IF NOT EXISTS idx_library_reservations_book_id ON library_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_user_id ON library_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_status ON library_reservations(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_one_active_reservation
  ON library_reservations(book_id) WHERE status = 'active';

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can browse library books" ON library_books;
CREATE POLICY "Users can browse library books" ON library_books FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can add library books" ON library_books;
CREATE POLICY "Admins can add library books" ON library_books FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can edit library books" ON library_books;
CREATE POLICY "Admins can edit library books" ON library_books FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete library books" ON library_books;
CREATE POLICY "Admins can delete library books" ON library_books FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can view active reservations" ON library_reservations;
CREATE POLICY "Users can view active reservations" ON library_reservations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create own reservations" ON library_reservations;
CREATE POLICY "Users can create own reservations" ON library_reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own reservations" ON library_reservations;
CREATE POLICY "Users can cancel own reservations" ON library_reservations FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'active');

DROP POLICY IF EXISTS "Admins can update reservations" ON library_reservations;
CREATE POLICY "Admins can update reservations" ON library_reservations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete reservations" ON library_reservations;
CREATE POLICY "Admins can delete reservations" ON library_reservations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

CREATE OR REPLACE FUNCTION update_library_book_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_library_books_updated_at ON library_books;
CREATE TRIGGER update_library_books_updated_at
  BEFORE UPDATE ON library_books FOR EACH ROW
  EXECUTE FUNCTION update_library_book_timestamp();
