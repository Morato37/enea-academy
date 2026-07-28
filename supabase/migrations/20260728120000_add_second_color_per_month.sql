/*
# Add second color per month to plants_flat

1. New Columns
- `color2_jan` through `color2_dec` (CHAR(7), nullable) on `plants_flat`.
- These store an optional second foliage/flower color per month.
- When both `color_<month>` and `color2_<month>` are set, the Blooming Calendar
  displays both colors split diagonally within the month cell.

2. Security
- No changes to RLS or policies. Existing policies on `plants_flat` cover the new columns automatically.

3. Notes
- All new columns are nullable, so existing rows and inserts are unaffected.
- The columns mirror the existing `color_<month>` set (CHAR(7) hex strings like "#86912b").
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'plants_flat' AND column_name = 'color2_jan') THEN
    ALTER TABLE plants_flat
      ADD COLUMN color2_jan CHAR(7),
      ADD COLUMN color2_feb CHAR(7),
      ADD COLUMN color2_mar CHAR(7),
      ADD COLUMN color2_apr CHAR(7),
      ADD COLUMN color2_may CHAR(7),
      ADD COLUMN color2_jun CHAR(7),
      ADD COLUMN color2_jul CHAR(7),
      ADD COLUMN color2_aug CHAR(7),
      ADD COLUMN color2_sep CHAR(7),
      ADD COLUMN color2_oct CHAR(7),
      ADD COLUMN color2_nov CHAR(7),
      ADD COLUMN color2_dec CHAR(7);
  END IF;
END $$;
