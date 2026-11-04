/*
# Populate initial tree size class rows

This inserts editable starting values for every plant marked as a tree or palm.
The values are the current generic defaults and can then be replaced per species
in Admin > Baum-Grössen. Existing rows are preserved.
*/

INSERT INTO tree_size_classes (
  plant_id,
  size_class,
  label,
  dbh,
  height,
  crown_width,
  crown_base
)
SELECT
  p.id,
  s.size_class,
  s.label,
  s.dbh,
  s.height,
  s.crown_width,
  s.crown_base
FROM plants_flat AS p
CROSS JOIN (
  VALUES
    ('small',  'StU 16–18', 5.5::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
    ('medium', 'StU 25–30', 8.8::numeric, 5.5::numeric, 2.5::numeric, 2.2::numeric),
    ('large',  'StU 40–45', 13.5::numeric, 7.5::numeric, 3.5::numeric, 2.4::numeric)
) AS s(size_class, label, dbh, height, crown_width, crown_base)
WHERE p.category_tree = true OR p.category_palm = true
ON CONFLICT (plant_id, size_class) DO NOTHING;

SELECT COUNT(*) AS inserted_or_existing_tree_size_rows
FROM tree_size_classes;
