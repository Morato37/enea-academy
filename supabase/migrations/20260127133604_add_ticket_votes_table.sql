/*
  # Add ticket voting system

  1. New Tables
    - `ticket_votes`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to tickets)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - Unique constraint on (ticket_id, user_id)
  
  2. Changes
    - Update tickets SELECT policy to allow all authenticated users to view all tickets
    - Users can only UPDATE their own tickets
    - Users can only INSERT tickets with their own user_id
  
  3. Security
    - Enable RLS on ticket_votes table
    - Users can insert votes for any ticket
    - Users can delete their own votes
    - All authenticated users can view all votes
    - Prevent duplicate votes with unique constraint
*/

-- Create ticket_votes table
CREATE TABLE IF NOT EXISTS ticket_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);

-- Enable RLS
ALTER TABLE ticket_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_votes
CREATE POLICY "Anyone can view votes"
  ON ticket_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add votes"
  ON ticket_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON ticket_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update tickets policies to allow all users to view all tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;

CREATE POLICY "All users can view all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Update ticket_comments policy to allow all users to view all comments
DROP POLICY IF EXISTS "Users can view comments on own tickets" ON ticket_comments;

CREATE POLICY "All users can view all comments"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only comment on any ticket (not just their own)
DROP POLICY IF EXISTS "Users can comment on own tickets" ON ticket_comments;

CREATE POLICY "Users can comment on any ticket"
  ON ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin_comment = false
  );
