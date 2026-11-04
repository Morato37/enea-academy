/*
# Add pruning_form column to user_selections

1. Modified Tables
- `user_selections`: adds `pruning_form text` column (nullable)
  - CHECK constraint limits values to the 15 valid Schnittform codes
  - NULL means no pruning form has been chosen yet
2. Security
- No RLS changes needed — existing policies on user_selections already cover the new column
*/

ALTER TABLE public.user_selections
  ADD COLUMN IF NOT EXISTS pruning_form text;

ALTER TABLE public.user_selections
  DROP CONSTRAINT IF EXISTS user_selections_pruning_form_check;

ALTER TABLE public.user_selections
  ADD CONSTRAINT user_selections_pruning_form_check CHECK (
    pruning_form IS NULL OR pruning_form IN (
      'hochstamm', 'halbstamm', 'mehrstaemmig', 'etagen', 'dach', 'kuppel', 'schirm',
      'hecke', 'spalier_u', 'spalier', 'bonsai', 'haenge', 'strauch', 'natur', 'solitaer'
    )
  );

COMMENT ON COLUMN public.user_selections.pruning_form IS
  'Gewählte Schnittform (Code aus src/lib/pruningForms.ts), NULL = noch nicht gewählt';
