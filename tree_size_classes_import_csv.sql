-- Auto-generated from tree_size_classes_review.csv
-- Upserts species-specific size class dimensions into tree_size_classes
-- by joining the CSV taxon names to plants_flat.botanical_name (case-insensitive)

WITH csv_data(taxon, form, size_class, label, dbh_cm, height_m, crown_width_m, crown_base_m) AS (VALUES
  ('acer platanoides'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('acer platanoides'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('acer platanoides'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('acer pseudoplatanus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('acer pseudoplatanus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.5::numeric, 3.0::numeric),
  ('acer pseudoplatanus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 15.0::numeric, 4.0::numeric),
  ('acer saccharinum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('acer saccharinum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('acer saccharinum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('acer rubrum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('acer rubrum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('acer rubrum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('acer campestre'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('acer campestre'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('acer campestre'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('acer cappadocicum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('acer cappadocicum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('acer cappadocicum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('acer x freemanii'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('acer x freemanii'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('acer x freemanii'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('acer negundo'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('acer negundo'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 7.7::numeric, 5.0::numeric, 2.5::numeric),
  ('acer negundo'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 14.0::numeric, 10.0::numeric, 3.0::numeric),
  ('acer opalus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('acer opalus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 4.5::numeric, 2.5::numeric),
  ('acer opalus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 9.0::numeric, 3.0::numeric),
  ('acer monspessulanum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.4::numeric, 0.8::numeric),
  ('acer monspessulanum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('acer monspessulanum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer palmatum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.5::numeric, 0.8::numeric),
  ('acer palmatum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('acer palmatum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer japonicum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.5::numeric, 0.8::numeric),
  ('acer japonicum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('acer japonicum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer shirasawanum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('acer shirasawanum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('acer shirasawanum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('acer griseum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.3::numeric, 0.8::numeric),
  ('acer griseum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.0::numeric, 3.0::numeric, 1.5::numeric),
  ('acer griseum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 9.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer buergerianum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('acer buergerianum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.5::numeric, 2.5::numeric),
  ('acer buergerianum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 7.0::numeric, 3.0::numeric),
  ('acer ginnala'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('acer ginnala'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('acer ginnala'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer tataricum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('acer tataricum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('acer tataricum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('acer'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.6::numeric, 2.0::numeric),
  ('acer'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('acer'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('aesculus hippocastanum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 2.0::numeric, 2.0::numeric),
  ('aesculus hippocastanum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 13.8::numeric, 9.0::numeric, 3.0::numeric),
  ('aesculus hippocastanum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 25.0::numeric, 18.0::numeric, 4.0::numeric),
  ('aesculus x carnea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('aesculus x carnea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 6.0::numeric, 3.0::numeric),
  ('aesculus x carnea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 12.0::numeric, 3.0::numeric),
  ('aesculus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('aesculus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('aesculus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('alnus glutinosa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('alnus glutinosa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 12.1::numeric, 5.0::numeric, 3.0::numeric),
  ('alnus glutinosa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 22.0::numeric, 10.0::numeric, 4.0::numeric),
  ('alnus x spaethii'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('alnus x spaethii'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('alnus x spaethii'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('alnus cordata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('alnus cordata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 4.5::numeric, 3.0::numeric),
  ('alnus cordata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 9.0::numeric, 3.0::numeric),
  ('alnus incana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('alnus incana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('alnus incana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('alnus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('alnus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 4.5::numeric, 3.0::numeric),
  ('alnus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 9.0::numeric, 3.0::numeric),
  ('betula pendula'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('betula pendula'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 5.0::numeric, 3.0::numeric),
  ('betula pendula'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 10.0::numeric, 4.0::numeric),
  ('betula utilis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('betula utilis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 4.5::numeric, 3.0::numeric),
  ('betula utilis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 9.0::numeric, 3.0::numeric),
  ('betula nigra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('betula nigra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('betula nigra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('betula papyrifera'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('betula papyrifera'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('betula papyrifera'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('betula'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('betula'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('betula'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('carpinus betulus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('carpinus betulus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('carpinus betulus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('carpinus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('carpinus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 8.8::numeric, 5.5::numeric, 3.0::numeric),
  ('carpinus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 16.0::numeric, 11.0::numeric, 3.0::numeric),
  ('castanea sativa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('castanea sativa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 12.1::numeric, 7.5::numeric, 3.0::numeric),
  ('castanea sativa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 22.0::numeric, 15.0::numeric, 4.0::numeric),
  ('castanea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('castanea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 12.1::numeric, 7.5::numeric, 3.0::numeric),
  ('castanea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 22.0::numeric, 15.0::numeric, 4.0::numeric),
  ('catalpa bignonioides'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.8::numeric, 2.0::numeric),
  ('catalpa bignonioides'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('catalpa bignonioides'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('catalpa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.8::numeric, 2.0::numeric),
  ('catalpa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('catalpa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('celtis australis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('celtis australis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('celtis australis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('celtis occidentalis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('celtis occidentalis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('celtis occidentalis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('celtis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('celtis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('celtis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('cercidiphyllum japonicum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('cercidiphyllum japonicum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('cercidiphyllum japonicum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('cercidiphyllum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('cercidiphyllum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('cercidiphyllum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('corylus colurna'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('corylus colurna'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('corylus colurna'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('corylus avellana'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('corylus avellana'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('corylus avellana'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('corylus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.3::numeric, 0.8::numeric),
  ('corylus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('corylus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('fagus sylvatica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('fagus sylvatica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 9.0::numeric, 3.0::numeric),
  ('fagus sylvatica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 18.0::numeric, 4.0::numeric),
  ('fagus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('fagus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 9.0::numeric, 3.0::numeric),
  ('fagus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 18.0::numeric, 4.0::numeric),
  ('fraxinus excelsior'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus excelsior'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 15.4::numeric, 8.0::numeric, 3.0::numeric),
  ('fraxinus excelsior'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 28.0::numeric, 16.0::numeric, 4.0::numeric),
  ('fraxinus ornus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus ornus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.5::numeric, 2.5::numeric),
  ('fraxinus ornus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 9.0::numeric, 3.0::numeric),
  ('fraxinus angustifolia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus angustifolia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 6.0::numeric, 3.0::numeric),
  ('fraxinus angustifolia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 12.0::numeric, 4.0::numeric),
  ('fraxinus pennsylvanica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus pennsylvanica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('fraxinus pennsylvanica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('fraxinus americana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus americana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 29.3::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('fraxinus americana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 65.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('fraxinus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('fraxinus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 6.0::numeric, 3.0::numeric),
  ('fraxinus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 12.0::numeric, 4.0::numeric),
  ('ginkgo biloba'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.2::numeric, 2.0::numeric),
  ('ginkgo biloba'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 12.1::numeric, 5.0::numeric, 3.0::numeric),
  ('ginkgo biloba'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 22.0::numeric, 10.0::numeric, 4.0::numeric),
  ('ginkgo'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.2::numeric, 2.0::numeric),
  ('ginkgo'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 12.1::numeric, 5.0::numeric, 3.0::numeric),
  ('ginkgo'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 22.0::numeric, 10.0::numeric, 4.0::numeric),
  ('gleditsia triacanthos'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('gleditsia triacanthos'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('gleditsia triacanthos'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('gleditsia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('gleditsia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('gleditsia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('gymnocladus dioicus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('gymnocladus dioicus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('gymnocladus dioicus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('gymnocladus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('gymnocladus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('gymnocladus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('juglans regia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('juglans regia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 11.0::numeric, 8.0::numeric, 3.0::numeric),
  ('juglans regia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 20.0::numeric, 16.0::numeric, 4.0::numeric),
  ('juglans nigra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('juglans nigra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 8.0::numeric, 3.0::numeric),
  ('juglans nigra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 16.0::numeric, 4.0::numeric),
  ('juglans'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('juglans'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 33.8::numeric, 11.0::numeric, 7.5::numeric, 3.0::numeric),
  ('juglans'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 75.0::numeric, 20.0::numeric, 15.0::numeric, 4.0::numeric),
  ('liquidambar styraciflua'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.4::numeric, 2.0::numeric),
  ('liquidambar styraciflua'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 11.0::numeric, 5.0::numeric, 3.0::numeric),
  ('liquidambar styraciflua'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 20.0::numeric, 10.0::numeric, 4.0::numeric),
  ('liquidambar'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.4::numeric, 2.0::numeric),
  ('liquidambar'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 11.0::numeric, 5.0::numeric, 3.0::numeric),
  ('liquidambar'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 20.0::numeric, 10.0::numeric, 4.0::numeric),
  ('liriodendron tulipifera'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('liriodendron tulipifera'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 15.4::numeric, 7.0::numeric, 3.0::numeric),
  ('liriodendron tulipifera'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 28.0::numeric, 14.0::numeric, 4.0::numeric),
  ('liriodendron'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('liriodendron'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 15.4::numeric, 7.0::numeric, 3.0::numeric),
  ('liriodendron'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 28.0::numeric, 14.0::numeric, 4.0::numeric),
  ('metasequoia glyptostroboides'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 5.0::numeric, 1.4::numeric, 0.3::numeric),
  ('metasequoia glyptostroboides'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 16.5::numeric, 4.0::numeric, 1.0::numeric),
  ('metasequoia glyptostroboides'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 30.0::numeric, 8.0::numeric, 2.0::numeric),
  ('metasequoia'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 5.0::numeric, 1.4::numeric, 0.3::numeric),
  ('metasequoia'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 16.5::numeric, 4.0::numeric, 1.0::numeric),
  ('metasequoia'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 30.0::numeric, 8.0::numeric, 2.0::numeric),
  ('morus alba'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.8::numeric, 2.0::numeric),
  ('morus alba'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('morus alba'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('morus nigra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.8::numeric, 2.0::numeric),
  ('morus nigra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 5.5::numeric, 4.5::numeric, 2.5::numeric),
  ('morus nigra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 10.0::numeric, 9.0::numeric, 3.0::numeric),
  ('morus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.8::numeric, 2.0::numeric),
  ('morus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('morus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('nothofagus antarctica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('nothofagus antarctica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('nothofagus antarctica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('nothofagus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('nothofagus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('nothofagus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('nyssa sylvatica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('nyssa sylvatica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('nyssa sylvatica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('nyssa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('nyssa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('nyssa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('ostrya carpinifolia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('ostrya carpinifolia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('ostrya carpinifolia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('ostrya'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('ostrya'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('ostrya'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('parrotia persica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('parrotia persica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.0::numeric, 4.0::numeric, 1.5::numeric),
  ('parrotia persica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 9.0::numeric, 8.0::numeric, 2.0::numeric),
  ('parrotia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('parrotia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.0::numeric, 4.0::numeric, 1.5::numeric),
  ('parrotia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 9.0::numeric, 8.0::numeric, 2.0::numeric),
  ('paulownia tomentosa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('paulownia tomentosa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 6.0::numeric, 3.0::numeric),
  ('paulownia tomentosa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 12.0::numeric, 3.0::numeric),
  ('paulownia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('paulownia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 6.0::numeric, 3.0::numeric),
  ('paulownia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 12.0::numeric, 3.0::numeric),
  ('platanus x hispanica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('platanus x hispanica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 49.5::numeric, 16.5::numeric, 11.0::numeric, 3.0::numeric),
  ('platanus x hispanica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 110.0::numeric, 30.0::numeric, 22.0::numeric, 4.0::numeric),
  ('platanus x acerifolia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('platanus x acerifolia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 49.5::numeric, 16.5::numeric, 11.0::numeric, 3.0::numeric),
  ('platanus x acerifolia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 110.0::numeric, 30.0::numeric, 22.0::numeric, 4.0::numeric),
  ('platanus orientalis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('platanus orientalis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 49.5::numeric, 15.4::numeric, 11.0::numeric, 3.0::numeric),
  ('platanus orientalis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 110.0::numeric, 28.0::numeric, 22.0::numeric, 4.0::numeric),
  ('platanus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('platanus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 49.5::numeric, 16.5::numeric, 11.0::numeric, 3.0::numeric),
  ('platanus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 110.0::numeric, 30.0::numeric, 22.0::numeric, 4.0::numeric),
  ('populus nigra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.5::numeric, 1.5::numeric, 2.0::numeric),
  ('populus nigra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 6.0::numeric, 3.0::numeric),
  ('populus nigra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 12.0::numeric, 4.0::numeric),
  ('populus alba'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.5::numeric, 1.6::numeric, 2.0::numeric),
  ('populus alba'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 13.8::numeric, 7.5::numeric, 3.0::numeric),
  ('populus alba'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 25.0::numeric, 15.0::numeric, 4.0::numeric),
  ('populus tremula'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.5::numeric, 2.0::numeric),
  ('populus tremula'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 5.0::numeric, 3.0::numeric),
  ('populus tremula'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 10.0::numeric, 4.0::numeric),
  ('populus x canescens'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.5::numeric, 1.6::numeric, 2.0::numeric),
  ('populus x canescens'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 13.8::numeric, 7.0::numeric, 3.0::numeric),
  ('populus x canescens'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 85.0::numeric, 25.0::numeric, 14.0::numeric, 4.0::numeric),
  ('populus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.5::numeric, 1.5::numeric, 2.0::numeric),
  ('populus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 13.8::numeric, 6.0::numeric, 3.0::numeric),
  ('populus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 85.0::numeric, 25.0::numeric, 12.0::numeric, 4.0::numeric),
  ('quercus robur'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus robur'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 45.0::numeric, 15.4::numeric, 10.0::numeric, 3.0::numeric),
  ('quercus robur'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 100.0::numeric, 28.0::numeric, 20.0::numeric, 4.0::numeric),
  ('quercus petraea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus petraea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 42.8::numeric, 15.4::numeric, 9.0::numeric, 3.0::numeric),
  ('quercus petraea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 95.0::numeric, 28.0::numeric, 18.0::numeric, 4.0::numeric),
  ('quercus cerris'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus cerris'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 13.8::numeric, 8.0::numeric, 3.0::numeric),
  ('quercus cerris'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 85.0::numeric, 25.0::numeric, 16.0::numeric, 4.0::numeric),
  ('quercus frainetto'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus frainetto'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 33.8::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('quercus frainetto'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 75.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('quercus pubescens'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus pubescens'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 6.0::numeric, 3.0::numeric),
  ('quercus pubescens'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 12.0::numeric, 3.0::numeric),
  ('quercus rubra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus rubra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 13.8::numeric, 9.0::numeric, 3.0::numeric),
  ('quercus rubra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 25.0::numeric, 18.0::numeric, 4.0::numeric),
  ('quercus palustris'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus palustris'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('quercus palustris'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('quercus coccinea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus coccinea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('quercus coccinea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('quercus phellos'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus phellos'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('quercus phellos'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('quercus ilex'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus ilex'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 6.0::numeric, 3.0::numeric),
  ('quercus ilex'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 12.0::numeric, 3.0::numeric),
  ('quercus suber'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus suber'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 6.6::numeric, 6.0::numeric, 2.5::numeric),
  ('quercus suber'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 12.0::numeric, 12.0::numeric, 3.0::numeric),
  ('quercus x hispanica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('quercus x hispanica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 7.0::numeric, 3.0::numeric),
  ('quercus x hispanica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 14.0::numeric, 4.0::numeric),
  ('quercus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('quercus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 12.1::numeric, 7.5::numeric, 3.0::numeric),
  ('quercus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 22.0::numeric, 15.0::numeric, 4.0::numeric),
  ('robinia pseudoacacia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('robinia pseudoacacia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 6.0::numeric, 3.0::numeric),
  ('robinia pseudoacacia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 12.0::numeric, 4.0::numeric),
  ('robinia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('robinia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 9.9::numeric, 5.5::numeric, 3.0::numeric),
  ('robinia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 18.0::numeric, 11.0::numeric, 3.0::numeric),
  ('salix alba'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.5::numeric, 1.6::numeric, 2.0::numeric),
  ('salix alba'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 12.1::numeric, 7.5::numeric, 3.0::numeric),
  ('salix alba'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 22.0::numeric, 15.0::numeric, 4.0::numeric),
  ('salix x sepulcralis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('salix x sepulcralis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 9.9::numeric, 7.5::numeric, 3.0::numeric),
  ('salix x sepulcralis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 18.0::numeric, 15.0::numeric, 3.0::numeric),
  ('salix caprea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('salix caprea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('salix caprea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('salix'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('salix'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('salix'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('sophora japonica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('sophora japonica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 7.5::numeric, 3.0::numeric),
  ('sophora japonica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 15.0::numeric, 4.0::numeric),
  ('styphnolobium japonicum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('styphnolobium japonicum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 7.5::numeric, 3.0::numeric),
  ('styphnolobium japonicum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 15.0::numeric, 4.0::numeric),
  ('styphnolobium'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('styphnolobium'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 7.5::numeric, 3.0::numeric),
  ('styphnolobium'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 15.0::numeric, 4.0::numeric),
  ('tilia cordata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia cordata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.0::numeric, 3.0::numeric),
  ('tilia cordata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 14.0::numeric, 4.0::numeric),
  ('tilia platyphyllos'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia platyphyllos'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 45.0::numeric, 16.5::numeric, 9.0::numeric, 3.0::numeric),
  ('tilia platyphyllos'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 100.0::numeric, 30.0::numeric, 18.0::numeric, 4.0::numeric),
  ('tilia tomentosa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia tomentosa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.5::numeric, 3.0::numeric),
  ('tilia tomentosa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 15.0::numeric, 4.0::numeric),
  ('tilia x europaea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia x europaea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 8.0::numeric, 3.0::numeric),
  ('tilia x europaea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 16.0::numeric, 4.0::numeric),
  ('tilia americana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia americana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.0::numeric, 3.0::numeric),
  ('tilia americana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 14.0::numeric, 4.0::numeric),
  ('tilia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tilia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.5::numeric, 3.0::numeric),
  ('tilia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 15.0::numeric, 4.0::numeric),
  ('ulmus glabra'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ulmus glabra'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 9.0::numeric, 3.0::numeric),
  ('ulmus glabra'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 18.0::numeric, 4.0::numeric),
  ('ulmus minor'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ulmus minor'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 13.8::numeric, 7.0::numeric, 3.0::numeric),
  ('ulmus minor'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 25.0::numeric, 14.0::numeric, 4.0::numeric),
  ('ulmus laevis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ulmus laevis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 15.4::numeric, 9.0::numeric, 3.0::numeric),
  ('ulmus laevis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 28.0::numeric, 18.0::numeric, 4.0::numeric),
  ('ulmus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ulmus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 33.8::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('ulmus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 75.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('zelkova serrata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('zelkova serrata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 8.0::numeric, 3.0::numeric),
  ('zelkova serrata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 16.0::numeric, 4.0::numeric),
  ('zelkova carpinifolia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('zelkova carpinifolia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 12.1::numeric, 7.0::numeric, 3.0::numeric),
  ('zelkova carpinifolia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 22.0::numeric, 14.0::numeric, 4.0::numeric),
  ('zelkova'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.8::numeric, 2.0::numeric),
  ('zelkova'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 11.0::numeric, 7.5::numeric, 3.0::numeric),
  ('zelkova'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 20.0::numeric, 15.0::numeric, 4.0::numeric),
  ('ailanthus altissima'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ailanthus altissima'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 6.0::numeric, 3.0::numeric),
  ('ailanthus altissima'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 12.0::numeric, 4.0::numeric),
  ('ailanthus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.6::numeric, 2.0::numeric),
  ('ailanthus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 6.0::numeric, 3.0::numeric),
  ('ailanthus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 12.0::numeric, 4.0::numeric),
  ('carya'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('carya'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 7.0::numeric, 3.0::numeric),
  ('carya'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 14.0::numeric, 4.0::numeric),
  ('davidia involucrata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('davidia involucrata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('davidia involucrata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('davidia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('davidia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('davidia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('eucalyptus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.4::numeric, 2.0::numeric),
  ('eucalyptus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 5.0::numeric, 3.0::numeric),
  ('eucalyptus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 10.0::numeric, 4.0::numeric),
  ('koelreuteria paniculata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('koelreuteria paniculata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.5::numeric, 2.5::numeric),
  ('koelreuteria paniculata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 9.0::numeric, 3.0::numeric),
  ('koelreuteria'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('koelreuteria'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.5::numeric, 2.5::numeric),
  ('koelreuteria'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 9.0::numeric, 3.0::numeric),
  ('albizia julibrissin'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.6::numeric, 0.8::numeric),
  ('albizia julibrissin'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 4.4::numeric, 4.0::numeric, 1.5::numeric),
  ('albizia julibrissin'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 8.0::numeric, 8.0::numeric, 2.0::numeric),
  ('albizia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.6::numeric, 0.8::numeric),
  ('albizia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 4.4::numeric, 4.0::numeric, 1.5::numeric),
  ('albizia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 8.0::numeric, 8.0::numeric, 2.0::numeric),
  ('phellodendron amurense'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('phellodendron amurense'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 7.7::numeric, 6.0::numeric, 2.5::numeric),
  ('phellodendron amurense'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 14.0::numeric, 12.0::numeric, 3.0::numeric),
  ('phellodendron'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('phellodendron'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 24.8::numeric, 7.7::numeric, 6.0::numeric, 2.5::numeric),
  ('phellodendron'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 55.0::numeric, 14.0::numeric, 12.0::numeric, 3.0::numeric),
  ('tetradium daniellii'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tetradium daniellii'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('tetradium daniellii'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('tetradium'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('tetradium'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('tetradium'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('pterocarya fraxinifolia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('pterocarya fraxinifolia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 45.0::numeric, 13.8::numeric, 10.0::numeric, 3.0::numeric),
  ('pterocarya fraxinifolia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 100.0::numeric, 25.0::numeric, 20.0::numeric, 4.0::numeric),
  ('pterocarya'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 5.0::numeric, 1.8::numeric, 2.0::numeric),
  ('pterocarya'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 45.0::numeric, 13.8::numeric, 10.0::numeric, 3.0::numeric),
  ('pterocarya'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 100.0::numeric, 25.0::numeric, 20.0::numeric, 4.0::numeric),
  ('sorbus aria'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('sorbus aria'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.5::numeric, 2.5::numeric),
  ('sorbus aria'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 7.0::numeric, 3.0::numeric),
  ('sorbus aucuparia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.3::numeric, 2.0::numeric),
  ('sorbus aucuparia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 3.0::numeric, 2.5::numeric),
  ('sorbus aucuparia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 6.0::numeric, 3.0::numeric),
  ('sorbus intermedia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('sorbus intermedia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('sorbus intermedia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('sorbus torminalis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('sorbus torminalis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('sorbus torminalis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('sorbus domestica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('sorbus domestica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('sorbus domestica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('sorbus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('sorbus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.5::numeric, 2.5::numeric),
  ('sorbus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 7.0::numeric, 3.0::numeric),
  ('amelanchier lamarckii'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('amelanchier lamarckii'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('amelanchier lamarckii'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('amelanchier arborea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.2::numeric, 0.8::numeric),
  ('amelanchier arborea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('amelanchier arborea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('amelanchier'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('amelanchier'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('amelanchier'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cercis siliquastrum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('cercis siliquastrum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('cercis siliquastrum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('cercis canadensis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('cercis canadensis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.5::numeric, 1.5::numeric),
  ('cercis canadensis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 7.0::numeric, 2.0::numeric),
  ('cercis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('cercis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('cercis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('cornus mas'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cornus mas'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('cornus mas'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cornus kousa'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cornus kousa'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.9::numeric, 2.5::numeric, 1.5::numeric),
  ('cornus kousa'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 7.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cornus florida'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cornus florida'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('cornus florida'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cornus controversa'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('cornus controversa'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 5.0::numeric, 1.5::numeric),
  ('cornus controversa'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 10.0::numeric, 2.0::numeric),
  ('cornus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cornus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('cornus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('crataegus laevigata'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('crataegus laevigata'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('crataegus laevigata'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('crataegus monogyna'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.3::numeric, 0.8::numeric),
  ('crataegus monogyna'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('crataegus monogyna'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('crataegus x lavallei'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.4::numeric, 0.8::numeric),
  ('crataegus x lavallei'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('crataegus x lavallei'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('crataegus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('crataegus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 2.5::numeric, 1.5::numeric),
  ('crataegus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cydonia oblonga'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cydonia oblonga'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('cydonia oblonga'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('cydonia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('cydonia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('cydonia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('diospyros kaki'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('diospyros kaki'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('diospyros kaki'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('diospyros'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('diospyros'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('diospyros'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('elaeagnus angustifolia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('elaeagnus angustifolia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('elaeagnus angustifolia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('elaeagnus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('elaeagnus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('elaeagnus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('ficus carica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('ficus carica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('ficus carica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('ficus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('ficus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('ficus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('halesia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('halesia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('halesia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('hamamelis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('hamamelis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 2.0::numeric, 1.5::numeric),
  ('hamamelis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('heptacodium miconioides'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('heptacodium miconioides'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('heptacodium miconioides'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('heptacodium'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('heptacodium'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('heptacodium'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('hippophae rhamnoides'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('hippophae rhamnoides'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 2.0::numeric, 1.5::numeric),
  ('hippophae rhamnoides'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('hippophae'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('hippophae'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 2.0::numeric, 1.5::numeric),
  ('hippophae'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('lagerstroemia indica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('lagerstroemia indica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('lagerstroemia indica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('lagerstroemia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('lagerstroemia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('lagerstroemia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('laburnum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('laburnum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('laburnum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('magnolia kobus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.4::numeric, 0.8::numeric),
  ('magnolia kobus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 4.0::numeric, 1.5::numeric),
  ('magnolia kobus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 8.0::numeric, 2.0::numeric),
  ('magnolia x soulangeana'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('magnolia x soulangeana'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('magnolia x soulangeana'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('magnolia stellata'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('magnolia stellata'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.0::numeric, 1.5::numeric, 1.5::numeric),
  ('magnolia stellata'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 3.0::numeric, 3.0::numeric, 2.0::numeric),
  ('magnolia liliiflora'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('magnolia liliiflora'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.0::numeric, 1.5::numeric, 1.5::numeric),
  ('magnolia liliiflora'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 3.0::numeric, 3.0::numeric, 2.0::numeric),
  ('magnolia grandiflora'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 2.0::numeric),
  ('magnolia grandiflora'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('magnolia grandiflora'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('magnolia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('magnolia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('magnolia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('malus domestica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('malus domestica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('malus domestica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('malus sylvestris'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('malus sylvestris'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('malus sylvestris'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('malus toringo'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('malus toringo'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.5::numeric, 2.0::numeric, 1.5::numeric),
  ('malus toringo'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('malus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('malus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('malus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('melia azedarach'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('melia azedarach'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('melia azedarach'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('melia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('melia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('melia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('mespilus germanica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.3::numeric, 0.8::numeric),
  ('mespilus germanica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('mespilus germanica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('mespilus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.3::numeric, 0.8::numeric),
  ('mespilus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('mespilus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('prunus avium'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 1.5::numeric, 2.0::numeric),
  ('prunus avium'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 9.9::numeric, 5.0::numeric, 3.0::numeric),
  ('prunus avium'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 18.0::numeric, 10.0::numeric, 3.0::numeric),
  ('prunus padus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.5::numeric, 2.0::numeric),
  ('prunus padus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('prunus padus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('prunus serrulata'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('prunus serrulata'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 4.4::numeric, 3.5::numeric, 1.5::numeric),
  ('prunus serrulata'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 8.0::numeric, 7.0::numeric, 2.0::numeric),
  ('prunus x subhirtella'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('prunus x subhirtella'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 3.0::numeric, 1.5::numeric),
  ('prunus x subhirtella'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 6.0::numeric, 2.0::numeric),
  ('prunus x yedoensis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.5::numeric, 0.8::numeric),
  ('prunus x yedoensis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 4.4::numeric, 4.0::numeric, 1.5::numeric),
  ('prunus x yedoensis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 8.0::numeric, 8.0::numeric, 2.0::numeric),
  ('prunus sargentii'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.5::numeric, 1.5::numeric, 0.8::numeric),
  ('prunus sargentii'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 1.5::numeric),
  ('prunus sargentii'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 2.0::numeric),
  ('prunus cerasifera'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('prunus cerasifera'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('prunus cerasifera'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('prunus domestica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('prunus domestica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('prunus domestica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('prunus persica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('prunus persica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('prunus persica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('prunus dulcis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('prunus dulcis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('prunus dulcis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('prunus armeniaca'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('prunus armeniaca'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('prunus armeniaca'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('prunus mahaleb'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.4::numeric, 0.8::numeric),
  ('prunus mahaleb'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('prunus mahaleb'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('prunus spinosa'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('prunus spinosa'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('prunus spinosa'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('prunus laurocerasus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('prunus laurocerasus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('prunus laurocerasus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('prunus lusitanica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('prunus lusitanica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('prunus lusitanica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('prunus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.4::numeric, 0.8::numeric),
  ('prunus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('prunus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('punica granatum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('punica granatum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('punica granatum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('punica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('punica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('punica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('pyrus communis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.3::numeric, 2.0::numeric),
  ('pyrus communis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 3.5::numeric, 2.5::numeric),
  ('pyrus communis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 7.0::numeric, 3.0::numeric),
  ('pyrus calleryana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.2::numeric, 2.0::numeric),
  ('pyrus calleryana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.0::numeric, 2.5::numeric),
  ('pyrus calleryana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 6.0::numeric, 3.0::numeric),
  ('pyrus salicifolia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('pyrus salicifolia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('pyrus salicifolia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('pyrus pyraster'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('pyrus pyraster'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('pyrus pyraster'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('pyrus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.3::numeric, 2.0::numeric),
  ('pyrus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.0::numeric, 2.5::numeric),
  ('pyrus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 6.0::numeric, 3.0::numeric),
  ('rhus typhina'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.3::numeric, 0.8::numeric),
  ('rhus typhina'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('rhus typhina'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('rhus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.3::numeric, 0.8::numeric),
  ('rhus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('rhus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('sambucus nigra'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('sambucus nigra'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('sambucus nigra'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('sambucus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('sambucus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('sambucus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('staphylea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('staphylea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('staphylea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('syringa vulgaris'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('syringa vulgaris'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('syringa vulgaris'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('syringa reticulata'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('syringa reticulata'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('syringa reticulata'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('syringa'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('syringa'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('syringa'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('tamarix'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('tamarix'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('tamarix'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('vitex agnus-castus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('vitex agnus-castus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('vitex agnus-castus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('vitex'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('vitex'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('vitex'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('zanthoxylum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('zanthoxylum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('zanthoxylum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('arbutus unedo'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('arbutus unedo'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('arbutus unedo'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('arbutus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('arbutus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('arbutus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('arctostaphylos'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.0::numeric, 0.8::numeric, 0.8::numeric),
  ('arctostaphylos'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 1.7::numeric, 1.5::numeric, 1.5::numeric),
  ('arctostaphylos'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 3.0::numeric, 3.0::numeric, 2.0::numeric),
  ('eriobotrya japonica'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('eriobotrya japonica'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('eriobotrya japonica'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('eriobotrya'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('eriobotrya'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('eriobotrya'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('laurus nobilis'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 0.9::numeric, 0.8::numeric),
  ('laurus nobilis'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('laurus nobilis'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('laurus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 0.9::numeric, 0.8::numeric),
  ('laurus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('laurus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('ligustrum lucidum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('ligustrum lucidum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('ligustrum lucidum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('ligustrum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('ligustrum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('ligustrum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('olea europaea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('olea europaea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 4.4::numeric, 3.5::numeric, 1.5::numeric),
  ('olea europaea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 8.0::numeric, 7.0::numeric, 2.0::numeric),
  ('olea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.4::numeric, 0.8::numeric),
  ('olea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 4.4::numeric, 3.5::numeric, 1.5::numeric),
  ('olea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 8.0::numeric, 7.0::numeric, 2.0::numeric),
  ('photinia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('photinia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('photinia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('ilex aquifolium'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 0.9::numeric, 0.8::numeric),
  ('ilex aquifolium'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('ilex aquifolium'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('ilex'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 0.9::numeric, 0.8::numeric),
  ('ilex'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 2.5::numeric, 1.5::numeric),
  ('ilex'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 5.0::numeric, 2.0::numeric),
  ('citrus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('citrus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('citrus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('ceratonia siliqua'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 2.5::numeric, 1.4::numeric, 2.0::numeric),
  ('ceratonia siliqua'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.5::numeric, 2.5::numeric),
  ('ceratonia siliqua'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 9.0::numeric, 3.0::numeric),
  ('ceratonia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 2.5::numeric, 1.4::numeric, 2.0::numeric),
  ('ceratonia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.5::numeric, 2.5::numeric),
  ('ceratonia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 9.0::numeric, 3.0::numeric),
  ('cinnamomum camphora'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('cinnamomum camphora'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('cinnamomum camphora'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('cinnamomum'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('cinnamomum'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 3.0::numeric),
  ('cinnamomum'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 3.0::numeric),
  ('jacaranda'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('jacaranda'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('jacaranda'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('tipuana tipu'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('tipuana tipu'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.5::numeric, 3.0::numeric),
  ('tipuana tipu'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 15.0::numeric, 3.0::numeric),
  ('tipuana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.8::numeric, 2.0::numeric),
  ('tipuana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.5::numeric, 3.0::numeric),
  ('tipuana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 15.0::numeric, 3.0::numeric),
  ('chorisia speciosa'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('chorisia speciosa'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('chorisia speciosa'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('chorisia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('chorisia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('chorisia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('abies alba'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 0.3::numeric),
  ('abies alba'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 19.3::numeric, 5.0::numeric, 1.0::numeric),
  ('abies alba'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 35.0::numeric, 10.0::numeric, 2.0::numeric),
  ('abies nordmanniana'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 0.3::numeric),
  ('abies nordmanniana'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 16.5::numeric, 5.0::numeric, 1.0::numeric),
  ('abies nordmanniana'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 30.0::numeric, 10.0::numeric, 2.0::numeric),
  ('abies koreana'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.2::numeric, 0.3::numeric),
  ('abies koreana'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 2.5::numeric, 1.0::numeric),
  ('abies koreana'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 5.0::numeric, 1.0::numeric),
  ('abies'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.4::numeric, 0.3::numeric),
  ('abies'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 13.8::numeric, 4.5::numeric, 1.0::numeric),
  ('abies'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 25.0::numeric, 9.0::numeric, 2.0::numeric),
  ('cedrus atlantica'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('cedrus atlantica'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 16.5::numeric, 7.5::numeric, 1.0::numeric),
  ('cedrus atlantica'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 30.0::numeric, 15.0::numeric, 2.0::numeric),
  ('cedrus deodara'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('cedrus deodara'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 36.0::numeric, 16.5::numeric, 6.0::numeric, 1.0::numeric),
  ('cedrus deodara'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 80.0::numeric, 30.0::numeric, 12.0::numeric, 2.0::numeric),
  ('cedrus libani'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('cedrus libani'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 45.0::numeric, 15.4::numeric, 9.0::numeric, 1.0::numeric),
  ('cedrus libani'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 100.0::numeric, 28.0::numeric, 18.0::numeric, 2.0::numeric),
  ('cedrus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('cedrus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 16.5::numeric, 7.5::numeric, 1.0::numeric),
  ('cedrus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 30.0::numeric, 15.0::numeric, 2.0::numeric),
  ('chamaecyparis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.0::numeric, 0.3::numeric),
  ('chamaecyparis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 2.5::numeric, 1.0::numeric),
  ('chamaecyparis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 5.0::numeric, 1.0::numeric),
  ('cupressus sempervirens'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 0.7::numeric, 0.3::numeric),
  ('cupressus sempervirens'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 11.0::numeric, 1.5::numeric, 1.0::numeric),
  ('cupressus sempervirens'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 20.0::numeric, 3.0::numeric, 2.0::numeric),
  ('cupressus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('cupressus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 3.0::numeric, 1.0::numeric),
  ('cupressus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 6.0::numeric, 2.0::numeric),
  ('juniperus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 0.8::numeric, 0.3::numeric),
  ('juniperus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 5.5::numeric, 2.0::numeric, 1.0::numeric),
  ('juniperus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 10.0::numeric, 4.0::numeric, 1.0::numeric),
  ('larix decidua'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 0.3::numeric),
  ('larix decidua'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 16.5::numeric, 4.0::numeric, 1.0::numeric),
  ('larix decidua'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 30.0::numeric, 8.0::numeric, 2.0::numeric),
  ('larix kaempferi'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 0.3::numeric),
  ('larix kaempferi'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 29.3::numeric, 15.4::numeric, 4.0::numeric, 1.0::numeric),
  ('larix kaempferi'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 65.0::numeric, 28.0::numeric, 8.0::numeric, 2.0::numeric),
  ('larix'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 0.3::numeric),
  ('larix'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 16.5::numeric, 4.0::numeric, 1.0::numeric),
  ('larix'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 30.0::numeric, 8.0::numeric, 2.0::numeric),
  ('picea abies'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('picea abies'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 19.3::numeric, 4.0::numeric, 1.0::numeric),
  ('picea abies'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 35.0::numeric, 8.0::numeric, 2.0::numeric),
  ('picea omorika'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('picea omorika'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 13.8::numeric, 2.0::numeric, 1.0::numeric),
  ('picea omorika'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 25.0::numeric, 4.0::numeric, 2.0::numeric),
  ('picea pungens'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.2::numeric, 0.3::numeric),
  ('picea pungens'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 3.0::numeric, 1.0::numeric),
  ('picea pungens'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 6.0::numeric, 2.0::numeric),
  ('picea orientalis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.3::numeric, 0.3::numeric),
  ('picea orientalis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 16.5::numeric, 3.5::numeric, 1.0::numeric),
  ('picea orientalis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 30.0::numeric, 7.0::numeric, 2.0::numeric),
  ('picea'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.3::numeric, 0.3::numeric),
  ('picea'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 15.4::numeric, 3.5::numeric, 1.0::numeric),
  ('picea'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 28.0::numeric, 7.0::numeric, 2.0::numeric),
  ('pinus sylvestris'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('pinus sylvestris'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 13.8::numeric, 5.0::numeric, 1.0::numeric),
  ('pinus sylvestris'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 25.0::numeric, 10.0::numeric, 2.0::numeric),
  ('pinus nigra'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 0.3::numeric),
  ('pinus nigra'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 6.0::numeric, 1.0::numeric),
  ('pinus nigra'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 12.0::numeric, 2.0::numeric),
  ('pinus strobus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('pinus strobus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 16.5::numeric, 5.0::numeric, 1.0::numeric),
  ('pinus strobus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 30.0::numeric, 10.0::numeric, 2.0::numeric),
  ('pinus cembra'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.0::numeric, 0.3::numeric),
  ('pinus cembra'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 3.0::numeric, 1.0::numeric),
  ('pinus cembra'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 6.0::numeric, 2.0::numeric),
  ('pinus mugo'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.0::numeric, 0.8::numeric, 0.8::numeric),
  ('pinus mugo'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 2.2::numeric, 2.0::numeric, 1.5::numeric),
  ('pinus mugo'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('pinus pinea'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.4::numeric, 0.3::numeric),
  ('pinus pinea'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 9.9::numeric, 7.0::numeric, 1.0::numeric),
  ('pinus pinea'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 18.0::numeric, 14.0::numeric, 1.0::numeric),
  ('pinus wallichiana'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('pinus wallichiana'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 13.8::numeric, 5.0::numeric, 1.0::numeric),
  ('pinus wallichiana'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 25.0::numeric, 10.0::numeric, 2.0::numeric),
  ('pinus heldreichii'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.2::numeric, 0.3::numeric),
  ('pinus heldreichii'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 9.9::numeric, 3.5::numeric, 1.0::numeric),
  ('pinus heldreichii'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 18.0::numeric, 7.0::numeric, 1.0::numeric),
  ('pinus thunbergii'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.2::numeric, 0.3::numeric),
  ('pinus thunbergii'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 4.0::numeric, 1.0::numeric),
  ('pinus thunbergii'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 8.0::numeric, 1.0::numeric),
  ('pinus parviflora'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.2::numeric, 0.3::numeric),
  ('pinus parviflora'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 3.5::numeric, 1.0::numeric),
  ('pinus parviflora'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 7.0::numeric, 1.0::numeric),
  ('pinus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('pinus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 12.1::numeric, 5.0::numeric, 1.0::numeric),
  ('pinus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 22.0::numeric, 10.0::numeric, 2.0::numeric),
  ('pseudotsuga menziesii'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 0.3::numeric),
  ('pseudotsuga menziesii'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 22.0::numeric, 5.0::numeric, 1.0::numeric),
  ('pseudotsuga menziesii'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 40.0::numeric, 10.0::numeric, 2.0::numeric),
  ('pseudotsuga'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 0.3::numeric),
  ('pseudotsuga'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 22.0::numeric, 5.0::numeric, 1.0::numeric),
  ('pseudotsuga'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 40.0::numeric, 10.0::numeric, 2.0::numeric),
  ('sequoiadendron giganteum'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('sequoiadendron giganteum'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 67.5::numeric, 22.0::numeric, 6.0::numeric, 1.0::numeric),
  ('sequoiadendron giganteum'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 150.0::numeric, 40.0::numeric, 12.0::numeric, 2.0::numeric),
  ('sequoiadendron'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 0.3::numeric),
  ('sequoiadendron'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 67.5::numeric, 22.0::numeric, 6.0::numeric, 1.0::numeric),
  ('sequoiadendron'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 150.0::numeric, 40.0::numeric, 12.0::numeric, 2.0::numeric),
  ('sequoia sempervirens'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 0.3::numeric),
  ('sequoia sempervirens'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 54.0::numeric, 19.3::numeric, 5.0::numeric, 1.0::numeric),
  ('sequoia sempervirens'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 120.0::numeric, 35.0::numeric, 10.0::numeric, 2.0::numeric),
  ('sequoia'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 0.3::numeric),
  ('sequoia'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 54.0::numeric, 19.3::numeric, 5.0::numeric, 1.0::numeric),
  ('sequoia'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 120.0::numeric, 35.0::numeric, 10.0::numeric, 2.0::numeric),
  ('taxodium distichum'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 0.3::numeric),
  ('taxodium distichum'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 16.5::numeric, 4.5::numeric, 1.0::numeric),
  ('taxodium distichum'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 30.0::numeric, 9.0::numeric, 2.0::numeric),
  ('taxodium'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 0.3::numeric),
  ('taxodium'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 40.5::numeric, 16.5::numeric, 4.5::numeric, 1.0::numeric),
  ('taxodium'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 30.0::numeric, 9.0::numeric, 2.0::numeric),
  ('taxus baccata'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.0::numeric, 0.3::numeric),
  ('taxus baccata'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 1.0::numeric),
  ('taxus baccata'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 1.0::numeric),
  ('taxus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.0::numeric, 0.3::numeric),
  ('taxus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 1.0::numeric),
  ('taxus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 1.0::numeric),
  ('thuja occidentalis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 0.9::numeric, 0.3::numeric),
  ('thuja occidentalis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 2.0::numeric, 1.0::numeric),
  ('thuja occidentalis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 4.0::numeric, 1.0::numeric),
  ('thuja plicata'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.2::numeric, 0.3::numeric),
  ('thuja plicata'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 4.0::numeric, 1.0::numeric),
  ('thuja plicata'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 8.0::numeric, 2.0::numeric),
  ('thuja'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.0::numeric, 0.3::numeric),
  ('thuja'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 2.5::numeric, 1.0::numeric),
  ('thuja'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 5.0::numeric, 1.0::numeric),
  ('tsuga canadensis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('tsuga canadensis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 5.0::numeric, 1.0::numeric),
  ('tsuga canadensis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 10.0::numeric, 2.0::numeric),
  ('tsuga'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 0.3::numeric),
  ('tsuga'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 5.0::numeric, 1.0::numeric),
  ('tsuga'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 10.0::numeric, 2.0::numeric),
  ('araucaria araucana'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.5::numeric, 0.3::numeric),
  ('araucaria araucana'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 4.0::numeric, 1.0::numeric),
  ('araucaria araucana'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 8.0::numeric, 2.0::numeric),
  ('araucaria'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.5::numeric, 0.3::numeric),
  ('araucaria'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 4.0::numeric, 1.0::numeric),
  ('araucaria'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 8.0::numeric, 2.0::numeric),
  ('cryptomeria japonica'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.3::numeric, 0.3::numeric),
  ('cryptomeria japonica'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 4.0::numeric, 1.0::numeric),
  ('cryptomeria japonica'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 8.0::numeric, 2.0::numeric),
  ('cryptomeria'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.3::numeric, 0.3::numeric),
  ('cryptomeria'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 31.5::numeric, 13.8::numeric, 4.0::numeric, 1.0::numeric),
  ('cryptomeria'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 25.0::numeric, 8.0::numeric, 2.0::numeric),
  ('sciadopitys'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.0::numeric, 0.3::numeric),
  ('sciadopitys'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 2.5::numeric, 1.0::numeric),
  ('sciadopitys'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 5.0::numeric, 1.0::numeric),
  ('cunninghamia'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.3::numeric, 0.3::numeric),
  ('cunninghamia'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 4.0::numeric, 1.0::numeric),
  ('cunninghamia'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 8.0::numeric, 2.0::numeric),
  ('calocedrus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('calocedrus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 11.0::numeric, 2.5::numeric, 1.0::numeric),
  ('calocedrus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 20.0::numeric, 5.0::numeric, 2.0::numeric),
  ('podocarpus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.0::numeric, 0.3::numeric),
  ('podocarpus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 2.5::numeric, 1.0::numeric),
  ('podocarpus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 5.0::numeric, 1.0::numeric),
  ('trachycarpus fortunei'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 2.0::numeric, 1.5::numeric, 0.5::numeric),
  ('trachycarpus fortunei'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 4.4::numeric, 2.0::numeric, 2.2::numeric),
  ('trachycarpus fortunei'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 2.5::numeric, 5.0::numeric),
  ('trachycarpus'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 2.0::numeric, 1.5::numeric, 0.5::numeric),
  ('trachycarpus'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 4.4::numeric, 2.0::numeric, 2.2::numeric),
  ('trachycarpus'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 2.5::numeric, 5.0::numeric),
  ('chamaerops humilis'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 12.0::numeric, 1.2::numeric, 1.2::numeric, 0.5::numeric),
  ('chamaerops humilis'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 17.0::numeric, 1.7::numeric, 2.0::numeric, 0.9::numeric),
  ('chamaerops humilis'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 3.0::numeric, 2.5::numeric, 1.8::numeric),
  ('chamaerops'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 12.0::numeric, 1.2::numeric, 1.2::numeric, 0.5::numeric),
  ('chamaerops'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 17.0::numeric, 1.7::numeric, 2.0::numeric, 0.9::numeric),
  ('chamaerops'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 3.0::numeric, 2.5::numeric, 1.8::numeric),
  ('phoenix canariensis'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 42.0::numeric, 2.5::numeric, 3.0::numeric, 0.5::numeric),
  ('phoenix canariensis'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 59.5::numeric, 6.6::numeric, 6.4::numeric, 3.3::numeric),
  ('phoenix canariensis'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 70.0::numeric, 12.0::numeric, 8.0::numeric, 9.0::numeric),
  ('phoenix dactylifera'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 27.0::numeric, 2.5::numeric, 2.5::numeric, 0.5::numeric),
  ('phoenix dactylifera'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 8.3::numeric, 4.8::numeric, 4.2::numeric),
  ('phoenix dactylifera'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 6.0::numeric, 12.0::numeric),
  ('phoenix'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 36.0::numeric, 2.5::numeric, 3.0::numeric, 0.5::numeric),
  ('phoenix'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 51.0::numeric, 6.6::numeric, 5.6::numeric, 3.3::numeric),
  ('phoenix'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 12.0::numeric, 7.0::numeric, 9.0::numeric),
  ('washingtonia robusta'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 21.0::numeric, 3.0::numeric, 2.0::numeric, 0.5::numeric),
  ('washingtonia robusta'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 29.8::numeric, 9.9::numeric, 3.2::numeric, 5.0::numeric),
  ('washingtonia robusta'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 18.0::numeric, 4.0::numeric, 15.0::numeric),
  ('washingtonia filifera'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 36.0::numeric, 3.0::numeric, 2.5::numeric, 0.5::numeric),
  ('washingtonia filifera'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 51.0::numeric, 8.3::numeric, 4.0::numeric, 4.2::numeric),
  ('washingtonia filifera'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 15.0::numeric, 5.0::numeric, 12.0::numeric),
  ('washingtonia'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 27.0::numeric, 3.0::numeric, 2.0::numeric, 0.5::numeric),
  ('washingtonia'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 8.3::numeric, 3.2::numeric, 4.2::numeric),
  ('washingtonia'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 4.0::numeric, 12.0::numeric),
  ('butia capitata'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 24.0::numeric, 1.8::numeric, 2.0::numeric, 0.5::numeric),
  ('butia capitata'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 34.0::numeric, 2.8::numeric, 3.2::numeric, 1.4::numeric),
  ('butia capitata'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 5.0::numeric, 4.0::numeric, 3.0::numeric),
  ('butia'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 24.0::numeric, 1.8::numeric, 2.0::numeric, 0.5::numeric),
  ('butia'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 34.0::numeric, 2.8::numeric, 3.2::numeric, 1.4::numeric),
  ('butia'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 5.0::numeric, 4.0::numeric, 3.0::numeric),
  ('jubaea chilensis'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 54.0::numeric, 2.0::numeric, 2.5::numeric, 0.5::numeric),
  ('jubaea chilensis'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 76.5::numeric, 8.3::numeric, 4.8::numeric, 4.2::numeric),
  ('jubaea chilensis'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 15.0::numeric, 6.0::numeric, 12.0::numeric),
  ('jubaea'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 54.0::numeric, 2.0::numeric, 2.5::numeric, 0.5::numeric),
  ('jubaea'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 76.5::numeric, 8.3::numeric, 4.8::numeric, 4.2::numeric),
  ('jubaea'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 90.0::numeric, 15.0::numeric, 6.0::numeric, 12.0::numeric),
  ('brahea armata'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 24.0::numeric, 1.8::numeric, 2.0::numeric, 0.5::numeric),
  ('brahea armata'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 34.0::numeric, 4.4::numeric, 3.2::numeric, 2.2::numeric),
  ('brahea armata'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 8.0::numeric, 4.0::numeric, 5.0::numeric),
  ('brahea'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 24.0::numeric, 1.8::numeric, 2.0::numeric, 0.5::numeric),
  ('brahea'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 34.0::numeric, 4.4::numeric, 3.2::numeric, 2.2::numeric),
  ('brahea'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 8.0::numeric, 4.0::numeric, 5.0::numeric),
  ('dypsis'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.8::numeric, 1.5::numeric, 0.5::numeric),
  ('dypsis'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 3.3::numeric, 2.4::numeric, 1.7::numeric),
  ('dypsis'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 3.0::numeric, 3.6::numeric),
  ('sabal'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 24.0::numeric, 1.8::numeric, 2.0::numeric, 0.5::numeric),
  ('sabal'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 34.0::numeric, 4.4::numeric, 3.2::numeric, 2.2::numeric),
  ('sabal'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 8.0::numeric, 4.0::numeric, 5.0::numeric),
  ('rhapidophyllum'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.0::numeric, 1.2::numeric, 0.5::numeric),
  ('rhapidophyllum'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 1.5::numeric, 1.6::numeric, 0.8::numeric),
  ('rhapidophyllum'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 2.0::numeric, 2.0::numeric, 1.2::numeric),
  ('nannorrhops'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 12.0::numeric, 1.2::numeric, 1.5::numeric, 0.5::numeric),
  ('nannorrhops'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 17.0::numeric, 1.7::numeric, 2.4::numeric, 0.9::numeric),
  ('nannorrhops'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 3.0::numeric, 3.0::numeric, 1.8::numeric),
  ('cycas revoluta'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 0.8::numeric, 1.2::numeric, 0.5::numeric),
  ('cycas revoluta'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 1.3::numeric, 1.6::numeric, 0.7::numeric),
  ('cycas revoluta'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 2.0::numeric, 2.0::numeric, 1.2::numeric),
  ('cycas'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 0.8::numeric, 1.2::numeric, 0.5::numeric),
  ('cycas'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 1.3::numeric, 1.6::numeric, 0.7::numeric),
  ('cycas'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 2.0::numeric, 2.0::numeric, 1.2::numeric),
  ('yucca'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.0::numeric, 1.0::numeric, 0.5::numeric),
  ('yucca'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 1.7::numeric, 1.6::numeric, 0.9::numeric),
  ('yucca'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 3.0::numeric, 2.0::numeric, 1.8::numeric),
  ('cordyline'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.2::numeric, 1.0::numeric, 0.5::numeric),
  ('cordyline'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 2.2::numeric, 1.6::numeric, 1.1::numeric),
  ('cordyline'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 4.0::numeric, 2.0::numeric, 2.4::numeric),
  ('strelitzia nicolai'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.5::numeric, 1.2::numeric, 0.5::numeric),
  ('strelitzia nicolai'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 3.3::numeric, 2.4::numeric, 1.7::numeric),
  ('strelitzia nicolai'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 3.0::numeric, 3.6::numeric),
  ('strelitzia'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 9.0::numeric, 1.5::numeric, 1.2::numeric, 0.5::numeric),
  ('strelitzia'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 12.8::numeric, 3.3::numeric, 2.4::numeric, 1.7::numeric),
  ('strelitzia'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 3.0::numeric, 3.6::numeric),
  ('dicksonia antarctica'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 18.0::numeric, 1.0::numeric, 1.8::numeric, 0.5::numeric),
  ('dicksonia antarctica'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 25.5::numeric, 2.2::numeric, 2.4::numeric, 1.1::numeric),
  ('dicksonia antarctica'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 4.0::numeric, 3.0::numeric, 2.4::numeric),
  ('dicksonia'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 18.0::numeric, 1.0::numeric, 1.8::numeric, 0.5::numeric),
  ('dicksonia'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 25.5::numeric, 2.2::numeric, 2.4::numeric, 1.1::numeric),
  ('dicksonia'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 4.0::numeric, 3.0::numeric, 2.4::numeric),
  ('musa'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 12.0::numeric, 1.5::numeric, 1.5::numeric, 0.5::numeric),
  ('musa'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 17.0::numeric, 2.2::numeric, 2.4::numeric, 1.1::numeric),
  ('musa'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 4.0::numeric, 3.0::numeric, 2.4::numeric),
  ('ensete'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 1.5::numeric, 1.5::numeric, 0.5::numeric),
  ('ensete'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 2.2::numeric, 2.4::numeric, 1.1::numeric),
  ('ensete'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 4.0::numeric, 3.0::numeric, 2.4::numeric),
  ('osmanthus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('osmanthus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('osmanthus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('camellia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('camellia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('camellia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('rhododendron'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.0::numeric, 0.9::numeric, 0.8::numeric),
  ('rhododendron'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 2.0::numeric, 1.5::numeric),
  ('rhododendron'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 4.0::numeric, 2.0::numeric),
  ('pittosporum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('pittosporum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 1.5::numeric, 1.5::numeric),
  ('pittosporum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 3.0::numeric, 2.0::numeric),
  ('nerium oleander'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 3.2::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('nerium oleander'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 3.6::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('nerium oleander'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 8.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('nerium'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 3.2::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('nerium'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 3.6::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('nerium'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 8.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('myrtus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 3.2::numeric, 1.0::numeric, 0.8::numeric, 0.8::numeric),
  ('myrtus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 3.6::numeric, 1.7::numeric, 1.0::numeric, 1.5::numeric),
  ('myrtus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 8.0::numeric, 3.0::numeric, 2.0::numeric, 2.0::numeric),
  ('viburnum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 3.2::numeric, 1.2::numeric, 0.9::numeric, 0.8::numeric),
  ('viburnum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 3.6::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('viburnum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 8.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('buxus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.0::numeric, 0.8::numeric, 0.8::numeric),
  ('buxus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('buxus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('aucuba'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 2.0::numeric, 1.0::numeric, 0.8::numeric, 0.8::numeric),
  ('aucuba'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 2.3::numeric, 1.7::numeric, 1.5::numeric, 1.5::numeric),
  ('aucuba'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 5.0::numeric, 3.0::numeric, 3.0::numeric, 2.0::numeric),
  ('euonymus europaeus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('euonymus europaeus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('euonymus europaeus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('euonymus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.2::numeric, 1.0::numeric, 0.8::numeric),
  ('euonymus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('euonymus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('cotinus coggygria'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('cotinus coggygria'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('cotinus coggygria'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cotinus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 1.5::numeric, 1.2::numeric, 0.8::numeric),
  ('cotinus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 2.8::numeric, 2.5::numeric, 1.5::numeric),
  ('cotinus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 5.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cotoneaster'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('cotoneaster'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('cotoneaster'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('rhamnus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('rhamnus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('rhamnus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('frangula'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 3.2::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('frangula'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 3.6::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('frangula'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 8.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('caragana'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('caragana'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('caragana'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('xanthoceras sorbifolium'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('xanthoceras sorbifolium'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('xanthoceras sorbifolium'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('xanthoceras'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('xanthoceras'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('xanthoceras'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('chionanthus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('chionanthus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('chionanthus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('ptelea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('ptelea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('ptelea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('aralia elata'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('aralia elata'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('aralia elata'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('aralia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('aralia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('aralia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('asimina'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.1::numeric, 0.8::numeric),
  ('asimina'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 5.4::numeric, 3.3::numeric, 2.0::numeric, 1.5::numeric),
  ('asimina'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 6.0::numeric, 4.0::numeric, 2.0::numeric),
  ('poncirus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('poncirus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.2::numeric, 1.5::numeric, 1.5::numeric),
  ('poncirus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 4.0::numeric, 3.0::numeric, 2.0::numeric),
  ('ziziphus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('ziziphus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('ziziphus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('clerodendrum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.1::numeric, 0.8::numeric),
  ('clerodendrum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 2.0::numeric, 1.5::numeric),
  ('clerodendrum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 4.0::numeric, 2.0::numeric),
  ('styrax japonicus'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('styrax japonicus'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('styrax japonicus'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('styrax'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('styrax'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('styrax'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('stewartia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('stewartia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('stewartia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('oxydendrum'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 3.0::numeric, 1.3::numeric, 0.8::numeric),
  ('oxydendrum'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 3.0::numeric, 1.5::numeric),
  ('oxydendrum'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 6.0::numeric, 2.0::numeric),
  ('trochodendron'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.0::numeric, 1.2::numeric, 0.8::numeric),
  ('trochodendron'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('trochodendron'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('pistacia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('pistacia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('pistacia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('callistemon'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.0::numeric, 1.5::numeric, 1.0::numeric, 0.8::numeric),
  ('callistemon'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.5::numeric, 2.8::numeric, 1.5::numeric, 1.5::numeric),
  ('callistemon'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 10.0::numeric, 5.0::numeric, 3.0::numeric, 2.0::numeric),
  ('acacia dealbata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 2.0::numeric),
  ('acacia dealbata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('acacia dealbata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('acacia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 2.0::numeric),
  ('acacia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('acacia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('grevillea'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('grevillea'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('grevillea'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('melaleuca'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('melaleuca'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 4.4::numeric, 2.5::numeric, 1.5::numeric),
  ('melaleuca'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 8.0::numeric, 5.0::numeric, 2.0::numeric),
  ('schinus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 2.0::numeric),
  ('schinus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('schinus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('brachychiton'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 2.0::numeric),
  ('brachychiton'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('brachychiton'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('erythrina'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.6::numeric, 2.0::numeric),
  ('erythrina'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 5.5::numeric, 5.0::numeric, 2.5::numeric),
  ('erythrina'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 10.0::numeric, 10.0::numeric, 3.0::numeric),
  ('bauhinia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.4::numeric, 0.8::numeric),
  ('bauhinia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('bauhinia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('parkinsonia'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('parkinsonia'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 11.3::numeric, 4.4::numeric, 3.0::numeric, 1.5::numeric),
  ('parkinsonia'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 8.0::numeric, 6.0::numeric, 2.0::numeric),
  ('maackia amurensis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 2.0::numeric),
  ('maackia amurensis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('maackia amurensis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('maackia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.4::numeric, 2.0::numeric),
  ('maackia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('maackia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('cladrastis kentukea'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('cladrastis kentukea'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('cladrastis kentukea'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('cladrastis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('cladrastis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('cladrastis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('broussonetia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.0::numeric, 1.5::numeric, 2.0::numeric),
  ('broussonetia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 4.0::numeric, 2.5::numeric),
  ('broussonetia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 8.0::numeric, 3.0::numeric),
  ('kalopanax'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('kalopanax'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('kalopanax'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('toona sinensis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('toona sinensis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('toona sinensis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('toona'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.4::numeric, 2.0::numeric),
  ('toona'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('toona'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('firmiana'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('firmiana'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('firmiana'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('idesia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.5::numeric, 2.0::numeric),
  ('idesia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('idesia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('sassafras'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.3::numeric, 2.0::numeric),
  ('sassafras'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 4.0::numeric, 3.0::numeric),
  ('sassafras'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 8.0::numeric, 3.0::numeric),
  ('eucommia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('eucommia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 4.0::numeric, 2.5::numeric),
  ('eucommia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 8.0::numeric, 3.0::numeric),
  ('aria edulis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('aria edulis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.5::numeric, 2.5::numeric),
  ('aria edulis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 7.0::numeric, 3.0::numeric),
  ('aria'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('aria'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 5.5::numeric, 3.5::numeric, 2.5::numeric),
  ('aria'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 10.0::numeric, 7.0::numeric, 3.0::numeric),
  ('torminalis'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('torminalis'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('torminalis'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('cormus domestica'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('cormus domestica'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('cormus domestica'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('cormus'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.4::numeric, 2.0::numeric),
  ('cormus'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 8.3::numeric, 5.0::numeric, 3.0::numeric),
  ('cormus'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 15.0::numeric, 10.0::numeric, 3.0::numeric),
  ('euodia'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 3.5::numeric, 1.6::numeric, 2.0::numeric),
  ('euodia'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 6.6::numeric, 5.0::numeric, 2.5::numeric),
  ('euodia'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 12.0::numeric, 10.0::numeric, 3.0::numeric),
  ('halesia carolina'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.3::numeric, 0.8::numeric),
  ('halesia carolina'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.9::numeric, 3.0::numeric, 1.5::numeric),
  ('halesia carolina'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 7.0::numeric, 6.0::numeric, 2.0::numeric),
  ('laburnum x watereri'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('laburnum x watereri'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('laburnum x watereri'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('laburnum anagyroides'::text, 'small'::text, 'small'::text, 'Jungpflanze StU 12–14'::text, 4.5::numeric, 2.5::numeric, 1.2::numeric, 0.8::numeric),
  ('laburnum anagyroides'::text, 'small'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 9.0::numeric, 3.3::numeric, 2.5::numeric, 1.5::numeric),
  ('laburnum anagyroides'::text, 'small'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 6.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cupressocyparis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('cupressocyparis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 2.5::numeric, 1.0::numeric),
  ('cupressocyparis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cuprocyparis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('cuprocyparis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 2.5::numeric, 1.0::numeric),
  ('cuprocyparis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cupressocyparis leylandii'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('cupressocyparis leylandii'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 2.5::numeric, 1.0::numeric),
  ('cupressocyparis leylandii'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 5.0::numeric, 2.0::numeric),
  ('cuprocyparis leylandii'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 3.0::numeric, 1.0::numeric, 0.3::numeric),
  ('cuprocyparis leylandii'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 22.5::numeric, 11.0::numeric, 2.5::numeric, 1.0::numeric),
  ('cuprocyparis leylandii'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 50.0::numeric, 20.0::numeric, 5.0::numeric, 2.0::numeric),
  ('thujopsis'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.0::numeric, 0.3::numeric),
  ('thujopsis'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 15.8::numeric, 6.6::numeric, 2.5::numeric, 1.0::numeric),
  ('thujopsis'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 5.0::numeric, 1.0::numeric),
  ('platycladus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 0.9::numeric, 0.3::numeric),
  ('platycladus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 2.0::numeric, 1.0::numeric),
  ('platycladus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 4.0::numeric, 1.0::numeric),
  ('cephalotaxus'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 1.5::numeric, 1.0::numeric, 0.3::numeric),
  ('cephalotaxus'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 6.8::numeric, 3.3::numeric, 2.0::numeric, 1.0::numeric),
  ('cephalotaxus'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 15.0::numeric, 6.0::numeric, 4.0::numeric, 1.0::numeric),
  ('torreya'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.0::numeric, 1.1::numeric, 0.3::numeric),
  ('torreya'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 13.5::numeric, 5.5::numeric, 3.0::numeric, 1.0::numeric),
  ('torreya'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 6.0::numeric, 1.0::numeric),
  ('wollemia'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.0::numeric, 0.3::numeric),
  ('wollemia'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 8.3::numeric, 2.0::numeric, 1.0::numeric),
  ('wollemia'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 15.0::numeric, 4.0::numeric, 1.0::numeric),
  ('ginkgo biloba fastigiata'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.5::numeric, 0.9::numeric, 2.0::numeric),
  ('ginkgo biloba fastigiata'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 20.3::numeric, 8.3::numeric, 2.0::numeric, 3.0::numeric),
  ('ginkgo biloba fastigiata'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 15.0::numeric, 4.0::numeric, 3.0::numeric),
  ('livistona'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 18.0::numeric, 2.0::numeric, 2.0::numeric, 0.5::numeric),
  ('livistona'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 25.5::numeric, 5.5::numeric, 3.2::numeric, 2.8::numeric),
  ('livistona'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 30.0::numeric, 10.0::numeric, 4.0::numeric, 7.0::numeric),
  ('rhapis'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 3.0::numeric, 1.2::numeric, 1.0::numeric, 0.5::numeric),
  ('rhapis'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 4.3::numeric, 1.7::numeric, 1.6::numeric, 0.9::numeric),
  ('rhapis'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 5.0::numeric, 3.0::numeric, 2.0::numeric, 1.8::numeric),
  ('syagrus'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 21.0::numeric, 2.5::numeric, 2.5::numeric, 0.5::numeric),
  ('syagrus'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 29.8::numeric, 6.6::numeric, 4.0::numeric, 3.3::numeric),
  ('syagrus'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 5.0::numeric, 9.0::numeric),
  ('arecastrum'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 21.0::numeric, 2.5::numeric, 2.5::numeric, 0.5::numeric),
  ('arecastrum'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 29.8::numeric, 6.6::numeric, 4.0::numeric, 3.3::numeric),
  ('arecastrum'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 35.0::numeric, 12.0::numeric, 5.0::numeric, 9.0::numeric),
  ('howea'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 7.2::numeric, 1.5::numeric, 1.5::numeric, 0.5::numeric),
  ('howea'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 10.2::numeric, 3.3::numeric, 2.4::numeric, 1.7::numeric),
  ('howea'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 12.0::numeric, 6.0::numeric, 3.0::numeric, 3.6::numeric),
  ('archontophoenix'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 12.0::numeric, 2.5::numeric, 2.0::numeric, 0.5::numeric),
  ('archontophoenix'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 17.0::numeric, 6.6::numeric, 3.2::numeric, 3.3::numeric),
  ('archontophoenix'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 20.0::numeric, 12.0::numeric, 4.0::numeric, 9.0::numeric),
  ('bismarckia'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 27.0::numeric, 2.0::numeric, 2.5::numeric, 0.5::numeric),
  ('bismarckia'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 38.3::numeric, 5.5::numeric, 4.8::numeric, 2.8::numeric),
  ('bismarckia'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 45.0::numeric, 10.0::numeric, 6.0::numeric, 7.0::numeric),
  ('tree_deciduous'::text, 'tree'::text, 'small'::text, 'Jungbaum StU 18–20'::text, 6.0::numeric, 4.0::numeric, 1.6::numeric, 2.0::numeric),
  ('tree_deciduous'::text, 'tree'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 27.0::numeric, 9.9::numeric, 6.0::numeric, 3.0::numeric),
  ('tree_deciduous'::text, 'tree'::text, 'large'::text, 'Ausgewachsen'::text, 60.0::numeric, 18.0::numeric, 12.0::numeric, 3.0::numeric),
  ('tree_evergreen'::text, 'conifer'::text, 'small'::text, 'Jungbaum 250–300 cm'::text, 6.0::numeric, 2.5::numeric, 1.2::numeric, 0.3::numeric),
  ('tree_evergreen'::text, 'conifer'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 18.0::numeric, 6.6::numeric, 3.0::numeric, 1.0::numeric),
  ('tree_evergreen'::text, 'conifer'::text, 'large'::text, 'Ausgewachsen'::text, 40.0::numeric, 12.0::numeric, 6.0::numeric, 1.0::numeric),
  ('palm'::text, 'palm'::text, 'small'::text, 'Jungpalme (Pflanzung)'::text, 15.0::numeric, 1.5::numeric, 1.5::numeric, 0.5::numeric),
  ('palm'::text, 'palm'::text, 'medium'::text, 'Etabliert (~25 Jahre)'::text, 21.3::numeric, 3.3::numeric, 2.4::numeric, 1.7::numeric),
  ('palm'::text, 'palm'::text, 'large'::text, 'Ausgewachsen'::text, 25.0::numeric, 6.0::numeric, 3.0::numeric, 3.6::numeric)
), matched AS (
  SELECT c.size_class, c.label, c.dbh_cm, c.height_m, c.crown_width_m, c.crown_base_m, p.id AS plant_id
  FROM csv_data c
  JOIN plants_flat p ON lower(p.botanical_name) = lower(c.taxon)
)
INSERT INTO tree_size_classes (plant_id, size_class, label, dbh, height, crown_width, crown_base, updated_at)
SELECT plant_id, size_class, label, dbh_cm, height_m, crown_width_m, crown_base_m, now()
FROM matched
ON CONFLICT (plant_id, size_class) DO UPDATE SET
  label = EXCLUDED.label,
  dbh = EXCLUDED.dbh,
  height = EXCLUDED.height,
  crown_width = EXCLUDED.crown_width,
  crown_base = EXCLUDED.crown_base,
  updated_at = now();

SELECT count(*) AS total_rows, count(DISTINCT plant_id) AS species_count FROM tree_size_classes;
