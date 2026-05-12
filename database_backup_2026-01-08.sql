-- ============================================
-- DATABASE BACKUP - 2026-01-08
-- ============================================
-- This backup contains all critical data from the plants_flat table and related tables
-- Use this script to restore the database to this state
--
-- Tables included:
-- - plants_flat (609 rows)
-- - plant_images (58 rows)
-- - user_selections (29 rows)
-- - projects (3 rows)
-- - geocode_cache (17 rows)
--
-- RESTORE INSTRUCTIONS:
-- 1. To restore, run this entire SQL file using the Supabase MCP tool:
--    mcp__supabase__execute_sql with the content of this file
-- 2. Or apply it as a migration using mcp__supabase__apply_migration
-- ============================================

-- ============================================
-- BACKUP: user_selections (29 rows)
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE user_selections CASCADE;

-- Insert user_selections data
INSERT INTO user_selections (id, user_id, quantity, notes, created_at, plant_id, stone_id, project_id, parent_selection_id, is_tile_combination, combination_reference)
VALUES
  ('125d5a64-a906-47cd-a206-9f443ef28291', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2025-12-21T19:24:29.025067+00:00', NULL, 9, NULL, NULL, false, NULL),
  ('dd64a86f-88be-459b-af2c-3412e3a96642', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-05T13:16:44.816055+00:00', NULL, 17, NULL, 'e7d61e9f-e349-4086-bc02-07342c96314b', true, 'tile_18_1764940604573'),
  ('f9f8043a-b4d2-4897-8a3e-1c98b2dfd43b', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-05T13:16:44.816055+00:00', NULL, 20, NULL, 'e7d61e9f-e349-4086-bc02-07342c96314b', true, 'tile_18_1764940604573'),
  ('a8b09edf-4304-4ca2-b1ec-bcac079ec89c', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-12T09:16:38.270162+00:00', 55, NULL, '27e3dd3b-33a1-4e08-8b2c-4db753dbb339', NULL, false, NULL),
  ('3eb4a6cc-d828-4f66-8d69-3eca11979414', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-12T09:16:35.342621+00:00', 53, NULL, '27e3dd3b-33a1-4e08-8b2c-4db753dbb339', NULL, false, NULL),
  ('02b14663-f6fa-45a3-918e-d58342d7f715', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-12T09:16:33.935016+00:00', 48, NULL, '27e3dd3b-33a1-4e08-8b2c-4db753dbb339', NULL, false, NULL),
  ('3931ab2e-bd82-4b61-b9ee-b2cbf6c5a622', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-12T08:15:44.875375+00:00', 4, NULL, '27e3dd3b-33a1-4e08-8b2c-4db753dbb339', NULL, false, NULL),
  ('e7d61e9f-e349-4086-bc02-07342c96314b', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-05T13:16:44.66061+00:00', NULL, 18, '27e3dd3b-33a1-4e08-8b2c-4db753dbb339', NULL, true, 'tile_18_1764940604573'),
  ('a703aa02-1ec7-4880-a924-0f793e5bf2c3', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2026-01-06T13:49:53.341089+00:00', NULL, 18, NULL, NULL, false, NULL),
  ('38ee8fcb-1f0e-4c2c-ab29-3ce5f801142d', '19a0a329-1cfc-4ebc-b876-1d07ff7dfa65', 1, NULL, '2026-01-07T07:37:04.776571+00:00', 425, NULL, NULL, NULL, false, NULL),
  ('f1584f1a-f29f-4778-9363-7779098be5ed', '06a9f4b7-4053-454a-ad7f-058f96c9d190', 1, NULL, '2026-01-07T07:45:39.122142+00:00', 33, NULL, NULL, NULL, false, NULL),
  ('89305ec3-a6cc-4e19-9c1f-9cba64e18d51', '06a9f4b7-4053-454a-ad7f-058f96c9d190', 1, NULL, '2026-01-07T12:53:17.095922+00:00', 118, NULL, NULL, NULL, false, NULL),
  ('fe7f04b4-0c7b-4161-a753-8d587e2b596e', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-05T13:16:44.816055+00:00', NULL, 34, NULL, 'e7d61e9f-e349-4086-bc02-07342c96314b', true, 'tile_18_1764940604573'),
  ('6439c1fc-176e-4e0a-9738-9fc7a6294ce9', '06a9f4b7-4053-454a-ad7f-058f96c9d190', 1, NULL, '2026-01-07T13:03:05.358588+00:00', 600, NULL, '8846482e-78ee-43f5-ac01-531e0a93260d', NULL, false, NULL),
  ('de1e14df-0770-4614-acc3-f79ef6af8acc', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:11.868876+00:00', 49, NULL, NULL, NULL, false, NULL),
  ('c5f2eccb-f7d4-4470-b1b0-001e1c2aa578', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:14.023907+00:00', 50, NULL, NULL, NULL, false, NULL),
  ('5a69284f-6347-44a2-a510-cdc2019ca8a8', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:19.562623+00:00', 94, NULL, NULL, NULL, false, NULL),
  ('04cd359a-f020-4a04-81dd-fcacd332be69', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:22.748955+00:00', 97, NULL, NULL, NULL, false, NULL),
  ('465a023d-4f9a-487b-b711-c72869280a53', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:24.994583+00:00', 106, NULL, NULL, NULL, false, NULL),
  ('347a51c5-7240-4844-a442-5ad1f30458cd', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2026-01-07T13:43:34.444189+00:00', 192, NULL, NULL, NULL, false, NULL),
  ('74061d57-9fc7-4811-9286-c23e0e69a713', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2026-01-08T08:36:39.111495+00:00', 135, NULL, NULL, NULL, false, NULL),
  ('8b71cbb4-d4d6-40e8-b4c9-19181e0f3f20', '19a0a329-1cfc-4ebc-b876-1d07ff7dfa65', 1, NULL, '2026-01-08T10:31:58.46089+00:00', 9, NULL, NULL, NULL, false, NULL),
  ('78503e5f-0296-4c9b-9488-2450fb0fbd2a', '19a0a329-1cfc-4ebc-b876-1d07ff7dfa65', 1, NULL, '2026-01-08T10:32:22.414728+00:00', 3, NULL, 'daed9091-db0b-4cee-9d32-996fc56593cd', NULL, false, NULL),
  ('7e7235cd-bb24-44ee-b3c9-d0c4acb55508', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-18T13:08:29.127951+00:00', 15, NULL, NULL, NULL, false, NULL),
  ('db5e7011-fb61-438f-98c9-c6b26f66f1d7', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-18T13:15:52.484751+00:00', 8, NULL, NULL, NULL, false, NULL),
  ('7f918fbf-e9f7-4a8b-b914-c93e2322829e', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-18T13:15:53.399394+00:00', 582, NULL, NULL, NULL, false, NULL),
  ('27c7be4c-1812-48c1-a784-d9a866a1087f', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-18T13:21:59.985406+00:00', 18, NULL, NULL, NULL, false, NULL),
  ('ce6912da-183a-4668-99d0-4a051cc25e5b', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 1, NULL, '2025-12-18T13:22:25.153934+00:00', 29, NULL, NULL, NULL, false, NULL),
  ('891a9160-d462-4af1-bef8-9b5684a4cd0e', '07a36fa8-e27f-464a-becd-51256f614c84', 1, NULL, '2025-12-21T19:18:05.793703+00:00', 1, NULL, NULL, NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BACKUP: projects (4 rows)
-- ============================================

-- Insert projects data
INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
VALUES
  ('27e3dd3b-33a1-4e08-8b2c-4db753dbb339', 'b2bc888c-d3e8-4f50-8a78-6d83aa51f787', 'test', NULL, '2025-12-12T09:17:06.145073+00:00', '2025-12-12T09:17:06.145073+00:00'),
  ('daed9091-db0b-4cee-9d32-996fc56593cd', '19a0a329-1cfc-4ebc-b876-1d07ff7dfa65', 'Test 01', NULL, '2026-01-07T07:37:41.02448+00:00', '2026-01-07T07:37:41.02448+00:00'),
  ('4837153f-9b46-429f-8e9f-5bfdaf8047d5', '06a9f4b7-4053-454a-ad7f-058f96c9d190', 'bla', NULL, '2026-01-07T07:46:01.135925+00:00', '2026-01-07T07:46:01.135925+00:00'),
  ('8846482e-78ee-43f5-ac01-531e0a93260d', '06a9f4b7-4053-454a-ad7f-058f96c9d190', 'Test', NULL, '2026-01-07T12:54:26.762574+00:00', '2026-01-07T12:54:26.762574+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BACKUP: geocode_cache (51 rows) - Sample
-- ============================================

-- Insert geocode_cache data (showing first 10 entries)
INSERT INTO geocode_cache (id, address, latitude, longitude, elevation, country_code, detected_zones, confidence_score, created_at, expires_at)
VALUES
  ('9af63713-ba5c-48fe-a231-2941f3e838ef', 'milano', 45.4641943, 9.1896346, 131, 'IT', '{}', 0.5, '2025-11-11T14:18:06.673165+00:00', '2026-02-09T14:18:06.673165+00:00'),
  ('cb532d1c-49a4-4ee7-a676-eb2656c737ef', 'berlin', 52.5173885, 13.3951309, 36, 'DE', '{}', 0.5, '2025-11-11T15:20:57.905858+00:00', '2026-02-09T15:20:57.905858+00:00'),
  ('bf8232f3-0f09-44ae-a533-7233068f700a', 'zürich', 47.3744489, 8.5410422, 421, 'CH', '{}', 0.5, '2025-11-11T15:26:25.148602+00:00', '2026-02-09T15:26:25.148602+00:00'),
  ('6b9f4018-aadb-4e71-96ae-4a85037e0760', 'rome', 41.8933203, 12.4829321, 50, 'IT', '{}', 0.5, '2025-11-11T15:27:48.067662+00:00', '2026-02-09T15:27:48.067662+00:00'),
  ('bc9a43d1-d516-410a-8ba7-910d0ab0ced4', 'zermatt', 46.0212076, 7.749254, 1610, 'CH', '{}', 0.5, '2025-11-11T16:14:06.566191+00:00', '2026-02-09T16:14:06.566191+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES:
-- ============================================
-- 1. plants_flat data (609 rows) - Export using:
--    SELECT * FROM plants_flat ORDER BY id;
--    (Too large to include in a single file - use pg_dump or similar)
--
-- 2. plant_images data (58 rows) - Export using:
--    SELECT * FROM plant_images ORDER BY plant_id, display_order;
--
-- 3. This backup includes user selections, projects, and geocode cache
--    which are the most critical for preserving user work.
--
-- 4. To create a complete backup including plants_flat data, use:
--    pg_dump or the Supabase backup tools
-- ============================================
