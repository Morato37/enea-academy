-- ============================================
-- STONES BACKUP SQL DUMP
-- Created: 2026-01-13
-- Total Stones: 16
-- Total Images: 25
-- Total Combinations: 35
-- ============================================

-- Insert stones
INSERT INTO stones (id, name, morphology, producer_seller, origin, stone_color, mediterranean_zone, central_europe_zone, alpine_zone, use_tiles, use_block_steps, use_paving, use_walls, use_pool, use_chippings, finish_split, finish_flamed, finish_blasted, finish_sawn, finish_hammered, finish_brushed, finish_polished, finish_honed, frost_resistant, less_frost_resistant, not_frost_resistant, image_url, stone_category, finish_split_image_url, finish_flamed_image_url, finish_blasted_image_url, finish_sawn_image_url, finish_hammered_image_url, finish_brushed_image_url, finish_polished_image_url, finish_honed_image_url, pre_alps_zone) VALUES
(1, 'Guber', 'Quartz sandstone', 'Guber', 'CH, OW', 'grey-brown', true, true, true, true, true, true, true, false, true, true, true, false, true, true, true, false, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-1-1765542265342.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(4, 'Andeer', 'Gneiss', 'Toscano AG', 'CH, GR', 'silver-green', false, true, true, true, true, true, true, true, true, true, true, true, true, false, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-4-1763632505178.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(7, 'Valser', 'Quartzite', 'Truffer AG', 'CH, GR', 'silver-grey', false, true, true, true, true, true, false, true, true, true, false, true, true, false, false, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-7-1763632818762.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(8, 'Katzenkopf', 'Sediments (different riverstones)', '', 'CH', 'grey', false, true, true, false, false, true, false, false, true, true, false, false, false, true, false, false, false, false, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-8-1763632682284.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(9, 'Luserna', 'Gneiss', 'De Zanet AG', 'IT ', 'warm-grey', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-9-1763632751188.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(10, 'Pietra Piasentina', 'Limestone', 'Consorzio PP', 'IT', 'grey-brown', true, true, true, true, true, true, true, false, false, true, true, false, true, true, false, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-10-1765541701778.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(15, 'Wachenzeller', 'Dolomite', 'Franken Schotter', 'GER, BAY', 'beige-brown', true, true, false, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-15-1763632870276.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(16, 'Kirchheimer Muschelkalk', 'Limestone', 'Kuster AG', 'GER, BW', 'light-grey-orange', true, true, false, true, true, true, true, false, false, true, true, false, true, false, false, true, true, false, true, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-16-1763632727470.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(17, 'Fiscal Brown', 'Quartz Sandstone', 'De Zanet AG', 'POR / ESP', 'grey-brown', true, true, true, true, true, true, true, false, false, true, true, true, true, true, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-17-1763632646816.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(18, 'Alta', 'Slate', 'Minera Skifer AS', 'NOR', 'anthrazite', false, true, false, true, false, true, false, true, false, true, true, false, true, false, false, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-18-1762767800249.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(20, 'Vulcano Black', 'Basalt', 'De Zanet AG', 'CHI', 'anthrazite', true, true, true, true, true, true, false, false, true, false, true, false, true, false, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-20-1763632852970.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(30, 'Berlin paving slabs', 'Granite', 'De Zanet AG', 'D', 'brown-grey', true, true, false, true, false, true, false, false, false, false, true, false, false, false, false, false, false, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-30-1765541908058.jpg', 'tile', null, null, null, null, null, null, null, null, false),
(31, 'Andeer', 'Gneiss', 'Toscano AG', 'CH, GR', 'silver-green', false, true, true, true, true, true, true, true, true, true, true, true, true, false, true, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-31-1765980628475.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(32, 'Valser', 'Quartzite', 'Truffer AG', 'CH, GR', 'silver-grey', false, true, true, true, true, true, false, true, true, true, false, true, true, false, false, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-32-1765980668644.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(33, 'Pietra Piasentina', 'Limestone', 'Consorzio PP', 'IT', 'grey-brown', true, true, true, true, true, true, true, false, false, true, true, false, true, true, false, true, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-33-1765980741193.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false),
(34, 'Guber', 'Quartz sandstone', 'Guber', 'CH, OW', 'grey-brown', true, true, true, true, true, true, true, false, true, true, true, false, true, true, true, false, true, true, false, false, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-34-1765981018964.jpg', 'cobblestone', null, null, null, null, null, null, null, null, false);

-- Insert stone_images
INSERT INTO stone_images (id, stone_id, image_url, display_order, is_primary) VALUES
('88ce9daf-1df5-49cd-a2e6-b9fea8e2a035', 1, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-1-1763632440621.jpg', 0, false),
('e0724e26-603a-409c-b173-2458d0f68e33', 1, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-1-1763632449910.jpg', 1, false),
('907f4b6d-5f4e-41e5-b319-b1515d734744', 1, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-1-1765542265342.jpg', 2, false),
('3e810e45-b142-407a-8c52-41f78308d191', 4, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-4-1763632505178.jpg', 0, false),
('d88f762e-b38f-4e22-bd2a-987165a4dd14', 4, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-4-1763632513128.jpg', 1, false),
('3b023cdf-7faa-4528-a678-a831234afb39', 7, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-7-1763632818762.jpg', 0, false),
('1c2c0f20-cc1c-43a3-814f-f22096796b9e', 7, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-7-1763632827143.jpg', 1, false),
('64d7fa86-0727-4167-be4e-cd220ee1fa76', 8, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-8-1763632682284.jpg', 0, false),
('076f034b-d8c2-4e98-aa94-a268ab640bec', 8, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-8-1763632691059.jpg', 1, false),
('3bd61a54-09b0-44f2-98ca-70fc95fd7d33', 9, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-9-1763632751188.jpg', 0, false),
('a5edc49c-b961-4662-a9c0-d64415572c2f', 9, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-9-1763632758233.jpg', 1, false),
('8e164bef-d96d-4cc8-a980-296470f0207e', 10, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-10-1765541716476.jpg', 1, false),
('735d6617-38a0-4b57-a54d-9929a387ffa1', 10, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-10-1765541701778.jpg', 1, false),
('878da28a-67db-4437-902e-c1049aa6b067', 15, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-15-1763632870276.jpg', 0, false),
('55014d61-72b1-4942-b9c5-a7a6e267e75d', 16, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-16-1763632727470.jpg', 0, false),
('2f4acb5b-9b5d-4398-a6d2-a54fbf09e545', 17, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-17-1763632646816.jpg', 0, false),
('93427183-a8f0-40e3-a0fc-d1704d4a0626', 18, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-18-1762767799597.jpg', 0, false),
('002f70ae-c86d-4769-aea0-e93a2f07fd88', 18, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-18-1762767800249.jpg', 0, false),
('552986ea-ca27-48d0-bb1b-d75a8956869a', 20, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-20-1763632852970.jpg', 0, false),
('b297e497-0688-4b66-abac-4a9fa1e696b2', 30, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-30-1763632546047.jpg', 0, false),
('17e0e08a-9113-4ca2-a03a-2e7030d24242', 30, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-30-1765541908058.jpg', 1, false),
('06d373f2-4180-4ea7-8836-eac44fb999a1', 31, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-31-1765980628475.jpg', 0, false),
('b7a98777-d931-47a1-897f-fee252bdc70c', 32, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-32-1765981160105.jpg', 1, false),
('be2f03ed-9d9e-4875-9842-398c2c6e665b', 33, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-33-1765980741193.jpg', 0, false),
('67bd3f4c-4d65-4853-93b2-1d15611c960d', 34, 'https://xbzufokfcflpweudtoen.supabase.co/storage/v1/object/public/stone-images/stone-34-1765981018964.jpg', 0, false);

-- Insert stone_combinations
INSERT INTO stone_combinations (id, tile_stone_id, cobblestone_stone_id, combination_name, display_order) VALUES
('a42bdd67-b9f5-46e0-bc5a-65af4d56a998', 1, 17, 'Guber + Fiscal Brown', 1),
('a5472e16-4708-4177-8a7f-b8ce06da71a9', 1, 20, 'Guber + Vulcano Black', 3),
('d3586a9b-45dc-44fb-80ed-9e1b720e8304', 1, 33, 'Guber + Pietra Piasentina', 0),
('5693f322-6117-4a0f-9898-3eb14cd34738', 1, 34, 'Guber + Guber', 2),
('3c2a994d-d5a4-4f57-8414-6ceb737af779', 4, 8, 'Andeer + Katzenkopk', 1),
('8a24f1f8-983e-4759-8515-09e0d2652765', 4, 9, 'Andeer + Luserna', 2),
('d37c42a1-b7a9-43c5-b02b-0f3f4e5cf1ba', 4, 31, 'Andeer + Andeer', 0),
('1ea299ff-c3ee-4f18-800a-002483b1986a', 4, 32, 'Andeer + Valser', 3),
('eb8e61d0-86dd-4c64-8ec5-5947f3965884', 7, 17, 'Valser + Fiscal Brown', 1),
('14f319fa-4de1-4cfd-95a2-98c3ebf58b73', 7, 20, 'Valser + Vulcano Black', 3),
('c97e7d3e-61e2-4332-943a-47463e7f2735', 7, 32, 'Valser + Valser', 4),
('dc7181bd-2207-4bc7-9d12-e27402428079', 7, 33, 'Valser + Pietra Piasentina', 0),
('03df57e8-96cc-4fee-82fe-060aa0b6dcc6', 7, 34, 'Valser + Guber', 2),
('df66ad82-4da1-4b18-a7cd-3112504a88c7', 10, 17, 'Pietra Piasentina + Fiscal Brown', 1),
('f0f9ab2e-d894-4b60-a8e5-ba5d935dc1c5', 10, 20, 'Pietra Piasentina + Vulcano Black', 3),
('79e07b97-a16e-458d-a568-09e88411e39a', 10, 33, 'Pietra Piasentina + Pietra Piasentina', 0),
('b3aa313f-d08b-4c37-a63d-cd4e367687b2', 10, 34, 'Pietra Piasentina + Guber', 2),
('37e65a36-0bc1-4690-866c-4f08aee732c9', 15, 8, 'Wachenzeller + Katzenkopk', 2),
('461242cd-9ccd-4694-93cd-47dd610283b7', 15, 9, 'Wachenzeller + Luserna', 3),
('66bc7f36-30df-46d8-8014-6321c1e38c1a', 15, 17, 'Wachenzeller + Fiscal Brown', 1),
('322119c9-0795-40e1-aa35-d33c531f624e', 15, 20, 'Wachenzeller + Vulcano Black', 4),
('095992a5-d77f-48f9-b85b-5562d13cb74f', 15, 33, 'Wachenzeller + Pietra Piasentina', 0),
('f7a84fde-1f70-425b-bbd3-935a2d862a23', 16, 8, 'Kirchheimer + Katzenkopk', 2),
('7dcee686-d4af-44e9-823f-6ce065ee2aa9', 16, 9, 'Kirchheimer + Luserna', 3),
('c78e1b20-d348-4eff-88fb-6960b4578d7f', 16, 17, 'Kirchheimer + Fiscal Brown', 1),
('78dc0bc1-7c60-448d-8b9b-ff9989239490', 16, 33, 'Kirchheimer + Pietra Piasentina', 0),
('1a030eda-bfe0-4806-820a-9a07af1b7209', 18, 17, 'Alta + Fiscal Brown', 1),
('3c9cbfb4-92bc-447e-a09a-954a00816089', 18, 20, 'Alta + Vulcano Black', 3),
('5c6bdf0a-f0f2-455a-8450-3adb0e6938d9', 18, 33, 'Alta + Pietra Piasentina', 0),
('4d4eba23-a178-4723-8f7a-4cbeb8cb2331', 18, 34, 'Alta + Guber', 2),
('0feba267-73a8-4058-8719-33e8d85f8f05', 30, 8, 'Berlin paving slabs + Katzenkopk', 2),
('db4a4a45-b162-4752-81d8-dca91af310f1', 30, 9, 'Berlin paving slabs + Luserna', 3),
('5c947a08-2a5b-4d46-9e3d-116665a39ea2', 30, 17, 'Berlin paving slabs + Fiscal Brown', 1),
('f14368a5-f006-42b6-8977-0271e24854fe', 30, 20, 'Berlin paving slabs + Vulcano Black', 4),
('9617e1a4-3bf3-442c-8baa-6284a0341389', 30, 33, 'Berlin paving slabs + Pietra Piasentina', 0);

-- Reset sequences
SELECT setval('stones_id_seq', (SELECT MAX(id) FROM stones));
